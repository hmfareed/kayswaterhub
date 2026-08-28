import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStockReservation extends Document {
  variantId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  quantity: number;
  expiresAt: Date;
  isReleased: boolean;
  releasedAt?: Date;
  createdAt: Date;
}

const StockReservationSchema = new Schema<IStockReservation>(
  {
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    quantity: { type: Number, required: true, min: 1 },
    expiresAt: { type: Date, required: true },
    isReleased: { type: Boolean, default: false },
    releasedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL index — MongoDB auto-removes expired, unreleased reservations
StockReservationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { isReleased: false } }
);
StockReservationSchema.index({ orderId: 1 });
StockReservationSchema.index({ variantId: 1, isReleased: 1 });

const StockReservation: Model<IStockReservation> =
  mongoose.models.StockReservation ??
  mongoose.model<IStockReservation>("StockReservation", StockReservationSchema);

export default StockReservation;
