import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Address from "@/models/Address";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: true, addresses: [] });
    }

    await connectDB();
    const addresses = await Address.find({ userId: session.user.id }).sort({ isDefault: -1, createdAt: -1 });

    return NextResponse.json({ success: true, addresses });
  } catch (error) {
    console.error("[account/addresses GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { label, region, city, area, houseOrBuilding, landmark, deliveryInstructions, isDefault } = body;

    if (!region || !city) {
      return NextResponse.json({ error: "Region and city are required." }, { status: 400 });
    }

    await connectDB();

    if (isDefault) {
      // Clear existing defaults for user
      await Address.updateMany({ userId: session.user.id }, { isDefault: false });
    }

    const newAddress = await Address.create({
      userId: session.user.id,
      label: label || "HOME",
      region,
      city,
      area: area || "",
      houseOrBuilding: houseOrBuilding || "",
      landmark: landmark || "",
      deliveryInstructions: deliveryInstructions || "",
      isDefault: Boolean(isDefault),
    });

    // Also link address to user
    await User.findByIdAndUpdate(session.user.id, {
      $addToSet: { addresses: newAddress._id },
    });

    return NextResponse.json({ success: true, address: newAddress }, { status: 201 });
  } catch (error) {
    console.error("[account/addresses POST]", error);
    return NextResponse.json({ success: false, error: "Failed to save address" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Address ID required" }, { status: 400 });
    }

    await connectDB();
    await Address.findOneAndDelete({ _id: id, userId: session.user.id });
    await User.findByIdAndUpdate(session.user.id, {
      $pull: { addresses: id },
    });

    return NextResponse.json({ success: true, message: "Address removed" });
  } catch (error) {
    console.error("[account/addresses DELETE]", error);
    return NextResponse.json({ success: false, error: "Failed to delete address" }, { status: 500 });
  }
}
