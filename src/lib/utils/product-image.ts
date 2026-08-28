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
  if (!item) return "/images/products-clean/voltic-pack.png";

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
      return "/images/products-clean/voltic-pocket-pack.png";
    }
    return "/images/products-clean/voltic-pack.png";
  }

  // Bel-Aqua
  if (brand.includes("bel") || name.includes("bel")) {
    return "/images/products-clean/bel-aqua-pack.png";
  }

  // Verna
  if (brand.includes("verna") || name.includes("verna")) {
    if (
      size.includes("15") &&
      (size.includes("l") || size.includes("ltr") || name.includes("jar") || name.includes("dispenser"))
    ) {
      return "/images/products-clean/verna-jar-pack.png";
    }
    if (size.includes("750") || name.includes("750")) {
      return "/images/products-clean/verna-750-pack.png";
    }
    return "/images/products-clean/verna-500-pack.png";
  }

  // Awake
  if (brand.includes("awake") || name.includes("awake")) {
    return "/images/products-clean/awake-pack.png";
  }

  // Slem Fit / Slim Fit
  if (
    brand.includes("slem") ||
    name.includes("slem") ||
    brand.includes("slim") ||
    name.includes("slim")
  ) {
    return "/images/products-clean/slemfit-pack.png";
  }

  // Default fallback
  return "/images/products-clean/voltic-pack.png";
}
