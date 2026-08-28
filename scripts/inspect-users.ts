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
    name: String,
    email: String,
    phone: String,
    passwordHash: { type: String, select: false },
    role: String,
    isActive: Boolean,
    emailVerified: Boolean,
    phoneVerified: Boolean,
    loginAttempts: Number,
    lockedUntil: Date,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function inspect() {
  await mongoose.connect(MONGODB_URI, { dbName: "khadys_water" });

  const allUsers = await User.find({}).select("+passwordHash +loginAttempts +lockedUntil");
  console.log("Total users in DB:", allUsers.length);
  for (const u of allUsers) {
    const isPwMatch = u.passwordHash ? await bcrypt.compare("Admin@123", u.passwordHash) : false;
    console.log("User:", {
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      emailVerified: u.emailVerified,
      loginAttempts: u.loginAttempts,
      lockedUntil: u.lockedUntil,
      passwordMatchesAdmin123: isPwMatch,
    });
  }

  await mongoose.disconnect();
}

inspect().catch(console.error);
