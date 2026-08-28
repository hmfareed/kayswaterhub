"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Package,
  Users,
  Percent,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";

export default function ExportReportsPage() {
  const [reportType, setReportType] = useState("sales");
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true);
    try {
      const query = new URLSearchParams({
        type: reportType,
        dateFrom,
        dateTo,
      });
      const res = await fetch(`/api/admin/reports?${query}`);
      const json = await res.json();

      if (json.success && json.data) {
        if (format === "csv") {
          const items = json.data;
          if (items.length === 0) {
            alert("No records found for the selected date range.");
            return;
          }
          const headers = Object.keys(items[0]).join(",");
          const rows = items.map((obj: any) =>
            Object.values(obj)
              .map((v) => `"${String(v).replace(/"/g, '""')}"`)
              .join(",")
          );
          const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `khadys-water-${reportType}-report-${dateFrom}-to-${dateTo}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          const blob = new Blob([JSON.stringify(json.data, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `khadys-water-${reportType}-report.json`;
          a.click();
        }
      }
    } catch (e: any) {
      alert("Export failed: " + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const reports = [
    {
      id: "sales",
      title: "Orders & Sales Revenue Report",
      desc: "All customer orders, total revenue, Paystack payment references, discounts, and delivery fees.",
      icon: DollarSign,
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: "inventory",
      title: "Warehouse Inventory Valuation Report",
      desc: "Current stock quantities, unit pack prices, SKU list, and total asset valuation.",
      icon: Package,
      color: "bg-amber-50 text-amber-600",
    },
    {
      id: "customers",
      title: "Customer Directory & Lifetime Value",
      desc: "Registered users, phone numbers, total order volume, and aggregate spend.",
      icon: Users,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      id: "taxes",
      title: "Tax & Financial Summary Report",
      desc: "Breakdown of subtotal sales, statutory taxes, and shipping logistics fees.",
      icon: Percent,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Export Operational Reports"
        subtitle="Generate formatted CSV spreadsheets for accounting, inventory audits, taxes, and order fulfillment"
        breadcrumbs={[
          { label: "Reports" },
        ]}
      />

      {/* Report Type Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map((r) => {
          const Icon = r.icon;
          const isSelected = reportType === r.id;

          return (
            <div
              key={r.id}
              onClick={() => setReportType(r.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                isSelected
                  ? "bg-blue-50/60 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                  : "bg-white border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${r.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {isSelected && (
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">{r.title}</h3>
              <p className="text-xs text-slate-500 font-medium">{r.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Date Filter & Export Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-black text-sm text-slate-900">Date Range & Export Options</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Start Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">End Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            onClick={() => handleExport("json")}
            disabled={isExporting}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Export JSON
          </button>
          <button
            onClick={() => handleExport("csv")}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Generating Spreadsheet..." : "Download CSV Spreadsheet"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
