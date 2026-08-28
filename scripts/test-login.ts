import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dns from "node:dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch {}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://mohammedfareeddev_db_user:JoshuaKimmich6@ac-tbio5rz-shard-00-00.3tmcrvd.mongodb.net:27017,ac-tbio5rz-shard-00-01.3tmcrvd.mongodb.net:27017,ac-tbio5rz-shard-00-02.3tmcrvd.mongodb.net:27017/khadys_water?ssl=true&replicaSet=atlas-h5o1mf-shard-0&authSource=admin&appName=Cluster0";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, select: false },
    role: { type: String, default: "CUSTOMER" },
    isActive: { type: Boolean, default: true },
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function test() {
  await mongoose.connect(MONGODB_URI, { dbName: "khadys_water" });

  const email = "khadijahabass273@gmail.com";
  const user = await User.findOne({ email }).select("+passwordHash +loginAttempts +lockedUntil");

  console.log("User found:", user ? {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    hasPasswordHash: !!user.passwordHash,
    loginAttempts: user.loginAttempts,
    lockedUntil: user.lockedUntil,
  } : null);

  if (user && user.passwordHash) {
    const isMatch = await bcrypt.compare("Admin@123", user.passwordHash);
    console.log("Password match for 'Admin@123':", isMatch);

    // If locked or attempts > 0, reset them
    if (user.loginAttempts > 0 || user.lockedUntil) {
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
      await user.save();
      console.log("Reset lockout and login attempts to 0");
    }
  }

  await mongoose.disconnect();
}

test().catch(console.error);
