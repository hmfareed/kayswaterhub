"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Trash2,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, Column } from "@/components/admin/DataTable";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status,
        search,
      });
      const res = await fetch(`/api/admin/reviews?${query}`);
      const json = await res.json();
      if (json.success) {
        setReviews(json.data);
        setTotal(json.pagination.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, status]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) fetchReviews();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer review?")) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) fetchReviews();
    } catch (e) {
      console.error(e);
    }
  };

  const columns: Column<any>[] = [
    {
      header: "Product",
      cell: (item) => (
        <span className="font-bold text-slate-900 text-xs">
          {item.productId?.name || "Water Pack"}
        </span>
      ),
    },
    {
      header: "Customer",
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-800 text-xs block">{item.customerName}</span>
          <span className="text-[10px] text-slate-400">{item.customerEmail}</span>
        </div>
      ),
    },
    {
      header: "Rating",
      cell: (item) => (
        <div className="flex text-amber-400 text-xs">
          {"★".repeat(item.rating)}
          <span className="text-slate-200">{"★".repeat(5 - item.rating)}</span>
        </div>
      ),
    },
    {
      header: "Comment",
      cell: (item) => (
        <p className="text-slate-600 text-xs font-medium max-w-sm line-clamp-2">
          &ldquo;{item.comment}&rdquo;
        </p>
      ),
    },
    {
      header: "Status",
      cell: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      header: "Date",
      cell: (item) => (
        <span className="text-slate-400 text-xs">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Moderation",
      align: "right",
      cell: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {item.status !== "PUBLISHED" && (
            <button
              onClick={() => handleUpdateStatus(item._id, "PUBLISHED")}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
              title="Publish Review"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
          {item.status === "PUBLISHED" && (
            <button
              onClick={() => handleUpdateStatus(item._id, "HIDDEN")}
              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
              title="Hide Review"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(item._id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
            title="Delete Review"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews & Ratings Moderation"
        subtitle="Approve verified customer feedback, manage published testimonials, and moderate reported reviews"
        breadcrumbs={[{ label: "Reviews" }]}
        actions={
          <button
            onClick={fetchReviews}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        }
      />

      <DataTable
        data={reviews}
        columns={columns}
        total={total}
        page={page}
        limit={15}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer comment or name..."
        isLoading={isLoading}
        emptyTitle="No reviews found"
        emptyDescription="Customer product ratings and testimonials will appear here."
        actions={
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
          >
            <option value="all">All Reviews</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="hidden">Hidden</option>
          </select>
        }
      />
    </div>
  );
}
