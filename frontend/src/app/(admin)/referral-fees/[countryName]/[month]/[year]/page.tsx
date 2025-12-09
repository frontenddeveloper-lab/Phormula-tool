// // "use client";

// // import React, {
// //   useEffect,
// //   useMemo,
// //   useState,
// //   type JSX,
// //   useCallback,
// // } from "react";
// // import MonthYearPickerTable from "@/components/filters/MonthYearPickerTable";
// // import { FiDownload } from "react-icons/fi";
// // import { Doughnut } from "react-chartjs-2";
// // import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
// // import { jwtDecode } from "jwt-decode";
// // import * as XLSX from "xlsx";
// // import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// // import DataTable, { ColumnDef, Row } from "@/components/ui/table/DataTable";
// // import Button from "@/components/ui/button/Button";

// // ChartJS.register(ArcElement, Tooltip, Legend);

// // /* ===================== ENV / CONSTANTS ===================== */
// // const baseURL =
// //   process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

// // /* ===================== Types ===================== */
// // interface DonutProps {
// //   label: string;
// //   pct: number;
// //   amount: number;
// //   color?: string;
// // }

// // type ReferralRow = Partial<{
// //   sku: string;
// //   product_name: string;
// //   category: string;
// //   asin: string;
// //   quantity: number | string;
// //   sales: number | string;
// //   product_sales: number | string;
// //   refRate: number | string;
// //   refFeesApplicable: number | string;
// //   refFeesCharged: number | string;
// //   overcharged: number | string;
// //   difference: number | string;
// //   errorstatus: string;
// //   selling_fees: number | string;
// //   answer: number | string;

// //   // NEW from backend:
// //   net_sales_total_value: number | string;
// //   status: string;
// //   total_value: number | string;
// // }>;


// // type Summary = {
// //   ordersUnits: number;
// //   totalSales: number;
// //   feeImpact: number;
// // };

// // type FeeSummaryRow = {
// //   label: string;
// //   units: number;
// //   sales: number;
// //   refFeesApplicable: number;
// //   refFeesCharged: number;
// //   overcharged: number;
// // };

// // type ProductOverchargeRow = {
// //   sku: string;
// //   productName: string;
// //   quantity: number;
// //   sales: number;
// //   refRate: number;
// //   refFeesApplicable: number;
// //   refFeesCharged: number;
// //   overcharged: number;
// //   total: number;
// // };

// // /* ===================== Formatters ===================== */
// // const fmtCurrency = (n: number): string =>
// //   typeof n === "number"
// //     ? n.toLocaleString(undefined, {
// //       style: "currency",
// //       currency: "GBP",
// //       minimumFractionDigits: 2,
// //       maximumFractionDigits: 2,
// //     })
// //     : "-";


// // const fmtNumber = (n: number): string =>
// //   typeof n === "number"
// //     ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
// //     : "-";

// // const fmtInteger = (n: number): string =>
// //   typeof n === "number"
// //     ? n.toLocaleString(undefined, {
// //       maximumFractionDigits: 0,
// //       minimumFractionDigits: 0,
// //     })
// //     : "-";


// // const toNumberSafe = (v: any): number => {
// //   if (v === null || v === undefined) return 0;
// //   if (typeof v === "number") return v;
// //   const num = Number(String(v).replace(/[, ]+/g, ""));
// //   return Number.isNaN(num) ? 0 : num;
// // };

// // /* ===================== Donut Component ===================== */
// // // function Donut({ label, pct, amount, color = "#60A68E" }: DonutProps) {
// // //   const data = {
// // //     labels: [label, "Remaining"],
// // //     datasets: [
// // //       {
// // //         data: [pct, Math.max(0, 100 - pct)],
// // //         backgroundColor: [color, "#e5e7eb"],
// // //         borderWidth: 0,
// // //       },
// // //     ],
// // //   };

// // //   const options = {
// // //     cutout: "70%",
// // //     plugins: { legend: { display: false } },
// // //     maintainAspectRatio: false,
// // //   } as const;

// // //   return (
// // //     <div className="bg-white rounded-2xl p-3 sm:p-4 flex flex-col items-center">
// // //       <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
// // //         {label}
// // //       </h3>

// // //       <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36">
// // //         <Doughnut data={data} options={options} />
// // //       </div>

// // //       <p className="mt-2 text-lg sm:text-xl lg:text-2xl font-bold">
// // //         {Number.isFinite(pct) ? pct.toFixed(2) : 0}%
// // //       </p>

// // //       <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
// // //         {fmtCurrency(amount)}
// // //       </p>
// // //     </div>
// // //   );
// // // }

// // function Donut({ label, pct, amount, color = "#60A68E" }: DonutProps) {
// //   const data = {
// //     labels: [label, "Remaining"],
// //     datasets: [
// //       {
// //         data: [pct, Math.max(0, 100 - pct)],
// //         backgroundColor: [color, "#e5e7eb"],
// //         borderWidth: 0,
// //       },
// //     ],
// //   };

// //   const options = {
// //     cutout: "70%",
// //     plugins: { 
// //       legend: { display: false },
// //       tooltip: { enabled: false },          // ❌ disable hover tooltips
// //     },
// //     hover: {
// //       mode: undefined as any,               // no hover behavior
// //     },
// //     maintainAspectRatio: false,
// //   } as const;

// //   return (
// //     <div className="bg-white rounded-2xl p-3 sm:p-4 flex flex-col items-center">
// //       <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
// //         {label}
// //       </h3>

// //       <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36">
// //         <Doughnut data={data} options={options} />
// //       </div>

// //       <p className="mt-2 text-lg sm:text-xl lg:text-2xl font-bold">
// //         {Number.isFinite(pct) ? pct.toFixed(2) : 0}%
// //       </p>

// //       <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
// //         {fmtCurrency(amount)}
// //       </p>
// //     </div>
// //   );
// // }


// // const donutColors = [
// //   "#14B8A6", // green
// //   "#FB923C", // amber
// //   "#EF4444", // red
// // ];

// // /* ===================== MAIN DASHBOARD ===================== */
// // export default function ReferralFeesDashboard(): JSX.Element {
// //   const [country] = useState<string>("UK");
// //   const [month, setMonth] = useState<string>("january");
// //   const [year, setYear] = useState<string>(
// //     new Date().getFullYear().toString()
// //   );

// //   // API data
// //   const [rows, setRows] = useState<ReferralRow[]>([]);
// //   // 👇 NEW: skuwise smaller table (14 rows)
// //   const [skuwiseRows, setSkuwiseRows] = useState<ReferralRow[]>([]);
// //   const [summary, setSummary] = useState<Summary>({
// //     ordersUnits: 0,
// //     totalSales: 0,
// //     feeImpact: 0,
// //   });
// //   const [feeSummaryRows, setFeeSummaryRows] = useState<FeeSummaryRow[]>([]);
// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState<string | null>(null);
// //   const [userId, setUserId] = useState<string>("unknown");

// //   /* ======= derive userId from JWT ======= */
// //   useEffect(() => {
// //     if (typeof window === "undefined") return;
// //     const token = localStorage.getItem("jwtToken");
// //     if (!token) return;
// //     try {
// //       const decoded: any = jwtDecode(token);
// //       const id = decoded?.user_id?.toString() ?? "unknown";
// //       setUserId(id);
// //     } catch {
// //       setUserId("unknown");
// //     }
// //   }, []);

// //   /* ======= fileName ======= */
// //   const fileName = useMemo(
// //     () =>
// //       `user_${userId}_${country.toLowerCase()}_${month}${year}_data`.toLowerCase(),
// //     [userId, country, month, year]
// //   );

// //   /* ===================== API Fetch ===================== */
// //   const fetchReferralData = useCallback(async () => {
// //     if (!month || !year || !country) return;
// //     setLoading(true);
// //     setError(null);

// //     // try {
// //     //   const token =
// //     //     typeof window !== "undefined"
// //     //       ? localStorage.getItem("jwtToken")
// //     //       : null;

// //     //   const params = new URLSearchParams({
// //     //     country: country,
// //     //     month: month,
// //     //     year: year,
// //     //   });

// //     //   const url = `${baseURL}/get_table_data/${fileName}?${params.toString()}`;

// //     //   const res = await fetch(url, {
// //     //     method: "GET",
// //     //     headers: token ? { Authorization: `Bearer ${token}` } : {},
// //     //   });

// //     //   if (!res.ok) {
// //     //     throw new Error(`Failed to fetch referral data (${res.status})`);
// //     //   }

// //     //   const json: any = await res.json();
// //     //   console.log("REFERRAL JSON:", json);

// //     //   // full table for calculations / overcharged logic
// //     //   const tableData = json?.table_data ?? json;
// //     //   const arr: ReferralRow[] = Array.isArray(tableData) ? tableData : [];
// //     //   setRows(arr);

// //     //   // 👇 NEW: sku-wise subset (14 rows)
// //     //   const skuwise = json?.skuwise_table_data ?? [];
// //     //   const skuArr: ReferralRow[] = Array.isArray(skuwise) ? skuwise : [];
// //     //   setSkuwiseRows(skuArr);

// //     //   // summary_table mapping
// //     //   const summary_table = json?.summary_table ?? [];
// //     //   const mappedSummary: FeeSummaryRow[] = Array.isArray(summary_table)
// //     //     ? summary_table.map(
// //     //       (r: any): FeeSummaryRow => ({
// //     //         label: r["Ref Fees"],
// //     //         // units: toNumberSafe(r["Units"]),
// //     //         units: Math.round(toNumberSafe(r["Units"])),
// //     //         sales: toNumberSafe(r["Sales"]),
// //     //         refFeesApplicable: toNumberSafe(r["Ref Fees Applicable"]),
// //     //         refFeesCharged: toNumberSafe(r["Ref Fees Charged"]),
// //     //         overcharged: toNumberSafe(r["Overcharged"]),
// //     //       })
// //     //     )
// //     //     : [];

// //     //   setFeeSummaryRows(mappedSummary);

// //     //   // aggregate summary from detailed rows (still using full table_data)
// //     //   let totalUnits = 0;
// //     //   let totalSales = 0;
// //     //   let feeImpact = 0;

// //     //   for (const r of arr) {
// //     //     totalUnits += Math.round(toNumberSafe(r.quantity));
// //     //     totalSales += toNumberSafe(r.product_sales ?? r.sales);
// //     //     feeImpact += toNumberSafe(r.overcharged ?? r.difference);
// //     //   }

// //     //   setSummary({
// //     //     ordersUnits: totalUnits,
// //     //     totalSales,
// //     //     feeImpact,
// //     //   });
// //     // } catch (e: any) {
// //     //   setError(e?.message || "Failed to load data");
// //     //   setRows([]);
// //     //   setSkuwiseRows([]);
// //     //   setFeeSummaryRows([]);
// //     //   setSummary({ ordersUnits: 0, totalSales: 0, feeImpact: 0 });
// //     // } finally {
// //     //   setLoading(false);
// //     // }

// //     try {
// //       const token =
// //         typeof window !== "undefined"
// //           ? localStorage.getItem("jwtToken")
// //           : null;

// //       const params = new URLSearchParams({
// //         country: country,
// //         month: month,
// //         year: year,
// //       });

// //       const url = `${baseURL}/get_table_data/${fileName}?${params.toString()}`;

// //       const res = await fetch(url, {
// //         method: "GET",
// //         headers: token ? { Authorization: `Bearer ${token}` } : {},
// //       });

// //       if (!res.ok) {
// //         throw new Error(`Failed to fetch referral data (${res.status})`);
// //       }

// //       const json: any = await res.json();
// //       console.log("REFERRAL JSON:", json);

// //       // 🔹 The backend now returns everything in `table`
// //       const table = json?.table ?? [];
// //       const arr: ReferralRow[] = Array.isArray(table) ? table : [];

// //       // Full raw rows (used for aggregations / excel)
// //       setRows(arr);

// //       // For product-wise table, we start from the same `arr`
// //       setSkuwiseRows(arr);

// //       // 🔹 Build summary rows from SKUs that start with "Charge -"
// //       //    plus the "Grand Total" row
// //       const summarySource = arr.filter((r) => {
// //         const sku = String(r.sku ?? "");
// //         return sku.startsWith("Charge -") || sku === "Grand Total";
// //       });

// //       // Enforce a nice fixed order if present
// //       const order = [
// //         "Charge - Accurate",
// //         "Charge - Undercharged",
// //         "Charge - Overcharged",
// //         "Charge - noreferallfee",
// //         "Grand Total",
// //       ];

// //       summarySource.sort((a, b) => {
// //         const aSku = String(a.sku ?? "");
// //         const bSku = String(b.sku ?? "");
// //         const ai = order.indexOf(aSku);
// //         const bi = order.indexOf(bSku);
// //         if (ai === -1 && bi === -1) return 0;
// //         if (ai === -1) return 1;
// //         if (bi === -1) return -1;
// //         return ai - bi;
// //       });

// //       const mappedSummary: FeeSummaryRow[] = summarySource.map(
// //         (r: ReferralRow): FeeSummaryRow => ({
// //           // use SKU as the label in the Summary Overview table
// //           label: String(r.sku ?? ""),

// //           // units = quantity
// //           units: Math.round(toNumberSafe(r.quantity)),

// //           // sales: prefer product_sales, fallback to net_sales_total_value
// //           sales: toNumberSafe(
// //             r.product_sales ?? (r as any).net_sales_total_value
// //           ),

// //           // Ref Fees Applicable = answer
// //           refFeesApplicable: toNumberSafe(r.answer),

// //           // Ref Fees Charged = selling_fees
// //           refFeesCharged: toNumberSafe(r.selling_fees),

// //           // Overcharged = difference (can be 0 or negative for undercharged)
// //           overcharged: toNumberSafe(r.difference),
// //         })
// //       );

// //       setFeeSummaryRows(mappedSummary);

// //       // 🔹 Aggregate summary from detailed rows (you don't
// //       // actually use `summary` in JSX but leaving logic as-is)
// //       let totalUnits = 0;
// //       let totalSales = 0;
// //       let feeImpact = 0;

// //       for (const r of arr) {
// //         totalUnits += Math.round(toNumberSafe(r.quantity));
// //         totalSales += toNumberSafe(r.product_sales ?? r.sales);
// //         feeImpact += toNumberSafe(r.overcharged ?? r.difference);
// //       }

// //       setSummary({
// //         ordersUnits: totalUnits,
// //         totalSales,
// //         feeImpact,
// //       });
// //     } catch (e: any) {
// //       setError(e?.message || "Failed to load data");
// //       setRows([]);
// //       setSkuwiseRows([]);
// //       setFeeSummaryRows([]);
// //       setSummary({ ordersUnits: 0, totalSales: 0, feeImpact: 0 });
// //     } finally {
// //       setLoading(false);
// //     }

// //   }, [month, year, country, fileName]);

// //   useEffect(() => {
// //     fetchReferralData();
// //   }, [fetchReferralData]);

// //   /* ===================== Derived from summary_table ===================== */

// //   const totalFeeRow = useMemo<FeeSummaryRow | null>(() => {
// //     if (!feeSummaryRows.length) return null;
// //     const total =
// //       feeSummaryRows.find(
// //         (r) => r.label && r.label.toLowerCase() === "total"
// //       ) || feeSummaryRows[feeSummaryRows.length - 1];
// //     return total || null;
// //   }, [feeSummaryRows]);

// //   const cardSummary = useMemo(
// //     () => ({
// //       ordersUnits: totalFeeRow?.units ?? 0,
// //       totalSales: totalFeeRow?.sales ?? 0,
// //       feeImpact: totalFeeRow?.overcharged ?? 0,
// //     }),
// //     [totalFeeRow]
// //   );

// //   const feeDonuts = useMemo(() => {
// //     if (!totalFeeRow) {
// //       return [
// //         { label: "Fees Applicable", pct: 0, amount: 0 },
// //         { label: "Fees Charged", pct: 0, amount: 0 },
// //         { label: "Overcharged", pct: 0, amount: 0 },
// //       ];
// //     }

// //     const sales = totalFeeRow.sales || 0;
// //     const applicable = totalFeeRow.refFeesApplicable || 0;
// //     const charged = totalFeeRow.refFeesCharged || 0;
// //     const overcharged = totalFeeRow.overcharged || 0;

// //     const applicablePct = sales ? (applicable / sales) * 100 : 0;
// //     const chargedPct = sales ? (charged / sales) * 100 : 0;
// //     // const overchargedPct = charged ? (overcharged / charged) * 100 : 0;
// //     const overchargedPct = (applicablePct - chargedPct) ;

// //     return [
// //       {
// //         label: "Fees Applicable",
// //         pct: applicablePct,
// //         amount: applicable,
// //       },
// //       {
// //         label: "Fees Charged",
// //         pct: chargedPct,
// //         amount: charged,
// //       },
// //       {
// //         label: "Overcharged",
// //         pct: overchargedPct,
// //         amount: overcharged,
// //       },
// //     ];
// //   }, [totalFeeRow]);

// // const summaryTableRows: Row[] = useMemo(() => {
// //   return feeSummaryRows.map((r, index) => ({
// //     label: r.label,
// //     units: r.units,
// //     sales: r.sales,
// //     refFeesApplicable: r.refFeesApplicable,
// //     refFeesCharged: r.refFeesCharged,
// //     overcharged: r.overcharged,
// //     // mark last row as total for styling
// //     _isTotal: index === feeSummaryRows.length - 1,
// //   })) as Row[];
// // }, [feeSummaryRows]);


// //   /* ===================== Product-wise Overcharged Rows (for Excel) ===================== */

// //   const overchargedRows = useMemo<ProductOverchargeRow[]>(() => {
// //     if (!rows.length) return [];

// //     const grouped = new Map<string, ProductOverchargeRow>();

// //     rows.forEach((r) => {
// //       const over = toNumberSafe(r.overcharged ?? r.difference);
// //       if (over <= 0) return; // skip rows without positive overcharge

// //       const sku = String(r.sku ?? "");
// //       const productName = String(r.product_name ?? "");
// //       const quantity = Math.round(toNumberSafe(r.quantity)); // units as whole numbers
// //       const sales = toNumberSafe(r.product_sales ?? r.sales);
// //       const applicable = toNumberSafe(r.answer);
// //       const charged = toNumberSafe(r.selling_fees);
// //       const total = toNumberSafe((r as any).total);

// //       const existing = grouped.get(sku);

// //       if (!existing) {
// //         grouped.set(sku, {
// //           sku,
// //           productName,
// //           quantity,
// //           sales,
// //           refRate: 0, // will compute later
// //           refFeesApplicable: applicable,
// //           refFeesCharged: charged,
// //           overcharged: over,
// //           total,
// //         });
// //       } else {
// //         existing.quantity += quantity;
// //         existing.sales += sales;
// //         existing.refFeesApplicable += applicable;
// //         existing.refFeesCharged += charged;
// //         existing.overcharged += over;
// //         existing.total += total;
// //       }
// //     });

// //     // compute Ref % per SKU from aggregated values
// //     return Array.from(grouped.values()).map((item) => ({
// //       ...item,
// //       refRate: item.sales ? (item.refFeesApplicable / item.sales) * 100 : 0,
// //     }));
// //   }, [rows]);

// //   // FULL table (all rows from skuwise_table_data)
// //   // const skuTableAll: Row[] = useMemo(() => {
// //   //   return skuwiseRows.map((r, idx) => {
// //   //     const quantity = Math.round(toNumberSafe(r.quantity));
// //   //     const sales = toNumberSafe(r.product_sales ?? r.sales);
// //   //     const applicable = toNumberSafe(r.answer);
// //   //     const charged = toNumberSafe(r.selling_fees);
// //   //     const overcharged = toNumberSafe(r.overcharged ?? r.difference);

// //   //     // Detect TOTAL row (by SKU or by being last row)
// //   //     const isTotal =
// //   //       String(r.sku ?? "").toUpperCase() === "TOTAL" ||
// //   //       idx === skuwiseRows.length - 1;

// //   //     return {
// //   //       sku: isTotal ? "TOTAL" : (r.sku ?? ""),
// //   //       productName: isTotal ? "" : (r.product_name ?? ""),
// //   //       units: quantity,
// //   //       sales,
// //   //       applicable,
// //   //       charged,
// //   //       overcharged,
// //   //       _isTotal: isTotal,
// //   //     };
// //   //   });
// //   // }, [skuwiseRows]);

// //   // FULL table (all product rows + Grand Total) based on new `table`
// //   const skuTableAll: Row[] = useMemo(() => {
// //     if (!skuwiseRows.length) return [];

// //     // 🔹 Exclude the charge summary rows, but keep "Grand Total"
// //     const filtered = skuwiseRows.filter((r) => {
// //       const skuStr = String(r.sku ?? "");
// //       if (skuStr === "Grand Total") return true;
// //       return !skuStr.startsWith("Charge -");
// //     });

// //     return filtered.map((r, idx) => {
// //       const quantity = Math.round(toNumberSafe(r.quantity));
// //       const sales = toNumberSafe(r.product_sales ?? r.sales);
// //       const applicable = toNumberSafe(r.answer);
// //       const charged = toNumberSafe(r.selling_fees);
// //       const overcharged = toNumberSafe(r.overcharged ?? r.difference);

// //       const skuStr = String(r.sku ?? "");
// //       const isTotal = skuStr.toLowerCase() === "grand total";

// //       return {
// //         sku: isTotal ? "Grand Total" : (r.sku ?? ""),
// //         productName: isTotal ? "" : (r.product_name ?? ""),
// //         units: quantity,
// //         sales,
// //         applicable,
// //         charged,
// //         overcharged,
// //         _isTotal: isTotal,
// //       };
// //     });
// //   }, [skuwiseRows]);


// //   // Columns for DataTable (SKU-wise overcharged)
// //   const skuColumns: ColumnDef<Row>[] = [
// //     { key: "sku", header: "SKU" },
// //     { key: "productName", header: "Product Name" },
// //     { key: "units", header: "Units" },
// //     { key: "sales", header: "Sales", render: (_, v) => fmtCurrency(Number(v)) },
// //     // { key: "refPct", header: "Ref %", render: (_, v) => `${Number(v).toFixed(2)}%` },
// //     { key: "applicable", header: "Ref Fees Applicable", render: (_, v) => fmtCurrency(Number(v)) },
// //     { key: "charged", header: "Ref Fees Charged", render: (_, v) => fmtCurrency(Number(v)) },
// //     {
// //       key: "overcharged", header: "Overcharged", render: (_, v) => (
// //         <span >{fmtCurrency(Number(v))}</span>
// //       )
// //     },
// //   ];

// //   const summaryColumns: ColumnDef<Row>[] = [
// //   { key: "label", header: "Ref. Fees" },
// //   {
// //     key: "units",
// //     header: "Units",
// //     render: (_, v) => fmtInteger(Number(v)),
// //   },
// //   {
// //     key: "sales",
// //     header: "Sales",
// //     render: (_, v) => fmtCurrency(Number(v)),
// //   },
// //   {
// //     key: "refFeesApplicable",
// //     header: "Ref Fees Applicable",
// //     render: (_, v) => fmtCurrency(Number(v)),
// //   },
// //   {
// //     key: "refFeesCharged",
// //     header: "Ref Fees Charged",
// //     render: (_, v) => fmtCurrency(Number(v)),
// //   },
// //   {
// //     key: "overcharged",
// //     header: "Overcharged",
// //     render: (_, v) => fmtCurrency(Number(v)),
// //   },
// // ];


// //   // TOP 5 by Sales for display in browser table
// //   // const skuTableTop5: Row[] = useMemo(() => {
// //   //   if (!skuTableAll.length) return [];

// //   //   // ❌ exclude TOTAL row
// //   //   const nonTotal = skuTableAll.filter((row) => !(row as any)._isTotal);

// //   //   // sort by Sales
// //   //   const sorted = [...nonTotal].sort(
// //   //     (a, b) =>
// //   //       toNumberSafe((b as any).sales) - toNumberSafe((a as any).sales)
// //   //   );

// //   //   // return only TOP 5 rows (no TOTAL)
// //   //   return sorted.slice(0, 5);
// //   // }, [skuTableAll]);

// //   // Top 5 + OTHERS + TOTAL for browser table
// //   const skuTableDisplay: Row[] = useMemo(() => {
// //     if (!skuTableAll.length) return [];

// //     // Separate non-total rows and the total row
// //     const nonTotal = skuTableAll.filter((row) => !(row as any)._isTotal);
// //     const totalRow = skuTableAll.find((row) => (row as any)._isTotal) || null;

// //     if (!nonTotal.length) {
// //       // Only total row exists
// //       return totalRow ? [totalRow] : [];
// //     }

// //     // Sort non-total rows by Sales (desc)
// //     const sorted = [...nonTotal].sort(
// //       (a, b) =>
// //         toNumberSafe((b as any).sales) - toNumberSafe((a as any).sales)
// //     );

// //     // Top 5 rows
// //     const top5 = sorted.slice(0, 5);

// //     // Remaining rows → OTHERS
// //     const remaining = sorted.slice(5);
// //     let othersRow: Row | null = null;

// //     if (remaining.length) {
// //       type NumericAgg = {
// //         units: number;
// //         sales: number;
// //         applicable: number;
// //         charged: number;
// //         overcharged: number;
// //       };

// //       const agg = remaining.reduce<NumericAgg>(
// //         (acc, row) => {
// //           acc.units += Math.round(toNumberSafe((row as any).units));
// //           acc.sales += toNumberSafe((row as any).sales);
// //           acc.applicable += toNumberSafe((row as any).applicable);
// //           acc.charged += toNumberSafe((row as any).charged);
// //           acc.overcharged += toNumberSafe((row as any).overcharged);
// //           return acc;
// //         },
// //         {
// //           units: 0,
// //           sales: 0,
// //           applicable: 0,
// //           charged: 0,
// //           overcharged: 0,
// //         }
// //       );

// //       othersRow = {
// //         sku: "OTHERS",
// //         productName: "",
// //         units: agg.units,
// //         sales: agg.sales,
// //         applicable: agg.applicable,
// //         charged: agg.charged,
// //         overcharged: agg.overcharged,
// //         _isOthers: true,
// //       } as Row;
// //     }

// //     const finalRows: Row[] = [...top5];

// //     if (othersRow) {
// //       finalRows.push(othersRow);
// //     }

// //     if (totalRow) {
// //       finalRows.push(totalRow);
// //     }

// //     return finalRows;
// //   }, [skuTableAll]);

// //   /* ===================== Excel Download ===================== */
// //   // const handleDownloadExcel = useCallback(() => {
// //   //   if (!skuTableAll.length) return;

// //   //   const wb = XLSX.utils.book_new();

// //   //   // Sheet 1: Overcharged Ref Fees (FULL TABLE)
// //   //   const overData = skuTableAll.map((r) => {
// //   //     const units = Math.round(toNumberSafe((r as any).units));
// //   //     const sales = toNumberSafe((r as any).sales);
// //   //     const applicable = toNumberSafe((r as any).applicable);
// //   //     const charged = toNumberSafe((r as any).charged);
// //   //     const overcharged = toNumberSafe((r as any).overcharged);

// //   //     return {
// //   //       SKU: String(r.sku ?? ""),
// //   //       "Product Name": String(r.productName ?? ""),
// //   //       Units: units,
// //   //       Sales: Number(sales.toFixed(2)),
// //   //       "Ref Fees Applicable": Number(applicable.toFixed(2)),
// //   //       "Ref Fees Charged": Number(charged.toFixed(2)),
// //   //       Overcharged: Number(overcharged.toFixed(2)),
// //   //     };
// //   //   });

// //   //   const wsOver = XLSX.utils.json_to_sheet(overData);
// //   //   XLSX.utils.book_append_sheet(wb, wsOver, "Overcharged Ref Fees");

// //   //   // Sheet 2: All raw data (unchanged)
// //   //   const allData = rows.map((r) => ({ ...r }));
// //   //   const wsAll = XLSX.utils.json_to_sheet(allData);
// //   //   XLSX.utils.book_append_sheet(wb, wsAll, "All Data");

// //   //   XLSX.writeFile(
// //   //     wb,
// //   //     `Referral-Fees-${country}-${month}-${year}.xlsx`
// //   //   );
// //   // }, [skuTableAll, rows, country, month, year]);




// //   // const skuTableData: Row[] = skuwiseRows.map((r, idx) => {
// //   //   const quantity = Math.round(toNumberSafe(r.quantity));
// //   //   const sales = toNumberSafe(r.product_sales ?? r.sales);
// //   //   const applicable = toNumberSafe(r.answer);
// //   //   const charged = toNumberSafe(r.selling_fees);
// //   //   const overcharged = toNumberSafe(r.overcharged ?? r.difference);

// //   //   const refPct = sales ? (applicable / sales) * 100 : 0;

// //   //   // Detect TOTAL row (either by value or by position)
// //   //   const isTotal =
// //   //     String(r.sku ?? "").toUpperCase() === "TOTAL" ||
// //   //     idx === skuwiseRows.length - 1;

// //   //   return {
// //   //     sku: isTotal ? "TOTAL" : (r.sku ?? ""),
// //   //     productName: isTotal ? "" : (r.product_name ?? ""), 
// //   //     units: quantity,
// //   //     sales,
// //   //     // refPct,
// //   //     applicable,
// //   //     charged,
// //   //     overcharged,
// //   //     _isTotal: isTotal,   // 👈 helper flag for styling
// //   //   };
// //   // });

// //   const handleDownloadExcel = useCallback(() => {
// //     // If literally nothing to export, bail out
// //     if (!feeSummaryRows.length && !skuTableAll.length && !rows.length) return;

// //     const wb = XLSX.utils.book_new();

// //     /* ========== Sheet 1: Summary table (Summary Overview) ========== */
// //     const summaryData = feeSummaryRows.map((r) => {
// //       const units = Math.round(toNumberSafe(r.units));
// //       const sales = toNumberSafe(r.sales);
// //       const applicable = toNumberSafe(r.refFeesApplicable);
// //       const charged = toNumberSafe(r.refFeesCharged);
// //       const overcharged = toNumberSafe(r.overcharged);

// //       return {
// //         "Ref Fees": r.label,
// //         Units: units,
// //         Sales: Number(sales.toFixed(2)),
// //         "Ref Fees Applicable": Number(applicable.toFixed(2)),
// //         "Ref Fees Charged": Number(charged.toFixed(2)),
// //         Overcharged: Number(overcharged.toFixed(2)),
// //       };
// //     });

// //     const wsSummary = XLSX.utils.json_to_sheet(summaryData);
// //     XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

// //     /* ========== Sheet 2: Product-wise Overcharged Ref Fees (FULL TABLE) ========== */
// //     const overData = skuTableAll.map((r) => {
// //       const units = Math.round(toNumberSafe((r as any).units));
// //       const sales = toNumberSafe((r as any).sales);
// //       const applicable = toNumberSafe((r as any).applicable);
// //       const charged = toNumberSafe((r as any).charged);
// //       const overcharged = toNumberSafe((r as any).overcharged);

// //       return {
// //         SKU: String((r as any).sku ?? ""),
// //         "Product Name": String((r as any).productName ?? ""),
// //         Units: units,
// //         Sales: Number(sales.toFixed(2)),
// //         "Ref Fees Applicable": Number(applicable.toFixed(2)),
// //         "Ref Fees Charged": Number(charged.toFixed(2)),
// //         Overcharged: Number(overcharged.toFixed(2)),
// //       };
// //     });

// //     const wsOver = XLSX.utils.json_to_sheet(overData);
// //     XLSX.utils.book_append_sheet(wb, wsOver, "Overcharged Ref Fees");

// //     /* ========== Sheet 3: All raw data (unchanged) ========== */
// //     const allData = rows.map((r) => ({ ...r }));
// //     const wsAll = XLSX.utils.json_to_sheet(allData);
// //     XLSX.utils.book_append_sheet(wb, wsAll, "All Data");

// //     /* ========== Save file ========== */
// //     XLSX.writeFile(
// //       wb,
// //       `Referral-Fees-${country}-${month}-${year}.xlsx`
// //     );
// //   }, [feeSummaryRows, skuTableAll, rows, country, month, year]);


// //   /* ===================== RENDER ===================== */

// //   return (
// //     <div className="p-4 space-y-4 font-sans text-[#414042]">
// //       {/* Top bar */}
// //       {/* <div className="flex gap-2">
// //         <PageBreadcrumb pageTitle="Referral Fees -" variant="page" align="left" textSize="2xl" />
// //         <span className="text-[#5EA68E] text-2xl">
// //           {country.toUpperCase()}
// //         </span>
// //       </div> */}

// //       <div className="flex items-baseline gap-2">
// //         <PageBreadcrumb
// //           pageTitle="Referral Fees -"
// //           variant="page"
// //           align="left"
// //           textSize="2xl"
// //           className="mb-0"
// //         />
// //         <span className="text-[#5EA68E] text-xl sm:text-2xl">
// //           {country.toUpperCase()}
// //         </span>
// //       </div>


// //       {/* Filter row */}
// //       {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-3"> */}
// //       <div className="flex flex-col md:flex-row items-center justify-between gap-[0.5vw]">
// //         <MonthYearPickerTable
// //           month={month}
// //           year={year}
// //           yearOptions={[
// //             new Date().getFullYear(),
// //             new Date().getFullYear() - 1,
// //           ]}
// //           onMonthChange={(v) => setMonth(v)}
// //           onYearChange={(v) => setYear(v)}
// //           valueMode="lower"
// //         />
// //       </div>

// //       {/* Loading / Error */}
// //       {loading && (
// //         <div className="text-sm text-slate-600">Loading data…</div>
// //       )}
// //       {!loading && error && (
// //         <div className="text-sm text-red-600">Error: {error}</div>
// //       )}

// //       {/* <h3 className="text-sm font-semibold mb-2">Summary Overview</h3> */}

// //       <PageBreadcrumb pageTitle="Summary Overview" variant="page" align="left" className="mt-4" />

// //       {/* Summary tiles */}
// //       {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
// //         <div className="bg-white rounded-2xl shadow p-4 text-center">
// //           <p className="text-sm text-gray-500">Orders Units</p>
// //           <p className="text-3xl font-bold text-emerald-700">
// //             {fmtInteger(cardSummary.ordersUnits)}
// //           </p>

// //         </div>
// //         <div className="bg-white rounded-2xl shadow p-4 text-center">
// //           <p className="text-sm text-gray-500">Total Sales</p>
// //           <p className="text-3xl font-bold text-amber-600">
// //             {fmtCurrency(cardSummary.totalSales)}
// //           </p>
// //         </div>
// //         <div className="bg-white rounded-2xl shadow p-4 text-center">
// //           <p className="text-sm text-gray-500">Fee Impact</p>
// //           <p className="text-3xl font-bold text-rose-600">
// //             {fmtCurrency(cardSummary.feeImpact)}
// //           </p>
// //         </div>
// //       </div> */}

// //       {/* Summary tiles */}
// //       {/* Summary tiles */}
// //       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

// //         {/* Orders / Units */}
// //         <div className="
// //       rounded-xl border border-[#87AD12] bg-[#87AD1226]
// //       px-3 py-2 sm:px-4 sm:py-3
// //     ">
// //           <p className="text-xs sm:text-sm font-medium text-charcoal-500">
// //             Orders/Units
// //           </p>

// //           <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
// //             {fmtInteger(cardSummary.ordersUnits)}
// //           </p>

// //           <p className="mt-1 text-[10px] sm:text-xs text-charcoal-500">
// //             Total Units Processed
// //           </p>
// //         </div>

// //         {/* Total Sales */}
// //         <div className="
// //       rounded-xl border border-[#F47A00] bg-[#F47A0026]
// //       px-3 py-2 sm:px-4 sm:py-3
// //     ">
// //           <p className="text-xs sm:text-sm font-medium text-charcoal-500">
// //             Total Sales
// //           </p>

// //           <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
// //             {fmtCurrency(cardSummary.totalSales)}
// //           </p>

// //           <p className="mt-1 text-[10px] sm:text-xs text-charcoal-500">
// //             Revenue generated
// //           </p>
// //         </div>

// //         {/* Fee Impact */}
// //         <div className="
// //       rounded-xl border border-[#FF5C5C] bg-[#FF5C5C26]
// //       px-3 py-2 sm:px-4 sm:py-3
// //     ">
// //           <p className="text-xs sm:text-sm font-medium text-charcoal-500">
// //             Fee Impact
// //           </p>

// //           <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
// //             {fmtCurrency(cardSummary.feeImpact)}
// //           </p>

// //           <p className="mt-1 text-[10px] sm:text-xs text-charcoal-500">
// //             Overcharged amount
// //           </p>
// //         </div>

// //       </div>



// //       {/* Summary Overview table */}
// //       {/* <div className="bg-white rounded-2xl shadow p-4 overflow-x-auto">
// //         <table className="min-w-[720px] w-full text-xs md:text-sm whitespace-nowrap">
// //           <thead className="text-charcoal-500 border-b-[1px] border-charcoal-500">
// //             <tr className="font-black">
// //               <th className="text-left py-3 px-3">Ref. Fees</th>
// //               <th className="text-left py-3 px-3">Units</th>
// //               <th className="text-left py-3 px-3">Sales</th>
// //               <th className="text-left py-3 px-3">Ref Fees Applicable</th>
// //               <th className="text-left py-3 px-3">Ref Fees Charged</th>
// //               <th className="text-left py-3 px-3">Overcharged</th>
// //             </tr>
// //           </thead>

// //           <tbody>
// //             {feeSummaryRows.map((r: FeeSummaryRow, index) => {
// //               const isLast = index === feeSummaryRows.length - 1;
// //               const isSecondLast = index === feeSummaryRows.length - 2;

// //               return (
// //                 <tr
// //                   key={r.label}
// //                   className={`${isLast || isSecondLast
// //                     ? "border-b-[2.5px] border-charcoal-500"
// //                     : "border-b-[1px] border-charcoal-500"
// //                     }`}
// //                 >
// //                   <td className={`py-2 px-3 ${isLast ? "font-black" : ""}`}>
// //                     {r.label}
// //                   </td>
// //                   <td className={`py-2 px-3 ${isLast ? "font-black" : ""}`}>
// //                     {fmtInteger(r.units)}
// //                   </td>
// //                   <td className={`py-2 px-3 ${isLast ? "font-black" : ""}`}>
// //                     {fmtCurrency(r.sales)}
// //                   </td>
// //                   <td className={`py-2 px-3 ${isLast ? "font-black" : ""}`}>
// //                     {fmtCurrency(r.refFeesApplicable)}
// //                   </td>
// //                   <td className={`py-2 px-3 ${isLast ? "font-black" : ""}`}>
// //                     {fmtCurrency(r.refFeesCharged)}
// //                   </td>
// //                   <td className={`py-2 px-3 ${isLast ? "font-black" : ""}`}>
// //                     {fmtCurrency(r.overcharged)}
// //                   </td>
// //                 </tr>
// //               );
// //             })}

// //             {!feeSummaryRows.length && (
// //               <tr>
// //                 <td
// //                   colSpan={6}
// //                   className="py-4 px-3 text-center text-slate-500 italic"
// //                 >
// //                   No summary available.
// //                 </td>
// //               </tr>
// //             )}
// //           </tbody>
// //         </table>
// //       </div> */}

        
// // {/* Summary Overview table using DataTable */}
// // <div className="bg-white rounded-2xl shadow p-4 overflow-x-auto">
// //   {summaryTableRows.length ? (
// //     <div className="[&_table]:w-full [&_th]:text-center [&_td]:text-center [&_tr:hover]:bg-transparent">
// //       <DataTable
// //         columns={summaryColumns}
// //         data={summaryTableRows}
// //         paginate={false}
// //         scrollY={false}
// //         maxHeight="none"
// //         zebra={false}
// //         stickyHeader={false}
// //         rowClassName={(row) =>
// //           (row as any)._isTotal ? "font-black border-t-2 border-charcoal-500" : ""
// //         }
// //       />
// //     </div>
// //   ) : (
// //     <div className="py-4 text-center text-slate-500 italic text-sm">
// //       No summary available.
// //     </div>
// //   )}
// // </div>



// //       {/* Donuts */}
// //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
// //         {feeDonuts.map((d, index) => (
// //           <Donut
// //             key={d.label}
// //             label={d.label}
// //             pct={Number.isFinite(d.pct) ? d.pct : 0}
// //             amount={d.amount}
// //             color={donutColors[index % donutColors.length]}
// //           />
// //         ))}
// //       </div>


// //       {/* ✅ SKU-wise table using skuwise_table_data */}
// //       <div className="bg-white rounded-2xl shadow p-4 w-full overflow-x-auto">
// //   <div className="flex flex-col md:flex-row items-center justify-between mb-2 gap-2 min-w-max">
// //     <PageBreadcrumb
// //       pageTitle="Product-wise Details of Overcharged Ref Fees"
// //       variant="page"
// //       align="left"
// //       className="mt-4"
// //     />

// //     <Button
// //       size="sm"
// //       onClick={handleDownloadExcel}
// //       variant="primary"
// //       endIcon={<FiDownload className="text-yellow-200" />}
// //     >
// //       Download (.xlsx)
// //     </Button>
// //   </div>

// //   {/* wrapper that centers all table text */}
// //   <div className="[&_table]:w-full [&_th]:text-center [&_td]:text-center">
// //     <DataTable
// //       columns={skuColumns}
// //       data={skuTableDisplay}
// //       paginate={false}
// //       scrollY={false}
// //       maxHeight="none"
// //       zebra={true}
// //       stickyHeader={false}
// //       rowClassName={(row) => {
// //         if ((row as any)._isTotal) return "bg-[#DDDDDD] font-bold";
// //         if ((row as any)._isOthers) return "bg-[#F5F5F5] font-semibold";
// //         return "";
// //       }}
// //     />
// //   </div>
// // </div>

// //     </div>
// //   );
// // }











































































// "use client";

// import React, {
//   useEffect,
//   useMemo,
//   useState,
//   type JSX,
//   useCallback,
// } from "react";
// import MonthYearPickerTable from "@/components/filters/MonthYearPickerTable";
// import { FiDownload } from "react-icons/fi";
// import { Doughnut } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
// import { jwtDecode } from "jwt-decode";
// import * as XLSX from "xlsx";
// import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// import DataTable, { ColumnDef, Row } from "@/components/ui/table/DataTable";
// import Button from "@/components/ui/button/Button";
// import Loader from "@/components/loader/Loader"; // 👈 NEW
// import DownloadButton from "@/components/ui/button/DownloadIconButton";

// ChartJS.register(ArcElement, Tooltip, Legend);

// /* ===================== ENV / CONSTANTS ===================== */
// const baseURL =
//   process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

// /* ===================== Types ===================== */
// interface DonutProps {
//   label: string;
//   pct: number;
//   amount: number;
//   color?: string;
// }

// type ReferralRow = Partial<{
//   sku: string;
//   product_name: string;
//   category: string;
//   asin: string;
//   quantity: number | string;
//   sales: number | string;
//   product_sales: number | string;
//   refRate: number | string;
//   refFeesApplicable: number | string;
//   refFeesCharged: number | string;
//   overcharged: number | string;
//   difference: number | string;
//   errorstatus: string;
//   selling_fees: number | string;
//   answer: number | string;

//   // NEW from backend:
//   net_sales_total_value: number | string;
//   status: string;
//   total_value: number | string;
// }>;

// type Summary = {
//   ordersUnits: number;
//   totalSales: number;
//   feeImpact: number;
// };

// type FeeSummaryRow = {
//   label: string;
//   units: number;
//   sales: number;
//   refFeesApplicable: number;
//   refFeesCharged: number;
//   overcharged: number;
// };

// type ProductOverchargeRow = {
//   sku: string;
//   productName: string;
//   quantity: number;
//   sales: number;
//   refRate: number;
//   refFeesApplicable: number;
//   refFeesCharged: number;
//   overcharged: number;
//   total: number;
// };

// /* ===================== Formatters ===================== */
// const fmtCurrency = (n: number): string =>
//   typeof n === "number"
//     ? n.toLocaleString(undefined, {
//         style: "currency",
//         currency: "GBP",
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//       })
//     : "-";

// const fmtNumber = (n: number): string =>
//   typeof n === "number"
//     ? n.toLocaleString(undefined, {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//       })
//     : "-";

// const fmtInteger = (n: number): string =>
//   typeof n === "number"
//     ? n.toLocaleString(undefined, {
//         maximumFractionDigits: 0,
//         minimumFractionDigits: 0,
//       })
//     : "-";

// const toNumberSafe = (v: any): number => {
//   if (v === null || v === undefined) return 0;
//   if (typeof v === "number") return v;
//   const num = Number(String(v).replace(/[, ]+/g, ""));
//   return Number.isNaN(num) ? 0 : num;
// };

// /* ===================== Donut Component ===================== */
// function Donut({ label, pct, amount, color = "#60A68E" }: DonutProps) {
//   const data = {
//     labels: [label, "Remaining"],
//     datasets: [
//       {
//         data: [pct, Math.max(0, 100 - pct)],
//         backgroundColor: [color, "#e5e7eb"],
//         borderWidth: 0,
//       },
//     ],
//   };

//   const options = {
//     cutout: "70%",
//     plugins: {
//       legend: { display: false },
//       tooltip: { enabled: false }, // no tooltips
//     },
//     hover: {
//       mode: undefined as any,
//     },
//     maintainAspectRatio: false,
//   } as const;

//   return (
//     <div className="bg-white rounded-2xl p-3 sm:p-4 flex flex-col items-center">
//       <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-2">
//         {label}
//       </h3>

//       <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36">
//         <Doughnut data={data} options={options} />
//       </div>

//       <p className="mt-2 text-lg sm:text-xl lg:text-2xl font-bold">
//         {Number.isFinite(pct) ? pct.toFixed(2) : 0}%
//       </p>

//       <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
//         {fmtCurrency(amount)}
//       </p>
//     </div>
//   );
// }

// const donutColors = ["#14B8A6", "#FB923C", "#EF4444"];

// /* ===================== MAIN DASHBOARD ===================== */
// export default function ReferralFeesDashboard(): JSX.Element {
//   // const [country] = useState<string>("UK");
//   // const [month, setMonth] = useState<string>("january");
//   // const [year, setYear] = useState<string>(
//   //   new Date().getFullYear().toString()
//   // );

//   const [country] = useState<string>("UK");
// const [month, setMonth] = useState<string>(""); // empty by default
// const [year, setYear] = useState<string>("");   // empty by default

//   // API data
//   const [rows, setRows] = useState<ReferralRow[]>([]);
//   const [skuwiseRows, setSkuwiseRows] = useState<ReferralRow[]>([]);
//   const [summary, setSummary] = useState<Summary>({
//     ordersUnits: 0,
//     totalSales: 0,
//     feeImpact: 0,
//   });
//   const [feeSummaryRows, setFeeSummaryRows] = useState<FeeSummaryRow[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [userId, setUserId] = useState<string>("unknown");
//   // const [error, setError] = useState<string | null>(null);
// const [error, setError] = useState<string | null>(
//   "Please select both month and year to view referral fees."
// );

//   /* ======= derive userId from JWT ======= */
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     const token = localStorage.getItem("jwtToken");
//     if (!token) return;
//     try {
//       const decoded: any = jwtDecode(token);
//       const id = decoded?.user_id?.toString() ?? "unknown";
//       setUserId(id);
//     } catch {
//       setUserId("unknown");
//     }
//   }, []);

//   /* ======= fileName ======= */
//   const fileName = useMemo(
//     () =>
//       `user_${userId}_${country.toLowerCase()}_${month}${year}_data`.toLowerCase(),
//     [userId, country, month, year]
//   );

//   /* ===================== API Fetch ===================== */
//   // const fetchReferralData = useCallback(async () => {
//   //   if (!month || !year || !country) return;
//   //   setLoading(true);
//   //   setError(null);

//   //   try {
//   //     const token =
//   //       typeof window !== "undefined"
//   //         ? localStorage.getItem("jwtToken")
//   //         : null;

//   //     const params = new URLSearchParams({
//   //       country: country,
//   //       month: month,
//   //       year: year,
//   //     });

//   //     const url = `${baseURL}/get_table_data/${fileName}?${params.toString()}`;

//   //     const res = await fetch(url, {
//   //       method: "GET",
//   //       headers: token ? { Authorization: `Bearer ${token}` } : {},
//   //     });

//   //     if (!res.ok) {
//   //       throw new Error(`Failed to fetch referral data (${res.status})`);
//   //     }

//   //     const json: any = await res.json();
//   //     console.log("REFERRAL JSON:", json);

//   //     const table = json?.table ?? [];
//   //     const arr: ReferralRow[] = Array.isArray(table) ? table : [];

//   //     setRows(arr);
//   //     setSkuwiseRows(arr);

//   //     const summarySource = arr.filter((r) => {
//   //       const sku = String(r.sku ?? "");
//   //       return sku.startsWith("Charge -") || sku === "Grand Total";
//   //     });

//   //     const order = [
//   //       "Charge - Accurate",
//   //       "Charge - Undercharged",
//   //       "Charge - Overcharged",
//   //       "Charge - noreferallfee",
//   //       "Grand Total",
//   //     ];

//   //     summarySource.sort((a, b) => {
//   //       const aSku = String(a.sku ?? "");
//   //       const bSku = String(b.sku ?? "");
//   //       const ai = order.indexOf(aSku);
//   //       const bi = order.indexOf(bSku);
//   //       if (ai === -1 && bi === -1) return 0;
//   //       if (ai === -1) return 1;
//   //       if (bi === -1) return -1;
//   //       return ai - bi;
//   //     });

//   //     const mappedSummary: FeeSummaryRow[] = summarySource.map(
//   //       (r: ReferralRow): FeeSummaryRow => ({
//   //         label: String(r.sku ?? ""),
//   //         units: Math.round(toNumberSafe(r.quantity)),
//   //         sales: toNumberSafe(
//   //           r.product_sales ?? (r as any).net_sales_total_value
//   //         ),
//   //         refFeesApplicable: toNumberSafe(r.answer),
//   //         refFeesCharged: toNumberSafe(r.selling_fees),
//   //         overcharged: toNumberSafe(r.difference),
//   //       })
//   //     );

//   //     setFeeSummaryRows(mappedSummary);

//   //     let totalUnits = 0;
//   //     let totalSales = 0;
//   //     let feeImpact = 0;

//   //     for (const r of arr) {
//   //       totalUnits += Math.round(toNumberSafe(r.quantity));
//   //       totalSales += toNumberSafe(r.product_sales ?? r.sales);
//   //       feeImpact += toNumberSafe(r.overcharged ?? r.difference);
//   //     }

//   //     setSummary({
//   //       ordersUnits: totalUnits,
//   //       totalSales,
//   //       feeImpact,
//   //     });
//   //   } catch (e: any) {
//   //     setError(e?.message || "Failed to load data");
//   //     setRows([]);
//   //     setSkuwiseRows([]);
//   //     setFeeSummaryRows([]);
//   //     setSummary({ ordersUnits: 0, totalSales: 0, feeImpact: 0 });
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // }, [month, year, country, fileName]);

// const fetchReferralData = useCallback(async () => {
//   // ⛔ Guard: month & year must be selected
//   if (!month || !year || !country) {
//     setError("Please select both month and year to view referral fees.");
//     return;
//   }

//   setLoading(true);
//   setError(null);

//   try {
//     const token =
//       typeof window !== "undefined"
//         ? localStorage.getItem("jwtToken")
//         : null;

//     const params = new URLSearchParams({
//       country: country,
//       month: month,
//       year: year,
//     });

//     const url = `${baseURL}/get_table_data/${fileName}?${params.toString()}`;

//     const res = await fetch(url, {
//       method: "GET",
//       headers: token ? { Authorization: `Bearer ${token}` } : {},
//     });

//     if (!res.ok) {
//       throw new Error(`Failed to fetch referral data (${res.status})`);
//     }

//     const json: any = await res.json();
//     // ... rest of your existing code stays the same


//   useEffect(() => {
//     fetchReferralData();
//   }, [fetchReferralData]);

//   /* ===================== Derived from summary_table ===================== */
//   const totalFeeRow = useMemo<FeeSummaryRow | null>(() => {
//     if (!feeSummaryRows.length) return null;
//     const total =
//       feeSummaryRows.find(
//         (r) => r.label && r.label.toLowerCase() === "total"
//       ) || feeSummaryRows[feeSummaryRows.length - 1];
//     return total || null;
//   }, [feeSummaryRows]);

//   const cardSummary = useMemo(
//     () => ({
//       ordersUnits: totalFeeRow?.units ?? 0,
//       totalSales: totalFeeRow?.sales ?? 0,
//       feeImpact: totalFeeRow?.overcharged ?? 0,
//     }),
//     [totalFeeRow]
//   );

//   const feeDonuts = useMemo(() => {
//     if (!totalFeeRow) {
//       return [
//         { label: "Fees Applicable", pct: 0, amount: 0 },
//         { label: "Fees Charged", pct: 0, amount: 0 },
//         { label: "Overcharged", pct: 0, amount: 0 },
//       ];
//     }

//     const sales = totalFeeRow.sales || 0;
//     const applicable = totalFeeRow.refFeesApplicable || 0;
//     const charged = totalFeeRow.refFeesCharged || 0;
//     const overcharged = totalFeeRow.overcharged || 0;

//     const applicablePct = sales ? (applicable / sales) * 100 : 0;
//     const chargedPct = sales ? (charged / sales) * 100 : 0;
//     const overchargedPct = Math.abs(applicablePct - chargedPct);


//     return [
//       {
//         label: "Fees Applicable",
//         pct: applicablePct,
//         amount: applicable,
//       },
//       {
//         label: "Fees Charged",
//         pct: chargedPct,
//         amount: charged,
//       },
//       {
//         label: "Overcharged",
//         pct: overchargedPct,
//         amount: overcharged,
//       },
//     ];
//   }, [totalFeeRow]);

//   const summaryTableRows: Row[] = useMemo(() => {
//     return feeSummaryRows.map((r, index) => ({
//       label: r.label,
//       units: r.units,
//       sales: r.sales,
//       refFeesApplicable: r.refFeesApplicable,
//       refFeesCharged: r.refFeesCharged,
//       overcharged: r.overcharged,
//       _isTotal: index === feeSummaryRows.length - 1,
//     })) as Row[];
//   }, [feeSummaryRows]);

//   /* ===================== Product-wise Overcharged Rows ===================== */
//   const overchargedRows = useMemo<ProductOverchargeRow[]>(() => {
//     if (!rows.length) return [];

//     const grouped = new Map<string, ProductOverchargeRow>();

//     rows.forEach((r) => {
//       const over = toNumberSafe(r.overcharged ?? r.difference);
//       if (over <= 0) return;

//       const sku = String(r.sku ?? "");
//       const productName = String(r.product_name ?? "");
//       const quantity = Math.round(toNumberSafe(r.quantity));
//       const sales = toNumberSafe(r.product_sales ?? r.sales);
//       const applicable = toNumberSafe(r.answer);
//       const charged = toNumberSafe(r.selling_fees);
//       const total = toNumberSafe((r as any).total);

//       const existing = grouped.get(sku);

//       if (!existing) {
//         grouped.set(sku, {
//           sku,
//           productName,
//           quantity,
//           sales,
//           refRate: 0,
//           refFeesApplicable: applicable,
//           refFeesCharged: charged,
//           overcharged: over,
//           total,
//         });
//       } else {
//         existing.quantity += quantity;
//         existing.sales += sales;
//         existing.refFeesApplicable += applicable;
//         existing.refFeesCharged += charged;
//         existing.overcharged += over;
//         existing.total += total;
//       }
//     });

//     return Array.from(grouped.values()).map((item) => ({
//       ...item,
//       refRate: item.sales ? (item.refFeesApplicable / item.sales) * 100 : 0,
//     }));
//   }, [rows]);

//   const skuTableAll: Row[] = useMemo(() => {
//     if (!skuwiseRows.length) return [];

//     const filtered = skuwiseRows.filter((r) => {
//       const skuStr = String(r.sku ?? "");
//       if (skuStr === "Grand Total") return true;
//       return !skuStr.startsWith("Charge -");
//     });

//     return filtered.map((r) => {
//       const quantity = Math.round(toNumberSafe(r.quantity));
//       const sales = toNumberSafe(r.product_sales ?? r.sales);
//       const applicable = toNumberSafe(r.answer);
//       const charged = toNumberSafe(r.selling_fees);
//       const overcharged = toNumberSafe(r.overcharged ?? r.difference);

//       const skuStr = String(r.sku ?? "");
//       const isTotal = skuStr.toLowerCase() === "grand total";

//       return {
//         sku: isTotal ? "Grand Total" : (r.sku ?? ""),
//         productName: isTotal ? "" : (r.product_name ?? ""),
//         units: quantity,
//         sales,
//         applicable,
//         charged,
//         overcharged,
//         _isTotal: isTotal,
//       };
//     });
//   }, [skuwiseRows]);

//   const skuColumns: ColumnDef<Row>[] = [
//     { key: "sku", header: "SKU" },
//     { key: "productName", header: "Product Name" },
//     { key: "units", header: "Units" },
//     {
//       key: "sales",
//       header: "Sales",
//       render: (_, v) => fmtCurrency(Number(v)),
//     },
//     {
//       key: "applicable",
//       header: "Ref Fees Applicable",
//       render: (_, v) => fmtCurrency(Number(v)),
//     },
//     {
//       key: "charged",
//       header: "Ref Fees Charged",
//       render: (_, v) => fmtCurrency(Number(v)),
//     },
//     {
//       key: "overcharged",
//       header: "Overcharged",
//       render: (_, v) => <span>{fmtCurrency(Number(v))}</span>,
//     },
//   ];

//   const summaryColumns: ColumnDef<Row>[] = [
//     { key: "label", header: "Ref. Fees" },
//     {
//       key: "units",
//       header: "Units",
//       render: (_, v) => fmtInteger(Number(v)),
//     },
//     {
//       key: "sales",
//       header: "Sales",
//       render: (_, v) => fmtCurrency(Number(v)),
//     },
//     {
//       key: "refFeesApplicable",
//       header: "Ref Fees Applicable",
//       render: (_, v) => fmtCurrency(Number(v)),
//     },
//     {
//       key: "refFeesCharged",
//       header: "Ref Fees Charged",
//       render: (_, v) => fmtCurrency(Number(v)),
//     },
//     {
//       key: "overcharged",
//       header: "Overcharged",
//       render: (_, v) => fmtCurrency(Number(v)),
//     },
//   ];

//   const skuTableDisplay: Row[] = useMemo(() => {
//     if (!skuTableAll.length) return [];

//     const nonTotal = skuTableAll.filter((row) => !(row as any)._isTotal);
//     const totalRow = skuTableAll.find((row) => (row as any)._isTotal) || null;

//     if (!nonTotal.length) {
//       return totalRow ? [totalRow] : [];
//     }

//     const sorted = [...nonTotal].sort(
//       (a, b) =>
//         toNumberSafe((b as any).sales) - toNumberSafe((a as any).sales)
//     );

//     const top5 = sorted.slice(0, 5);
//     const remaining = sorted.slice(5);
//     let othersRow: Row | null = null;

//     if (remaining.length) {
//       type NumericAgg = {
//         units: number;
//         sales: number;
//         applicable: number;
//         charged: number;
//         overcharged: number;
//       };

//       const agg = remaining.reduce<NumericAgg>(
//         (acc, row) => {
//           acc.units += Math.round(toNumberSafe((row as any).units));
//           acc.sales += toNumberSafe((row as any).sales);
//           acc.applicable += toNumberSafe((row as any).applicable);
//           acc.charged += toNumberSafe((row as any).charged);
//           acc.overcharged += toNumberSafe((row as any).overcharged);
//           return acc;
//         },
//         {
//           units: 0,
//           sales: 0,
//           applicable: 0,
//           charged: 0,
//           overcharged: 0,
//         }
//       );

//       othersRow = {
//         sku: "OTHERS",
//         productName: "",
//         units: agg.units,
//         sales: agg.sales,
//         applicable: agg.applicable,
//         charged: agg.charged,
//         overcharged: agg.overcharged,
//         _isOthers: true,
//       } as Row;
//     }

//     const finalRows: Row[] = [...top5];

//     if (othersRow) finalRows.push(othersRow);
//     if (totalRow) finalRows.push(totalRow);

//     return finalRows;
//   }, [skuTableAll]);

//   const handleDownloadExcel = useCallback(() => {
//     if (!feeSummaryRows.length && !skuTableAll.length && !rows.length) return;

//     const wb = XLSX.utils.book_new();

//     // Sheet 1: Summary
//     const summaryData = feeSummaryRows.map((r) => {
//       const units = Math.round(toNumberSafe(r.units));
//       const sales = toNumberSafe(r.sales);
//       const applicable = toNumberSafe(r.refFeesApplicable);
//       const charged = toNumberSafe(r.refFeesCharged);
//       const overcharged = toNumberSafe(r.overcharged);

//       return {
//         "Ref Fees": r.label,
//         Units: units,
//         Sales: Number(sales.toFixed(2)),
//         "Ref Fees Applicable": Number(applicable.toFixed(2)),
//         "Ref Fees Charged": Number(charged.toFixed(2)),
//         Overcharged: Number(overcharged.toFixed(2)),
//       };
//     });

//     const wsSummary = XLSX.utils.json_to_sheet(summaryData);
//     XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

//     // Sheet 2: Overcharged Ref Fees
//     const overData = skuTableAll.map((r) => {
//       const units = Math.round(toNumberSafe((r as any).units));
//       const sales = toNumberSafe((r as any).sales);
//       const applicable = toNumberSafe((r as any).applicable);
//       const charged = toNumberSafe((r as any).charged);
//       const overcharged = toNumberSafe((r as any).overcharged);

//       return {
//         SKU: String((r as any).sku ?? ""),
//         "Product Name": String((r as any).productName ?? ""),
//         Units: units,
//         Sales: Number(sales.toFixed(2)),
//         "Ref Fees Applicable": Number(applicable.toFixed(2)),
//         "Ref Fees Charged": Number(charged.toFixed(2)),
//         Overcharged: Number(overcharged.toFixed(2)),
//       };
//     });

//     const wsOver = XLSX.utils.json_to_sheet(overData);
//     XLSX.utils.book_append_sheet(wb, wsOver, "Overcharged Ref Fees");

//     // Sheet 3: All Data
//     const allData = rows.map((r) => ({ ...r }));
//     const wsAll = XLSX.utils.json_to_sheet(allData);
//     XLSX.utils.book_append_sheet(wb, wsAll, "All Data");

//     XLSX.writeFile(wb, `Referral-Fees-${country}-${month}-${year}.xlsx`);
//   }, [feeSummaryRows, skuTableAll, rows, country, month, year]);

//   /* ===================== RENDER ===================== */
//   const canShowContent = !loading && !error && month && year;

//   return (
//     <div className="space-y-1.5 font-sans text-charcoal-500">
//       {/* Top bar */}
//       <div className="flex items-baseline gap-2">
//         <PageBreadcrumb
//           pageTitle="Referral Fees -"
//           variant="page"
//           align="left"
//           textSize="2xl"
//           className="mb-0 md:mb-2"
//         />
//         <span className="text-[#5EA68E] font-bold text-lg sm:text-2xl md:text-2xl">
//           {country.toUpperCase()}
//         </span>
//       </div>

//       {/* Filters */}
//       <div className="flex flex-col md:flex-row items-center justify-between ">
//         <MonthYearPickerTable
//           month={month}
//           year={year}
//           yearOptions={[
//             new Date().getFullYear(),
//             new Date().getFullYear() - 1,
//           ]}
//           onMonthChange={(v) => {
//             setMonth(v);
//             if (v && year) setError(null);
//           }}
//           onYearChange={(v) => {
//             setYear(v);
//             if (v && month) setError(null);
//           }}
//           valueMode="lower"
//         />
//       </div>

//       {/* Loading */}
//       {loading && (
//         <div className="flex flex-col items-center justify-center py-12 text-center">
//           <Loader
//             src="/infinity-unscreen.gif"
//             size={150}
//             transparent
//             roundedClass="rounded-none"
//             backgroundClass="bg-transparent"
//             respectReducedMotion
//           />
//         </div>
//       )}

//       {/* Error */}
//       {!loading && !!error && (
//         <div className="mt-5 box-border flex w-full items-center justify-between rounded-md border-t-4 border-[#ff5c5c] bg-[#f2f2f2] px-4 py-3 text-sm text-[#414042] lg:max-w-fit">
//           <div className="flex items-center">
//             <i className="fa-solid fa-circle-exclamation mr-2 text-lg text-[#ff5c5c]" />
//             <span>{error}</span>
//           </div>
//         </div>
//       )}

//       {/* MAIN CONTENT – only when month+year chosen and no error */}
//       {canShowContent && (
//         <>
//           <PageBreadcrumb
//             pageTitle="Summary Overview"
//             variant="page"
//             align="left"
//             className="mt-0 md:mt-4 mb-0 md:mb-2"
//           />

//           {/* Summary tiles */}
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//             <div className="rounded-xl border border-[#87AD12] bg-[#87AD1226] px-3 py-2 sm:px-4 sm:py-3">
//               <p className="text-xs sm:text-sm font-medium text-charcoal-500">
//                 Orders/Units
//               </p>
//               <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
//                 {fmtInteger(cardSummary.ordersUnits)}
//               </p>
//               <p className="mt-1 text-[10px] sm:text-xs text-charcoal-500">
//                 Total Units Processed
//               </p>
//             </div>

//             <div className="rounded-xl border border-[#F47A00] bg-[#F47A0026] px-3 py-2 sm:px-4 sm:py-3">
//               <p className="text-xs sm:text-sm font-medium text-charcoal-500">
//                 Total Sales
//               </p>
//               <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
//                 {fmtCurrency(cardSummary.totalSales)}
//               </p>
//               <p className="mt-1 text-[10px] sm:text-xs text-charcoal-500">
//                 Revenue generated
//               </p>
//             </div>

//             <div className="rounded-xl border border-[#FF5C5C] bg-[#FF5C5C26] px-3 py-2 sm:px-4 sm:py-3">
//               <p className="text-xs sm:text-sm font-medium text-charcoal-500">
//                 Fee Impact
//               </p>
//               <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
//                 {fmtCurrency(cardSummary.feeImpact)}
//               </p>
//               <p className="mt-1 text-[10px] sm:text-xs text-charcoal-500">
//                 Overcharged amount
//               </p>
//             </div>
//           </div>

//           {/* Summary Overview table */}
//           <div className="overflow-x-auto">
//             {summaryTableRows.length ? (
//               <div className="[&_table]:w-full [&_th]:text-center [&_td]:text-center [&_tr:hover]:bg-transparent my-8">
//                 <DataTable
//                   columns={summaryColumns}
//                   data={summaryTableRows}
//                   paginate={false}
//                   scrollY={false}
//                   maxHeight="none"
//                   zebra={false}
//                   stickyHeader={false}
//                   rowClassName={(row) =>
//                     (row as any)._isTotal
//                       ? "font-black border-t-2 border-charcoal-500"
//                       : ""
//                   }
//                 />
//               </div>
//             ) : (
//               <div className="py-4 text-center text-slate-500 italic text-sm">
//                 No summary available.
//               </div>
//             )}
//           </div>

//           {/* Donuts */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
//             {feeDonuts.map((d, index) => (
//               <Donut
//                 key={d.label}
//                 label={d.label}
//                 pct={Number.isFinite(d.pct) ? d.pct : 0}
//                 amount={d.amount}
//                 color={donutColors[index % donutColors.length]}
//               />
//             ))}
//           </div>

//           {/* SKU-wise table */}
//           <div className="bg-white rounded-2xl shadow px-2 md:px-4 pb-2 md:pb-4 w-full overflow-x-auto">
//             <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap w-full mb-2 md:mb-0">
//               <PageBreadcrumb
//                 pageTitle="Product-wise Details of Overcharged Ref Fees"
//                 variant="page"
//                 align="left"
//                 className="mt-4 mb-0 md:mb-4 text-center"
//               />

//               <DownloadButton onClick={handleDownloadExcel} />
//             </div>

//             <div className="[&_table]:w-full [&_th]:text-center [&_td]:text-center">
//               <DataTable
//                 columns={skuColumns}
//                 data={skuTableDisplay}
//                 paginate={false}
//                 scrollY={false}
//                 maxHeight="none"
//                 zebra={true}
//                 stickyHeader={false}
//                 rowClassName={(row) => {
//                   if ((row as any)._isTotal) return "bg-[#DDDDDD] font-bold";
//                   if ((row as any)._isOthers)
//                     return "bg-[#F5F5F5] font-semibold";
//                   return "";
//                 }}
//               />
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );

// }
































"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  type JSX,
  useCallback,
} from "react";
import MonthYearPickerTable from "@/components/filters/MonthYearPickerTable";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { jwtDecode } from "jwt-decode";
import * as XLSX from "xlsx";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DataTable, { ColumnDef, Row } from "@/components/ui/table/DataTable";
import Loader from "@/components/loader/Loader";
import DownloadButton from "@/components/ui/button/DownloadIconButton";

ChartJS.register(ArcElement, Tooltip, Legend);

/* ===================== ENV / CONSTANTS ===================== */
const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

/* ===================== Types ===================== */
interface DonutProps {
  label: string;
  pct: number;
  amount: number;
  color?: string;
}

type ReferralRow = Partial<{
  sku: string;
  product_name: string;
  category: string;
  asin: string;
  quantity: number | string;
  sales: number | string;
  product_sales: number | string;
  refRate: number | string;
  refFeesApplicable: number | string;
  refFeesCharged: number | string;
  overcharged: number | string;
  difference: number | string;
  errorstatus: string;
  selling_fees: number | string;
  answer: number | string;

  // NEW from backend:
  net_sales_total_value: number | string;
  status: string;
  total_value: number | string;
}>;

type Summary = {
  ordersUnits: number;
  totalSales: number;
  feeImpact: number;
};

type FeeSummaryRow = {
  label: string;
  units: number;
  sales: number;
  refFeesApplicable: number;
  refFeesCharged: number;
  overcharged: number;
};

type ProductOverchargeRow = {
  sku: string;
  productName: string;
  quantity: number;
  sales: number;
  refRate: number;
  refFeesApplicable: number;
  refFeesCharged: number;
  overcharged: number;
  total: number;
};

/* ===================== Formatters ===================== */
const fmtCurrency = (n: number): string =>
  typeof n === "number"
    ? n.toLocaleString(undefined, {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "-";

const fmtInteger = (n: number): string =>
  typeof n === "number"
    ? n.toLocaleString(undefined, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      })
    : "-";

const toNumberSafe = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const num = Number(String(v).replace(/[, ]+/g, ""));
  return Number.isNaN(num) ? 0 : num;
};

/* ===================== Donut Component ===================== */
function Donut({ label, pct, amount, color = "#60A68E" }: DonutProps) {
  const data = {
    labels: [label, "Remaining"],
    datasets: [
      {
        data: [pct, Math.max(0, 100 - pct)],
        backgroundColor: [color, "#e5e7eb"],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: "70%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    hover: {
      mode: undefined as any,
    },
    maintainAspectRatio: false,
  } as const;

  return (
    <div className="bg-white p-3 sm:p-4 flex flex-col items-center">
      <h3 className="text-base sm:text-lg md:text-lg font-semibold text-slate-700 mb-1 sm:mb-2">
        {label}
      </h3>

      <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36">
        <Doughnut data={data} options={options} />
      </div>

      <p className="mt-2 text-lg sm:text-xl lg:text-2xl font-bold">
        {Number.isFinite(pct) ? pct.toFixed(2) : 0}%
      </p>

      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
        {fmtCurrency(amount)}
      </p>
    </div>
  );
}

const donutColors = ["#14B8A6", "#FB923C", "#EF4444"];

/* ===================== MAIN DASHBOARD ===================== */
export default function ReferralFeesDashboard(): JSX.Element {
  const [country] = useState<string>("UK");
  const [month, setMonth] = useState<string>(""); // empty by default
  const [year, setYear] = useState<string>(""); // empty by default

  // API data
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [skuwiseRows, setSkuwiseRows] = useState<ReferralRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    ordersUnits: 0,
    totalSales: 0,
    feeImpact: 0,
  });
  const [feeSummaryRows, setFeeSummaryRows] = useState<FeeSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("unknown");
  const [error, setError] = useState<string | null>(
    "Please select both month and year to view referral fees."
  );

  /* ======= derive userId from JWT ======= */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    try {
      const decoded: any = jwtDecode(token);
      const id = decoded?.user_id?.toString() ?? "unknown";
      setUserId(id);
    } catch {
      setUserId("unknown");
    }
  }, []);

  /* ======= fileName ======= */
  const fileName = useMemo(
    () =>
      `user_${userId}_${country.toLowerCase()}_${month}${year}_data`.toLowerCase(),
    [userId, country, month, year]
  );

  /* ===================== API Fetch ===================== */
  const fetchReferralData = useCallback(async () => {
    // Guard: month & year must be selected
    if (!month || !year || !country) {
      setError("Please select both month and year to view referral fees.");
      setRows([]);
      setSkuwiseRows([]);
      setFeeSummaryRows([]);
      setSummary({ ordersUnits: 0, totalSales: 0, feeImpact: 0 });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("jwtToken")
          : null;

      const params = new URLSearchParams({
        country: country,
        month: month,
        year: year,
      });

      const url = `${baseURL}/get_table_data/${fileName}?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch referral data (${res.status})`);
      }

      const json: any = await res.json();
      console.log("REFERRAL JSON:", json);

      const table = json?.table ?? [];
      const arr: ReferralRow[] = Array.isArray(table) ? table : [];

      setRows(arr);
      setSkuwiseRows(arr);

      const summarySource = arr.filter((r) => {
        const sku = String(r.sku ?? "");
        return sku.startsWith("Charge -") || sku === "Grand Total";
      });

      const order = [
        "Charge - Accurate",
        "Charge - Undercharged",
        "Charge - Overcharged",
        "Charge - noreferallfee",
        "Grand Total",
      ];

      summarySource.sort((a, b) => {
        const aSku = String(a.sku ?? "");
        const bSku = String(b.sku ?? "");
        const ai = order.indexOf(aSku);
        const bi = order.indexOf(bSku);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });

      const mappedSummary: FeeSummaryRow[] = summarySource.map(
        (r: ReferralRow): FeeSummaryRow => ({
          label: String(r.sku ?? ""),
          units: Math.round(toNumberSafe(r.quantity)),
          sales: toNumberSafe(
            r.product_sales ?? (r as any).net_sales_total_value
          ),
          refFeesApplicable: toNumberSafe(r.answer),
          refFeesCharged: toNumberSafe(r.selling_fees),
          overcharged: toNumberSafe(r.difference),
        })
      );

      setFeeSummaryRows(mappedSummary);

      let totalUnits = 0;
      let totalSales = 0;
      let feeImpact = 0;

      for (const r of arr) {
        totalUnits += Math.round(toNumberSafe(r.quantity));
        totalSales += toNumberSafe(r.product_sales ?? r.sales);
        feeImpact += toNumberSafe(r.overcharged ?? r.difference);
      }

      setSummary({
        ordersUnits: totalUnits,
        totalSales,
        feeImpact,
      });
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
      setRows([]);
      setSkuwiseRows([]);
      setFeeSummaryRows([]);
      setSummary({ ordersUnits: 0, totalSales: 0, feeImpact: 0 });
    } finally {
      setLoading(false);
    }
  }, [month, year, country, fileName]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  /* ===================== Derived from summary_table ===================== */
  const totalFeeRow = useMemo<FeeSummaryRow | null>(() => {
    if (!feeSummaryRows.length) return null;
    const total =
      feeSummaryRows.find(
        (r) => r.label && r.label.toLowerCase() === "total"
      ) || feeSummaryRows[feeSummaryRows.length - 1];
    return total || null;
  }, [feeSummaryRows]);

  const cardSummary = useMemo(
    () => ({
      ordersUnits: totalFeeRow?.units ?? 0,
      totalSales: totalFeeRow?.sales ?? 0,
      feeImpact: totalFeeRow?.overcharged ?? 0,
    }),
    [totalFeeRow]
  );

  const feeDonuts = useMemo(() => {
    if (!totalFeeRow) {
      return [
        { label: "Fees Applicable", pct: 0, amount: 0 },
        { label: "Fees Charged", pct: 0, amount: 0 },
        { label: "Overcharged", pct: 0, amount: 0 },
      ];
    }

    const sales = totalFeeRow.sales || 0;
    const applicable = totalFeeRow.refFeesApplicable || 0;
    const charged = totalFeeRow.refFeesCharged || 0;
    const overcharged = totalFeeRow.overcharged || 0;

    const applicablePct = sales ? (applicable / sales) * 100 : 0;
    const chargedPct = sales ? (charged / sales) * 100 : 0;
    const overchargedPct = Math.abs(applicablePct - chargedPct);

    return [
      {
        label: "Fees Applicable",
        pct: applicablePct,
        amount: applicable,
      },
      {
        label: "Fees Charged",
        pct: chargedPct,
        amount: charged,
      },
      {
        label: "Overcharged",
        pct: overchargedPct,
        amount: overcharged,
      },
    ];
  }, [totalFeeRow]);

  const summaryTableRows: Row[] = useMemo(() => {
    return feeSummaryRows.map((r, index) => ({
      label: r.label,
      units: r.units,
      sales: r.sales,
      refFeesApplicable: r.refFeesApplicable,
      refFeesCharged: r.refFeesCharged,
      overcharged: r.overcharged,
      _isTotal: index === feeSummaryRows.length - 1,
    })) as Row[];
  }, [feeSummaryRows]);

  /* ===================== Product-wise Overcharged Rows ===================== */
  const overchargedRows = useMemo<ProductOverchargeRow[]>(() => {
    if (!rows.length) return [];

    const grouped = new Map<string, ProductOverchargeRow>();

    rows.forEach((r) => {
      const over = toNumberSafe(r.overcharged ?? r.difference);
      if (over <= 0) return;

      const sku = String(r.sku ?? "");
      const productName = String(r.product_name ?? "");
      const quantity = Math.round(toNumberSafe(r.quantity));
      const sales = toNumberSafe(r.product_sales ?? r.sales);
      const applicable = toNumberSafe(r.answer);
      const charged = toNumberSafe(r.selling_fees);
      const total = toNumberSafe((r as any).total);

      const existing = grouped.get(sku);

      if (!existing) {
        grouped.set(sku, {
          sku,
          productName,
          quantity,
          sales,
          refRate: 0,
          refFeesApplicable: applicable,
          refFeesCharged: charged,
          overcharged: over,
          total,
        });
      } else {
        existing.quantity += quantity;
        existing.sales += sales;
        existing.refFeesApplicable += applicable;
        existing.refFeesCharged += charged;
        existing.overcharged += over;
        existing.total += total;
      }
    });

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      refRate: item.sales ? (item.refFeesApplicable / item.sales) * 100 : 0,
    }));
  }, [rows]);

  const skuTableAll: Row[] = useMemo(() => {
    if (!skuwiseRows.length) return [];

    const filtered = skuwiseRows.filter((r) => {
      const skuStr = String(r.sku ?? "");
      if (skuStr === "Grand Total") return true;
      return !skuStr.startsWith("Charge -");
    });

    return filtered.map((r) => {
      const quantity = Math.round(toNumberSafe(r.quantity));
      const sales = toNumberSafe(r.product_sales ?? r.sales);
      const applicable = toNumberSafe(r.answer);
      const charged = toNumberSafe(r.selling_fees);
      const overcharged = toNumberSafe(r.overcharged ?? r.difference);

      const skuStr = String(r.sku ?? "");
      const isTotal = skuStr.toLowerCase() === "grand total";

      return {
        sku: isTotal ? "Grand Total" : (r.sku ?? ""),
        productName: isTotal ? "" : (r.product_name ?? ""),
        units: quantity,
        sales,
        applicable,
        charged,
        overcharged,
        _isTotal: isTotal,
      };
    });
  }, [skuwiseRows]);

  const skuColumns: ColumnDef<Row>[] = [
    { key: "sku", header: "SKU" },
    { key: "productName", header: "Product Name" },
    { key: "units", header: "Units" },
    {
      key: "sales",
      header: "Sales",
      render: (_, v) => fmtCurrency(Number(v)),
    },
    {
      key: "applicable",
      header: "Ref Fees Applicable",
      render: (_, v) => fmtCurrency(Number(v)),
    },
    {
      key: "charged",
      header: "Ref Fees Charged",
      render: (_, v) => fmtCurrency(Number(v)),
    },
    {
      key: "overcharged",
      header: "Overcharged",
      render: (_, v) => <span>{fmtCurrency(Number(v))}</span>,
    },
  ];

  const summaryColumns: ColumnDef<Row>[] = [
    { key: "label", header: "Ref. Fees" },
    {
      key: "units",
      header: "Units",
      render: (_, v) => fmtInteger(Number(v)),
    },
    {
      key: "sales",
      header: "Sales",
      render: (_, v) => fmtCurrency(Number(v)),
    },
    {
      key: "refFeesApplicable",
      header: "Ref Fees Applicable",
      render: (_, v) => fmtCurrency(Number(v)),
    },
    {
      key: "refFeesCharged",
      header: "Ref Fees Charged",
      render: (_, v) => fmtCurrency(Number(v)),
    },
    {
      key: "overcharged",
      header: "Overcharged",
      render: (_, v) => fmtCurrency(Number(v)),
    },
  ];

  const skuTableDisplay: Row[] = useMemo(() => {
    if (!skuTableAll.length) return [];

    const nonTotal = skuTableAll.filter((row) => !(row as any)._isTotal);
    const totalRow = skuTableAll.find((row) => (row as any)._isTotal) || null;

    if (!nonTotal.length) {
      return totalRow ? [totalRow] : [];
    }

    const sorted = [...nonTotal].sort(
      (a, b) =>
        toNumberSafe((b as any).sales) - toNumberSafe((a as any).sales)
    );

    const top5 = sorted.slice(0, 5);
    const remaining = sorted.slice(5);
    let othersRow: Row | null = null;

    if (remaining.length) {
      type NumericAgg = {
        units: number;
        sales: number;
        applicable: number;
        charged: number;
        overcharged: number;
      };

      const agg = remaining.reduce<NumericAgg>(
        (acc, row) => {
          acc.units += Math.round(toNumberSafe((row as any).units));
          acc.sales += toNumberSafe((row as any).sales);
          acc.applicable += toNumberSafe((row as any).applicable);
          acc.charged += toNumberSafe((row as any).charged);
          acc.overcharged += toNumberSafe((row as any).overcharged);
          return acc;
        },
        {
          units: 0,
          sales: 0,
          applicable: 0,
          charged: 0,
          overcharged: 0,
        }
      );

      othersRow = {
        sku: "OTHERS",
        productName: "",
        units: agg.units,
        sales: agg.sales,
        applicable: agg.applicable,
        charged: agg.charged,
        overcharged: agg.overcharged,
        _isOthers: true,
      } as Row;
    }

    const finalRows: Row[] = [...top5];

    if (othersRow) finalRows.push(othersRow);
    if (totalRow) finalRows.push(totalRow);

    return finalRows;
  }, [skuTableAll]);

  const handleDownloadExcel = useCallback(() => {
    if (!feeSummaryRows.length && !skuTableAll.length && !rows.length) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = feeSummaryRows.map((r) => {
      const units = Math.round(toNumberSafe(r.units));
      const sales = toNumberSafe(r.sales);
      const applicable = toNumberSafe(r.refFeesApplicable);
      const charged = toNumberSafe(r.refFeesCharged);
      const overcharged = toNumberSafe(r.overcharged);

      return {
        "Ref Fees": r.label,
        Units: units,
        Sales: Number(sales.toFixed(2)),
        "Ref Fees Applicable": Number(applicable.toFixed(2)),
        "Ref Fees Charged": Number(charged.toFixed(2)),
        Overcharged: Number(overcharged.toFixed(2)),
      };
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Sheet 2: Overcharged Ref Fees
    const overData = skuTableAll.map((r) => {
      const units = Math.round(toNumberSafe((r as any).units));
      const sales = toNumberSafe((r as any).sales);
      const applicable = toNumberSafe((r as any).applicable);
      const charged = toNumberSafe((r as any).charged);
      const overcharged = toNumberSafe((r as any).overcharged);

      return {
        SKU: String((r as any).sku ?? ""),
        "Product Name": String((r as any).productName ?? ""),
        Units: units,
        Sales: Number(sales.toFixed(2)),
        "Ref Fees Applicable": Number(applicable.toFixed(2)),
        "Ref Fees Charged": Number(charged.toFixed(2)),
        Overcharged: Number(overcharged.toFixed(2)),
      };
    });

    const wsOver = XLSX.utils.json_to_sheet(overData);
    XLSX.utils.book_append_sheet(wb, wsOver, "Overcharged Ref Fees");

    // Sheet 3: All Data
    const allData = rows.map((r) => ({ ...r }));
    const wsAll = XLSX.utils.json_to_sheet(allData);
    XLSX.utils.book_append_sheet(wb, wsAll, "All Data");

    XLSX.writeFile(wb, `Referral-Fees-${country}-${month}-${year}.xlsx`);
  }, [feeSummaryRows, skuTableAll, rows, country, month, year]);

  /* ===================== RENDER ===================== */
  const canShowContent = !loading && !error && month && year;

  return (
    <div className="space-y-1.5 font-sans text-charcoal-500">
      {/* Top bar */}
      <div className="flex items-baseline gap-2">
        <PageBreadcrumb
          pageTitle="Referral Fees -"
          variant="page"
          align="left"
          textSize="2xl"
          className="mb-0 md:mb-2"
        />
        <span className="text-[#5EA68E] font-bold text-lg sm:text-2xl md:text-2xl">
          {country.toUpperCase()}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between ">
        <MonthYearPickerTable
          month={month}
          year={year}
          yearOptions={[
            new Date().getFullYear(),
            new Date().getFullYear() - 1,
          ]}
          onMonthChange={(v) => {
            setMonth(v);
            if (v && year) setError(null);
          }}
          onYearChange={(v) => {
            setYear(v);
            if (v && month) setError(null);
          }}
          valueMode="lower"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader
            src="/infinity-unscreen.gif"
            size={150}
            transparent
            roundedClass="rounded-none"
            backgroundClass="bg-transparent"
            respectReducedMotion
          />
        </div>
      )}

      {/* Error */}
      {!loading && !!error && (
        <div className="mt-5 box-border flex w-full items-center justify-between rounded-md border-t-4 border-[#ff5c5c] bg-[#f2f2f2] px-4 py-3 text-sm text-[#414042] lg:max-w-fit">
          <div className="flex items-center">
            <i className="fa-solid fa-circle-exclamation mr-2 text-lg text-[#ff5c5c]" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT – only when month+year chosen and no error */}
      {canShowContent && (
        <>
          <PageBreadcrumb
            pageTitle="Summary Overview"
            variant="page"
            align="left"
            className="mt-0 md:mt-4 mb-0 md:mb-2"
          />

          {/* Summary tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#87AD12] bg-[#87AD1226] px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-xs sm:text-sm font-bold text-charcoal-500">
                Orders/Units
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
                {fmtInteger(cardSummary.ordersUnits)}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs font-medium text-charcoal-500">
                Total Units Processed
              </p>
            </div>

            <div className="rounded-xl border border-[#F47A00] bg-[#F47A0026] px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-xs sm:text-sm font-bold text-charcoal-500">
                Total Sales
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
                {fmtCurrency(cardSummary.totalSales)}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs font-medium text-charcoal-500">
                Revenue generated
              </p>
            </div>

            <div className="rounded-xl border border-[#FF5C5C] bg-[#FF5C5C26] px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-xs sm:text-sm font-bold text-charcoal-500">
                Fee Impact
              </p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
                {fmtCurrency(cardSummary.feeImpact)}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs font-medium text-charcoal-500">
                Overcharged amount
              </p>
            </div>
          </div>

          {/* Summary Overview table */}
          <div className="overflow-x-auto">
            {summaryTableRows.length ? (
              <div className="[&_table]:w-full [&_th]:text-center [&_td]:text-center [&_tr:hover]:bg-transparent my-8">
                <DataTable
                  columns={summaryColumns}
                  data={summaryTableRows}
                  paginate={false}
                  scrollY={false}
                  maxHeight="none"
                  zebra={false}
                  stickyHeader={false}
                  rowClassName={(row) =>
                    (row as any)._isTotal
                      ? "font-black"
                      : ""
                  }
                />
              </div>
            ) : (
              <div className="py-4 text-center text-slate-500 italic text-sm">
                No summary available.
              </div>
            )}
          </div>

          {/* Donuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-9 rounded-xl border border-slate-200 shadow-sm">
            {feeDonuts.map((d, index) => (
              <Donut
                key={d.label}
                label={d.label}
                pct={Number.isFinite(d.pct) ? d.pct : 0}
                amount={d.amount}
                color={donutColors[index % donutColors.length]}
              />
            ))}
          </div>

          {/* SKU-wise table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-2 md:px-4 pb-2 md:pb-4 w-full overflow-x-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap w-full mb-2 md:mb-0">
              <PageBreadcrumb
                pageTitle="Product-wise Details of Overcharged Ref Fees"
                variant="page"
                align="left"
                className="mt-4 mb-0 md:mb-4 text-center"
              />

              <DownloadButton onClick={handleDownloadExcel} />
            </div>

            <div className="[&_table]:w-full [&_th]:text-center [&_td]:text-center">
              <DataTable
                columns={skuColumns}
                data={skuTableDisplay}
                paginate={false}
                scrollY={false}
                maxHeight="none"
                zebra={true}
                stickyHeader={false}
                rowClassName={(row) => {
                  if ((row as any)._isTotal) return "bg-[#DDDDDD] font-bold";
                  if ((row as any)._isOthers)
                    return "bg-[#F5F5F5] font-semibold";
                  return "";
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
