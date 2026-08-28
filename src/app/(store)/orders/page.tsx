import { redirect } from "next/navigation";

export default function OrdersPage() {
  redirect("/account?tab=orders");
}
