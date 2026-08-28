import mongoose, { Schema, Document, Model } from "mongoose";
import type { UserRole } from "@/types";

export interface IUser extends Document {
  name: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  addresses: mongoose.Types.ObjectId[];
  // Security
  loginAttempts: number;
  lockedUntil?: Date;
  lastLogin?: Date;
  // Password reset
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true, // allows multiple null values
      trim: true,
    },
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: ["CUSTOMER", "ADMIN", "DELIVERY", "SUPER_ADMIN"],
      default: "CUSTOMER",
    },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    addresses: [{ type: Schema.Types.ObjectId, ref: "Address" }],
    // Security fields
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    lastLogin: { type: Date },
    // Password reset fields (token is stored hashed)
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Enforce: at least one of email or phone must be present
UserSchema.pre("validate", function (next) {
  if (!this.email && !this.phone) {
    this.invalidate("email", "Either email or phone number is required.");
  }
  next();
});

UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
