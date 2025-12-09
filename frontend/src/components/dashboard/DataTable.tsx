"use client";

import React, { useMemo } from "react";

export type DataRow = Record<string, any>;

type DataTableProps = {
  title?: string;
  rows: DataRow[];
  loading?: boolean;
  className?: string;
  prettifyNumbers?: boolean;
  exportFileName?: string;
};

function toCsv(rows: DataRow[]): string {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    const needsQuote = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuote ? `"${escaped}"` : escaped;
  };
  const headerLine = headers.map(escape).join(",");
  const dataLines = rows.map((r) => headers.map((h) => escape(r[h])).join(","));
  return [headerLine, ...dataLines].join("\n");
}

export default function DataTable({
  title,
  rows,
  loading,
  className,
  prettifyNumbers = true,
  exportFileName = "table",
}: DataTableProps) {
  const columns = useMemo(() => {
    if (!rows?.length) return [] as string[];
    return Object.keys(rows[0]);
  }, [rows]);

  const handleExport = () => {
    if (!rows?.length) return;
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isNumeric = (v: any) =>
    typeof v === "number" ||
    (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)));

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          {title ?? "Table"}
        </h3>
        <button
          onClick={handleExport}
          disabled={!rows?.length}
          className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-[#f8edcf] hover:bg-slate-700 disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap border-b border-neutral-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && (
                <tr>
                  <td
                    colSpan={columns.length || 1}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {!loading && rows?.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length || 1}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    No data found
                  </td>
                </tr>
              )}

              {!loading &&
                rows?.map((row, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
                  >
                    {columns.map((col) => {
                      const v = row[col];
                      const numeric = isNumeric(v);
                      const display =
                        prettifyNumbers && numeric
                          ? Number(v).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })
                          : v ?? "";

                      return (
                        <td
                          key={col}
                          className={`whitespace-nowrap border-b border-neutral-100 px-3 py-2 ${
                            numeric ? "text-right tabular-nums" : "text-slate-700"
                          }`}
                          title={typeof v === "string" ? v : undefined}
                        >
                          {display as any}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
