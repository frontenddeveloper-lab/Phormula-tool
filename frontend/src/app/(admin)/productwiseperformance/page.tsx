// import type { Metadata } from "next";
// import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
// import React from "react";
// import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
// import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
// import StatisticsChart from "@/components/ecommerce/StatisticsChart";
// import RecentOrders from "@/components/ecommerce/RecentOrders";
// import DemographicCard from "@/components/ecommerce/DemographicCard";

// export const metadata: Metadata = {
//   title:
//     "Phormula",
//   description: "This is Next.js Home for TailAdmin Dashboard Template",
// };

// export default function Ecommerce() {
//   return (
//     <div className="grid grid-cols-12 gap-4 md:gap-6">
//       <div className="col-span-12 space-y-6 xl:col-span-7">
//         <EcommerceMetrics />

//         <MonthlySalesChart />
//       </div>

//       <div className="col-span-12 xl:col-span-5">
//         <MonthlyTarget />
//       </div>

//       <div className="col-span-12">
//         <StatisticsChart />
//       </div>

//       <div className="col-span-12 xl:col-span-5">
//         <DemographicCard />
//       </div>

//       <div className="col-span-12 xl:col-span-7">
//         <RecentOrders />
//       </div>
//     </div>
//   );
// }































"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/loader/Loader";
import React, { useEffect, useState, useMemo, useCallback } from "react";

/* ===================== ENV & ENDPOINTS ===================== */
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";
const SHOPIFY_CCY = process.env.NEXT_PUBLIC_SHOPIFY_CURRENCY || "GBP";
const SHOPIFY_TO_GBP = Number(process.env.NEXT_PUBLIC_SHOPIFY_TO_GBP || "1");
// const API_URL = `${baseURL}/amazon_api/orders?include=finances`;
const API_URL = `${baseURL}/amazon_api/orders`;
const SHOPIFY_ENDPOINT = `${baseURL}/shopify/get_monthly_data`;
const SHOPIFY_DROPDOWN_ENDPOINT = `${baseURL}/shopify/dropdown`;

/** 💵 FX rates */
const GBP_TO_USD = Number(process.env.NEXT_PUBLIC_GBP_TO_USD || "1.31");
const INR_TO_USD = Number(process.env.NEXT_PUBLIC_INR_TO_USD || "0.01128");
// Future: const CAD_TO_USD = Number(process.env.NEXT_PUBLIC_CAD_TO_USD || "0.73");


const USE_MANUAL_LAST_MONTH =
  (process.env.NEXT_PUBLIC_USE_MANUAL_LAST_MONTH || "false").toLowerCase() === "true";

/** Put last month's TOTAL SALES in USD (not to-date) */
const MANUAL_LAST_MONTH_USD_GLOBAL = Number(
  process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_GLOBAL || "0"
);
/** Optional per-region overrides */
const MANUAL_LAST_MONTH_USD_UK = Number(process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_UK || "0");
const MANUAL_LAST_MONTH_USD_US = Number(process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_US || "0");
const MANUAL_LAST_MONTH_USD_CA = Number(process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_CA || "0");

/* ===================== DATE HELPERS ===================== */
function getISTYearMonth() {
  const optsMonth: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", month: "long" };
  const optsYear: Intl.DateTimeFormatOptions = { timeZone: "Asia/Kolkata", year: "numeric" };
  const now = new Date();
  const monthName = now.toLocaleString("en-US", optsMonth);
  const yearStr = now.toLocaleString("en-US", optsYear);
  return { monthName, year: Number(yearStr) };
}

function buildShopifyURL({ year, monthName }: { year: number; monthName: string }) {
  const qs = new URLSearchParams();
  qs.set("year", String(year));
  qs.append("months[]", monthName);
  return `${SHOPIFY_ENDPOINT}?${qs.toString()}`;
}

function buildShopifyDropdownMonthlyURL({
  year,
  monthName,
}: {
  year: number;
  monthName: string;
}) {
  const qs = new URLSearchParams();
  qs.set("range", "monthly");            // backend ka range_type
  qs.set("year", String(year));          // e.g. "2025"
  qs.set("month", monthName.toLowerCase()); // "january" jaisa backend expect kar raha
  return `${SHOPIFY_DROPDOWN_ENDPOINT}?${qs.toString()}`;
}


function getPrevISTYearMonth() {
  const tz = "Asia/Kolkata";
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  const year = istNow.getMonth() === 0 ? istNow.getFullYear() - 1 : istNow.getFullYear();
  const monthIdx = istNow.getMonth() === 0 ? 11 : istNow.getMonth() - 1;
  const monthName = new Date(year, monthIdx, 1).toLocaleString("en-US", {
    month: "long",
    timeZone: tz,
  });
  return { monthName, year };
}

function getPrevMonthShortLabel() {
  const { monthName, year } = getPrevISTYearMonth();
  const shortMon = new Date(`${monthName} 1, ${year}`).toLocaleString("en-US", {
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  return `${shortMon}'${String(year).slice(-2)}`; // e.g., Oct'25
}

function getISTDayInfo() {
  const tz = "Asia/Kolkata";
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: tz }));
  const todayDay = istNow.getDate();
  const { monthName, year } = getPrevISTYearMonth();
  const prevMonthIdx = new Date(`${monthName} 1, ${year}`).getMonth();
  const daysInPrevMonth = new Date(year, prevMonthIdx + 1, 0).getDate();
  const daysInThisMonth = new Date(istNow.getFullYear(), istNow.getMonth() + 1, 0).getDate();
  return { todayDay, daysInPrevMonth, daysInThisMonth };
}

/* ===================== UI HELPERS ===================== */
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

const ValueOrSkeleton = ({
  loading,
  children,
  compact = false,
  mode = "replace",
}: {
  loading: boolean;
  children: React.ReactNode;
  compact?: boolean;
  mode?: "replace" | "inline";
}) => {
  // NEW: inline mode → always show children, just add a small spinner when loading
  if (mode === "inline") {
    return (
      <span className="inline-flex items-center gap-1">
        {children}
        {loading && (
          <Loader
            size={compact ? 16 : 20}
            transparent
            roundedClass="rounded-full"
            backgroundClass="bg-transparent"
            className="text-gray-400"
            forceFallback
          />
        )}
      </span>
    );
  }

  // OLD behaviour (for places where you still want full skeleton)
  if (loading) {
    return (
      <div className="inline-flex items-center justify-center">
        <Loader
          size={compact ? 28 : 36}
          transparent
          roundedClass="rounded-full"
          backgroundClass="bg-transparent"
          className="text-gray-400"
          forceFallback
        />
      </div>
    );
  }
  return <>{children}</>;
};


/* ---------- Formatters & Safe Number ---------- */
const fmtCurrency = (val: any, ccy = "GBP") => {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: ccy,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val));
};

const fmtGBP = (val: any) => fmtCurrency(val, "GBP");

const fmtUSD = (val: any) => {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val));
};

const fmtShopify = (val: any) => {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val));
};

const fmtNum = (val: any) =>
  val === null || val === undefined || val === "" || isNaN(Number(val))
    ? "—"
    : new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      Number(val)
    );

const fmtPct = (val: any) =>
  val === null || val === undefined || isNaN(Number(val)) ? "—" : `${Number(val).toFixed(2)}%`;

const toNumberSafe = (v: any) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[, ]+/g, "");
  const n = Number(s);
  return isNaN(n) ? 0 : n;
};

/* ===================== SALES TARGET CARD ===================== */
type RegionKey = "Global" | "UK" | "US" | "CA";

function SalesTargetCard({
  regions,
  defaultRegion = "Global",
}: {
  regions: Record<
    RegionKey,
    {
      mtdUSD: number;
      /** Last month MTD (pro-rated to today's date) */
      lastMonthToDateUSD: number;
      /** Last month TOTAL (full month) — used as Target & bottom KPI */
      lastMonthTotalUSD: number;
      /** This month target (we set this equal to lastMonthTotalUSD) */
      targetUSD: number;
    }
  >;
  defaultRegion?: RegionKey;
}) {
  const [tab, setTab] = useState<RegionKey>(defaultRegion);

  const data = regions[tab] || regions.Global;
  const { mtdUSD, lastMonthToDateUSD, lastMonthTotalUSD, targetUSD } = data;

  const pct = targetUSD > 0 ? Math.min(mtdUSD / targetUSD, 1) : 0;
  const pctLastMTD = targetUSD > 0 ? Math.min(lastMonthToDateUSD / targetUSD, 1) : 0;

  const deltaPct = (pct - pctLastMTD) * 100;

  const { todayDay } = getISTDayInfo();
  const todayApprox = todayDay > 0 ? mtdUSD / todayDay : 0;

  const prevLabel = getPrevMonthShortLabel(); // e.g., Oct'25

  const size = 280;
  const stroke = 16;
  const cx = size / 2;
  const rBase = size / 2 - stroke;

  // helper to convert angle+radius → x,y (draw upwards into visible half)
  const toXYRadius = (angDeg: number, radius: number) => {
    const rad = (Math.PI / 180) * (180 - angDeg);
    return {
      x: cx + radius * Math.cos(rad),
      y: size / 2 - radius * Math.sin(rad),
    };
  };

  const arcPath = (fromDeg: number, toDeg: number, radius: number) => {
    const start = toXYRadius(fromDeg, radius);
    const end = toXYRadius(toDeg, radius);
    const largeArc = toDeg - fromDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  // ⬇️ LAYOUT OF ARCS
  // Grey (Target) and Green (current MTD) share the same radius.
  // Green is drawn AFTER grey so it visually sits on top and shows "fullness".
  const rTarget = rBase; // outer radius for background + target
  const rCurrent = rBase; // same radius as target → sits on top
  const rLastMTD = rBase - stroke * 0.9; // slightly inner radius for orange

  const fullFrom = 0;
  const fullTo = 180;
  const toDeg_MTD = 180 * pct;

  // NOTE: orange currently uses last-month **MTD (pro-rated)**:
  // const toDeg_LastMTD = 180 * pctLastMTD;
  // If you want orange to represent FULL last-month total instead, use:
  const toDeg_LastMTD = 180;  // because targetUSD === lastMonthTotalUSD

  const knobGreen = toXYRadius(toDeg_MTD, rCurrent);
  const knobYellow = toXYRadius(toDeg_LastMTD, rLastMTD);

  const badgeIsUp = deltaPct >= 0;
  const badgeStr = (badgeIsUp ? "▲ " : "▼ ") + `${Math.abs(deltaPct).toFixed(2)}%`;

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      {/* Header with tabs */}
      <div className="mb-3 flex flex-col items-center justify-between gap-2">
        <PageBreadcrumb pageTitle="Sales Target" textSize="2xl" variant="page" align="center" />

        {/* Region pills */}
        <div className="inline-flex rounded-lg border bg-gray-50 p-1 text-xs">
          {(["Global", "UK", "US", "CA"] as RegionKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-1 rounded-lg ${key === tab
                ? "bg-[#C7E6D7] text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              {key}
            </button>
          ))}
        </div>


      </div>

      {/* Legend */}
      <div className="mt-3 mb-2 flex items-center gap-5 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#16a34a" }} />
          <span className="text-gray-600">MTD Sales</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#9ca3af" }} />
          <span className="text-gray-600">This Month Target</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#f59e0b" }} />
          <span className="text-gray-600">{prevLabel} MTD</span>
        </div>
      </div>

      {/* Gauge */}
      <div className="mt-4 flex items-center justify-center">
        <svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2}`}>
          {/* Outer grey: full target */}
          <path
            d={arcPath(fullFrom, fullTo, rTarget)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          {/* Middle orange: last month MTD */}
          <path
            d={arcPath(fullFrom, toDeg_LastMTD, rLastMTD)}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          {/* Inner-on-top green: current MTD (same radius as grey so it “fills” it) */}
          <path
            d={arcPath(fullFrom, toDeg_MTD, rCurrent)}
            fill="none"
            stroke="#16a34a"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          {/* Knobs */}
          <circle cx={knobYellow.x} cy={knobYellow.y} r={10} fill="#f59e0b" stroke="#fffbeb" strokeWidth={4} />
          <circle cx={knobGreen.x} cy={knobGreen.y} r={12} fill="#16a34a" stroke="#ecfdf3" strokeWidth={4} />
        </svg>
      </div>

      {/* Center metrics */}
      <div className="text-center">
        <div className="text-3xl font-bold">{(pct * 100).toFixed(1)}%</div>
        <div
          className={`mx-auto mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${badgeIsUp ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"
            }`}
        >
          {badgeStr}
        </div>
      </div>

      {/* Bottom KPIs */}
      <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
        <div className="flex flex-col items-center rounded-xl justify-between bg-gray-50 p-3">
          <div className="text-gray-500">Today</div>
          <div className="mt-0.5 font-semibold">{fmtUSD(todayApprox)}</div>
        </div>
        <div className="flex flex-col items-center rounded-xl justify-between bg-gray-50 p-3">
          <div className="text-gray-500">MTD Sales</div>
          <div className="mt-0.5 font-semibold">{fmtUSD(mtdUSD)}</div>
        </div>
        <div className="flex flex-col items-center rounded-xl justify-between bg-gray-50 p-3">
          <div className="text-gray-500">Target</div>
          <div className="mt-0.5 font-semibold">{fmtUSD(targetUSD)}</div>
        </div>
        <div className="flex flex-col items-center rounded-xl justify-between bg-gray-50 p-3">
          <div className="text-gray-500">{prevLabel}</div>
          <div className="mt-0.5 font-semibold">{fmtUSD(lastMonthTotalUSD)}</div>
        </div>
      </div>
    </div>
  );
}

/* ===================== SIMPLE BAR CHART (existing) ===================== */
function SimpleBarChart({
  items,
  height = 300,
  padding = { top: 28, right: 24, bottom: 56, left: 24 },
  colors = ["#2563eb", "#16a34a", "#f59e0b", "#ec4899", "#8b5cf6"],
}: {
  items: Array<{ label: string; raw: number; display: string }>;
  height?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  colors?: string[];
}) {
  const [animateIn, setAnimateIn] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, []);

  const width = 760;
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const values = items.map((d) => (Number.isFinite(d.raw) ? Math.abs(Number(d.raw)) : 0));
  const max = Math.max(1, ...values);
  const baseBarW = Math.max(12, (innerW / Math.max(1, items.length)) * 0.4);

  const Tooltip = ({
    x,
    y,
    label,
    display,
    color,
  }: {
    x: number;
    y: number;
    label: string;
    display: string;
    color: string;
  }) => {
    const textY1 = y - 30;
    const text = `${label}: ${display}`;
    return (
      <g>
        <rect x={x - 70} y={textY1 - 24} width={140} height={24} rx={6} fill="#111827" opacity="0.9" />
        <text
          x={x}
          y={textY1 - 8}
          textAnchor="middle"
          fontSize="11"
          fill="#ffffff"
          style={{ pointerEvents: "none" }}
        >
          {text}
        </text>
        <polygon points={`${x - 6},${textY1} ${x + 6},${textY1} ${x},${textY1 + 6}`} fill="#111827" opacity="0.9" />
        <circle cx={x} cy={y} r="6.5" fill="none" stroke={color} strokeWidth={2} />
      </g>
    );
  };

  return (
    <div className="w-full overflow-x-auto ">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[760px] select-none">
        <defs>
          <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.15" />
          </filter>
        </defs>

        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#e5e7eb"
        />

        {items.map((d, i) => {
          const v = values[i];
          const hFull = (v / max) * innerH;
          const barH = animateIn ? hFull : 0;
          const band = innerW / Math.max(1, items.length);
          const xCenter = padding.left + band * i + band / 2;
          const barW = hoverIdx === i ? baseBarW + 6 : baseBarW;
          const x = xCenter - barW / 2;
          const y = padding.top + (innerH - barH);
          const color = colors[i % colors.length];

          return (
            <g
              key={d.label}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(0, barH)}
                rx={8}
                fill={color}
                filter="url(#barShadow)"
                opacity={hoverIdx === i ? 0.95 : 0.85}
              />
              <text x={xCenter} y={y - 10} textAnchor="middle" fontSize={12} fontWeight={600} fill="#111827">
                {d.display}
              </text>
              <text x={xCenter} y={height - padding.bottom + 20} textAnchor="middle" fontSize={12} fill="#6b7280">
                {d.label}
              </text>
              {hoverIdx === i && <Tooltip x={xCenter} y={y} label={d.label} display={d.display} color={color} />}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ===================== MAIN PAGE ===================== */
export default function DashboardPage() {
  // Amazon
  const [loading, setLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Shopify (current month)
  const [shopifyLoading, setShopifyLoading] = useState(false);
  const [shopifyError, setShopifyError] = useState<string | null>(null);
  const [shopifyRows, setShopifyRows] = useState<any[]>([]);
  const shopify = shopifyRows?.[0] || null;

  // Shopify (previous month)
  const [shopifyPrevRows, setShopifyPrevRows] = useState<any[]>([]);

  // which region tab is selected in the Amazon card
  const [amazonRegion, setAmazonRegion] = useState<RegionKey>("Global");


  const fetchAmazon = useCallback(async () => {
    setLoading(true);
    setUnauthorized(false);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
      if (!token) {
        setUnauthorized(true);
        throw new Error("No token found. Please sign in.");
      }
      const res = await fetch(API_URL, {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        credentials: "omit",
      });
      if (res.status === 401) {
        setUnauthorized(true);
        throw new Error("Unauthorized — token missing/invalid/expired.");
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

  // const fetchShopify = useCallback(async () => {
  //   setShopifyLoading(true);
  //   setShopifyError(null);
  //   try {
  //     const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
  //     if (!token) throw new Error("No token found. Please sign in.");
  //     const { monthName, year } = getISTYearMonth();
  //     const url = buildShopifyURL({ year, monthName });
  //     const res = await fetch(url, {
  //       method: "GET",
  //       headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  //       credentials: "omit",
  //     });
  //     if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
  //     if (!res.ok) throw new Error(`Shopify request failed: ${res.status}`);
  //     const json = await res.json();
  //     const rows = Array.isArray(json?.data) ? json.data : [];
  //     setShopifyRows(rows);
  //   } catch (e: any) {
  //     setShopifyError(e?.message || "Failed to load Shopify data");
  //     setShopifyRows([]);
  //   } finally {
  //     setShopifyLoading(false);
  //   }
  // }, []);


const fetchShopify = useCallback(async () => {
  setShopifyLoading(true);
  setShopifyError(null);
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
    if (!token) throw new Error("No token found. Please sign in.");

    const { monthName, year } = getISTYearMonth();

    // ✅ yahan se /shopify/dropdown call hoga
    const url = buildShopifyDropdownMonthlyURL({ year, monthName });

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "omit",
    });

    if (res.status === 401)
      throw new Error("Unauthorized — token missing/invalid/expired.");
    if (!res.ok) throw new Error(`Shopify request failed: ${res.status}`);

    const json = await res.json();

    // Backend se data json.last_row_data me aa raha hai
    const row = json?.last_row_data
      ? json.last_row_data
      : null;

    // Existing code shopifyRows[0] use karta hai, isliye array me wrap
    setShopifyRows(row ? [row] : []);
  } catch (e: any) {
    setShopifyError(e?.message || "Failed to load Shopify data");
    setShopifyRows([]);
  } finally {
    setShopifyLoading(false);
  }
}, []);

  // const fetchShopifyPrev = useCallback(async () => {
  //   try {
  //     const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
  //     if (!token) throw new Error("No token found. Please sign in.");
  //     const { year, monthName } = getPrevISTYearMonth();
  //     const url = buildShopifyURL({ year, monthName });
  //     const res = await fetch(url, {
  //       method: "GET",
  //       headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  //       credentials: "omit",
  //     });
  //     if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
  //     if (!res.ok) throw new Error(`Shopify (prev) request failed: ${res.status}`);
  //     const json = await res.json();
  //     const rows = Array.isArray(json?.data) ? json.data : [];
  //     setShopifyPrevRows(rows);
  //   } catch (e: any) {
  //     console.warn("Shopify prev-month fetch failed:", e?.message);
  //   }
  // }, []);

  const fetchShopifyPrev = useCallback(async () => {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
    if (!token) throw new Error("No token found. Please sign in.");

    const { year, monthName } = getPrevISTYearMonth();
    const url = buildShopifyDropdownMonthlyURL({ year, monthName });

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "omit",
    });

    if (res.status === 401)
      throw new Error("Unauthorized — token missing/invalid/expired.");
    if (!res.ok) throw new Error(`Shopify (prev) request failed: ${res.status}`);

    const json = await res.json();
    const row = json?.last_row_data ? json.last_row_data : null;

    setShopifyPrevRows(row ? [row] : []);
  } catch (e: any) {
    console.warn("Shopify prev-month fetch failed:", e?.message);
    setShopifyPrevRows([]);
  }
}, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchAmazon(), fetchShopify(), fetchShopifyPrev()]);
  }, [fetchAmazon, fetchShopify, fetchShopifyPrev]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // ---------- Amazon aliases ----------
  const cms = data?.current_month_summary || null;
  const cmp = data?.current_month_profit || null;

  const uk = useMemo(() => {
    const netSalesGBP = cms?.net_sales?.GBP != null ? toNumberSafe(cms.net_sales.GBP) : null;
    const aspGBP = cms?.asp?.GBP != null ? toNumberSafe(cms.asp.GBP) : null;

    // ---- breakdown from current_month_profit.breakdown.GBP ----
    const breakdownGBP = cmp?.breakdown?.GBP || {};

    const cogsGBP = breakdownGBP.cogs !== undefined ? toNumberSafe(breakdownGBP.cogs) : 0;
    const fbaFeesGBP =
      breakdownGBP.fba_fees !== undefined ? toNumberSafe(breakdownGBP.fba_fees) : 0;
    const sellingFeesGBP =
      breakdownGBP.selling_fees !== undefined ? toNumberSafe(breakdownGBP.selling_fees) : 0;
    const amazonFeesGBP = fbaFeesGBP + sellingFeesGBP;

    let profitGBP: number | null = null;
    if (cmp?.profit && typeof cmp.profit === "object" && cmp.profit.GBP !== undefined) {
      profitGBP = toNumberSafe(cmp.profit.GBP); // Profit = profit.GBP
    } else if ((typeof cmp?.profit === "number" || typeof cmp?.profit === "string") && netSalesGBP !== null) {
      profitGBP = toNumberSafe(cmp.profit);
    }

    let unitsGBP: number | null = null;
    if (breakdownGBP.quantity !== undefined) {
      unitsGBP = toNumberSafe(breakdownGBP.quantity);
    }

    let profitPctGBP: number | null = null;
    if (profitGBP !== null && netSalesGBP && !isNaN(netSalesGBP) && netSalesGBP !== 0) {
      profitPctGBP = (profitGBP / netSalesGBP) * 100;
    }

    return {
      unitsGBP,
      netSalesGBP,   // Sales = net_sales
      aspGBP,
      profitGBP,     // Profit
      profitPctGBP,
      cogsGBP,       // COGS
      amazonFeesGBP, // Amazon Fees = fba_fees + selling_fees
    };
  }, [cms, cmp]);


  // Amazon chart items
  const barsAmazon = useMemo(() => {
    const units = cms?.total_quantity ?? 0;
    const sales = uk.netSalesGBP ?? 0;
    const asp = uk.aspGBP ?? 0;
    const profit = uk.profitGBP ?? 0;
    const pcent = Number.isFinite(uk.profitPctGBP) ? (uk.profitPctGBP as number) : 0;

    return [
      { label: "Units", raw: Number(units) || 0, display: fmtNum(units) },
      { label: "Sales", raw: Number(sales) || 0, display: fmtGBP(sales) },
      { label: "ASP", raw: Number(asp) || 0, display: fmtGBP(asp) },
      { label: "Profit", raw: Number(profit) || 0, display: fmtGBP(profit) },
      { label: "Profit %", raw: Number(pcent) || 0, display: fmtPct(pcent) },
    ];
  }, [uk, cms]);

  // Shopify (current)
  const shopifyDeriv = useMemo(() => {
    if (!shopify) return null;
    const totalOrders = toNumberSafe(shopify.total_orders);
    const netSales = toNumberSafe(shopify.net_sales); // INR
    const totalDiscounts = toNumberSafe(shopify.total_discounts);
    const totalTax = toNumberSafe(shopify.total_tax);
    const gross = toNumberSafe(shopify.total_price);
    const aov = totalOrders > 0 ? gross / totalOrders : 0;
    return { totalOrders, netSales, totalDiscounts, totalTax, gross, aov };
  }, [shopify]);

  // Shopify (previous month)
  const shopifyPrevDeriv = useMemo(() => {
    const row = shopifyPrevRows?.[0];
    if (!row) return null;
    const netSales = toNumberSafe(row.net_sales); // INR total prev month
    return { netSales };
  }, [shopifyPrevRows]);

  // Combined MTD (USD)
  const amazonUK_USD = useMemo(() => {
    const amazonUK_GBP = toNumberSafe(uk.netSalesGBP);
    return amazonUK_GBP * GBP_TO_USD;
  }, [uk.netSalesGBP]);

  const combinedUSD = useMemo(() => {
    const aUK = amazonUK_USD; // GBP -> USD
    const shopifyUSD = toNumberSafe(shopifyDeriv?.netSales) * INR_TO_USD; // INR -> USD
    return aUK + shopifyUSD;
  }, [amazonUK_USD, shopifyDeriv?.netSales]);

  /* ====== PREVIOUS MONTH TOTALS (USD) & DERIVATIONS ====== */

  // Amazon UK previous month total (from /orders route)
  const prevAmazonUKTotalUSD = useMemo(() => {
    const prevTotalGBP = toNumberSafe(data?.previous_month_total_net_sales?.total);
    return prevTotalGBP * GBP_TO_USD;
  }, [data?.previous_month_total_net_sales?.total]);

  // Shopify previous total → USD
  const prevShopifyTotalUSD = useMemo(() => {
    const prevINRTotal = toNumberSafe(shopifyPrevDeriv?.netSales);
    return prevINRTotal * INR_TO_USD;
  }, [shopifyPrevDeriv]);

  // Global previous total (computed from what we have)
  const globalPrevTotalUSD = prevShopifyTotalUSD + prevAmazonUKTotalUSD;

  // Helper: build chosen "last month total" with optional manual override
  const chooseLastMonthTotal = (manualUSD: number, computedUSD: number) =>
    USE_MANUAL_LAST_MONTH && manualUSD > 0 ? manualUSD : computedUSD;

  // Pro-rate last-month MTD (yellow arc) from last-month TOTAL
  const prorateToDate = (lastMonthTotalUSD: number) => {
    const { todayDay, daysInPrevMonth } = getISTDayInfo();
    return daysInPrevMonth > 0 ? (lastMonthTotalUSD * todayDay) / daysInPrevMonth : 0;
  };

  // Regions for card
  const regions = useMemo(() => {
    // GLOBAL
    const globalLastMonthTotal = chooseLastMonthTotal(
      MANUAL_LAST_MONTH_USD_GLOBAL,
      globalPrevTotalUSD
    );
    const global = {
      mtdUSD: combinedUSD,
      lastMonthToDateUSD: prorateToDate(globalLastMonthTotal),
      lastMonthTotalUSD: globalLastMonthTotal,
      targetUSD: globalLastMonthTotal, // Target = last month's sales
    };

    // UK (Amazon UK only)
    const ukLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_UK, prevAmazonUKTotalUSD);
    const ukRegion = {
      mtdUSD: amazonUK_USD,
      lastMonthToDateUSD: prorateToDate(ukLastMonthTotal),
      lastMonthTotalUSD: ukLastMonthTotal,
      targetUSD: ukLastMonthTotal,
    };

    // US (placeholder)
    const usLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_US, 0);
    const usRegion = {
      mtdUSD: 0,
      lastMonthToDateUSD: prorateToDate(usLastMonthTotal),
      lastMonthTotalUSD: usLastMonthTotal,
      targetUSD: usLastMonthTotal,
    };

    // CA (placeholder)
    const caLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_CA, 0);
    const caRegion = {
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
    } as Record<
      RegionKey,
      { mtdUSD: number; lastMonthToDateUSD: number; lastMonthTotalUSD: number; targetUSD: number }
    >;
  }, [combinedUSD, amazonUK_USD, globalPrevTotalUSD, prevAmazonUKTotalUSD]);

  const anyLoading = loading || shopifyLoading;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        {/* LEFT: Title + Month */}
        <div className="flex items-start justify-center gap-2 whitespace-nowrap">
          <PageBreadcrumb
            pageTitle="Sales Dashboard -"
            variant="page"
            textSize="2xl"
            className="text-2xl"
          />

          {/* MONTH & YEAR */}
          <span className="text-[#5EA68E] text-lg sm:text-2xl md:text-2xl font-semibold">
            {(() => {
              const { monthName, year } = getISTYearMonth();
              const shortMon = new Date(`${monthName} 1, ${year}`).toLocaleString(
                "en-US",
                { month: "short", timeZone: "Asia/Kolkata" }
              );
              return `${shortMon} '${String(year).slice(-2)}`;
            })()}
          </span>
        </div>


        {/* RIGHT: Refresh button */}
        <button
          onClick={refreshAll}
          disabled={anyLoading}
          className={`w-full sm:w-auto rounded-md border px-3 py-1.5 text-sm shadow-sm active:scale-[.99] ${anyLoading
              ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
              : "border-gray-300 bg-white hover:bg-gray-50"
            }`}
          title="Refresh Amazon & Shopify"
        >
          {anyLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>



      {/* ======================= GRID: 12 cols ======================= */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT 8: Amazon (top) + Shopify (bottom) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Notices */}
          {unauthorized && (
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
              <div className="text-sm">
                You’re not signed in or your session expired. Please authenticate
                to load Amazon orders.
              </div>
              <a
                href={`${baseURL || ""}/auth/login`}
                className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-amber-100"
              >
                Sign in
              </a>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
              <span>⚠️</span>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* AMAZON — Details (UK) */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            {/* Header row: title + month + subtitle + region pills */}
            <div className="mb-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">

              {/* LEFT — title + subtitle */}
              <div className="flex flex-col">
                <div className="flex flex-wrap items-baseline gap-2">
                  <PageBreadcrumb
                    pageTitle="Amazon -"
                    variant="page"
                    align="left"
                  />

                  {/* MONTH & YEAR (short) */}
                  <span className="text-[#5EA68E] text-lg sm:text-2xl md:text-2xl font-semibold">
                    {(() => {
                      const { monthName, year } = getISTYearMonth();
                      const shortMon = new Date(
                        `${monthName} 1, ${year}`
                      ).toLocaleString("en-US", {
                        month: "short",
                        timeZone: "Asia/Kolkata",
                      });
                      return `${shortMon} '${String(year).slice(-2)}`;
                    })()}
                  </span>
                </div>

                <p className="text-sm text-charcoal-500 mt-1">
                  Real-time data from Amazon
                </p>
              </div>

              {/* RIGHT — Region pills */}
              <div className="inline-flex rounded-lg border bg-gray-50 p-1 text-xs w-full sm:w-auto justify-between sm:justify-start">
                {(["Global", "UK", "US", "CA"] as RegionKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAmazonRegion(key)}
                    className={`px-3 py-1 rounded-lg min-w-[60px] text-center ${key === amazonRegion
                      ? "bg-[#C7E6D7] text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                      }`}
                  >
                    {key}
                  </button>
                ))}
              </div>

            </div>

            {/* Metric cards row */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
              {/* Sales */}
              <div className="rounded-2xl border border-[#87AD12] bg-[#87AD1226] p-5 shadow-sm">
                <div className="text-sm text-charcoal-500">Sales</div>
                <div className="mt-2 text-lg font-semibold">
                  <ValueOrSkeleton loading={loading} mode="inline">
                    {fmtGBP(uk.netSalesGBP)}
                  </ValueOrSkeleton>
                </div>
              </div>

              {/* Units */}
              <div className="rounded-2xl border border-[#F47A00] bg-[#F47A0026] py-5 px-3 shadow-sm">
                <div className="text-sm text-charcoal-500">Units</div>
                <div className="mt-2 text-lg font-semibold">
                  <ValueOrSkeleton loading={loading} mode="inline" compact>
                    {fmtNum(cms?.total_quantity ?? 0)}
                  </ValueOrSkeleton>
                </div>
              </div>

              {/* ASP */}
              <div className="rounded-2xl border border-[#2CA9E0] bg-[#2CA9E026] py-5 px-3 shadow-sm">
                <div className="text-sm text-charcoal-500">ASP</div>
                <div className="mt-2 text-lg font-semibold">
                  <ValueOrSkeleton loading={loading} mode="inline" compact>
                    {fmtGBP(uk.aspGBP)}
                  </ValueOrSkeleton>
                </div>
              </div>

              {/* Profit */}
              <div className="rounded-2xl border border-[#AB64B5] bg-[#AB64B526] py-5 px-3 shadow-sm">
                <div className="text-sm text-charcoal-500">Profit</div>
                <div className="mt-2 text-lg font-semibold">
                  <ValueOrSkeleton loading={loading} mode="inline" compact>
                    {fmtGBP(uk.profitGBP)}
                  </ValueOrSkeleton>
                </div>
              </div>

              {/* Profit % */}
              <div className="rounded-2xl border border-[#00627B] bg-[#00627B26] py-5 px-3 shadow-sm">
                <div className="text-sm text-charcoal-500">Profit %</div>
                <div className="mt-2 text-lg font-semibold">
                  <ValueOrSkeleton loading={loading} mode="inline" compact>
                    {fmtPct(uk.profitPctGBP)}
                  </ValueOrSkeleton>
                </div>
              </div>
            </div>
          </div>



          {/* SHOPIFY — Details (₹ Rupees) */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="">
              {/* Title + month like “Amazon - Jan’25” */}
              <div className="flex items-baseline gap-2">
                <PageBreadcrumb
                  pageTitle="Shopify -"
                  variant="page"
                  align="left"
                  textSize="2xl"
                />

                {/* MONTH & YEAR (short) */}
                <span className="text-[#5EA68E] text-2xl font-semibold">
                  {(() => {
                    const { monthName, year } = getISTYearMonth();
                    const shortMon = new Date(
                      `${monthName} 1, ${year}`
                    ).toLocaleString("en-US", {
                      month: "short",
                      timeZone: "Asia/Kolkata",
                    });
                    return `${shortMon} '${String(year).slice(-2)}`;
                  })()}
                </span>
              </div>

              {/* Subtitle */}
              <p className="text-sm  text-charcoal-500">
                Real-time data from Shopify
              </p>

            </div>

            {shopifyError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
                <span>⚠️</span>
                <span className="text-sm">{shopifyError}</span>
              </div>
            )}

            {shopifyLoading && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border bg-white p-5 shadow-sm"
                  >
                    <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                    <div className="mt-2 h-7 w-28 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            )}

            {!shopifyLoading && !shopifyError && (
              <>
                {shopify ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mt-3">
                    {/* Units */}
                    <div className="rounded-2xl border border-[#87AD12] bg-[#87AD1226] py-5 px-3 shadow-sm">
                      <div className="text-sm text-charcoal-500">Units</div>
                      <div className="mt-1 text-lg font-semibold text-gray-900">
                        <ValueOrSkeleton
                          loading={shopifyLoading}
                          mode="inline"
                          compact
                        >
                          {shopify?.total_orders}
                        </ValueOrSkeleton>
                      </div>
                    </div>

                    {/* Total Sales (₹) */}
                    <div className="rounded-2xl border border-[#F47A00] bg-[#F47A0026] py-5 px-3 shadow-sm">
                      <div className="text-sm text-charcoal-500">Total Sales</div>
                      <div className="mt-1 text-lg  font-bold tracking-tight text-gray-900">
                        <ValueOrSkeleton loading={shopifyLoading} mode="inline">
                          {fmtShopify(toNumberSafe(shopify?.net_sales ?? 0))}
                        </ValueOrSkeleton>
                      </div>
                    </div>

                    {/* ASP */}
                    <div className="rounded-2xl border border-[#2CA9E0] bg-[#2CA9E026] py-5 px-3 shadow-sm">
                      <div className="text-sm text-gray-500">ASP</div>
                      <div className="mt-1 text-lg  font-semibold text-gray-900">
                        <ValueOrSkeleton
                          loading={shopifyLoading}
                          mode="inline"
                          compact
                        >
                          {(() => {
                            const units = toNumberSafe(
                              shopify?.total_orders ?? 0
                            );
                            const net = toNumberSafe(shopify?.net_sales ?? 0);
                            if (units <= 0) return "—";
                            return fmtShopify(net / units);
                          })()}
                        </ValueOrSkeleton>
                      </div>
                    </div>

                    {/* Profit — placeholder (₹) */}
                    <div className="rounded-2xl border border-[#AB64B5] bg-[#AB64B526] py-5 px-3 shadow-sm">
                      <div className="text-sm text-charcoal-500">Sessions</div>
                      <div className="mt-1 text-lg  font-semibold text-gray-900">
                        —
                      </div>
                    </div>

                    {/* Profit % */}
                    <div className="rounded-2xl border border-[#00627B] bg-[#00627B26] py-5 px-3 shadow-sm">
                      <div className="text-sm text-gray-500">Conversion %</div>
                      <div className="mt-1 text-lg  font-semibold text-gray-900">
                        —
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-500">
                    No Shopify data for the current month.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT 4: Sales Target card (like screenshot) */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="lg:sticky lg:top-6">
            <SalesTargetCard regions={regions} defaultRegion="Global" />
            {/* or defaultRegion="UK" if you want UK as default */}
          </div>
        </aside>
      </div>

      {/* ======================= FULL-WIDTH GRAPH BELOW EVERYTHING ======================= */}
      <div className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-3 text-sm text-gray-500">
          Amazon — Units, Sales, ASP, Profit, Profit %
        </div>

        <div className="mt-8 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-3 text-sm text-gray-500">
            Amazon — P&amp;L Breakdown (Sales, Fees, COGS, Ads, Other, Profit)
          </div>
          <SimpleBarChart
            items={[
              {
                label: "Sales",
                raw: Number(uk.netSalesGBP ?? 0),
                display: fmtGBP(uk.netSalesGBP ?? 0),
              },
              {
                label: "Amazon Fees",
                raw: Number(uk.amazonFeesGBP ?? 0),
                display: fmtGBP(uk.amazonFeesGBP ?? 0),
              },
              {
                label: "COGS",
                raw: Number(uk.cogsGBP ?? 0),
                display: fmtGBP(uk.cogsGBP ?? 0),
              },
              {
                label: "Advertisements",
                raw: 0,
                display: fmtGBP(0),
              },
              {
                label: "Other Charges",
                raw: 0,
                display: fmtGBP(0),
              },
              {
                label: "Profit",
                raw: Number(uk.profitGBP ?? 0),
                display: fmtGBP(uk.profitGBP ?? 0),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );


}
