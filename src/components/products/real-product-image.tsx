"use client";

import React, { useState } from "react";
import { getProductImage } from "@/lib/utils/product-image";
import { Droplets } from "lucide-react";

interface RealProductImageProps {
  item?: {
    image?: string;
    images?: string[];
    productName?: string;
    name?: string;
    brandName?: string;
    brand?: string;
    bottleSize?: string;
    packSize?: string;
  };
  alt?: string;
  className?: string;
  containerClassName?: string;
}

export function RealProductImage({
  item,
  alt = "Water Product Pack",
  className = "w-full h-full object-contain drop-shadow-xs",
  containerClassName = "w-full h-full flex items-center justify-center p-1 relative",
}: RealProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = getProductImage(item);

  return (
    <div className={containerClassName}>
      {!hasError ? (
        <img
          src={imageSrc}
          alt={item?.productName || item?.name || alt}
          onError={() => setHasError(true)}
          className={className}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Droplets className="w-5 h-5 opacity-70" />
        </div>
      )}
    </div>
  );
}
