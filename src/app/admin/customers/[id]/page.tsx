"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Star,
  ArrowLeft,
  DollarSign,
  UserCheck,
  UserX,
  ExternalLink,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatCurrency } from "@/lib/constants";

export default function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [customerId]);

  const handleToggleStatus = async () => {
    if (!data?.customer) return;
    const newStatus = !data.customer.isActive;
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const json = await res.json();
      if (json.success) fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  if (!data?.customer) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Customer profile not found</h2>
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  const { customer, addresses, orders, reviews, stats } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        subtitle={`Customer since ${new Date(customer.createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}`}
        breadcrumbs={[
          { label: "Customers", href: "/admin/customers" },
          { label: customer.name },
        ]}
        actions={
          <button
            onClick={handleToggleStatus}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              customer.isActive
                ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                : "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700"
            }`}
          >
            {customer.isActive ? (
              <>
                <UserX className="w-4 h-4" />
                <span>Disable Account</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Restore Account</span>
              </>
            )}
          </button>
        }
      />

      {/* Customer Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Orders</span>
          <div className="text-2xl font-black text-slate-900">{stats.totalOrders}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Lifetime Spend</span>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalSpent)}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Average Order Value</span>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.averageOrderValue)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Order History */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-black text-base text-slate-900">Order History ({orders.length})</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[580px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase">
                    <th className="py-3 px-3 first:pl-0 last:pr-0 whitespace-nowrap">Order ID</th>
                    <th className="py-3 px-3 whitespace-nowrap">Items</th>
                    <th className="py-3 px-3 whitespace-nowrap">Total</th>
                    <th className="py-3 px-3 whitespace-nowrap">Status</th>
                    <th className="py-3 px-3 whitespace-nowrap">Date</th>
                    <th className="py-3 px-3 text-right first:pl-0 last:pr-0 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders.length > 0 ? (
                    orders.map((ord: any) => (
                      <tr key={ord._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 first:pl-0 font-bold text-blue-600 whitespace-nowrap">
                          <Link href={`/admin/orders/${ord._id}`}>{ord.orderNumber}</Link>
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {ord.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0} packs
                        </td>
                        <td className="py-3 px-3 font-black text-slate-900 whitespace-nowrap">
                          {formatCurrency(ord.total)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <StatusBadge status={ord.status} size="sm" />
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 last:pr-0 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/orders/${ord._id}`}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600"
                          >
                            <ExternalLink className="w-4 h-4 inline" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No orders placed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Reviews */}
          {reviews.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-black text-base text-slate-900">Reviews & Ratings</h3>
              <div className="space-y-3 divide-y divide-slate-100">
                {reviews.map((rev: any) => (
                  <div key={rev._id} className="pt-3 first:pt-0 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {"★".repeat(rev.rating)}
                        <span className="text-slate-200">{"★".repeat(5 - rev.rating)}</span>
                      </div>
                      <StatusBadge status={rev.status} size="sm" />
                    </div>
                    <p className="text-slate-700 font-medium">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Info & Saved GPS Addresses */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Contact Information</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Phone</span>
                <span className="font-bold text-slate-800">{customer.phone || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Email</span>
                <span className="font-bold text-slate-800">{customer.email || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[11px]">Account Status</span>
                <span className="font-bold text-slate-800">{customer.isActive ? "Active" : "Disabled"}</span>
              </div>
            </div>
          </div>

          {/* Saved Delivery Addresses */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900">Saved GPS Addresses</h3>
            </div>

            <div className="space-y-3 divide-y divide-slate-100">
              {addresses && addresses.length > 0 ? (
                addresses.map((addr: any) => (
                  <div key={addr._id} className="pt-2.5 first:pt-0 space-y-1 text-xs">
                    <span className="font-bold text-slate-800 block">
                      {addr.label || "Home"}: {addr.area || addr.city}
                    </span>
                    <span className="text-slate-500 block">
                      {addr.houseOrBuilding ? `${addr.houseOrBuilding}, ` : ""}
                      {addr.city}, {addr.region}
                    </span>
                    {addr.digitalAddress && (
                      <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-block">
                        {addr.digitalAddress}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-2">No saved address entries.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
