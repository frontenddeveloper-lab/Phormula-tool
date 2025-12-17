// "use client";

// import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// import Loader from "@/components/loader/Loader";
// import DownloadIconButton from "@/components/ui/button/DownloadIconButton";
// import { RootState, useAppSelector } from "@/lib/store";
// import { useAmazonConnections } from "@/lib/utils/useAmazonConnections";
// import React, { useEffect, useState, useMemo, useCallback } from "react";
// import { useSelector } from "react-redux";
// import SegmentedToggle from "@/components/ui/SegmentedToggle";
// import DashboardBargraphCard from "@/components/dashboard/DashboardBargraphCard";
// import * as XLSX from "xlsx";
// import ExcelJS from "exceljs";
// import { saveAs } from "file-saver";

// /* ===================== ENV & ENDPOINTS ===================== */
// const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";
// const SHOPIFY_CCY = process.env.NEXT_PUBLIC_SHOPIFY_CURRENCY || "GBP";
// const SHOPIFY_TO_GBP = Number(process.env.NEXT_PUBLIC_SHOPIFY_TO_GBP || "1");
// const API_URL = `${baseURL}/amazon_api/orders`;
// const SHOPIFY_ENDPOINT = `${baseURL}/shopify/get_monthly_data`;
// const SHOPIFY_DROPDOWN_ENDPOINT = `${baseURL}/shopify/dropdown`;

// // your Flask route path
// const FX_ENDPOINT = `${baseURL}/currency-rate`;

// /** 💵 FX defaults (used until backend answers) */
// const GBP_TO_USD_ENV = Number(process.env.NEXT_PUBLIC_GBP_TO_USD || "1.31");
// const INR_TO_USD_ENV = Number(process.env.NEXT_PUBLIC_INR_TO_USD || "0.01128");

// const USE_MANUAL_LAST_MONTH =
//   (process.env.NEXT_PUBLIC_USE_MANUAL_LAST_MONTH || "false").toLowerCase() ===
//   "true";

// /** Put last month's TOTAL SALES in USD (not to-date) */
// const MANUAL_LAST_MONTH_USD_GLOBAL = Number(
//   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_GLOBAL || "0"
// );
// /** Optional per-region overrides */
// const MANUAL_LAST_MONTH_USD_UK = Number(
//   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_UK || "0"
// );
// const MANUAL_LAST_MONTH_USD_US = Number(
//   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_US || "0"
// );
// const MANUAL_LAST_MONTH_USD_CA = Number(
//   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_CA || "0"
// );

// /* ===================== DATE HELPERS ===================== */
// function getISTYearMonth() {
//   const optsMonth: Intl.DateTimeFormatOptions = {
//     timeZone: "Asia/Kolkata",
//     month: "long",
//   };
//   const optsYear: Intl.DateTimeFormatOptions = {
//     timeZone: "Asia/Kolkata",
//     year: "numeric",
//   };
//   const now = new Date();
//   const monthName = now.toLocaleString("en-US", optsMonth);
//   const yearStr = now.toLocaleString("en-US", optsYear);
//   return { monthName, year: Number(yearStr) };
// }

// function getPrevISTYearMonth() {
//   const tz = "Asia/Kolkata";
//   const now = new Date();
//   const istNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
//   const year =
//     istNow.getMonth() === 0 ? istNow.getFullYear() - 1 : istNow.getFullYear();
//   const monthIdx = istNow.getMonth() === 0 ? 11 : istNow.getMonth() - 1;
//   const monthName = new Date(year, monthIdx, 1).toLocaleString("en-US", {
//     month: "long",
//     timeZone: tz,
//   });
//   return { monthName, year };
// }

// function getPrevMonthShortLabel() {
//   const { monthName, year } = getPrevISTYearMonth();
//   const shortMon = new Date(`${monthName} 1, ${year}`).toLocaleString(
//     "en-US",
//     {
//       month: "short",
//       timeZone: "Asia/Kolkata",
//     }
//   );
//   return `${shortMon}'${String(year).slice(-2)}`; // e.g., Oct'25
// }

// function getThisMonthShortLabel() {
//   const now = new Date();

//   // Convert to IST explicitly
//   const istString = now.toLocaleString("en-US", {
//     timeZone: "Asia/Kolkata",
//   });
//   const istDate = new Date(istString);

//   // Extract month & year
//   const monthName = istDate.toLocaleString("en-US", {
//     month: "long",
//     timeZone: "Asia/Kolkata",
//   });

//   const year = istDate.getFullYear();

//   // Convert to short month (Jan, Feb, ...)
//   const shortMon = new Date(`${monthName} 1, ${year}`).toLocaleString(
//     "en-US",
//     {
//       month: "short",
//       timeZone: "Asia/Kolkata",
//     }
//   );

//   return `${shortMon}'${String(year).slice(-2)}`;  
// }


// function getISTDayInfo() {
//   const tz = "Asia/Kolkata";
//   const now = new Date();
//   const istNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
//   const todayDay = istNow.getDate();
//   const { monthName, year } = getPrevISTYearMonth();
//   const prevMonthIdx = new Date(`${monthName} 1, ${year}`).getMonth();
//   const daysInPrevMonth = new Date(year, prevMonthIdx + 1, 0).getDate();
//   const daysInThisMonth = new Date(
//     istNow.getFullYear(),
//     istNow.getMonth() + 1,
//     0
//   ).getDate();
//   return { todayDay, daysInPrevMonth, daysInThisMonth };
// }

// /* ===================== UI HELPERS ===================== */
// const ValueOrSkeleton = ({
//   loading,
//   children,
//   compact = false,
//   mode = "replace",
// }: {
//   loading: boolean;
//   children: React.ReactNode;
//   compact?: boolean;
//   mode?: "replace" | "inline";
// }) => {
//   if (mode === "inline") {
//     return (
//       <span className="inline-flex items-center gap-1">
//         {children}
//         {loading && (
//           <Loader
//             size={compact ? 16 : 20}
//             transparent
//             roundedClass="rounded-full"
//             backgroundClass="bg-transparent"
//             className="text-gray-400"
//             forceFallback
//           />
//         )}
//       </span>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="inline-flex items-center justify-center">
//         <Loader
//           size={compact ? 28 : 36}
//           transparent
//           roundedClass="rounded-full"
//           backgroundClass="bg-transparent"
//           className="text-gray-400"
//           forceFallback
//         />
//       </div>
//     );
//   }
//   return <>{children}</>;
// };

// /* ---------- Formatters & Safe Number ---------- */
// const fmtCurrency = (val: any, ccy = "GBP") => {
//   if (val === null || val === undefined || val === "" || isNaN(Number(val)))
//     return "—";
//   return new Intl.NumberFormat("en-GB", {
//     style: "currency",
//     currency: ccy,
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(Number(val));
// };

// const fmtGBP = (val: any) => fmtCurrency(val, "GBP");

// const fmtUSD = (val: any) => {
//   if (val === null || val === undefined || val === "" || isNaN(Number(val)))
//     return "—";
//   return new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "USD",
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(Number(val));
// };

// const fmtShopify = (val: any) => {
//   if (val === null || val === undefined || val === "" || isNaN(Number(val)))
//     return "—";
//   return new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(Number(val));
// };

// const fmtNum = (val: any) =>
//   val === null || val === undefined || val === "" || isNaN(Number(val))
//     ? "—"
//     : new Intl.NumberFormat("en-GB", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(Number(val));

// const fmtPct = (val: any) =>
//   val === null || val === undefined || isNaN(Number(val))
//     ? "—"
//     : `${Number(val).toFixed(2)}%`;

// const fmtUSDk = (val: any) => {
//   if (val === null || val === undefined || val === "" || isNaN(Number(val)))
//     return "—";
//   const n = Number(val);
//   const abs = Math.abs(n);

//   if (abs < 1000) {
//     return fmtUSD(n);
//   }

//   const k = n / 1000;
//   const base = new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "USD",
//     minimumFractionDigits: 1,
//     maximumFractionDigits: 1,
//   }).format(k);

//   return `${base}k`;
// };

// const fmtInt = (val: any) =>
//   val === null || val === undefined || val === "" || isNaN(Number(val))
//     ? "—"
//     : new Intl.NumberFormat("en-GB", {
//       maximumFractionDigits: 0,
//     }).format(Math.round(Number(val)));

// const toNumberSafe = (v: any) => {
//   if (v === null || v === undefined) return 0;
//   if (typeof v === "number") return v;
//   const s = String(v).replace(/[, ]+/g, "");
//   const n = Number(s);
//   return isNaN(n) ? 0 : n;
// };

// const calcDeltaPct = (current: number, previous: number | null | undefined) => {
//   const prev = Number(previous ?? 0);
//   const curr = Number(current ?? 0);

//   if (!prev || !Number.isFinite(prev)) return null; // avoid divide-by-zero
//   const pct = ((curr - prev) / prev) * 100;
//   return pct;
// };




// /* ===================== SALES TARGET CARD ===================== */
// type RegionKey = "Global" | "UK" | "US" | "CA";

// type RegionMetrics = {
//   mtdUSD: number;
//   lastMonthToDateUSD: number;
//   lastMonthTotalUSD: number;
//   targetUSD: number;
// };

// type AmazonStatCardProps = {
//   label: string;
//   current: number | null | undefined;
//   previous: number | null | undefined;
//   loading: boolean;
//   formatter?: (v: any) => string;
//   bottomLabel: string; // e.g. "Nov'25"
//   className?: string;  // color styles per card
// };


// function SalesTargetCard({
//   regions,
//   defaultRegion = "Global",
// }: {
//   regions: Record<RegionKey, RegionMetrics>;
//   defaultRegion?: RegionKey;
// }) {
//   // 🔹 Build list of tabs: Global + only connected countries
//   const availableRegions = useMemo<RegionKey[]>(() => {
//     const list: RegionKey[] = ["Global"]; // Global always present

//     (["UK", "US", "CA"] as RegionKey[]).forEach((key) => {
//       const r = regions[key];
//       if (!r) return;

//       // treat region as "connected" if it has any non-zero metric
//       if (
//         r.mtdUSD ||
//         r.lastMonthToDateUSD ||
//         r.lastMonthTotalUSD ||
//         r.targetUSD
//       ) {
//         list.push(key);
//       }
//     });

//     return list;
//   }, [regions]);

//   // 🔹 Just keep local tab state – no effect that resets it
//   const [tab, setTab] = useState<RegionKey>("Global");

//   const data = regions[tab] || regions.Global;
//   const { mtdUSD, lastMonthToDateUSD, lastMonthTotalUSD, targetUSD } = data;

//   const pct = targetUSD > 0 ? Math.min(mtdUSD / targetUSD, 1) : 0;
//   const pctLastMTD =
//     targetUSD > 0 ? Math.min(lastMonthToDateUSD / targetUSD, 1) : 0;

//   const deltaPct = (pct - pctLastMTD) * 100;

//   const { todayDay } = getISTDayInfo();
//   const todayApprox = todayDay > 0 ? mtdUSD / todayDay : 0;

//   const prevLabel = getPrevMonthShortLabel();
//   const thisMonthLabel = getThisMonthShortLabel(); // e.g. "Feb"

//   const size = 280;
//   const strokeMain = 10;
//   const strokeLast = 5;

//   const cx = size / 2;
//   const rBase = size / 2 - strokeMain;
//   const gap = 15;

//   const rTarget = rBase;
//   const rCurrent = rBase;
//   const rLastMTD = rCurrent - strokeMain / 2 - gap - strokeLast / 2;

//   const toXYRadius = (angDeg: number, radius: number) => {
//     const rad = (Math.PI / 180) * (180 - angDeg);
//     return {
//       x: cx + radius * Math.cos(rad),
//       y: size / 2 - radius * Math.sin(rad),
//     };
//   };

//   const arcPath = (fromDeg: number, toDeg: number, radius: number) => {
//     const start = toXYRadius(fromDeg, radius);
//     const end = toXYRadius(toDeg, radius);
//     const largeArc = toDeg - fromDeg > 180 ? 1 : 0;
//     return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
//   };

//   const fullFrom = 0;
//   const fullTo = 180;
//   const toDeg_MTD = 180 * pct;
//   const toDeg_LastMTD = 180;

//   const knobGreen = toXYRadius(toDeg_MTD, rCurrent);
//   const knobYellow = toXYRadius(toDeg_LastMTD, rLastMTD);

//   const badgeIsUp = deltaPct >= 0;
//   const badgeStr =
//     (badgeIsUp ? "▲ " : "▼ ") + `${Math.abs(deltaPct).toFixed(2)}%`;

//   return (
//     <div className="h-full rounded-2xl border bg-white py-5 px-2 shadow-sm flex flex-col">
//       {/* Header with tabs */}
//       <div className="flex flex-col items-center justify-between gap-2">
//         <PageBreadcrumb
//           pageTitle="Sales Target"
//           textSize="2xl"
//           variant="page"
//           align="center"
//         />

//         <SegmentedToggle<RegionKey>
//           value={tab}
//           options={availableRegions.map((r) => ({ value: r }))}
//           onChange={setTab}
//           className="my-1 md:my-8"
//         />
//       </div>

//       {/* Legend */}
//       {/* <div className="mt-5 mb-2 flex items-center justify-between gap-2 text-xs">
//         <div className="flex items-center gap-2">
//           <span
//             className="inline-block h-3 w-3 rounded-sm"
//             style={{ background: "#5EA68E" }}
//           />
//           <span className="text-gray-600">MTD Sales</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <span
//             className="inline-block h-3 w-3 rounded-sm"
//             style={{ background: "#9ca3af" }}
//           />
//           <span className="text-gray-600">This Month Target</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <span
//             className="inline-block h-3 w-3 rounded-sm"
//             style={{ background: "#FFBE25" }}
//           />
//           <span className="text-gray-600">{prevLabel} MTD</span>
//         </div>
//       </div> */}

//       {/* Legend */}
//       <div className="mt-5 mb-2 flex items-center gap-2 text-xs">
//         <div className="flex flex-1 items-center justify-center gap-2">
//           <span
//             className="block h-3 w-3 rounded-sm shrink-0"
//             style={{ backgroundColor: "#5EA68E" }}
//           />
//           <span className="text-gray-600">MTD Sales</span>
//         </div>

//         <div className="flex flex-1 items-center justify-center gap-2">
//           <span
//             className="block h-3 w-3 rounded-sm shrink-0"
//             style={{ backgroundColor: "#9ca3af" }}
//           />
//           <span className="text-gray-600">{thisMonthLabel} Target</span>
//         </div>

//         <div className="flex flex-1 items-center justify-center gap-2">
//           <span
//             className="block h-3 w-3 rounded-sm shrink-0"
//             style={{ backgroundColor: "#FFBE25" }}
//           />
//           <span className="text-gray-600">{prevLabel} MTD</span>
//         </div>
//       </div>



//       {/* 🔹 Middle section grows to fill available height */}
//       <div className="flex-1 flex flex-col items-center justify-center mt-4 md:mt-10 ">
//         {/* Gauge */}
//         <div className="mt-2 md:mt-0 flex items-center justify-center">
//           <svg
//             width={size}
//             height={size / 2}
//             viewBox={`0 0 ${size} ${size / 2}`}
//           >
//             {/* arcs & knobs as you had */}
//             <path
//               d={arcPath(fullFrom, fullTo, rTarget)}
//               fill="none"
//               stroke="#e5e7eb"
//               strokeWidth={strokeMain}
//               strokeLinecap="round"
//             />
//             <path
//               d={arcPath(fullFrom, toDeg_LastMTD, rLastMTD)}
//               fill="none"
//               stroke="#f59e0b"
//               strokeWidth={strokeLast}
//               strokeLinecap="round"
//             />
//             <path
//               d={arcPath(fullFrom, toDeg_MTD, rCurrent)}
//               fill="none"
//               stroke="#5EA68E"
//               strokeWidth={strokeMain}
//               strokeLinecap="round"
//             />
//             <circle
//               cx={knobYellow.x}
//               cy={knobYellow.y}
//               r={10}
//               fill="#f59e0b"
//               stroke="#fffbeb"
//               strokeWidth={4}
//             />
//             <circle
//               cx={knobGreen.x}
//               cy={knobGreen.y}
//               r={14}
//               fill="#5EA68E"
//               stroke="#ecfdf3"
//               strokeWidth={5}
//             />
//           </svg>
//         </div>

//         {/* Center metrics */}
//         <div className="mt-2 text-center">
//           <div className="text-3xl font-bold">{(pct * 100).toFixed(1)}%</div>
//           <div
//             className={`mx-auto mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${badgeIsUp
//               ? "bg-green-50 text-green-700"
//               : "bg-rose-50 text-rose-700"
//               }`}
//           >
//             {badgeStr}
//           </div>
//         </div>
//       </div>

//       <div className="mt-3 md:mt-12 mb-3 grid grid-cols-2 gap-4 text-sm">
//         <div className="flex flex-col text-center items-center justify-between rounded-xl bg-gray-50 p-3">
//           <div className="text-gray-500">Today's Sale</div>
//           <div className="mt-0.5 font-semibold">{fmtUSDk(todayApprox)}</div>
//         </div>

//         <div className="flex flex-col text-center items-center justify-between rounded-xl bg-gray-50 p-3">
//           <div className="text-gray-500">MTD Sales</div>
//           <div className="mt-0.5 font-semibold">{fmtUSDk(mtdUSD)}</div>
//         </div>

//         <div className="flex flex-col text-center items-center justify-between rounded-xl bg-gray-50 p-3">
//           <div className="text-gray-500">Sales Target</div>
//           <div className="mt-0.5 font-semibold">{fmtUSDk(targetUSD)}</div>
//         </div>

//         <div className="flex flex-col text-center items-center justify-between rounded-xl bg-gray-50 p-3">
//           <div className="text-gray-500">{prevLabel} Sales</div>
//           <div className="mt-0.5 font-semibold">
//             {fmtUSDk(lastMonthTotalUSD)}
//           </div>
//         </div>
//       </div>

//     </div>
//   );
// }


// // function AmazonStatCard({
// //   label,
// //   current,
// //   previous,
// //   loading,
// //   formatter = fmtGBP,
// //   bottomLabel,
// //   className,
// // }: AmazonStatCardProps) {
// //   const currVal = toNumberSafe(current);
// //   const prevVal = previous != null ? toNumberSafe(previous) : 0;

// //   const delta = calcDeltaPct(currVal, prevVal); // may be null
// //   const isUp = delta != null && delta >= 0;

// //   const deltaText =
// //     delta == null ? "—" : `${isUp ? "+" : ""}${delta.toFixed(2)}%`;

// //   const deltaColor =
// //     delta == null
// //       ? "text-gray-500"
// //       : isUp
// //         ? "text-emerald-600"
// //         : "text-rose-600";

// //   return (
// //     <div
// //       className={`rounded-2xl border bg-white p-4 shadow-sm flex flex-col justify-between ${className || ""}`}
// //     >
// //       {/* label */}
// //       <div className="text-xs font-medium text-charcoal-500">{label}</div>

// //       {/* current value */}
// //       <div className="mt-1 text-lg font-semibold">
// //         <ValueOrSkeleton loading={loading} mode="inline" compact>
// //           {formatter(currVal)}
// //         </ValueOrSkeleton>
// //       </div>

// //       {/* last month + % change */}
// //       <div className="mt-3 flex items-center justify-between text-[11px]">
// //         <div className="flex flex-col">
// //           <span className="text-gray-400">{bottomLabel}</span>
// //           <span className="font-medium text-gray-700">
// //             {previous == null ? "—" : formatter(prevVal)}
// //           </span>
// //         </div>

// //         <div
// //           className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${delta == null
// //               ? "bg-gray-50"
// //               : isUp
// //                 ? "bg-emerald-50"
// //                 : "bg-rose-50"
// //             } ${deltaColor}`}
// //         >
// //           {deltaText}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// function AmazonStatCard({
//   label,
//   current,
//   previous,
//   loading,
//   formatter = fmtGBP,
//   bottomLabel,
//   className,
// }: AmazonStatCardProps) {
//   const currVal = toNumberSafe(current);
//   const prevVal = previous != null ? toNumberSafe(previous) : 0;

//   const delta = calcDeltaPct(currVal, prevVal); // may be null
//   const isUp = delta != null && delta >= 0;

//   // caret + % text
//   let deltaContent: React.ReactNode = "—";
//   if (delta != null) {
//     deltaContent = (
//       <>
//         <span className="mr-0.5">{isUp ? "▲" : "▼"}</span>
//         {Math.abs(delta).toFixed(2)}%
//       </>
//     );
//   }

//   const deltaColor =
//     delta == null
//       ? "text-gray-500"
//       : isUp
//         ? "text-emerald-600"
//         : "text-rose-600";

//   return (
//     <div
//       className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between ${className || ""
//         }`}
//     >
//       {/* label */}
//       <div className="text-sm font-medium text-charcoal-500">{label}</div>

//       {/* current value */}
//       <div className="mt-1 text-lg font-semibold">
//         <ValueOrSkeleton loading={loading} mode="inline" compact>
//           {formatter(currVal)}
//         </ValueOrSkeleton>
//       </div>

//       {/* last month + % change */}
//       <div className="mt-3 flex 
//       items-center justify-between text-xs text-charcoal-500">
//         <div className="flex flex-col">
//           <span className="">{bottomLabel}:</span>
//           <span className="font-medium ">
//             {previous == null ? "—" : formatter(prevVal)}
//           </span>
//         </div>

//         {/* JUST bold colored text, no bg pill */}
//         <div className={`inline-flex items-center text-[11px] font-semibold ${deltaColor}`}>
//           {deltaContent}
//         </div>
//       </div>
//     </div>
//   );
// }


// /* ===================== SIMPLE BAR CHART ===================== */
// function SimpleBarChart({
//   items,
//   height = 300,
//   padding = { top: 28, right: 24, bottom: 56, left: 24 },
//   colors = ["#2CA9E0", "#ff5c5c", "#AB64B5", "#F47A00", "#00627D", "#87AD12"],
// }: {
//   items: Array<{ label: string; raw: number; display: string }>;
//   height?: number;
//   padding?: { top: number; right: number; bottom: number; left: number };
//   colors?: string[];
// }) {
//   const [animateIn, setAnimateIn] = useState(false);
//   const [hoverIdx, setHoverIdx] = useState<number | null>(null);

//   useEffect(() => {
//     const t = setTimeout(() => setAnimateIn(true), 50);
//     return () => clearTimeout(t);
//   }, []);

//   const width = 760;
//   const innerW = width - padding.left - padding.right;
//   const innerH = height - padding.top - padding.bottom;
//   const values = items.map((d) =>
//     Number.isFinite(d.raw) ? Math.abs(Number(d.raw)) : 0
//   );
//   const max = Math.max(1, ...values);
//   const baseBarW = Math.max(12, (innerW / Math.max(1, items.length)) * 0.4);

//   const Tooltip = ({
//     x,
//     y,
//     label,
//     display,
//     color,
//   }: {
//     x: number;
//     y: number;
//     label: string;
//     display: string;
//     color: string;
//   }) => {
//     const textY1 = y - 30;
//     const text = `${label}: ${display}`;
//     return (
//       <g>
//         <rect
//           x={x - 70}
//           y={textY1 - 24}
//           width={140}
//           height={24}
//           rx={6}
//           fill="#111827"
//           opacity="0.9"
//         />
//         <text
//           x={x}
//           y={textY1 - 8}
//           textAnchor="middle"
//           fontSize="11"
//           fill="#ffffff"
//           style={{ pointerEvents: "none" }}
//         >
//           {text}
//         </text>
//         <polygon
//           points={`${x - 6},${textY1} ${x + 6},${textY1} ${x},${textY1 + 6
//             }`}
//           fill="#111827"
//           opacity="0.9"
//         />
//         <circle
//           cx={x}
//           cy={y}
//           r="6.5"
//           fill="none"
//           stroke={color}
//           strokeWidth={2}
//         />
//       </g>
//     );
//   };

//   return (
//     <div className="w-full overflow-x-auto ">
//       <svg
//         viewBox={`0 0 ${width} ${height}`}
//         className="w-full min-w-[760px] select-none"
//       >
//         <defs>
//           <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
//             <feDropShadow
//               dx="0"
//               dy="1.5"
//               stdDeviation="2"
//               floodColor="#000000"
//               floodOpacity="0.15"
//             />
//           </filter>
//         </defs>

//         <line
//           x1={padding.left}
//           y1={height - padding.bottom}
//           x2={width - padding.right}
//           y2={height - padding.bottom}
//           stroke="#e5e7eb"
//         />

//         {items.map((d, i) => {
//           const v = values[i];
//           const hFull = (v / max) * innerH;
//           const barH = animateIn ? hFull : 0;
//           const band = innerW / Math.max(1, items.length);
//           const xCenter = padding.left + band * i + band / 2;
//           const barW = hoverIdx === i ? baseBarW + 6 : baseBarW;
//           const x = xCenter - barW / 2;
//           const y = padding.top + (innerH - barH);
//           const color = colors[i % colors.length];

//           return (
//             <g
//               key={d.label}
//               onMouseEnter={() => setHoverIdx(i)}
//               onMouseLeave={() => setHoverIdx(null)}
//               style={{ cursor: "pointer" }}
//             >
//               <rect
//                 x={x}
//                 y={y}
//                 width={barW}
//                 height={Math.max(0, barH)}
//                 rx={8}
//                 fill={color}
//                 filter="url(#barShadow)"
//                 opacity={hoverIdx === i ? 0.95 : 0.85}
//               />
//               <text
//                 x={xCenter}
//                 y={y - 10}
//                 textAnchor="middle"
//                 fontSize={12}
//                 fontWeight={600}
//                 fill="#111827"
//               >
//                 {d.display}
//               </text>
//               <text
//                 x={xCenter}
//                 y={height - padding.bottom + 20}
//                 textAnchor="middle"
//                 fontSize={12}
//                 fill="#6b7280"
//               >
//                 {d.label}
//               </text>
//               {hoverIdx === i && (
//                 <Tooltip
//                   x={xCenter}
//                   y={y}
//                   label={d.label}
//                   display={d.display}
//                   color={color}
//                 />
//               )}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// }


// const parsePercentToNumber = (value: string | number | null | undefined): number | null => {
//   if (value == null) return null;
//   const raw = typeof value === "number" ? String(value) : value;
//   const cleaned = raw.replace("%", "").trim(); // handles "+21.43%", "-0.19%", etc.
//   const n = Number(cleaned);
//   return Number.isNaN(n) ? null : n;
// };

// const renderPercentage = (value: number | null) => {
//   if (value == null) return null;

//   const isPositive = value > 0;
//   const isNegative = value < 0;

//   const icon = isPositive ? "▲" : isNegative ? "▼" : "";
//   const color = isPositive ? "green" : isNegative ? "red" : "inherit";

//   return (
//     <span style={{ color, fontWeight: "bold" }}>
//       {icon} {Math.abs(value).toFixed(1)}%
//     </span>
//   );
// };


// const getCurrencySymbol = (country: string) => {
//   switch (country.toLowerCase()) {
//     case "uk":
//       return "£";
//     case "india":
//       return "₹";
//     case "us":
//       return "$";
//     case "europe":
//     case "eu":
//       return "€";
//     case "global":
//       return "$";
//     default:
//       return "¤";
//   }
// };


// /* ===================== MAIN PAGE ===================== */
// export default function DashboardPage() {
//   // Amazon
//   const [loading, setLoading] = useState(false);
//   const [unauthorized, setUnauthorized] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [data, setData] = useState<any>(null);

//   // Amazon connections (real integration status)
//   const { connections: amazonConnections } = useAmazonConnections();

//   // Shopify (current month)
//   const [shopifyLoading, setShopifyLoading] = useState(false);
//   const [shopifyError, setShopifyError] = useState<string | null>(null);
//   const [shopifyRows, setShopifyRows] = useState<any[]>([]);
//   const shopify = shopifyRows?.[0] || null;

//   // Shopify (previous month)
//   const [shopifyPrevRows, setShopifyPrevRows] = useState<any[]>([]);

//   // Shopify store info (shop_name + access_token)
//   const [shopifyStore, setShopifyStore] = useState<any | null>(null);

//   // which region tab is selected in the Amazon card
//   const [amazonRegion, setAmazonRegion] = useState<RegionKey>("Global");

//   // which region is selected in the P&L graph
//   const [graphRegion, setGraphRegion] = useState<RegionKey>("Global");

//   const chartRef = React.useRef<HTMLDivElement | null>(null);

//   const prevLabel = useMemo(() => getPrevMonthShortLabel(), []);

//   // FX rates: GBP→USD (Amazon UK) and INR→USD (Shopify India)
//   const [gbpToUsd, setGbpToUsd] = useState(GBP_TO_USD_ENV);
//   const [inrToUsd, setInrToUsd] = useState(INR_TO_USD_ENV);
//   const [fxLoading, setFxLoading] = useState(false);

//   // ===================== CURRENT INVENTORY (AUTO CURRENT MONTH) =====================
// // ===================== CURRENT INVENTORY (AUTO CURRENT MONTH) =====================
// type InventoryRow = Record<string, string | number>;

// const [invLoading, setInvLoading] = useState(false);
// const [invError, setInvError] = useState<string>("");
// const [invRows, setInvRows] = useState<InventoryRow[]>([]);

// // ✅ chart-country follow
// const inventoryCountry = useMemo(() => {
//   const v = (graphRegion || "").toString().trim().toLowerCase();
//   return v.length ? v : "global";
// }, [graphRegion]);

// // ✅ current month/year auto (IST)
// const invMonthYear = useMemo(() => {
//   const { monthName, year } = getISTYearMonth();
//   return { month: monthName.toLowerCase(), year: String(year) };
// }, []);

// const getCurrentInventoryEndpoint = useCallback(() => {
//   return inventoryCountry === "global"
//     ? `${baseURL}/current_inventory_global`
//     : `${baseURL}/current_inventory`;
// }, [inventoryCountry]);

// // backend month column: "Current Month Units Sold (MonthName)" (dynamic)
// const findMtdKey = useCallback((row: InventoryRow) => {
//   const key = Object.keys(row).find((k) =>
//     k.toLowerCase().startsWith("current month units sold")
//   );
//   return key || "";
// }, []);

// // ✅ Sales for past 30 days: backend may call it "Others" or something else
// const findSales30Key = useCallback((row: InventoryRow) => {
//   const keys = Object.keys(row);

//   const exactOthers = keys.find((k) => k.trim().toLowerCase() === "others");
//   if (exactOthers) return exactOthers;

//   const past30 = keys.find((k) => k.toLowerCase().includes("past 30"));
//   if (past30) return past30;

//   const days30 = keys.find((k) => k.toLowerCase().includes("30 days"));
//   if (days30) return days30;

//   const same = keys.find((k) => k.trim().toLowerCase() === "sales for past 30 days");
//   if (same) return same;

//   return "";
// }, []);

// const invDisplayedColumns = useMemo(() => {
//   return [
//     "Sno.",
//     ...(inventoryCountry !== "global" ? ["SKU"] : []),
//     "Product Name",
//     "Current Inventory",
//     "MTD Sales",
//     "Sales for past 30 days",
//     "Inventory Coverage Ratio (In Months)",
//     "Inventory Alerts",
//   ];
// }, [inventoryCountry]);

// const getInvCellValue = useCallback(
//   (row: InventoryRow, col: string) => {
//     const beginningKey = "Inventory at the beginning of the month";
//     const inwardKey = "Inventory Inwarded";

//     const mtdKey = findMtdKey(row);
//     const sales30Key = findSales30Key(row);

//     const currentInventory = toNumberSafe(row[beginningKey]);
//     const mtdSales = toNumberSafe(mtdKey ? row[mtdKey] : 0);
//     const sales30 = toNumberSafe(sales30Key ? row[sales30Key] : 0);
//     const inwarded = toNumberSafe(row[inwardKey]);

//     switch (col) {
//       case "SKU":
//         return row["SKU"];
//       case "Product Name":
//         return row["Product Name"];
//       case "Current Inventory":
//         return currentInventory;
//       case "MTD Sales":
//         return mtdSales;
//       case "Sales for past 30 days":
//         return sales30;
//       case "Inventory Coverage Ratio (In Months)": {
//         const denom = mtdSales + sales30;
//         if (!denom || denom <= 0) return "—";
//         const ratio = currentInventory / denom;
//         return Number.isFinite(ratio) ? ratio : "—";
//       }
//       case "Inventory Alerts": {
//         const denom = mtdSales + sales30;
//         if (!denom || denom <= 0) return "";
//         const ratio = currentInventory / denom;
//         if (ratio < 1) return "Low";
//         if (ratio < 2) return "Watch";
//         return "";
//       }
//       default:
//         return row[col as keyof InventoryRow];
//     }
//   },
//   [findMtdKey, findSales30Key]
// );

// const splitInventoryRows = useMemo(() => {
//   if (!invRows?.length) return { top5: [] as InventoryRow[], other: [] as InventoryRow[] };

//   const usable = invRows.filter((r) => {
//     const name = String(r["Product Name"] ?? "").trim();
//     const sku = String(r["SKU"] ?? "").trim();
//     return name.length > 0 || sku.length > 0;
//   });

//   const withMtd = usable.map((r) => {
//     const mtdKey = findMtdKey(r);
//     const mtd = toNumberSafe(mtdKey ? r[mtdKey] : 0);
//     return { row: r, mtd };
//   });

//   withMtd.sort((a, b) => b.mtd - a.mtd);

//   return {
//     top5: withMtd.slice(0, 5).map((x) => x.row),
//     other: withMtd.slice(5).map((x) => x.row),
//   };
// }, [invRows, findMtdKey]);

// const fetchCurrentInventory = useCallback(async () => {
//   const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

//   if (!token) {
//     setInvError("Authorization token is missing");
//     setInvRows([]);
//     return;
//   }

//   setInvLoading(true);
//   setInvError("");

//   try {
//     const endpoint = getCurrentInventoryEndpoint();
//     const { month, year } = invMonthYear;

//     const res = await fetch(endpoint, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ month, year, country: inventoryCountry }),
//     });

//     if (!res.ok) {
//       const errJson = await res.json().catch(() => ({}));
//       throw new Error(errJson?.error || "Failed to fetch CurrentInventory data");
//     }

//     const json = await res.json();
//     const fileData: string | undefined = json?.data;
//     if (!fileData) throw new Error(json?.message || "Empty file received from server");

//     const byteCharacters = atob(fileData);
//     const buffers: ArrayBuffer[] = [];
//     for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
//       const slice = byteCharacters.slice(offset, offset + 1024);
//       const byteNumbers = new Array(slice.length);
//       for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
//       buffers.push(new Uint8Array(byteNumbers).buffer as ArrayBuffer);
//     }

//     const blob = new Blob(buffers, {
//       type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     });

//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const arr = new Uint8Array(e.target?.result as ArrayBuffer);
//       const wb = XLSX.read(arr, { type: "array" });
//       const sheetName = wb.SheetNames[0];
//       const sheet = wb.Sheets[sheetName];
//       const jsonData = XLSX.utils.sheet_to_json<InventoryRow>(sheet, { defval: "" });
//       setInvRows(jsonData);
//     };

//     reader.readAsArrayBuffer(blob);
//   } catch (e: any) {
//     setInvError(e?.message || "Unknown error");
//     setInvRows([]);
//   } finally {
//     setInvLoading(false);
//   }
// }, [getCurrentInventoryEndpoint, invMonthYear, inventoryCountry]);

// // ✅ country change triggers inventory fetch (chart selector follow)
// useEffect(() => {
//   fetchCurrentInventory();
// }, [inventoryCountry, fetchCurrentInventory]);




//   const fetchFxRates = useCallback(async () => {
//     try {
//       setFxLoading(true);

//       const token =
//         typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

//       const headers: HeadersInit = {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       };
//       if (token) {
//         (headers as any).Authorization = `Bearer ${token}`;
//       }

//       // Use IST month/year (same helpers you already have)
//       const { monthName, year } = getISTYearMonth();
//       const month = monthName.toLowerCase();

//       const commonBody = {
//         month,
//         year,
//         fetch_if_missing: true,
//       };

//       // 1) Amazon UK: GBP → USD, country='uk'
//       // 2) Shopify India: INR → USD, country='india'
//       const [ukRes, inrRes] = await Promise.all([
//         fetch(FX_ENDPOINT, {
//           method: "POST",
//           headers,
//           body: JSON.stringify({
//             ...commonBody,
//             user_currency: "GBP",
//             country: "uk",
//             selected_currency: "USD",
//           }),
//         }),
//         fetch(FX_ENDPOINT, {
//           method: "POST",
//           headers,
//           body: JSON.stringify({
//             ...commonBody,
//             user_currency: "INR",
//             country: "india",
//             selected_currency: "USD",
//           }),
//         }),
//       ]);

//       if (ukRes.ok) {
//         const json = await ukRes.json();
//         const rate = json?.record?.conversion_rate;
//         if (json?.success && rate != null) {
//           setGbpToUsd(Number(rate));
//         }
//       } else {
//         console.warn("UK FX fetch failed:", ukRes.status);
//       }

//       if (inrRes.ok) {
//         const json = await inrRes.json();
//         const rate = json?.record?.conversion_rate;
//         if (json?.success && rate != null) {
//           setInrToUsd(Number(rate));
//         }
//       } else {
//         console.warn("INR FX fetch failed:", inrRes.status);
//       }
//     } catch (err) {
//       console.error("Failed to fetch FX rates", err);
//     } finally {
//       setFxLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchFxRates();
//   }, [fetchFxRates]);


//   const brandName = useSelector(
//     (state: RootState) => state.auth.user?.brand_name
//   );

//   const fetchAmazon = useCallback(async () => {
//     setLoading(true);
//     setUnauthorized(false);
//     setError(null);
//     try {
//       const token =
//         typeof window !== "undefined"
//           ? localStorage.getItem("jwtToken")
//           : null;
//       if (!token) {
//         setUnauthorized(true);
//         throw new Error("No token found. Please sign in.");
//       }
//       const res = await fetch(API_URL, {
//         method: "GET",
//         headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
//         credentials: "omit",
//       });
//       if (res.status === 401) {
//         setUnauthorized(true);
//         throw new Error("Unauthorized — token missing/invalid/expired.");
//       }
//       if (!res.ok) throw new Error(`Request failed: ${res.status}`);
//       const json = await res.json();
//       setData(json);
//     } catch (e: any) {
//       setError(e?.message || "Failed to load data");
//       setData(null);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // Fetch Shopify store info (shop_name + access_token)
//   useEffect(() => {
//     const fetchShopifyStore = async () => {
//       try {
//         const token =
//           typeof window !== "undefined"
//             ? localStorage.getItem("jwtToken")
//             : null;
//         if (!token) {
//           console.log("No JWT found for Shopify store lookup");
//           return;
//         }

//         const res = await fetch(`${baseURL}/shopify/store`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         const ct = res.headers.get("content-type") || "";
//         if (!ct.includes("application/json")) {
//           const text = await res.text();
//           console.error("Non-JSON /shopify/store response:", text);
//           return;
//         }

//         const data = await res.json();

//         if (!res.ok || data?.error) return;

//         setShopifyStore(data);
//       } catch (err) {
//         console.error("Error fetching Shopify store in Dashboard:", err);
//       }
//     };

//     fetchShopifyStore();
//   }, []);

//   const fetchShopify = useCallback(async () => {
//     setShopifyLoading(true);
//     setShopifyError(null);
//     try {
//       const user_token =
//         typeof window !== "undefined"
//           ? localStorage.getItem("jwtToken")
//           : null;
//       if (!user_token) throw new Error("No token found. Please sign in.");

//       if (!shopifyStore?.shop_name || !shopifyStore?.access_token) {
//         throw new Error("Shopify store not connected.");
//       }

//       const { monthName, year } = getISTYearMonth();

//       const params = new URLSearchParams({
//         range: "monthly",
//         month: monthName.toLowerCase(),
//         year: String(year),
//         user_token,
//         shop: shopifyStore.shop_name,
//         token: shopifyStore.access_token,
//       });

//       const url = `${SHOPIFY_DROPDOWN_ENDPOINT}?${params.toString()}`;

//       const res = await fetch(url, {
//         method: "GET",
//         headers: {
//           Accept: "application/json",
//           Authorization: `Bearer ${user_token}`,
//         },
//         credentials: "omit",
//       });

//       if (res.status === 401)
//         throw new Error("Unauthorized — token missing/invalid/expired.");
//       if (!res.ok) throw new Error(`Shopify request failed: ${res.status}`);

//       const json = await res.json();

//       const row = json?.last_row_data ? json.last_row_data : null;
//       setShopifyRows(row ? [row] : []);
//     } catch (e: any) {
//       setShopifyError(e?.message || "Failed to load Shopify data");
//       setShopifyRows([]);
//     } finally {
//       setShopifyLoading(false);
//     }
//   }, [shopifyStore]);

//   const fetchShopifyPrev = useCallback(async () => {
//     try {
//       const user_token =
//         typeof window !== "undefined"
//           ? localStorage.getItem("jwtToken")
//           : null;
//       if (!user_token) throw new Error("No token found. Please sign in.");

//       if (!shopifyStore?.shop_name || !shopifyStore?.access_token) {
//         throw new Error("Shopify store not connected.");
//       }

//       const { year, monthName } = getPrevISTYearMonth();

//       const params = new URLSearchParams({
//         range: "monthly",
//         month: monthName.toLowerCase(),
//         year: String(year),
//         user_token,
//         shop: shopifyStore.shop_name,
//         token: shopifyStore.access_token,
//       });

//       const url = `${SHOPIFY_DROPDOWN_ENDPOINT}?${params.toString()}`;

//       const res = await fetch(url, {
//         method: "GET",
//         headers: {
//           Accept: "application/json",
//           Authorization: `Bearer ${user_token}`,
//         },
//         credentials: "omit",
//       });

//       if (res.status === 401)
//         throw new Error("Unauthorized — token missing/invalid/expired.");
//       if (!res.ok)
//         throw new Error(`Shopify (prev) request failed: ${res.status}`);

//       const json = await res.json();

//       const row = json?.last_row_data ? json.last_row_data : null;
//       setShopifyPrevRows(row ? [row] : []);
//     } catch (e: any) {
//       console.warn("Shopify prev-month fetch failed:", e?.message);
//       setShopifyPrevRows([]);
//     }
//   }, [shopifyStore]);

//  const refreshAll = useCallback(async () => {
//   await fetchAmazon();

//   if (shopifyStore?.shop_name && shopifyStore?.access_token) {
//     await Promise.all([fetchShopify(), fetchShopifyPrev()]);
//   }

//   // ✅ current inventory auto current month
//   await fetchCurrentInventory();
// }, [fetchAmazon, fetchShopify, fetchShopifyPrev, shopifyStore, fetchCurrentInventory]);


//   useEffect(() => {
//     refreshAll();
//   }, [refreshAll]);

//   // ---------- Amazon aliases ----------
//   const cms = data?.current_month_summary || null;
//   const cmp = data?.current_month_profit || null;
//   const skuTotals = data?.current_month_skuwise_totals || null;

//   const uk = useMemo(() => {
//     const netSalesGBP = cms?.net_sales?.GBP != null ? toNumberSafe(cms.net_sales.GBP) : null;
//     const aspGBP = cms?.asp?.GBP != null ? toNumberSafe(cms.asp.GBP) : null;

//     // ---- breakdown from current_month_profit.breakdown.GBP ----
//     const breakdownGBP = cmp?.breakdown?.GBP || {};

//     const cogsGBP = breakdownGBP.cogs !== undefined ? toNumberSafe(breakdownGBP.cogs) : 0;
//     const fbaFeesGBP =
//       breakdownGBP.fba_fees !== undefined ? toNumberSafe(breakdownGBP.fba_fees) : 0;
//     const sellingFeesGBP =
//       breakdownGBP.selling_fees !== undefined ? toNumberSafe(breakdownGBP.selling_fees) : 0;
//     const amazonFeesGBP = fbaFeesGBP + sellingFeesGBP;

//     // ---- NEW: from current_month_skuwise_totals (GBP) ----
//     const advertisingGBP =
//       skuTotals?.advertising_total !== undefined
//         ? toNumberSafe(skuTotals.advertising_total)
//         : 0;

//     const platformFeeGBP =
//       skuTotals?.platform_fee_total !== undefined
//         ? toNumberSafe(skuTotals.platform_fee_total)
//         : 0;

//     let profitGBP: number | null = null;
//     if (cmp?.profit && typeof cmp.profit === "object" && cmp.profit.GBP !== undefined) {
//       profitGBP = toNumberSafe(cmp.profit.GBP); // Profit = profit.GBP
//     } else if (
//       (typeof cmp?.profit === "number" || typeof cmp?.profit === "string") &&
//       netSalesGBP !== null
//     ) {
//       profitGBP = toNumberSafe(cmp.profit);
//     }

//     let unitsGBP: number | null = null;
//     if (breakdownGBP.quantity !== undefined) {
//       unitsGBP = toNumberSafe(breakdownGBP.quantity);
//     }

//     let profitPctGBP: number | null = null;
//     if (profitGBP !== null && netSalesGBP && !isNaN(netSalesGBP) && netSalesGBP !== 0) {
//       profitPctGBP = (profitGBP / netSalesGBP) * 100;
//     }

//     return {
//       unitsGBP,
//       netSalesGBP,    // Sales
//       aspGBP,
//       profitGBP,      // Profit
//       profitPctGBP,
//       cogsGBP,        // COGS
//       amazonFeesGBP,  // Amazon Fees = fba_fees + selling_fees
//       advertisingGBP, // NEW
//       platformFeeGBP, // NEW
//     };
//   }, [cms, cmp, skuTotals]);

//   const ukPrev = useMemo(() => {
//     const prevTotals = data?.previous_month_same_day_user_totals || null;
//     const prevMonthCompare = data?.previous_month_vs_current_percentages || null;
//     const prevProfitCompare = data?.profit_percentage_comparison || null;

//     // Sales (product_sales), Units (quantity), ASP, Profit
//     const prevNetSalesGBP = prevTotals
//       ? toNumberSafe(prevTotals.product_sales)
//       : 0;

//     const prevUnitsGBP = prevTotals
//       ? toNumberSafe(prevTotals.quantity)
//       : 0;

//     const prevAspGBP = prevTotals
//       ? toNumberSafe(prevTotals.asp)
//       : prevUnitsGBP > 0
//         ? prevNetSalesGBP / prevUnitsGBP
//         : 0;

//     const prevProfitGBP = prevTotals
//       ? toNumberSafe(prevTotals.profit)
//       : 0;

//     // ─────────────────────────────────────────
//     // Profit % (absolute previous month %)
//     // ─────────────────────────────────────────
//     let prevProfitPctGBP: number | null = null;
//     if (prevProfitCompare?.profit_percentage_previous_month != null) {
//       const raw = String(prevProfitCompare.profit_percentage_previous_month).replace("%", "");
//       const n = Number(raw);
//       prevProfitPctGBP = Number.isNaN(n) ? null : n;
//     } else if (prevNetSalesGBP > 0 && Number.isFinite(prevProfitGBP)) {
//       prevProfitPctGBP = (prevProfitGBP / prevNetSalesGBP) * 100;
//     }

//     // ─────────────────────────────────────────
//     // Percentage changes vs current month
//     // ─────────────────────────────────────────
//     const pctSalesVsCurrent = prevMonthCompare
//       ? parsePercentToNumber(prevMonthCompare.percentage_sales)     // "+20.22%"
//       : null;

//     const pctUnitsVsCurrent = prevMonthCompare
//       ? parsePercentToNumber(prevMonthCompare.percentage_quantity)  // "-1.00%"
//       : null;

//     const pctAspVsCurrent = prevMonthCompare
//       ? parsePercentToNumber(prevMonthCompare.percentage_asp)       // "+21.43%"
//       : null;

//     const pctProfitVsCurrent = prevMonthCompare
//       ? parsePercentToNumber(prevMonthCompare.percentage_profit)    // "+19.82%"
//       : null;

//     const pctProfitPctVsCurrent = prevProfitCompare
//       ? parsePercentToNumber(prevProfitCompare.percentage_profit_percentage) // "-0.19%"
//       : null;

//     return {
//       // raw previous-month values
//       netSalesGBP: prevNetSalesGBP,
//       unitsGBP: prevUnitsGBP,
//       aspGBP: prevAspGBP,
//       profitGBP: prevProfitGBP,
//       profitPctGBP: prevProfitPctGBP,

//       // % vs current month (deltas)
//       pctNetSalesVsCurrent: pctSalesVsCurrent,
//       pctUnitsVsCurrent: pctUnitsVsCurrent,
//       pctAspVsCurrent: pctAspVsCurrent,
//       pctProfitVsCurrent: pctProfitVsCurrent,
//       pctProfitPctVsCurrent: pctProfitPctVsCurrent,
//     };
//   }, [data]);

//   const shopifyNotConnected =
//     !shopifyStore?.shop_name ||
//     !shopifyStore?.access_token ||
//     (shopifyError &&
//       (shopifyError.toLowerCase().includes("shopify store not connected") ||
//         shopifyError.toLowerCase().includes("no token")));

//   // ✅ True if Shopify is connected AND we actually have some data row
//   const shopifyIntegrated = !shopifyNotConnected && !!shopify;

//   // ✅ True if there is at least one stored Amazon connection
//   const amazonIntegrated = Array.isArray(amazonConnections) && amazonConnections.length > 0;

//   // ✅ Neither Amazon nor Shopify integrated
//   const noIntegrations = !amazonIntegrated && !shopifyIntegrated;


//   const barsAmazon = useMemo(() => {
//     const units = cms?.total_quantity ?? 0;
//     const sales = uk.netSalesGBP ?? 0;
//     const asp = uk.aspGBP ?? 0;
//     const profit = uk.profitGBP ?? 0;
//     const pcent = Number.isFinite(uk.profitPctGBP)
//       ? (uk.profitPctGBP as number)
//       : 0;

//     return [
//       { label: "Units", raw: Number(units) || 0, display: fmtNum(units) },
//       { label: "Sales", raw: Number(sales) || 0, display: fmtGBP(sales) },
//       { label: "ASP", raw: Number(asp) || 0, display: fmtGBP(asp) },
//       { label: "Profit", raw: Number(profit) || 0, display: fmtGBP(profit) },
//       { label: "Profit %", raw: Number(pcent) || 0, display: fmtPct(pcent) },
//     ];
//   }, [uk, cms]);

//   const shopifyDeriv = useMemo(() => {
//     if (!shopify) return null;
//     const totalOrders = toNumberSafe(shopify.total_orders);
//     const netSales = toNumberSafe(shopify.net_sales);
//     const totalDiscounts = toNumberSafe(shopify.total_discounts);
//     const totalTax = toNumberSafe(shopify.total_tax);
//     const gross = toNumberSafe(shopify.total_price);
//     const aov = totalOrders > 0 ? gross / totalOrders : 0;
//     return { totalOrders, netSales, totalDiscounts, totalTax, gross, aov };
//   }, [shopify]);

//   const shopifyPrevDeriv = useMemo(() => {
//     const row = shopifyPrevRows?.[0];
//     if (!row) return null;
//     const netSales = toNumberSafe(row.net_sales);
//     return { netSales };
//   }, [shopifyPrevRows]);

//   // const amazonUK_USD = useMemo(() => {
//   //   const amazonUK_GBP = toNumberSafe(uk.netSalesGBP);
//   //   return amazonUK_GBP * GBP_TO_USD;
//   // }, [uk.netSalesGBP]);

//   const amazonUK_USD = useMemo(() => {
//     const amazonUK_GBP = toNumberSafe(uk.netSalesGBP);
//     return amazonUK_GBP * gbpToUsd;
//   }, [uk.netSalesGBP, gbpToUsd]);


//   const combinedUSD = useMemo(() => {
//     const aUK = amazonUK_USD;
//     const shopifyUSD =
//       toNumberSafe(shopifyDeriv?.netSales) * inrToUsd;
//     return aUK + shopifyUSD;
//   }, [amazonUK_USD, shopifyDeriv?.netSales, inrToUsd]);


//   const prevAmazonUKTotalUSD = useMemo(() => {
//     const prevTotalGBP = toNumberSafe(
//       data?.previous_month_total_net_sales?.total
//     );
//     return prevTotalGBP * gbpToUsd;
//   }, [data?.previous_month_total_net_sales?.total, gbpToUsd]);


//   const prevShopifyTotalUSD = useMemo(() => {
//     const prevINRTotal = toNumberSafe(shopifyPrevDeriv?.netSales);
//     return prevINRTotal * inrToUsd;
//   }, [shopifyPrevDeriv, inrToUsd]);


//   const globalPrevTotalUSD = prevShopifyTotalUSD + prevAmazonUKTotalUSD;

//   const chooseLastMonthTotal = (manualUSD: number, computedUSD: number) =>
//     USE_MANUAL_LAST_MONTH && manualUSD > 0 ? manualUSD : computedUSD;

//   const prorateToDate = (lastMonthTotalUSD: number) => {
//     const { todayDay, daysInPrevMonth } = getISTDayInfo();
//     return daysInPrevMonth > 0
//       ? (lastMonthTotalUSD * todayDay) / daysInPrevMonth
//       : 0;
//   };

//   const regions = useMemo(
//     () => {
//       const globalLastMonthTotal = chooseLastMonthTotal(
//         MANUAL_LAST_MONTH_USD_GLOBAL,
//         globalPrevTotalUSD
//       );
//       const global: RegionMetrics = {
//         mtdUSD: combinedUSD,
//         lastMonthToDateUSD: prorateToDate(globalLastMonthTotal),
//         lastMonthTotalUSD: globalLastMonthTotal,
//         targetUSD: globalLastMonthTotal,
//       };

//       const ukLastMonthTotal = chooseLastMonthTotal(
//         MANUAL_LAST_MONTH_USD_UK,
//         prevAmazonUKTotalUSD
//       );
//       const ukRegion: RegionMetrics = {
//         mtdUSD: amazonUK_USD,
//         lastMonthToDateUSD: prorateToDate(ukLastMonthTotal),
//         lastMonthTotalUSD: ukLastMonthTotal,
//         targetUSD: ukLastMonthTotal,
//       };

//       const usLastMonthTotal = chooseLastMonthTotal(
//         MANUAL_LAST_MONTH_USD_US,
//         0
//       );
//       const usRegion: RegionMetrics = {
//         mtdUSD: 0,
//         lastMonthToDateUSD: prorateToDate(usLastMonthTotal),
//         lastMonthTotalUSD: usLastMonthTotal,
//         targetUSD: usLastMonthTotal,
//       };

//       const caLastMonthTotal = chooseLastMonthTotal(
//         MANUAL_LAST_MONTH_USD_CA,
//         0
//       );
//       const caRegion: RegionMetrics = {
//         mtdUSD: 0,
//         lastMonthToDateUSD: prorateToDate(caLastMonthTotal),
//         lastMonthTotalUSD: caLastMonthTotal,
//         targetUSD: caLastMonthTotal,
//       };

//       return {
//         Global: global,
//         UK: ukRegion,
//         US: usRegion,
//         CA: caRegion,
//       } as Record<RegionKey, RegionMetrics>;
//     },
//     [combinedUSD, amazonUK_USD, globalPrevTotalUSD, prevAmazonUKTotalUSD]
//   );

//   const anyLoading = loading || shopifyLoading;

//   const hasAnyContent =
//     !!data || !!shopify || unauthorized || shopifyNotConnected || !!error;

//   const initialLoading = anyLoading && !hasAnyContent;

//   /* ---------- Tabs for Amazon card: only integrated regions ---------- */
//   const amazonTabs = useMemo<RegionKey[]>(() => {
//     const tabs: RegionKey[] = [];
//     (["UK", "US", "CA"] as RegionKey[]).forEach((key) => {
//       const r = regions[key];
//       if (!r) return;
//       if (
//         r.mtdUSD ||
//         r.lastMonthToDateUSD ||
//         r.lastMonthTotalUSD ||
//         r.targetUSD
//       ) {
//         tabs.push(key);
//       }
//     });
//     return tabs;
//   }, [regions]);

//   useEffect(() => {
//     if (amazonTabs.length && !amazonTabs.includes(amazonRegion)) {
//       setAmazonRegion(amazonTabs[0]);
//     }
//   }, [amazonTabs, amazonRegion]);

//   /* ---------- Graph region toggles: Global + integrated ---------- */
//   const graphRegions = useMemo<RegionKey[]>(() => {
//     const list: RegionKey[] = ["Global"];
//     (["UK", "US", "CA"] as RegionKey[]).forEach((key) => {
//       const r = regions[key];
//       if (!r) return;
//       if (
//         r.mtdUSD ||
//         r.lastMonthToDateUSD ||
//         r.lastMonthTotalUSD ||
//         r.targetUSD
//       ) {
//         list.push(key);
//       }
//     });
//     return list;
//   }, [regions]);

//   useEffect(() => {
//     if (!graphRegions.includes(graphRegion)) {
//       setGraphRegion("Global");
//     }
//   }, [graphRegions, graphRegion]);

//   /* ---------- Global card metrics (combined) ---------- */
//   const globalCardMetrics = useMemo(() => {
//     const amazonUnits = toNumberSafe(cms?.total_quantity ?? 0);
//     const shopifyUnits = toNumberSafe(shopifyDeriv?.totalOrders ?? 0);

//     const totalUnits = amazonUnits + shopifyUnits;
//     const totalSalesUSD = combinedUSD;

//     const aspUSD = totalUnits > 0 ? totalSalesUSD / totalUnits : 0;

//     const amazonProfitUSD =
//       uk.profitGBP != null ? toNumberSafe(uk.profitGBP) * gbpToUsd : 0;
//     const profitPct =
//       totalSalesUSD > 0 ? (amazonProfitUSD / totalSalesUSD) * 100 : 0;

//     return {
//       totalSalesUSD,
//       totalUnits,
//       aspUSD,
//       profitUSD: amazonProfitUSD,
//       profitPct,
//     };
//   }, [cms, shopifyDeriv, combinedUSD, uk.profitGBP]);

//   /* ---------- P&L items for graph based on graphRegion ---------- */
//   const plItems = useMemo(() => {
//     if (graphRegion === "Global") {
//       const sales = combinedUSD;
//       return [
//         { label: "Sales", raw: sales, display: fmtUSD(sales) },
//         { label: "Amazon Fees", raw: 0, display: fmtUSD(0) },
//         { label: "COGS", raw: 0, display: fmtUSD(0) },
//         { label: "Advertisements", raw: 0, display: fmtUSD(0) },
//         { label: "Other Charges", raw: 0, display: fmtUSD(0) },
//         { label: "Profit", raw: 0, display: fmtUSD(0) },
//       ];
//     }

//     // For region-level (currently only UK is really populated)
//     return [
//       {
//         label: "Sales",
//         raw: Number(uk.netSalesGBP ?? 0),
//         display: fmtGBP(uk.netSalesGBP ?? 0),
//       },
//       {
//         label: "Amazon Fees",
//         raw: Number(uk.amazonFeesGBP ?? 0),
//         display: fmtGBP(uk.amazonFeesGBP ?? 0),
//       },
//       {
//         label: "COGS",
//         raw: Number(uk.cogsGBP ?? 0),
//         display: fmtGBP(uk.cogsGBP ?? 0),
//       },
//       {
//         label: "Advertisements",
//         raw: Number(uk.advertisingGBP ?? 0),
//         display: fmtGBP(uk.advertisingGBP ?? 0),
//       },
//       {
//         label: "Platform Fees",
//         raw: Number(uk.platformFeeGBP ?? 0),
//         display: fmtGBP(uk.platformFeeGBP ?? 0),
//       },
//       {
//         label: "Profit",
//         raw: Number(uk.profitGBP ?? 0),
//         display: fmtGBP(uk.profitGBP ?? 0),
//       },
//     ];
//   }, [graphRegion, combinedUSD, uk]);



//   // ---------- Props & Excel export for Amazon bar graph ----------

//   // 1) Country used in the graph header
//   const countryNameForGraph =
//     graphRegion === "Global" ? "global" : graphRegion.toLowerCase();

//   // 2) Currency symbol based on country
//   const currencySymbol = getCurrencySymbol(countryNameForGraph);

//   // 3) Current month label like "Dec'25"
//   const { monthName: currMonthName, year: currYear } = getISTYearMonth();
//   const shortMonForGraph = new Date(
//     `${currMonthName} 1, ${currYear}`
//   ).toLocaleString("en-US", {
//     month: "short",
//     timeZone: "Asia/Kolkata",
//   });
//   const formattedMonthYear = `${shortMonForGraph}'${String(currYear).slice(
//     -2
//   )}`;

//   // 4) Labels & values for chart
//   const labels = plItems.map((i) => i.label);
//   const values = plItems.map((i) => i.raw);

//   // 5) Colors (reuse your palette)
//   const colorMapping: Record<string, string> = {
//     Sales: "#2CA9E0",
//     "Amazon Fees": "#ff5c5c",
//     COGS: "#AB64B5",
//     Advertisements: "#F47A00",
//     "Other Charges": "#00627D",
//     "Platform Fees": "#154B9B",
//     Profit: "#87AD12",
//   };
//   const colors = labels.map((label) => colorMapping[label] || "#2CA9E0");

//   // 6) True if all chart data is zero
//   const allValuesZero = values.every((v) => !v || v === 0);

//   // --- Helper: capture chart as PNG data URL (canvas or svg) ---
//   const captureChartPng = React.useCallback(async (): Promise<string | null> => {
//     const container = chartRef.current;
//     if (!container) return null;

//     // 1) If DashboardBargraphCard uses <canvas> (e.g. Chart.js), use it directly
//     const canvas = container.querySelector("canvas") as HTMLCanvasElement | null;
//     if (canvas) {
//       try {
//         // make sure background is white (optional – depends on your chart lib)
//         const tmpCanvas = document.createElement("canvas");
//         tmpCanvas.width = canvas.width;
//         tmpCanvas.height = canvas.height;
//         const ctx = tmpCanvas.getContext("2d");
//         if (!ctx) return null;

//         ctx.fillStyle = "#ffffff";
//         ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
//         ctx.drawImage(canvas, 0, 0);

//         return tmpCanvas.toDataURL("image/png");
//       } catch (e) {
//         console.error("Failed to capture canvas chart", e);
//         return null;
//       }
//     }

//     // 2) Fallback: if it's an <svg> chart, convert svg → png (your previous logic)
//     const svg = container.querySelector("svg");
//     if (!svg) return null;

//     const serializer = new XMLSerializer();
//     let svgString = serializer.serializeToString(svg);

//     if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
//       svgString = svgString.replace(
//         "<svg",
//         '<svg xmlns="http://www.w3.org/2000/svg"'
//       );
//     }

//     const svgBlob = new Blob([svgString], {
//       type: "image/svg+xml;charset=utf-8",
//     });
//     const url = URL.createObjectURL(svgBlob);

//     return new Promise((resolve) => {
//       const img = new Image();
//       img.onload = () => {
//         const rect = svg.getBoundingClientRect();
//         const canvasEl = document.createElement("canvas");
//         canvasEl.width = rect.width || 1000;
//         canvasEl.height = rect.height || 500;

//         const ctx = canvasEl.getContext("2d");
//         if (!ctx) {
//           URL.revokeObjectURL(url);
//           resolve(null);
//           return;
//         }

//         ctx.fillStyle = "#ffffff";
//         ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
//         ctx.drawImage(img, 0, 0, canvasEl.width, canvasEl.height);

//         const pngDataUrl = canvasEl.toDataURL("image/png");
//         URL.revokeObjectURL(url);
//         resolve(pngDataUrl);
//       };
//       img.onerror = () => {
//         URL.revokeObjectURL(url);
//         resolve(null);
//       };
//       img.src = url;
//     });
//   }, []);

//   // --- Download: Excel + chart image ---
//   const handleDownload = React.useCallback(async () => {
//     try {
//       // 1) Capture chart image
//       const pngDataUrl = await captureChartPng();

//       // 2) Create workbook/worksheet
//       const workbook = new ExcelJS.Workbook();
//       const sheet = workbook.addWorksheet("Amazon P&L");

//       // Extra header rows
//       sheet.addRow([brandName || "Brand"]);
//       sheet.addRow([`Amazon P&L - ${formattedMonthYear}`]);
//       sheet.addRow([`Country: ${countryNameForGraph.toUpperCase()}`]);
//       sheet.addRow([`Currency: ${currencySymbol}`]);
//       sheet.addRow([""]); // blank gap

//       // Table header
//       sheet.addRow(["Metric", "", `Amount (${currencySymbol})`]);

//       const signs: Record<string, string> = {
//         Sales: "(+)",
//         "Amazon Fees": "(-)",
//         COGS: "(-)",
//         Advertisements: "(-)",
//         "Other Charges": "(-)",
//         "Platform Fees": "(-)",
//         Profit: "",
//       };

//       values.forEach((v, idx) => {
//         const label = labels[idx];
//         const sign = signs[label] || "";
//         const num = Number(v || 0);
//         sheet.addRow([label, sign, Number(num.toFixed(2))]);
//       });

//       const totalValue = values.reduce(
//         (acc, v) => acc + (Number(v) || 0),
//         0
//       );
//       sheet.addRow(["Total", "", Number(totalValue.toFixed(2))]);

//       // 3) Insert chart image if available
//       if (pngDataUrl) {
//         const base64 = pngDataUrl.replace(/^data:image\/png;base64,/, "");
//         const imageId = workbook.addImage({
//           base64,
//           extension: "png",
//         });

//         // Place image somewhere below the table (e.g., A10 -> H30)
//         sheet.addImage(imageId, {
//           tl: { col: 0, row: 9 },   // top-left
//           br: { col: 8, row: 28 },  // bottom-right
//           editAs: "oneCell",
//         });
//       }

//       // 4) Generate & download file
//       const buffer = await workbook.xlsx.writeBuffer();
//       const blob = new Blob([buffer], {
//         type:
//           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       });
//       saveAs(blob, `Amazon-PnL-${formattedMonthYear}.xlsx`);
//     } catch (err) {
//       console.error("Error generating Excel with chart", err);
//     }
//   }, [
//     labels,
//     values,
//     brandName,
//     formattedMonthYear,
//     countryNameForGraph,
//     currencySymbol,
//     captureChartPng,
//   ]);



//   useEffect(() => {
//     if (initialLoading) {
//       const prev = document.body.style.overflow;
//       document.body.style.overflow = "hidden";
//       return () => {
//         document.body.style.overflow = prev;
//       };
//     }
//   }, [initialLoading]);


//   return (
//     <div className="relative">
//       {initialLoading && (
//         <>
//           <div className="fixed inset-0 z-40 bg-white/70" />

//           <div className="fixed inset-0 z-50 flex items-center justify-center">
//             <Loader
//               src="/infinity-unscreen.gif"
//               label="Loading sales dashboard…"
//               size={120}
//               roundedClass="rounded-xl"
//               backgroundClass="bg-transparent"
//               respectReducedMotion
//             />
//           </div>
//         </>
//       )}

//       <div
//         className={initialLoading ? "pointer-events-none opacity-40" : ""}
//       >
//         <div className="">
//           <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

//             <div className="flex flex-col leading-tight">
//               <p className="text-lg text-charcoal-500 mb-1">
//                 Let's get started, <span className="text-green-500">{brandName}!</span>
//               </p>

//               <div className="flex items-center gap-2">
//                 <PageBreadcrumb
//                   pageTitle="Sales Dashboard -"
//                   variant="page"
//                   textSize="2xl"
//                   className="text-2xl font-semibold"
//                 />

//                 <span className="text-[#5EA68E] text-xl font-semibold">
//                   {(() => {
//                     const { monthName, year } = getISTYearMonth();
//                     const shortMon = new Date(`${monthName} 1, ${year}`).toLocaleString(
//                       "en-US",
//                       {
//                         month: "short",
//                         timeZone: "Asia/Kolkata",
//                       }
//                     );
//                     return `${shortMon} '${String(year).slice(-2)}`;
//                   })()}
//                 </span>
//               </div>
//             </div>

//             {/* RIGHT BUTTON */}
//             <button
//               onClick={refreshAll}
//               disabled={anyLoading}
//               className={`w-full rounded-md border px-3 py-1.5 text-sm shadow-sm active:scale-[.99] sm:w-auto ${anyLoading
//                 ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
//                 : "border-gray-300 bg-white hover:bg-gray-50"
//                 }`}
//             >
//               {anyLoading ? (
//                 <span className="inline-flex items-center gap-2">
//                   <Loader
//                     src="/infinity-unscreen.gif"
//                     size={16}
//                     transparent
//                     roundedClass="rounded-full"
//                     backgroundClass="bg-transparent"
//                     className="text-gray-400"
//                     forceFallback={false}
//                     respectReducedMotion
//                   />
//                   <span>Refreshing…</span>
//                 </span>
//               ) : (
//                 "Refresh"
//               )}
//             </button>
//           </div>


//           {/* <div className="grid grid-cols-12 gap-6"> */}
//           <div
//             className={`grid grid-cols-12 gap-6 ${!noIntegrations ? "items-stretch" : ""
//               }`}
//           >
//             {/* LEFT 8: Global + Amazon + Shopify cards */}
//             <div className="col-span-12 space-y-6 lg:col-span-8 order-2 lg:order-1">

//               {/* GLOBAL card */}
//               <div className="rounded-2xl border bg-white p-5 shadow-sm">
//                 <div className="mb-4">
//                   <div className="flex items-baseline gap-2">
//                     <PageBreadcrumb
//                       pageTitle="Global -"
//                       variant="page"
//                       align="left"
//                     />
//                     <span className="text-[#5EA68E] text-lg font-semibold sm:text-2xl md:text-2xl">
//                       {(() => {
//                         const { monthName, year } = getISTYearMonth();
//                         const shortMon = new Date(
//                           `${monthName} 1, ${year}`
//                         ).toLocaleString("en-US", {
//                           month: "short",
//                           timeZone: "Asia/Kolkata",
//                         });
//                         return `${shortMon} '${String(year).slice(-2)}`;
//                       })()}
//                     </span>
//                   </div>
//                   <p className="mt-1 text-sm text-charcoal-500">
//                     Real-time data from Amazon &amp; Shopify
//                   </p>
//                 </div>

//                 {noIntegrations ? (
//                   <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
//                     <p className="font-medium">
//                       Connection needs to be established in order to view details.
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
//                     <div className="rounded-2xl border border-[#87AD12] bg-[#87AD1226] p-5 shadow-sm">
//                       <div className="text-sm text-charcoal-500">Sales</div>
//                       <div className="mt-2 text-lg font-semibold">
//                         <ValueOrSkeleton loading={anyLoading} mode="inline">
//                           {fmtUSD(globalCardMetrics.totalSalesUSD)}
//                         </ValueOrSkeleton>
//                       </div>
//                     </div>

//                     <div className="rounded-2xl border border-[#F47A00] bg-[#F47A0026] p-5 shadow-sm">
//                       <div className="text-sm text-charcoal-500">Units</div>
//                       <div className="mt-2 text-lg font-semibold">
//                         <ValueOrSkeleton loading={anyLoading} mode="inline" compact>
//                           {fmtInt(globalCardMetrics.totalUnits)}
//                         </ValueOrSkeleton>
//                       </div>
//                     </div>

//                     <div className="rounded-2xl border border-[#2CA9E0] bg-[#2CA9E026] p-5 shadow-sm">
//                       <div className="text-sm text-charcoal-500">ASP</div>
//                       <div className="mt-2 text-lg font-semibold">
//                         <ValueOrSkeleton loading={anyLoading} mode="inline" compact>
//                           {fmtUSD(globalCardMetrics.aspUSD)}
//                         </ValueOrSkeleton>
//                       </div>
//                     </div>

//                     <div className="rounded-2xl border border-[#AB64B5] bg-[#AB64B526] p-5 shadow-sm">
//                       <div className="text-sm text-charcoal-500">Profit</div>
//                       <div className="mt-2 text-lg font-semibold">
//                         <ValueOrSkeleton loading={anyLoading} mode="inline" compact>
//                           {fmtUSD(globalCardMetrics.profitUSD)}
//                         </ValueOrSkeleton>
//                       </div>
//                     </div>

//                     <div className="rounded-2xl border border-[#00627B] bg-[#00627B26] p-5 shadow-sm">
//                       <div className="text-sm text-charcoal-500">Profit %</div>
//                       <div className="mt-2 text-lg font-semibold">
//                         <ValueOrSkeleton loading={anyLoading} mode="inline" compact>
//                           {fmtPct(globalCardMetrics.profitPct)}
//                         </ValueOrSkeleton>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* AMAZON card */}
//               <div className="rounded-2xl border bg-white p-5 shadow-sm">
//                 <div className="mb-4 flex flex-row gap-4 items-start md:items-start md:justify-between">
//                   {/* Left: title + subtitle */}
//                   <div className="flex flex-col flex-1 min-w-0">
//                     <div className="flex flex-wrap items-baseline gap-2">
//                       <PageBreadcrumb
//                         pageTitle="Amazon -"
//                         variant="page"
//                         align="left"
//                       />
//                       <span className="text-[#5EA68E] text-lg font-semibold sm:text-2xl md:text-2xl">
//                         {(() => {
//                           const { monthName, year } = getISTYearMonth();
//                           const shortMon = new Date(
//                             `${monthName} 1, ${year}`
//                           ).toLocaleString("en-US", {
//                             month: "short",
//                             timeZone: "Asia/Kolkata",
//                           });
//                           return `${shortMon} '${String(year).slice(-2)}`;
//                         })()}
//                       </span>
//                     </div>

//                     <p className="mt-1 text-sm text-charcoal-500">
//                       Real-time data from Amazon
//                     </p>
//                   </div>

//                   {/* Right: region tabs */}
//                   {/* {amazonTabs.length > 0 && (
//                     <div className="mt-1 md:mt-0 self-start md:self-center">
//                       <div className="inline-flex flex-wrap gap-1 rounded-lg border bg-gray-50 p-1 text-xs">
//                         {amazonTabs.map((key) => (
//                           <button
//                             key={key}
//                             type="button"
//                             onClick={() => setAmazonRegion(key)}
//                             className={`min-w-[60px] rounded-lg px-3 py-1 text-center ${key === amazonRegion
//                               ? "bg-[#C7E6D7] text-gray-900 shadow-sm"
//                               : "text-gray-600 hover:text-gray-900"
//                               }`}
//                           >
//                             {key}
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                   )} */}

//                   {amazonTabs.length > 0 && (
//                     <div className="mt-1 md:mt-0 self-start md:self-center">
//                       <SegmentedToggle<RegionKey>
//                         value={amazonRegion}
//                         options={amazonTabs.map((r) => ({ value: r }))}
//                         onChange={setAmazonRegion}
//                       />
//                     </div>
//                   )}

//                 </div>


//                 {noIntegrations ? (
//                   <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
//                     <p className="font-medium">
//                       Connection needs to be established in order to view details.
//                     </p>
//                   </div>
//                 ) : !amazonIntegrated ? (
//                   <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
//                     <p className="font-medium">
//                       Connection needs to be established in order to view Amazon details.
//                     </p>
//                   </div>
//                 ) : (
//                   // <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
//                   //   <div className="rounded-2xl border border-[#87AD12] bg-[#87AD1226] p-5 shadow-sm">
//                   //     <div className="text-sm text-charcoal-500">Sales</div>
//                   //     <div className="mt-2 text-lg font-semibold">
//                   //       <ValueOrSkeleton loading={loading} mode="inline">
//                   //         {fmtGBP(uk.netSalesGBP)}
//                   //       </ValueOrSkeleton>
//                   //     </div>
//                   //   </div>

//                   //   <div className="rounded-2xl border border-[#F47A00] bg-[#F47A0026] p-5 shadow-sm">
//                   //     <div className="text-sm text-charcoal-500">Units</div>
//                   //     <div className="mt-2 text-lg font-semibold">
//                   //       <ValueOrSkeleton loading={loading} mode="inline" compact>
//                   //         {fmtInt(cms?.total_quantity ?? 0)}
//                   //       </ValueOrSkeleton>
//                   //     </div>
//                   //   </div>

//                   //   <div className="rounded-2xl border border-[#2CA9E0] bg-[#2CA9E026] p-5 shadow-sm">
//                   //     <div className="text-sm text-charcoal-500">ASP</div>
//                   //     <div className="mt-2 text-lg font-semibold">
//                   //       <ValueOrSkeleton loading={loading} mode="inline" compact>
//                   //         {fmtGBP(uk.aspGBP)}
//                   //       </ValueOrSkeleton>
//                   //     </div>
//                   //   </div>

//                   //   <div className="rounded-2xl border border-[#AB64B5] bg-[#AB64B526] p-5 shadow-sm">
//                   //     <div className="text-sm text-charcoal-500">Profit</div>
//                   //     <div className="mt-2 text-lg font-semibold">
//                   //       <ValueOrSkeleton loading={loading} mode="inline" compact>
//                   //         {fmtGBP(uk.profitGBP)}
//                   //       </ValueOrSkeleton>
//                   //     </div>
//                   //   </div>

//                   //   <div className="rounded-2xl border border-[#00627B] bg-[#00627B26] p-5 shadow-sm">
//                   //     <div className="text-sm text-charcoal-500">Profit %</div>
//                   //     <div className="mt-2 text-lg font-semibold">
//                   //       <ValueOrSkeleton loading={loading} mode="inline" compact>
//                   //         {fmtPct(uk.profitPctGBP)}
//                   //       </ValueOrSkeleton>
//                   //     </div>
//                   //   </div>
//                   // </div>


//                   <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
//                     {/* Sales */}
//                     <AmazonStatCard
//                       label="Sales"
//                       current={uk.netSalesGBP}
//                       previous={ukPrev.netSalesGBP}
//                       loading={loading}
//                       formatter={fmtGBP}
//                       bottomLabel={prevLabel}
//                       className="border-[#87AD12] bg-[#87AD1226]"
//                     />

//                     {/* Units */}
//                     <AmazonStatCard
//                       label="Units"
//                       current={cms?.total_quantity ?? 0}
//                       previous={ukPrev.unitsGBP}
//                       loading={loading}
//                       formatter={fmtInt}
//                       bottomLabel={prevLabel}
//                       className="border-[#F47A00] bg-[#F47A0026]"
//                     />

//                     {/* ASP */}
//                     <AmazonStatCard
//                       label="ASP"
//                       current={uk.aspGBP}
//                       previous={ukPrev.aspGBP}
//                       loading={loading}
//                       formatter={fmtGBP}
//                       bottomLabel={prevLabel}
//                       className="border-[#2CA9E0] bg-[#2CA9E026]"
//                     />

//                     {/* Profit */}
//                     <AmazonStatCard
//                       label="Profit"
//                       current={uk.profitGBP}
//                       previous={ukPrev.profitGBP}
//                       loading={loading}
//                       formatter={fmtGBP}
//                       bottomLabel={prevLabel}
//                       className="border-[#AB64B5] bg-[#AB64B526]"
//                     />

//                     {/* Profit % */}
//                     <AmazonStatCard
//                       label="Profit %"
//                       current={uk.profitPctGBP}
//                       previous={ukPrev.profitPctGBP}
//                       loading={loading}
//                       formatter={fmtPct}
//                       bottomLabel={prevLabel}
//                       className="border-[#00627B] bg-[#00627B26]"
//                     />
//                   </div>


//                 )}
//               </div>



//               {/* SHOPIFY card */}
//               <div className="rounded-2xl border bg-white p-5 shadow-sm">
//                 <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
//                   <div className="flex flex-col">
//                     <div className="flex items-baseline gap-2">
//                       <PageBreadcrumb
//                         pageTitle="Shopify -"
//                         variant="page"
//                         align="left"
//                         textSize="2xl"
//                       />
//                       <span className="text-2xl font-semibold text-[#5EA68E]">
//                         {(() => {
//                           const { monthName, year } = getISTYearMonth();
//                           const shortMon = new Date(
//                             `${monthName} 1, ${year}`
//                           ).toLocaleString("en-US", {
//                             month: "short",
//                             timeZone: "Asia/Kolkata",
//                           });
//                           return `${shortMon} '${String(year).slice(-2)}`;
//                         })()}
//                       </span>
//                     </div>

//                     <p className="mt-1 text-sm text-charcoal-500">
//                       Real-time data from Shopify
//                     </p>
//                   </div>


//                 </div>

//                 {shopifyNotConnected ? (
//                   <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
//                     <p className="font-medium">
//                       Connection needs to be established in order to view Shopify
//                       details.
//                     </p>
//                   </div>
//                 ) : shopifyLoading ? (
//                   <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
//                     {[...Array(5)].map((_, i) => (
//                       <div
//                         key={i}
//                         className="rounded-2xl border bg-white p-5 shadow-sm"
//                       >
//                         <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
//                         <div className="mt-2 h-7 w-28 animate-pulse rounded bg-gray-200" />
//                       </div>
//                     ))}
//                   </div>
//                 ) : shopify ? (
//                   <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">


//                     <div className="rounded-2xl border border-[#87AD12] bg-[#87AD1226] p-5 shadow-sm">
//                       <div className="text-sm text-charcoal-500">Total Sales</div>
//                       <div className="mt-1 text-lg font-bold tracking-tight text-gray-900">
//                         <ValueOrSkeleton loading={shopifyLoading} mode="inline">
//                           {fmtShopify(toNumberSafe(shopify?.net_sales ?? 0))}
//                         </ValueOrSkeleton>
//                       </div>
//                     </div>



//                     <div className="rounded-2xl border border-[#F47A00] bg-[#F47A0026] p-5 shadow-sm">
//                       <div className="text-sm text-charcoal-500">Units</div>
//                       <div className="mt-1 text-lg font-semibold text-gray-900">
//                         <ValueOrSkeleton
//                           loading={shopifyLoading}
//                           mode="inline"
//                           compact
//                         >
//                           {shopify?.total_orders}
//                         </ValueOrSkeleton>
//                       </div>
//                     </div>


//                     <div className="rounded-2xl border border-[#2CA9E0] bg-[#2CA9E026] p-5 shadow-sm">
//                       <div className="text-sm text-gray-500">ASP</div>
//                       <div className="mt-1 text-lg font-semibold text-gray-900">
//                         <ValueOrSkeleton
//                           loading={shopifyLoading}
//                           mode="inline"
//                           compact
//                         >
//                           {(() => {
//                             const units = toNumberSafe(
//                               shopify?.total_orders ?? 0
//                             );
//                             const net = toNumberSafe(shopify?.net_sales ?? 0);
//                             if (units <= 0) return "—";
//                             return fmtShopify(net / units);
//                           })()}
//                         </ValueOrSkeleton>
//                       </div>
//                     </div>

//                     <div className="rounded-2xl border border-[#AB64B5] bg-[#AB64B526] p-5 shadow-sm">
//                       <div className="text-sm text-charcoal-500">Sessions</div>
//                       <div className="mt-1 text-lg font-semibold text-gray-900">
//                         —
//                       </div>
//                     </div>

//                     <div className="rounded-2xl border border-[#00627B] bg-[#00627B26] p-5 shadow-sm">
//                       <div className="text-sm text-gray-500">Conversion %</div>
//                       <div className="mt-1 text-lg font-semibold text-gray-900">
//                         —
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="mt-2 text-sm text-gray-500">
//                     No Shopify data for the current month.
//                   </div>
//                 )}
//               </div>
//             </div>

//             <aside
//               className={`col-span-12 lg:col-span-4 order-1 lg:order-2 ${!noIntegrations ? "flex" : ""
//                 }`}
//             >

//               <div
//                 className={`lg:sticky lg:top-6 w-full ${!noIntegrations ? "flex-1" : ""
//                   }`}
//               >
//                 <SalesTargetCard regions={regions} defaultRegion="Global" />
//               </div>
//             </aside>
//           </div>

//           {amazonIntegrated && (
//             <>
//             <div className="mt-8 rounded-2xl border bg-[#D9D9D933] p-5 shadow-sm">
//               <div className="mb-3 flex items-center justify-between">
//                 <div className="text-sm text-gray-500">
//                   <PageBreadcrumb
//                     pageTitle="Amazon"
//                     align="left"
//                     textSize="2xl"
//                     variant="page"
//                   />
//                   <p className="text-charcoal-500">
//                     Real-time data from Amazon{" "}
//                     {graphRegion === "Global" ? "Global" : graphRegion}
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <SegmentedToggle<RegionKey>
//                     value={graphRegion}
//                     options={graphRegions.map((r) => ({ value: r }))}
//                     onChange={setGraphRegion}
//                   />
//                   <DownloadIconButton onClick={handleDownload} />
//                 </div>
//               </div>

//               {/* ⬇️ wrap card in ref so we can find the SVG inside */}
//               <div ref={chartRef}>
//                 <DashboardBargraphCard
//                   countryName={countryNameForGraph}
//                   formattedMonthYear={formattedMonthYear}
//                   currencySymbol={currencySymbol}
//                   labels={labels}
//                   values={values}
//                   colors={colors}
//                   loading={loading}
//                   allValuesZero={allValuesZero}
//                 />
//               </div>
//             </div>

//             <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
//   <div className="mb-3">
//     <div className="flex items-baseline gap-2">
//       <PageBreadcrumb pageTitle="Current Inventory -" variant="page" align="left" />
//       <span className="text-[#5EA68E] text-lg font-semibold">
//         {(() => {
//           const { monthName, year } = getISTYearMonth();
//           const shortMon = new Date(`${monthName} 1, ${year}`).toLocaleString("en-US", {
//             month: "short",
//             timeZone: "Asia/Kolkata",
//           });
//           return `${shortMon} '${String(year).slice(-2)}`;
//         })()}
//       </span>
//     </div>
//     <p className="mt-1 text-sm text-charcoal-500">
//       Auto-loaded for the current month
//     </p>
//   </div>

//   {invLoading ? (
//     <div className="py-10 flex justify-center">
//       <Loader
//         src="/infinity-unscreen.gif"
//         size={40}
//         transparent
//         roundedClass="rounded-full"
//         backgroundClass="bg-transparent"
//         respectReducedMotion
//       />
//     </div>
//   ) : invError ? (
//     <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
//       {invError}
//     </div>
//   ) : invRows.length > 0 ? (
//     <div className="overflow-x-auto rounded-lg">
//       <table className="min-w-[900px] w-full border-collapse border border-gray-300">
//         <thead>
//           <tr>
//             {invDisplayedColumns.map((col) => (
//               <th
//                 key={col}
//                 className="px-3 py-2 text-center text-sm font-semibold border border-gray-300 bg-[#5EA68E] text-[#f8edcf]"
//               >
//                 {col}
//               </th>
//             ))}
//           </tr>
//         </thead>

//         <tbody>
//           {/* -------- TOP 5 PRODUCTS HEADER ROW (NO GRID BORDERS) -------- */}
//           <tr className="bg-white">
//             <td
//               colSpan={invDisplayedColumns.length}
//               className="px-3 py-2 text-left text-xs font-semibold text-gray-800 border-0 border-t border-gray-300"
//             >
//               Top 5 Products
//             </td>
//           </tr>

//           {splitInventoryRows.top5.map((row, index) => (
//             <tr key={`top-${index}`} className="bg-white">
//               {invDisplayedColumns.map((col) => (
//                 <td
//                   key={col}
//                   className="px-3 py-2 text-center text-sm text-gray-800 border border-gray-300"
//                 >
//                   {col === "Sno."
//                     ? index + 1
//                     : (() => {
//                         const v = getInvCellValue(row, col);

//                         if (typeof v === "number") {
//                           if (col === "Inventory Coverage Ratio (In Months)") return v.toFixed(1);
//                           return v.toLocaleString();
//                         }
//                         return String(v ?? "");
//                       })()}
//                 </td>
//               ))}
//             </tr>
//           ))}

//           {/* -------- OTHER PRODUCTS HEADER ROW (NO GRID BORDERS) -------- */}
//           <tr className="bg-white">
//             <td
//               colSpan={invDisplayedColumns.length}
//               className="px-3 py-2 text-left text-xs font-semibold text-gray-800 border-0 border-t border-gray-300"
//             >
//               Other Products
//             </td>
//           </tr>

//           {splitInventoryRows.other.map((row, index) => (
//             <tr key={`other-${index}`} className="bg-white">
//               {invDisplayedColumns.map((col) => (
//                 <td
//                   key={col}
//                   className="px-3 py-2 text-center text-sm text-gray-800 border border-gray-300"
//                 >
//                   {col === "Sno."
//                     ? index + 1
//                     : (() => {
//                         const v = getInvCellValue(row, col);

//                         if (typeof v === "number") {
//                           if (col === "Inventory Coverage Ratio (In Months)") return v.toFixed(1);
//                           return v.toLocaleString();
//                         }
//                         return String(v ?? "");
//                       })()}
//                 </td>
//               ))}
//             </tr>
//           ))}

//           {/* -------- TOTAL ROW -------- */}
//           <tr className="bg-white">
//             <td
//               className="px-3 py-2 text-left text-sm font-semibold text-gray-900 border border-gray-300"
//               colSpan={inventoryCountry !== "global" ? 3 : 2}
//             >
//               Total
//             </td>

//             {invDisplayedColumns
//               .slice(inventoryCountry !== "global" ? 3 : 2)
//               .map((col) => {
//                 const all = splitInventoryRows.top5.concat(splitInventoryRows.other);

//                 if (col === "Inventory Coverage Ratio (In Months)") {
//                   const totalInv = all.reduce(
//                     (s, r) => s + toNumberSafe(getInvCellValue(r, "Current Inventory")),
//                     0
//                   );
//                   const totalMtd = all.reduce(
//                     (s, r) => s + toNumberSafe(getInvCellValue(r, "MTD Sales")),
//                     0
//                   );
//                   const total30 = all.reduce(
//                     (s, r) => s + toNumberSafe(getInvCellValue(r, "Sales for past 30 days")),
//                     0
//                   );

//                   const denom = totalMtd + total30;
//                   const ratio = denom > 0 ? totalInv / denom : 0;

//                   return (
//                     <td
//                       key={col}
//                       className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border border-gray-300"
//                     >
//                       {denom > 0 ? ratio.toFixed(1) : "—"}
//                     </td>
//                   );
//                 }

//                 if (col === "Inventory Alerts") {
//                   return (
//                     <td
//                       key={col}
//                       className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border border-gray-300"
//                     />
//                   );
//                 }

//                 const total = all.reduce((s, r) => s + toNumberSafe(getInvCellValue(r, col)), 0);

//                 return (
//                   <td
//                     key={col}
//                     className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border border-gray-300"
//                   >
//                     {total.toLocaleString()}
//                   </td>
//                 );
//               })}
//           </tr>
//         </tbody>
//       </table>
//     </div>
//   ) : (
//     <div className="text-sm text-gray-500">No inventory data.</div>
//   )}
// </div></>

//           )}


//         </div>
//       </div>
//     </div>
//   );
// }











































"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/loader/Loader";
import DownloadIconButton from "@/components/ui/button/DownloadIconButton";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import DashboardBargraphCard from "@/components/dashboard/DashboardBargraphCard";
import ValueOrSkeleton from "@/components/common/ValueOrSkeleton";
import SalesTargetCard from "@/components/dashboard/SalesTargetCard";
import AmazonStatCard from "@/components/dashboard/AmazonStatCard";
import CurrentInventorySection from "@/components/dashboard/CurrentInventorySection";

import { RootState } from "@/lib/store";
import { useAmazonConnections } from "@/lib/utils/useAmazonConnections";

import {
  getISTYearMonth,
  getPrevISTYearMonth,
  getPrevMonthShortLabel,
  getISTDayInfo,
} from "@/lib/dashboard/date";

import {
  fmtGBP,
  fmtUSD,
  fmtShopify,
  fmtNum,
  fmtPct,
  fmtInt,
  toNumberSafe,
} from "@/lib/dashboard/format";

import type { RegionKey, RegionMetrics } from "@/lib/dashboard/types";


type HomeCurrency = "USD" | "GBP";

/* ===================== ENV & ENDPOINTS ===================== */
const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";
const SHOPIFY_CCY = process.env.NEXT_PUBLIC_SHOPIFY_CURRENCY || "GBP";
const SHOPIFY_TO_GBP = Number(
  process.env.NEXT_PUBLIC_SHOPIFY_TO_GBP || "1"
);
const API_URL = `${baseURL}/amazon_api/orders`;
const SHOPIFY_ENDPOINT = `${baseURL}/shopify/get_monthly_data`;
const SHOPIFY_DROPDOWN_ENDPOINT = `${baseURL}/shopify/dropdown`;

// Flask route path for FX
const FX_ENDPOINT = `${baseURL}/currency-rate`;

/** 💵 FX defaults (used until backend answers) */
const GBP_TO_USD_ENV = Number(
  process.env.NEXT_PUBLIC_GBP_TO_USD || ""
);
const INR_TO_USD_ENV = Number(
  process.env.NEXT_PUBLIC_INR_TO_USD || "0.01128"
);

const CAD_TO_USD_ENV = Number(
  process.env.NEXT_PUBLIC_CAD_TO_USD || "0.74"
);


const USE_MANUAL_LAST_MONTH =
  (process.env.NEXT_PUBLIC_USE_MANUAL_LAST_MONTH || "false").toLowerCase() ===
  "true";

/** Put last month's TOTAL SALES in USD (not to-date) */
const MANUAL_LAST_MONTH_USD_GLOBAL = Number(
  process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_GLOBAL || "0"
);
/** Optional per-region overrides */
const MANUAL_LAST_MONTH_USD_UK = Number(
  process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_UK || "0"
);
const MANUAL_LAST_MONTH_USD_US = Number(
  process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_US || "0"
);
const MANUAL_LAST_MONTH_USD_CA = Number(
  process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_CA || "0"
);



/* ===================== LOCAL HELPERS ===================== */

const parsePercentToNumber = (
  value: string | number | null | undefined
): number | null => {
  if (value == null) return null;
  const raw = typeof value === "number" ? String(value) : value;
  const cleaned = raw.replace("%", "").trim();
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
};

const getCurrencySymbol = (country: string) => {
  switch (country.toLowerCase()) {
    case "uk":
      return "£";
    case "india":
      return "₹";
    case "us":
      return "$";
    case "europe":
    case "eu":
      return "€";
    case "global":
      return "$";
    default:
      return "¤";
  }
};



/* ===================== MAIN PAGE ===================== */

export default function DashboardPage() {
  const { platform } = usePlatform();



  const [loading, setLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const { data: userData } = useGetUserDataQuery();

  // Normalized home currency from profile (e.g. "usd", "inr")
  const profileHomeCurrency = (userData?.homeCurrency || "USD")
    .toUpperCase() as HomeCurrency;

  const homeCurrency = profileHomeCurrency;

  // Amazon connections (real integration status)
  const { connections: amazonConnections } = useAmazonConnections();

  // Shopify (current month)
  const [shopifyLoading, setShopifyLoading] = useState(false);
  const [shopifyError, setShopifyError] = useState<string | null>(null);
  const [shopifyRows, setShopifyRows] = useState<any[]>([]);
  const shopify = shopifyRows?.[0] || null;

  // Shopify (previous month)
  const [shopifyPrevRows, setShopifyPrevRows] = useState<any[]>([]);

  // Shopify store info (shop_name + access_token)
  const [shopifyStore, setShopifyStore] = useState<any | null>(null);

  const [salesTargetRegion, setSalesTargetRegion] = useState<RegionKey>("Global");
  // which region tab is selected in the Amazon card
  const [amazonRegion, setAmazonRegion] = useState<RegionKey>("Global");

  // which region is selected in the P&L graph
  const [graphRegion, setGraphRegion] = useState<RegionKey>("Global");

  const chartRef = React.useRef<HTMLDivElement | null>(null);

  const prevLabel = useMemo(() => getPrevMonthShortLabel(), []);

  // FX rates: GBP→USD (Amazon UK) and INR→USD (Shopify India)
  const [gbpToUsd, setGbpToUsd] = useState(GBP_TO_USD_ENV);
  const [inrToUsd, setInrToUsd] = useState(INR_TO_USD_ENV);
  const [cadToUsd, setCadToUsd] = useState(CAD_TO_USD_ENV);

  const [fxLoading, setFxLoading] = useState(false);

  const logFx = (
    amount: number,
    from: string,
    to: string,
    details: Record<string, number>
  ) => {
    if (process.env.NODE_ENV !== "development") return;

    const parts = Object.entries(details)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");

    console.log(
      `%c[FX] ${amount} ${from} → ${to} | ${parts}`,
      "color:#2CA9E0;font-weight:600"
    );
  };


  // const convertToHomeCurrency = useCallback(
  //   (
  //     value: number | null | undefined,
  //     from: "USD" | "GBP" | "INR" | "CAD"
  //   ) => {
  //     const n = toNumberSafe(value ?? 0);
  //     if (!n) return 0;

  //     // ---- from → USD ----
  //     let usd = n;
  //     if (from === "GBP") usd = n * gbpToUsd;
  //     if (from === "INR") usd = n * inrToUsd;
  //     if (from === "CAD") usd = n * cadToUsd;

  //     // ---- USD → home ----
  //     if (homeCurrency === "USD") return usd;
  //     if (homeCurrency === "GBP") return gbpToUsd ? usd / gbpToUsd : usd;
  //     if (homeCurrency === "INR") return inrToUsd ? usd / inrToUsd : usd;
  //     if (homeCurrency === "CAD") return cadToUsd ? usd / cadToUsd : usd;

  //     return usd;
  //   },
  //   [homeCurrency, gbpToUsd, inrToUsd, cadToUsd]
  // );

  const convertToHomeCurrency = useCallback(
    (
      value: number | null | undefined,
      from: "USD" | "GBP" | "INR" | "CAD"
    ) => {
      const n = toNumberSafe(value ?? 0);
      if (!n) return 0;

      let usd = n;
      const details: Record<string, number> = {};

      // ---- FROM → USD ----
      if (from === "GBP") {
        usd = n * gbpToUsd;
        details["GBP→USD"] = gbpToUsd;
      }

      if (from === "INR") {
        usd = n * inrToUsd;
        details["INR→USD"] = inrToUsd;
      }

      if (from === "CAD") {
        usd = n * cadToUsd;
        details["CAD→USD"] = cadToUsd;
      }

      // ---- USD → HOME ----
      let final = usd;

      if (homeCurrency === "GBP") {
        final = gbpToUsd ? usd / gbpToUsd : usd;
        details["USD→GBP"] = gbpToUsd ? 1 / gbpToUsd : 1;
      }

      if (homeCurrency === "INR") {
        final = inrToUsd ? usd / inrToUsd : usd;
        details["USD→INR"] = inrToUsd ? 1 / inrToUsd : 1;
      }

      if (homeCurrency === "CAD") {
        final = cadToUsd ? usd / cadToUsd : usd;
        details["USD→CAD"] = cadToUsd ? 1 / cadToUsd : 1;
      }

      // ---- LOG ----
      logFx(n, from, homeCurrency, {
        ...details,
        Final: Number(final.toFixed(2)),
      });

      return final;
    },
    [homeCurrency, gbpToUsd, inrToUsd, cadToUsd]
  );


  const formatHomeAmount = useCallback(
    (value: number | null | undefined) => {
      const n = toNumberSafe(value ?? 0);

      switch (homeCurrency) {
        case "USD":
          return fmtUSD(n);
        case "GBP":
          return fmtGBP(n);
        case "CAD":
          return new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: "CAD",
          }).format(n);
        case "INR":
          return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(n);
        default:
          return fmtNum(n);
      }
    },
    [homeCurrency]
  );

  const inventoryCountry = useMemo(() => {
    const v = (graphRegion || "").toString().trim().toLowerCase();
    return v.length ? v : "global";
  }, [graphRegion]);


  /* ===================== FX RATES ===================== */

  const fetchFxRates = useCallback(async () => {
    try {
      setFxLoading(true);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("jwtToken")
          : null;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) {
        (headers as any).Authorization = `Bearer ${token}`;
      }

      const { monthName, year } = getISTYearMonth();
      const month = monthName.toLowerCase();

      const commonBody = {
        month,
        year,
        fetch_if_missing: true,
      };

      const [ukRes, inrRes, cadRes] = await Promise.all([
        fetch(FX_ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...commonBody,
            user_currency: "GBP",
            country: "uk",
            selected_currency: "USD",
          }),
        }),
        fetch(FX_ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...commonBody,
            user_currency: "INR",
            country: "india",
            selected_currency: "USD",
          }),
        }),
        fetch(FX_ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...commonBody,
            user_currency: "CAD",
            country: "ca",
            selected_currency: "USD",
          }),
        }),
      ]);

      if (ukRes.ok) {
        const json = await ukRes.json();
        const rate = json?.record?.conversion_rate;
        if (json?.success && rate != null) {
          setGbpToUsd(Number(rate));
        }
      } else {
        console.warn("UK FX fetch failed:", ukRes.status);
      }
      if (cadRes.ok) {
        const json = await cadRes.json();
        const rate = json?.record?.conversion_rate;
        if (json?.success && rate != null) {
          setCadToUsd(Number(rate));
        }
      }


      if (inrRes.ok) {
        const json = await inrRes.json();
        const rate = json?.record?.conversion_rate;
        if (json?.success && rate != null) {
          setInrToUsd(Number(rate));
        }
      } else {
        console.warn("INR FX fetch failed:", inrRes.status);
      }
    } catch (err) {
      console.error("Failed to fetch FX rates", err);
    } finally {
      setFxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFxRates();
  }, [fetchFxRates]);

  useEffect(() => {
    const r = platformToRegionKey(platform);

    setSalesTargetRegion(r);

    // Amazon card should probably only switch to country tabs, not "Global"
    // If r is Global, keep it Global or default to first available later.
    setAmazonRegion(r === "Global" ? "UK" : r); // tweak as you prefer

    setGraphRegion(r);
  }, [platform]);

  /* ===================== BRAND NAME ===================== */

  const brandName = useSelector(
    (state: RootState) => state.auth.user?.brand_name
  );

  /* ===================== AMAZON FETCH ===================== */

  const fetchAmazon = useCallback(async () => {
    setLoading(true);
    setUnauthorized(false);
    setError(null);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("jwtToken")
          : null;
      if (!token) {
        setUnauthorized(true);
        throw new Error("No token found. Please sign in.");
      }
      const res = await fetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "omit",
      });
      if (res.status === 401) {
        setUnauthorized(true);
        throw new Error(
          "Unauthorized — token missing/invalid/expired."
        );
      }
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ===================== SHOPIFY STORE INFO ===================== */

  useEffect(() => {
    const fetchShopifyStore = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("jwtToken")
            : null;
        if (!token) {
          console.log("No JWT found for Shopify store lookup");
          return;
        }

        const res = await fetch(`${baseURL}/shopify/store`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          const text = await res.text();
          console.error("Non-JSON /shopify/store response:", text);
          return;
        }

        const data = await res.json();

        if (!res.ok || data?.error) return;

        setShopifyStore(data);
      } catch (err) {
        console.error("Error fetching Shopify store in Dashboard:", err);
      }
    };

    fetchShopifyStore();
  }, []);

  /* ===================== SHOPIFY CURRENT MONTH ===================== */

  const fetchShopify = useCallback(async () => {
    setShopifyLoading(true);
    setShopifyError(null);
    try {
      const user_token =
        typeof window !== "undefined"
          ? localStorage.getItem("jwtToken")
          : null;
      if (!user_token) throw new Error("No token found. Please sign in.");

      if (!shopifyStore?.shop_name || !shopifyStore?.access_token) {
        throw new Error("Shopify store not connected.");
      }

      const { monthName, year } = getISTYearMonth();

      const params = new URLSearchParams({
        range: "monthly",
        month: monthName.toLowerCase(),
        year: String(year),
        user_token,
        shop: shopifyStore.shop_name,
        token: shopifyStore.access_token,
      });

      const url = `${SHOPIFY_DROPDOWN_ENDPOINT}?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${user_token}`,
        },
        credentials: "omit",
      });

      if (res.status === 401)
        throw new Error(
          "Unauthorized — token missing/invalid/expired."
        );
      if (!res.ok)
        throw new Error(`Shopify request failed: ${res.status}`);

      const json = await res.json();

      const row = json?.last_row_data ? json.last_row_data : null;
      setShopifyRows(row ? [row] : []);
    } catch (e: any) {
      setShopifyError(e?.message || "Failed to load Shopify data");
      setShopifyRows([]);
    } finally {
      setShopifyLoading(false);
    }
  }, [shopifyStore]);

  /* ===================== SHOPIFY PREVIOUS MONTH ===================== */

  const fetchShopifyPrev = useCallback(async () => {
    try {
      const user_token =
        typeof window !== "undefined"
          ? localStorage.getItem("jwtToken")
          : null;
      if (!user_token) throw new Error("No token found. Please sign in.");

      if (!shopifyStore?.shop_name || !shopifyStore?.access_token) {
        throw new Error("Shopify store not connected.");
      }

      const { year, monthName } = getPrevISTYearMonth();

      const params = new URLSearchParams({
        range: "monthly",
        month: monthName.toLowerCase(),
        year: String(year),
        user_token,
        shop: shopifyStore.shop_name,
        token: shopifyStore.access_token,
      });

      const url = `${SHOPIFY_DROPDOWN_ENDPOINT}?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${user_token}`,
        },
        credentials: "omit",
      });

      if (res.status === 401)
        throw new Error(
          "Unauthorized — token missing/invalid/expired."
        );
      if (!res.ok)
        throw new Error(
          `Shopify (prev) request failed: ${res.status}`
        );

      const json = await res.json();

      const row = json?.last_row_data ? json.last_row_data : null;
      setShopifyPrevRows(row ? [row] : []);
    } catch (e: any) {
      console.warn(
        "Shopify prev-month fetch failed:",
        (e as any)?.message
      );
      setShopifyPrevRows([]);
    }
  }, [shopifyStore]);

  /* ===================== REFRESH ALL ===================== */

  const refreshAll = useCallback(async () => {
    await fetchAmazon();

    if (shopifyStore?.shop_name && shopifyStore?.access_token) {
      await Promise.all([fetchShopify(), fetchShopifyPrev()]);
    }

    // await fetchCurrentInventory();
  }, [
    fetchAmazon,
    fetchShopify,
    fetchShopifyPrev,
    shopifyStore,
    // fetchCurrentInventory,
  ]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  /* ===================== AMAZON DERIVED DATA ===================== */

  const cms = data?.current_month_summary || null;
  const cmp = data?.current_month_profit || null;
  const skuTotals = data?.current_month_skuwise_totals || null;

  const uk = useMemo(() => {
    const netSalesGBP =
      cms?.net_sales?.GBP != null
        ? toNumberSafe(cms.net_sales.GBP)
        : null;
    const aspGBP =
      cms?.asp?.GBP != null ? toNumberSafe(cms.asp.GBP) : null;

    const breakdownGBP = cmp?.breakdown?.GBP || {};

    const cogsGBP =
      breakdownGBP.cogs !== undefined
        ? toNumberSafe(breakdownGBP.cogs)
        : 0;
    const fbaFeesGBP =
      breakdownGBP.fba_fees !== undefined
        ? toNumberSafe(breakdownGBP.fba_fees)
        : 0;
    const sellingFeesGBP =
      breakdownGBP.selling_fees !== undefined
        ? toNumberSafe(breakdownGBP.selling_fees)
        : 0;
    const amazonFeesGBP = fbaFeesGBP + sellingFeesGBP;

    const advertisingGBP =
      skuTotals?.advertising_total !== undefined
        ? toNumberSafe(skuTotals.advertising_total)
        : 0;

    const platformFeeGBP =
      skuTotals?.platform_fee_total !== undefined
        ? toNumberSafe(skuTotals.platform_fee_total)
        : 0;

    let profitGBP: number | null = null;
    if (
      cmp?.profit &&
      typeof cmp.profit === "object" &&
      cmp.profit.GBP !== undefined
    ) {
      profitGBP = toNumberSafe(cmp.profit.GBP);
    } else if (
      (typeof cmp?.profit === "number" ||
        typeof cmp?.profit === "string") &&
      netSalesGBP !== null
    ) {
      profitGBP = toNumberSafe(cmp.profit);
    }

    let unitsGBP: number | null = null;
    if (breakdownGBP.quantity !== undefined) {
      unitsGBP = toNumberSafe(breakdownGBP.quantity);
    }

    let profitPctGBP: number | null = null;
    if (
      profitGBP !== null &&
      netSalesGBP &&
      !isNaN(netSalesGBP) &&
      netSalesGBP !== 0
    ) {
      profitPctGBP = (profitGBP / netSalesGBP) * 100;
    }

    return {
      unitsGBP,
      netSalesGBP,
      aspGBP,
      profitGBP,
      profitPctGBP,
      cogsGBP,
      amazonFeesGBP,
      advertisingGBP,
      platformFeeGBP,
    };
  }, [cms, cmp, skuTotals]);

  const ukPrev = useMemo(() => {
    const prevTotals = data?.previous_month_same_day_user_totals || null;
    const prevMonthCompare =
      data?.previous_month_vs_current_percentages || null;
    const prevProfitCompare =
      data?.profit_percentage_comparison || null;

    const prevNetSalesGBP = prevTotals
      ? toNumberSafe(prevTotals.product_sales)
      : 0;

    const prevUnitsGBP = prevTotals
      ? toNumberSafe(prevTotals.quantity)
      : 0;

    const prevAspGBP = prevTotals
      ? toNumberSafe(prevTotals.asp)
      : prevUnitsGBP > 0
        ? prevNetSalesGBP / prevUnitsGBP
        : 0;

    const prevProfitGBP = prevTotals
      ? toNumberSafe(prevTotals.profit)
      : 0;

    let prevProfitPctGBP: number | null = null;
    if (
      prevProfitCompare?.profit_percentage_previous_month !=
      null
    ) {
      const raw = String(
        prevProfitCompare.profit_percentage_previous_month
      ).replace("%", "");
      const n = Number(raw);
      prevProfitPctGBP = Number.isNaN(n) ? null : n;
    } else if (
      prevNetSalesGBP > 0 &&
      Number.isFinite(prevProfitGBP)
    ) {
      prevProfitPctGBP =
        (prevProfitGBP / prevNetSalesGBP) * 100;
    }

    const pctSalesVsCurrent = prevMonthCompare
      ? parsePercentToNumber(
        prevMonthCompare.percentage_sales
      )
      : null;

    const pctUnitsVsCurrent = prevMonthCompare
      ? parsePercentToNumber(
        prevMonthCompare.percentage_quantity
      )
      : null;

    const pctAspVsCurrent = prevMonthCompare
      ? parsePercentToNumber(
        prevMonthCompare.percentage_asp
      )
      : null;

    const pctProfitVsCurrent = prevMonthCompare
      ? parsePercentToNumber(
        prevMonthCompare.percentage_profit
      )
      : null;

    const pctProfitPctVsCurrent = prevProfitCompare
      ? parsePercentToNumber(
        prevProfitCompare.percentage_profit_percentage
      )
      : null;

    return {
      netSalesGBP: prevNetSalesGBP,
      unitsGBP: prevUnitsGBP,
      aspGBP: prevAspGBP,
      profitGBP: prevProfitGBP,
      profitPctGBP: prevProfitPctGBP,
      pctNetSalesVsCurrent: pctSalesVsCurrent,
      pctUnitsVsCurrent: pctUnitsVsCurrent,
      pctAspVsCurrent: pctAspVsCurrent,
      pctProfitVsCurrent: pctProfitVsCurrent,
      pctProfitPctVsCurrent: pctProfitPctVsCurrent,
    };
  }, [data]);

  /* ===================== SHOPIFY DERIVED ===================== */

  const shopifyNotConnected =
    !shopifyStore?.shop_name ||
    !shopifyStore?.access_token ||
    (shopifyError &&
      (shopifyError
        .toLowerCase()
        .includes("shopify store not connected") ||
        shopifyError.toLowerCase().includes("no token")));

  const shopifyIntegrated =
    !shopifyNotConnected && !!shopify;

  const amazonIntegrated =
    Array.isArray(amazonConnections) &&
    amazonConnections.length > 0;

  const noIntegrations = !amazonIntegrated && !shopifyIntegrated;

  const hasAnyGraphData = amazonIntegrated || shopifyIntegrated;

  const onlyAmazon = amazonIntegrated && !shopifyIntegrated;
  const onlyShopify = shopifyIntegrated && !amazonIntegrated;



  const shopifyDeriv = useMemo(() => {
    if (!shopify) return null;
    const totalOrders = toNumberSafe(shopify.total_orders);
    const netSales = toNumberSafe(shopify.net_sales);
    const totalDiscounts = toNumberSafe(
      shopify.total_discounts
    );
    const totalTax = toNumberSafe(shopify.total_tax);
    const gross = toNumberSafe(shopify.total_price);
    const aov = totalOrders > 0 ? gross / totalOrders : 0;
    return {
      totalOrders,
      netSales,
      totalDiscounts,
      totalTax,
      gross,
      aov,
    };
  }, [shopify]);

  const shopifyPrevDeriv = useMemo(() => {
    const row = shopifyPrevRows?.[0];
    if (!row) return null;

    const netSales = toNumberSafe(row.net_sales);
    const totalOrders = toNumberSafe(row.total_orders);

    return { netSales, totalOrders };
  }, [shopifyPrevRows]);

  /* ===================== GLOBAL / FX COMBINED ===================== */

  const amazonUK_USD = useMemo(() => {
    const amazonUK_GBP = toNumberSafe(uk.netSalesGBP);
    return amazonUK_GBP * gbpToUsd;
  }, [uk.netSalesGBP, gbpToUsd]);

  const combinedUSD = useMemo(() => {
    const aUK = amazonUK_USD;
    const shopifyUSD =
      toNumberSafe(shopifyDeriv?.netSales) * inrToUsd;
    return aUK + shopifyUSD;
  }, [amazonUK_USD, shopifyDeriv?.netSales, inrToUsd]);

  const prevAmazonUKTotalUSD = useMemo(() => {
    const prevTotalGBP = toNumberSafe(
      data?.previous_month_total_net_sales?.total
    );
    return prevTotalGBP * gbpToUsd;
  }, [data?.previous_month_total_net_sales?.total, gbpToUsd]);

  const prevShopifyTotalUSD = useMemo(() => {
    const prevINRTotal = toNumberSafe(shopifyPrevDeriv?.netSales);
    return prevINRTotal * inrToUsd;
  }, [shopifyPrevDeriv, inrToUsd]);

  const globalPrevTotalUSD =
    prevShopifyTotalUSD + prevAmazonUKTotalUSD;

  const chooseLastMonthTotal = (
    manualUSD: number,
    computedUSD: number
  ) =>
    USE_MANUAL_LAST_MONTH && manualUSD > 0
      ? manualUSD
      : computedUSD;

  const prorateToDate = (lastMonthTotalUSD: number) => {
    const { todayDay, daysInPrevMonth } = getISTDayInfo();
    return daysInPrevMonth > 0
      ? (lastMonthTotalUSD * todayDay) / daysInPrevMonth
      : 0;
  };

  const regions = useMemo(
    () => {
      const globalLastMonthTotal = chooseLastMonthTotal(
        MANUAL_LAST_MONTH_USD_GLOBAL,
        globalPrevTotalUSD
      );
      const global: RegionMetrics = {
        mtdUSD: combinedUSD,
        lastMonthToDateUSD: prorateToDate(globalLastMonthTotal),
        lastMonthTotalUSD: globalLastMonthTotal,
        targetUSD: globalLastMonthTotal,
      };

      const ukLastMonthTotal = chooseLastMonthTotal(
        MANUAL_LAST_MONTH_USD_UK,
        prevAmazonUKTotalUSD
      );
      const ukRegion: RegionMetrics = {
        mtdUSD: amazonUK_USD,
        lastMonthToDateUSD: prorateToDate(ukLastMonthTotal),
        lastMonthTotalUSD: ukLastMonthTotal,
        targetUSD: ukLastMonthTotal,
      };

      const usLastMonthTotal = chooseLastMonthTotal(
        MANUAL_LAST_MONTH_USD_US,
        0
      );
      const usRegion: RegionMetrics = {
        mtdUSD: 0,
        lastMonthToDateUSD: prorateToDate(usLastMonthTotal),
        lastMonthTotalUSD: usLastMonthTotal,
        targetUSD: usLastMonthTotal,
      };

      const caLastMonthTotal = chooseLastMonthTotal(
        MANUAL_LAST_MONTH_USD_CA,
        0
      );
      const caRegion: RegionMetrics = {
        mtdUSD: 0,
        lastMonthToDateUSD: prorateToDate(caLastMonthTotal),
        lastMonthTotalUSD: caLastMonthTotal,
        targetUSD: caLastMonthTotal,
      };

      return {
        Global: global,
        UK: ukRegion,
        US: usRegion,
        CA: caRegion,
      } as Record<RegionKey, RegionMetrics>;
    },
    [
      combinedUSD,
      amazonUK_USD,
      globalPrevTotalUSD,
      prevAmazonUKTotalUSD,
    ]
  );

  const anyLoading = loading || shopifyLoading;
  const hasAnyContent =
    !!data || !!shopify || unauthorized || shopifyNotConnected || !!error;
  const initialLoading = anyLoading && !hasAnyContent;

  /* ---------- Tabs for Amazon card ---------- */
  const amazonTabs = useMemo<RegionKey[]>(() => {
    const tabs: RegionKey[] = [];
    (["UK", "US", "CA"] as RegionKey[]).forEach((key) => {
      const r = regions[key];
      if (!r) return;
      if (
        r.mtdUSD ||
        r.lastMonthToDateUSD ||
        r.lastMonthTotalUSD ||
        r.targetUSD
      ) {
        tabs.push(key);
      }
    });
    return tabs;
  }, [regions]);

  useEffect(() => {
    if (amazonTabs.length && !amazonTabs.includes(amazonRegion)) {
      setAmazonRegion(amazonTabs[0]);
    }
  }, [amazonTabs, amazonRegion]);

  /* ---------- Graph region toggles: Global + integrated ---------- */
  const graphRegions = useMemo<RegionKey[]>(() => {
    const list: RegionKey[] = ["Global"];
    (["UK", "US", "CA"] as RegionKey[]).forEach((key) => {
      const r = regions[key];
      if (!r) return;
      if (
        r.mtdUSD ||
        r.lastMonthToDateUSD ||
        r.lastMonthTotalUSD ||
        r.targetUSD
      ) {
        list.push(key);
      }
    });
    return list;
  }, [regions]);

  useEffect(() => {
    if (!graphRegions.includes(graphRegion)) {
      setGraphRegion("Global");
    }
  }, [graphRegions, graphRegion]);

  /* ---------- Global card metrics (combined) ---------- */
  const globalCardMetrics = useMemo(() => {
    const amazonUnits = toNumberSafe(cms?.total_quantity ?? 0);
    const shopifyUnits = toNumberSafe(
      shopifyDeriv?.totalOrders ?? 0
    );

    const totalUnits = amazonUnits + shopifyUnits;
    const totalSalesUSD = combinedUSD;

    const aspUSD =
      totalUnits > 0 ? totalSalesUSD / totalUnits : 0;

    const amazonProfitUSD =
      uk.profitGBP != null
        ? toNumberSafe(uk.profitGBP) * gbpToUsd
        : 0;
    const profitPct =
      totalSalesUSD > 0
        ? (amazonProfitUSD / totalSalesUSD) * 100
        : 0;

    return {
      totalSalesUSD,
      totalUnits,
      aspUSD,
      profitUSD: amazonProfitUSD,
      profitPct,
    };
  }, [cms, shopifyDeriv, combinedUSD, uk.profitGBP, gbpToUsd]);

  const globalPrevMetrics = useMemo(() => {
    // Amazon UK previous month → USD
    const amazonPrevSalesGBP = toNumberSafe(ukPrev.netSalesGBP ?? 0);
    const amazonPrevSalesUSD = amazonPrevSalesGBP * gbpToUsd;
    const amazonPrevUnits = toNumberSafe(ukPrev.unitsGBP ?? 0);
    const amazonPrevProfitGBP = toNumberSafe(ukPrev.profitGBP ?? 0);
    const amazonPrevProfitUSD = amazonPrevProfitGBP * gbpToUsd;

    // Shopify previous month → USD
    const shopifyPrevSalesINR = toNumberSafe(
      shopifyPrevDeriv?.netSales ?? 0
    );
    const shopifyPrevSalesUSD = shopifyPrevSalesINR * inrToUsd;
    const shopifyPrevUnits = toNumberSafe(
      shopifyPrevDeriv?.totalOrders ?? 0
    );

    const totalSalesUSD = amazonPrevSalesUSD + shopifyPrevSalesUSD;
    const totalUnits = amazonPrevUnits + shopifyPrevUnits;

    const aspUSD =
      totalUnits > 0 ? totalSalesUSD / totalUnits : 0;

    // For now we only have Amazon profit – Shopify profit unknown.
    const profitUSD = amazonPrevProfitUSD;
    const profitPct =
      totalSalesUSD > 0 ? (profitUSD / totalSalesUSD) * 100 : 0;

    return {
      totalSalesUSD,
      totalUnits,
      aspUSD,
      profitUSD,
      profitPct,
    };
  }, [ukPrev, shopifyPrevDeriv, gbpToUsd, inrToUsd]);

  /* ---------- P&L items for graph based on graphRegion ---------- */

  // const plItems = useMemo(() => {
  //   if (graphRegion === "Global") {
  //     // combinedUSD is in USD
  //     const salesHome = convertToHomeCurrency(combinedUSD, "USD");

  //     return [
  //       {
  //         label: "Sales",
  //         raw: salesHome,
  //         display: formatHomeAmount(salesHome),
  //       },
  //       {
  //         label: "Amazon Fees",
  //         raw: 0,
  //         display: formatHomeAmount(0),
  //       },
  //       {
  //         label: "COGS",
  //         raw: 0,
  //         display: formatHomeAmount(0),
  //       },
  //       {
  //         label: "Advertisements",
  //         raw: 0,
  //         display: formatHomeAmount(0),
  //       },
  //       {
  //         label: "Other Charges",
  //         raw: 0,
  //         display: formatHomeAmount(0),
  //       },
  //       {
  //         label: "Profit",
  //         raw: 0,
  //         display: formatHomeAmount(0),
  //       },
  //     ];
  //   }

  //   // Region-level; currently only UK has actual cost data
  //   const salesHome = convertToHomeCurrency(uk.netSalesGBP ?? 0, "GBP");
  //   const amazonFeesHome = convertToHomeCurrency(uk.amazonFeesGBP ?? 0, "GBP");
  //   const cogsHome = convertToHomeCurrency(uk.cogsGBP ?? 0, "GBP");
  //   const advHome = convertToHomeCurrency(uk.advertisingGBP ?? 0, "GBP");
  //   const platformHome = convertToHomeCurrency(uk.platformFeeGBP ?? 0, "GBP");
  //   const profitHome = convertToHomeCurrency(uk.profitGBP ?? 0, "GBP");

  //   return [
  //     {
  //       label: "Sales",
  //       raw: salesHome,
  //       display: formatHomeAmount(salesHome),
  //     },
  //     {
  //       label: "Amazon Fees",
  //       raw: amazonFeesHome,
  //       display: formatHomeAmount(amazonFeesHome),
  //     },
  //     {
  //       label: "COGS",
  //       raw: cogsHome,
  //       display: formatHomeAmount(cogsHome),
  //     },
  //     {
  //       label: "Advertisements",
  //       raw: advHome,
  //       display: formatHomeAmount(advHome),
  //     },
  //     {
  //       label: "Platform Fees",
  //       raw: platformHome,
  //       display: formatHomeAmount(platformHome),
  //     },
  //     {
  //       label: "Profit",
  //       raw: profitHome,
  //       display: formatHomeAmount(profitHome),
  //     },
  //   ];
  // }, [
  //   graphRegion,
  //   combinedUSD,
  //   uk.netSalesGBP,
  //   uk.amazonFeesGBP,
  //   uk.cogsGBP,
  //   uk.advertisingGBP,
  //   uk.platformFeeGBP,
  //   uk.profitGBP,
  //   convertToHomeCurrency,
  //   formatHomeAmount,
  // ]);

  const plItems = useMemo(() => {
    // ---------- GLOBAL VIEW ----------
    if (graphRegion === "Global") {
      // Case 1: BOTH Amazon + Shopify connected → show aggregate
      if (amazonIntegrated && shopifyIntegrated) {
        const salesHome = convertToHomeCurrency(combinedUSD, "USD");

        return [
          {
            label: "Sales",
            raw: salesHome,
            display: formatHomeAmount(salesHome),
          },
          {
            label: "Amazon Fees",
            raw: 0,
            display: formatHomeAmount(0),
          },
          {
            label: "COGS",
            raw: 0,
            display: formatHomeAmount(0),
          },
          {
            label: "Advertisements",
            raw: 0,
            display: formatHomeAmount(0),
          },
          {
            label: "Other Charges",
            raw: 0,
            display: formatHomeAmount(0),
          },
          {
            label: "Profit",
            raw: 0,
            display: formatHomeAmount(0),
          },
        ];
      }

      // Case 2: ONLY Amazon connected → Global should look exactly like UK
      if (onlyAmazon) {
        const salesHome = convertToHomeCurrency(uk.netSalesGBP ?? 0, "GBP");
        const amazonFeesHome = convertToHomeCurrency(
          uk.amazonFeesGBP ?? 0,
          "GBP"
        );
        const cogsHome = convertToHomeCurrency(uk.cogsGBP ?? 0, "GBP");
        const advHome = convertToHomeCurrency(uk.advertisingGBP ?? 0, "GBP");
        const platformHome = convertToHomeCurrency(
          uk.platformFeeGBP ?? 0,
          "GBP"
        );
        const profitHome = convertToHomeCurrency(uk.profitGBP ?? 0, "GBP");

        return [
          {
            label: "Sales",
            raw: salesHome,
            display: formatHomeAmount(salesHome),
          },
          {
            label: "Amazon Fees",
            raw: amazonFeesHome,
            display: formatHomeAmount(amazonFeesHome),
          },
          {
            label: "COGS",
            raw: cogsHome,
            display: formatHomeAmount(cogsHome),
          },
          {
            label: "Advertisements",
            raw: advHome,
            display: formatHomeAmount(advHome),
          },
          {
            label: "Platform Fees",
            raw: platformHome,
            display: formatHomeAmount(platformHome),
          },
          {
            label: "Profit",
            raw: profitHome,
            display: formatHomeAmount(profitHome),
          },
        ];
      }

      // Case 3: ONLY Shopify connected → Global = Shopify-only aggregate
      if (onlyShopify) {
        const salesHome = convertToHomeCurrency(
          shopifyDeriv?.netSales ?? 0,
          "INR"
        );

        return [
          {
            label: "Sales",
            raw: salesHome,
            display: formatHomeAmount(salesHome),
          },
          {
            label: "Amazon Fees",
            raw: 0,
            display: formatHomeAmount(0),
          },
          {
            label: "COGS",
            raw: 0,
            display: formatHomeAmount(0),
          },
          {
            label: "Advertisements",
            raw: 0,
            display: formatHomeAmount(0),
          },
          {
            label: "Other Charges",
            raw: 0,
            display: formatHomeAmount(0),
          },
          {
            label: "Profit",
            raw: 0,
            display: formatHomeAmount(0),
          },
        ];
      }

      // Fallback if somehow no integrations → all zeros
      const zeroDisplay = formatHomeAmount(0);
      return [
        { label: "Sales", raw: 0, display: zeroDisplay },
        { label: "Amazon Fees", raw: 0, display: zeroDisplay },
        { label: "COGS", raw: 0, display: zeroDisplay },
        { label: "Advertisements", raw: 0, display: zeroDisplay },
        { label: "Other Charges", raw: 0, display: zeroDisplay },
        { label: "Profit", raw: 0, display: zeroDisplay },
      ];
    }

    // ---------- REGION-LEVEL (currently UK only has data) ----------
    const salesHome = convertToHomeCurrency(uk.netSalesGBP ?? 0, "GBP");
    const amazonFeesHome = convertToHomeCurrency(
      uk.amazonFeesGBP ?? 0,
      "GBP"
    );
    const cogsHome = convertToHomeCurrency(uk.cogsGBP ?? 0, "GBP");
    const advHome = convertToHomeCurrency(uk.advertisingGBP ?? 0, "GBP");
    const platformHome = convertToHomeCurrency(
      uk.platformFeeGBP ?? 0,
      "GBP"
    );
    const profitHome = convertToHomeCurrency(uk.profitGBP ?? 0, "GBP");

    return [
      {
        label: "Sales",
        raw: salesHome,
        display: formatHomeAmount(salesHome),
      },
      {
        label: "Amazon Fees",
        raw: amazonFeesHome,
        display: formatHomeAmount(amazonFeesHome),
      },
      {
        label: "COGS",
        raw: cogsHome,
        display: formatHomeAmount(cogsHome),
      },
      {
        label: "Advertisements",
        raw: advHome,
        display: formatHomeAmount(advHome),
      },
      {
        label: "Platform Fees",
        raw: platformHome,
        display: formatHomeAmount(platformHome),
      },
      {
        label: "Profit",
        raw: profitHome,
        display: formatHomeAmount(profitHome),
      },
    ];
  }, [
    graphRegion,
    amazonIntegrated,
    shopifyIntegrated,
    onlyAmazon,
    onlyShopify,
    combinedUSD,
    uk.netSalesGBP,
    uk.amazonFeesGBP,
    uk.cogsGBP,
    uk.advertisingGBP,
    uk.platformFeeGBP,
    uk.profitGBP,
    shopifyDeriv?.netSales,
    convertToHomeCurrency,
    formatHomeAmount,
  ]);


  const hasGlobalCard = !noIntegrations;
  const hasAmazonCard = amazonIntegrated;
  const hasShopifyCard = !shopifyNotConnected;

  // When Shopify card is missing, make the left column taller
  const leftColumnHeightClass = !hasShopifyCard ? "lg:min-h-[520px]" : "";


  /* ---------- Chart & Excel export wiring ---------- */

  const countryNameForGraph =
    graphRegion === "Global"
      ? "global"
      : graphRegion.toLowerCase();

  const currencySymbol =
    homeCurrency === "USD" ? "$" :
      homeCurrency === "GBP" ? "£" :
        homeCurrency === "CAD" ? "CA$" :
          homeCurrency === "INR" ? "₹" :
            "¤";



  const { monthName: currMonthName, year: currYear } =
    getISTYearMonth();
  const shortMonForGraph = new Date(
    `${currMonthName} 1, ${currYear}`
  ).toLocaleString("en-US", {
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  const formattedMonthYear = `${shortMonForGraph}'${String(
    currYear
  ).slice(-2)}`;

  const labels = plItems.map((i) => i.label);
  const values = plItems.map((i) => i.raw);

  const colorMapping: Record<string, string> = {
    Sales: "#2CA9E0",
    "Amazon Fees": "#ff5c5c",
    COGS: "#AB64B5",
    Advertisements: "#F47A00",
    "Other Charges": "#00627D",
    "Platform Fees": "#154B9B",
    Profit: "#87AD12",
  };
  const colors = labels.map(
    (label) => colorMapping[label] || "#2CA9E0"
  );

  const allValuesZero = values.every((v) => !v || v === 0);

  const captureChartPng = useCallback(async () => {
    const container = chartRef.current;
    if (!container) return null;

    // Prefer canvas (if DashboardBargraphCard uses canvas)
    const canvas = container.querySelector(
      "canvas"
    ) as HTMLCanvasElement | null;
    if (canvas) {
      try {
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = canvas.width;
        tmpCanvas.height = canvas.height;
        const ctx = tmpCanvas.getContext("2d");
        if (!ctx) return null;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        ctx.drawImage(canvas, 0, 0);

        return tmpCanvas.toDataURL("image/png");
      } catch (e) {
        console.error("Failed to capture canvas chart", e);
        return null;
      }
    }

    const svg = container.querySelector("svg");
    if (!svg) return null;

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svg);

    if (
      !svgString.includes(
        'xmlns="http://www.w3.org/2000/svg"'
      )
    ) {
      svgString = svgString.replace(
        "<svg",
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
    }

    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    return new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const rect = svg.getBoundingClientRect();
        const canvasEl = document.createElement("canvas");
        canvasEl.width = rect.width || 1000;
        canvasEl.height = rect.height || 500;

        const ctx = canvasEl.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
        ctx.drawImage(
          img,
          0,
          0,
          canvasEl.width,
          canvasEl.height
        );

        const pngDataUrl = canvasEl.toDataURL("image/png");
        URL.revokeObjectURL(url);
        resolve(pngDataUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  }, []);

  const handleDownload = useCallback(async () => {
    try {
      const pngDataUrl = await captureChartPng();

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Amazon P&L");

      sheet.addRow([brandName || "Brand"]);
      sheet.addRow([`Amazon P&L - ${formattedMonthYear}`]);
      sheet.addRow([
        `Country: ${countryNameForGraph.toUpperCase()}`,
      ]);
      sheet.addRow([`Currency: ${currencySymbol}`]);
      sheet.addRow([""]);

      sheet.addRow(["Metric", "", `Amount (${currencySymbol})`]);

      const signs: Record<string, string> = {
        Sales: "(+)",
        "Amazon Fees": "(-)",
        COGS: "(-)",
        Advertisements: "(-)",
        "Other Charges": "(-)",
        "Platform Fees": "(-)",
        Profit: "",
      };

      values.forEach((v, idx) => {
        const label = labels[idx];
        const sign = signs[label] || "";
        const num = Number(v || 0);
        sheet.addRow([
          label,
          sign,
          Number(num.toFixed(2)),
        ]);
      });

      const totalValue = values.reduce(
        (acc, v) => acc + (Number(v) || 0),
        0
      );
      sheet.addRow([
        "Total",
        "",
        Number(totalValue.toFixed(2)),
      ]);

      if (pngDataUrl) {
        const base64 = pngDataUrl.replace(
          /^data:image\/png;base64,/,
          ""
        );
        const imageId = workbook.addImage({
          base64,
          extension: "png",
        });

        // cast anchor to `any` to satisfy ExcelJS Anchor typing
        sheet.addImage(imageId, {
          tl: { col: 0, row: 9 } as any,
          br: { col: 8, row: 28 } as any,
          editAs: "oneCell",
        } as any);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `Amazon-PnL-${formattedMonthYear}.xlsx`
      );
    } catch (err) {
      console.error(
        "Error generating Excel with chart",
        err
      );
    }
  }, [
    labels,
    values,
    brandName,
    formattedMonthYear,
    countryNameForGraph,
    currencySymbol,
    captureChartPng,
  ]);

  /* ===================== BODY SCROLL LOCK ON INITIAL LOAD ===================== */

  useEffect(() => {
    if (initialLoading) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [initialLoading]);

  /* ===================== RENDER ===================== */

  return (
    <div className="relative">
      {initialLoading && (
        <>
          <div className="fixed inset-0 z-40 bg-white/70" />

          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <Loader
              src="/infinity-unscreen.gif"
              label="Loading sales dashboard…"
              size={120}
              roundedClass="rounded-xl"
              backgroundClass="bg-transparent"
              respectReducedMotion
            />
          </div>
        </>
      )}

      <div
        className={
          initialLoading ? "pointer-events-none opacity-40" : ""
        }
      >
        <div className="">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col leading-tight">
              <p className="text-lg text-charcoal-500 mb-1">
                Let&apos;s get started,{" "}
                <span className="text-green-500">
                  {brandName}!
                </span>
              </p>

              <div className="flex items-center gap-2">
                <PageBreadcrumb
                  pageTitle="Sales Dashboard -"
                  variant="page"
                  textSize="2xl"
                  className="text-2xl font-semibold"
                />

                <span className="text-lg sm:text-2xl md:text-2xl font-semibold text-[#5EA68E]">
                  {(() => {
                    const { monthName, year } =
                      getISTYearMonth();
                    const shortMon = new Date(
                      `${monthName} 1, ${year}`
                    ).toLocaleString("en-US", {
                      month: "short",
                      timeZone: "Asia/Kolkata",
                    });
                    return `${shortMon} '${String(year).slice(
                      -2
                    )}`;
                  })()}
                </span>
              </div>
            </div>

            <button
              onClick={refreshAll}
              disabled={anyLoading}
              className={`w-full rounded-md border px-3 py-1.5 text-sm shadow-sm active:scale-[.99] sm:w-auto ${anyLoading
                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                : "border-gray-300 bg-white hover:bg-gray-50"
                }`}
            >
              {anyLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader
                    src="/infinity-unscreen.gif"
                    size={16}
                    transparent
                    roundedClass="rounded-full"
                    backgroundClass="bg-transparent"
                    className="text-gray-400"
                    forceFallback={false}
                    respectReducedMotion
                  />
                  <span>Refreshing…</span>
                </span>
              ) : (
                "Refresh"
              )}
            </button>
          </div>

          <div
            className={`grid grid-cols-12 gap-6 ${!noIntegrations ? "items-stretch" : ""
              }`}
          >
            {/* LEFT COLUMN: Global + Amazon + Shopify */}
            <div
              className={`col-span-12 lg:col-span-8 order-2 lg:order-1 flex flex-col gap-6 ${leftColumnHeightClass}`}
            >
              {/* GLOBAL CARD */}
              {hasGlobalCard && (
                <div className="flex lg:flex-1">
                  <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <PageBreadcrumb
                          pageTitle="Global"
                          variant="page"
                          align="left"
                        />
                      </div>
                      <p className="mt-1 text-sm text-charcoal-500">
                        Real-time data from Amazon &amp; Shopify
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <AmazonStatCard
                        label="Sales"
                        current={convertToHomeCurrency(
                          globalCardMetrics.totalSalesUSD,
                          "USD"
                        )}
                        previous={convertToHomeCurrency(
                          globalPrevMetrics.totalSalesUSD,
                          "USD"
                        )}
                        loading={anyLoading}
                        formatter={formatHomeAmount}
                        bottomLabel={prevLabel}
                        className="border-[#87AD12] bg-[#87AD1226]"
                      />

                      <AmazonStatCard
                        label="Units"
                        current={globalCardMetrics.totalUnits}
                        previous={globalPrevMetrics.totalUnits}
                        loading={anyLoading}
                        formatter={fmtInt}
                        bottomLabel={prevLabel}
                        className="border-[#F47A00] bg-[#F47A0026]"
                      />

                      <AmazonStatCard
                        label="ASP"
                        current={convertToHomeCurrency(
                          globalCardMetrics.aspUSD,
                          "USD"
                        )}
                        previous={convertToHomeCurrency(
                          globalPrevMetrics.aspUSD,
                          "USD"
                        )}
                        loading={anyLoading}
                        formatter={formatHomeAmount}
                        bottomLabel={prevLabel}
                        className="border-[#2CA9E0] bg-[#2CA9E026]"
                      />

                      <AmazonStatCard
                        label="Profit"
                        current={convertToHomeCurrency(
                          globalCardMetrics.profitUSD,
                          "USD"
                        )}
                        previous={convertToHomeCurrency(
                          globalPrevMetrics.profitUSD,
                          "USD"
                        )}
                        loading={anyLoading}
                        formatter={formatHomeAmount}
                        bottomLabel={prevLabel}
                        className="border-[#AB64B5] bg-[#AB64B526]"
                      />

                      <AmazonStatCard
                        label="Profit %"
                        current={globalCardMetrics.profitPct}
                        previous={globalPrevMetrics.profitPct}
                        loading={anyLoading}
                        formatter={fmtPct}
                        bottomLabel={prevLabel}
                        className="border-[#00627B] bg-[#00627B26]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AMAZON CARD */}
              {hasAmazonCard && (
                <div className="flex lg:flex-1">
                  <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-row gap-4 items-start md:items-start md:justify-between">
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <PageBreadcrumb
                            pageTitle="Amazon"
                            variant="page"
                            align="left"
                          />
                        </div>

                        <p className="mt-1 text-sm text-charcoal-500">
                          Real-time data from Amazon
                        </p>
                      </div>

                      {amazonTabs.length > 0 && (
                        <div className="mt-1 md:mt-0 self-start md:self-center">
                          <SegmentedToggle<RegionKey>
                            value={amazonRegion}
                            options={amazonTabs.map((r) => ({
                              value: r,
                            }))}
                            onChange={setAmazonRegion}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <AmazonStatCard
                        label="Sales"
                        current={convertToHomeCurrency(
                          uk.netSalesGBP,
                          "GBP"
                        )}
                        previous={convertToHomeCurrency(
                          ukPrev.netSalesGBP,
                          "GBP"
                        )}
                        loading={loading}
                        formatter={formatHomeAmount}
                        bottomLabel={prevLabel}
                        className="border-[#87AD12] bg-[#87AD1226]"
                      />

                      <AmazonStatCard
                        label="Units"
                        current={cms?.total_quantity ?? 0}
                        previous={ukPrev.unitsGBP}
                        loading={loading}
                        formatter={fmtInt}
                        bottomLabel={prevLabel}
                        className="border-[#F47A00] bg-[#F47A0026]"
                      />

                      <AmazonStatCard
                        label="ASP"
                        current={convertToHomeCurrency(
                          uk.aspGBP,
                          "GBP"
                        )}
                        previous={convertToHomeCurrency(
                          ukPrev.aspGBP,
                          "GBP"
                        )}
                        loading={loading}
                        formatter={formatHomeAmount}
                        bottomLabel={prevLabel}
                        className="border-[#2CA9E0] bg-[#2CA9E026]"
                      />

                      <AmazonStatCard
                        label="Profit"
                        current={convertToHomeCurrency(
                          uk.profitGBP,
                          "GBP"
                        )}
                        previous={convertToHomeCurrency(
                          ukPrev.profitGBP,
                          "GBP"
                        )}
                        loading={loading}
                        formatter={formatHomeAmount}
                        bottomLabel={prevLabel}
                        className="border-[#AB64B5] bg-[#AB64B526]"
                      />

                      <AmazonStatCard
                        label="Profit %"
                        current={uk.profitPctGBP}
                        previous={ukPrev.profitPctGBP}
                        loading={loading}
                        formatter={fmtPct}
                        bottomLabel={prevLabel}
                        className="border-[#00627B] bg-[#00627B26]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SHOPIFY CARD */}
              {hasShopifyCard && (
                <div className="flex lg:flex-1">
                  <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                          <PageBreadcrumb
                            pageTitle="Shopify"
                            variant="page"
                            align="left"
                            textSize="2xl"
                          />
                        </div>

                        <p className="mt-1 text-sm text-charcoal-500">
                          Real-time data from Shopify
                        </p>
                      </div>
                    </div>

                    {shopifyLoading ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="rounded-2xl border bg-white p-5 shadow-sm"
                          >
                            <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                            <div className="mt-2 h-7 w-28 animate-pulse rounded bg-gray-200" />
                          </div>
                        ))}
                      </div>
                    ) : shopify ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <AmazonStatCard
                          label="Sales"
                          current={convertToHomeCurrency(
                            shopifyDeriv?.netSales ?? 0,
                            "INR"
                          )}
                          previous={convertToHomeCurrency(
                            shopifyPrevDeriv?.netSales ?? 0,
                            "INR"
                          )}
                          loading={shopifyLoading}
                          formatter={formatHomeAmount}
                          bottomLabel={prevLabel}
                          className="border-[#87AD12] bg-[#87AD1226]"
                        />

                        <AmazonStatCard
                          label="Units"
                          current={shopifyDeriv?.totalOrders ?? 0}
                          previous={shopifyPrevDeriv?.totalOrders ?? 0}
                          loading={shopifyLoading}
                          formatter={fmtInt}
                          bottomLabel={prevLabel}
                          className="border-[#F47A00] bg-[#F47A0026]"
                        />

                        <AmazonStatCard
                          label="ASP"
                          current={(() => {
                            const units = shopifyDeriv?.totalOrders ?? 0;
                            if (!units) return 0;
                            const netHome = convertToHomeCurrency(
                              shopifyDeriv?.netSales ?? 0,
                              "INR"
                            );
                            return netHome / units;
                          })()}
                          previous={(() => {
                            const unitsPrev =
                              shopifyPrevDeriv?.totalOrders ?? 0;
                            if (!unitsPrev) return 0;
                            const netPrevHome = convertToHomeCurrency(
                              shopifyPrevDeriv?.netSales ?? 0,
                              "INR"
                            );
                            return netPrevHome / unitsPrev;
                          })()}
                          loading={shopifyLoading}
                          formatter={formatHomeAmount}
                          bottomLabel={prevLabel}
                          className="border-[#2CA9E0] bg-[#2CA9E026]"
                        />
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-500">
                        No Shopify data for the current month.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Sales Target card */}
            <aside className="col-span-12 lg:col-span-4 order-1 lg:order-2">
              <div className="lg:sticky lg:top-6 w-full">
                <SalesTargetCard regions={regions} defaultRegion="Global" />
              </div>
            </aside>

          </div>

          {/* AMAZON P&L GRAPH */}
          {/* {amazonIntegrated && (
            <>
              <div className="mt-8 rounded-2xl border bg-[#D9D9D933] p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <PageBreadcrumb
                      pageTitle="Amazon"
                      align="left"
                      textSize="2xl"
                      variant="page"
                    />
                    <p className="text-charcoal-500">
                      Real-time data from Amazon{" "}
                      {graphRegion === "Global"
                        ? "Global"
                        : graphRegion}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <SegmentedToggle<RegionKey>
                      value={graphRegion}
                      options={graphRegions.map((r) => ({
                        value: r,
                      }))}
                      onChange={setGraphRegion}
                    />
                    <DownloadIconButton
                      onClick={handleDownload}
                    />
                  </div>
                </div>

                <div ref={chartRef}>
                  <DashboardBargraphCard
                    countryName={countryNameForGraph}
                    formattedMonthYear={formattedMonthYear}
                    currencySymbol={currencySymbol}
                    labels={labels}
                    values={values}
                    colors={colors}
                    loading={loading}
                    allValuesZero={allValuesZero}
                  />
                </div>
              </div>


              <CurrentInventorySection region={graphRegion as RegionKey} />

            
            </>
          )} */}


          {/* P&L GRAPH (Global + Amazon/Shopify) */}
          {hasAnyGraphData && (
            <>
              <div className="mt-8 rounded-2xl border bg-[#D9D9D933] p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <PageBreadcrumb
                      pageTitle="Amazon"
                      align="left"
                      textSize="2xl"
                      variant="page"
                    />
                    <p className="text-charcoal-500">
                      Real-time data from{" "}
                      {amazonIntegrated && shopifyIntegrated
                        ? "Amazon & Shopify"
                        : amazonIntegrated
                          ? "Amazon"
                          : "Shopify"}{" "}
                      {graphRegion === "Global" ? "Global" : graphRegion}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <SegmentedToggle<RegionKey>
                      value={graphRegion}
                      options={graphRegions.map((r) => ({
                        value: r,
                      }))}
                      onChange={setGraphRegion}
                    />
                    <DownloadIconButton onClick={handleDownload} />
                  </div>
                </div>

                <div ref={chartRef}>
                  <DashboardBargraphCard
                    countryName={countryNameForGraph}
                    formattedMonthYear={formattedMonthYear}
                    currencySymbol={currencySymbol}
                    labels={labels}
                    values={values}
                    colors={colors}
                    loading={loading}
                    allValuesZero={allValuesZero}
                  />
                </div>
              </div>

              {/* Inventory section only makes sense for Amazon, so keep this guard */}
              {/* {amazonIntegrated && (
                <CurrentInventorySection region={graphRegion as RegionKey} />
              )} */}

              {/* <AgeingInventorySection /> */}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
