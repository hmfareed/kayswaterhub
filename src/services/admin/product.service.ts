import { connectDB } from "@/lib/db/mongoose";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";
import Category from "@/models/Category";
import Brand from "@/models/Brand";
import { logAdminAction } from "./audit.service";
import { WATER_BRANDS, STORE_PRODUCTS } from "@/lib/constants";
import mongoose from "mongoose";

export interface GetProductsParams {
  search?: string;
  category?: string;
  brand?: string;
  status?: "all" | "active" | "inactive";
  stockStatus?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  page?: number;
  limit?: number;
}

/**
 * Ensures that all default brands, categories, and store products exist in MongoDB.
 * If the database has no products, this will automatically seed them.
 */
export async function ensureStoreProductsSynced(forceReset: boolean = false) {
  await connectDB();

  // 1. Categories
  const categoryData = [
    {
      name: "Bottled Water",
      slug: "bottled-water",
      description: "Convenient shrink-wrapped packs of bottled mineral water (350ml, 500ml, 750ml, 1.5L)",
      displayOrder: 1,
    },
    {
      name: "Dispensers & Jars",
      slug: "dispensers",
      description: "15L and 19L heavy-duty refill jars and water cooler accessories",
      displayOrder: 2,
    },
    {
      name: "Sachet Water",
      slug: "sachet-water",
      description: "Filtered mineral water in 500ml standard sachets (bags of 30)",
      displayOrder: 3,
    },
    {
      name: "Flavored & Alkaline",
      slug: "flavored-alkaline",
      description: "Active hydration water with balanced pH and essential electrolytes",
      displayOrder: 4,
    },
  ];

  const categoriesMap: Record<string, any> = {};
  for (const cat of categoryData) {
    let doc = await Category.findOne({ slug: cat.slug });
    if (!doc) {
      doc = await Category.create(cat);
    }
    categoriesMap[cat.slug] = doc;
  }

  // 2. Brands
  const brandsMap: Record<string, any> = {};
  for (const b of WATER_BRANDS) {
    let doc = await Brand.findOne({ slug: b.slug });
    if (!doc) {
      doc = await Brand.create({
        name: b.name,
        slug: b.slug,
        description: b.description,
        tagline: b.tagline,
        logo: `/images/brands/${b.slug}.png`,
        isActive: true,
      });
    }
    brandsMap[b.slug] = doc;
  }

  // 3. Products & Primary Variants
  let seededCount = 0;
  for (const p of STORE_PRODUCTS) {
    let productDoc = await Product.findOne({ slug: p.slug });

    const brandDoc = brandsMap[p.brandSlug] || (await Brand.findOne({ slug: p.brandSlug })) || (await Brand.findOne());
    const catSlug = p.category === "Dispensers" ? "dispensers" : "bottled-water";
    const catDoc = categoriesMap[catSlug] || (await Category.findOne({ slug: catSlug })) || (await Category.findOne());

    if (!productDoc || forceReset) {
      if (!productDoc) {
        productDoc = await Product.create({
          name: p.name,
          slug: p.slug,
          brandId: brandDoc?._id,
          categoryId: catDoc?._id,
          description: p.description,
          images: p.images,
          isFeatured: p.isPopular || p.isBestSeller || false,
          isActive: true,
        });
      } else {
        productDoc.name = p.name;
        productDoc.brandId = brandDoc?._id;
        productDoc.categoryId = catDoc?._id;
        productDoc.description = p.description;
        productDoc.images = p.images;
        productDoc.isFeatured = p.isPopular || p.isBestSeller || false;
        await productDoc.save();
      }

      // Check or create primary variant
      let variantDoc = await ProductVariant.findOne({ productId: productDoc._id });
      if (!variantDoc) {
        await ProductVariant.create({
          productId: productDoc._id,
          name: p.packSize || `${p.bottleSize} × ${p.bottlesPerPack}`,
          sku: `${p.brandSlug.toUpperCase()}-${p.bottleSize.replace(/\s+/g, "")}-${p.bottlesPerPack}`,
          bottleSize: p.bottleSize,
          unitsPerPack: p.bottlesPerPack,
          price: p.price,
          stockQuantity: p.stock,
          reservedQuantity: 0,
          lowStockThreshold: 15,
          isAvailable: true,
        });
      } else if (forceReset) {
        variantDoc.name = p.packSize;
        variantDoc.price = p.price;
        variantDoc.stockQuantity = p.stock;
        variantDoc.bottleSize = p.bottleSize;
        variantDoc.unitsPerPack = p.bottlesPerPack;
        await variantDoc.save();
      }

      seededCount++;
    }
  }

  return { success: true, seededCount };
}

export async function getAdminProducts(params: GetProductsParams) {
  await connectDB();

  // Auto-sync products if none exist in the database
  const existingCount = await Product.countDocuments();
  if (existingCount === 0) {
    await ensureStoreProductsSynced(false);
  }

  const { search, category, brand, status = "all", stockStatus = "all", page = 1, limit = 20 } = params;
  const query: Record<string, unknown> = {};

  if (status === "active") query.isActive = true;
  if (status === "inactive") query.isActive = false;

  if (category && category !== "all") {
    if (mongoose.Types.ObjectId.isValid(category)) {
      query.categoryId = new mongoose.Types.ObjectId(category);
    } else {
      const catDoc = await Category.findOne({ slug: category });
      if (catDoc) query.categoryId = catDoc._id;
    }
  }

  if (brand && brand !== "all") {
    if (mongoose.Types.ObjectId.isValid(brand)) {
      query.brandId = new mongoose.Types.ObjectId(brand);
    } else {
      const brandDoc = await Brand.findOne({ slug: brand });
      if (brandDoc) query.brandId = brandDoc._id;
    }
  }

  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { slug: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  // Fetch all matched products to calculate variant totals and stats
  const allMatchedProducts = await Product.find(query)
    .populate("categoryId", "name slug")
    .populate("brandId", "name slug logo")
    .sort({ createdAt: -1 });

  const productIds = allMatchedProducts.map((p) => p._id);
  const variants = await ProductVariant.find({ productId: { $in: productIds } });

  // Map products with their variant data
  let productsWithVariants = allMatchedProducts.map((p) => {
    const pVariants = variants.filter((v) => v.productId.toString() === p._id.toString());
    const totalStock = pVariants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
    const minPrice = pVariants.length > 0 ? Math.min(...pVariants.map((v) => v.price)) : 0;
    const maxPrice = pVariants.length > 0 ? Math.max(...pVariants.map((v) => v.price)) : 0;
    const lowestThreshold = pVariants.length > 0 ? Math.min(...pVariants.map((v) => v.lowStockThreshold || 15)) : 15;

    let computedStockStatus: "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK" = "IN_STOCK";
    if (totalStock <= 0) {
      computedStockStatus = "OUT_OF_STOCK";
    } else if (totalStock <= lowestThreshold) {
      computedStockStatus = "LOW_STOCK";
    }

    return {
      _id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      images: p.images || [],
      category: p.categoryId,
      brand: p.brandId,
      isFeatured: p.isFeatured || false,
      isActive: p.isActive !== false,
      variants: pVariants.map((v) => ({
        _id: v._id.toString(),
        name: v.name,
        bottleSize: v.bottleSize,
        unitsPerPack: v.unitsPerPack,
        price: v.price,
        stockQuantity: v.stockQuantity,
        reservedQuantity: v.reservedQuantity || 0,
        lowStockThreshold: v.lowStockThreshold || 15,
        sku: v.sku || "",
        isAvailable: v.isAvailable !== false,
      })),
      totalStock,
      stockStatus: computedStockStatus,
      minPrice,
      maxPrice,
      createdAt: p.createdAt,
    };
  });

  // Calculate Overall Catalog Stats across whole store
  const allDbProducts = await Product.find();
  const allDbVariants = await ProductVariant.find();
  const totalProducts = allDbProducts.length;
  const activeProducts = allDbProducts.filter((p) => p.isActive).length;

  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const prod of allDbProducts) {
    const pVars = allDbVariants.filter((v) => v.productId.toString() === prod._id.toString());
    const stock = pVars.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
    const threshold = pVars.length > 0 ? Math.min(...pVars.map((v) => v.lowStockThreshold || 15)) : 15;
    if (stock <= 0) {
      outOfStockCount++;
    } else if (stock <= threshold) {
      lowStockCount++;
    }
  }

  // Apply stockStatus filter if specified
  if (stockStatus && stockStatus !== "all") {
    if (stockStatus === "in_stock") {
      productsWithVariants = productsWithVariants.filter((p) => p.stockStatus === "IN_STOCK");
    } else if (stockStatus === "low_stock") {
      productsWithVariants = productsWithVariants.filter((p) => p.stockStatus === "LOW_STOCK");
    } else if (stockStatus === "out_of_stock") {
      productsWithVariants = productsWithVariants.filter((p) => p.stockStatus === "OUT_OF_STOCK");
    }
  }

  const total = productsWithVariants.length;
  const skip = (page - 1) * limit;
  const paginatedProducts = productsWithVariants.slice(skip, skip + limit);

  return {
    products: paginatedProducts,
    stats: {
      totalProducts,
      activeProducts,
      lowStockCount,
      outOfStockCount,
    },
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getAdminProductById(id: string) {
  await connectDB();
  const product = await Product.findById(id)
    .populate("categoryId")
    .populate("brandId");

  if (!product) return null;

  const variants = await ProductVariant.find({ productId: product._id });
  return { ...product.toObject(), variants };
}

export async function createAdminProduct(data: {
  name: string;
  slug?: string;
  brandId: string;
  categoryId: string;
  description?: string;
  images?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
  variants: {
    name: string;
    bottleSize: string;
    unitsPerPack: number;
    price: number;
    stockQuantity: number;
    lowStockThreshold?: number;
    sku?: string;
  }[];
  adminId?: string;
}) {
  await connectDB();

  const slug =
    data.slug?.trim() ||
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const product = await Product.create({
    name: data.name,
    slug,
    brandId: new mongoose.Types.ObjectId(data.brandId),
    categoryId: new mongoose.Types.ObjectId(data.categoryId),
    description: data.description || "",
    images: data.images && data.images.length > 0 ? data.images : ["/images/products/newvoltic15x500ml.jpg"],
    isFeatured: data.isFeatured || false,
    isActive: data.isActive !== undefined ? data.isActive : true,
  });

  if (data.variants && data.variants.length > 0) {
    const variantDocs = data.variants.map((v) => ({
      productId: product._id,
      name: v.name || `${v.bottleSize} × ${v.unitsPerPack}`,
      bottleSize: v.bottleSize || "500 ml",
      unitsPerPack: v.unitsPerPack || 15,
      price: v.price || 0,
      stockQuantity: v.stockQuantity || 0,
      reservedQuantity: 0,
      lowStockThreshold: v.lowStockThreshold || 15,
      sku: v.sku || `${slug}-${(v.bottleSize || "500").replace(/\s+/g, "")}-${v.unitsPerPack || 15}`,
      isAvailable: true,
    }));
    await ProductVariant.insertMany(variantDocs);
  } else {
    // Default single variant
    await ProductVariant.create({
      productId: product._id,
      name: "Standard Pack",
      bottleSize: "500 ml",
      unitsPerPack: 15,
      price: 45.0,
      stockQuantity: 50,
      reservedQuantity: 0,
      lowStockThreshold: 15,
      sku: `${slug}-500ML-15`,
      isAvailable: true,
    });
  }

  await logAdminAction({
    performedBy: data.adminId,
    action: "PRODUCT_CREATED",
    resource: "Product",
    resourceId: product._id.toString(),
    description: `Created new water product: "${product.name}"`,
  });

  return product;
}

export async function updateAdminProduct(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    brandId: string;
    categoryId: string;
    description: string;
    images: string[];
    isFeatured: boolean;
    isActive: boolean;
    variants: any[];
  }>,
  adminId?: string
) {
  await connectDB();

  const product = await Product.findById(id);
  if (!product) throw new Error("Product not found");

  if (data.name) product.name = data.name;
  if (data.slug) product.slug = data.slug;
  if (data.brandId && mongoose.Types.ObjectId.isValid(data.brandId)) {
    product.brandId = new mongoose.Types.ObjectId(data.brandId);
  }
  if (data.categoryId && mongoose.Types.ObjectId.isValid(data.categoryId)) {
    product.categoryId = new mongoose.Types.ObjectId(data.categoryId);
  }
  if (data.description !== undefined) product.description = data.description;
  if (data.images) product.images = data.images;
  if (data.isFeatured !== undefined) product.isFeatured = data.isFeatured;
  if (data.isActive !== undefined) product.isActive = data.isActive;

  await product.save();

  // If variants provided, sync or create them
  if (data.variants && Array.isArray(data.variants)) {
    const existingVariants = await ProductVariant.find({ productId: product._id });
    const incomingVariantIds = data.variants
      .map((v) => v._id)
      .filter((vid) => vid && mongoose.Types.ObjectId.isValid(vid));

    // Remove deleted variants
    const toDelete = existingVariants.filter(
      (ev) => !incomingVariantIds.some((ivId) => ivId.toString() === ev._id.toString())
    );
    if (toDelete.length > 0) {
      await ProductVariant.deleteMany({ _id: { $in: toDelete.map((d) => d._id) } });
    }

    // Update or insert variants
    for (const v of data.variants) {
      if (v._id && mongoose.Types.ObjectId.isValid(v._id)) {
        await ProductVariant.findByIdAndUpdate(v._id, {
          name: v.name,
          bottleSize: v.bottleSize,
          unitsPerPack: v.unitsPerPack,
          price: v.price,
          stockQuantity: v.stockQuantity,
          lowStockThreshold: v.lowStockThreshold || 15,
          sku: v.sku,
          isAvailable: v.isAvailable !== undefined ? v.isAvailable : true,
        });
      } else {
        await ProductVariant.create({
          productId: product._id,
          name: v.name,
          bottleSize: v.bottleSize,
          unitsPerPack: v.unitsPerPack,
          price: v.price,
          stockQuantity: v.stockQuantity || 0,
          reservedQuantity: 0,
          lowStockThreshold: v.lowStockThreshold || 15,
          sku: v.sku || `${product.slug}-${(v.bottleSize || "").replace(/\s+/g, "")}-${v.unitsPerPack}`,
          isAvailable: v.isAvailable !== undefined ? v.isAvailable : true,
        });
      }
    }
  }

  await logAdminAction({
    performedBy: adminId,
    action: "PRODUCT_UPDATED",
    resource: "Product",
    resourceId: product._id.toString(),
    description: `Updated product "${product.name}"`,
  });

  return product;
}

export async function deleteAdminProduct(id: string, adminId?: string) {
  await connectDB();
  const product = await Product.findById(id);
  if (!product) throw new Error("Product not found");

  await ProductVariant.deleteMany({ productId: product._id });
  await Product.findByIdAndDelete(id);

  await logAdminAction({
    performedBy: adminId,
    action: "PRODUCT_DELETED",
    resource: "Product",
    resourceId: id,
    description: `Deleted product "${product.name}" and its variants`,
  });

  return true;
}

export async function toggleProductActiveStatus(id: string, isActive: boolean, adminId?: string) {
  await connectDB();
  const product = await Product.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!product) throw new Error("Product not found");

  await logAdminAction({
    performedBy: adminId,
    action: "PRODUCT_UPDATED",
    resource: "Product",
    resourceId: id,
    description: `Set product "${product.name}" status to ${isActive ? "ACTIVE" : "INACTIVE"}`,
  });

  return product;
}

export async function toggleProductFeatured(id: string, isFeatured: boolean, adminId?: string) {
  await connectDB();
  const product = await Product.findByIdAndUpdate(id, { isFeatured }, { new: true });
  if (!product) throw new Error("Product not found");

  await logAdminAction({
    performedBy: adminId,
    action: "PRODUCT_UPDATED",
    resource: "Product",
    resourceId: id,
    description: `${isFeatured ? "Featured" : "Unfeatured"} product "${product.name}" on homepage`,
  });

  return product;
}
