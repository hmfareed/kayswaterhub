/**
 * Resolves the real product pack / bottle image URL based on product properties.
 */
export function getProductImage(item?: {
  image?: string;
  images?: string[];
  productName?: string;
  name?: string;
  brandName?: string;
  brand?: string;
  bottleSize?: string;
  packSize?: string;
}): string {
  if (!item) return "/images/products/newvoltic15x500ml.jpg";

  if (item.image && typeof item.image === "string" && item.image.trim() !== "") {
    return item.image;
  }

  if (Array.isArray(item.images) && item.images.length > 0 && item.images[0]) {
    return item.images[0];
  }

  const brand = (item.brandName || item.brand || "").toLowerCase();
  const name = (item.productName || item.name || "").toLowerCase();
  const size = (item.bottleSize || item.packSize || "").toLowerCase();

  // Voltic
  if (brand.includes("voltic") || name.includes("voltic")) {
    if (size.includes("350") || name.includes("350") || name.includes("pocket")) {
      return "/images/products/voltic.jpg";
    }
    return "/images/products/newvoltic15x500ml.jpg";
  }

  // Bel-Aqua
  if (brand.includes("bel") || name.includes("bel")) {
    return "/images/products/bel-aqua-15x750ml.jpg";
  }

  // Verna
  if (brand.includes("verna") || name.includes("verna")) {
    if (
      size.includes("15") &&
      (size.includes("l") || size.includes("ltr") || name.includes("jar") || name.includes("dispenser"))
    ) {
      return "/images/products/verna-jar-15ltr.jpeg";
    }
    if (size.includes("750") || name.includes("750")) {
      return "/images/products/verna-16x750ml.jpg";
    }
    return "/images/products/verna-15x500ml.jpg";
  }

  // Awake
  if (brand.includes("awake") || name.includes("awake")) {
    return "/images/products/awake-16x750ml.jpg";
  }

  // Slem Fit / Slim Fit
  if (
    brand.includes("slem") ||
    name.includes("slem") ||
    brand.includes("slim") ||
    name.includes("slim")
  ) {
    return "/images/products/slemfit-16x500ml.jpg";
  }

  // Default fallback
  return "/images/products/newvoltic15x500ml.jpg";
}
