"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, Column } from "@/components/admin/DataTable";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resource, setResource] = useState("");
  const [action, setAction] = useState("");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({ limit: "50" });
      if (resource) query.set("resource", resource);
      if (action) query.set("action", action);

      const res = await fetch(`/api/admin/audit-logs?${query}`);
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [resource, action]);

  const columns: Column<any>[] = [
    {
      header: "Action",
      cell: (item) => (
        <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
          {item.action}
        </span>
      ),
    },
    {
      header: "Resource",
      cell: (item) => (
        <span className="font-bold text-slate-700 text-xs">{item.resource}</span>
      ),
    },
    {
      header: "Description / Details",
      cell: (item) => (
        <span className="text-slate-600 text-xs font-medium">{item.description}</span>
      ),
    },
    {
      header: "Performed By",
      cell: (item) => (
        <span className="text-slate-500 text-xs font-semibold">
          {item.performedBy?.name || "Admin / System"}
        </span>
      ),
    },
    {
      header: "Timestamp",
      cell: (item) => (
        <span className="text-slate-400 text-xs">
          {new Date(item.createdAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs & Compliance Trail"
        subtitle="Immutable security and operational event logs for price changes, stock deductions, and administrative operations"
        breadcrumbs={[
          { label: "Audit Logs" },
        ]}
        actions={
          <button
            onClick={fetchLogs}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        }
      />

      <DataTable
        data={logs}
        columns={columns}
        isLoading={isLoading}
        emptyTitle="No audit logs recorded"
        emptyDescription="Administrative operations and status updates will be logged here."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="">All Resources</option>
              <option value="Order">Order</option>
              <option value="Product">Product</option>
              <option value="Inventory">Inventory</option>
              <option value="DeliveryZone">Delivery Zone</option>
              <option value="Settings">Settings</option>
            </select>
          </div>
        }
      />
    </div>
  );
}
