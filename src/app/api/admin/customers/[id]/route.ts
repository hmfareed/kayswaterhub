import { NextRequest, NextResponse } from "next/server";
import { getAdminCustomerById, toggleCustomerActive } from "@/services/admin/customer.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerData = await getAdminCustomerById(id);
    if (!customerData) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: customerData });
  } catch (error: any) {
    console.error("[api/admin/customers/[id] GET]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch customer profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { isActive } = body;

    const updated = await toggleCustomerActive(id, isActive);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[api/admin/customers/[id] PATCH]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update customer status" },
      { status: 500 }
    );
  }
}
