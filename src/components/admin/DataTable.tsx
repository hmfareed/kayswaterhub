import React from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Inbox } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  total?: number;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  actions?: React.ReactNode;
  minWidth?: string;
}

export function DataTable<T extends { _id?: string; id?: string }>({
  data,
  columns,
  total,
  page = 1,
  limit = 20,
  onPageChange,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  isLoading,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search query or filters.",
  actions,
  minWidth = "min-w-[680px]",
}: DataTableProps<T>) {
  const totalPages = total ? Math.ceil(total / limit) : 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-0">
      {/* Top Filter & Search Bar */}
      {(onSearchChange || actions) && (
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          {onSearchChange && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2 w-full sm:w-auto">{actions}</div>}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className={`w-full text-left text-xs ${minWidth}`}>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3.5 px-4 font-black whitespace-nowrap ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  } ${col.className || ""}`}
                >
                  <div
                    className={`inline-flex items-center gap-1 ${
                      col.align === "right" ? "justify-end" : ""
                    }`}
                  >
                    <span>{col.header}</span>
                    {col.sortable && <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="py-4 px-4 whitespace-nowrap">
                      <div className="h-4 bg-slate-200/70 rounded-md w-full max-w-[120px]"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-sm text-slate-700">{emptyTitle}</p>
                    <p className="text-xs text-slate-400 max-w-sm">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr
                  key={item._id || item.id || rowIdx}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`py-3.5 px-4 ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left"
                      } ${col.className || ""}`}
                    >
                      {col.cell
                        ? col.cell(item)
                        : (item as any)[col.accessorKey as string] !== undefined
                        ? String((item as any)[col.accessorKey as string])
                        : "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {total !== undefined && totalPages > 1 && onPageChange && (
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/40">
          <span className="font-semibold text-center sm:text-left">
            Showing <span className="font-black text-slate-800">{(page - 1) * limit + 1}</span> to{" "}
            <span className="font-black text-slate-800">{Math.min(page * limit, total)}</span> of{" "}
            <span className="font-black text-slate-800">{total}</span> records
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-800 bg-white border border-slate-200 rounded-lg">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
