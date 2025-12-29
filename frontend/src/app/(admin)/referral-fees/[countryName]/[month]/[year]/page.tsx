// "use client";

// import React, {
//   useEffect,
//   useMemo,
//   useState,
//   useRef,
//   type JSX,
//   useCallback,
// } from "react";
// import { useParams } from "next/navigation";
// import MonthYearPickerTable from "@/components/filters/MonthYearPickerTable";
// import { Doughnut } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
// import { jwtDecode } from "jwt-decode";
// import * as XLSX from "xlsx";
// import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// import DataTable, { ColumnDef, Row } from "@/components/ui/table/DataTable";
// import Loader from "@/components/loader/Loader";
// import DownloadButton from "@/components/ui/button/DownloadIconButton";

// /* ===================== Overlap Plugin (draws Blue/Red overlays) ===================== */
// const overlapPlugin = {
//   id: "overlapPlugin",
//   afterDatasetsDraw(chart: any, _args: any, pluginOptions: any) {
//     const opts = pluginOptions || {};
//     const salesTotal = Math.max(0, Number(opts.salesTotal || 0));
//     if (!salesTotal) return;

//     const applicableValue = Math.max(0, Number(opts.applicableValue || 0));
//     const overchargedValue = Math.max(0, Number(opts.overchargedValue || 0));

//     const showApplicable = opts.showApplicable !== false;
//     const showOvercharged = opts.showOvercharged !== false;

//     if (!showApplicable && !showOvercharged) return;

//     const meta = chart.getDatasetMeta(0);
//     if (!meta?.data?.length) return;

//     const maskArc = meta.data[0];
//     const { x, y, innerRadius, outerRadius, startAngle, endAngle } = maskArc;

//     const full = Math.PI * 2;
//     const applAngleRaw = showApplicable ? (applicableValue / salesTotal) * full : 0;
//     const overAngleRaw = showOvercharged ? (overchargedValue / salesTotal) * full : 0;

//     const maskSpan = Math.max(0, endAngle - startAngle);
//     const applAngle = Math.min(applAngleRaw, maskSpan);
//     const overAngle = Math.min(overAngleRaw, Math.max(0, maskSpan - applAngle));

//     const radius = (innerRadius + outerRadius) / 2;
//     const thickness = outerRadius - innerRadius;

//     const ctx = chart.ctx;
//     ctx.save();
//     ctx.lineWidth = thickness;
//     ctx.lineCap = "butt";

//     // 🟦 Applicable overlay
//     if (applAngle > 0) {
//       ctx.beginPath();
//       ctx.strokeStyle = "#14B8A6";
//       ctx.arc(x, y, radius, startAngle, startAngle + applAngle);
//       ctx.stroke();
//     }

//     // 🟥 Overcharged overlay
//     if (overAngle > 0) {
//       ctx.beginPath();
//       ctx.strokeStyle = "#EF4444";
//       ctx.arc(
//         x,
//         y,
//         radius,
//         startAngle + applAngle,
//         startAngle + applAngle + overAngle
//       );
//       ctx.stroke();
//     }

//     ctx.restore();
//   },
// };

// ChartJS.register(ArcElement, Tooltip, Legend, overlapPlugin);

// /* ===================== ENV / CONSTANTS ===================== */
// const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

// /* ===================== Types ===================== */
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

//   // from backend:
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

// /* ===================== Helpers ===================== */
// const fmtCurrency = (n: number): string =>
//   typeof n === "number"
//     ? n.toLocaleString(undefined, {
//       style: "currency",
//       currency: "GBP",
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     })
//     : "-";

// const fmtInteger = (n: number): string =>
//   typeof n === "number"
//     ? n.toLocaleString(undefined, {
//       maximumFractionDigits: 0,
//       minimumFractionDigits: 0,
//     })
//     : "-";

// const toNumberSafe = (v: any): number => {
//   if (v === null || v === undefined) return 0;
//   if (typeof v === "number") return v;
//   const num = Number(String(v).replace(/[, ]+/g, ""));
//   return Number.isNaN(num) ? 0 : num;
// };

// const getNetSales = (r: any): number => {
//   // prefer backend net sales field
//   const net = toNumberSafe(r?.net_sales_total_value);
//   if (net) return net;

//   // fallback if net not present
//   return toNumberSafe(r?.product_sales ?? r?.sales);
// };


// /* ===================== Donut Component ===================== */
// type OverlapSalesDonutProps = {
//   sales: number;
//   applicable: number;
//   charged: number;
// };

// function OverlapSalesDonut({ sales, applicable, charged }: OverlapSalesDonutProps) {
//   const chartRef = useRef<any>(null);

//   const [showBackground, setShowBackground] = useState(true);
//   const [showApplicable, setShowApplicable] = useState(true);
//   const [showOvercharged, setShowOvercharged] = useState(true);
//   const [showRemaining, setShowRemaining] = useState(true);

//   const s = Math.max(0, toNumberSafe(sales));
//   const appl = Math.max(0, toNumberSafe(applicable));
//   const chg = Math.max(0, toNumberSafe(charged));

//   const over = Math.max(0, chg - appl);
//   const occupiedRaw = Math.min(appl + over, s);
//   const remainingRaw = Math.max(0, s - occupiedRaw);

//   const EPS = s > 0 ? s * 1e-9 : 1e-9;
//   const overlayWanted = showApplicable || showOvercharged;

//   const maskArcVal = showBackground || overlayWanted ? occupiedRaw : 0;
//   const remainingVal = showRemaining ? remainingRaw : remainingRaw === 0 ? EPS : remainingRaw;

//   const data = useMemo(() => {
//     return {
//       labels: ["Mask (Occupied)", "Remaining Sales"],
//       datasets: [
//         {
//           data: [maskArcVal, remainingVal],
//           backgroundColor: [
//             showBackground ? "#FB923C" : "rgba(0,0,0,0)", // 🟧
//             showRemaining ? "#e5e7eb" : "rgba(0,0,0,0)", // grey
//           ],
//           borderWidth: 0,
//         },
//       ],
//     };
//   }, [maskArcVal, remainingVal, showBackground, showRemaining]);

//   // ✅ TOTAL REMOVE HOVER: no tooltip, no dot, no hover interaction
//   const options = useMemo(() => {
//     return {
//       cutout: "65%",
//       maintainAspectRatio: false,
//       animation: false,

//       plugins: {
//         legend: { display: false },
//         tooltip: { enabled: false }, // ❌ no tooltip at all
//         overlapPlugin: {
//           salesTotal: s,
//           applicableValue: appl,
//           overchargedValue: over,
//           showApplicable,
//           showOvercharged,
//         },
//       },

//       events: [], // ❌ disables all mouse events => removes hover dot too
//       interaction: { mode: "none" },
//     } as const;
//   }, [s, appl, over, showApplicable, showOvercharged]);

//   useEffect(() => {
//     chartRef.current?.update?.();
//   }, [showBackground, showRemaining, showApplicable, showOvercharged, s, appl, over]);

//   const MetricRow = ({
//     color,
//     label,
//     value,
//     active,
//     onToggle,
//   }: {
//     color: string;
//     label: string;
//     value: number;
//     active: boolean;
//     onToggle: () => void;
//   }) => (
//     <button
//       type="button"
//       onClick={onToggle}
//       className="w-full flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
//       title="Click to toggle"
//     >
//       <div className="flex items-center gap-2 min-w-0">
//         <span
//           className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
//           style={{ backgroundColor: active ? color : "#cbd5e1" }}
//         />
//         <span
//           className={`text-sm truncate ${active ? "text-slate-700" : "text-slate-400 line-through"
//             }`}
//         >
//           {label}
//         </span>
//       </div>

//       <span
//         className={`text-sm font-semibold ${active ? "text-slate-800" : "text-slate-400"
//           }`}
//       >
//         {fmtCurrency(value)}
//       </span>
//     </button>
//   );

//   return (
//     <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
//       <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-4 text-center">
//         Fee Comparison
//       </h3>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
//         <div className="relative w-72 h-72 mx-auto">
//           <Doughnut ref={chartRef} data={data} options={options} redraw />
//           <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
//             <div className="text-xs text-slate-500">Net Sales</div>
//             <div className="text-2xl font-bold text-slate-800">{fmtCurrency(s)}</div>
//           </div>
//         </div>

//         <div className="flex flex-col gap-2 w-full max-w-md mx-auto">
//           <MetricRow
//             color="#14B8A6"
//             label="Applicable"
//             value={appl}
//             active={showApplicable}
//             onToggle={() => setShowApplicable((v) => !v)}
//           />
//           <MetricRow
//             color="#EF4444"
//             label="Overcharged"
//             value={over}
//             active={showOvercharged}
//             onToggle={() => setShowOvercharged((v) => !v)}
//           />
//           <MetricRow
//             color="#FB923C"
//             label="Applied"
//             value={occupiedRaw}
//             active={showBackground}
//             onToggle={() => setShowBackground((v) => !v)}
//           />
//           <MetricRow
//             color="#e5e7eb"
//             label="Remaining Sales"
//             value={remainingRaw}
//             active={showRemaining}
//             onToggle={() => setShowRemaining((v) => !v)}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ===================== MAIN DASHBOARD PAGE ===================== */
// export default function ReferralFeesDashboard(): JSX.Element {
//   const routeParams = useParams();

//   const [country] = useState<string>("UK");

//   // ✅ last fetched month/year should auto-fill
//   const [month, setMonth] = useState<string>("");
//   const [year, setYear] = useState<string>("");

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

//   // ✅ NEW: store grouped orders for Excel sheet 3
//   const [allOrdersByStatus, setAllOrdersByStatus] = useState<any[]>([]);

//   const [error, setError] = useState<string | null>(null);

//   // ✅ hydrate month/year from URL first, else localStorage.latestFetchedPeriod
//   useEffect(() => {
//     const mFromRoute = (routeParams?.month as string | undefined)?.toLowerCase();
//     const yFromRoute = routeParams?.year as string | undefined;

//     if (mFromRoute && yFromRoute) {
//       setMonth(mFromRoute);
//       setYear(String(yFromRoute));
//       setError(null);
//       return;
//     }

//     if (typeof window === "undefined") return;

//     try {
//       const raw = localStorage.getItem("latestFetchedPeriod");
//       if (raw) {
//         const parsed = JSON.parse(raw) as { month?: string; year?: string };
//         if (parsed.month && parsed.year) {
//           setMonth(String(parsed.month).toLowerCase());
//           setYear(String(parsed.year));
//           setError(null);
//           return;
//         }
//       }
//     } catch { }

//     setError("Please select both month and year to view referral fees.");
//   }, [routeParams?.month, routeParams?.year]);

//   // ✅ store latest selection whenever both are chosen
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if (!month || !year) return;
//     localStorage.setItem("latestFetchedPeriod", JSON.stringify({ month, year }));
//   }, [month, year]);

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
//     () => `user_${userId}_${country.toLowerCase()}_${month}${year}_data`.toLowerCase(),
//     [userId, country, month, year]
//   );

//   /* ===================== API Fetch ===================== */
//   const fetchReferralData = useCallback(async () => {
//     if (!month || !year || !country) {
//       setError("Please select both month and year to view referral fees.");
//       setRows([]);
//       setSkuwiseRows([]);
//       setFeeSummaryRows([]);
//       setAllOrdersByStatus([]);
//       setSummary({ ordersUnits: 0, totalSales: 0, feeImpact: 0 });
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     try {
//       const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

//       const params = new URLSearchParams({
//         country: country,
//         month: month,
//         year: year,
//       });

//       const url = `${baseURL}/get_table_data/${fileName}?${params.toString()}`;

//       const res = await fetch(url, {
//         method: "GET",
//         headers: token ? { Authorization: `Bearer ${token}` } : {},
//       });

//       if (!res.ok) throw new Error(`Failed to fetch referral data (${res.status})`);

//       const json: any = await res.json();
//       console.log("REFERRAL JSON:", json);

//       const table = json?.table ?? [];
//       const arr: ReferralRow[] = Array.isArray(table) ? table : [];

//       setRows(arr);
//       setSkuwiseRows(arr);

//       // ✅ NEW: Build Sheet3 data from categorized arrays
//       const accurate = Array.isArray(json?.accurate_data) ? json.accurate_data : [];
//       const overcharged = Array.isArray(json?.overcharged_data) ? json.overcharged_data : [];
//       const undercharged = Array.isArray(json?.undercharged_data) ? json.undercharged_data : [];
//       const noRef = Array.isArray(json?.no_ref_fee_data) ? json.no_ref_fee_data : [];

//       const mergedAll = [
//         { Category: "Overcharged" },
//         ...overcharged.map((r: any) => ({ Category: "Overcharged", ...r })),
//         {},
//         { Category: "Undercharged" },
//         ...undercharged.map((r: any) => ({ Category: "Undercharged", ...r })),
//         {},
//         { Category: "No Ref Fees" },
//         ...noRef.map((r: any) => ({ Category: "No Ref Fees", ...r })),
//         {},
//         { Category: "Accurate" },
//         ...accurate.map((r: any) => ({ Category: "Accurate", ...r })),
//       ];

//       setAllOrdersByStatus(mergedAll);

//       const summarySource = arr.filter((r) => {
//         const sku = String(r.sku ?? "");
//         return sku.startsWith("Charge -") || sku === "Grand Total";
//       });

//       const order = [
//         "Charge - Accurate",
//         "Charge - Undercharged",
//         "Charge - Overcharged",
//         "Charge - noreferallfee",
//         "Grand Total",
//       ];

//       summarySource.sort((a, b) => {
//         const aSku = String(a.sku ?? "");
//         const bSku = String(b.sku ?? "");
//         const ai = order.indexOf(aSku);
//         const bi = order.indexOf(bSku);
//         if (ai === -1 && bi === -1) return 0;
//         if (ai === -1) return 1;
//         if (bi === -1) return -1;
//         return ai - bi;
//       });

//       const mappedSummary: FeeSummaryRow[] = summarySource.map((r: ReferralRow) => ({
//         label: String(r.sku ?? ""),
//         units: Math.round(toNumberSafe(r.quantity)),
//         sales: getNetSales(r), // ✅ NET sales
//         refFeesApplicable: toNumberSafe(r.answer),
//         refFeesCharged: toNumberSafe(r.selling_fees),
//         overcharged: toNumberSafe(r.difference),
//       }));

//       setFeeSummaryRows(mappedSummary);

//       let totalUnits = 0;
//       let totalSales = 0;
//       let feeImpact = 0;

//       for (const r of arr) {
//         totalUnits += Math.round(toNumberSafe(r.quantity));
//         totalSales += getNetSales(r); // ✅ NET sales everywhere
//         feeImpact += toNumberSafe(r.overcharged ?? r.difference);
//       }

//       setSummary({ ordersUnits: totalUnits, totalSales, feeImpact });
//     } catch (e: any) {
//       setError(e?.message || "Failed to load data");
//       setRows([]);
//       setSkuwiseRows([]);
//       setFeeSummaryRows([]);
//       setAllOrdersByStatus([]);
//       setSummary({ ordersUnits: 0, totalSales: 0, feeImpact: 0 });
//     } finally {
//       setLoading(false);
//     }
//   }, [month, year, country, fileName]);

//   useEffect(() => {
//     fetchReferralData();
//   }, [fetchReferralData]);

//   /* ===================== Derived ===================== */
//   const totalFeeRow = useMemo<FeeSummaryRow | null>(() => {
//     if (!feeSummaryRows.length) return null;
//     const total =
//       feeSummaryRows.find((r) => r.label && r.label.toLowerCase() === "total") ||
//       feeSummaryRows[feeSummaryRows.length - 1];
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

//   const skuTableAll: Row[] = useMemo(() => {
//     if (!skuwiseRows.length) return [];

//     const filtered = skuwiseRows.filter((r) => {
//       const skuStr = String(r.sku ?? "");
//       if (skuStr === "Grand Total") return true;
//       return !skuStr.startsWith("Charge -");
//     });

//     return filtered.map((r) => {
//       const quantity = Math.round(toNumberSafe(r.quantity));
//       // const sales = toNumberSafe(r.product_sales ?? r.sales);
//       const sales = getNetSales(r); // ✅ NET sales
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
//     { key: "sales", header: "Net Sales", render: (_, v) => fmtCurrency(Number(v)) },
//     { key: "applicable", header: "Ref Fees Applicable", render: (_, v) => fmtCurrency(Number(v)) },
//     { key: "charged", header: "Ref Fees Charged", render: (_, v) => fmtCurrency(Number(v)) },
//     { key: "overcharged", header: "Overcharged", render: (_, v) => <span>{fmtCurrency(Number(v))}</span> },
//   ];

//   const summaryColumns: ColumnDef<Row>[] = [
//     { key: "label", header: "Ref. Fees" },
//     { key: "units", header: "Units", render: (_, v) => fmtInteger(Number(v)) },
//     { key: "sales", header: "Net Sales", render: (_, v) => fmtCurrency(Number(v)) },
//     { key: "refFeesApplicable", header: "Ref Fees Applicable", render: (_, v) => fmtCurrency(Number(v)) },
//     { key: "refFeesCharged", header: "Ref Fees Charged", render: (_, v) => fmtCurrency(Number(v)) },
//     { key: "overcharged", header: "Overcharged", render: (_, v) => fmtCurrency(Number(v)) },
//   ];

//   const skuTableDisplay: Row[] = useMemo(() => {
//     if (!skuTableAll.length) return [];

//     const nonTotal = skuTableAll.filter((row) => !(row as any)._isTotal);
//     const totalRow = skuTableAll.find((row) => (row as any)._isTotal) || null;

//     if (!nonTotal.length) return totalRow ? [totalRow] : [];

//     const sorted = [...nonTotal].sort(
//       (a, b) => toNumberSafe((b as any).sales) - toNumberSafe((a as any).sales)
//     );

//     const top5 = sorted.slice(0, 5);
//     const remaining = sorted.slice(5);
//     let othersRow: Row | null = null;

//     if (remaining.length) {
//       const agg = remaining.reduce(
//         (acc: any, row: any) => {
//           acc.units += Math.round(toNumberSafe(row.units));
//           acc.sales += toNumberSafe(row.sales);
//           acc.applicable += toNumberSafe(row.applicable);
//           acc.charged += toNumberSafe(row.charged);
//           acc.overcharged += toNumberSafe(row.overcharged);
//           return acc;
//         },
//         { units: 0, sales: 0, applicable: 0, charged: 0, overcharged: 0 }
//       );

//       othersRow = {
//         sku: "Others",
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

//   const mapRowForExcelAllData = (r: any) => ({
//     SKU: r.sku ?? "",
//     "Product Name": r.product_name ?? "",
//     // ASIN: r.asin ?? "",
//     Quantity: toNumberSafe(r.quantity),
//     "Net Sales": toNumberSafe(r.product_sales ?? r.sales),
//     "Referral Fees Applicable": toNumberSafe(r.answer),
//     "Referral Fees Charged": toNumberSafe(r.selling_fees),
//     Overcharged: toNumberSafe(r.difference ?? r.overcharged),
//     Status: r.errorstatus ?? "",
//     // Marketplace: r.marketplace ?? "",
//     // Month: r.month ?? "",
//     // Year: r.year ?? "",
//     "Order ID": r.order_id ?? "",
//     // Date: r.date_time ?? "",
//   });


//   const handleDownloadExcel = useCallback(() => {
//     if (!feeSummaryRows.length && !skuTableAll.length && !rows.length) return;

//     const wb = XLSX.utils.book_new();

//     /* ---------------- Sheet 1: Summary ---------------- */
//     const summaryData = feeSummaryRows.map((r) => {
//       const units = Math.round(toNumberSafe(r.units));
//       const sales = toNumberSafe(r.sales);
//       const applicable = toNumberSafe(r.refFeesApplicable);
//       const charged = toNumberSafe(r.refFeesCharged);
//       const overcharged = toNumberSafe(r.overcharged);

//       return {
//         "Ref Fees": r.label,
//         Units: units,
//         "Net Sales": Number(sales.toFixed(2)),
//         "Ref Fees Applicable": Number(applicable.toFixed(2)),
//         "Ref Fees Charged": Number(charged.toFixed(2)),
//         Overcharged: Number(overcharged.toFixed(2)),
//       };
//     });

//     const wsSummary = XLSX.utils.json_to_sheet(summaryData);
//     XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

//     /* ---------------- Sheet 2: Overcharged Ref Fees (SKU-wise) ---------------- */
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
//         "Net Sales": Number(sales.toFixed(2)),
//         "Ref Fees Applicable": Number(applicable.toFixed(2)),
//         "Ref Fees Charged": Number(charged.toFixed(2)),
//         Overcharged: Number(overcharged.toFixed(2)),
//       };
//     });

//     const wsOver = XLSX.utils.json_to_sheet(overData);
//     XLSX.utils.book_append_sheet(wb, wsOver, "Overcharged Ref Fees");

//     /* ---------------- Sheet 3: Orders by Status (CLEANED COLUMNS) ----------------
//        ✅ Only export the columns you want (no extra/red columns)
//     */
//     const cleanedOrdersByStatus = (allOrdersByStatus || []).map((r: any) => {
//       // keep separators / heading rows as-is (you used {} and {Category:"Overcharged"} etc.)
//       const isSeparatorRow =
//         !r || (Object.keys(r).length === 0) || (r.Category && Object.keys(r).length === 1);

//       if (isSeparatorRow) return r;

//       return {
//         Category: r.Category ?? "",
//         "Order ID": r.order_id ?? "",
//         SKU: r.sku ?? "",
//         "Product Name": r.product_name ?? "",
//         // ASIN: r.asin ?? "",
//         Quantity: toNumberSafe(r.quantity),
//         Sales: toNumberSafe(r.product_sales ?? r.sales),
//         "Referral Fees Applicable": toNumberSafe(r.answer),
//         "Referral Fees Charged": toNumberSafe(r.selling_fees),
//         Overcharged: toNumberSafe(r.difference ?? r.overcharged),
//         Status: r.errorstatus ?? "",
//         // Marketplace: r.marketplace ?? "",
//         // Month: r.month ?? "",
//         // Year: r.year ?? "",
//         // Date: r.date_time ?? "",
//       };
//     });

//     const wsAll = XLSX.utils.json_to_sheet(cleanedOrdersByStatus);
//     XLSX.utils.book_append_sheet(wb, wsAll, "Orders by Status");

//     /* ---------------- Save ---------------- */
//     XLSX.writeFile(wb, `Referral-Fees-${country}-${month}-${year}.xlsx`);
//   }, [feeSummaryRows, skuTableAll, rows, allOrdersByStatus, country, month, year]);


//   const canShowContent = !loading && !error && month && year;

//   return (
//     <div className="space-y-1.5 font-sans text-charcoal-500">
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
//       <div className="flex flex-col md:flex-row items-center justify-between">
//         <MonthYearPickerTable
//           month={month}
//           year={year}
//           yearOptions={[new Date().getFullYear(), new Date().getFullYear() - 1]}
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

//       {/* Content */}
//       {canShowContent && (
//         <>
//           <PageBreadcrumb
//             pageTitle="Summary Overview"
//             variant="page"
//             align="left"
//             className="mt-0 md:mt-4 mb-0 md:mb-2"
//           />

//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//             <div className="rounded-xl border border-[#87AD12] bg-[#87AD1226] px-3 py-2 sm:px-4 sm:py-3">
//               <p className="text-xs sm:text-sm font-bold text-charcoal-500">Orders/Units</p>
//               <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
//                 {fmtInteger(cardSummary.ordersUnits)}
//               </p>
//               <p className="mt-1 text-[10px] sm:text-xs font-medium text-charcoal-500">
//                 Total Units Processed
//               </p>
//             </div>

//             <div className="rounded-xl border border-[#F47A00] bg-[#F47A0026] px-3 py-2 sm:px-4 sm:py-3">
//               <p className="text-xs sm:text-sm font-bold text-charcoal-500">Total Sales</p>
//               <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
//                 {fmtCurrency(cardSummary.totalSales)}
//               </p>
//               <p className="mt-1 text-[10px] sm:text-xs font-medium text-charcoal-500">
//                 Revenue generated
//               </p>
//             </div>

//             <div className="rounded-xl border border-[#FF5C5C] bg-[#FF5C5C26] px-3 py-2 sm:px-4 sm:py-3">
//               <p className="text-xs sm:text-sm font-bold text-charcoal-500">Fee Impact</p>
//               <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
//                 {fmtCurrency(cardSummary.feeImpact)}
//               </p>
//               <p className="mt-1 text-[10px] sm:text-xs font-medium text-charcoal-500">
//                 Overcharged amount
//               </p>
//             </div>
//           </div>

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
//                   rowClassName={(row) => ((row as any)._isTotal ? "font-black" : "")}
//                 />
//               </div>
//             ) : (
//               <div className="py-4 text-center text-slate-500 italic text-sm">No summary available.</div>
//             )}
//           </div>

//           <div className="mb-9">
//             <OverlapSalesDonut
//               sales={totalFeeRow?.sales ?? 0}
//               applicable={totalFeeRow?.refFeesApplicable ?? 0}
//               charged={totalFeeRow?.refFeesCharged ?? 0}
//             />
//           </div>

//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-2 md:px-4 pb-2 md:pb-4 w-full overflow-x-auto">
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
//                 rowClassName={(row) => ((row as any)._isTotal ? "bg-[#DDDDDD] font-bold" : "")}
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
  useRef,
  type JSX,
  useCallback,
} from "react";
import { useParams } from "next/navigation";
import MonthYearPickerTable from "@/components/filters/MonthYearPickerTable";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { jwtDecode } from "jwt-decode";
import * as XLSX from "xlsx";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DataTable, { ColumnDef, Row } from "@/components/ui/table/DataTable";
import Loader from "@/components/loader/Loader";
import DownloadButton from "@/components/ui/button/DownloadIconButton";

// ✅ home currency hook (already used in your profits page)
import { useHomeCurrencyContext } from "@/lib/hooks/useHomeCurrencyContext";

/* ===================== Overlap Plugin ===================== */
const overlapPlugin = {
  id: "overlapPlugin",
  afterDatasetsDraw(chart: any, _args: any, pluginOptions: any) {
    const opts = pluginOptions || {};
    const salesTotal = Math.max(0, Number(opts.salesTotal || 0));
    if (!salesTotal) return;

    const applicableValue = Math.max(0, Number(opts.applicableValue || 0));
    const overchargedValue = Math.max(0, Number(opts.overchargedValue || 0));

    const showApplicable = opts.showApplicable !== false;
    const showOvercharged = opts.showOvercharged !== false;

    if (!showApplicable && !showOvercharged) return;

    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    const maskArc = meta.data[0];
    const { x, y, innerRadius, outerRadius, startAngle, endAngle } = maskArc;

    const full = Math.PI * 2;
    const applAngleRaw = showApplicable ? (applicableValue / salesTotal) * full : 0;
    const overAngleRaw = showOvercharged ? (overchargedValue / salesTotal) * full : 0;

    const maskSpan = Math.max(0, endAngle - startAngle);
    const applAngle = Math.min(applAngleRaw, maskSpan);
    const overAngle = Math.min(overAngleRaw, Math.max(0, maskSpan - applAngle));

    const radius = (innerRadius + outerRadius) / 2;
    const thickness = outerRadius - innerRadius;

    const ctx = chart.ctx;
    ctx.save();
    ctx.lineWidth = thickness;
    ctx.lineCap = "butt";

    if (applAngle > 0) {
      ctx.beginPath();
      ctx.strokeStyle = "#14B8A6";
      ctx.arc(x, y, radius, startAngle, startAngle + applAngle);
      ctx.stroke();
    }

    if (overAngle > 0) {
      ctx.beginPath();
      ctx.strokeStyle = "#EF4444";
      ctx.arc(
        x,
        y,
        radius,
        startAngle + applAngle,
        startAngle + applAngle + overAngle
      );
      ctx.stroke();
    }

    ctx.restore();
  },
};

ChartJS.register(ArcElement, Tooltip, Legend, overlapPlugin);

/* ===================== ENV ===================== */
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

/* ===================== Types ===================== */
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

/* ===================== Helpers ===================== */
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

const getNetSales = (r: any): number => {
  const net = toNumberSafe(r?.net_sales_total_value);
  if (net) return net;
  return toNumberSafe(r?.product_sales ?? r?.sales);
};

const currencyFromCountryName = (countryName: string) => {
  const c = (countryName || "").toLowerCase();
  if (c === "uk") return "GBP";
  if (c === "us") return "USD";
  // add more mappings later if needed
  return "USD";
};

/* ===================== Donut Component ===================== */
type OverlapSalesDonutProps = {
  sales: number;
  applicable: number;
  charged: number;
  fmtCurrency: (n: number) => string;
};

function OverlapSalesDonut({ sales, applicable, charged, fmtCurrency }: OverlapSalesDonutProps) {
  const chartRef = useRef<any>(null);

  const [showBackground, setShowBackground] = useState(true);
  const [showApplicable, setShowApplicable] = useState(true);
  const [showOvercharged, setShowOvercharged] = useState(true);
  const [showRemaining, setShowRemaining] = useState(true);

  const s = Math.max(0, toNumberSafe(sales));
  const appl = Math.max(0, toNumberSafe(applicable));
  const chg = Math.max(0, toNumberSafe(charged));

  const over = Math.max(0, chg - appl);
  const occupiedRaw = Math.min(appl + over, s);
  const remainingRaw = Math.max(0, s - occupiedRaw);

  const EPS = s > 0 ? s * 1e-9 : 1e-9;
  const overlayWanted = showApplicable || showOvercharged;

  const maskArcVal = showBackground || overlayWanted ? occupiedRaw : 0;
  const remainingVal = showRemaining ? remainingRaw : remainingRaw === 0 ? EPS : remainingRaw;

  const data = useMemo(() => {
    return {
      labels: ["Mask (Occupied)", "Remaining Sales"],
      datasets: [
        {
          data: [maskArcVal, remainingVal],
          backgroundColor: [
            showBackground ? "#FB923C" : "rgba(0,0,0,0)",
            showRemaining ? "#e5e7eb" : "rgba(0,0,0,0)",
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [maskArcVal, remainingVal, showBackground, showRemaining]);

  const options = useMemo(() => {
    return {
      cutout: "65%",
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        overlapPlugin: {
          salesTotal: s,
          applicableValue: appl,
          overchargedValue: over,
          showApplicable,
          showOvercharged,
        },
      },
      events: [],
      interaction: { mode: "none" },
    } as const;
  }, [s, appl, over, showApplicable, showOvercharged]);

  useEffect(() => {
    chartRef.current?.update?.();
  }, [showBackground, showRemaining, showApplicable, showOvercharged, s, appl, over]);

  const MetricRow = ({
    color,
    label,
    value,
    active,
    onToggle,
  }: {
    color: string;
    label: string;
    value: number;
    active: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
      title="Click to toggle"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
          style={{ backgroundColor: active ? color : "#cbd5e1" }}
        />
        <span className={`text-sm truncate ${active ? "text-slate-700" : "text-slate-400 line-through"}`}>
          {label}
        </span>
      </div>

      <span className={`text-sm font-semibold ${active ? "text-slate-800" : "text-slate-400"}`}>
        {fmtCurrency(value)}
      </span>
    </button>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-4 text-center">
        Fee Comparison
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="relative w-72 h-72 mx-auto">
          <Doughnut ref={chartRef} data={data} options={options} redraw />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-xs text-slate-500">Net Sales</div>
            <div className="text-2xl font-bold text-slate-800">{fmtCurrency(s)}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-md mx-auto">
          <MetricRow color="#14B8A6" label="Applicable" value={appl} active={showApplicable} onToggle={() => setShowApplicable((v) => !v)} />
          <MetricRow color="#EF4444" label="Overcharged" value={over} active={showOvercharged} onToggle={() => setShowOvercharged((v) => !v)} />
          <MetricRow color="#FB923C" label="Applied" value={occupiedRaw} active={showBackground} onToggle={() => setShowBackground((v) => !v)} />
          <MetricRow color="#e5e7eb" label="Remaining Sales" value={remainingRaw} active={showRemaining} onToggle={() => setShowRemaining((v) => !v)} />
        </div>
      </div>
    </div>
  );
}

/* ===================== MAIN DASHBOARD PAGE ===================== */
export default function ReferralFeesDashboard(): JSX.Element {
  const routeParams = useParams();

  // ✅ IMPORTANT: pick platform/country from URL
  const country = ((routeParams?.countryName as string) || "global").toLowerCase();

  // ✅ Global vs country behavior
  const isGlobalPage = country === "global";

  // ✅ get home currency ONLY for global formatting + api param
  const { homeCurrency: rawHomeCurrency } = useHomeCurrencyContext(country);
  const homeCurrency = isGlobalPage ? (rawHomeCurrency || "USD").toUpperCase() : "";

  // ✅ formatting currency code (NO fallback to homeCurrency on country pages)
  const displayCurrencyCode = useMemo(() => {
    if (isGlobalPage) return homeCurrency;
    return currencyFromCountryName(country);
  }, [isGlobalPage, homeCurrency, country]);

  const fmtCurrency = useCallback(
    (n: number): string => {
      if (typeof n !== "number" || Number.isNaN(n)) return "-";
      return n.toLocaleString(undefined, {
        style: "currency",
        currency: displayCurrencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    [displayCurrencyCode]
  );

  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

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
  const [allOrdersByStatus, setAllOrdersByStatus] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ hydrate month/year from URL first, else localStorage.latestFetchedPeriod
  useEffect(() => {
    const mFromRoute = (routeParams?.month as string | undefined)?.toLowerCase();
    const yFromRoute = routeParams?.year as string | undefined;

    if (mFromRoute && yFromRoute) {
      setMonth(mFromRoute);
      setYear(String(yFromRoute));
      setError(null);
      return;
    }

    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem("latestFetchedPeriod");
      if (raw) {
        const parsed = JSON.parse(raw) as { month?: string; year?: string };
        if (parsed.month && parsed.year) {
          setMonth(String(parsed.month).toLowerCase());
          setYear(String(parsed.year));
          setError(null);
          return;
        }
      }
    } catch {}

    setError("Please select both month and year to view referral fees.");
  }, [routeParams?.month, routeParams?.year]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!month || !year) return;
    localStorage.setItem("latestFetchedPeriod", JSON.stringify({ month, year }));
  }, [month, year]);

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
    () => `user_${userId}_${country}_${month}${year}_data`.toLowerCase(),
    [userId, country, month, year]
  );

  /* ===================== API Fetch ===================== */
  const fetchReferralData = useCallback(async () => {
    if (!month || !year || !country) {
      setError("Please select both month and year to view referral fees.");
      setRows([]);
      setSkuwiseRows([]);
      setFeeSummaryRows([]);
      setAllOrdersByStatus([]);
      setSummary({ ordersUnits: 0, totalSales: 0, feeImpact: 0 });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

      const params = new URLSearchParams({
        country: country,
        month: month,
        year: year,
      });

      // ✅ ONLY GLOBAL sends homeCurrency
      if (isGlobalPage && homeCurrency) {
        params.set("homeCurrency", homeCurrency.toLowerCase());
      }

      const url = `${baseURL}/get_table_data/${fileName}?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error(`Failed to fetch referral data (${res.status})`);

      const json: any = await res.json();

      const table = json?.table ?? [];
      const arr: ReferralRow[] = Array.isArray(table) ? table : [];

      setRows(arr);
      setSkuwiseRows(arr);

      const accurate = Array.isArray(json?.accurate_data) ? json.accurate_data : [];
      const overcharged = Array.isArray(json?.overcharged_data) ? json.overcharged_data : [];
      const undercharged = Array.isArray(json?.undercharged_data) ? json.undercharged_data : [];
      const noRef = Array.isArray(json?.no_ref_fee_data) ? json.no_ref_fee_data : [];

      const mergedAll = [
        { Category: "Overcharged" },
        ...overcharged.map((r: any) => ({ Category: "Overcharged", ...r })),
        {},
        { Category: "Undercharged" },
        ...undercharged.map((r: any) => ({ Category: "Undercharged", ...r })),
        {},
        { Category: "No Ref Fees" },
        ...noRef.map((r: any) => ({ Category: "No Ref Fees", ...r })),
        {},
        { Category: "Accurate" },
        ...accurate.map((r: any) => ({ Category: "Accurate", ...r })),
      ];

      setAllOrdersByStatus(mergedAll);

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

      const mappedSummary: FeeSummaryRow[] = summarySource.map((r: ReferralRow) => ({
        label: String(r.sku ?? ""),
        units: Math.round(toNumberSafe(r.quantity)),
        sales: getNetSales(r),
        refFeesApplicable: toNumberSafe(r.answer),
        refFeesCharged: toNumberSafe(r.selling_fees),
        overcharged: toNumberSafe(r.difference),
      }));

      setFeeSummaryRows(mappedSummary);

      let totalUnits = 0;
      let totalSales = 0;
      let feeImpact = 0;

      for (const r of arr) {
        totalUnits += Math.round(toNumberSafe(r.quantity));
        totalSales += getNetSales(r);
        feeImpact += toNumberSafe(r.overcharged ?? r.difference);
      }

      setSummary({ ordersUnits: totalUnits, totalSales, feeImpact });
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
      setRows([]);
      setSkuwiseRows([]);
      setFeeSummaryRows([]);
      setAllOrdersByStatus([]);
      setSummary({ ordersUnits: 0, totalSales: 0, feeImpact: 0 });
    } finally {
      setLoading(false);
    }
  }, [month, year, country, fileName, isGlobalPage, homeCurrency]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  /* ===================== Derived ===================== */
  const totalFeeRow = useMemo<FeeSummaryRow | null>(() => {
    if (!feeSummaryRows.length) return null;
    const total =
      feeSummaryRows.find((r) => r.label && r.label.toLowerCase() === "total") ||
      feeSummaryRows[feeSummaryRows.length - 1];
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

  const skuTableAll: Row[] = useMemo(() => {
    if (!skuwiseRows.length) return [];

    const filtered = skuwiseRows.filter((r) => {
      const skuStr = String(r.sku ?? "");
      if (skuStr === "Grand Total") return true;
      return !skuStr.startsWith("Charge -");
    });

    return filtered.map((r) => {
      const quantity = Math.round(toNumberSafe(r.quantity));
      const sales = getNetSales(r);
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
    { key: "sales", header: "Net Sales", render: (_, v) => fmtCurrency(Number(v)) },
    { key: "applicable", header: "Ref Fees Applicable", render: (_, v) => fmtCurrency(Number(v)) },
    { key: "charged", header: "Ref Fees Charged", render: (_, v) => fmtCurrency(Number(v)) },
    { key: "overcharged", header: "Overcharged", render: (_, v) => <span>{fmtCurrency(Number(v))}</span> },
  ];

  const summaryColumns: ColumnDef<Row>[] = [
    { key: "label", header: "Ref. Fees" },
    { key: "units", header: "Units", render: (_, v) => fmtInteger(Number(v)) },
    { key: "sales", header: "Net Sales", render: (_, v) => fmtCurrency(Number(v)) },
    { key: "refFeesApplicable", header: "Ref Fees Applicable", render: (_, v) => fmtCurrency(Number(v)) },
    { key: "refFeesCharged", header: "Ref Fees Charged", render: (_, v) => fmtCurrency(Number(v)) },
    { key: "overcharged", header: "Overcharged", render: (_, v) => fmtCurrency(Number(v)) },
  ];

  const skuTableDisplay: Row[] = useMemo(() => {
    if (!skuTableAll.length) return [];

    const nonTotal = skuTableAll.filter((row) => !(row as any)._isTotal);
    const totalRow = skuTableAll.find((row) => (row as any)._isTotal) || null;

    if (!nonTotal.length) return totalRow ? [totalRow] : [];

    const sorted = [...nonTotal].sort(
      (a, b) => toNumberSafe((b as any).sales) - toNumberSafe((a as any).sales)
    );

    const top5 = sorted.slice(0, 5);
    const remaining = sorted.slice(5);
    let othersRow: Row | null = null;

    if (remaining.length) {
      const agg = remaining.reduce(
        (acc: any, row: any) => {
          acc.units += Math.round(toNumberSafe(row.units));
          acc.sales += toNumberSafe(row.sales);
          acc.applicable += toNumberSafe(row.applicable);
          acc.charged += toNumberSafe(row.charged);
          acc.overcharged += toNumberSafe(row.overcharged);
          return acc;
        },
        { units: 0, sales: 0, applicable: 0, charged: 0, overcharged: 0 }
      );

      othersRow = {
        sku: "Others",
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

  // const handleDownloadExcel = useCallback(() => {
  //   if (!feeSummaryRows.length && !skuTableAll.length && !rows.length) return;

  //   const wb = XLSX.utils.book_new();

  //   const summaryData = feeSummaryRows.map((r) => {
  //     const units = Math.round(toNumberSafe(r.units));
  //     const sales = toNumberSafe(r.sales);
  //     const applicable = toNumberSafe(r.refFeesApplicable);
  //     const charged = toNumberSafe(r.refFeesCharged);
  //     const overcharged = toNumberSafe(r.overcharged);

  //     return {
  //       "Ref Fees": r.label,
  //       Units: units,
  //       "Net Sales": Number(sales.toFixed(2)),
  //       "Ref Fees Applicable": Number(applicable.toFixed(2)),
  //       "Ref Fees Charged": Number(charged.toFixed(2)),
  //       Overcharged: Number(overcharged.toFixed(2)),
  //     };
  //   });

  //   XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Summary");

  //   XLSX.writeFile(wb, `Referral-Fees-${country}-${month}-${year}.xlsx`);
  // }, [feeSummaryRows, skuTableAll, rows, country, month, year]);

const handleDownloadExcel = useCallback(() => {
  if (!feeSummaryRows.length && !skuTableAll.length && !rows.length) return;

  const wb = XLSX.utils.book_new();

  /* ---------------- Sheet 1: Summary ---------------- */
  const summaryData = feeSummaryRows.map((r) => {
    const units = Math.round(toNumberSafe(r.units));
    const sales = toNumberSafe(r.sales);
    const applicable = toNumberSafe(r.refFeesApplicable);
    const charged = toNumberSafe(r.refFeesCharged);
    const overcharged = toNumberSafe(r.overcharged);

    return {
      "Ref Fees": r.label,
      Units: units,
      "Net Sales": Number(sales.toFixed(2)),
      "Ref Fees Applicable": Number(applicable.toFixed(2)),
      "Ref Fees Charged": Number(charged.toFixed(2)),
      Overcharged: Number(overcharged.toFixed(2)),
    };
  });

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Summary");

  /* ---------------- Sheet 2: Overcharged Ref Fees (SKU-wise) ---------------- */
  const overData = skuTableAll.map((r: any) => {
    const units = Math.round(toNumberSafe(r.units));
    const sales = toNumberSafe(r.sales);
    const applicable = toNumberSafe(r.applicable);
    const charged = toNumberSafe(r.charged);
    const overcharged = toNumberSafe(r.overcharged);

    return {
      SKU: String(r.sku ?? ""),
      "Product Name": String(r.productName ?? ""),
      Units: units,
      "Net Sales": Number(sales.toFixed(2)),
      "Ref Fees Applicable": Number(applicable.toFixed(2)),
      "Ref Fees Charged": Number(charged.toFixed(2)),
      Overcharged: Number(overcharged.toFixed(2)),
    };
  });

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(overData),
    "Overcharged Ref Fees"
  );

  /* ---------------- Sheet 3: Orders by Status (CLEANED) ---------------- */
  const cleanedOrdersByStatus = (allOrdersByStatus || []).map((r: any) => {
    // keep separators / headers as-is
    const isSeparatorRow =
      !r || Object.keys(r).length === 0 || (r.Category && Object.keys(r).length === 1);

    if (isSeparatorRow) return r;

    return {
      Category: r.Category ?? "",
      "Order ID": r.order_id ?? "",
      SKU: r.sku ?? "",
      "Product Name": r.product_name ?? "",
      Quantity: toNumberSafe(r.quantity),
      "Net Sales": getNetSales(r), // ✅ net sales
      "Referral Fees Applicable": toNumberSafe(r.answer),
      "Referral Fees Charged": toNumberSafe(r.selling_fees),
      Overcharged: toNumberSafe(r.difference ?? r.overcharged),
      Status: r.errorstatus ?? "",
    };
  });

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(cleanedOrdersByStatus),
    "Orders by Status"
  );

  /* ---------------- Save ---------------- */
  XLSX.writeFile(wb, `Referral-Fees-${country}-${month}-${year}.xlsx`);
}, [
  feeSummaryRows,
  skuTableAll,
  rows,
  allOrdersByStatus,
  country,
  month,
  year,
]);

  
  const canShowContent = !loading && !error && month && year;

  return (
    <div className="space-y-1.5 font-sans text-charcoal-500">
      <div className="flex items-baseline gap-2">
        <PageBreadcrumb pageTitle="Referral Fees -" variant="page" align="left" textSize="2xl" className="mb-0 md:mb-2" />
        <span className="text-[#5EA68E] font-bold text-lg sm:text-2xl md:text-2xl">
          {country.toUpperCase()}
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between">
        <MonthYearPickerTable
          month={month}
          year={year}
          yearOptions={[new Date().getFullYear(), new Date().getFullYear() - 1]}
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

      {!loading && !!error && (
        <div className="mt-5 box-border flex w-full items-center justify-between rounded-md border-t-4 border-[#ff5c5c] bg-[#f2f2f2] px-4 py-3 text-sm text-[#414042] lg:max-w-fit">
          <div className="flex items-center">
            <i className="fa-solid fa-circle-exclamation mr-2 text-lg text-[#ff5c5c]" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {canShowContent && (
        <>
          <PageBreadcrumb pageTitle="Summary Overview" variant="page" align="left" className="mt-0 md:mt-4 mb-0 md:mb-2" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#87AD12] bg-[#87AD1226] px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-xs sm:text-sm font-bold text-charcoal-500">Orders/Units</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
                {fmtInteger(cardSummary.ordersUnits)}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs font-medium text-charcoal-500">Total Units Processed</p>
            </div>

            <div className="rounded-xl border border-[#F47A00] bg-[#F47A0026] px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-xs sm:text-sm font-bold text-charcoal-500">Total Sales</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
                {fmtCurrency(cardSummary.totalSales)}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs font-medium text-charcoal-500">Revenue generated</p>
            </div>

            <div className="rounded-xl border border-[#FF5C5C] bg-[#FF5C5C26] px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-xs sm:text-sm font-bold text-charcoal-500">Fee Impact</p>
              <p className="mt-1 text-xl sm:text-2xl font-bold text-charcoal-500">
                {fmtCurrency(cardSummary.feeImpact)}
              </p>
              <p className="mt-1 text-[10px] sm:text-xs font-medium text-charcoal-500">Overcharged amount</p>
            </div>
          </div>

          <div className="mb-9">
            <OverlapSalesDonut
              sales={totalFeeRow?.sales ?? 0}
              applicable={totalFeeRow?.refFeesApplicable ?? 0}
              charged={totalFeeRow?.refFeesCharged ?? 0}
              fmtCurrency={fmtCurrency}
            />
          </div>

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
                columns={[
                  { key: "sku", header: "SKU" },
                  { key: "productName", header: "Product Name" },
                  { key: "units", header: "Units" },
                  { key: "sales", header: "Net Sales", render: (_, v) => fmtCurrency(Number(v)) },
                  { key: "applicable", header: "Ref Fees Applicable", render: (_, v) => fmtCurrency(Number(v)) },
                  { key: "charged", header: "Ref Fees Charged", render: (_, v) => fmtCurrency(Number(v)) },
                  { key: "overcharged", header: "Overcharged", render: (_, v) => <span>{fmtCurrency(Number(v))}</span> },
                ]}
                data={skuTableDisplay}
                paginate={false}
                scrollY={false}
                maxHeight="none"
                zebra={true}
                stickyHeader={false}
                rowClassName={(row) => ((row as any)._isTotal ? "bg-[#DDDDDD] font-bold" : "")}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
