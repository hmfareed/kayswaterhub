import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import Payment from "@/models/Payment";
import ProductVariant from "@/models/ProductVariant";
import PricingRule from "@/models/PricingRule";
import User from "@/models/User";
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

    const { items, deliveryAddress, customerInfo, paymentMethod, fulfillmentType } = body;
    const isPickup = fulfillmentType === "PICKUP";

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Your cart is empty." },
        { status: 400 }
      );
    }

    if (!isPickup && (!deliveryAddress?.region || !deliveryAddress?.city)) {
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

    // 2. Determine Delivery Method & Calculate Estimated Delivery Fee
    let deliveryMethod: "YANGO_DOOR" | "NATIONWIDE_PARCEL" | "SELF_PICKUP" = "YANGO_DOOR";
    let estimatedDeliveryFee = 0;
    let zoneName = "Self Pickup (Depot Hub)";
    let distanceKm: number | undefined = undefined;
    let deliverySnapshot: any = undefined;

    // Total packs in cart for quantity-tier pricing
    const packQuantity = validatedItems.reduce((sum, item) => sum + item.quantity, 0);

    if (isPickup) {
      deliveryMethod = "SELF_PICKUP";
    } else {
      const region = deliveryAddress?.region || "Greater Accra";
      const isGreaterAccra = region.toLowerCase().includes("greater accra") || region.toLowerCase() === "accra";

      if (isGreaterAccra) {
        deliveryMethod = "YANGO_DOOR";
        const deliveryCalc = await resolveDeliveryFee({
          coordinates: deliveryAddress?.coordinates,
          region: "Greater Accra",
          city: deliveryAddress?.city || "Accra",
          area: deliveryAddress?.area,
          packQuantity,
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

        estimatedDeliveryFee = deliveryCalc.deliveryFee;
        zoneName = deliveryCalc.zoneName;
        distanceKm = deliveryCalc.distanceKm;
        deliverySnapshot = deliveryCalc.snapshot;
      } else {
        // Nationwide Parcel Delivery
        deliveryMethod = "NATIONWIDE_PARCEL";
        zoneName = `${region} Parcel Station`;
        estimatedDeliveryFee = 0; // Courier-determined fee, paid separately on collection
      }
    }

    // 3. Online Payment Calculation: Product Subtotal - Discount (Delivery is paid separately to courier)
    const discount = 0;
    const onlineTotal = Math.max(0, subtotal - discount);

    // 4. Create Pending Order - strictly bind to active session if authenticated
    const customerId = session?.user?.id || undefined;
    const rawEmail = (customerInfo?.email || session?.user?.email || "").trim();
    const cleanPhone = (customerInfo?.phone || session?.user?.phone || deliveryAddress?.phone || "").replace(/\D/g, "");
    const guestEmail = rawEmail || (cleanPhone ? `customer.${cleanPhone}@kayswaterhub.com` : `guest.${Date.now()}@kayswaterhub.com`);

    const guestInformation = {
      name: customerInfo?.name || session?.user?.name || "Customer",
      email: guestEmail,
      phone: customerInfo?.phone || session?.user?.phone || deliveryAddress?.phone || "",
    };

    const pendingOrderResult = await OrderService.createPendingOrder({
      customerId,
      guestInformation,
      items: validatedItems,
      subtotal,
      discount,
      deliveryFee: estimatedDeliveryFee,
      estimatedDeliveryFee,
      total: onlineTotal, // Paystack charges product amount only
      amountPaidOnline: 0,
      deliveryMethod,
      deliveryPaymentStatus: isPickup ? "NOT_REQUIRED" : "EXPECTED",
      deliveryPaymentMethod: "CASH_TO_COURIER",
      paymentMethod: paymentMethod || "PAYSTACK",
      deliveryAddress: {
        fullName: deliveryAddress?.fullName || guestInformation.name,
        phone: deliveryAddress?.phone || guestInformation.phone,
        region: deliveryAddress?.region || "Greater Accra",
        city: deliveryAddress?.city || "Accra",
        area: deliveryAddress?.area,
        digitalAddress: deliveryAddress?.digitalAddress,
        houseOrBuilding: deliveryAddress?.houseOrBuilding,
        landmark: deliveryAddress?.landmark,
        deliveryInstructions: deliveryAddress?.deliveryInstructions,
        parcelStation: deliveryAddress?.parcelStation,
        coordinates: deliveryAddress?.coordinates,
        gpsAccuracy: deliveryAddress?.gpsAccuracy,
        addressSource: deliveryAddress?.addressSource || "MANUAL",
        distanceKm,
        zoneName,
        deliverySnapshot,
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

    // 5. Create Payment Record with Unique Reference for Online Product Amount
    const reference = `PSK_${orderNumber}_${Date.now()}`;

    const payment = await Payment.create({
      orderId: new mongoose.Types.ObjectId(orderId),
      provider: "PAYSTACK",
      reference,
      amount: onlineTotal, // Online product payment only
      currency: "GHS",
      method: "MOBILE_MONEY",
      status: "PENDING",
      metadata: {
        orderId,
        orderNumber,
        customerId: customerId || "guest",
        deliveryZone: zoneName,
        deliveryMethod,
        estimatedDeliveryFee,
      },
      transactions: [],
    });

    await Order.findByIdAndUpdate(orderId, { paymentId: payment._id });

    // 6. Initialize Paystack Transaction for Product Amount Only
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = appUrl ? appUrl.replace(/\/$/, "") : `${protocol}://${host}`;
    const callbackUrl = `${baseUrl}/orders/${orderId}?ref=${reference}`;

    const paymentInitResult = await paymentService.initiatePayment({
      reference,
      amount: onlineTotal,
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
        total: onlineTotal, // Online product payment
        subtotal,
        deliveryFee: estimatedDeliveryFee,
        estimatedDeliveryFee,
        deliveryMethod,
        distanceKm,
        zoneName,
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
