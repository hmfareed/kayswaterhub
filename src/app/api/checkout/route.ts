import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import Payment from "@/models/Payment";
import ProductVariant from "@/models/ProductVariant";
import PricingRule from "@/models/PricingRule";
import { PricingService } from "@/services/pricing/PricingService";
import { resolveDeliveryFee } from "@/lib/delivery/delivery-engine";
import { OrderService } from "@/services/order/OrderService";
import { paymentService } from "@/services/payment/PaymentService";
import { STORE_PRODUCTS } from "@/lib/constants";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();

    const { items, deliveryAddress, customerInfo, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Your cart is empty." },
        { status: 400 }
      );
    }

    if (!deliveryAddress?.region || !deliveryAddress?.city) {
      return NextResponse.json(
        { success: false, error: "Delivery address region and city are required." },
        { status: 400 }
      );
    }

    await connectDB();

    // 1. Calculate authoritative server-side items and subtotal
    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

      // Check if product exists in MongoDB ProductVariant
      let variant = null;
      if (item.variantId && mongoose.Types.ObjectId.isValid(item.variantId)) {
        variant = await ProductVariant.findById(item.variantId).populate("productId");
      }

      if (variant) {
        // Fetch pricing rule
        const rule = await PricingRule.findOne({ variantId: variant._id, isActive: true });
        const priceCalc = PricingService.calculate(rule, quantity, variant.price);

        validatedItems.push({
          productId: variant.productId._id || variant.productId,
          variantId: variant._id,
          productName: item.productName || variant.name,
          brandName: item.brandName || "Pure Water",
          variantName: variant.name,
          bottleSize: variant.bottleSize || "500ml",
          unitsPerPack: variant.unitsPerPack || 24,
          quantity,
          unitPrice: priceCalc.unitPrice,
          totalPrice: priceCalc.totalPrice,
          pricingTier: priceCalc.tier ? PricingService.formatTierLabel(priceCalc.tier) : undefined,
        });

        subtotal += priceCalc.totalPrice;
      } else {
        // Match with store products list fallback
        const storeProd = STORE_PRODUCTS.find((p) => p.id === item.productId || p.id === item.id);
        const unitPrice = storeProd ? storeProd.price : item.unitPrice || 45;
        const totalPrice = unitPrice * quantity;

        validatedItems.push({
          productId: new mongoose.Types.ObjectId(),
          variantId: new mongoose.Types.ObjectId(),
          productName: item.name || storeProd?.name || "Water Pack",
          brandName: item.brand || storeProd?.brand || "Voltic",
          variantName: item.packSize || storeProd?.packSize || "500ml x 24",
          bottleSize: storeProd?.bottleSize || "500ml",
          unitsPerPack: storeProd?.bottlesPerPack || 24,
          quantity,
          unitPrice,
          totalPrice,
        });

        subtotal += totalPrice;
      }
    }

    // 2. Calculate Location-Based Delivery Fee
    const deliveryCalc = await resolveDeliveryFee({
      coordinates: deliveryAddress.coordinates,
      region: deliveryAddress.region,
      city: deliveryAddress.city,
      area: deliveryAddress.area,
      subtotal,
    });

    if (!deliveryCalc.isDeliverable) {
      return NextResponse.json(
        {
          success: false,
          error: deliveryCalc.reason || "We are unable to deliver to this location.",
        },
        { status: 400 }
      );
    }

    const deliveryFee = deliveryCalc.deliveryFee;
    const discount = 0;
    const total = subtotal + deliveryFee - discount;

    // 3. Create Pending Order
    const customerId = session?.user?.id;
    const guestInformation = {
      name: customerInfo?.name || session?.user?.name || "Customer",
      email: customerInfo?.email || session?.user?.email || "customer@khadyswater.com",
      phone: customerInfo?.phone || session?.user?.phone || deliveryAddress.phone || "",
    };

    const pendingOrderResult = await OrderService.createPendingOrder({
      customerId: customerId || undefined,
      guestInformation,
      items: validatedItems,
      subtotal,
      discount,
      deliveryFee,
      total,
      paymentMethod: paymentMethod || "PAYSTACK",
      deliveryAddress: {
        fullName: deliveryAddress.fullName || guestInformation.name,
        phone: deliveryAddress.phone || guestInformation.phone,
        region: deliveryAddress.region,
        city: deliveryAddress.city,
        area: deliveryAddress.area,
        digitalAddress: deliveryAddress.digitalAddress,
        houseOrBuilding: deliveryAddress.houseOrBuilding,
        landmark: deliveryAddress.landmark,
        deliveryInstructions: deliveryAddress.deliveryInstructions,
        coordinates: deliveryAddress.coordinates,
        distanceKm: deliveryCalc.distanceKm,
        zoneName: deliveryCalc.zoneName,
      },
    });

    if (!pendingOrderResult.success || !pendingOrderResult.orderId) {
      return NextResponse.json(
        { success: false, error: pendingOrderResult.error || "Failed to create order" },
        { status: 500 }
      );
    }

    const orderId = pendingOrderResult.orderId;
    const orderNumber = pendingOrderResult.orderNumber!;

    // 4. Create Payment Record with Unique Reference
    const reference = `PSK_${orderNumber}_${Date.now()}`;

    const payment = await Payment.create({
      orderId: new mongoose.Types.ObjectId(orderId),
      provider: "PAYSTACK",
      reference,
      amount: total,
      currency: "GHS",
      method: "MOBILE_MONEY",
      status: "PENDING",
      metadata: {
        orderId,
        orderNumber,
        customerId: customerId || "guest",
        deliveryZone: deliveryCalc.zoneName,
      },
      transactions: [],
    });

    await Order.findByIdAndUpdate(orderId, { paymentId: payment._id });

    // 5. Initialize Paystack Transaction
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const callbackUrl = `${protocol}://${host}/orders/${orderId}?ref=${reference}`;

    const paymentInitResult = await paymentService.initiatePayment({
      reference,
      amount: total,
      email: guestInformation.email,
      phone: guestInformation.phone,
      callbackUrl,
      metadata: {
        orderId,
        orderNumber,
        customerId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        orderNumber,
        reference,
        total,
        subtotal,
        deliveryFee,
        distanceKm: deliveryCalc.distanceKm,
        zoneName: deliveryCalc.zoneName,
        authorizationUrl: paymentInitResult.authorizationUrl,
        accessCode: paymentInitResult.accessCode,
        isSimulated: paymentInitResult.isSimulated,
      },
    });
  } catch (error) {
    console.error("[api/checkout POST]", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Checkout processing error",
      },
      { status: 500 }
    );
  }
}
