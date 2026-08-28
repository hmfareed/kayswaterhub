import { connectDB } from "@/lib/db/mongoose";
import Brand from "@/models/Brand";
import Category from "@/models/Category";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";
import DeliveryZone from "@/models/DeliveryZone";
import Order from "@/models/Order";
import Payment from "@/models/Payment";
import Promotion from "@/models/Promotion";
import Review from "@/models/Review";
import Settings from "@/models/Settings";
import AuditLog from "@/models/AuditLog";
import InventoryTransaction from "@/models/InventoryTransaction";
import User from "@/models/User";
import { WATER_BRANDS, STORE_PRODUCTS } from "@/lib/constants";

export async function seedAdminDatabase() {
  await connectDB();

  // 1. Settings
  const existingSettings = await Settings.findOne();
  if (!existingSettings) {
    await Settings.create({
      businessName: "Khady's Water Hub & Warehouse",
      logo: "/images/logo.png",
      phone: "+233 20 987 8744",
      email: "orders@khadyswater.com",
      whatsapp: "https://wa.me/233209878744",
      address: "Boundary Road, East Legon, Accra",
      storeLocation: {
        businessName: "Khady's Water Hub & Warehouse",
        address: "East Legon, Boundary Road, Accra",
        region: "Greater Accra",
        city: "Accra",
        coordinates: { lat: 5.6356, lng: -0.1601 },
        defaultDeliveryFee: 20,
        pricePerKm: 2.5,
        freeDeliveryThreshold: 350,
        maxDeliveryRadiusKm: 60,
      },
      paystack: {
        publicKey: "pk_test_sample_khadys_water_pk",
        secretKey: "sk_test_sample_khadys_water_sk",
        testMode: true,
        channels: ["card", "mobile_money", "bank"],
      },
      inventory: {
        defaultLowStockThreshold: 10,
        allowBackorders: false,
        reservationTtlMinutes: 30,
      },
      deliveryProvider: {
        defaultProvider: "INTERNAL",
        yangoApiKey: "",
        yangoEnabled: false,
        maxDistanceKm: 60,
      },
      orderingEnabled: true,
      minimumOrderAmount: 30,
    });
  }

  // 2. Categories
  const categoryData = [
    { name: "Bottled Water", slug: "bottled-water", description: "Convenient shrink-wrapped packs of bottled mineral water (350ml, 500ml, 750ml, 1.5L)", displayOrder: 1 },
    { name: "Dispensers & Jars", slug: "dispensers", description: "15L and 19L heavy-duty refill jars and water cooler accessories", displayOrder: 2 },
    { name: "Sachet Water", slug: "sachet-water", description: "Filtered mineral water in 500ml standard sachets (bags of 30)", displayOrder: 3 },
    { name: "Flavored & Alkaline", slug: "flavored-alkaline", description: "Active hydration water with balanced pH and essential electrolytes", displayOrder: 4 },
  ];

  const categories: any = {};
  for (const cat of categoryData) {
    let doc = await Category.findOne({ slug: cat.slug });
    if (!doc) {
      doc = await Category.create(cat);
    }
    categories[cat.slug] = doc;
  }

  // 3. Brands
  const brands: any = {};
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
    brands[b.slug] = doc;
  }

  // 4. Products & Variants
  const productsCount = await Product.countDocuments();
  if (productsCount === 0) {
    for (const p of STORE_PRODUCTS) {
      const brandDoc = brands[p.brandSlug] || (await Brand.findOne());
      const catSlug = p.category === "Dispensers" ? "dispensers" : "bottled-water";
      const catDoc = categories[catSlug] || (await Category.findOne());

      const product = await Product.create({
        name: p.name,
        slug: p.slug,
        brandId: brandDoc?._id,
        categoryId: catDoc?._id,
        description: p.description,
        images: p.images,
        isFeatured: p.isPopular || false,
        isActive: true,
      });

      // Create Primary Variant
      await ProductVariant.create({
        productId: product._id,
        name: `${p.bottleSize} × ${p.bottlesPerPack}`,
        sku: `${p.brandSlug.toUpperCase()}-${p.bottleSize.replace(/\s+/g, "")}-${p.bottlesPerPack}`,
        bottleSize: p.bottleSize,
        unitsPerPack: p.bottlesPerPack,
        price: p.price,
        stockQuantity: p.stock,
        reservedQuantity: 0,
        lowStockThreshold: 15,
        isAvailable: true,
      });
    }
  }

  // 5. Delivery Zones
  const zonesCount = await DeliveryZone.countDocuments();
  if (zonesCount === 0) {
    const zonesData = [
      {
        name: "East Legon & Shiashie (Zone 1 - Local Hub)",
        region: "Greater Accra",
        areas: ["East Legon", "Shiashie", "Bawaleshie", "American House", "Boundary Road"],
        pricingType: "FLAT",
        deliveryFee: 15,
        pricePerKm: 0,
        radiusKm: 6,
        priority: 100,
        centerCoordinates: { lat: 5.6356, lng: -0.1601 },
        estimatedDeliveryTime: "45–90 mins",
        freeDeliveryThreshold: 300,
        isActive: true,
      },
      {
        name: "Accra Central & Prime (Zone 2)",
        region: "Greater Accra",
        areas: ["Airport Residential", "Cantonments", "Osu", "Labone", "Ridge", "Dzorwulu", "Roman Ridge"],
        pricingType: "FLAT",
        deliveryFee: 25,
        pricePerKm: 0,
        radiusKm: 12,
        priority: 80,
        centerCoordinates: { lat: 5.5800, lng: -0.1800 },
        estimatedDeliveryTime: "1–2 hours",
        freeDeliveryThreshold: 400,
        isActive: true,
      },
      {
        name: "Spintex, Tema & Beach Road (Zone 3)",
        region: "Greater Accra",
        areas: ["Spintex Road", "Batsonaa", "Sakumono", "Tema Community 1-25", "Lashibi"],
        pricingType: "DISTANCE_BASED",
        deliveryFee: 30,
        pricePerKm: 2.5,
        includedDistanceKm: 10,
        radiusKm: 25,
        priority: 60,
        centerCoordinates: { lat: 5.6600, lng: -0.0500 },
        estimatedDeliveryTime: "2–3 hours",
        freeDeliveryThreshold: 500,
        isActive: true,
      },
      {
        name: "Madina, Adenta & Aburi Ridge (Zone 4)",
        region: "Greater Accra",
        areas: ["Madina", "Adenta", "Frafraha", "Oyibi", "Danfa", "Pantang"],
        pricingType: "FLAT",
        deliveryFee: 25,
        radiusKm: 18,
        priority: 70,
        centerCoordinates: { lat: 5.6850, lng: -0.1650 },
        estimatedDeliveryTime: "1–3 hours",
        freeDeliveryThreshold: 450,
        isActive: true,
      },
      {
        name: "West Accra & Kasoa Corridor (Zone 5)",
        region: "Greater Accra",
        areas: ["Dansoman", "Achimota", "Lapaz", "Kwashieman", "McCarthy Hill", "Weija", "Kasoa"],
        pricingType: "DISTANCE_BASED",
        deliveryFee: 35,
        pricePerKm: 3.0,
        includedDistanceKm: 12,
        radiusKm: 35,
        priority: 50,
        centerCoordinates: { lat: 5.5500, lng: -0.3000 },
        estimatedDeliveryTime: "2–4 hours",
        freeDeliveryThreshold: 600,
        isActive: true,
      },
    ];

    for (const z of zonesData) {
      await DeliveryZone.create(z);
    }
  }

  // 6. Promotions / Coupons
  const promoCount = await Promotion.countDocuments();
  if (promoCount === 0) {
    await Promotion.create({
      code: "WELCOME10",
      description: "10% off on your first water packs order",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minimumOrderAmount: 100,
      maximumDiscountAmount: 40,
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      usageLimit: 500,
      usageCount: 28,
      isActive: true,
    });

    await Promotion.create({
      code: "HYDRO50",
      description: "Flat GH₵50 discount on bulk water orders over GH₵500",
      discountType: "FIXED_AMOUNT",
      discountValue: 50,
      minimumOrderAmount: 500,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      usageLimit: 200,
      usageCount: 14,
      isActive: true,
    });
  }

  // 7. Seed Sample Orders across all lifecycle states
  const ordersCount = await Order.countDocuments();
  if (ordersCount === 0) {
    const products = await Product.find().limit(5);
    const variants = await ProductVariant.find().limit(5);

    if (products.length > 0 && variants.length > 0) {
      const sampleOrders = [
        {
          orderNumber: "ORD-2026-1048",
          customerName: "Ama Serwaa Mensah",
          phone: "024 456 7890",
          email: "ama.mensah@gmail.com",
          status: "OUT_FOR_DELIVERY",
          subtotal: 215.0,
          discount: 0,
          deliveryFee: 20.0,
          total: 235.0,
          address: {
            fullName: "Ama Serwaa Mensah",
            phone: "024 456 7890",
            region: "Greater Accra",
            city: "Accra",
            area: "East Legon, near ANC Mall",
            digitalAddress: "GA-142-8921",
            coordinates: { lat: 5.6385, lng: -0.1582 },
            distanceKm: 2.4,
            zoneName: "East Legon & Shiashie",
          },
          items: [
            {
              productId: products[0]._id,
              variantId: variants[0]._id,
              productName: products[0].name,
              brandName: "Voltic",
              variantName: variants[0].name,
              bottleSize: "500 ml",
              unitsPerPack: 15,
              quantity: 3,
              unitPrice: 45.0,
              totalPrice: 135.0,
            },
            {
              productId: products[1]?._id || products[0]._id,
              variantId: variants[1]?._id || variants[0]._id,
              productName: products[1]?.name || products[0].name,
              brandName: "Bel-Aqua",
              variantName: "750ml x 15",
              bottleSize: "750 ml",
              unitsPerPack: 15,
              quantity: 2,
              unitPrice: 40.0,
              totalPrice: 80.0,
            },
          ],
        },
        {
          orderNumber: "ORD-2026-1047",
          customerName: "Kofi Boateng",
          phone: "020 888 1234",
          email: "kofi.boateng@outlook.com",
          status: "PROCESSING",
          subtotal: 360.0,
          discount: 36.0,
          couponCode: "WELCOME10",
          deliveryFee: 25.0,
          total: 349.0,
          address: {
            fullName: "Kofi Boateng",
            phone: "020 888 1234",
            region: "Greater Accra",
            city: "Accra",
            area: "Airport Residential Area, 5th Circular Rd",
            digitalAddress: "GA-089-1122",
            coordinates: { lat: 5.5921, lng: -0.1743 },
            distanceKm: 5.8,
            zoneName: "Accra Central & Prime",
          },
          items: [
            {
              productId: products[0]._id,
              variantId: variants[0]._id,
              productName: products[0].name,
              brandName: "Voltic",
              variantName: variants[0].name,
              bottleSize: "500 ml",
              unitsPerPack: 15,
              quantity: 8,
              unitPrice: 45.0,
              totalPrice: 360.0,
            },
          ],
        },
        {
          orderNumber: "ORD-2026-1046",
          customerName: "Abena Osei-Tutu",
          phone: "055 333 9988",
          email: "abena.osei@yahoo.com",
          status: "DELIVERED",
          subtotal: 180.0,
          discount: 0,
          deliveryFee: 15.0,
          total: 195.0,
          address: {
            fullName: "Abena Osei-Tutu",
            phone: "055 333 9988",
            region: "Greater Accra",
            city: "Accra",
            area: "Shiashie, Mensah Wood Ave",
            digitalAddress: "GA-190-3344",
            coordinates: { lat: 5.6291, lng: -0.1654 },
            distanceKm: 1.8,
            zoneName: "East Legon & Shiashie",
          },
          items: [
            {
              productId: products[0]._id,
              variantId: variants[0]._id,
              productName: products[0].name,
              brandName: "Voltic",
              variantName: variants[0].name,
              bottleSize: "500 ml",
              unitsPerPack: 15,
              quantity: 4,
              unitPrice: 45.0,
              totalPrice: 180.0,
            },
          ],
        },
        {
          orderNumber: "ORD-2026-1045",
          customerName: "Dr. Kwabena Addo",
          phone: "024 999 5544",
          email: "dr.addo@medclinic.gh",
          status: "PAID",
          subtotal: 480.0,
          discount: 50.0,
          couponCode: "HYDRO50",
          deliveryFee: 0, // free delivery over 400
          total: 430.0,
          address: {
            fullName: "Dr. Kwabena Addo",
            phone: "024 999 5544",
            region: "Greater Accra",
            city: "Accra",
            area: "Cantonments, 2nd Close",
            digitalAddress: "GA-045-8811",
            coordinates: { lat: 5.5789, lng: -0.1689 },
            distanceKm: 7.2,
            zoneName: "Accra Central & Prime",
          },
          items: [
            {
              productId: products[0]._id,
              variantId: variants[0]._id,
              productName: products[0].name,
              brandName: "Voltic",
              variantName: variants[0].name,
              bottleSize: "500 ml",
              unitsPerPack: 15,
              quantity: 10,
              unitPrice: 48.0,
              totalPrice: 480.0,
            },
          ],
        },
        {
          orderNumber: "ORD-2026-1044",
          customerName: "Esi Quaye",
          phone: "027 111 4455",
          email: "esi.quaye@gmail.com",
          status: "PENDING_PAYMENT",
          subtotal: 90.0,
          discount: 0,
          deliveryFee: 15.0,
          total: 105.0,
          address: {
            fullName: "Esi Quaye",
            phone: "027 111 4455",
            region: "Greater Accra",
            city: "Accra",
            area: "Bawaleshie, East Legon",
            coordinates: { lat: 5.6412, lng: -0.1555 },
            distanceKm: 1.2,
            zoneName: "East Legon & Shiashie",
          },
          items: [
            {
              productId: products[0]._id,
              variantId: variants[0]._id,
              productName: products[0].name,
              brandName: "Voltic",
              variantName: variants[0].name,
              bottleSize: "500 ml",
              unitsPerPack: 15,
              quantity: 2,
              unitPrice: 45.0,
              totalPrice: 90.0,
            },
          ],
        },
      ];

      for (const ord of sampleOrders) {
        const orderDoc = await Order.create({
          orderNumber: ord.orderNumber,
          guestInformation: {
            name: ord.customerName,
            phone: ord.phone,
            email: ord.email,
          },
          items: ord.items,
          subtotal: ord.subtotal,
          discount: ord.discount,
          couponCode: ord.couponCode,
          deliveryFee: ord.deliveryFee,
          total: ord.total,
          status: ord.status,
          deliveryAddress: ord.address,
          timeline: [
            {
              status: "PENDING_PAYMENT",
              title: "Order Placed",
              description: `Customer placed order #${ord.orderNumber}`,
              actor: "CUSTOMER",
              timestamp: new Date(Date.now() - 3 * 3600 * 1000),
            },
            {
              status: "PAID",
              title: "Payment Confirmed",
              description: `Paid GH₵${ord.total.toFixed(2)} via Paystack`,
              actor: "PAYSTACK",
              timestamp: new Date(Date.now() - 2.5 * 3600 * 1000),
            },
            {
              status: "PROCESSING",
              title: "Warehouse Packaging",
              description: "Packs prepared at East Legon warehouse hub",
              actor: "ADMIN",
              timestamp: new Date(Date.now() - 2 * 3600 * 1000),
            },
          ],
        });

        // Payment record
        if (ord.status !== "PENDING_PAYMENT") {
          const payDoc = await Payment.create({
            orderId: orderDoc._id,
            provider: "PAYSTACK",
            reference: `PSK_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            amount: ord.total,
            currency: "GHS",
            method: "MOBILE_MONEY",
            status: "SUCCESS",
            paidAt: new Date(Date.now() - 2.5 * 3600 * 1000),
          });
          orderDoc.paymentId = payDoc._id as any;
          await orderDoc.save();
        }
      }
    }
  }

  // 8. Admin User Account Setup
  const adminEmail = "khadijahabass273@gmail.com";
  let adminUser = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash("Admin@123", 12);
    await User.create({
      name: "Khadijah Abass",
      email: adminEmail,
      phone: "+233 20 987 8744",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    });
  } else if (adminUser.role !== "ADMIN" && adminUser.role !== "SUPER_ADMIN") {
    adminUser.role = "ADMIN";
    adminUser.isActive = true;
    await adminUser.save();
  }

  // 9. Initial Audit Log
  const logsCount = await AuditLog.countDocuments();
  if (logsCount === 0) {
    await AuditLog.create({
      action: "SYSTEM_INITIALIZATION",
      resource: "Settings",
      description: "Khady's Water admin operations system initialized and configured",
    });
  }

  return { success: true, message: "Database seeded successfully" };
}
