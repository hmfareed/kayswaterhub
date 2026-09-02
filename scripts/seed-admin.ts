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
    passwordHash: { type: String },
    role: { type: String, enum: ["CUSTOMER", "DELIVERY", "ADMIN", "SUPER_ADMIN"], default: "CUSTOMER" },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI, { dbName: "khadys_water" });
  console.log("Connected successfully!");

  const email = "khadijahabass273@gmail.com";
  const password = "Admin@123";
  const passwordHash = await bcrypt.hash(password, 12);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: "Khadijah Abass",
      email,
      phone: "+233504903022",
      passwordHash,
      role: "ADMIN",
      isActive: true,
      emailVerified: true,
    });
    console.log(`✅ Created Admin User: ${email} with password: ${password}`);
  } else {
    user.role = "ADMIN";
    user.isActive = true;
    user.passwordHash = passwordHash;
    await user.save();
    console.log(`✅ Updated existing user ${email} to ADMIN with password: ${password}`);
  }

  await mongoose.disconnect();
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error seeding admin:", err);
  process.exit(1);
});
