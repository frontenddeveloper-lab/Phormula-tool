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
