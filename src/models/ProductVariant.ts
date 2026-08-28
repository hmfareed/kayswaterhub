import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductVariant extends Document {
  productId: mongoose.Types.ObjectId;
  name: string;           // e.g. "500ml × 24"
  sku?: string;
  bottleSize: string;     // e.g. "500ml"
  unitsPerPack: number;   // e.g. 24
  price: number;          // base price in GHS
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    bottleSize: { type: String, required: true },
    unitsPerPack: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: availableQuantity = stockQuantity - reservedQuantity
ProductVariantSchema.virtual("availableQuantity").get(function () {
  return Math.max(0, this.stockQuantity - this.reservedQuantity);
});

// Virtual: stockStatus
ProductVariantSchema.virtual("stockStatus").get(function () {
  const available = Math.max(0, this.stockQuantity - this.reservedQuantity);
  if (available === 0) return "OUT_OF_STOCK";
  if (available <= this.lowStockThreshold) return "LOW_STOCK";
  return "IN_STOCK";
});

ProductVariantSchema.index({ productId: 1 });
ProductVariantSchema.index({ sku: 1 }, { sparse: true });
ProductVariantSchema.index({ isAvailable: 1 });

const ProductVariant: Model<IProductVariant> =
  mongoose.models.ProductVariant ??
  mongoose.model<IProductVariant>("ProductVariant", ProductVariantSchema);

export default ProductVariant;
