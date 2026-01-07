// "use client";

// import React from "react";
// import { getPrevMonthShortLabel } from "@/lib/dashboard/date";
// import PageBreadcrumb from "../common/PageBreadCrumb";
// import type { RegionKey, RegionMetrics } from "@/lib/dashboard/types";
// import SegmentedToggle from "../ui/SegmentedToggle";

// type CurrencyCode = "USD" | "GBP" | "INR" | "CAD";

// type Props = {
//     regions: Record<RegionKey, RegionMetrics>;
//     value: RegionKey;
//     onChange: (r: RegionKey) => void;
//     hideTabs?: boolean;

//     homeCurrency: CurrencyCode;
//     formatHomeK: (value: number) => string;

//     todayHome: number;
//     mtdHome: number;
//     targetHome: number;
//     lastMonthTotalHome: number;
//     salesTrendPct: number;
//     targetTrendPct: number;

//     currentReimbursement?: number;
//     previousReimbursement?: number;
// };

// const currencySymbolMap: Record<CurrencyCode, string> = {
//     USD: "$",
//     GBP: "£",
//     INR: "₹",
//     CAD: "C$",
// };

// const toApostropheLabel = (s: string) => s.replace(" ", "'");

// export default function SalesTargetStatsCard({
//     homeCurrency,
//     formatHomeK,
//     todayHome,
//     mtdHome,
//     targetHome,
//     lastMonthTotalHome,
//     salesTrendPct,
//     targetTrendPct,
//     currentReimbursement,
//     previousReimbursement,
// }: Props) {
//     const prevLabel = getPrevMonthShortLabel();
//     const homeCurrencySymbol = currencySymbolMap[homeCurrency];

//     // Month labels
//     const reimbNowLabel = new Intl.DateTimeFormat("en-US", {
//         month: "short",
//         year: "2-digit",
//     }).format(new Date());

//     const reimbPrevLabel = new Intl.DateTimeFormat("en-US", {
//         month: "short",
//         year: "2-digit",
//     }).format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));

//     const reimbNow = currentReimbursement ?? 0;
//     const reimbPrev = previousReimbursement ?? 0;

//     const reimbMax = Math.max(reimbNow, reimbPrev, 1);
//     const reimbNowPct = (reimbNow / reimbMax) * 100;
//     const reimbPrevPct = (reimbPrev / reimbMax) * 100;

//     return (
//         <div className="rounded-2xl border p-5 shadow-sm h-full flex flex-col bg-[#D9D9D933]">
//             <div className="relative flex flex-col items-center gap-1">
//                 <PageBreadcrumb
//                     pageTitle="Sales Target"
//                     textSize="2xl"
//                     variant="page"
//                     align="center"
//                 />

//             </div>

//             {!hideTabs && (
//                 <SegmentedToggle<RegionKey>
//                     value={value}
//                     options={availableRegions.map((r) => ({ value: r }))}
//                     onChange={onChange}
//                     className="mt-2"
//                 />
//             )}
//             {/* Reimbursement */}
//             {/* <div className="rounded-lg border p-3">
//         <div className="flex items-center justify-center">
//           <div className="text-xs text-gray-500">
//             Reimbursement ({homeCurrencySymbol})
//           </div>
//         </div>

//         <div className="mt-3">
//           <div className="flex items-center justify-between text-xs">
//             <span className="text-gray-600">
//               {toApostropheLabel(reimbNowLabel)}
//             </span>
//             <span className="font-semibold text-gray-900">
//               {formatHomeK(reimbNow)}
//             </span>
//           </div>
//           <div className="mt-1 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
//             <div
//               className="h-full rounded-full"
//               style={{ width: `${reimbNowPct}%`, backgroundColor: "#5EA68E" }}
//             />
//           </div>
//         </div>

//         <div className="mt-3">
//           <div className="flex items-center justify-between text-xs">
//             <span className="text-gray-600">
//               {toApostropheLabel(reimbPrevLabel)}
//             </span>
//             <span className="font-semibold text-gray-900">
//               {formatHomeK(reimbPrev)}
//             </span>
//           </div>
//           <div className="mt-1 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
//             <div
//               className="h-full rounded-full"
//               style={{ width: `${reimbPrevPct}%`, backgroundColor: "#FFBE25" }}
//             />
//           </div>
//         </div>
//       </div> */}

//             {/* Stats */}
//             <div className="pt-4 flex-1">
//                 <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 text-sm h-full">
//                     {[
//                         { title: "Today", value: formatHomeK(todayHome), helper: "\u00A0" },
//                         { title: "MTD Sales", value: formatHomeK(mtdHome), helper: "\u00A0" },
//                         { title: "Target", value: formatHomeK(targetHome), helper: "\u00A0" },
//                         { title: prevLabel, value: formatHomeK(lastMonthTotalHome), helper: "\u00A0" },
//                         {
//                             title: "Sales Trend",
//                             value: `${salesTrendPct >= 0 ? "+" : ""}${salesTrendPct.toFixed(2)}%`,
//                             helper: `vs ${prevLabel} MTD`,
//                         },
//                         {
//                             title: "Target Trend",
//                             value: `${targetTrendPct >= 0 ? "+" : ""}${targetTrendPct.toFixed(2)}%`,
//                             helper: `target vs ${prevLabel} total`,
//                         },
//                     ].map((t) => (
//                         <div
//                             key={t.title}
//                             className="rounded-xl p-3 text-center h-full flex flex-col items-center justify-center"
//                         >
//                             <div className="text-charcoal-500 whitespace-nowrap leading-none">
//                                 {t.title}
//                             </div>
//                             <div className="mt-2 font-semibold whitespace-nowrap leading-none">
//                                 {t.value}
//                             </div>
//                             <div
//                                 className={`mt-1 text-[11px] leading-none ${t.helper === "\u00A0"
//                                     ? "text-transparent select-none"
//                                     : "text-gray-500"
//                                     }`}
//                             >
//                                 {t.helper}
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// }












"use client";

import React, { useMemo } from "react";
import { getPrevMonthShortLabel } from "@/lib/dashboard/date";
import PageBreadcrumb from "../common/PageBreadCrumb";
import type { RegionKey, RegionMetrics } from "@/lib/dashboard/types";
import SegmentedToggle from "../ui/SegmentedToggle";

type CurrencyCode = "USD" | "GBP" | "INR" | "CAD";

type Props = {
  regions: Record<RegionKey, RegionMetrics>;
  value: RegionKey;
  onChange: (r: RegionKey) => void;
  hideTabs?: boolean;

  homeCurrency: CurrencyCode;
  formatHomeK: (value: number) => string;

  todayHome: number;
  mtdHome: number;
  targetHome: number;
  lastMonthTotalHome: number;
  salesTrendPct: number;
  targetTrendPct: number;

  currentReimbursement?: number;
  previousReimbursement?: number;
};

export default function SalesTargetStatsCard({
  regions,
  value,
  onChange,
  hideTabs,

  homeCurrency,
  formatHomeK,
  todayHome,
  mtdHome,
  targetHome,
  lastMonthTotalHome,
  salesTrendPct,
  targetTrendPct,
  currentReimbursement,
  previousReimbursement,
}: Props) {
  const prevLabel = getPrevMonthShortLabel();

  // ✅ define availableRegions properly (fixes availableRegions + implicit any)
  const availableRegions = useMemo<RegionKey[]>(() => {
    const list: RegionKey[] = ["Global"];
    (["UK", "US", "CA"] as RegionKey[]).forEach((key) => {
      const r = regions[key];
      if (!r) return;

      if (r.mtdUSD || r.lastMonthToDateUSD || r.lastMonthTotalUSD || r.targetUSD) {
        list.push(key);
      }
    });

    return list;
  }, [regions]);

  return (
    <div className="rounded-2xl border p-3 2xl:p-5 shadow-sm h-full flex flex-col bg-[#D9D9D933]">
      <div className="relative flex flex-col items-center gap-2">
        <PageBreadcrumb pageTitle="Sales Target" textSize="2xl" variant="page" align="center" />

        {/* ✅ Toggle moved here */}
        {!hideTabs && (
          <SegmentedToggle<RegionKey>
            value={value}
            options={availableRegions.map((r: RegionKey) => ({ value: r }))}
            onChange={onChange}
            className="mt-1"
          />
        )}
      </div>

      <div className="pt-4 flex-1">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 text-sm h-full">
          {[
            { title: "Today", value: formatHomeK(todayHome), helper: "\u00A0" },
            { title: "MTD Sales", value: formatHomeK(mtdHome), helper: "\u00A0" },
            { title: "Target", value: formatHomeK(targetHome), helper: "\u00A0" },
            { title: prevLabel, value: formatHomeK(lastMonthTotalHome), helper: "\u00A0" },
            {
              title: "Sales Trend",
              value: `${salesTrendPct >= 0 ? "+" : ""}${salesTrendPct.toFixed(2)}%`,
              helper: `vs ${prevLabel} MTD`,
            },
            {
              title: "Target Trend",
              value: `${targetTrendPct >= 0 ? "+" : ""}${targetTrendPct.toFixed(2)}%`,
              helper: `target vs ${prevLabel} total`,
            },
          ].map((t) => (
            <div
              key={t.title}
              className="rounded-xl 2xl:p-3 text-center h-full flex flex-col items-center justify-start"
            >
              <div className="text-charcoal-500 whitespace-nowrap leading-none  text-[10px] 2xl:text-xs">{t.title}</div>
              <div className="mt-2 text-sm 2xl:text-lg font-semibold whitespace-nowrap leading-none">{t.value}</div>
              <div
                className={`mt-1 text-[10px] 2xl:text-xs leading-none ${
                  t.helper === "\u00A0" ? "text-transparent select-none" : "text-gray-500"
                }`}
              >
                {t.helper}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
