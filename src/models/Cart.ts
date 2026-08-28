import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICartItem {
  variantId: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;   // price at time of adding to cart
  totalPrice: number;
}

export interface ICart extends Document {
  userId?: mongoose.Types.ObjectId;   // null for guest carts
  sessionId?: string;                 // for guest carts
  items: ICartItem[];
  subtotal: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    variantId: { type: Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    sessionId: { type: String },
    items: [CartItemSchema],
    subtotal: { type: Number, default: 0 },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

CartSchema.index({ userId: 1 }, { sparse: true });
CartSchema.index({ sessionId: 1 }, { sparse: true });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const Cart: Model<ICart> =
  mongoose.models.Cart ?? mongoose.model<ICart>("Cart", CartSchema);

export default Cart;
