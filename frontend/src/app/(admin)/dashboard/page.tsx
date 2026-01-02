// // // "use client";

// // // import Loader from "@/components/loader/Loader";
// // // import React, { useEffect, useState, useMemo, useCallback } from "react";

// // // /* ===================== ENV & ENDPOINTS ===================== */
// // // const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";
// // // const SHOPIFY_CCY = process.env.NEXT_PUBLIC_SHOPIFY_CURRENCY || "GBP";
// // // const SHOPIFY_TO_GBP = Number(process.env.NEXT_PUBLIC_SHOPIFY_TO_GBP || "1"); // kept if used elsewhere
// // // const API_URL = `${baseURL}/amazon_api/orders?include=finances`;
// // // const SHOPIFY_ENDPOINT = `${baseURL}/shopify/get_monthly_data`;

// // // /** 💵 NEW: overall target in USD and FX rates (set these in your .env) */
// // // const MONTHLY_TARGET_USD = Number(process.env.NEXT_PUBLIC_MONTHLY_TARGET_USD || "50000");
// // // const GBP_TO_USD = Number(process.env.NEXT_PUBLIC_GBP_TO_USD || "1.31"); // e.g. 1.25
// // // const INR_TO_USD = Number(process.env.NEXT_PUBLIC_INR_TO_USD || "0.01128"); // e.g. 0.012
// // // // For future Amazon CA: const CAD_TO_USD = Number(process.env.NEXT_PUBLIC_CAD_TO_USD || "1");

// // // /* ===================== DATE HELPERS ===================== */
// // // function getISTYearMonth() {
// // //   const optsMonth: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", month: "long" };
// // //   const optsYear: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", year: "numeric" };
// // //   const now = new Date();
// // //   const monthName = now.toLocaleString("en-US", optsMonth);
// // //   const yearStr = now.toLocaleString("en-US", optsYear);
// // //   return { monthName, year: Number(yearStr) };
// // // }

// // // function buildShopifyURL({ year, monthName }: { year: number; monthName: string }) {
// // //   const qs = new URLSearchParams();
// // //   qs.set("year", String(year));
// // //   qs.append("months[]", monthName);
// // //   return `${SHOPIFY_ENDPOINT}?${qs.toString()}`;
// // // }

// // // /* ===================== UI HELPERS ===================== */
// // // const ValueOrSkeleton = ({
// // //   loading,
// // //   children,
// // //   compact = false,
// // // }: {
// // //   loading: boolean;
// // //   children: React.ReactNode;
// // //   compact?: boolean; // optional for small loaders (like inside boxes)
// // // }) => {
// // //   if (loading) {
// // //     return (
// // //       <div className="inline-flex items-center justify-center">
// // //         <Loader
// // //           size={compact ? 28 : 36}
// // //           transparent
// // //           roundedClass="rounded-full"
// // //           backgroundClass="bg-transparent"
// // //           className="text-gray-400"
// // //           forceFallback
// // //         />
// // //       </div>
// // //     );
// // //   }
// // //   return <>{children}</>;
// // // };

// // // /* ---------- Formatters (2 decimals for all numbers) ---------- */
// // // const fmtCurrency = (val: any, ccy = "GBP") => {
// // //   if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
// // //   return new Intl.NumberFormat("en-GB", {
// // //     style: "currency",
// // //     currency: ccy,
// // //     minimumFractionDigits: 2,
// // //     maximumFractionDigits: 2,
// // //   }).format(Number(val));
// // // };

// // // const fmtGBP = (val: any) => fmtCurrency(val, "GBP");

// // // const fmtUSD = (val: any) => {
// // //   if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
// // //   return new Intl.NumberFormat("en-US", {
// // //     style: "currency",
// // //     currency: "USD",
// // //     minimumFractionDigits: 2,
// // //     maximumFractionDigits: 2,
// // //   }).format(Number(val));
// // // };

// // // /** Shopify as INR with Indian grouping and ₹ symbol */
// // // const fmtShopify = (val: any) => {
// // //   if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
// // //   return new Intl.NumberFormat("en-IN", {
// // //     style: "currency",
// // //     currency: "INR",
// // //     minimumFractionDigits: 2,
// // //     maximumFractionDigits: 2,
// // //   }).format(Number(val));
// // // };

// // // const fmtNum = (val: any) =>
// // //   val === null || val === undefined || val === "" || isNaN(Number(val))
// // //     ? "—"
// // //     : new Intl.NumberFormat("en-GB", {
// // //         minimumFractionDigits: 2,
// // //         maximumFractionDigits: 2,
// // //       }).format(Number(val));

// // // const fmtPct = (val: any) =>
// // //   val === null || val === undefined || isNaN(Number(val))
// // //     ? "—"
// // //     : `${Number(val).toFixed(2)}%`;

// // // /* ===================== SIMPLE BAR CHART ===================== */
// // // function SimpleBarChart({
// // //   items,
// // //   height = 300,
// // //   padding = { top: 28, right: 24, bottom: 56, left: 24 },
// // //   colors = ["#2563eb", "#16a34a", "#f59e0b", "#ec4899", "#8b5cf6"],
// // // }: {
// // //   items: Array<{ label: string; raw: number; display: string }>;
// // //   height?: number;
// // //   padding?: { top: number; right: number; bottom: number; left: number };
// // //   colors?: string[];
// // // }) {
// // //   const [animateIn, setAnimateIn] = useState(false);
// // //   const [hoverIdx, setHoverIdx] = useState<number | null>(null);

// // //   useEffect(() => {
// // //     const t = setTimeout(() => setAnimateIn(true), 50);
// // //     return () => clearTimeout(t);
// // //   }, []);

// // //   const width = 760;
// // //   const innerW = width - padding.left - padding.right;
// // //   const innerH = height - padding.top - padding.bottom;
// // //   const values = items.map((d) => (Number.isFinite(d.raw) ? Math.abs(Number(d.raw)) : 0));
// // //   const max = Math.max(1, ...values);
// // //   const baseBarW = Math.max(12, (innerW / Math.max(1, items.length)) * 0.4);

// // //   const Tooltip = ({
// // //     x,
// // //     y,
// // //     label,
// // //     display,
// // //     color,
// // //   }: {
// // //     x: number;
// // //     y: number;
// // //     label: string;
// // //     display: string;
// // //     color: string;
// // //   }) => {
// // //     const textY1 = y - 30;
// // //     const text = `${label}: ${display}`;
// // //     return (
// // //       <g>
// // //         <rect x={x - 70} y={textY1 - 24} width={140} height={24} rx={6} fill="#111827" opacity="0.9" />
// // //         <text x={x} y={textY1 - 8} textAnchor="middle" fontSize="11" fill="#ffffff" style={{ pointerEvents: "none" }}>
// // //           {text}
// // //         </text>
// // //         <polygon points={`${x - 6},${textY1} ${x + 6},${textY1} ${x},${textY1 + 6}`} fill="#111827" opacity="0.9" />
// // //         <circle cx={x} cy={y} r="6.5" fill="none" stroke={color} strokeWidth={2} />
// // //       </g>
// // //     );
// // //   };

// // //   return (
// // //     <div className="w-full overflow-x-auto ">
// // //       <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[760px] select-none">
// // //         <defs>
// // //           <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
// // //             <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.15" />
// // //           </filter>
// // //         </defs>

// // //         <line
// // //           x1={padding.left}
// // //           y1={height - padding.bottom}
// // //           x2={width - padding.right}
// // //           y2={height - padding.bottom}
// // //           stroke="#e5e7eb"
// // //         />

// // //         {items.map((d, i) => {
// // //           const v = values[i];
// // //           const hFull = (v / max) * innerH;
// // //           const barH = animateIn ? hFull : 0;
// // //           const band = innerW / Math.max(1, items.length);
// // //           const xCenter = padding.left + band * i + band / 2;
// // //           const barW = hoverIdx === i ? baseBarW + 6 : baseBarW;
// // //           const x = xCenter - barW / 2;
// // //           const y = padding.top + (innerH - barH);
// // //           const color = colors[i % colors.length];

// // //           return (
// // //             <g
// // //               key={d.label}
// // //               onMouseEnter={() => setHoverIdx(i)}
// // //               onMouseLeave={() => setHoverIdx(null)}
// // //               style={{ cursor: "pointer" }}
// // //             >
// // //               <rect
// // //                 x={x}
// // //                 y={y}
// // //                 width={barW}
// // //                 height={Math.max(0, barH)}
// // //                 rx={8}
// // //                 fill={color}
// // //                 filter="url(#barShadow)"
// // //                 opacity={hoverIdx === i ? 0.95 : 0.85}
// // //               />
// // //               <text x={xCenter} y={y - 10} textAnchor="middle" fontSize={12} fontWeight={600} fill="#111827">
// // //                 {d.display}
// // //               </text>
// // //               <text x={xCenter} y={height - padding.bottom + 20} textAnchor="middle" fontSize={12} fill="#6b7280">
// // //                 {d.label}
// // //               </text>
// // //               {hoverIdx === i && <Tooltip x={xCenter} y={y} label={d.label} display={d.display} color={color} />}
// // //             </g>
// // //           );
// // //         })}
// // //       </svg>
// // //     </div>
// // //   );
// // // }

// // // /* ===================== MONTHLY TARGET GAUGE ===================== */
// // // function clamp(n: number, min: number, max: number) {
// // //   return Math.max(min, Math.min(max, n));
// // // }
// // // function MonthlyTargetGauge({
// // //   current,
// // //   target,
// // //   subtitle,
// // // }: {
// // //   current: number;
// // //   target: number;
// // //   subtitle?: string;
// // // }) {
// // //   const pct = target > 0 ? clamp(current / target, 0, 1) : 0;
// // //   const angle = 180 * pct;

// // //   const size = 260;
// // //   const stroke = 16;
// // //   const cx = size / 2;
// // //   const r = size / 2 - stroke;

// // //   const toXY = (angDeg: number) => {
// // //     const rad = (Math.PI / 180) * (180 - angDeg);
// // //     return { x: cx + r * Math.cos(rad), y: size / 2 + r * Math.sin(rad) };
// // //   };

// // //   const start = toXY(0);
// // //   const end = toXY(angle);
// // //   const bgPath = `M ${toXY(0).x} ${toXY(0).y} A ${r} ${r} 0 1 1 ${toXY(180).x} ${toXY(180).y}`;
// // //   const fgPath = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;

// // //   return (
// // //     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// // //       <div className="mb-1 text-sm text-gray-500">Monthly Target</div>
// // //       {/* <div className="text-lg font-semibold">{subtitle || "Monthly Target"}</div> */}

// // //       <div className="mt-3 flex items-center justify-center">
// // //         <svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2}`}>
// // //           <path d={bgPath} fill="none" stroke="#e5e7eb" strokeWidth={stroke} strokeLinecap="round" />
// // //           <path d={fgPath} fill="none" stroke="#16a34a" strokeWidth={stroke} strokeLinecap="round" />
// // //         </svg>
// // //       </div>

// // //       <div className="mt-2 text-center">
// // //         <div className="text-3xl font-bold">{fmtUSD(current)}</div>
// // //         <div className="text-sm text-gray-500">of {fmtUSD(target)}</div>
// // //         <div className="mt-1 text-sm font-medium">{Math.round(pct * 100)}% achieved</div>
// // //       </div>

// // //       <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
// // //         <div className="rounded-xl border bg-gray-50 p-3">
// // //           <div className="text-gray-500">Remaining</div>
// // //           <div className="font-semibold">{fmtUSD(Math.max(0, target - current))}</div>
// // //         </div>
// // //         <div className="rounded-xl border bg-gray-50 p-3">
// // //           <div className="text-gray-500">Pace (proj.)</div>
// // //           <div className="font-semibold">{target > 0 ? `${Math.round((current / target) * 100)}%` : "—"}</div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // /* ===================== MAIN PAGE ===================== */
// // // export default function DashboardPage() {
// // //   // Amazon
// // //   const [loading, setLoading] = useState(false);
// // //   const [unauthorized, setUnauthorized] = useState(false);
// // //   const [error, setError] = useState<string | null>(null);
// // //   const [data, setData] = useState<any>(null);

// // //   // Shopify
// // //   const [shopifyLoading, setShopifyLoading] = useState(false);
// // //   const [shopifyError, setShopifyError] = useState<string | null>(null);
// // //   const [shopifyRows, setShopifyRows] = useState<any[]>([]);
// // //   const shopify = shopifyRows?.[0] || null;

// // //   const fetchAmazon = useCallback(async () => {
// // //     setLoading(true);
// // //     setUnauthorized(false);
// // //     setError(null);
// // //     try {
// // //       const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
// // //       if (!token) {
// // //         setUnauthorized(true);
// // //         throw new Error("No token found. Please sign in.");
// // //       }
// // //       const res = await fetch(API_URL, {
// // //         method: "GET",
// // //         headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
// // //         credentials: "omit",
// // //       });
// // //       if (res.status === 401) {
// // //         setUnauthorized(true);
// // //         throw new Error("Unauthorized — token missing/invalid/expired.");
// // //       }
// // //       if (!res.ok) throw new Error(`Request failed: ${res.status}`);
// // //       const json = await res.json();
// // //       setData(json);
// // //     } catch (e: any) {
// // //       setError(e?.message || "Failed to load data");
// // //       setData(null);
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   }, []);

// // //   const fetchShopify = useCallback(async () => {
// // //     setShopifyLoading(true);
// // //     setShopifyError(null);
// // //     try {
// // //       const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
// // //       if (!token) throw new Error("No token found. Please sign in.");
// // //       const { monthName, year } = getISTYearMonth();
// // //       const url = buildShopifyURL({ year, monthName });
// // //       const res = await fetch(url, {
// // //         method: "GET",
// // //         headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
// // //         credentials: "omit",
// // //       });
// // //       if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
// // //       if (!res.ok) throw new Error(`Shopify request failed: ${res.status}`);
// // //       const json = await res.json();
// // //       const rows = Array.isArray(json?.data) ? json.data : [];
// // //       setShopifyRows(rows);
// // //     } catch (e: any) {
// // //       setShopifyError(e?.message || "Failed to load Shopify data");
// // //       setShopifyRows([]);
// // //     } finally {
// // //       setShopifyLoading(false);
// // //     }
// // //   }, []);

// // //   const refreshAll = useCallback(async () => {
// // //     await Promise.all([fetchAmazon(), fetchShopify()]);
// // //   }, [fetchAmazon, fetchShopify]);

// // //   useEffect(() => {
// // //     refreshAll();
// // //   }, [refreshAll]);

// // //   // ---------- Amazon aliases ----------
// // //   const cms = data?.current_month_summary || null;
// // //   const cmp = data?.current_month_profit || null;

// // //   // ---- derive UK (GBP) metrics safely from API shape ----
// // //   const uk = useMemo(() => {
// // //     const netSalesGBP = cms?.net_sales?.GBP != null ? Number(cms.net_sales.GBP) : null;
// // //     const aspGBP = cms?.asp?.GBP != null ? Number(cms.asp.GBP) : null;

// // //     let profitGBP: number | null = null;
// // //     if (cmp?.profit && typeof cmp.profit === "object" && cmp.profit.GBP !== undefined) {
// // //       profitGBP = Number(cmp.profit.GBP);
// // //     } else if ((typeof cmp?.profit === "number" || typeof cmp?.profit === "string") && netSalesGBP !== null) {
// // //       profitGBP = Number(cmp.profit);
// // //     }

// // //     let unitsGBP: number | null = null;
// // //     if (cmp?.breakdown?.GBP?.quantity !== undefined) {
// // //       unitsGBP = Number(cmp.breakdown.GBP.quantity);
// // //     }

// // //     let profitPctGBP: number | null = null;
// // //     if (profitGBP !== null && netSalesGBP && !isNaN(netSalesGBP) && netSalesGBP !== 0) {
// // //       profitPctGBP = (profitGBP / netSalesGBP) * 100;
// // //     }

// // //     return { unitsGBP, netSalesGBP, aspGBP, profitGBP, profitPctGBP };
// // //   }, [cms, cmp]);

// // //   // Amazon bar chart items
// // //   const barsAmazon = useMemo(() => {
// // //     const units = cms?.total_quantity ?? 0;
// // //     const sales = uk.netSalesGBP ?? 0;
// // //     const asp = uk.aspGBP ?? 0;
// // //     const profit = uk.profitGBP ?? 0;
// // //     const pcent = Number.isFinite(uk.profitPctGBP) ? (uk.profitPctGBP as number) : 0;

// // //     return [
// // //       { label: "Units", raw: Number(units) || 0, display: fmtNum(units) },
// // //       { label: "Sales", raw: Number(sales) || 0, display: fmtGBP(sales) },
// // //       { label: "ASP", raw: Number(asp) || 0, display: fmtGBP(asp) },
// // //       { label: "Profit", raw: Number(profit) || 0, display: fmtGBP(profit) },
// // //       { label: "Profit %", raw: Number(pcent) || 0, display: fmtPct(pcent) },
// // //     ];
// // //   }, [uk, cms]);

// // //   // Shopify derivations
// // //   const shopifyDeriv = useMemo(() => {
// // //     if (!shopify) return null;
// // //     const totalOrders = Number(shopify.total_orders ?? 0);
// // //     const netSales = Number(shopify.net_sales ?? 0);
// // //     const totalDiscounts = Number(shopify.total_discounts ?? 0);
// // //     const totalTax = Number(shopify.total_tax ?? 0);
// // //     const gross = Number(shopify.total_price ?? 0);
// // //     const aov = totalOrders > 0 ? gross / totalOrders : 0;
// // //     return { totalOrders, netSales, totalDiscounts, totalTax, gross, aov };
// // //   }, [shopify]);

// // //   // Shopify — mirror Amazon UK's 5-box structure (placeholders for profit/profit%)
// // //   const shopifyLikeAmazon = useMemo(() => {
// // //     const units = Number(shopify?.total_orders ?? 0);
// // //     const netSales = Number(shopify?.net_sales ?? 0); // INR
// // //     const asp = units > 0 ? netSales / units : null;

// // //     // TODO: map these when your backend provides them
// // //     const profit = null as number | null;
// // //     const profitPct = profit !== null && netSales ? (profit / netSales) * 100 : null;

// // //     return { units, netSales, asp, profit, profitPct };
// // //   }, [shopify]);

// // //   // Combined actuals for gauge (USD)
// // //   const combinedUSD = useMemo(() => {
// // //     // Amazon UK in GBP → USD
// // //     const amazonUK_GBP = Number(uk.netSalesGBP ?? 0);
// // //     const amazonUK_USD = amazonUK_GBP * GBP_TO_USD;

// // //     // Shopify in INR → USD
// // //     const shopifyINR = Number(shopifyDeriv?.netSales ?? 0);
// // //     const shopifyUSD = shopifyINR * INR_TO_USD;

// // //     // Future: add Amazon US (already USD) and CA (CAD → USD) here
// // //     // const amazonUS_USD = Number(us?.netSalesUSD ?? 0);
// // //     // const amazonCA_CAD = Number(ca?.netSalesCAD ?? 0);
// // //     // const amazonCA_USD = amazonCA_CAD * CAD_TO_USD;

// // //     return amazonUK_USD + shopifyUSD; // + amazonUS_USD + amazonCA_USD
// // //   }, [uk.netSalesGBP, shopifyDeriv?.netSales]);

// // //   const anyLoading = loading || shopifyLoading;

// // //   return (
// // //     <div className="mx-auto max-w-7xl px-4 py-6">
// // //       <div className="mb-4 flex items-center justify-between">
// // //         <h1 className="text-xl font-semibold tracking-tight">Amazon &amp; Shopify Overview</h1>
// // //         <button
// // //           onClick={refreshAll}
// // //           disabled={anyLoading}
// // //           className={`rounded-md border px-3 py-1.5 text-sm shadow-sm active:scale-[.99] ${
// // //             anyLoading ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400" : "border-gray-300 bg-white hover:bg-gray-50"
// // //           }`}
// // //           title="Refresh Amazon & Shopify"
// // //         >
// // //           {anyLoading ? "Refreshing…" : "Refresh"}
// // //         </button>
// // //       </div>

// // //       {/* ======================= GRID: 12 cols ======================= */}
// // //       <div className="grid grid-cols-12 gap-6">
// // //         {/* LEFT 8: Amazon cards then Shopify cards */}
// // //         <div className="col-span-12 lg:col-span-8 space-y-6">
// // //           {/* Notices */}
// // //           {unauthorized && (
// // //             <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
// // //               <div className="text-sm">You’re not signed in or your session expired. Please authenticate to load Amazon orders.</div>
// // //               <a
// // //                 href={`${baseURL || ""}/auth/login`}
// // //                 className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-amber-100"
// // //               >
// // //                 Sign in
// // //               </a>
// // //             </div>
// // //           )}
// // //           {error && (
// // //             <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
// // //               <span>⚠️</span>
// // //               <span className="text-sm">{error}</span>
// // //             </div>
// // //           )}

// // //           {/* AMAZON — 5 boxes */}
// // //           <div className="rounded-2xl border bg-white p-5 shadow-sm">
// // //             <div className="mb-2 text-sm font-medium text-gray-700">Amazon — Details (UK)</div>
// // //             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
// // //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// // //                 <div className="text-sm text-gray-500">Units</div>
// // //                 <div className="mt-1 text-2xl font-semibold">
// // //                   <ValueOrSkeleton loading={loading}>{fmtNum(cms?.total_quantity ?? 0)}</ValueOrSkeleton>
// // //                 </div>
// // //               </div>
// // //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// // //                 <div className="text-sm text-gray-500">Total Sales</div>
// // //                 <div className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
// // //                   <ValueOrSkeleton loading={loading}>{fmtGBP(uk.netSalesGBP)}</ValueOrSkeleton>
// // //                 </div>
// // //               </div>
// // //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// // //                 <div className="text-sm text-gray-500">ASP</div>
// // //                 <div className="mt-1 text-2xl font-semibold">
// // //                   <ValueOrSkeleton loading={loading}>{fmtGBP(uk.aspGBP)}</ValueOrSkeleton>
// // //                 </div>
// // //               </div>
// // //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// // //                 <div className="text-sm text-gray-500">Profit</div>
// // //                 <div className="mt-1 text-2xl font-semibold">
// // //                   <ValueOrSkeleton loading={loading}>{fmtGBP(uk.profitGBP)}</ValueOrSkeleton>
// // //                 </div>
// // //               </div>
// // //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// // //                 <div className="text-sm text-gray-500">Profit %</div>
// // //                 <div className="mt-1 text-2xl font-semibold">
// // //                   <ValueOrSkeleton loading={loading}>{fmtPct(uk.profitPctGBP)}</ValueOrSkeleton>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {/* SHOPIFY — same 5-box layout as Amazon UK */}
// // //           <div className="rounded-2xl border bg-white p-5 shadow-sm">
// // //             <div className="mb-2 text-sm font-medium text-gray-700">Shopify — Details (₹ Rupees)</div>

// // //             {shopifyError && (
// // //               <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
// // //                 <span>⚠️</span>
// // //                 <span className="text-sm">{shopifyError}</span>
// // //               </div>
// // //             )}

// // //             {shopifyLoading && (
// // //               <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
// // //                 {[...Array(5)].map((_, i) => (
// // //                   <div key={i} className="rounded-2xl border bg-white p-5 shadow-sm">
// // //                     <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
// // //                     <div className="mt-2 h-7 w-28 animate-pulse rounded bg-gray-200" />
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // // {!shopifyLoading && !shopifyError && (
// // //               <>
// // //                 {shopify ? (
// // //                   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
// // //                     {/* Units */}
// // //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// // //                       <div className="text-sm text-gray-500">Units</div>
// // //                       <div className="mt-1 text-lg font-semibold text-gray-900">
// // //                         <ValueOrSkeleton loading={shopifyLoading}>
// // //                           {fmtNum(shopifyLikeAmazon.units)}
// // //                         </ValueOrSkeleton>
// // //                       </div>
// // //                     </div>

// // //                     {/* Total Sales (₹ Rupees) */}
// // //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// // //                       <div className="text-sm text-gray-500">Total Sales</div>
// // //                       <div className="mt-1 text-lg font-bold tracking-tight text-gray-900">
// // //                         <ValueOrSkeleton loading={shopifyLoading}>
// // //                           {fmtShopify(shopifyLikeAmazon.netSales)}
// // //                         </ValueOrSkeleton>
// // //                       </div>
// // //                     </div>

// // //                     {/* ASP */}
// // //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// // //                       <div className="text-sm text-gray-500">ASP</div>
// // //                       <div className="mt-1 text-lg font-semibold text-gray-900">
// // //                         <ValueOrSkeleton loading={shopifyLoading}>
// // //                           {shopifyLikeAmazon.asp == null
// // //                             ? "—"
// // //                             : fmtShopify(shopifyLikeAmazon.asp)}
// // //                         </ValueOrSkeleton>
// // //                       </div>
// // //                     </div>

// // //                     {/* Profit — placeholder (₹) */}
// // //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// // //                       <div className="text-sm text-gray-500">Profit</div>
// // //                       <div className="mt-1 text-lg font-semibold text-gray-900">
// // //                         <ValueOrSkeleton loading={shopifyLoading}>
// // //                           {shopifyLikeAmazon.profit == null
// // //                             ? "—"
// // //                             : fmtShopify(shopifyLikeAmazon.profit)}
// // //                         </ValueOrSkeleton>
// // //                       </div>
// // //                     </div>

// // //                     {/* Profit % */}
// // //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// // //                       <div className="text-sm text-gray-500">Profit %</div>
// // //                       <div className="mt-1 text-lg font-semibold text-gray-900">
// // //                         <ValueOrSkeleton loading={shopifyLoading}>
// // //                           {fmtPct(shopifyLikeAmazon.profitPct)}
// // //                         </ValueOrSkeleton>
// // //                       </div>
// // //                     </div>
// // //                   </div>
// // //                 ) : (
// // //                   <div className="mt-2 text-sm text-gray-500">
// // //                     No Shopify data for the current month.
// // //                   </div>
// // //                 )}
// // //               </>
// // //             )}
// // //           </div>
// // //         </div>

// // //         {/* RIGHT 4: Monthly Target Gauge (USD) */}
// // //         <aside className="col-span-12 lg:col-span-4">
// // //           <div className="lg:sticky lg:top-6">
// // //             <MonthlyTargetGauge
// // //               current={combinedUSD}
// // //               target={MONTHLY_TARGET_USD}
// // //               subtitle={"Amazon + Shopify (USD • GBP/INR→USD)"}
// // //             />
// // //           </div>
// // //         </aside>
// // //       </div>

// // //       {/* ======================= FULL-WIDTH GRAPH BELOW EVERYTHING ======================= */}
// // //       <div className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
// // //         <div className="mb-3 text-sm text-gray-500">Amazon — Units, Sales, ASP, Profit, Profit %</div>
// // //         <SimpleBarChart items={barsAmazon} />
// // //       </div>
// // //     </div>
// // //   );
// // // }






































// // "use client";

// // import Loader from "@/components/loader/Loader";
// // import React, { useEffect, useState, useMemo, useCallback } from "react";

// // /* ===================== ENV & ENDPOINTS ===================== */
// // const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";
// // const SHOPIFY_CCY = process.env.NEXT_PUBLIC_SHOPIFY_CURRENCY || "GBP";
// // const SHOPIFY_TO_GBP = Number(process.env.NEXT_PUBLIC_SHOPIFY_TO_GBP || "1"); // kept if used elsewhere
// // const API_URL = `${baseURL}/amazon_api/orders?include=finances`;
// // const SHOPIFY_ENDPOINT = `${baseURL}/shopify/get_monthly_data`;

// // /** 💵 FX rates */
// // const GBP_TO_USD = Number(process.env.NEXT_PUBLIC_GBP_TO_USD || "1.31");
// // const INR_TO_USD = Number(process.env.NEXT_PUBLIC_INR_TO_USD || "0.01128");
// // // For future Amazon CA: const CAD_TO_USD = Number(process.env.NEXT_PUBLIC_CAD_TO_USD || "0.73");

// // /** 🔧 Manual override (while API for last month is pending) */
// // const USE_MANUAL_LAST_MONTH =
// //   (process.env.NEXT_PUBLIC_USE_MANUAL_LAST_MONTH || "false").toLowerCase() === "true";

// // /** Put last month's TOTAL SALES in USD (not to-date) */
// // const MANUAL_LAST_MONTH_USD_GLOBAL = Number(
// //   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_GLOBAL || "90000"
// // );
// // /** Optional per-region overrides */
// // const MANUAL_LAST_MONTH_USD_UK = Number(
// //   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_UK || "30000"
// // );
// // const MANUAL_LAST_MONTH_USD_US = Number(
// //   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_US || "45000"
// // );
// // const MANUAL_LAST_MONTH_USD_CA = Number(
// //   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_CA || "15000"
// // );

// // /* ===================== DATE HELPERS ===================== */
// // function getISTYearMonth() {
// //   const optsMonth: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", month: "long" };
// //   const optsYear: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", year: "numeric" };
// //   const now = new Date();
// //   const monthName = now.toLocaleString("en-US", optsMonth);
// //   const yearStr = now.toLocaleString("en-US", optsYear);
// //   return { monthName, year: Number(yearStr) };
// // }

// // function buildShopifyURL({ year, monthName }: { year: number; monthName: string }) {
// //   const qs = new URLSearchParams();
// //   qs.set("year", String(year));
// //   qs.append("months[]", monthName);
// //   return `${SHOPIFY_ENDPOINT}?${qs.toString()}`;
// // }

// // function getPrevISTYearMonth() {
// //   const tz = "Asia/Kolkata";
// //   const now = new Date();
// //   const istNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
// //   const year = istNow.getMonth() === 0 ? istNow.getFullYear() - 1 : istNow.getFullYear();
// //   const monthIdx = istNow.getMonth() === 0 ? 11 : istNow.getMonth() - 1;
// //   const monthName = new Date(year, monthIdx, 1).toLocaleString("en-US", { month: "long", timeZone: tz });
// //   return { monthName, year };
// // }

// // function getISTDayInfo() {
// //   const tz = "Asia/Kolkata";
// //   const now = new Date();
// //   const istNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
// //   const todayDay = istNow.getDate();
// //   const { monthName, year } = getPrevISTYearMonth();
// //   const prevMonthIdx = new Date(`${monthName} 1, ${year}`).getMonth();
// //   const daysInPrevMonth = new Date(year, prevMonthIdx + 1, 0).getDate();
// //   const daysInThisMonth = new Date(istNow.getFullYear(), istNow.getMonth() + 1, 0).getDate();
// //   return { todayDay, daysInPrevMonth, daysInThisMonth };
// // }

// // /* ===================== UI HELPERS ===================== */
// // const ValueOrSkeleton = ({
// //   loading,
// //   children,
// //   compact = false,
// // }: {
// //   loading: boolean;
// //   children: React.ReactNode;
// //   compact?: boolean;
// // }) => {
// //   if (loading) {
// //     return (
// //       <div className="inline-flex items-center justify-center">
// //         <Loader
// //           size={compact ? 28 : 36}
// //           transparent
// //           roundedClass="rounded-full"
// //           backgroundClass="bg-transparent"
// //           className="text-gray-400"
// //           forceFallback
// //         />
// //       </div>
// //     );
// //   }
// //   return <>{children}</>;
// // };

// // /* ---------- Formatters & Safe Number ---------- */
// // const fmtCurrency = (val: any, ccy = "GBP") => {
// //   if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
// //   return new Intl.NumberFormat("en-GB", {
// //     style: "currency",
// //     currency: ccy,
// //     minimumFractionDigits: 2,
// //     maximumFractionDigits: 2,
// //   }).format(Number(val));
// // };

// // const fmtGBP = (val: any) => fmtCurrency(val, "GBP");

// // const fmtUSD = (val: any) => {
// //   if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
// //   return new Intl.NumberFormat("en-US", {
// //     style: "currency",
// //     currency: "USD",
// //     minimumFractionDigits: 2,
// //     maximumFractionDigits: 2,
// //   }).format(Number(val));
// // };

// // const fmtShopify = (val: any) => {
// //   if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
// //   return new Intl.NumberFormat("en-IN", {
// //     style: "currency",
// //     currency: "INR",
// //     minimumFractionDigits: 2,
// //     maximumFractionDigits: 2,
// //   }).format(Number(val));
// // };

// // const fmtNum = (val: any) =>
// //   val === null || val === undefined || val === "" || isNaN(Number(val))
// //     ? "—"
// //     : new Intl.NumberFormat("en-GB", {
// //         minimumFractionDigits: 2,
// //         maximumFractionDigits: 2,
// //       }).format(Number(val));

// // const fmtPct = (val: any) =>
// //   val === null || val === undefined || isNaN(Number(val))
// //     ? "—"
// //     : `${Number(val).toFixed(2)}%`;

// // const toNumberSafe = (v: any) => {
// //   if (v === null || v === undefined) return 0;
// //   if (typeof v === "number") return v;
// //   const s = String(v).replace(/[, ]+/g, "");
// //   const n = Number(s);
// //   return isNaN(n) ? 0 : n;
// // };

// // /* ===================== SALES TARGET CARD ===================== */
// // type RegionKey = "Global" | "UK" | "US" | "CA";

// // function SalesTargetCard({
// //   regions,
// //   defaultRegion = "Global",
// // }: {
// //   regions: Record<
// //     RegionKey,
// //     { mtdUSD: number; lastMonthToDateUSD: number; targetUSD: number }
// //   >;
// //   defaultRegion?: RegionKey;
// // }) {
// //   const [tab, setTab] = useState<RegionKey>(defaultRegion);

// //   const data = regions[tab] || regions.Global;
// //   const { mtdUSD, lastMonthToDateUSD, targetUSD } = data;

// //   const pct = targetUSD > 0 ? Math.min(mtdUSD / targetUSD, 1) : 0;
// //   const pctLast = targetUSD > 0 ? Math.min(lastMonthToDateUSD / targetUSD, 1) : 0;
// //   const deltaPct = (pct - pctLast) * 100;

// //   const { todayDay } = getISTDayInfo();
// //   const todayApprox = todayDay > 0 ? mtdUSD / todayDay : 0;

// //   const size = 280;
// //   const stroke = 16;
// //   const cx = size / 2;
// //   const r = size / 2 - stroke;

// //   const toXY = (angDeg: number) => {
// //     const rad = (Math.PI / 180) * (180 - angDeg);
// //     return { x: cx + r * Math.cos(rad), y: size / 2 + r * Math.sin(rad) };
// //   };
// //   const arcPath = (fromDeg: number, toDeg: number) => {
// //     const start = toXY(fromDeg);
// //     const end = toXY(toDeg);
// //     const largeArc = toDeg - fromDeg > 180 ? 1 : 0;
// //     return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
// //   };

// //   const fullFrom = 0;
// //   const fullTo = 180;
// //   const mtdTo = 180 * pct;
// //   const lastTo = 180 * pctLast;
// //   const tick = toXY(180);

// //   const badgeIsUp = deltaPct >= 0;
// //   const badgeStr = (badgeIsUp ? "▲ " : "▼ ") + `${Math.abs(deltaPct).toFixed(2)}%`;

// //   return (
// //     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //       {/* Header with tabs */}
// //       <div className="mb-3 flex items-center justify-between">
// //         <div className="text-xl font-semibold text-gray-800">Sales Target</div>

// //         <div className="inline-flex rounded-full border p-1 bg-gray-50">
// //           {(["Global", "UK", "US", "CA"] as RegionKey[]).map((key) => (
// //             <button
// //               key={key}
// //               onClick={() => setTab(key)}
// //               className={`px-3 py-1 text-sm rounded-full transition ${
// //                 tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
// //               }`}
// //             >
// //               {key}
// //             </button>
// //           ))}
// //         </div>
// //       </div>

// //       {/* Legend */}
// //       <div className="mb-2 flex items-center gap-5 text-xs">
// //         <div className="flex items-center gap-2">
// //           <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#16a34a" }} />
// //           <span className="text-gray-600">MTD Sales</span>
// //         </div>
// //         <div className="flex items-center gap-2">
// //           <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#f59e0b" }} />
// //           <span className="text-gray-600">Last Month (to-date)</span>
// //         </div>
// //         <div className="flex items-center gap-2">
// //           <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#d1d5db" }} />
// //           <span className="text-gray-600">Target</span>
// //         </div>
// //       </div>

// //       {/* Gauge */}
// //       <div className="mt-2 flex items-center justify-center">
// //         <svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2}`}>
// //           <path d={arcPath(fullFrom, fullTo)} fill="none" stroke="#e5e7eb" strokeWidth={stroke} strokeLinecap="round" />
// //           <path d={arcPath(fullFrom, lastTo)} fill="none" stroke="#f59e0b" strokeWidth={stroke} strokeLinecap="round" />
// //           <path d={arcPath(fullFrom, mtdTo)} fill="none" stroke="#16a34a" strokeWidth={stroke} strokeLinecap="round" />
// //           <circle cx={tick.x} cy={tick.y} r="6" fill="#9ca3af" />
// //         </svg>
// //       </div>

// //       {/* Center metrics */}
// //       <div className="mt-2 text-center">
// //         <div className="text-3xl font-bold">{(pct * 100).toFixed(1)}%</div>
// //         <div
// //           className={`mx-auto mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
// //             badgeIsUp ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"
// //           }`}
// //         >
// //           {badgeStr}
// //         </div>
// //       </div>

// //       {/* Bottom KPIs */}
// //       <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
// //         <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-3">
// //           <div className="text-gray-500">Today</div>
// //           <div className="mt-0.5 font-semibold">{fmtUSD(todayApprox)}</div>
// //         </div>
// //         <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-3">
// //           <div className="text-gray-500">MTD Sales</div>
// //           <div className="mt-0.5 font-semibold">{fmtUSD(mtdUSD)}</div>
// //         </div>
// //         <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-3">
// //           <div className="text-gray-500">Target</div>
// //           <div className="mt-0.5 font-semibold">{fmtUSD(targetUSD)}</div>
// //         </div>
// //         <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-3">
// //           <div className="text-gray-500">Last Month MTD</div>
// //           <div className="mt-0.5 font-semibold">{fmtUSD(lastMonthToDateUSD)}</div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // /* ===================== SIMPLE BAR CHART (existing) ===================== */
// // function SimpleBarChart({
// //   items,
// //   height = 300,
// //   padding = { top: 28, right: 24, bottom: 56, left: 24 },
// //   colors = ["#2563eb", "#16a34a", "#f59e0b", "#ec4899", "#8b5cf6"],
// // }: {
// //   items: Array<{ label: string; raw: number; display: string }>;
// //   height?: number;
// //   padding?: { top: number; right: number; bottom: number; left: number };
// //   colors?: string[];
// // }) {
// //   const [animateIn, setAnimateIn] = useState(false);
// //   const [hoverIdx, setHoverIdx] = useState<number | null>(null);

// //   useEffect(() => {
// //     const t = setTimeout(() => setAnimateIn(true), 50);
// //     return () => clearTimeout(t);
// //   }, []);

// //   const width = 760;
// //   const innerW = width - padding.left - padding.right;
// //   const innerH = height - padding.top - padding.bottom;
// //   const values = items.map((d) => (Number.isFinite(d.raw) ? Math.abs(Number(d.raw)) : 0));
// //   const max = Math.max(1, ...values);
// //   const baseBarW = Math.max(12, (innerW / Math.max(1, items.length)) * 0.4);

// //   const Tooltip = ({
// //     x,
// //     y,
// //     label,
// //     display,
// //     color,
// //   }: {
// //     x: number;
// //     y: number;
// //     label: string;
// //     display: string;
// //     color: string;
// //   }) => {
// //     const textY1 = y - 30;
// //     const text = `${label}: ${display}`;
// //     return (
// //       <g>
// //         <rect x={x - 70} y={textY1 - 24} width={140} height={24} rx={6} fill="#111827" opacity="0.9" />
// //         <text x={x} y={textY1 - 8} textAnchor="middle" fontSize="11" fill="#ffffff" style={{ pointerEvents: "none" }}>
// //           {text}
// //         </text>
// //         <polygon points={`${x - 6},${textY1} ${x + 6},${textY1} ${x},${textY1 + 6}`} fill="#111827" opacity="0.9" />
// //         <circle cx={x} cy={y} r="6.5" fill="none" stroke={color} strokeWidth={2} />
// //       </g>
// //     );
// //   };

// //   return (
// //     <div className="w-full overflow-x-auto ">
// //       <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[760px] select-none">
// //         <defs>
// //           <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
// //             <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.15" />
// //           </filter>
// //         </defs>

// //         <line
// //           x1={padding.left}
// //           y1={height - padding.bottom}
// //           x2={width - padding.right}
// //           y2={height - padding.bottom}
// //           stroke="#e5e7eb"
// //         />

// //         {items.map((d, i) => {
// //           const v = values[i];
// //           const hFull = (v / max) * innerH;
// //           const barH = animateIn ? hFull : 0;
// //           const band = innerW / Math.max(1, items.length);
// //           const xCenter = padding.left + band * i + band / 2;
// //           const barW = hoverIdx === i ? baseBarW + 6 : baseBarW;
// //           const x = xCenter - barW / 2;
// //           const y = padding.top + (innerH - barH);
// //           const color = colors[i % colors.length];

// //           return (
// //             <g
// //               key={d.label}
// //               onMouseEnter={() => setHoverIdx(i)}
// //               onMouseLeave={() => setHoverIdx(null)}
// //               style={{ cursor: "pointer" }}
// //             >
// //               <rect
// //                 x={x}
// //                 y={y}
// //                 width={barW}
// //                 height={Math.max(0, barH)}
// //                 rx={8}
// //                 fill={color}
// //                 filter="url(#barShadow)"
// //                 opacity={hoverIdx === i ? 0.95 : 0.85}
// //               />
// //               <text x={xCenter} y={y - 10} textAnchor="middle" fontSize={12} fontWeight={600} fill="#111827">
// //                 {d.display}
// //               </text>
// //               <text x={xCenter} y={height - padding.bottom + 20} textAnchor="middle" fontSize={12} fill="#6b7280">
// //                 {d.label}
// //               </text>
// //               {hoverIdx === i && <Tooltip x={xCenter} y={y} label={d.label} display={d.display} color={color} />}
// //             </g>
// //           );
// //         })}
// //       </svg>
// //     </div>
// //   );
// // }

// // /* ===================== MAIN PAGE ===================== */
// // export default function DashboardPage() {
// //   // Amazon
// //   const [loading, setLoading] = useState(false);
// //   const [unauthorized, setUnauthorized] = useState(false);
// //   const [error, setError] = useState<string | null>(null);
// //   const [data, setData] = useState<any>(null);

// //   // Shopify (current month)
// //   const [shopifyLoading, setShopifyLoading] = useState(false);
// //   const [shopifyError, setShopifyError] = useState<string | null>(null);
// //   const [shopifyRows, setShopifyRows] = useState<any[]>([]);
// //   const shopify = shopifyRows?.[0] || null;

// //   // Shopify (previous month)
// //   const [shopifyPrevRows, setShopifyPrevRows] = useState<any[]>([]);

// //   const fetchAmazon = useCallback(async () => {
// //     setLoading(true);
// //     setUnauthorized(false);
// //     setError(null);
// //     try {
// //       const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
// //       if (!token) {
// //         setUnauthorized(true);
// //         throw new Error("No token found. Please sign in.");
// //       }
// //       const res = await fetch(API_URL, {
// //         method: "GET",
// //         headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
// //         credentials: "omit",
// //       });
// //       if (res.status === 401) {
// //         setUnauthorized(true);
// //         throw new Error("Unauthorized — token missing/invalid/expired.");
// //       }
// //       if (!res.ok) throw new Error(`Request failed: ${res.status}`);
// //       const json = await res.json();
// //       setData(json);
// //     } catch (e: any) {
// //       setError(e?.message || "Failed to load data");
// //       setData(null);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   const fetchShopify = useCallback(async () => {
// //     setShopifyLoading(true);
// //     setShopifyError(null);
// //     try {
// //       const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
// //       if (!token) throw new Error("No token found. Please sign in.");
// //       const { monthName, year } = getISTYearMonth();
// //       const url = buildShopifyURL({ year, monthName });
// //       const res = await fetch(url, {
// //         method: "GET",
// //         headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
// //         credentials: "omit",
// //       });
// //       if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
// //       if (!res.ok) throw new Error(`Shopify request failed: ${res.status}`);
// //       const json = await res.json();
// //       const rows = Array.isArray(json?.data) ? json.data : [];
// //       setShopifyRows(rows);
// //     } catch (e: any) {
// //       setShopifyError(e?.message || "Failed to load Shopify data");
// //       setShopifyRows([]);
// //     } finally {
// //       setShopifyLoading(false);
// //     }
// //   }, []);

// //   const fetchShopifyPrev = useCallback(async () => {
// //     try {
// //       const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
// //       if (!token) throw new Error("No token found. Please sign in.");
// //       const { year, monthName } = getPrevISTYearMonth();
// //       const url = buildShopifyURL({ year, monthName });
// //       const res = await fetch(url, {
// //         method: "GET",
// //         headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
// //         credentials: "omit",
// //       });
// //       if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
// //       if (!res.ok) throw new Error(`Shopify (prev) request failed: ${res.status}`);
// //       const json = await res.json();
// //       const rows = Array.isArray(json?.data) ? json.data : [];
// //       setShopifyPrevRows(rows);
// //     } catch (e: any) {
// //       console.warn("Shopify prev-month fetch failed:", e?.message);
// //     }
// //   }, []);

// //   const refreshAll = useCallback(async () => {
// //     await Promise.all([fetchAmazon(), fetchShopify(), fetchShopifyPrev()]);
// //   }, [fetchAmazon, fetchShopify, fetchShopifyPrev]);

// //   useEffect(() => {
// //     refreshAll();
// //   }, [refreshAll]);

// //   // ---------- Amazon aliases ----------
// //   const cms = data?.current_month_summary || null;
// //   const cmp = data?.current_month_profit || null;

// //   // ---- derive UK (GBP) metrics safely from API shape ----
// //   const uk = useMemo(() => {
// //     const netSalesGBP = cms?.net_sales?.GBP != null ? toNumberSafe(cms.net_sales.GBP) : null;
// //     const aspGBP = cms?.asp?.GBP != null ? toNumberSafe(cms.asp.GBP) : null;

// //     let profitGBP: number | null = null;
// //     if (cmp?.profit && typeof cmp.profit === "object" && cmp.profit.GBP !== undefined) {
// //       profitGBP = toNumberSafe(cmp.profit.GBP);
// //     } else if ((typeof cmp?.profit === "number" || typeof cmp?.profit === "string") && netSalesGBP !== null) {
// //       profitGBP = toNumberSafe(cmp.profit);
// //     }

// //     let unitsGBP: number | null = null;
// //     if (cmp?.breakdown?.GBP?.quantity !== undefined) {
// //       unitsGBP = toNumberSafe(cmp.breakdown.GBP.quantity);
// //     }

// //     let profitPctGBP: number | null = null;
// //     if (profitGBP !== null && netSalesGBP && !isNaN(netSalesGBP) && netSalesGBP !== 0) {
// //       profitPctGBP = (profitGBP / netSalesGBP) * 100;
// //     }

// //     return { unitsGBP, netSalesGBP, aspGBP, profitGBP, profitPctGBP };
// //   }, [cms, cmp]);

// //   // Amazon chart items
// //   const barsAmazon = useMemo(() => {
// //     const units = cms?.total_quantity ?? 0;
// //     const sales = uk.netSalesGBP ?? 0;
// //     const asp = uk.aspGBP ?? 0;
// //     const profit = uk.profitGBP ?? 0;
// //     const pcent = Number.isFinite(uk.profitPctGBP) ? (uk.profitPctGBP as number) : 0;

// //     return [
// //       { label: "Units", raw: Number(units) || 0, display: fmtNum(units) },
// //       { label: "Sales", raw: Number(sales) || 0, display: fmtGBP(sales) },
// //       { label: "ASP", raw: Number(asp) || 0, display: fmtGBP(asp) },
// //       { label: "Profit", raw: Number(profit) || 0, display: fmtGBP(profit) },
// //       { label: "Profit %", raw: Number(pcent) || 0, display: fmtPct(pcent) },
// //     ];
// //   }, [uk, cms]);

// //   // Shopify (current)
// //   const shopifyDeriv = useMemo(() => {
// //     if (!shopify) return null;
// //     const totalOrders = toNumberSafe(shopify.total_orders);
// //     const netSales = toNumberSafe(shopify.net_sales); // INR
// //     const totalDiscounts = toNumberSafe(shopify.total_discounts);
// //     const totalTax = toNumberSafe(shopify.total_tax);
// //     const gross = toNumberSafe(shopify.total_price);
// //     const aov = totalOrders > 0 ? gross / totalOrders : 0;
// //     return { totalOrders, netSales, totalDiscounts, totalTax, gross, aov };
// //   }, [shopify]);

// //   // Shopify (previous month)
// //   const shopifyPrevDeriv = useMemo(() => {
// //     const row = shopifyPrevRows?.[0];
// //     if (!row) return null;
// //     const netSales = toNumberSafe(row.net_sales); // INR total prev month
// //     return { netSales };
// //   }, [shopifyPrevRows]);

// //   // Combined MTD (USD)
// //   const amazonUK_USD = useMemo(() => {
// //     const amazonUK_GBP = toNumberSafe(uk.netSalesGBP);
// //     return amazonUK_GBP * GBP_TO_USD;
// //   }, [uk.netSalesGBP]);

// //   const combinedUSD = useMemo(() => {
// //     const aUK = amazonUK_USD; // GBP -> USD
// //     const shopifyUSD = toNumberSafe(shopifyDeriv?.netSales) * INR_TO_USD; // INR -> USD
// //     return aUK + shopifyUSD;
// //   }, [amazonUK_USD, shopifyDeriv?.netSales]);

// //   /* ====== TARGET = LAST MONTH'S TOTAL (USD) ====== */

// //   // Compute previous month TOTALS (USD) we have:
// //   const prevShopifyTotalUSD = useMemo(() => {
// //     const prevINRTotal = toNumberSafe(shopifyPrevDeriv?.netSales);
// //     return prevINRTotal * INR_TO_USD;
// //   }, [shopifyPrevDeriv]);

// //   // If you later add Amazon-UK previous month total GBP, convert like:
// //   const prevAmazonUKTotalUSD = 0; // placeholder until backend provides prev month for Amazon UK

// //   // Helper: build target (last month total) with optional manual override
// //   const buildTargetFromPrev = (manualUSD: number, computedUSD: number) => {
// //     if (USE_MANUAL_LAST_MONTH && manualUSD > 0) return manualUSD;
// //     return computedUSD; // may be 0 if not available
// //   };

// //   // Global target = last month (Shopify prev + AmazonUK prev)
// //   const globalPrevTotalUSD = prevShopifyTotalUSD + prevAmazonUKTotalUSD;

// //   // Pro-rate last-month MTD (yellow arc) from the chosen target
// //   const prorateToDate = (lastMonthTotalUSD: number) => {
// //     const { todayDay, daysInPrevMonth } = getISTDayInfo();
// //     return daysInPrevMonth > 0 ? (lastMonthTotalUSD * todayDay) / daysInPrevMonth : 0;
// //   };

// //   // Regions for card (Target = last month's total; LastMonthMTD = prorated)
// //   const regions = useMemo(() => {
// //     // Global
// //     const globalTarget = buildTargetFromPrev(MANUAL_LAST_MONTH_USD_GLOBAL, globalPrevTotalUSD);
// //     const global = {
// //       mtdUSD: combinedUSD,
// //       lastMonthToDateUSD: prorateToDate(globalTarget),
// //       targetUSD: globalTarget,
// //     };

// //     // UK (only Amazon UK; computed prev=0 for now)
// //     const ukComputedPrev = prevAmazonUKTotalUSD; // 0 until wired
// //     const ukTarget = buildTargetFromPrev(MANUAL_LAST_MONTH_USD_UK, ukComputedPrev);
// //     const ukRegion = {
// //       mtdUSD: amazonUK_USD,
// //       lastMonthToDateUSD: prorateToDate(ukTarget),
// //       targetUSD: ukTarget,
// //     };

// //     // US (placeholder)
// //     const usTarget = buildTargetFromPrev(MANUAL_LAST_MONTH_USD_US, 0);
// //     const usRegion = { mtdUSD: 0, lastMonthToDateUSD: prorateToDate(usTarget), targetUSD: usTarget };

// //     // CA (placeholder)
// //     const caTarget = buildTargetFromPrev(MANUAL_LAST_MONTH_USD_CA, 0);
// //     const caRegion = { mtdUSD: 0, lastMonthToDateUSD: prorateToDate(caTarget), targetUSD: caTarget };

// //     return {
// //       Global: global,
// //       UK: ukRegion,
// //       US: usRegion,
// //       CA: caRegion,
// //     } as Record<RegionKey, { mtdUSD: number; lastMonthToDateUSD: number; targetUSD: number }>;
// //   }, [
// //     combinedUSD,
// //     amazonUK_USD,
// //     globalPrevTotalUSD,
// //   ]);

// //   const anyLoading = loading || shopifyLoading;

// //   return (
// //     <div className="mx-auto max-w-7xl px-4 py-6">
// //       {/* SALES TARGET CARD (top) */}
// //       <SalesTargetCard regions={regions} defaultRegion="Global" />

// //       <div className="mt-6 mb-4 flex items-center justify-between">
// //         <h1 className="text-xl font-semibold tracking-tight">Amazon &amp; Shopify Overview</h1>
// //         <button
// //           onClick={refreshAll}
// //           disabled={anyLoading}
// //           className={`rounded-md border px-3 py-1.5 text-sm shadow-sm active:scale-[.99] ${
// //             anyLoading ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400" : "border-gray-300 bg-white hover:bg-gray-50"
// //           }`}
// //           title="Refresh Amazon & Shopify"
// //         >
// //           {anyLoading ? "Refreshing…" : "Refresh"}
// //         </button>
// //       </div>

// //       {/* ======================= GRID: 12 cols ======================= */}
// //       <div className="grid grid-cols-12 gap-6">
// //         {/* LEFT 8: Amazon cards then Shopify cards */}
// //         <div className="col-span-12 lg:col-span-8 space-y-6">
// //           {/* Notices */}
// //           {unauthorized && (
// //             <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
// //               <div className="text-sm">You’re not signed in or your session expired. Please authenticate to load Amazon orders.</div>
// //               <a
// //                 href={`${baseURL || ""}/auth/login`}
// //                 className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-amber-100"
// //               >
// //                 Sign in
// //               </a>
// //             </div>
// //           )}
// //           {error && (
// //             <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
// //               <span>⚠️</span>
// //               <span className="text-sm">{error}</span>
// //             </div>
// //           )}

// //           {/* AMAZON — 5 boxes */}
// //           <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //             <div className="mb-2 text-sm font-medium text-gray-700">Amazon — Details (UK)</div>
// //             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
// //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                 <div className="text-sm text-gray-500">Units</div>
// //                 <div className="mt-1 text-2xl font-semibold">
// //                   <ValueOrSkeleton loading={loading}>{fmtNum(cms?.total_quantity ?? 0)}</ValueOrSkeleton>
// //                 </div>
// //               </div>
// //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                 <div className="text-sm text-gray-500">Total Sales</div>
// //                 <div className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
// //                   <ValueOrSkeleton loading={loading}>{fmtGBP(uk.netSalesGBP)}</ValueOrSkeleton>
// //                 </div>
// //               </div>
// //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                 <div className="text-sm text-gray-500">ASP</div>
// //                 <div className="mt-1 text-2xl font-semibold">
// //                   <ValueOrSkeleton loading={loading}>{fmtGBP(uk.aspGBP)}</ValueOrSkeleton>
// //                 </div>
// //               </div>
// //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                 <div className="text-sm text-gray-500">Profit</div>
// //                 <div className="mt-1 text-2xl font-semibold">
// //                   <ValueOrSkeleton loading={loading}>{fmtGBP(uk.profitGBP)}</ValueOrSkeleton>
// //                 </div>
// //               </div>
// //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                 <div className="text-sm text-gray-500">Profit %</div>
// //                 <div className="mt-1 text-2xl font-semibold">
// //                   <ValueOrSkeleton loading={loading}>{fmtPct(uk.profitPctGBP)}</ValueOrSkeleton>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           {/* SHOPIFY — same 5-box layout as Amazon UK */}
// //           <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //             <div className="mb-2 text-sm font-medium text-gray-700">Shopify — Details (₹ Rupees)</div>

// //             {shopifyError && (
// //               <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
// //                 <span>⚠️</span>
// //                 <span className="text-sm">{shopifyError}</span>
// //               </div>
// //             )}

// //             {shopifyLoading && (
// //               <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
// //                 {[...Array(5)].map((_, i) => (
// //                   <div key={i} className="rounded-2xl border bg-white p-5 shadow-sm">
// //                     <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
// //                     <div className="mt-2 h-7 w-28 animate-pulse rounded bg-gray-200" />
// //                   </div>
// //                 ))}
// //               </div>
// //             )}

// //             {!shopifyLoading && !shopifyError && (
// //               <>
// //                 {shopify ? (
// //                   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
// //                     {/* Units */}
// //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                       <div className="text-sm text-gray-500">Units</div>
// //                       <div className="mt-1 text-2xl font-semibold text-gray-900">
// //                         <ValueOrSkeleton loading={shopifyLoading}>
// //                           {fmtNum(Number(shopify?.total_orders ?? 0))}
// //                         </ValueOrSkeleton>
// //                       </div>
// //                     </div>

// //                     {/* Total Sales (₹ Rupees) */}
// //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                       <div className="text-sm text-gray-500">Total Sales</div>
// //                       <div className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
// //                         <ValueOrSkeleton loading={shopifyLoading}>
// //                           {fmtShopify(toNumberSafe(shopify?.net_sales ?? 0))}
// //                         </ValueOrSkeleton>
// //                       </div>
// //                     </div>

// //                     {/* ASP */}
// //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                       <div className="text-sm text-gray-500">ASP</div>
// //                       <div className="mt-1 text-2xl font-semibold text-gray-900">
// //                         <ValueOrSkeleton loading={shopifyLoading}>
// //                           {(() => {
// //                             const units = toNumberSafe(shopify?.total_orders ?? 0);
// //                             const net = toNumberSafe(shopify?.net_sales ?? 0);
// //                             if (units <= 0) return "—";
// //                             return fmtShopify(net / units);
// //                           })()}
// //                         </ValueOrSkeleton>
// //                       </div>
// //                     </div>

// //                     {/* Profit — placeholder (₹) */}
// //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                       <div className="text-sm text-gray-500">Profit</div>
// //                       <div className="mt-1 text-2xl font-semibold text-gray-900">—</div>
// //                     </div>

// //                     {/* Profit % */}
// //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                       <div className="text-sm text-gray-500">Profit %</div>
// //                       <div className="mt-1 text-2xl font-semibold text-gray-900">—</div>
// //                     </div>
// //                   </div>
// //                 ) : (
// //                   <div className="mt-2 text-sm text-gray-500">No Shopify data for the current month.</div>
// //                 )}
// //               </>
// //             )}
// //           </div>
// //         </div>

// //         {/* RIGHT 4: Placeholder */}
// //         <aside className="col-span-12 lg:col-span-4">
// //           <div className="lg:sticky lg:top-6"></div>
// //         </aside>
// //       </div>

// //       {/* ======================= FULL-WIDTH GRAPH BELOW EVERYTHING ======================= */}
// //       <div className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
// //         <div className="mb-3 text-sm text-gray-500">Amazon — Units, Sales, ASP, Profit, Profit %</div>
// //         <SimpleBarChart
// //           items={[
// //             { label: "Units", raw: Number(cms?.total_quantity ?? 0), display: fmtNum(cms?.total_quantity ?? 0) },
// //             { label: "Sales", raw: Number(uk.netSalesGBP ?? 0), display: fmtGBP(uk.netSalesGBP ?? 0) },
// //             { label: "ASP", raw: Number(uk.aspGBP ?? 0), display: fmtGBP(uk.aspGBP ?? 0) },
// //             { label: "Profit", raw: Number(uk.profitGBP ?? 0), display: fmtGBP(uk.profitGBP ?? 0) },
// //             {
// //               label: "Profit %",
// //               raw: Number(Number(uk.profitPctGBP ?? 0)),
// //               display: fmtPct(Number(uk.profitPctGBP ?? 0)),
// //             },
// //           ]}
// //         />
// //       </div>
// //     </div>
// //   );
// // }

































// // "use client";

// // import Loader from "@/components/loader/Loader";
// // import React, { useEffect, useState, useMemo, useCallback } from "react";

// // /* ===================== ENV & ENDPOINTS ===================== */
// // const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";
// // const SHOPIFY_CCY = process.env.NEXT_PUBLIC_SHOPIFY_CURRENCY || "GBP";
// // const SHOPIFY_TO_GBP = Number(process.env.NEXT_PUBLIC_SHOPIFY_TO_GBP || "1"); // kept if used elsewhere
// // // const API_URL = `${baseURL}/amazon_api/orders?include=finances`;
// // const API_URL = `${baseURL}/amazon_api/orders`;
// // const SHOPIFY_ENDPOINT = `${baseURL}/shopify/get_monthly_data`;

// // /** 💵 FX rates */
// // const GBP_TO_USD = Number(process.env.NEXT_PUBLIC_GBP_TO_USD || "1.31");
// // const INR_TO_USD = Number(process.env.NEXT_PUBLIC_INR_TO_USD || "0.01128");
// // // Future: const CAD_TO_USD = Number(process.env.NEXT_PUBLIC_CAD_TO_USD || "0.73");

// // /** 🔧 Manual override (while API for last month is pending) */
// // const USE_MANUAL_LAST_MONTH =
// //   (process.env.NEXT_PUBLIC_USE_MANUAL_LAST_MONTH || "false").toLowerCase() === "true";

// // /** Put last month's TOTAL SALES in USD (not to-date) */
// // const MANUAL_LAST_MONTH_USD_GLOBAL = Number(
// //   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_GLOBAL || "0"
// // );
// // /** Optional per-region overrides */
// // const MANUAL_LAST_MONTH_USD_UK = Number(process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_UK || "0");
// // const MANUAL_LAST_MONTH_USD_US = Number(process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_US || "0");
// // const MANUAL_LAST_MONTH_USD_CA = Number(process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_CA || "0");

// // /* ===================== DATE HELPERS ===================== */
// // function getISTYearMonth() {
// //   const optsMonth: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", month: "long" };
// //   const optsYear: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", year: "numeric" };
// //   const now = new Date();
// //   const monthName = now.toLocaleString("en-US", optsMonth);
// //   const yearStr = now.toLocaleString("en-US", optsYear);
// //   return { monthName, year: Number(yearStr) };
// // }

// // function buildShopifyURL({ year, monthName }: { year: number; monthName: string }) {
// //   const qs = new URLSearchParams();
// //   qs.set("year", String(year));
// //   qs.append("months[]", monthName);
// //   return `${SHOPIFY_ENDPOINT}?${qs.toString()}`;
// // }

// // function getPrevISTYearMonth() {
// //   const tz = "Asia/Kolkata";
// //   const now = new Date();
// //   const istNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
// //   const year = istNow.getMonth() === 0 ? istNow.getFullYear() - 1 : istNow.getFullYear();
// //   const monthIdx = istNow.getMonth() === 0 ? 11 : istNow.getMonth() - 1;
// //   const monthName = new Date(year, monthIdx, 1).toLocaleString("en-US", { month: "long", timeZone: tz });
// //   return { monthName, year };
// // }

// // function getPrevMonthShortLabel() {
// //   const { monthName, year } = getPrevISTYearMonth();
// //   const shortMon = new Date(`${monthName} 1, ${year}`).toLocaleString("en-US", {
// //     month: "short",
// //     timeZone: "Asia/Kolkata",
// //   });
// //   return `${shortMon}'${String(year).slice(-2)}`; // e.g., Oct'25
// // }

// // function getISTDayInfo() {
// //   const tz = "Asia/Kolkata";
// //   const now = new Date();
// //   const istNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
// //   const todayDay = istNow.getDate();
// //   const { monthName, year } = getPrevISTYearMonth();
// //   const prevMonthIdx = new Date(`${monthName} 1, ${year}`).getMonth();
// //   const daysInPrevMonth = new Date(year, prevMonthIdx + 1, 0).getDate();
// //   const daysInThisMonth = new Date(istNow.getFullYear(), istNow.getMonth() + 1, 0).getDate();
// //   return { todayDay, daysInPrevMonth, daysInThisMonth };
// // }

// // /* ===================== UI HELPERS ===================== */
// // const ValueOrSkeleton = ({
// //   loading,
// //   children,
// //   compact = false,
// // }: {
// //   loading: boolean;
// //   children: React.ReactNode;
// //   compact?: boolean;
// // }) => {
// //   if (loading) {
// //     return (
// //       <div className="inline-flex items-center justify-center">
// //         <Loader
// //           size={compact ? 28 : 36}
// //           transparent
// //           roundedClass="rounded-full"
// //           backgroundClass="bg-transparent"
// //           className="text-gray-400"
// //           forceFallback
// //         />
// //       </div>
// //     );
// //   }
// //   return <>{children}</>;
// // };

// // /* ---------- Formatters & Safe Number ---------- */
// // const fmtCurrency = (val: any, ccy = "GBP") => {
// //   if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
// //   return new Intl.NumberFormat("en-GB", {
// //     style: "currency",
// //     currency: ccy,
// //     minimumFractionDigits: 2,
// //     maximumFractionDigits: 2,
// //   }).format(Number(val));
// // };

// // const fmtGBP = (val: any) => fmtCurrency(val, "GBP");

// // const fmtUSD = (val: any) => {
// //   if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
// //   return new Intl.NumberFormat("en-US", {
// //     style: "currency",
// //     currency: "USD",
// //     minimumFractionDigits: 2,
// //     maximumFractionDigits: 2,
// //   }).format(Number(val));
// // };

// // const fmtShopify = (val: any) => {
// //   if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
// //   return new Intl.NumberFormat("en-IN", {
// //     style: "currency",
// //     currency: "INR",
// //     minimumFractionDigits: 2,
// //     maximumFractionDigits: 2,
// //   }).format(Number(val));
// // };

// // const fmtNum = (val: any) =>
// //   val === null || val === undefined || val === "" || isNaN(Number(val))
// //     ? "—"
// //     : new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val));

// // const fmtPct = (val: any) =>
// //   val === null || val === undefined || isNaN(Number(val)) ? "—" : `${Number(val).toFixed(2)}%`;

// // const toNumberSafe = (v: any) => {
// //   if (v === null || v === undefined) return 0;
// //   if (typeof v === "number") return v;
// //   const s = String(v).replace(/[, ]+/g, "");
// //   const n = Number(s);
// //   return isNaN(n) ? 0 : n;
// // };

// // /* ===================== SALES TARGET CARD ===================== */
// // type RegionKey = "Global" | "UK" | "US" | "CA";

// // function SalesTargetCard({
// //   regions,
// //   defaultRegion = "Global",
// // }: {
// //   regions: Record<
// //     RegionKey,
// //     {
// //       mtdUSD: number;
// //       /** Last month MTD (pro-rated to today's day) */
// //       lastMonthToDateUSD: number;
// //       /** Last month total (full month) — NEW dark bar */
// //       lastMonthTotalUSD: number;
// //       /** This month target (can be anything; often lastMonthTotalUSD) */
// //       targetUSD: number;
// //     }
// //   >;
// //   defaultRegion?: RegionKey;
// // }) {
// //   const [tab, setTab] = useState<RegionKey>(defaultRegion);

// //   const data = regions[tab] || regions.Global;
// //   const { mtdUSD, lastMonthToDateUSD, lastMonthTotalUSD, targetUSD } = data;

// //   const pct = targetUSD > 0 ? Math.min(mtdUSD / targetUSD, 1) : 0;
// //   const pctLastMTD = targetUSD > 0 ? Math.min(lastMonthToDateUSD / targetUSD, 1) : 0;
// //   const pctLastFull = targetUSD > 0 ? Math.min(lastMonthTotalUSD / targetUSD, 1) : 0;

// //   const deltaPct = (pct - pctLastMTD) * 100;

// //   const { todayDay } = getISTDayInfo();
// //   const todayApprox = todayDay > 0 ? mtdUSD / todayDay : 0;

// //   const prevLabel = getPrevMonthShortLabel(); // e.g., Oct'25

// //   const size = 280;
// //   const stroke = 16;
// //   const cx = size / 2;
// //   const r = size / 2 - stroke;

// //   const toXY = (angDeg: number) => {
// //     const rad = (Math.PI / 180) * (180 - angDeg);
// //     return { x: cx + r * Math.cos(rad), y: size / 2 + r * Math.sin(rad) };
// //   };
// //   const arcPath = (fromDeg: number, toDeg: number, radius = r) => {
// //     const start = {
// //       x: cx + radius * Math.cos((Math.PI / 180) * (180 - fromDeg)),
// //       y: size / 2 + radius * Math.sin((Math.PI / 180) * (180 - fromDeg)),
// //     };
// //     const end = {
// //       x: cx + radius * Math.cos((Math.PI / 180) * (180 - toDeg)),
// //       y: size / 2 + radius * Math.sin((Math.PI / 180) * (180 - toDeg)),
// //     };
// //     const largeArc = toDeg - fromDeg > 180 ? 1 : 0;
// //     return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
// //   };

// //   const fullFrom = 0;
// //   const fullTo = 180;
// //   const toDeg_MTD = 180 * pct;
// //   const toDeg_LastMTD = 180 * pctLastMTD;
// //   const toDeg_LastFull = 180 * pctLastFull;

// //   const tick = toXY(180);
// //   const badgeIsUp = deltaPct >= 0;
// //   const badgeStr = (badgeIsUp ? "▲ " : "▼ ") + `${Math.abs(deltaPct).toFixed(2)}%`;

// //   return (
// //     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //       {/* Header with tabs */}
// //       <div className="mb-3 flex items-center justify-between">
// //         <div className="text-xl font-semibold text-gray-800">Sales Target</div>

// //         <div className="inline-flex rounded-full border p-1 bg-gray-50">
// //           {(["Global", "UK", "US", "CA"] as RegionKey[]).map((key) => (
// //             <button
// //               key={key}
// //               onClick={() => setTab(key)}
// //               className={`px-3 py-1 text-sm rounded-full transition ${
// //                 tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
// //               }`}
// //             >
// //               {key}
// //             </button>
// //           ))}
// //         </div>
// //       </div>

// //       {/* Legend */}
// //       <div className="mb-2 flex items-center gap-5 text-xs">
// //         <div className="flex items-center gap-2">
// //           <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#16a34a" }} />
// //           <span className="text-gray-600">MTD Sales</span>
// //         </div>
// //         <div className="flex items-center gap-2">
// //           <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#9ca3af" }} />
// //           <span className="text-gray-600">This Month Target</span>
// //         </div>
// //         <div className="flex items-center gap-2">
// //           <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#f59e0b" }} />
// //           <span className="text-gray-600">{prevLabel} MTD</span>
// //         </div>
// //         <div className="flex items-center gap-2">
// //           <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#374151" }} />
// //           <span className="text-gray-600">{prevLabel} Total</span>
// //         </div>
// //       </div>

// //       {/* Gauge */}
// //       <div className="mt-2 flex items-center justify-center">
// //         <svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2}`}>
// //           {/* Background & this-month target as faint arc */}
// //           <path d={arcPath(fullFrom, fullTo)} fill="none" stroke="#e5e7eb" strokeWidth={stroke} strokeLinecap="round" />
// //           {/* DARK GREY: Last Month (full) — thinner bar */}
// //           <path
// //             d={arcPath(fullFrom, toDeg_LastFull)}
// //             fill="none"
// //             stroke="#374151"
// //             strokeWidth={8}
// //             strokeLinecap="round"
// //           />
// //           {/* YELLOW: Last Month MTD */}
// //           <path
// //             d={arcPath(fullFrom, toDeg_LastMTD)}
// //             fill="none"
// //             stroke="#f59e0b"
// //             strokeWidth={stroke}
// //             strokeLinecap="round"
// //           />
// //           {/* GREEN: This Month MTD */}
// //           <path
// //             d={arcPath(fullFrom, toDeg_MTD)}
// //             fill="none"
// //             stroke="#16a34a"
// //             strokeWidth={stroke}
// //             strokeLinecap="round"
// //           />
// //           {/* Right tick (180°) */}
// //           <circle cx={tick.x} cy={tick.y} r="6" fill="#9ca3af" />
// //         </svg>
// //       </div>

// //       {/* Center metrics */}
// //       <div className="mt-2 text-center">
// //         <div className="text-3xl font-bold">{(pct * 100).toFixed(1)}%</div>
// //         <div
// //           className={`mx-auto mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
// //             badgeIsUp ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"
// //           }`}
// //         >
// //           {badgeStr}
// //         </div>
// //       </div>

// //       {/* Bottom KPIs */}
// //       <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
// //         <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-3">
// //           <div className="text-gray-500">Today</div>
// //           <div className="mt-0.5 font-semibold">{fmtUSD(todayApprox)}</div>
// //         </div>
// //         <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-3">
// //           <div className="text-gray-500">MTD Sales</div>
// //           <div className="mt-0.5 font-semibold">{fmtUSD(mtdUSD)}</div>
// //         </div>
// //         <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-3">
// //           <div className="text-gray-500">Target</div>
// //           <div className="mt-0.5 font-semibold">{fmtUSD(targetUSD)}</div>
// //         </div>
// //         <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-3">
// //           <div className="text-gray-500">{prevLabel}</div>
// //           <div className="mt-0.5 font-semibold">{fmtUSD(lastMonthTotalUSD)}</div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // /* ===================== SIMPLE BAR CHART (existing) ===================== */
// // function SimpleBarChart({
// //   items,
// //   height = 300,
// //   padding = { top: 28, right: 24, bottom: 56, left: 24 },
// //   colors = ["#2563eb", "#16a34a", "#f59e0b", "#ec4899", "#8b5cf6"],
// // }: {
// //   items: Array<{ label: string; raw: number; display: string }>;
// //   height?: number;
// //   padding?: { top: number; right: number; bottom: number; left: number };
// //   colors?: string[];
// // }) {
// //   const [animateIn, setAnimateIn] = useState(false);
// //   const [hoverIdx, setHoverIdx] = useState<number | null>(null);

// //   useEffect(() => {
// //     const t = setTimeout(() => setAnimateIn(true), 50);
// //     return () => clearTimeout(t);
// //   }, []);

// //   const width = 760;
// //   const innerW = width - padding.left - padding.right;
// //   const innerH = height - padding.top - padding.bottom;
// //   const values = items.map((d) => (Number.isFinite(d.raw) ? Math.abs(Number(d.raw)) : 0));
// //   const max = Math.max(1, ...values);
// //   const baseBarW = Math.max(12, (innerW / Math.max(1, items.length)) * 0.4);

// //   const Tooltip = ({
// //     x,
// //     y,
// //     label,
// //     display,
// //     color,
// //   }: {
// //     x: number;
// //     y: number;
// //     label: string;
// //     display: string;
// //     color: string;
// //   }) => {
// //     const textY1 = y - 30;
// //     const text = `${label}: ${display}`;
// //     return (
// //       <g>
// //         <rect x={x - 70} y={textY1 - 24} width={140} height={24} rx={6} fill="#111827" opacity="0.9" />
// //         <text x={x} y={textY1 - 8} textAnchor="middle" fontSize="11" fill="#ffffff" style={{ pointerEvents: "none" }}>
// //           {text}
// //         </text>
// //         <polygon points={`${x - 6},${textY1} ${x + 6},${textY1} ${x},${textY1 + 6}`} fill="#111827" opacity="0.9" />
// //         <circle cx={x} cy={y} r="6.5" fill="none" stroke={color} strokeWidth={2} />
// //       </g>
// //     );
// //   };

// //   return (
// //     <div className="w-full overflow-x-auto ">
// //       <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[760px] select-none">
// //         <defs>
// //           <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
// //             <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.15" />
// //           </filter>
// //         </defs>

// //         <line
// //           x1={padding.left}
// //           y1={height - padding.bottom}
// //           x2={width - padding.right}
// //           y2={height - padding.bottom}
// //           stroke="#e5e7eb"
// //         />

// //         {items.map((d, i) => {
// //           const v = values[i];
// //           const hFull = (v / max) * innerH;
// //           const barH = animateIn ? hFull : 0;
// //           const band = innerW / Math.max(1, items.length);
// //           const xCenter = padding.left + band * i + band / 2;
// //           const barW = hoverIdx === i ? baseBarW + 6 : baseBarW;
// //           const x = xCenter - barW / 2;
// //           const y = padding.top + (innerH - barH);
// //           const color = colors[i % colors.length];

// //           return (
// //             <g
// //               key={d.label}
// //               onMouseEnter={() => setHoverIdx(i)}
// //               onMouseLeave={() => setHoverIdx(null)}
// //               style={{ cursor: "pointer" }}
// //             >
// //               <rect
// //                 x={x}
// //                 y={y}
// //                 width={barW}
// //                 height={Math.max(0, barH)}
// //                 rx={8}
// //                 fill={color}
// //                 filter="url(#barShadow)"
// //                 opacity={hoverIdx === i ? 0.95 : 0.85}
// //               />
// //               <text x={xCenter} y={y - 10} textAnchor="middle" fontSize={12} fontWeight={600} fill="#111827">
// //                 {d.display}
// //               </text>
// //               <text x={xCenter} y={height - padding.bottom + 20} textAnchor="middle" fontSize={12} fill="#6b7280">
// //                 {d.label}
// //               </text>
// //               {hoverIdx === i && <Tooltip x={xCenter} y={y} label={d.label} display={d.display} color={color} />}
// //             </g>
// //           );
// //         })}
// //       </svg>
// //     </div>
// //   );
// // }

// // /* ===================== MAIN PAGE ===================== */
// // export default function DashboardPage() {
// //   // Amazon
// //   const [loading, setLoading] = useState(false);
// //   const [unauthorized, setUnauthorized] = useState(false);
// //   const [error, setError] = useState<string | null>(null);
// //   const [data, setData] = useState<any>(null);

// //   // Shopify (current month)
// //   const [shopifyLoading, setShopifyLoading] = useState(false);
// //   const [shopifyError, setShopifyError] = useState<string | null>(null);
// //   const [shopifyRows, setShopifyRows] = useState<any[]>([]);
// //   const shopify = shopifyRows?.[0] || null;

// //   // Shopify (previous month)
// //   const [shopifyPrevRows, setShopifyPrevRows] = useState<any[]>([]);

// //   const fetchAmazon = useCallback(async () => {
// //     setLoading(true);
// //     setUnauthorized(false);
// //     setError(null);
// //     try {
// //       const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
// //       if (!token) {
// //         setUnauthorized(true);
// //         throw new Error("No token found. Please sign in.");
// //       }
// //       const res = await fetch(API_URL, {
// //         method: "GET",
// //         headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
// //         credentials: "omit",
// //       });
// //       if (res.status === 401) {
// //         setUnauthorized(true);
// //         throw new Error("Unauthorized — token missing/invalid/expired.");
// //       }
// //       if (!res.ok) throw new Error(`Request failed: ${res.status}`);
// //       const json = await res.json();
// //       setData(json);
// //     } catch (e: any) {
// //       setError(e?.message || "Failed to load data");
// //       setData(null);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   const fetchShopify = useCallback(async () => {
// //     setShopifyLoading(true);
// //     setShopifyError(null);
// //     try {
// //       const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
// //       if (!token) throw new Error("No token found. Please sign in.");
// //       const { monthName, year } = getISTYearMonth();
// //       const url = buildShopifyURL({ year, monthName });
// //       const res = await fetch(url, {
// //         method: "GET",
// //         headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
// //         credentials: "omit",
// //       });
// //       if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
// //       if (!res.ok) throw new Error(`Shopify request failed: ${res.status}`);
// //       const json = await res.json();
// //       const rows = Array.isArray(json?.data) ? json.data : [];
// //       setShopifyRows(rows);
// //     } catch (e: any) {
// //       setShopifyError(e?.message || "Failed to load Shopify data");
// //       setShopifyRows([]);
// //     } finally {
// //       setShopifyLoading(false);
// //     }
// //   }, []);

// //   const fetchShopifyPrev = useCallback(async () => {
// //     try {
// //       const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
// //       if (!token) throw new Error("No token found. Please sign in.");
// //       const { year, monthName } = getPrevISTYearMonth();
// //       const url = buildShopifyURL({ year, monthName });
// //       const res = await fetch(url, {
// //         method: "GET",
// //         headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
// //         credentials: "omit",
// //       });
// //       if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
// //       if (!res.ok) throw new Error(`Shopify (prev) request failed: ${res.status}`);
// //       const json = await res.json();
// //       const rows = Array.isArray(json?.data) ? json.data : [];
// //       setShopifyPrevRows(rows);
// //     } catch (e: any) {
// //       console.warn("Shopify prev-month fetch failed:", e?.message);
// //     }
// //   }, []);

// //   const refreshAll = useCallback(async () => {
// //     await Promise.all([fetchAmazon(), fetchShopify(), fetchShopifyPrev()]);
// //   }, [fetchAmazon, fetchShopify, fetchShopifyPrev]);

// //   useEffect(() => {
// //     refreshAll();
// //   }, [refreshAll]);

// //   // ---------- Amazon aliases ----------
// //   const cms = data?.current_month_summary || null;
// //   const cmp = data?.current_month_profit || null;

// //   // ---- derive UK (GBP) safely ----
// //   const uk = useMemo(() => {
// //     const netSalesGBP = cms?.net_sales?.GBP != null ? toNumberSafe(cms.net_sales.GBP) : null;
// //     const aspGBP = cms?.asp?.GBP != null ? toNumberSafe(cms.asp.GBP) : null;

// //     let profitGBP: number | null = null;
// //     if (cmp?.profit && typeof cmp.profit === "object" && cmp.profit.GBP !== undefined) {
// //       profitGBP = toNumberSafe(cmp.profit.GBP);
// //     } else if ((typeof cmp?.profit === "number" || typeof cmp?.profit === "string") && netSalesGBP !== null) {
// //       profitGBP = toNumberSafe(cmp.profit);
// //     }

// //     let unitsGBP: number | null = null;
// //     if (cmp?.breakdown?.GBP?.quantity !== undefined) {
// //       unitsGBP = toNumberSafe(cmp.breakdown.GBP.quantity);
// //     }

// //     let profitPctGBP: number | null = null;
// //     if (profitGBP !== null && netSalesGBP && !isNaN(netSalesGBP) && netSalesGBP !== 0) {
// //       profitPctGBP = (profitGBP / netSalesGBP) * 100;
// //     }

// //     return { unitsGBP, netSalesGBP, aspGBP, profitGBP, profitPctGBP };
// //   }, [cms, cmp]);

// //   // Amazon chart items
// //   const barsAmazon = useMemo(() => {
// //     const units = cms?.total_quantity ?? 0;
// //     const sales = uk.netSalesGBP ?? 0;
// //     const asp = uk.aspGBP ?? 0;
// //     const profit = uk.profitGBP ?? 0;
// //     const pcent = Number.isFinite(uk.profitPctGBP) ? (uk.profitPctGBP as number) : 0;

// //     return [
// //       { label: "Units", raw: Number(units) || 0, display: fmtNum(units) },
// //       { label: "Sales", raw: Number(sales) || 0, display: fmtGBP(sales) },
// //       { label: "ASP", raw: Number(asp) || 0, display: fmtGBP(asp) },
// //       { label: "Profit", raw: Number(profit) || 0, display: fmtGBP(profit) },
// //       { label: "Profit %", raw: Number(pcent) || 0, display: fmtPct(pcent) },
// //     ];
// //   }, [uk, cms]);

// //   // Shopify (current)
// //   const shopifyDeriv = useMemo(() => {
// //     if (!shopify) return null;
// //     const totalOrders = toNumberSafe(shopify.total_orders);
// //     const netSales = toNumberSafe(shopify.net_sales); // INR
// //     const totalDiscounts = toNumberSafe(shopify.total_discounts);
// //     const totalTax = toNumberSafe(shopify.total_tax);
// //     const gross = toNumberSafe(shopify.total_price);
// //     const aov = totalOrders > 0 ? gross / totalOrders : 0;
// //     return { totalOrders, netSales, totalDiscounts, totalTax, gross, aov };
// //   }, [shopify]);

// //   // Shopify (previous month)
// //   const shopifyPrevDeriv = useMemo(() => {
// //     const row = shopifyPrevRows?.[0];
// //     if (!row) return null;
// //     const netSales = toNumberSafe(row.net_sales); // INR total prev month
// //     return { netSales };
// //   }, [shopifyPrevRows]);

// //   // Combined MTD (USD)
// //   const amazonUK_USD = useMemo(() => {
// //     const amazonUK_GBP = toNumberSafe(uk.netSalesGBP);
// //     return amazonUK_GBP * GBP_TO_USD;
// //   }, [uk.netSalesGBP]);

// //   const combinedUSD = useMemo(() => {
// //     const aUK = amazonUK_USD; // GBP -> USD
// //     const shopifyUSD = toNumberSafe(shopifyDeriv?.netSales) * INR_TO_USD; // INR -> USD
// //     return aUK + shopifyUSD;
// //   }, [amazonUK_USD, shopifyDeriv?.netSales]);

// //   /* ====== PREVIOUS MONTH TOTALS (USD) & DERIVATIONS ====== */

// //   // Shopify previous total → USD
// //   const prevShopifyTotalUSD = useMemo(() => {
// //     const prevINRTotal = toNumberSafe(shopifyPrevDeriv?.netSales);
// //     return prevINRTotal * INR_TO_USD;
// //   }, [shopifyPrevDeriv]);

// //   // Amazon UK previous total (placeholder until backend provides it)
// //   const prevAmazonUKTotalUSD = 0;

// //   // Helper: build chosen "last month total" with optional manual override
// //   const chooseLastMonthTotal = (manualUSD: number, computedUSD: number) =>
// //     USE_MANUAL_LAST_MONTH && manualUSD > 0 ? manualUSD : computedUSD;

// //   // Global previous total (computed from what we have)
// //   const globalPrevTotalUSD = prevShopifyTotalUSD + prevAmazonUKTotalUSD;

// //   // Pro-rate last-month MTD (yellow arc) from last-month TOTAL
// //   const prorateToDate = (lastMonthTotalUSD: number) => {
// //     const { todayDay, daysInPrevMonth } = getISTDayInfo();
// //     return daysInPrevMonth > 0 ? (lastMonthTotalUSD * todayDay) / daysInPrevMonth : 0;
// //   };

// //   // Regions for card
// //   const regions = useMemo(() => {
// //     // GLOBAL
// //     const globalLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_GLOBAL, globalPrevTotalUSD);
// //     const global = {
// //       mtdUSD: combinedUSD,
// //       lastMonthToDateUSD: prorateToDate(globalLastMonthTotal),
// //       lastMonthTotalUSD: globalLastMonthTotal, // NEW: dark bar
// //       // If you want "target = last month's sales", set targetUSD to globalLastMonthTotal:
// //       targetUSD: globalLastMonthTotal,
// //     };

// //     // UK (Amazon UK only for now)
// //     const ukLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_UK, prevAmazonUKTotalUSD);
// //     const ukRegion = {
// //       mtdUSD: amazonUK_USD,
// //       lastMonthToDateUSD: prorateToDate(ukLastMonthTotal),
// //       lastMonthTotalUSD: ukLastMonthTotal,
// //       targetUSD: ukLastMonthTotal,
// //     };

// //     // US (placeholder)
// //     const usLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_US, 0);
// //     const usRegion = {
// //       mtdUSD: 0,
// //       lastMonthToDateUSD: prorateToDate(usLastMonthTotal),
// //       lastMonthTotalUSD: usLastMonthTotal,
// //       targetUSD: usLastMonthTotal,
// //     };

// //     // CA (placeholder)
// //     const caLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_CA, 0);
// //     const caRegion = {
// //       mtdUSD: 0,
// //       lastMonthToDateUSD: prorateToDate(caLastMonthTotal),
// //       lastMonthTotalUSD: caLastMonthTotal,
// //       targetUSD: caLastMonthTotal,
// //     };

// //     return {
// //       Global: global,
// //       UK: ukRegion,
// //       US: usRegion,
// //       CA: caRegion,
// //     } as Record<
// //       RegionKey,
// //       { mtdUSD: number; lastMonthToDateUSD: number; lastMonthTotalUSD: number; targetUSD: number }
// //     >;
// //   }, [combinedUSD, amazonUK_USD, globalPrevTotalUSD]);

// //   const anyLoading = loading || shopifyLoading;

// //   return (
// //     <div className="mx-auto max-w-7xl px-4 py-6">
// //       {/* SALES TARGET CARD (top) */}
// //       <SalesTargetCard regions={regions} defaultRegion="Global" />

// //       <div className="mt-6 mb-4 flex items-center justify-between">
// //         <h1 className="text-xl font-semibold tracking-tight">Amazon &amp; Shopify Overview</h1>
// //         <button
// //           onClick={refreshAll}
// //           disabled={anyLoading}
// //           className={`rounded-md border px-3 py-1.5 text-sm shadow-sm active:scale-[.99] ${
// //             anyLoading ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400" : "border-gray-300 bg-white hover:bg-gray-50"
// //           }`}
// //           title="Refresh Amazon & Shopify"
// //         >
// //           {anyLoading ? "Refreshing…" : "Refresh"}
// //         </button>
// //       </div>

// //       {/* ======================= GRID: 12 cols ======================= */}
// //       <div className="grid grid-cols-12 gap-6">
// //         {/* LEFT 8: Amazon cards then Shopify cards */}
// //         <div className="col-span-12 lg:col-span-8 space-y-6">
// //           {/* Notices */}
// //           {unauthorized && (
// //             <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
// //               <div className="text-sm">You’re not signed in or your session expired. Please authenticate to load Amazon orders.</div>
// //               <a href={`${baseURL || ""}/auth/login`} className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-amber-100">
// //                 Sign in
// //               </a>
// //             </div>
// //           )}
// //           {error && (
// //             <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
// //               <span>⚠️</span>
// //               <span className="text-sm">{error}</span>
// //             </div>
// //           )}

// //           {/* AMAZON — 5 boxes */}
// //           <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //             <div className="mb-2 text-sm font-medium text-gray-700">Amazon — Details (UK)</div>
// //             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
// //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                 <div className="text-sm text-gray-500">Units</div>
// //                 <div className="mt-1 text-2xl font-semibold">
// //                   <ValueOrSkeleton loading={loading}>{fmtNum(cms?.total_quantity ?? 0)}</ValueOrSkeleton>
// //                 </div>
// //               </div>
// //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                 <div className="text-sm text-gray-500">Total Sales</div>
// //                 <div className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
// //                   <ValueOrSkeleton loading={loading}>{fmtGBP(uk.netSalesGBP)}</ValueOrSkeleton>
// //                 </div>
// //               </div>
// //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                 <div className="text-sm text-gray-500">ASP</div>
// //                 <div className="mt-1 text-2xl font-semibold">
// //                   <ValueOrSkeleton loading={loading}>{fmtGBP(uk.aspGBP)}</ValueOrSkeleton>
// //                 </div>
// //               </div>
// //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                 <div className="text-sm text-gray-500">Profit</div>
// //                 <div className="mt-1 text-2xl font-semibold">
// //                   <ValueOrSkeleton loading={loading}>{fmtGBP(uk.profitGBP)}</ValueOrSkeleton>
// //                 </div>
// //               </div>
// //               <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                 <div className="text-sm text-gray-500">Profit %</div>
// //                 <div className="mt-1 text-2xl font-semibold">
// //                   <ValueOrSkeleton loading={loading}>{fmtPct(uk.profitPctGBP)}</ValueOrSkeleton>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           {/* SHOPIFY — 5 boxes (₹) */}
// //           <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //             <div className="mb-2 text-sm font-medium text-gray-700">Shopify — Details (₹ Rupees)</div>

// //             {shopifyError && (
// //               <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
// //                 <span>⚠️</span>
// //                 <span className="text-sm">{shopifyError}</span>
// //               </div>
// //             )}

// //             {shopifyLoading && (
// //               <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
// //                 {[...Array(5)].map((_, i) => (
// //                   <div key={i} className="rounded-2xl border bg-white p-5 shadow-sm">
// //                     <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
// //                     <div className="mt-2 h-7 w-28 animate-pulse rounded bg-gray-200" />
// //                   </div>
// //                 ))}
// //               </div>
// //             )}

// //             {!shopifyLoading && !shopifyError && (
// //               <>
// //                 {shopify ? (
// //                   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
// //                     {/* Units */}
// //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                       <div className="text-sm text-gray-500">Units</div>
// //                       <div className="mt-1 text-2xl font-semibold text-gray-900">
// //                         <ValueOrSkeleton loading={shopifyLoading}>
// //                           {shopify?.total_orders}
// //                         </ValueOrSkeleton>
// //                       </div>
// //                     </div>

// //                     {/* Total Sales (₹) */}
// //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                       <div className="text-sm text-gray-500">Total Sales</div>
// //                       <div className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
// //                         <ValueOrSkeleton loading={shopifyLoading}>
// //                           {fmtShopify(toNumberSafe(shopify?.net_sales ?? 0))}
// //                         </ValueOrSkeleton>
// //                       </div>
// //                     </div>

// //                     {/* ASP */}
// //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                       <div className="text-sm text-gray-500">ASP</div>
// //                       <div className="mt-1 text-2xl font-semibold text-gray-900">
// //                         <ValueOrSkeleton loading={shopifyLoading}>
// //                           {(() => {
// //                             const units = toNumberSafe(shopify?.total_orders ?? 0);
// //                             const net = toNumberSafe(shopify?.net_sales ?? 0);
// //                             if (units <= 0) return "—";
// //                             return fmtShopify(net / units);
// //                           })()}
// //                         </ValueOrSkeleton>
// //                       </div>
// //                     </div>

// //                     {/* Profit — placeholder (₹) */}
// //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                       <div className="text-sm text-gray-500">Profit</div>
// //                       <div className="mt-1 text-2xl font-semibold text-gray-900">—</div>
// //                     </div>

// //                     {/* Profit % */}
// //                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
// //                       <div className="text-sm text-gray-500">Profit %</div>
// //                       <div className="mt-1 text-2xl font-semibold text-gray-900">—</div>
// //                     </div>
// //                   </div>
// //                 ) : (
// //                   <div className="mt-2 text-sm text-gray-500">No Shopify data for the current month.</div>
// //                 )}
// //               </>
// //             )}
// //           </div>
// //         </div>

// //         {/* RIGHT 4: spare column for future widgets */}
// //         <aside className="col-span-12 lg:col-span-4">
// //           <div className="lg:sticky lg:top-6"></div>
// //         </aside>
// //       </div>

// //       {/* ======================= FULL-WIDTH GRAPH BELOW EVERYTHING ======================= */}
// //       <div className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
// //         <div className="mb-3 text-sm text-gray-500">Amazon — Units, Sales, ASP, Profit, Profit %</div>
// //         <SimpleBarChart
// //           items={[
// //             { label: "Units", raw: Number(cms?.total_quantity ?? 0), display: fmtNum(cms?.total_quantity ?? 0) },
// //             { label: "Sales", raw: Number(uk.netSalesGBP ?? 0), display: fmtGBP(uk.netSalesGBP ?? 0) },
// //             { label: "ASP", raw: Number(uk.aspGBP ?? 0), display: fmtGBP(uk.aspGBP ?? 0) },
// //             { label: "Profit", raw: Number(uk.profitGBP ?? 0), display: fmtGBP(uk.profitGBP ?? 0) },
// //             { label: "Profit %", raw: Number(Number(uk.profitPctGBP ?? 0)), display: fmtPct(Number(uk.profitPctGBP ?? 0)) },
// //           ]}
// //         />
// //       </div>
// //     </div>
// //   );
// // }







































// "use client";

// import Loader from "@/components/loader/Loader";
// import React, { useEffect, useState, useMemo, useCallback } from "react";

// /* ===================== ENV & ENDPOINTS ===================== */
// const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";
// const SHOPIFY_CCY = process.env.NEXT_PUBLIC_SHOPIFY_CURRENCY || "GBP";
// const SHOPIFY_TO_GBP = Number(process.env.NEXT_PUBLIC_SHOPIFY_TO_GBP || "1");
// // const API_URL = `${baseURL}/amazon_api/orders?include=finances`;
// const API_URL = `${baseURL}/amazon_api/orders`;
// const SHOPIFY_ENDPOINT = `${baseURL}/shopify/get_monthly_data`;

// /** 💵 FX rates */
// const GBP_TO_USD = Number(process.env.NEXT_PUBLIC_GBP_TO_USD || "1.31");
// const INR_TO_USD = Number(process.env.NEXT_PUBLIC_INR_TO_USD || "0.01128");
// // Future: const CAD_TO_USD = Number(process.env.NEXT_PUBLIC_CAD_TO_USD || "0.73");

// /** 🔧 Manual override (while API for last month is pending) */
// const USE_MANUAL_LAST_MONTH =
//   (process.env.NEXT_PUBLIC_USE_MANUAL_LAST_MONTH || "false").toLowerCase() === "true";

// /** Put last month's TOTAL SALES in USD (not to-date) */
// const MANUAL_LAST_MONTH_USD_GLOBAL = Number(
//   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_GLOBAL || "0"
// );
// /** Optional per-region overrides */
// const MANUAL_LAST_MONTH_USD_UK = Number(process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_UK || "0");
// const MANUAL_LAST_MONTH_USD_US = Number(process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_US || "0");
// const MANUAL_LAST_MONTH_USD_CA = Number(process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_CA || "0");

// /* ===================== DATE HELPERS ===================== */
// function getISTYearMonth() {
//   const optsMonth: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", month: "long" };
//   const optsYear: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", year: "numeric" };
//   const now = new Date();
//   const monthName = now.toLocaleString("en-US", optsMonth);
//   const yearStr = now.toLocaleString("en-US", optsYear);
//   return { monthName, year: Number(yearStr) };
// }

// function buildShopifyURL({ year, monthName }: { year: number; monthName: string }) {
//   const qs = new URLSearchParams();
//   qs.set("year", String(year));
//   qs.append("months[]", monthName);
//   return `${SHOPIFY_ENDPOINT}?${qs.toString()}`;
// }

// function getPrevISTYearMonth() {
//   const tz = "Asia/Kolkata";
//   const now = new Date();
//   const istNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
//   const year = istNow.getMonth() === 0 ? istNow.getFullYear() - 1 : istNow.getFullYear();
//   const monthIdx = istNow.getMonth() === 0 ? 11 : istNow.getMonth() - 1;
//   const monthName = new Date(year, monthIdx, 1).toLocaleString("en-US", {
//     month: "long",
//     timeZone: tz,
//   });
//   return { monthName, year };
// }

// function getPrevMonthShortLabel() {
//   const { monthName, year } = getPrevISTYearMonth();
//   const shortMon = new Date(`${monthName} 1, ${year}`).toLocaleString("en-US", {
//     month: "short",
//     timeZone: "Asia/Kolkata",
//   });
//   return `${shortMon}'${String(year).slice(-2)}`; // e.g., Oct'25
// }

// function getISTDayInfo() {
//   const tz = "Asia/Kolkata";
//   const now = new Date();
//   const istNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
//   const todayDay = istNow.getDate();
//   const { monthName, year } = getPrevISTYearMonth();
//   const prevMonthIdx = new Date(`${monthName} 1, ${year}`).getMonth();
//   const daysInPrevMonth = new Date(year, prevMonthIdx + 1, 0).getDate();
//   const daysInThisMonth = new Date(istNow.getFullYear(), istNow.getMonth() + 1, 0).getDate();
//   return { todayDay, daysInPrevMonth, daysInThisMonth };
// }

// /* ===================== UI HELPERS ===================== */
// const ValueOrSkeleton = ({
//   loading,
//   children,
//   compact = false,
// }: {
//   loading: boolean;
//   children: React.ReactNode;
//   compact?: boolean;
// }) => {
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
//   if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
//   return new Intl.NumberFormat("en-GB", {
//     style: "currency",
//     currency: ccy,
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(Number(val));
// };

// const fmtGBP = (val: any) => fmtCurrency(val, "GBP");

// const fmtUSD = (val: any) => {
//   if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
//   return new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "USD",
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(Number(val));
// };

// const fmtShopify = (val: any) => {
//   if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
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
//     : new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
//         Number(val)
//       );

// const fmtPct = (val: any) =>
//   val === null || val === undefined || isNaN(Number(val)) ? "—" : `${Number(val).toFixed(2)}%`;

// const toNumberSafe = (v: any) => {
//   if (v === null || v === undefined) return 0;
//   if (typeof v === "number") return v;
//   const s = String(v).replace(/[, ]+/g, "");
//   const n = Number(s);
//   return isNaN(n) ? 0 : n;
// };

// /* ===================== SALES TARGET CARD ===================== */
// type RegionKey = "Global" | "UK" | "US" | "CA";

// function SalesTargetCard({
//   regions,
//   defaultRegion = "Global",
// }: {
//   regions: Record<
//     RegionKey,
//     {
//       mtdUSD: number;
//       /** Last month MTD (pro-rated to today's date) */
//       lastMonthToDateUSD: number;
//       /** Last month TOTAL (full month) — used as Target & bottom KPI */
//       lastMonthTotalUSD: number;
//       /** This month target (we set this equal to lastMonthTotalUSD) */
//       targetUSD: number;
//     }
//   >;
//   defaultRegion?: RegionKey;
// }) {
//   const [tab, setTab] = useState<RegionKey>(defaultRegion);

//   const data = regions[tab] || regions.Global;
//   const { mtdUSD, lastMonthToDateUSD, lastMonthTotalUSD, targetUSD } = data;

//   const pct = targetUSD > 0 ? Math.min(mtdUSD / targetUSD, 1) : 0;
//   const pctLastMTD = targetUSD > 0 ? Math.min(lastMonthToDateUSD / targetUSD, 1) : 0;

//   const deltaPct = (pct - pctLastMTD) * 100;

//   const { todayDay } = getISTDayInfo();
//   const todayApprox = todayDay > 0 ? mtdUSD / todayDay : 0;

//   const prevLabel = getPrevMonthShortLabel(); // e.g., Oct'25

//   const size = 280;
//   const stroke = 16;
//   const cx = size / 2;
//   const rBase = size / 2 - stroke;

//   // helper to convert angle+radius → x,y (draw upwards into visible half)
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

//   // ⬇️ LAYOUT OF ARCS
//   // Grey (Target) and Green (current MTD) share the same radius.
//   // Green is drawn AFTER grey so it visually sits on top and shows "fullness".
//   const rTarget = rBase; // outer radius for background + target
//   const rCurrent = rBase; // same radius as target → sits on top
//   const rLastMTD = rBase - stroke * 0.9; // slightly inner radius for orange

//   const fullFrom = 0;
//   const fullTo = 180;
//   const toDeg_MTD = 180 * pct;

//   // NOTE: orange currently uses last-month **MTD (pro-rated)**:
//   // const toDeg_LastMTD = 180 * pctLastMTD;
//   // If you want orange to represent FULL last-month total instead, use:
//   const toDeg_LastMTD = 180;  // because targetUSD === lastMonthTotalUSD

//   const knobGreen = toXYRadius(toDeg_MTD, rCurrent);
//   const knobYellow = toXYRadius(toDeg_LastMTD, rLastMTD);

//   const badgeIsUp = deltaPct >= 0;
//   const badgeStr = (badgeIsUp ? "▲ " : "▼ ") + `${Math.abs(deltaPct).toFixed(2)}%`;

//   return (
//     <div className="rounded-2xl border bg-white p-5 shadow-sm">
//       {/* Header with tabs */}
//       <div className="mb-3 flex items-center justify-between">
//         <div className="text-xl font-semibold text-gray-800">Sales Target</div>

//         <div className="inline-flex rounded-full border p-1 bg-gray-50">
//           {(["Global", "UK", "US", "CA"] as RegionKey[]).map((key) => (
//             <button
//               key={key}
//               onClick={() => setTab(key)}
//               className={`px-3 py-1 text-sm rounded-full transition ${
//                 tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
//               }`}
//             >
//               {key}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Legend */}
//       <div className="mb-2 flex items-center gap-5 text-xs">
//         <div className="flex items-center gap-2">
//           <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#16a34a" }} />
//           <span className="text-gray-600">MTD Sales</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#9ca3af" }} />
//           <span className="text-gray-600">This Month Target</span>
//         </div>
//         <div className="flex items-center gap-2">
//           <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#f59e0b" }} />
//           <span className="text-gray-600">{prevLabel} MTD</span>
//         </div>
//       </div>

//       {/* Gauge */}
//       <div className="mt-4 flex items-center justify-center">
//         <svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2}`}>
//           {/* Outer grey: full target */}
//           <path
//             d={arcPath(fullFrom, fullTo, rTarget)}
//             fill="none"
//             stroke="#e5e7eb"
//             strokeWidth={stroke}
//             strokeLinecap="round"
//           />

//           {/* Middle orange: last month MTD */}
//           <path
//             d={arcPath(fullFrom, toDeg_LastMTD, rLastMTD)}
//             fill="none"
//             stroke="#f59e0b"
//             strokeWidth={stroke}
//             strokeLinecap="round"
//           />

//           {/* Inner-on-top green: current MTD (same radius as grey so it “fills” it) */}
//           <path
//             d={arcPath(fullFrom, toDeg_MTD, rCurrent)}
//             fill="none"
//             stroke="#16a34a"
//             strokeWidth={stroke}
//             strokeLinecap="round"
//           />

//           {/* Knobs */}
//           <circle cx={knobYellow.x} cy={knobYellow.y} r={10} fill="#f59e0b" stroke="#fffbeb" strokeWidth={4} />
//           <circle cx={knobGreen.x} cy={knobGreen.y} r={12} fill="#16a34a" stroke="#ecfdf3" strokeWidth={4} />
//         </svg>
//       </div>

//       {/* Center metrics */}
//       <div className="mt-2 text-center">
//         <div className="text-3xl font-bold">{(pct * 100).toFixed(1)}%</div>
//         <div
//           className={`mx-auto mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
//             badgeIsUp ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"
//           }`}
//         >
//           {badgeStr}
//         </div>
//       </div>

//       {/* Bottom KPIs */}
//       <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
//         <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-3">
//           <div className="text-gray-500">Today</div>
//           <div className="mt-0.5 font-semibold">{fmtUSD(todayApprox)}</div>
//         </div>
//         <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-3">
//           <div className="text-gray-500">MTD Sales</div>
//           <div className="mt-0.5 font-semibold">{fmtUSD(mtdUSD)}</div>
//         </div>
//         <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-3">
//           <div className="text-gray-500">Target</div>
//           <div className="mt-0.5 font-semibold">{fmtUSD(targetUSD)}</div>
//         </div>
//         <div className="flex flex-col items-center rounded-xl border bg-gray-50 p-3">
//           <div className="text-gray-500">{prevLabel}</div>
//           <div className="mt-0.5 font-semibold">{fmtUSD(lastMonthTotalUSD)}</div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ===================== SIMPLE BAR CHART (existing) ===================== */
// function SimpleBarChart({
//   items,
//   height = 300,
//   padding = { top: 28, right: 24, bottom: 56, left: 24 },
//   colors = ["#2563eb", "#16a34a", "#f59e0b", "#ec4899", "#8b5cf6"],
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
//   const values = items.map((d) => (Number.isFinite(d.raw) ? Math.abs(Number(d.raw)) : 0));
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
//         <rect x={x - 70} y={textY1 - 24} width={140} height={24} rx={6} fill="#111827" opacity="0.9" />
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
//         <polygon points={`${x - 6},${textY1} ${x + 6},${textY1} ${x},${textY1 + 6}`} fill="#111827" opacity="0.9" />
//         <circle cx={x} cy={y} r="6.5" fill="none" stroke={color} strokeWidth={2} />
//       </g>
//     );
//   };

//   return (
//     <div className="w-full overflow-x-auto ">
//       <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[760px] select-none">
//         <defs>
//           <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
//             <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.15" />
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
//               <text x={xCenter} y={y - 10} textAnchor="middle" fontSize={12} fontWeight={600} fill="#111827">
//                 {d.display}
//               </text>
//               <text x={xCenter} y={height - padding.bottom + 20} textAnchor="middle" fontSize={12} fill="#6b7280">
//                 {d.label}
//               </text>
//               {hoverIdx === i && <Tooltip x={xCenter} y={y} label={d.label} display={d.display} color={color} />}
//             </g>
//           );
//         })}
//       </svg>
//     </div>
//   );
// }

// /* ===================== MAIN PAGE ===================== */
// export default function DashboardPage() {
//   // Amazon
//   const [loading, setLoading] = useState(false);
//   const [unauthorized, setUnauthorized] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [data, setData] = useState<any>(null);

//   // Shopify (current month)
//   const [shopifyLoading, setShopifyLoading] = useState(false);
//   const [shopifyError, setShopifyError] = useState<string | null>(null);
//   const [shopifyRows, setShopifyRows] = useState<any[]>([]);
//   const shopify = shopifyRows?.[0] || null;

//   // Shopify (previous month)
//   const [shopifyPrevRows, setShopifyPrevRows] = useState<any[]>([]);

//   const fetchAmazon = useCallback(async () => {
//     setLoading(true);
//     setUnauthorized(false);
//     setError(null);
//     try {
//       const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
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

//   const fetchShopify = useCallback(async () => {
//     setShopifyLoading(true);
//     setShopifyError(null);
//     try {
//       const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
//       if (!token) throw new Error("No token found. Please sign in.");
//       const { monthName, year } = getISTYearMonth();
//       const url = buildShopifyURL({ year, monthName });
//       const res = await fetch(url, {
//         method: "GET",
//         headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
//         credentials: "omit",
//       });
//       if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
//       if (!res.ok) throw new Error(`Shopify request failed: ${res.status}`);
//       const json = await res.json();
//       const rows = Array.isArray(json?.data) ? json.data : [];
//       setShopifyRows(rows);
//     } catch (e: any) {
//       setShopifyError(e?.message || "Failed to load Shopify data");
//       setShopifyRows([]);
//     } finally {
//       setShopifyLoading(false);
//     }
//   }, []);

//   const fetchShopifyPrev = useCallback(async () => {
//     try {
//       const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
//       if (!token) throw new Error("No token found. Please sign in.");
//       const { year, monthName } = getPrevISTYearMonth();
//       const url = buildShopifyURL({ year, monthName });
//       const res = await fetch(url, {
//         method: "GET",
//         headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
//         credentials: "omit",
//       });
//       if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
//       if (!res.ok) throw new Error(`Shopify (prev) request failed: ${res.status}`);
//       const json = await res.json();
//       const rows = Array.isArray(json?.data) ? json.data : [];
//       setShopifyPrevRows(rows);
//     } catch (e: any) {
//       console.warn("Shopify prev-month fetch failed:", e?.message);
//     }
//   }, []);

//   const refreshAll = useCallback(async () => {
//     await Promise.all([fetchAmazon(), fetchShopify(), fetchShopifyPrev()]);
//   }, [fetchAmazon, fetchShopify, fetchShopifyPrev]);

//   useEffect(() => {
//     refreshAll();
//   }, [refreshAll]);

//   // ---------- Amazon aliases ----------
//   const cms = data?.current_month_summary || null;
//   const cmp = data?.current_month_profit || null;

//   // ---- derive UK (GBP) safely ----
//   const uk = useMemo(() => {
//     const netSalesGBP = cms?.net_sales?.GBP != null ? toNumberSafe(cms.net_sales.GBP) : null;
//     const aspGBP = cms?.asp?.GBP != null ? toNumberSafe(cms.asp.GBP) : null;

//     let profitGBP: number | null = null;
//     if (cmp?.profit && typeof cmp.profit === "object" && cmp.profit.GBP !== undefined) {
//       profitGBP = toNumberSafe(cmp.profit.GBP);
//     } else if ((typeof cmp?.profit === "number" || typeof cmp?.profit === "string") && netSalesGBP !== null) {
//       profitGBP = toNumberSafe(cmp.profit);
//     }

//     let unitsGBP: number | null = null;
//     if (cmp?.breakdown?.GBP?.quantity !== undefined) {
//       unitsGBP = toNumberSafe(cmp.breakdown.GBP.quantity);
//     }

//     let profitPctGBP: number | null = null;
//     if (profitGBP !== null && netSalesGBP && !isNaN(netSalesGBP) && netSalesGBP !== 0) {
//       profitPctGBP = (profitGBP / netSalesGBP) * 100;
//     }

//     return { unitsGBP, netSalesGBP, aspGBP, profitGBP, profitPctGBP };
//   }, [cms, cmp]);

//   // Amazon chart items
//   const barsAmazon = useMemo(() => {
//     const units = cms?.total_quantity ?? 0;
//     const sales = uk.netSalesGBP ?? 0;
//     const asp = uk.aspGBP ?? 0;
//     const profit = uk.profitGBP ?? 0;
//     const pcent = Number.isFinite(uk.profitPctGBP) ? (uk.profitPctGBP as number) : 0;

//     return [
//       { label: "Units", raw: Number(units) || 0, display: fmtNum(units) },
//       { label: "Sales", raw: Number(sales) || 0, display: fmtGBP(sales) },
//       { label: "ASP", raw: Number(asp) || 0, display: fmtGBP(asp) },
//       { label: "Profit", raw: Number(profit) || 0, display: fmtGBP(profit) },
//       { label: "Profit %", raw: Number(pcent) || 0, display: fmtPct(pcent) },
//     ];
//   }, [uk, cms]);

//   // Shopify (current)
//   const shopifyDeriv = useMemo(() => {
//     if (!shopify) return null;
//     const totalOrders = toNumberSafe(shopify.total_orders);
//     const netSales = toNumberSafe(shopify.net_sales); // INR
//     const totalDiscounts = toNumberSafe(shopify.total_discounts);
//     const totalTax = toNumberSafe(shopify.total_tax);
//     const gross = toNumberSafe(shopify.total_price);
//     const aov = totalOrders > 0 ? gross / totalOrders : 0;
//     return { totalOrders, netSales, totalDiscounts, totalTax, gross, aov };
//   }, [shopify]);

//   // Shopify (previous month)
//   const shopifyPrevDeriv = useMemo(() => {
//     const row = shopifyPrevRows?.[0];
//     if (!row) return null;
//     const netSales = toNumberSafe(row.net_sales); // INR total prev month
//     return { netSales };
//   }, [shopifyPrevRows]);

//   // Combined MTD (USD)
//   const amazonUK_USD = useMemo(() => {
//     const amazonUK_GBP = toNumberSafe(uk.netSalesGBP);
//     return amazonUK_GBP * GBP_TO_USD;
//   }, [uk.netSalesGBP]);

//   const combinedUSD = useMemo(() => {
//     const aUK = amazonUK_USD; // GBP -> USD
//     const shopifyUSD = toNumberSafe(shopifyDeriv?.netSales) * INR_TO_USD; // INR -> USD
//     return aUK + shopifyUSD;
//   }, [amazonUK_USD, shopifyDeriv?.netSales]);

//   /* ====== PREVIOUS MONTH TOTALS (USD) & DERIVATIONS ====== */

//   // Amazon UK previous month total (from /orders route)
//   const prevAmazonUKTotalUSD = useMemo(() => {
//     const prevTotalGBP = toNumberSafe(data?.previous_month_total_net_sales?.total);
//     return prevTotalGBP * GBP_TO_USD;
//   }, [data?.previous_month_total_net_sales?.total]);

//   // Shopify previous total → USD
//   const prevShopifyTotalUSD = useMemo(() => {
//     const prevINRTotal = toNumberSafe(shopifyPrevDeriv?.netSales);
//     return prevINRTotal * INR_TO_USD;
//   }, [shopifyPrevDeriv]);

//   // Global previous total (computed from what we have)
//   const globalPrevTotalUSD = prevShopifyTotalUSD + prevAmazonUKTotalUSD;

//   // Helper: build chosen "last month total" with optional manual override
//   const chooseLastMonthTotal = (manualUSD: number, computedUSD: number) =>
//     USE_MANUAL_LAST_MONTH && manualUSD > 0 ? manualUSD : computedUSD;

//   // Pro-rate last-month MTD (yellow arc) from last-month TOTAL
//   const prorateToDate = (lastMonthTotalUSD: number) => {
//     const { todayDay, daysInPrevMonth } = getISTDayInfo();
//     return daysInPrevMonth > 0 ? (lastMonthTotalUSD * todayDay) / daysInPrevMonth : 0;
//   };

//   // Regions for card
//   const regions = useMemo(() => {
//     // GLOBAL
//     const globalLastMonthTotal = chooseLastMonthTotal(
//       MANUAL_LAST_MONTH_USD_GLOBAL,
//       globalPrevTotalUSD
//     );
//     const global = {
//       mtdUSD: combinedUSD,
//       lastMonthToDateUSD: prorateToDate(globalLastMonthTotal),
//       lastMonthTotalUSD: globalLastMonthTotal,
//       targetUSD: globalLastMonthTotal, // Target = last month's sales
//     };

//     // UK (Amazon UK only)
//     const ukLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_UK, prevAmazonUKTotalUSD);
//     const ukRegion = {
//       mtdUSD: amazonUK_USD,
//       lastMonthToDateUSD: prorateToDate(ukLastMonthTotal),
//       lastMonthTotalUSD: ukLastMonthTotal,
//       targetUSD: ukLastMonthTotal,
//     };

//     // US (placeholder)
//     const usLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_US, 0);
//     const usRegion = {
//       mtdUSD: 0,
//       lastMonthToDateUSD: prorateToDate(usLastMonthTotal),
//       lastMonthTotalUSD: usLastMonthTotal,
//       targetUSD: usLastMonthTotal,
//     };

//     // CA (placeholder)
//     const caLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_CA, 0);
//     const caRegion = {
//       mtdUSD: 0,
//       lastMonthToDateUSD: prorateToDate(caLastMonthTotal),
//       lastMonthTotalUSD: caLastMonthTotal,
//       targetUSD: caLastMonthTotal,
//     };

//     return {
//       Global: global,
//       UK: ukRegion,
//       US: usRegion,
//       CA: caRegion,
//     } as Record<
//       RegionKey,
//       { mtdUSD: number; lastMonthToDateUSD: number; lastMonthTotalUSD: number; targetUSD: number }
//     >;
//   }, [combinedUSD, amazonUK_USD, globalPrevTotalUSD, prevAmazonUKTotalUSD]);

//   const anyLoading = loading || shopifyLoading;

//   return (
//     <div className="mx-auto max-w-7xl ">
//       {/* SALES TARGET CARD (top) */}
//       <SalesTargetCard regions={regions} defaultRegion="Global" />

//       <div className="mt-6 mb-4 flex items-center justify-between">
//         <h1 className="text-xl font-semibold tracking-tight">Amazon &amp; Shopify Overview</h1>
//         <button
//           onClick={refreshAll}
//           disabled={anyLoading}
//           className={`rounded-md border px-3 py-1.5 text-sm shadow-sm active:scale-[.99] ${
//             anyLoading
//               ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
//               : "border-gray-300 bg-white hover:bg-gray-50"
//           }`}
//           title="Refresh Amazon & Shopify"
//         >
//           {anyLoading ? "Refreshing…" : "Refresh"}
//         </button>
//       </div>

//       {/* ======================= GRID: 12 cols ======================= */}
//       <div className="grid grid-cols-12 gap-6">
//         {/* LEFT 8: Amazon cards then Shopify cards */}
//         <div className="col-span-12 lg:col-span-8 space-y-6">
//           {/* Notices */}
//           {unauthorized && (
//             <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
//               <div className="text-sm">
//                 You’re not signed in or your session expired. Please authenticate to load Amazon
//                 orders.
//               </div>
//               <a
//                 href={`${baseURL || ""}/auth/login`}
//                 className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-amber-100"
//               >
//                 Sign in
//               </a>
//             </div>
//           )}
//           {error && (
//             <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
//               <span>⚠️</span>
//               <span className="text-sm">{error}</span>
//             </div>
//           )}

//           {/* AMAZON — 5 boxes */}
//           <div className="rounded-2xl border bg-white p-5 shadow-sm">
//             <div className="mb-2 text-sm font-medium text-gray-700">Amazon — Details (UK)</div>
//             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
//               <div className="rounded-2xl border bg-white p-5 shadow-sm">
//                 <div className="text-sm text-gray-500">Units</div>
//                 <div className="mt-1 text-2xl font-semibold">
//                   <ValueOrSkeleton loading={loading}>{fmtNum(cms?.total_quantity ?? 0)}</ValueOrSkeleton>
//                 </div>
//               </div>
//               <div className="rounded-2xl border bg-white p-5 shadow-sm">
//                 <div className="text-sm text-gray-500">Total Sales</div>
//                 <div className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
//                   <ValueOrSkeleton loading={loading}>{fmtGBP(uk.netSalesGBP)}</ValueOrSkeleton>
//                 </div>
//               </div>
//               <div className="rounded-2xl border bg-white p-5 shadow-sm">
//                 <div className="text-sm text-gray-500">ASP</div>
//                 <div className="mt-1 text-2xl font-semibold">
//                   <ValueOrSkeleton loading={loading}>{fmtGBP(uk.aspGBP)}</ValueOrSkeleton>
//                 </div>
//               </div>
//               <div className="rounded-2xl border bg-white p-5 shadow-sm">
//                 <div className="text-sm text-gray-500">Profit</div>
//                 <div className="mt-1 text-2xl font-semibold">
//                   <ValueOrSkeleton loading={loading}>{fmtGBP(uk.profitGBP)}</ValueOrSkeleton>
//                 </div>
//               </div>
//               <div className="rounded-2xl border bg-white p-5 shadow-sm">
//                 <div className="text-sm text-gray-500">Profit %</div>
//                 <div className="mt-1 text-2xl font-semibold">
//                   <ValueOrSkeleton loading={loading}>{fmtPct(uk.profitPctGBP)}</ValueOrSkeleton>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* SHOPIFY — 5 boxes (₹) */}
//           <div className="rounded-2xl border bg-white p-5 shadow-sm">
//             <div className="mb-2 text-sm font-medium text-gray-700">Shopify — Details (₹ Rupees)</div>

//             {shopifyError && (
//               <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
//                 <span>⚠️</span>
//                 <span className="text-sm">{shopifyError}</span>
//               </div>
//             )}

//             {shopifyLoading && (
//               <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
//                 {[...Array(5)].map((_, i) => (
//                   <div key={i} className="rounded-2xl border bg-white p-5 shadow-sm">
//                     <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
//                     <div className="mt-2 h-7 w-28 animate-pulse rounded bg-gray-200" />
//                   </div>
//                 ))}
//               </div>
//             )}

//             {!shopifyLoading && !shopifyError && (
//               <>
//                 {shopify ? (
//                   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
//                     {/* Units */}
//                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
//                       <div className="text-sm text-gray-500">Units</div>
//                       <div className="mt-1 text-2xl font-semibold text-gray-900">
//                         <ValueOrSkeleton loading={shopifyLoading}>
//                           {shopify?.total_orders}
//                         </ValueOrSkeleton>
//                       </div>
//                     </div>

//                     {/* Total Sales (₹) */}
//                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
//                       <div className="text-sm text-gray-500">Sales</div>
//                       <div className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
//                         <ValueOrSkeleton loading={shopifyLoading}>
//                           {fmtShopify(toNumberSafe(shopify?.net_sales ?? 0))}
//                         </ValueOrSkeleton>
//                       </div>
//                     </div>

//                     {/* ASP */}
//                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
//                       <div className="text-sm text-gray-500">ASP</div>
//                       <div className="mt-1 text-2xl font-semibold text-gray-900">
//                         <ValueOrSkeleton loading={shopifyLoading}>
//                           {(() => {
//                             const units = toNumberSafe(shopify?.total_orders ?? 0);
//                             const net = toNumberSafe(shopify?.net_sales ?? 0);
//                             if (units <= 0) return "—";
//                             return fmtShopify(net / units);
//                           })()}
//                         </ValueOrSkeleton>
//                       </div>
//                     </div>

//                     {/* Profit — placeholder (₹) */}
//                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
//                       <div className="text-sm text-gray-500">Profit</div>
//                       <div className="mt-1 text-2xl font-semibold text-gray-900">—</div>
//                     </div>

//                     {/* Profit % */}
//                     <div className="rounded-2xl border bg-white p-5 shadow-sm">
//                       <div className="text-sm text-gray-500">Profit %</div>
//                       <div className="mt-1 text-2xl font-semibold text-gray-900">—</div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="mt-2 text-sm text-gray-500">No Shopify data for the current month.</div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>

//         {/* RIGHT 4: spare column for future widgets */}
//         <aside className="col-span-12 lg:col-span-4">
//           <div className="lg:sticky lg:top-6"></div>
//         </aside>
//       </div>

//       {/* ======================= FULL-WIDTH GRAPH BELOW EVERYTHING ======================= */}
//       <div className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
//         <div className="mb-3 text-sm text-gray-500">Amazon — Units, Sales, ASP, Profit, Profit %</div>
//         <SimpleBarChart
//           items={[
//             {
//               label: "Units",
//               raw: Number(cms?.total_quantity ?? 0),
//               display: fmtNum(cms?.total_quantity ?? 0),
//             },
//             { label: "Sales", raw: Number(uk.netSalesGBP ?? 0), display: fmtGBP(uk.netSalesGBP ?? 0) },
//             { label: "ASP", raw: Number(uk.aspGBP ?? 0), display: fmtGBP(uk.aspGBP ?? 0) },
//             { label: "Profit", raw: Number(uk.profitGBP ?? 0), display: fmtGBP(uk.profitGBP ?? 0) },
//             {
//               label: "Profit %",
//               raw: Number(Number(uk.profitPctGBP ?? 0)),
//               display: fmtPct(Number(uk.profitPctGBP ?? 0)),
//             },
//           ]}
//         />
//       </div>
//     </div>
//   );
// }






















































































































"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/loader/Loader";
import DownloadIconButton from "@/components/ui/button/DownloadIconButton";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import DashboardBargraphCard from "@/components/dashboard/DashboardBargraphCard";
import SalesTargetCard from "@/components/dashboard/SalesTargetCard";
import SalesTargetStatsCard from "@/components/dashboard/SalesTargetStatsCard";
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
  fmtNum,
  fmtPct,
  fmtInt,
  toNumberSafe,
} from "@/lib/dashboard/format";

import type { RegionKey, RegionMetrics } from "@/lib/dashboard/types";

import { useGetUserDataQuery } from "@/lib/api/profileApi";
import { usePlatform } from "@/components/context/PlatformContext";
import type { PlatformId } from "@/lib/utils/platforms";
import LiveBiLineGraph from "@/components/businessInsight/LiveBiLineChartPanel";

// ✅ moved range picker deps here
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { FaCalendarAlt } from "react-icons/fa";
import MonthsforBI from "@/app/(admin)/live-business-insight/[ranged]/[countryName]/[month]/[year]/page";

type CurrencyCode = "USD" | "GBP" | "INR" | "CAD";

/* ===================== ENV & ENDPOINTS ===================== */
const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

// const API_URL = `${baseURL}/amazon_api/orders`;
const FIN_MTD_TX_ENDPOINT = `${baseURL}/amazon_api/finances/mtd_transactions`;
const SHOPIFY_DROPDOWN_ENDPOINT = `${baseURL}/shopify/dropdown`;
// const FX_ENDPOINT = `${baseURL}/currency-rate`;

// ✅ BI endpoint (same one your graph uses)
const LIVE_MTD_BI_ENDPOINT = `${baseURL}/live_mtd_bi`;

/** 💵 FX defaults (used until backend answers) */
const GBP_TO_USD_ENV = Number(process.env.NEXT_PUBLIC_GBP_TO_USD || "1.25");
const INR_TO_USD_ENV = Number(process.env.NEXT_PUBLIC_INR_TO_USD || "0.01128");
const CAD_TO_USD_ENV = Number(process.env.NEXT_PUBLIC_CAD_TO_USD || "0.74");

const USE_MANUAL_LAST_MONTH =
  (process.env.NEXT_PUBLIC_USE_MANUAL_LAST_MONTH || "false").toLowerCase() ===
  "true";

const MANUAL_LAST_MONTH_USD_GLOBAL = Number(
  process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_GLOBAL || "0"
);
const MANUAL_LAST_MONTH_USD_UK = Number(
  process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_UK || "0"
);
const MANUAL_LAST_MONTH_USD_US = Number(
  process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_US || "0"
);
const MANUAL_LAST_MONTH_USD_CA = Number(
  process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_CA || "0"
);

/* ===================== BI TYPES (for shared cards + graph) ===================== */
type ChartMetric = "net_sales" | "quantity";

type DailyPoint = {
  date: string;
  quantity?: number;
  net_sales?: number;
  product_sales?: number;
  profit?: number;
  cm2_profit?: number; // ✅ add
};


type DailySeries = {
  previous: DailyPoint[];
  current_mtd: DailyPoint[];
};

type PeriodInfo = {
  label: string;
  start_date: string;
  end_date: string;
};

type BiApiResponse = {
  message?: string;
  periods?: {
    previous?: PeriodInfo;
    current_mtd?: PeriodInfo;
  };
  daily_series?: DailySeries;

  aligned_totals?: BiAlignedTotals;

  categorized_growth?: any;
  insights?: Record<string, any>;
  ai_insights?: Record<string, any>;
  overall_summary?: string[];
  overall_actions?: string[];
};


type BiAlignedTotals = {
  current_cm2_profit?: number;
  previous_cm2_profit?: number;
  total_current_profit_percentage?: number;
  total_previous_profit_percentage?: number;

  // ✅ add these
  total_previous_net_sales_full_month?: number;
  total_previous_net_sales?: number;
  total_current_net_sales?: number;
};

/* ===================== SMALL HELPERS ===================== */
const getShort = (label?: string) => (label ? label.split(" ")[0] || label : "");

const currencyForCountry = (countryName: string): CurrencyCode => {
  const c = (countryName || "").toLowerCase();
  if (c === "uk") return "GBP";
  if (c === "us") return "USD";
  if (c === "ca") return "CAD";
  // fallback (if you ever use india/shopify here)
  if (c === "india") return "INR";
  return "USD";
};

const safeDeltaPctFromPct = (currentPct: number, previousPct: number) => {
  const c = Number(currentPct) || 0;
  const p = Number(previousPct) || 0;
  if (!p) return null;
  return ((c - p) / Math.abs(p)) * 100;
};


/* ===================== RANGE PICKER (moved above graph) ===================== */
function RangePicker({
  selectedStartDay,
  selectedEndDay,
  onSubmit,
  onClear,
  onCloseReset,
}: {
  selectedStartDay: number | null;
  selectedEndDay: number | null;
  onSubmit: (s: number | null, e: number | null) => void;
  onClear: () => void;
  onCloseReset: () => void;
}) {

  // ✅ LOCK CALENDAR TO CURRENT MONTH ONLY
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [shownDate, setShownDate] = useState<Date>(monthStart);

  const [showCalendar, setShowCalendar] = useState(false);

  const [calendarRange, setCalendarRange] = useState<any>([
    { startDate: null, endDate: null, key: "selection" },
  ]);

  const [pendingStartDay, setPendingStartDay] = useState<number | null>(null);
  const [pendingEndDay, setPendingEndDay] = useState<number | null>(null);

  const handleCalendarChange = (ranges: any) => {
    const range = ranges.selection;
    setCalendarRange([range]);

    if (range.startDate && range.endDate) {
      setPendingStartDay(range.startDate.getDate());
      setPendingEndDay(range.endDate.getDate());
    } else {
      setPendingStartDay(null);
      setPendingEndDay(null);
    }
  };

  const applyRange = () => {
    onSubmit(pendingStartDay, pendingEndDay);
    setShowCalendar(false);
  };

  const clearRange = () => {
    setCalendarRange([{ startDate: null, endDate: null, key: "selection" }]);
    setPendingStartDay(null);
    setPendingEndDay(null);
    onClear();
  };

  const closeAndReset = () => {
    setCalendarRange([{ startDate: null, endDate: null, key: "selection" }]);
    setPendingStartDay(null);
    setPendingEndDay(null);
    setShowCalendar(false);
    onCloseReset();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowCalendar((s) => !s)}
        className="flex items-center gap-2"
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid #D9D9D9E5",
          backgroundColor: "#ffffff",
          fontSize: 12,
        }}
      >
        <FaCalendarAlt size={15} />
        {selectedStartDay && selectedEndDay
          ? `Day ${selectedStartDay} – ${selectedEndDay}`
          : "Select Date Range"}
      </button>

      {showCalendar && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            zIndex: 50,
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            padding: 8,
            borderRadius: 8,
            minWidth: 320,
          }}
        >
          {/* <DateRange
            ranges={calendarRange}
            onChange={handleCalendarChange}
            moveRangeOnFirstSelection={false}
            showMonthAndYearPickers={false}
            rangeColors={["#5EA68E"]}
          /> */}

          <DateRange
            ranges={calendarRange}
            onChange={handleCalendarChange}
            moveRangeOnFirstSelection={false}
            showMonthAndYearPickers={false}
            rangeColors={["#5EA68E"]}

            // ✅ Only allow selecting dates from current month
            minDate={monthStart}
            maxDate={monthEnd}

            // ✅ Always show current month (prevents switching)
            shownDate={shownDate}
            onShownDateChange={() => {
              // snap back to the same month even if user tries to navigate
              setShownDate(monthStart);
            }}
          />
          <style jsx global>{`
  /* Remove left/right month navigation arrows */
  .rdrNextPrevButton {
    display: none !important;
  }
`}</style>


          <div className="flex justify-between mt-2 gap-2">
            <button
              type="button"
              onClick={clearRange}
              className="text-xs px-2 py-1 border rounded"
            >
              Clear
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyRange}
                disabled={pendingStartDay == null || pendingEndDay == null}
                className="text-xs px-2 py-1 rounded text-yellow-200"
                style={{
                  background: "#37455F",
                  opacity: pendingStartDay == null ? 0.6 : 1,
                }}
              >
                Submit
              </button>
              <button
                type="button"
                onClick={closeAndReset}
                className="text-xs px-2 py-1 rounded text-charcoal-500 border border-charcoal-500"
              // style={{ background: "#5EA68E" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



const sliceByDayRange = (
  points: DailyPoint[] = [],
  startDay: number | null,
  endDay: number | null
) => {
  if (startDay == null || endDay == null) return points;

  const s = Math.min(startDay, endDay);
  const e = Math.max(startDay, endDay);

  return points.filter((p) => {
    const day = Number(p.date?.slice(8, 10)); // "YYYY-MM-DD" -> DD
    return day >= s && day <= e;
  });
};


export default function DashboardPage() {
  const { platform } = usePlatform();
  const { data: userData } = useGetUserDataQuery();

  const isCountryMode = platform !== "global" && platform !== "shopify";

  const countryName = useMemo(() => {
    switch (platform) {
      case "amazon-uk":
        return "uk";
      case "amazon-us":
        return "us";
      case "amazon-ca":
        return "ca";
      default:
        return "global";
    }
  }, [platform]);

  // const showLiveBI = isCountryMode;
  const showLiveBI = isCountryMode || platform === "global";


  const brandName = useSelector(
    (state: RootState) => state.auth.user?.brand_name
  );

  const biCountryName = useMemo(() => {
    if (platform === "global") return "uk";
    return countryName;
  }, [platform, countryName]);

  const biDataCurrency = useMemo(() => currencyForCountry(biCountryName), [biCountryName]);

  const biSourceCurrency: CurrencyCode = useMemo(
    () => currencyForCountry(biCountryName),
    [biCountryName]
  );


  /* ===================== PLATFORM → DISPLAY CURRENCY ===================== */
  const profileHomeCurrency = ((userData?.homeCurrency || "USD").toUpperCase() as CurrencyCode);

  const displayCurrency: CurrencyCode = useMemo(() => {
    switch (platform as PlatformId) {
      case "global":
        return profileHomeCurrency;
      case "amazon-uk":
        return "GBP";
      case "amazon-us":
        return "USD";
      case "amazon-ca":
        return "CAD";
      case "shopify":
        return "INR";
      default:
        return profileHomeCurrency;
    }
  }, [platform, profileHomeCurrency]);

  /* ===================== AMAZON / SHOPIFY STATE ===================== */
  const [loading, setLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const { connections: amazonConnections } = useAmazonConnections();

  // Shopify (current month)
  const [shopifyLoading, setShopifyLoading] = useState(false);
  const [shopifyError, setShopifyError] = useState<string | null>(null);
  const [shopifyRows, setShopifyRows] = useState<any[]>([]);
  const shopify = shopifyRows?.[0] || null;

  // Shopify (previous month)
  const [shopifyPrevRows, setShopifyPrevRows] = useState<any[]>([]);

  // Shopify store info
  const [shopifyStore, setShopifyStore] = useState<any | null>(null);

  // which region tab is selected in the Amazon card
  const [amazonRegion, setAmazonRegion] = useState<RegionKey>("Global");

  // which region is selected in the P&L graph
  const [graphRegion, setGraphRegion] = useState<RegionKey>("Global");


  const chartRef = React.useRef<HTMLDivElement | null>(null);
  const prevLabel = useMemo(() => getPrevMonthShortLabel(), []);

  // ✅ put near other helpers
  const getDayOfMonthIST = () => {
    const now = new Date();
    const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    return ist.getDate(); // 1..31
  };

  // ✅ add state to "lock" today's sales (in BI currency)
  const [todaySalesRaw, setTodaySalesRaw] = useState<number>(0);


  /* ===================== ✅ SHARED RANGE STATE (PARENT) ===================== */
  const [selectedStartDay, setSelectedStartDay] = useState<number | null>(null);
  const [selectedEndDay, setSelectedEndDay] = useState<number | null>(null);

  const [biLoading, setBiLoading] = useState(false);
  const [biError, setBiError] = useState<string | null>(null);
  const [biDailySeries, setBiDailySeries] = useState<DailySeries | null>(null);
  const [biPeriods, setBiPeriods] = useState<BiApiResponse["periods"] | null>(null);
  const [liveBiPayload, setLiveBiPayload] = useState<BiApiResponse | null>(null);
  const [biAlignedTotals, setBiAlignedTotals] = useState<BiAlignedTotals | null>(null);

  /* ===================== FX RATES ===================== */
  const [gbpToUsd, setGbpToUsd] = useState(GBP_TO_USD_ENV);
  const [inrToUsd, setInrToUsd] = useState(INR_TO_USD_ENV);
  const [cadToUsd, setCadToUsd] = useState(CAD_TO_USD_ENV);
  const [fxLoading, setFxLoading] = useState(false);

  const fetchFxRates = useCallback(async () => {
    try {
      setFxLoading(true);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) (headers as any).Authorization = `Bearer ${token}`;

      const { monthName, year } = getISTYearMonth();
      const month = monthName.toLowerCase();

      const commonBody = {
        month,
        year,
        fetch_if_missing: true,
        seed_all: true,
      };

      const [ukRes, inrRes, cadRes] = await Promise.all([
        fetch(FX_ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...commonBody,
            user_currency: "gbp",
            country: "uk",
            selected_currency: "usd",
          }),
        }),
        fetch(FX_ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...commonBody,
            user_currency: "inr",
            country: "india",
            selected_currency: "usd",
          }),
        }),
        fetch(FX_ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...commonBody,
            user_currency: "cad",
            country: "ca",
            selected_currency: "usd",
          }),
        }),
      ]);

      if (ukRes.ok) {
        const json = await ukRes.json();
        console.log("💱 GBP → USD FX response:", json);

        const rate = json?.record?.conversion_rate;
        if (json?.success && rate != null) {
          setGbpToUsd(Number(rate));
          console.log("✅ GBP → USD rate used:", Number(rate));
        }
      }

      if (inrRes.ok) {
        const json = await inrRes.json();
        console.log("💱 INR → USD FX response:", json);

        const rate = json?.record?.conversion_rate;
        if (json?.success && rate != null) {
          setInrToUsd(Number(rate));
          console.log("✅ INR → USD rate used:", Number(rate));
        }
      }

      if (cadRes.ok) {
        const json = await cadRes.json();
        console.log("💱 CAD → USD FX response:", json);

        const rate = json?.record?.conversion_rate;
        if (json?.success && rate != null) {
          setCadToUsd(Number(rate));
          console.log("✅ CAD → USD rate used:", Number(rate));
        }
      }
    } catch (err) {
      console.error("Failed to fetch FX rates", err);
    } finally {
      setFxLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log("📊 FINAL FX RATES IN USE", {
      GBP_TO_USD: gbpToUsd,
      INR_TO_USD: inrToUsd,
      CAD_TO_USD: cadToUsd,
      displayCurrency,
    });
  }, [gbpToUsd, inrToUsd, cadToUsd, displayCurrency]);


  useEffect(() => {
    fetchFxRates();
  }, [fetchFxRates]);

  const forcedRegion: RegionKey = useMemo(() => {
    switch (platform) {
      case "amazon-uk":
        return "UK";
      case "amazon-us":
        return "US";
      case "amazon-ca":
        return "CA";
      default:
        return "Global";
    }
  }, [platform]);

  const graphRegionToUse: RegionKey = isCountryMode ? forcedRegion : graphRegion;

  useEffect(() => {
    if (!isCountryMode) return;
    setGraphRegion(forcedRegion);
    setAmazonRegion(forcedRegion);
  }, [isCountryMode, forcedRegion]);

  // ✅ which region is selected in the Sales Target card
  const [targetRegion, setTargetRegion] = useState<RegionKey>(
    isCountryMode ? forcedRegion : "Global"
  );

  useEffect(() => {
    if (isCountryMode) setTargetRegion(forcedRegion);
  }, [isCountryMode, forcedRegion]);


  /* ===================== CONVERSION + FORMATTING (DISPLAY CURRENCY) ===================== */
  const convertToDisplayCurrency = useCallback(
    (value: number | null | undefined, from: CurrencyCode) => {
      const n = toNumberSafe(value ?? 0);
      if (!n) return 0;

      // from -> USD
      let usd = n;
      if (from === "GBP") usd = n * gbpToUsd;
      if (from === "INR") usd = n * inrToUsd;
      if (from === "CAD") usd = n * cadToUsd;

      // USD -> displayCurrency
      if (displayCurrency === "USD") return usd;
      if (displayCurrency === "GBP") return gbpToUsd ? usd / gbpToUsd : usd;
      if (displayCurrency === "INR") return inrToUsd ? usd / inrToUsd : usd;
      if (displayCurrency === "CAD") return cadToUsd ? usd / cadToUsd : usd;

      return usd;
    },
    [displayCurrency, gbpToUsd, inrToUsd, cadToUsd]
  );

  const prevFullMonthNetSalesDisp = useMemo(() => {
    const v = liveBiPayload?.aligned_totals?.total_previous_net_sales_full_month;
    if (v == null) return 0;
    return convertToDisplayCurrency(Number(v) || 0, biSourceCurrency);
  }, [liveBiPayload, convertToDisplayCurrency, biSourceCurrency]);

  /* ===================== INTEGRATION FLAGS ===================== */
  const shopifyDeriv = useMemo(() => {
    if (!shopify) return null;
    const totalOrders = toNumberSafe(shopify.total_orders);
    const netSales = toNumberSafe(shopify.net_sales);
    return { totalOrders, netSales };
  }, [shopify]);

  const shopifyPrevDeriv = useMemo(() => {
    const row = shopifyPrevRows?.[0];
    if (!row) return null;
    const netSales = toNumberSafe(row.net_sales);
    const totalOrders = toNumberSafe(row.total_orders);
    return { netSales, totalOrders };
  }, [shopifyPrevRows]);

  // ✅ Global FULL month target = Amazon(previous full month from BI) + Shopify(previous month total)
  const globalPrevFullMonthNetSalesDisp = useMemo(() => {
    const amazonFull = prevFullMonthNetSalesDisp; // already in display currency
    const shopifyFull = convertToDisplayCurrency(shopifyPrevDeriv?.netSales ?? 0, "INR");
    return amazonFull + shopifyFull;
  }, [prevFullMonthNetSalesDisp, shopifyPrevDeriv?.netSales, convertToDisplayCurrency]);


  const formatDisplayAmount = useCallback(
    (value: number | null | undefined) => {
      const n = toNumberSafe(value ?? 0);

      switch (displayCurrency) {
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
    [displayCurrency]
  );




  const formatDisplayK = useCallback(
    (value: number | null | undefined) => {
      const n = toNumberSafe(value ?? 0);
      const abs = Math.abs(n);
      const isK = abs >= 1000;

      const displayVal = isK ? n / 1000 : n;
      const suffix = isK ? "k" : "";

      return `${formatDisplayAmount(displayVal)}${suffix}`;
    },
    [formatDisplayAmount]
  );

  const currencySymbol =
    displayCurrency === "USD"
      ? "$"
      : displayCurrency === "GBP"
        ? "£"
        : displayCurrency === "CAD"
          ? "CA$"
          : displayCurrency === "INR"
            ? "₹"
            : "¤";

  const biDailySeriesHome = useMemo(() => {
    if (!biDailySeries) return null;

    const convPoint = (p: DailyPoint): DailyPoint => ({
      ...p,
      net_sales: p.net_sales != null ? convertToDisplayCurrency(p.net_sales, biDataCurrency) : p.net_sales,
      product_sales: p.product_sales != null ? convertToDisplayCurrency(p.product_sales, biDataCurrency) : p.product_sales,
      profit: p.profit != null ? convertToDisplayCurrency(p.profit, biDataCurrency) : p.profit,
      cm2_profit: p.cm2_profit != null ? convertToDisplayCurrency(p.cm2_profit, biDataCurrency) : p.cm2_profit,
    });

    return {
      previous: (biDailySeries.previous || []).map(convPoint),
      current_mtd: (biDailySeries.current_mtd || []).map(convPoint),
    };
  }, [biDailySeries, convertToDisplayCurrency, biDataCurrency]);


  /* ===================== AMAZON FETCH ===================== */
  const fetchAmazon = useCallback(async () => {
    setLoading(true);
    setUnauthorized(false);
    setError(null);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

      if (!token) {
        setUnauthorized(true);
        throw new Error("No token found. Please sign in.");
      }

      // ✅ decide country from platform
      const uiCountry =
        platform === "amazon-us" ? "us" : platform === "amazon-ca" ? "ca" : "uk";

      // ✅ marketplace id (fallback to UK one you provided)
      const marketplaceId =
        (amazonConnections?.find?.((c: any) => (c?.country || "").toLowerCase() === uiCountry)
          ?.marketplace_id) ||
        (uiCountry === "uk"
          ? "A1F83G8C2ARO7P"
          : uiCountry === "us"
            ? "ATVPDKIKX0DER"
            : uiCountry === "ca"
              ? "A2EUQ1WTGCTBG2"
              : "A1F83G8C2ARO7P");

      const params = new URLSearchParams({
        marketplace_id: marketplaceId,
        store_in_db: "true",
        country: uiCountry,
      });

      const url = `${FIN_MTD_TX_ENDPOINT}?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "omit",
      });

      if (res.status === 401) {
        setUnauthorized(true);
        throw new Error("Unauthorized — token missing/invalid/expired.");
      }

      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || `Request failed: ${res.status}`);
      }

      setData(json); // ✅ data now matches your new response shape
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [platform, amazonConnections]);


  /* ===================== SHOPIFY STORE INFO ===================== */
  useEffect(() => {
    const fetchShopifyStore = async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
        if (!token) return;

        const res = await fetch(`${baseURL}/shopify/store`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return;

        const d = await res.json();
        if (!res.ok || d?.error) return;

        setShopifyStore(d);
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
        typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
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
        headers: { Accept: "application/json", Authorization: `Bearer ${user_token}` },
        credentials: "omit",
      });

      if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
      if (!res.ok) throw new Error(`Shopify request failed: ${res.status}`);

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
        typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
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
        headers: { Accept: "application/json", Authorization: `Bearer ${user_token}` },
        credentials: "omit",
      });

      if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
      if (!res.ok) throw new Error(`Shopify (prev) request failed: ${res.status}`);

      const json = await res.json();
      const row = json?.last_row_data ? json.last_row_data : null;
      setShopifyPrevRows(row ? [row] : []);
    } catch (e: any) {
      console.warn("Shopify prev-month fetch failed:", e?.message);
      setShopifyPrevRows([]);
    }
  }, [shopifyStore]);






  /* ===================== ✅ SHARED BI FETCH (FOR CARDS + GRAPH) ===================== */
  const { monthName: currMonthName, year: currYear } = getISTYearMonth();

  const lastBiKeyRef = useRef<string>("");



  const fetchBiSeries = useCallback(
    async (startDay?: number | null, endDay?: number | null) => {
      if (!showLiveBI) return;

      const normalized = (biCountryName || "").toLowerCase();

      if (!normalized || normalized === "global") return;


      const rangeActive = startDay != null && endDay != null;

      const key = JSON.stringify({
        country: normalized,
        ranged: "MTD",
        month: currMonthName.toLowerCase(),
        year: currYear,
        startDay: rangeActive ? startDay : null,
        endDay: rangeActive ? endDay : null,
      });

      if (lastBiKeyRef.current === key) return;
      lastBiKeyRef.current = key;

      setBiLoading(true);
      setBiError(null);

      // if (rangeActive) {
      //   setBiAlignedTotals(null);
      // }

      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

        const params = new URLSearchParams({
          countryName: normalized,
          ranged: "MTD",
          month: currMonthName.toLowerCase(),
          year: String(currYear),
          generate_ai_insights: "false",
        });

        // ✅ only send range params when rangeActive
        if (rangeActive) {
          params.set("start_day", String(startDay));
          params.set("end_day", String(endDay));
        }

        const res = await fetch(`${LIVE_MTD_BI_ENDPOINT}?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const json: BiApiResponse = await res.json();
        if (!res.ok) throw new Error((json as any)?.error || "Failed to load BI series");

        setLiveBiPayload(json);
        setBiPeriods(json?.periods || null);
        setBiDailySeries(json?.daily_series || null);

        setBiAlignedTotals(json?.aligned_totals || null);
      } catch (e: any) {
        setBiPeriods(null);
        setBiDailySeries(null);
        setBiAlignedTotals(null);
        setBiError(e?.message || "Failed to load BI series");
      } finally {
        setBiLoading(false);
      }
    },
    [showLiveBI, biCountryName, currMonthName, currYear]

  );


  useEffect(() => {
    if (!showLiveBI) return;
    fetchBiSeries(selectedStartDay, selectedEndDay);
  }, [showLiveBI, fetchBiSeries, selectedStartDay, selectedEndDay]);

  /* ===================== REFRESH ALL ===================== */
  const refreshAll = useCallback(async () => {
    await fetchAmazon();
    if (shopifyStore?.shop_name && shopifyStore?.access_token) {
      await Promise.all([fetchShopify(), fetchShopifyPrev()]);
    }
    // also refresh BI (keep current selected range)
    // if (showLiveBI) {
    //   await fetchBiSeries(selectedStartDay, selectedEndDay);
    // }
  }, [
    fetchAmazon,
    fetchShopify,
    fetchShopifyPrev,
    shopifyStore,
    // showLiveBI,
    // fetchBiSeries,
    // selectedStartDay,
    // selectedEndDay,
  ]);

  // useEffect(() => {
  //   refreshAll();
  // }, [refreshAll]);

  const didRefreshRef = useRef(false);

  useEffect(() => {
    if (didRefreshRef.current) return;
    didRefreshRef.current = true;

    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  /* ===================== AMAZON DERIVED DATA ===================== */
  const totals = data?.totals || null;
  const derived = data?.derived_totals || null;

  const uk = useMemo(() => {
    const netSalesGBP = derived?.net_sales != null ? toNumberSafe(derived.net_sales) : null;
    const aspGBP = derived?.asp != null ? toNumberSafe(derived.asp) : null;
    const cm2ProfitGBP =
      derived?.cm2_profit != null ? toNumberSafe(derived.cm2_profit) : null;

    const cogsGBP = totals?.cogs != null ? toNumberSafe(totals.cogs) : 0;
    const fbaFeesGBP = totals?.fba_fees != null ? toNumberSafe(totals.fba_fees) : 0;
    const sellingFeesGBP = totals?.selling_fees != null ? toNumberSafe(totals.selling_fees) : 0;

    // ✅ your backend already computed amazon_fees = selling + fba, but we can compute too
    const amazonFeesGBP =
      derived?.amazon_fees != null
        ? toNumberSafe(derived.amazon_fees)
        : (fbaFeesGBP + sellingFeesGBP);

    const profitGBP = derived?.profit != null ? toNumberSafe(derived.profit) : null;

    const unitsGBP = totals?.quantity != null ? toNumberSafe(totals.quantity) : null;


    let profitPctGBP: number | null = null;
    if (cm2ProfitGBP !== null && netSalesGBP && netSalesGBP !== 0) {
      profitPctGBP = (cm2ProfitGBP / netSalesGBP) * 100;
    }


    const grossSalesGBP =
      totals?.product_sales != null ? toNumberSafe(totals.product_sales) : null; // ✅ current gross

    const advertisingGBP =
      derived?.advertising_fees != null ? toNumberSafe(derived.advertising_fees) : 0;

    const platformFeeGBP =
      derived?.platform_fee != null ? toNumberSafe(derived.platform_fee) : 0;


    return {
      unitsGBP,
      netSalesGBP,
      grossSalesGBP,
      aspGBP,
      profitGBP,
      cm2ProfitGBP,
      profitPctGBP,
      cogsGBP,
      amazonFeesGBP,
      advertisingGBP,
      platformFeeGBP,
    };
  }, [totals, derived]);

  const safeDeltaPct = (current: number, previous: number) => {
    const c = Number(current) || 0;
    const p = Number(previous) || 0;
    if (!p) return null;
    return ((c - p) / p) * 100;
  };



  const prevTotals = data?.previous_period?.totals || null;

  const prev = useMemo(() => {
    return {
      quantity: toNumberSafe(prevTotals?.quantity ?? 0),
      netSales: toNumberSafe(prevTotals?.net_sales ?? 0),
      grossSales: toNumberSafe(prevTotals?.gross_sales ?? 0), // ✅ add
      asp: toNumberSafe(prevTotals?.asp ?? 0),
      profit: toNumberSafe(prevTotals?.profit ?? 0),
      cm2Profit: toNumberSafe(prevTotals?.cm2_profit ?? 0),
      profitPct: toNumberSafe(prevTotals?.profit_percentage ?? 0),
    };
  }, [prevTotals]);




  const curr = useMemo(() => {
    return {
      quantity: toNumberSafe(totals?.quantity ?? 0),
      netSales: toNumberSafe(derived?.net_sales ?? 0),
      asp: toNumberSafe(derived?.asp ?? 0),
      profit: toNumberSafe(derived?.profit ?? 0),
      profitPct: toNumberSafe(uk.profitPctGBP ?? 0),
    };
  }, [totals, derived, uk.profitPctGBP]);

  const deltas = useMemo(() => {
    return {
      quantityPct: safeDeltaPct(curr.quantity, prev.quantity),
      netSalesPct: safeDeltaPct(curr.netSales, prev.netSales),
      aspPct: safeDeltaPct(curr.asp, prev.asp),
      profitPct: safeDeltaPct(curr.profit, prev.profit),

      // Profit % must be percentage-points (pp)
      profitMarginPctPts:
        curr.profitPct != null && prev.profitPct != null
          ? Number(curr.profitPct) - Number(prev.profitPct)
          : null,
    };
  }, [curr, prev]);

  const deltaPctPoints = (currentPct: number, previousPct: number) => {
    const c = Number(currentPct) || 0;
    const p = Number(previousPct) || 0;
    return c - p; // percentage points
  };


  /* ===================== ✅ RANGE KPIs FOR CARDS (FROM SAME BI DATA AS GRAPH) ===================== */
  // useEffect(() => {
  //   const pts = biDailySeriesHome?.current_mtd || [];
  //   if (!pts.length) return;

  //   const todayDay = getDayOfMonthIST();

  //   const todayPoint = pts.find((p) => Number(p.date?.slice(8, 10)) === todayDay);

  //   if (todayPoint?.net_sales != null) {
  //     setTodaySalesRaw(Number(todayPoint.net_sales) || 0); // now "raw" is actually HOME currency
  //   }
  // }, [biDailySeriesHome]);

  useEffect(() => {
    const pts = biDailySeriesHome?.current_mtd || [];
    if (!pts.length) return;

    const todayDay = getDayOfMonthIST();

    // try exact today
    const exact = pts.find((p) => Number(p.date?.slice(8, 10)) === todayDay);
    if (exact?.net_sales != null) {
      setTodaySalesRaw(Number(exact.net_sales) || 0);
      return;
    }

    // fallback: latest available day in series
    const latest = [...pts].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
    setTodaySalesRaw(Number(latest?.net_sales) || 0);
  }, [biDailySeriesHome]);


  const biCardKpis = useMemo(() => {
    const currAll = biDailySeriesHome?.current_mtd || [];
    const prevAll = biDailySeriesHome?.previous || [];

    const currPts = sliceByDayRange(currAll, selectedStartDay, selectedEndDay);
    const prevPts = sliceByDayRange(prevAll, selectedStartDay, selectedEndDay);

    const sum = (arr: DailyPoint[], key: keyof DailyPoint) =>
      arr.reduce((a, d) => a + (Number(d[key]) || 0), 0);

    const curr = {
      units: sum(currPts, "quantity"),
      netSales: sum(currPts, "net_sales"),
      grossSales: sum(currPts, "product_sales"),
      profit: sum(currPts, "profit"),
      cm2Profit: sum(currPts, "cm2_profit"),
    };

    const prev = {
      units: sum(prevPts, "quantity"),
      netSales: sum(prevPts, "net_sales"),
      grossSales: sum(prevPts, "product_sales"),
      profit: sum(prevPts, "profit"),
      cm2Profit: sum(prevPts, "cm2_profit"),
    };

    const currAsp = curr.units > 0 ? curr.netSales / curr.units : 0;
    const prevAsp = prev.units > 0 ? prev.netSales / prev.units : 0;

    const currProfitPct = curr.netSales !== 0 ? (curr.cm2Profit / curr.netSales) * 100 : 0;
    const prevProfitPct = prev.netSales !== 0 ? (prev.cm2Profit / prev.netSales) * 100 : 0;

    const deltaPct = (c: number, p: number) => (p ? ((c - p) / p) * 100 : null);

    return {
      curr: { ...curr, asp: currAsp, profitPct: currProfitPct },
      prev: { ...prev, asp: prevAsp, profitPct: prevProfitPct },
      deltas: {
        units: deltaPct(curr.units, prev.units),
        netSales: deltaPct(curr.netSales, prev.netSales),
        grossSales: deltaPct(curr.grossSales, prev.grossSales),
        asp: deltaPct(currAsp, prevAsp),
        profit: deltaPct(curr.profit, prev.profit),
        profitPct: safeDeltaPctFromPct(currProfitPct, prevProfitPct),

      },
    };
  }, [biDailySeriesHome, selectedStartDay, selectedEndDay]);

  // const rangeActive = selectedStartDay != null && selectedEndDay != null;
  const rangeActive = selectedStartDay != null && selectedEndDay != null;

  // use BI only when a range is active
  const useBiCm2 = showLiveBI && rangeActive;

  // BI values are usable only when rangeActive + finished loading + response present
  const cm2Ready = useBiCm2 && !biLoading && !!biAlignedTotals;

  const globalRangeCurrency = currencyForCountry(biCountryName); // global -> "uk" -> "GBP"
  const globalUseBi = platform === "global" && showLiveBI && rangeActive;
  const globalCm2Ready = globalUseBi && !biLoading && !!biAlignedTotals;

  const shopifyNotConnected =
    !shopifyStore?.shop_name ||
    !shopifyStore?.access_token ||
    (shopifyError &&
      (shopifyError.toLowerCase().includes("shopify store not connected") ||
        shopifyError.toLowerCase().includes("no token")));

  const shopifyIntegrated = !shopifyNotConnected && !!shopify;

  const amazonIntegrated =
    Array.isArray(amazonConnections) && amazonConnections.length > 0;

  const noIntegrations = !amazonIntegrated && !shopifyIntegrated;

  /* ===================== GLOBAL / FX COMBINED (BASE USD DATA) ===================== */
  const amazonUK_USD = useMemo(() => {
    const amazonUK_GBP = toNumberSafe(uk.netSalesGBP);
    return amazonUK_GBP * gbpToUsd;
  }, [uk.netSalesGBP, gbpToUsd]);

  const combinedUSD = useMemo(() => {
    const aUK = amazonUK_USD;
    const shopifyUSD = toNumberSafe(shopifyDeriv?.netSales) * inrToUsd;
    return aUK + shopifyUSD;
  }, [amazonUK_USD, shopifyDeriv?.netSales, inrToUsd]);

  const prevAmazonMtdSalesGBP = toNumberSafe(data?.previous_period?.totals?.net_sales ?? 0);
  const prevAmazonMtdSalesUSD = prevAmazonMtdSalesGBP * gbpToUsd;

  const prevAmazonUKTotalUSD = useMemo(() => {
    const prevTotalGBP = toNumberSafe(data?.previous_month_total_net_sales?.total);
    if (prevTotalGBP > 0) return prevTotalGBP * gbpToUsd;

    // fallback: estimate full last-month total from last-month MTD
    const { todayDay, daysInPrevMonth } = getISTDayInfo();
    if (!todayDay || !daysInPrevMonth) return 0;

    // prevAmazonMtdSalesUSD is already last month MTD (USD)
    return (prevAmazonMtdSalesUSD * daysInPrevMonth) / todayDay;
  }, [data?.previous_month_total_net_sales?.total, gbpToUsd, prevAmazonMtdSalesUSD]);


  const amazonUK_Gross_USD = useMemo(() => {
    const grossGBP = toNumberSafe(totals?.product_sales); // ✅ current gross
    return grossGBP * gbpToUsd;
  }, [totals?.product_sales, gbpToUsd]);



  const combinedGrossUSD = useMemo(() => {
    const shopifyUSD = toNumberSafe(shopifyDeriv?.netSales) * inrToUsd;
    return amazonUK_Gross_USD + shopifyUSD;
  }, [amazonUK_Gross_USD, shopifyDeriv?.netSales, inrToUsd]);

  const prevAmazonGrossUSD = useMemo(() => {
    return toNumberSafe(prev.grossSales) * gbpToUsd; // prev gross in GBP → USD
  }, [prev.grossSales, gbpToUsd]);

  const prevGlobalGrossUSD = useMemo(() => {
    const prevShopifyUSD = toNumberSafe(shopifyPrevDeriv?.netSales) * inrToUsd; // shopify gross not available; using net like you do elsewhere
    return prevAmazonGrossUSD + prevShopifyUSD;
  }, [prevAmazonGrossUSD, shopifyPrevDeriv?.netSales, inrToUsd]);


  const fallbackTargetUSD = useMemo(() => {
    return prevAmazonUKTotalUSD > 0 ? prevAmazonUKTotalUSD : 0;
  }, [prevAmazonUKTotalUSD]);


  const prevShopifyTotalUSD = useMemo(() => {
    const prevINRTotal = toNumberSafe(shopifyPrevDeriv?.netSales);
    return prevINRTotal * inrToUsd;
  }, [shopifyPrevDeriv, inrToUsd]);


  const globalPrevTotalUSD = prevShopifyTotalUSD + prevAmazonUKTotalUSD;


  const chooseLastMonthTotal = (manualUSD: number, computedUSD: number) =>
    USE_MANUAL_LAST_MONTH && manualUSD > 0 ? manualUSD : computedUSD;

  const prorateToDate = (lastMonthTotalUSD: number) => {
    const { todayDay, daysInPrevMonth } = getISTDayInfo();
    return daysInPrevMonth > 0 ? (lastMonthTotalUSD * todayDay) / daysInPrevMonth : 0;
  };




  // ---------- NET SALES (DISPLAY CURRENCY) ----------

  // Amazon current & prev net sales (already correct source)
  const amazonCurrNetDisp = useMemo(
    () => convertToDisplayCurrency(uk.netSalesGBP ?? 0, "GBP"),
    [uk.netSalesGBP, convertToDisplayCurrency]
  );

  const amazonPrevNetDisp = useMemo(
    () => convertToDisplayCurrency(prev.netSales ?? 0, "GBP"),
    [prev.netSales, convertToDisplayCurrency]
  );

  // Global = Amazon + Shopify (NET SALES ONLY)
  const globalCurrNetDisp = useMemo(() => {
    const amazon = amazonCurrNetDisp;
    const shopify = convertToDisplayCurrency(
      shopifyDeriv?.netSales ?? 0,
      "INR"
    );
    return amazon + shopify;
  }, [amazonCurrNetDisp, shopifyDeriv?.netSales, convertToDisplayCurrency]);

  const globalPrevNetDisp = useMemo(() => {
    const amazon = amazonPrevNetDisp;
    const shopify = convertToDisplayCurrency(
      shopifyPrevDeriv?.netSales ?? 0,
      "INR"
    );
    return amazon + shopify;
  }, [amazonPrevNetDisp, shopifyPrevDeriv?.netSales, convertToDisplayCurrency]);


  const regions = useMemo(() => {
    const globalLastMonthTotal = chooseLastMonthTotal(
      MANUAL_LAST_MONTH_USD_GLOBAL,
      globalPrevTotalUSD
    );

    const globalTarget =
      globalPrevFullMonthNetSalesDisp > 0 ? globalPrevFullMonthNetSalesDisp : globalPrevNetDisp;

    const global: RegionMetrics = {
      mtdUSD: globalCurrNetDisp,
      lastMonthToDateUSD: globalPrevNetDisp,   // prev MTD
      lastMonthTotalUSD: globalTarget,         // ✅ prev FULL month total
      targetUSD: globalTarget,                 // ✅ target = prev FULL month total
      decTargetUSD: globalTarget,
    };

    const ukTarget =
      prevFullMonthNetSalesDisp > 0 ? prevFullMonthNetSalesDisp : amazonPrevNetDisp;

    const ukRegion: RegionMetrics = {
      mtdUSD: amazonCurrNetDisp,
      lastMonthToDateUSD: amazonPrevNetDisp,
      lastMonthTotalUSD: ukTarget,
      targetUSD: ukTarget,
      // ✅ Dec target
      decTargetUSD: ukTarget,
    };


    const ukLastMonthTotal = chooseLastMonthTotal(
      MANUAL_LAST_MONTH_USD_UK,
      prevAmazonUKTotalUSD
    );



    const usLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_US, 0);
    const usRegion: RegionMetrics = {
      mtdUSD: 0,
      lastMonthToDateUSD: prorateToDate(usLastMonthTotal),
      lastMonthTotalUSD: usLastMonthTotal,
      targetUSD: usLastMonthTotal,
      decTargetUSD: usLastMonthTotal,
    };

    const caLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_CA, 0);
    const caRegion: RegionMetrics = {
      mtdUSD: 0,
      lastMonthToDateUSD: prorateToDate(caLastMonthTotal),
      lastMonthTotalUSD: caLastMonthTotal,
      targetUSD: caLastMonthTotal,
      // ✅ Dec target (fallback)
      decTargetUSD: caLastMonthTotal,
    };

    return {
      Global: global,
      UK: ukRegion,
      US: usRegion,
      CA: caRegion,
    } as Record<RegionKey, RegionMetrics>;
  }, [
    globalCurrNetDisp,
    globalPrevNetDisp,
    amazonCurrNetDisp,
    amazonPrevNetDisp,
    prevFullMonthNetSalesDisp,
    globalPrevFullMonthNetSalesDisp,
  ]);


  const anyLoading = loading || shopifyLoading;

  const amazonTabs = useMemo<RegionKey[]>(() => {
    const tabs: RegionKey[] = [];
    (["UK", "US", "CA"] as RegionKey[]).forEach((key) => {
      const r = regions[key];
      if (!r) return;
      if (r.mtdUSD || r.lastMonthToDateUSD || r.lastMonthTotalUSD || r.targetUSD) tabs.push(key);
    });
    return tabs;
  }, [regions]);

  useEffect(() => {
    if (amazonTabs.length && !amazonTabs.includes(amazonRegion)) setAmazonRegion(amazonTabs[0]);
  }, [amazonTabs, amazonRegion]);

  const graphRegions = useMemo<RegionKey[]>(() => {
    const list: RegionKey[] = ["Global"];
    (["UK", "US", "CA"] as RegionKey[]).forEach((key) => {
      const r = regions[key];
      if (!r) return;
      if (r.mtdUSD || r.lastMonthToDateUSD || r.lastMonthTotalUSD || r.targetUSD) list.push(key);
    });
    return list;
  }, [regions]);

  useEffect(() => {
    if (!graphRegions.includes(graphRegion)) setGraphRegion("Global");
  }, [graphRegions, graphRegion]);

  const onlyAmazon = amazonIntegrated && !shopifyIntegrated;
  const onlyShopify = shopifyIntegrated && !amazonIntegrated;

  /* ===================== P&L ITEMS (DISPLAY CURRENCY OUTPUT) ===================== */
  const plItems = useMemo(() => {
    const ukPl = () => {
      const sales = convertToDisplayCurrency(uk.netSalesGBP ?? 0, "GBP");
      const fees = convertToDisplayCurrency(uk.amazonFeesGBP ?? 0, "GBP");
      const cogs = convertToDisplayCurrency(uk.cogsGBP ?? 0, "GBP");
      const adv = convertToDisplayCurrency(uk.advertisingGBP ?? 0, "GBP");

      const others = convertToDisplayCurrency(uk.platformFeeGBP ?? 0, "GBP"); // you renamed Platform Fees → Others
      const cm1 = convertToDisplayCurrency(uk.profitGBP ?? 0, "GBP");         // you renamed Profit → CM1 Profit
      const cm2 = convertToDisplayCurrency(uk.cm2ProfitGBP ?? 0, "GBP");

      // ✅ NEW: Tax & Credits from totals.tax_and_credits
      const taxCredits = convertToDisplayCurrency(
        toNumberSafe(totals?.tax_and_credits ?? 0),
        "GBP"
      );

      return [
        { label: "Net Sales", raw: sales, display: formatDisplayAmount(sales) },
        { label: "COGS", raw: cogs, display: formatDisplayAmount(cogs) },
        { label: "Amazon Fees", raw: fees, display: formatDisplayAmount(fees) },
        { label: "Tax & Credits", raw: taxCredits, display: formatDisplayAmount(taxCredits) },
        { label: "CM1 Profit", raw: cm1, display: formatDisplayAmount(cm1) },
        { label: "Advertisements", raw: adv, display: formatDisplayAmount(adv) },
        { label: "Others", raw: others, display: formatDisplayAmount(others) },
        { label: "CM2 Profit", raw: cm2, display: formatDisplayAmount(cm2) },
      ];
    };


    if (graphRegionToUse === "Global") {
      if (onlyAmazon) return ukPl();

      if (onlyShopify) {
        const sales = convertToDisplayCurrency(shopifyDeriv?.netSales ?? 0, "INR");
        return [
          { label: "Net Sales", raw: sales, display: formatDisplayAmount(sales) },
          { label: "Amazon Fees", raw: 0, display: formatDisplayAmount(0) },
          { label: "COGS", raw: 0, display: formatDisplayAmount(0) },
          { label: "Advertisements", raw: 0, display: formatDisplayAmount(0) },
          { label: "Other Charges", raw: 0, display: formatDisplayAmount(0) },
          { label: "Profit", raw: 0, display: formatDisplayAmount(0) },
        ];
      }

      const sales = convertToDisplayCurrency(combinedUSD, "USD");
      return [
        { label: "Sales", raw: sales, display: formatDisplayAmount(sales) },
        { label: "Amazon Fees", raw: 0, display: formatDisplayAmount(0) },
        { label: "COGS", raw: 0, display: formatDisplayAmount(0) },
        { label: "Advertisements", raw: 0, display: formatDisplayAmount(0) },
        { label: "Other Charges", raw: 0, display: formatDisplayAmount(0) },
        { label: "Profit", raw: 0, display: formatDisplayAmount(0) },
      ];
    }

    if (graphRegionToUse === "UK") return ukPl();

    const zero = formatDisplayAmount(0);
    return [
      { label: "Sales", raw: 0, display: zero },
      { label: "Amazon Fees", raw: 0, display: zero },
      { label: "COGS", raw: 0, display: zero },
      { label: "Advertisements", raw: 0, display: zero },
      { label: "Other Charges", raw: 0, display: zero },
      { label: "Profit", raw: 0, display: zero },
    ];
  }, [
    graphRegionToUse,
    onlyAmazon,
    onlyShopify,
    combinedUSD,
    totals?.tax_and_credits,
    uk.netSalesGBP,
    uk.amazonFeesGBP,
    uk.cogsGBP,
    uk.advertisingGBP,
    uk.platformFeeGBP,
    uk.profitGBP,
    shopifyDeriv?.netSales,
    convertToDisplayCurrency,
    formatDisplayAmount,
  ]);

  // ✅ remove empty categories so bars don't get spaced out
  const chartItems = useMemo(() => {
    return (plItems || []).filter((i) => {
      const v = Number(i?.raw ?? 0);
      // keep only meaningful values
      return Math.abs(v) > 1e-9;
    });
  }, [plItems]);

  const labels = chartItems.map((i) => i.label);
  const values = chartItems.map((i) => Number(i.raw ?? 0));

  const colorMapping: Record<string, string> = {
    "Net Sales": "#2CA9E0",
    "Amazon Fees": "#FFBE25",
    COGS: "#AB64B5",
    Advertisements: "#F47A00",
    "Tax & Credits": "#C03030",
    // "Other Charges": "#00627D",
    Others: "#01627F",
    "CM1 Profit": "#87AD12",
    "CM2 Profit": "#2DA49A",

  };

  const colors = labels.map((label) => colorMapping[label] || "#2CA9E0");

  const allValuesZero = values.length === 0 || values.every((v) => !v || v === 0);


  /* ===================== EXCEL EXPORT (USES displayCurrency symbol) ===================== */
  const captureChartPng = useCallback(async () => {
    const container = chartRef.current;
    if (!container) return null;

    const canvas = container.querySelector("canvas") as HTMLCanvasElement | null;
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
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const shortMonForGraph = new Date(`${currMonthName} 1, ${currYear}`).toLocaleString("en-US", {
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  const formattedMonthYear = `${shortMonForGraph}'${String(currYear).slice(-2)}`;

  const countryNameForGraph =
    graphRegionToUse === "Global" ? "global" : graphRegionToUse.toLowerCase();

  const handleDownload = useCallback(async () => {
    try {
      const pngDataUrl = await captureChartPng();

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Amazon P&L");

      sheet.addRow([brandName || "Brand"]);
      sheet.addRow([`Amazon P&L - ${formattedMonthYear}`]);
      sheet.addRow([`Country: ${countryNameForGraph.toUpperCase()}`]);
      sheet.addRow([`Currency: ${currencySymbol}`]);
      sheet.addRow([""]);

      sheet.addRow(["Metric", "", `Amount (${currencySymbol})`]);

      const signs: Record<string, string> = {
        "Net Sales": "(+)",
        "Amazon Fees": "(-)",
        COGS: "(-)",
        Advertisements: "(-)",
        "Tax & Credits": "(+/-)",
        "Other Charges": "(-)",
        Others: "(-)",
        "CM1 Profit": "",
        "CM2 Profit": "",
      };

      values.forEach((v, idx) => {
        const label = labels[idx];
        const sign = signs[label] || "";
        const num = Number(v || 0);
        sheet.addRow([label, sign, Number(num.toFixed(2))]);
      });

      const totalValue = values.reduce((acc, v) => acc + (Number(v) || 0), 0);
      sheet.addRow(["Total", "", Number(totalValue.toFixed(2))]);

      if (pngDataUrl) {
        const base64 = pngDataUrl.replace(/^data:image\/png;base64,/, "");
        const imageId = workbook.addImage({ base64, extension: "png" });

        sheet.addImage(
          imageId,
          { tl: { col: 0, row: 9 } as any, br: { col: 8, row: 28 } as any, editAs: "oneCell" } as any
        );
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `Amazon-PnL-${formattedMonthYear}.xlsx`);
    } catch (err) {
      console.error("Error generating Excel with chart", err);
    }
  }, [
    brandName,
    formattedMonthYear,
    countryNameForGraph,
    currencySymbol,
    captureChartPng,
    labels,
    values,
  ]);

  const todaySalesFromBI = useMemo(() => {
    const points = biDailySeries?.current_mtd || [];
    if (!points.length) return 0;

    // if range active, use sliced series (so "today" = last day in range)
    const pts = rangeActive
      ? sliceByDayRange(points, selectedStartDay, selectedEndDay)
      : points;

    if (!pts.length) return 0;

    // pick last point by date (safe even if API order changes)
    const last = [...pts].sort((a, b) => a.date.localeCompare(b.date)).at(-1);

    return Number(last?.net_sales) || 0;
  }, [biDailySeries, rangeActive, selectedStartDay, selectedEndDay]);

  const useBiForAmazonCards =
    showLiveBI && rangeActive && (isCountryMode || platform === "global");


  /* ===================== ✅ GLOBAL CARD: prev/current + deltas ===================== */

  // Global Units
  const globalCurrUnits = useMemo(() => {
    return toNumberSafe(totals?.quantity ?? 0) + toNumberSafe(shopifyDeriv?.totalOrders ?? 0);
  }, [totals?.quantity, shopifyDeriv?.totalOrders]);

  const globalPrevUnits = useMemo(() => {
    return toNumberSafe(prev.quantity ?? 0) + toNumberSafe(shopifyPrevDeriv?.totalOrders ?? 0);
  }, [prev.quantity, shopifyPrevDeriv?.totalOrders]);

  const globalCurrSalesDisp = useMemo(() => {
    return convertToDisplayCurrency(combinedUSD, "USD");
  }, [combinedUSD, convertToDisplayCurrency]);

  const globalPrevSalesDisp = useMemo(() => {
    return convertToDisplayCurrency(globalPrevTotalUSD, "USD");
  }, [globalPrevTotalUSD, convertToDisplayCurrency]);

  const globalCurrAsp = useMemo(() => {
    return globalCurrUnits > 0 ? globalCurrSalesDisp / globalCurrUnits : 0;
  }, [globalCurrSalesDisp, globalCurrUnits]);

  const globalPrevAsp = useMemo(() => {
    return globalPrevUnits > 0 ? globalPrevSalesDisp / globalPrevUnits : 0;
  }, [globalPrevSalesDisp, globalPrevUnits]);



  // ✅ Global card "Nov'25" should use previous_period (prev.*), not previous_month_total_net_sales/globalPrevTotalUSD.
  // When only Amazon is connected, Global == Amazon UK.

  const globalCurrNetSalesDisp = useMemo(() => {
    if (onlyAmazon) return convertToDisplayCurrency(uk.netSalesGBP ?? 0, "GBP");
    return convertToDisplayCurrency(combinedUSD, "USD");
  }, [onlyAmazon, uk.netSalesGBP, combinedUSD, convertToDisplayCurrency]);

  const globalPrevNetSalesDisp = useMemo(() => {
    if (onlyAmazon) return convertToDisplayCurrency(prev.netSales ?? 0, "GBP");
    // (optional) if Shopify prev exists, add it here later; for now keep your existing globalPrevTotalUSD
    return convertToDisplayCurrency(globalPrevTotalUSD, "USD");
  }, [onlyAmazon, prev.netSales, globalPrevTotalUSD, convertToDisplayCurrency]);

  const globalCurrAspDisp = useMemo(() => {
    return globalCurrUnits > 0 ? globalCurrNetSalesDisp / globalCurrUnits : 0;
  }, [globalCurrUnits, globalCurrNetSalesDisp]);

  const globalPrevAspDisp = useMemo(() => {
    return globalPrevUnits > 0 ? globalPrevNetSalesDisp / globalPrevUnits : 0;
  }, [globalPrevUnits, globalPrevNetSalesDisp]);


  const globalCurrCm2Disp = useMemo(() => {
    return convertToDisplayCurrency(uk.cm2ProfitGBP ?? 0, "GBP");
  }, [uk.cm2ProfitGBP, convertToDisplayCurrency]);

  const globalPrevCm2Disp = useMemo(() => {
    return convertToDisplayCurrency(prev.cm2Profit ?? 0, "GBP");
  }, [prev.cm2Profit, convertToDisplayCurrency]);


  // Global Profit (you currently show Amazon profit only in global card)
  const globalCurrProfit = useMemo(() => {
    const pUsd = toNumberSafe(uk.profitGBP ?? 0) * gbpToUsd;
    return convertToDisplayCurrency(pUsd, "USD");
  }, [uk.profitGBP, gbpToUsd, convertToDisplayCurrency]);

  const globalPrevProfit = useMemo(() => {
    // previous month MTD Amazon profit in GBP from your API
    const prevProfitGbp = toNumberSafe(prev.profit ?? 0);
    const pUsd = prevProfitGbp * gbpToUsd;
    return convertToDisplayCurrency(pUsd, "USD");
  }, [prev.profit, gbpToUsd, convertToDisplayCurrency]);

  const globalDeltas = useMemo(() => {
    return {
      units: safeDeltaPct(globalCurrUnits, globalPrevUnits),
      sales: safeDeltaPct(globalCurrSalesDisp, globalPrevSalesDisp),
      asp: safeDeltaPct(globalCurrAsp, globalPrevAsp),
      profit: safeDeltaPct(globalCurrProfit, globalPrevProfit),
      profitPct: null as number | null,
    };
  }, [
    globalCurrUnits,
    globalPrevUnits,
    globalCurrSalesDisp,
    globalPrevSalesDisp,
    globalCurrAsp,
    globalPrevAsp,
    globalCurrProfit,
    globalPrevProfit,
  ]);

  const globalCurrGrossDisp = useMemo(() => {
    return convertToDisplayCurrency(combinedGrossUSD, "USD");
  }, [combinedGrossUSD, convertToDisplayCurrency]);

  const globalPrevGrossDisp = useMemo(() => {
    const prevAmazonGrossUSD = toNumberSafe(prev.grossSales) * gbpToUsd; // prev gross comes in GBP
    const prevShopifyUSD = toNumberSafe(shopifyPrevDeriv?.netSales) * inrToUsd;
    return convertToDisplayCurrency(prevAmazonGrossUSD + prevShopifyUSD, "USD");
  }, [prev.grossSales, gbpToUsd, shopifyPrevDeriv?.netSales, inrToUsd, convertToDisplayCurrency]);



  /* ===================== RENDER FLAGS ===================== */
  const hasAnyGraphData = amazonIntegrated || shopifyIntegrated;
  const hasGlobalCard = !noIntegrations;
  const hasAmazonCard = amazonIntegrated;
  const hasShopifyCard = !shopifyNotConnected;

  const leftColumnHeightClass = !hasShopifyCard ? "lg:min-h-[520px]" : "";

  const prevShort = getShort(biPeriods?.previous?.label);
  const currShort = getShort(biPeriods?.current_mtd?.label);

  const rangeCurrency = currencyForCountry(countryName);

  const amazonDataCurrency: CurrencyCode = useMemo(() => {
    // your fetchAmazon uses UK when platform is "global"
    if (platform === "amazon-us") return "USD";
    if (platform === "amazon-ca") return "CAD";
    return "GBP"; // amazon-uk OR global default
  }, [platform]);

  const identityConvert = useCallback((v: number, _from?: any) => v, []);

  // ✅ Reimbursement (current + previous) converted to HOME currency (displayCurrency)
  const reimbursementHome = useMemo(() => {
    // current month reimbursement lives in derived_totals
    const currRaw = toNumberSafe(derived?.current_net_reimbursement ?? 0);

    // previous month reimbursement lives in previous_period.totals (as per your snippet)
    const prevRaw = toNumberSafe(
      data?.previous_period?.totals?.previous_net_reimbursement ?? 0
    );

    return {
      current: convertToDisplayCurrency(currRaw, amazonDataCurrency),
      previous: convertToDisplayCurrency(prevRaw, amazonDataCurrency),

      // optional: delta% in home currency (safe even if fx changes)
      deltaPct: safeDeltaPct(
        convertToDisplayCurrency(currRaw, amazonDataCurrency),
        convertToDisplayCurrency(prevRaw, amazonDataCurrency)
      ),
    };
  }, [
    derived?.current_net_reimbursement,
    data?.previous_period?.totals?.previous_net_reimbursement,
    convertToDisplayCurrency,
    amazonDataCurrency,
  ]);


  const targetData = regions[targetRegion] || regions.Global;

  const stats_mtdHome = identityConvert(targetData.mtdUSD ?? 0);
  const stats_lastMtdHome = identityConvert(targetData.lastMonthToDateUSD ?? 0);
  const stats_lastMonthTotalHome = identityConvert(targetData.lastMonthTotalUSD ?? 0);
  const stats_targetHome = identityConvert(targetData.targetUSD ?? 0);

  const { todayDay: statsTodayDay } = getISTDayInfo();

  const stats_todayHome =
    typeof todaySalesRaw === "number" && !Number.isNaN(todaySalesRaw)
      ? todaySalesRaw
      : statsTodayDay > 0
        ? stats_mtdHome / statsTodayDay
        : 0;

  const stats_salesTrendPct =
    stats_lastMtdHome > 0
      ? ((stats_mtdHome - stats_lastMtdHome) / stats_lastMtdHome) * 100
      : 0;

  const stats_targetTrendPct =
    stats_lastMonthTotalHome > 0
      ? ((stats_targetHome - stats_lastMonthTotalHome) / stats_lastMonthTotalHome) * 100
      : 0;

  return (
    <div className="relative overflow-x-hidden">
      {(loading || shopifyLoading) && !data && !shopify && (
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

      <div className="mx-auto w-full max-w-full px-4 lg:px-6">

        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col leading-tight">
            <p className="text-lg text-charcoal-500 mb-1">
              Let&apos;s get started,{" "}
              <span className="text-green-500">{brandName}!</span>
            </p>

            <div className="flex items-center gap-2">
              <PageBreadcrumb
                pageTitle="Sales Dashboard -"
                variant="page"
                textSize="2xl"
                className="text-2xl font-semibold"
              />

              <span className="text-lg sm:text-2xl md:text-2xl font-semibold text-[#5EA68E]">
                {formattedMonthYear}
              </span>
            </div>
          </div>

          <button
            onClick={refreshAll}
            disabled={loading || shopifyLoading || biLoading}
            className={`w-full rounded-md border px-3 py-1.5 text-sm shadow-sm active:scale-[.99] sm:w-auto ${loading || shopifyLoading || biLoading
              ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
              : "border-gray-300 bg-white hover:bg-gray-50"
              }`}
          >
            {loading || shopifyLoading || biLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className={`grid grid-cols-12 gap-6 items-stretch`}>

          {/* LEFT COLUMN */}
          <div className={`col-span-12 lg:col-span-8 order-2 lg:order-1 flex flex-col gap-6 ${leftColumnHeightClass}`}>

            {/* GLOBAL CARD */}
            {!isCountryMode && hasGlobalCard && (
              <div className="flex">
                <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <PageBreadcrumb pageTitle="Global" variant="page" align="left" />
                    </div>

                    {showLiveBI && platform === "global" && (
                      <RangePicker
                        selectedStartDay={selectedStartDay}
                        selectedEndDay={selectedEndDay}
                        onSubmit={(s, e) => {
                          setSelectedStartDay(s);
                          setSelectedEndDay(e);
                        }}
                        onClear={() => {
                          setSelectedStartDay(null);
                          setSelectedEndDay(null);
                        }}
                        onCloseReset={() => {
                          setSelectedStartDay(null);
                          setSelectedEndDay(null);
                        }}
                      />
                    )}
                  </div>


                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-6 gap-3 auto-rows-fr">

                    <AmazonStatCard
                      label="Units"
                      current={globalUseBi ? biCardKpis.curr.units : globalCurrUnits}
                      previous={globalUseBi ? biCardKpis.prev.units : globalPrevUnits}
                      deltaPct={globalUseBi ? biCardKpis.deltas.units : globalDeltas.units}
                      loading={loading || shopifyLoading || biLoading}
                      formatter={fmtInt}
                      bottomLabel={prevLabel}
                      className="border-[#FFBE25] bg-[#FFBE2526]"
                    />

                    <AmazonStatCard
                      label="Gross Sales"
                      current={globalUseBi ? biCardKpis.curr.grossSales : globalCurrGrossDisp}
                      previous={globalUseBi ? biCardKpis.prev.grossSales : globalPrevGrossDisp}

                      deltaPct={globalUseBi ? biCardKpis.deltas.grossSales : safeDeltaPct(combinedGrossUSD, prevGlobalGrossUSD)}
                      loading={loading || shopifyLoading || biLoading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}

                      className="border-[#F47A00] bg-[#F47A0026]"
                    />


                    <AmazonStatCard
                      label="Net Sales"
                      current={globalUseBi ? biCardKpis.curr.netSales : globalCurrNetSalesDisp}
                      previous={globalUseBi ? biCardKpis.prev.netSales : globalPrevNetSalesDisp}

                      deltaPct={globalUseBi ? biCardKpis.deltas.netSales : safeDeltaPct(globalCurrNetSalesDisp, globalPrevNetSalesDisp)}
                      loading={loading || shopifyLoading || biLoading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#2CA9E0] bg-[#2CA9E026]"
                    />

                    <AmazonStatCard
                      label="ASP"
                      current={globalUseBi ? biCardKpis.curr.asp : globalCurrAspDisp}
                      previous={globalUseBi ? biCardKpis.prev.asp : globalPrevAspDisp}
                      deltaPct={
                        globalUseBi
                          ? biCardKpis.deltas.asp
                          : safeDeltaPct(globalCurrAspDisp, globalPrevAspDisp)
                      }
                      loading={loading || shopifyLoading || biLoading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#FF5C5C] bg-[#FF5C5C26]"
                    />



                    <AmazonStatCard
                      label="CM2 Profit"
                      current={
                        globalUseBi
                          ? (globalCm2Ready
                            ? convertToDisplayCurrency(biAlignedTotals?.current_cm2_profit ?? 0, biSourceCurrency)
                            : 0)
                          : globalCurrCm2Disp
                      }
                      previous={
                        globalUseBi
                          ? (globalCm2Ready
                            ? convertToDisplayCurrency(biAlignedTotals?.previous_cm2_profit ?? 0, biSourceCurrency)
                            : 0)
                          : globalPrevCm2Disp
                      }

                      deltaPct={
                        globalUseBi
                          ? (globalCm2Ready
                            ? safeDeltaPct(
                              biAlignedTotals?.current_cm2_profit ?? 0,
                              biAlignedTotals?.previous_cm2_profit ?? 0
                            )
                            : null)
                          : safeDeltaPct(globalCurrCm2Disp, globalPrevCm2Disp)
                      }
                      loading={loading || shopifyLoading || (globalUseBi ? biLoading : false)}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#2DA49A] bg-[#2DA49A26]"
                    />


                    <AmazonStatCard
                      label="CM2 Profit %"
                      current={
                        globalUseBi
                          ? (globalCm2Ready ? (biAlignedTotals?.total_current_profit_percentage ?? 0) : 0)
                          : curr.profitPct
                      }
                      previous={
                        globalUseBi
                          ? (globalCm2Ready ? (biAlignedTotals?.total_previous_profit_percentage ?? 0) : 0)
                          : prev.profitPct
                      }
                      deltaPct={
                        globalUseBi
                          ? (globalCm2Ready
                            ? deltaPctPoints(
                              biAlignedTotals?.total_current_profit_percentage ?? 0,
                              biAlignedTotals?.total_previous_profit_percentage ?? 0
                            )
                            : null)
                          : deltaPctPoints(curr.profitPct ?? 0, prev.profitPct ?? 0)
                      }


                      loading={loading || shopifyLoading || (globalUseBi ? biLoading : false)}
                      formatter={fmtPct}
                      bottomLabel={prevLabel}
                      className="border-[#01627F] bg-[#01627F26]"
                    />


                  </div>
                </div>
              </div>
            )}

            {/* AMAZON SECTION */}
            {hasAmazonCard && (
              <div className="flex flex-col lg:flex-1 gap-4">

                {/* Amazon KPI Box */}
                <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-row gap-3 items-start md:items-start md:justify-between">
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <PageBreadcrumb pageTitle="Amazon" variant="page" align="left" />
                        {/* {showLiveBI && (
                          <span className="text-xs text-gray-400">
                            {prevShort && currShort ? `(${currShort} vs ${prevShort})` : ""}
                          </span>
                        )} */}
                      </div>
                      {/* <p className="mt-1 text-sm text-charcoal-500">
                        Real-time data from Amazon
                      </p> */}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* {showLiveBI && (isCountryMode || platform === "global") && (
                        <RangePicker
                          selectedStartDay={selectedStartDay}
                          selectedEndDay={selectedEndDay}
                          onSubmit={(s, e) => {
                            setSelectedStartDay(s);
                            setSelectedEndDay(e);
                          }}
                          onClear={() => {
                            setSelectedStartDay(null);
                            setSelectedEndDay(null);
                          }}
                          onCloseReset={() => {
                            setSelectedStartDay(null);
                            setSelectedEndDay(null);
                          }}
                        />
                      )} */}
                      {showLiveBI && isCountryMode && (
                        <RangePicker
                          selectedStartDay={selectedStartDay}
                          selectedEndDay={selectedEndDay}
                          onSubmit={(s, e) => {
                            setSelectedStartDay(s);
                            setSelectedEndDay(e);
                          }}
                          onClear={() => {
                            setSelectedStartDay(null);
                            setSelectedEndDay(null);
                          }}
                          onCloseReset={() => {
                            setSelectedStartDay(null);
                            setSelectedEndDay(null);
                          }}
                        />
                      )}

                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-6 gap-3 auto-rows-fr">

                    <AmazonStatCard
                      label="Units"
                      current={useBiForAmazonCards ? biCardKpis.curr.units : (totals?.quantity ?? 0)}
                      previous={useBiForAmazonCards ? biCardKpis.prev.units : prev.quantity}
                      deltaPct={useBiForAmazonCards ? biCardKpis.deltas.units : deltas.quantityPct}
                      loading={loading || biLoading}
                      formatter={fmtInt}
                      bottomLabel={prevLabel}
                      className="border-[#FFBE25] bg-[#FFBE2526]"

                    />

                    <AmazonStatCard
                      label="Gross Sales"
                      current={
                        showLiveBI && rangeActive
                          ? biCardKpis.curr.grossSales                 // ✅ no conversion
                          : convertToDisplayCurrency(uk.grossSalesGBP ?? 0, amazonDataCurrency)
                      }
                      previous={
                        showLiveBI && rangeActive
                          ? biCardKpis.prev.grossSales                 // ✅ no conversion
                          : convertToDisplayCurrency(prev.grossSales ?? 0, amazonDataCurrency)
                      }
                      deltaPct={useBiForAmazonCards ? biCardKpis.deltas.grossSales : safeDeltaPct(uk.grossSalesGBP ?? 0, prev.grossSales ?? 0)}
                      loading={loading || biLoading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#F47A00] bg-[#F47A0026]"
                    />

                    <AmazonStatCard
                      label="Net Sales"
                      current={
                        showLiveBI && rangeActive
                          ? biCardKpis.curr.netSales                   // ✅ no conversion
                          : convertToDisplayCurrency(uk.netSalesGBP ?? 0, amazonDataCurrency)
                      }
                      previous={
                        showLiveBI && rangeActive
                          ? biCardKpis.prev.netSales                   // ✅ no conversion
                          : convertToDisplayCurrency(prev.netSales, amazonDataCurrency)
                      }
                      deltaPct={useBiForAmazonCards ? biCardKpis.deltas.netSales : deltas.netSalesPct}
                      loading={loading || biLoading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#2CA9E0] bg-[#2CA9E026]"
                    />






                    <AmazonStatCard
                      label="ASP"
                      current={
                        showLiveBI && rangeActive
                          ? biCardKpis.curr.asp                        // ✅ no conversion
                          : convertToDisplayCurrency(uk.aspGBP ?? 0, amazonDataCurrency)
                      }
                      previous={
                        showLiveBI && rangeActive
                          ? biCardKpis.prev.asp                        // ✅ no conversion
                          : convertToDisplayCurrency(prev.asp, amazonDataCurrency)
                      }
                      deltaPct={useBiForAmazonCards ? biCardKpis.deltas.asp : deltas.aspPct}
                      loading={loading || biLoading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#FF5C5C] bg-[#FF5C5C26]"
                    />

                    <AmazonStatCard
                      label="CM2 Profit"
                      current={
                        useBiCm2
                          ? (cm2Ready
                            ? convertToDisplayCurrency(biAlignedTotals?.current_cm2_profit ?? 0, biSourceCurrency)

                            : 0)
                          : convertToDisplayCurrency(uk.cm2ProfitGBP ?? 0, amazonDataCurrency) // ✅ MTD Transactions
                      }
                      previous={
                        useBiCm2
                          ? (cm2Ready
                            ? convertToDisplayCurrency(biAlignedTotals?.previous_cm2_profit ?? 0, rangeCurrency)
                            : 0)
                          : convertToDisplayCurrency(prev.cm2Profit ?? 0, amazonDataCurrency) // ✅ MTD Transactions prev
                      }
                      deltaPct={
                        useBiCm2
                          ? (cm2Ready
                            ? safeDeltaPct(
                              biAlignedTotals?.current_cm2_profit ?? 0,
                              biAlignedTotals?.previous_cm2_profit ?? 0
                            )
                            : null)
                          : safeDeltaPct(uk.cm2ProfitGBP ?? 0, prev.cm2Profit ?? 0) // ✅ MTD Transactions delta
                      }
                      loading={loading || (useBiCm2 ? biLoading : false)}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#2DA49A] bg-[#2DA49A26]"
                    />

                    <AmazonStatCard
                      label="CM2 Profit %"
                      current={
                        useBiCm2
                          ? (cm2Ready ? (biAlignedTotals?.total_current_profit_percentage ?? 0) : 0)
                          : (curr.profitPct ?? 0) // ✅ MTD Transactions
                      }
                      previous={
                        useBiCm2
                          ? (cm2Ready ? (biAlignedTotals?.total_previous_profit_percentage ?? 0) : 0)
                          : (prev.profitPct ?? 0) // ✅ MTD Transactions
                      }
                      deltaPct={
                        useBiCm2
                          ? (cm2Ready
                            ? deltaPctPoints(
                              biAlignedTotals?.total_current_profit_percentage ?? 0,
                              biAlignedTotals?.total_previous_profit_percentage ?? 0
                            )
                            : null)
                          : deltaPctPoints(curr.profitPct ?? 0, prev.profitPct ?? 0)
                      }

                      loading={loading || (useBiCm2 ? biLoading : false)}
                      formatter={fmtPct}
                      bottomLabel={prevLabel}
                      className="border-[#01627F] bg-[#01627F26]"
                    />
                  </div>
                </div>

                {/* {showLiveBI && isCountryMode && (
                  <div className="w-full rounded-2xl border bg-white p-4 sm:p-5 shadow-sm overflow-x-hidden">
                    <div className="w-full max-w-full min-w-0">
                      <LiveBiLineGraph
                        dailySeries={biDailySeries}
                        periods={biPeriods}
                        loading={biLoading}
                        error={biError}
                        selectedStartDay={selectedStartDay}
                        selectedEndDay={selectedEndDay}
                      />
                    </div>
                  </div>
                )} */}


                {/* Live BI graph */}
                {showLiveBI && isCountryMode && (
                  <div className="w-full rounded-2xl border bg-white p-4 sm:p-5 shadow-sm overflow-x-hidden">
                    <div className="w-full max-w-full min-w-0">
                      <LiveBiLineGraph
                        dailySeries={biDailySeriesHome}
                        periods={biPeriods}
                        loading={biLoading}
                        error={biError}
                        selectedStartDay={selectedStartDay}
                        selectedEndDay={selectedEndDay}
                        currencySymbol={currencySymbol}
                      />
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Shopify Block */}
            {!isCountryMode && hasShopifyCard && (
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
                      {/* <p className="mt-1 text-sm text-charcoal-500">
                        Real-time data from Shopify
                      </p> */}
                    </div>
                  </div>

                  {shopifyLoading ? (
                    <div className="mt-3 text-sm text-gray-500">Loading Shopify…</div>
                  ) : shopify ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">

                      <AmazonStatCard
                        label="Units"
                        current={shopifyDeriv?.totalOrders ?? 0}
                        previous={shopifyPrevDeriv?.totalOrders ?? 0}
                        loading={shopifyLoading}
                        formatter={fmtInt}
                        bottomLabel={prevLabel}
                        className="border-[#FFBE25] bg-[#FFBE2526]"
                      />
                      <AmazonStatCard
                        label="Sales"
                        current={convertToDisplayCurrency(shopifyDeriv?.netSales ?? 0, "INR")}
                        previous={convertToDisplayCurrency(shopifyPrevDeriv?.netSales ?? 0, "INR")}
                        loading={shopifyLoading}
                        formatter={formatDisplayAmount}
                        bottomLabel={prevLabel}
                        className="border-[#2CA9E0] bg-[#2CA9E026]"

                      />
                      <AmazonStatCard
                        label="ASP"
                        current={(() => {
                          const units = shopifyDeriv?.totalOrders ?? 0;
                          if (!units) return 0;
                          const net = convertToDisplayCurrency(shopifyDeriv?.netSales ?? 0, "INR");
                          return net / units;
                        })()}
                        previous={0}
                        loading={shopifyLoading}
                        formatter={formatDisplayAmount}
                        bottomLabel={prevLabel}
                        className="border-[#FF5C5C] bg-[#FF5C5C26]"
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

          {/* RIGHT COLUMN – Sales Target */}
          <aside className="col-span-12 lg:col-span-4 order-1 lg:order-2 flex flex-col gap-6 h-full">
            <div className="w-full">
              <SalesTargetStatsCard
                regions={regions}
                value={targetRegion}
                onChange={setTargetRegion}
                homeCurrency={displayCurrency}
                formatHomeK={formatDisplayK}
                todayHome={stats_todayHome}
                mtdHome={stats_mtdHome}
                targetHome={stats_targetHome}
                lastMonthTotalHome={stats_lastMonthTotalHome}
                salesTrendPct={stats_salesTrendPct}
                targetTrendPct={stats_targetTrendPct}
                currentReimbursement={reimbursementHome.current}
                previousReimbursement={reimbursementHome.previous}
              />
            </div>

            <div className="w-full lg:sticky lg:top-6">
              <SalesTargetCard
                data={targetData}
                regions={regions}
                value={targetRegion}
                onChange={setTargetRegion}
                hideTabs={isCountryMode}
                homeCurrency={displayCurrency}
                convertToHomeCurrency={identityConvert}
                formatHomeK={formatDisplayK}
                todaySales={todaySalesRaw}
                targetHome={stats_targetHome}
                mtdHome={stats_mtdHome}
                lastMonthTotalHome={stats_lastMonthTotalHome}
                currentReimbursement={reimbursementHome.current}
                previousReimbursement={reimbursementHome.previous}
              />
            </div>
          </aside>
        </div>



        {/* ✅ Global-only Performance Trend BELOW top section */}
        {platform === "global" && showLiveBI && (
          <div className="mt-6 w-full rounded-2xl border bg-white p-4 sm:p-5 shadow-sm overflow-x-hidden">
            <div className="w-full max-w-full min-w-0">
              <LiveBiLineGraph
                dailySeries={biDailySeriesHome}
                periods={biPeriods}
                loading={biLoading}
                error={biError}
                selectedStartDay={selectedStartDay}
                selectedEndDay={selectedEndDay}
                currencySymbol={currencySymbol}
              />
            </div>
          </div>
        )}


        {/* Months for BI */}
        <div className="w-full overflow-x-hidden">
          {showLiveBI && (
            <div className="w-full max-w-full min-w-0">
              <MonthsforBI
                countryName={countryName}
                ranged="MTD"
                month={currMonthName.toLowerCase()}
                year={String(currYear)}
                initialData={liveBiPayload}
              />

            </div>
          )}
        </div>
        {/* 
        {platform === "global" && showLiveBI && (
          <div className="mt-6 w-full rounded-2xl border bg-white p-4 sm:p-5 shadow-sm overflow-x-hidden">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <PageBreadcrumb pageTitle="Performance Trend" align="left" textSize="2xl" variant="page" />
              </div>

            
              <div className="text-xs text-gray-400">
                {selectedStartDay && selectedEndDay ? `Day ${selectedStartDay} – ${selectedEndDay}` : "MTD"}
              </div>
            </div>

            <div className="w-full max-w-full min-w-0">
              <LiveBiLineGraph
                dailySeries={biDailySeries}
                periods={biPeriods}
                loading={biLoading}
                error={biError}
                selectedStartDay={selectedStartDay}
                selectedEndDay={selectedEndDay}
              />
            </div>
          </div>
        )} */}


        {/* Lower P&L Graph and Inventory */}
        {hasAnyGraphData && (
          <>
            <div className="mt-6 rounded-2xl border bg-[#D9D9D933] p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <PageBreadcrumb
                    pageTitle="Amazon"
                    align="left"
                    textSize="2xl"
                    variant="page"
                  />
                  {/* <p className="text-charcoal-500">
                    Real-time data{" "}
                    {graphRegionToUse === "Global" ? "Global" : graphRegionToUse}
                  </p> */}
                </div>

                {!isCountryMode && (
                  <div className="flex items-center gap-3">
                    <SegmentedToggle<RegionKey>
                      value={graphRegion}
                      options={graphRegions.map((r) => ({ value: r }))}
                      onChange={setGraphRegion}
                    />
                    <DownloadIconButton onClick={handleDownload} />
                  </div>
                )}
              </div>

              <div ref={chartRef} className="overflow-x-hidden">
                <div className="w-full max-w-full min-w-0">

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
            </div>

            {amazonIntegrated && graphRegionToUse !== "Global" && (
              <CurrentInventorySection region={graphRegionToUse} />
            )}

          </>
        )}
      </div>
    </div>
  );


}
