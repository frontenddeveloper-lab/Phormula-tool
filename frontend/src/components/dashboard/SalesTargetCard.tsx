// // // components/dashboard/SalesTargetCard.tsx
// // "use client";

// // import React, { useMemo, useState } from "react";
// // import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// // import SegmentedToggle from "@/components/ui/SegmentedToggle";
// // import { fmtUSDk } from "@/lib/dashboard/format";
// // import {
// //   getISTDayInfo,
// //   getPrevMonthShortLabel,
// //   getThisMonthShortLabel,
// // } from "@/lib/dashboard/date";
// // import type { RegionKey, RegionMetrics } from "@/lib/dashboard/types";

// // type Props = {
// //   regions: Record<RegionKey, RegionMetrics>;
// //   defaultRegion?: RegionKey;
// // };

// // export default function SalesTargetCard({
// //   regions,
// //   defaultRegion = "Global",
// // }: Props) {
// //   // Tabs: Global + only connected countries
// //   const availableRegions = useMemo<RegionKey[]>(() => {
// //     const list: RegionKey[] = ["Global"];
// //     (["UK", "US", "CA"] as RegionKey[]).forEach((key) => {
// //       const r = regions[key];
// //       if (!r) return;

// //       if (
// //         r.mtdUSD ||
// //         r.lastMonthToDateUSD ||
// //         r.lastMonthTotalUSD ||
// //         r.targetUSD
// //       ) {
// //         list.push(key);
// //       }
// //     });

// //     return list;
// //   }, [regions]);

// //   const [tab, setTab] = useState<RegionKey>(defaultRegion);

// //   const data = regions[tab] || regions.Global;
// //   const { mtdUSD, lastMonthToDateUSD, lastMonthTotalUSD, targetUSD } = data;

// //   const pct = targetUSD > 0 ? Math.min(mtdUSD / targetUSD, 1) : 0;
// //   const pctLastMTD =
// //     targetUSD > 0 ? Math.min(lastMonthToDateUSD / targetUSD, 1) : 0;

// //   const deltaPct = (pct - pctLastMTD) * 100;

// //   const { todayDay } = getISTDayInfo();
// //   const todayApprox = todayDay > 0 ? mtdUSD / todayDay : 0;

// //   const prevLabel = getPrevMonthShortLabel();
// //   const thisMonthLabel = getThisMonthShortLabel();

// //   const size = 280;
// //   const strokeMain = 10;
// //   const strokeLast = 5;

// //   const cx = size / 2;
// //   const rBase = size / 2 - strokeMain;
// //   const gap = 15;

// //   const rTarget = rBase;
// //   const rCurrent = rBase;
// //   const rLastMTD = rCurrent - strokeMain / 2 - gap - strokeLast / 2;

// //   const toXYRadius = (angDeg: number, radius: number) => {
// //     const rad = (Math.PI / 180) * (180 - angDeg);
// //     return {
// //       x: cx + radius * Math.cos(rad),
// //       y: size / 2 - radius * Math.sin(rad),
// //     };
// //   };

// //   const arcPath = (fromDeg: number, toDeg: number, radius: number) => {
// //     const start = toXYRadius(fromDeg, radius);
// //     const end = toXYRadius(toDeg, radius);
// //     const largeArc = toDeg - fromDeg > 180 ? 1 : 0;
// //     return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
// //   };

// //   const fullFrom = 0;
// //   const fullTo = 180;
// //   const toDeg_MTD = 180 * pct;
// //   const toDeg_LastMTD = 180;

// //   const knobGreen = toXYRadius(toDeg_MTD, rCurrent);
// //   const knobYellow = toXYRadius(toDeg_LastMTD, rLastMTD);

// //   const badgeIsUp = deltaPct >= 0;
// //   const badgeStr =
// //     (badgeIsUp ? "▲ " : "▼ ") + `${Math.abs(deltaPct).toFixed(2)}%`;

// //   return (
// //     <div className="h-full rounded-2xl border bg-white py-5 px-2 shadow-sm flex flex-col">
// //       {/* Header with tabs */}
// //       <div className="flex flex-col items-center justify-between gap-2">
// //         <PageBreadcrumb
// //           pageTitle="Sales Target"
// //           textSize="2xl"
// //           variant="page"
// //           align="center"
// //         />

// //         <SegmentedToggle<RegionKey>
// //           value={tab}
// //           options={availableRegions.map((r) => ({ value: r }))}
// //           onChange={setTab}
// //           className="my-1 md:my-8"
// //         />
// //       </div>

// //       {/* Legend */}
// //       <div className="mt-5 mb-2 flex items-center gap-2 text-xs">
// //         <div className="flex flex-1 items-center justify-center gap-2">
// //           <span
// //             className="block h-3 w-3 rounded-sm shrink-0"
// //             style={{ backgroundColor: "#5EA68E" }}
// //           />
// //           <span className="text-gray-600">MTD Sales</span>
// //         </div>

// //         <div className="flex flex-1 items-center justify-center gap-2">
// //           <span
// //             className="block h-3 w-3 rounded-sm shrink-0"
// //             style={{ backgroundColor: "#9ca3af" }}
// //           />
// //           <span className="text-gray-600">{thisMonthLabel} Target</span>
// //         </div>

// //         <div className="flex flex-1 items-center justify-center gap-2">
// //           <span
// //             className="block h-3 w-3 rounded-sm shrink-0"
// //             style={{ backgroundColor: "#FFBE25" }}
// //           />
// //           <span className="text-gray-600">{prevLabel} MTD</span>
// //         </div>
// //       </div>

// //       {/* Gauge */}
// //       <div className="flex-1 flex flex-col items-center justify-center mt-4 md:mt-10">
// //         <div className="mt-2 md:mt-0 flex items-center justify-center">
// //           <svg
// //             width={size}
// //             height={size / 2}
// //             viewBox={`0 0 ${size} ${size / 2}`}
// //           >
// //             <path
// //               d={arcPath(fullFrom, fullTo, rTarget)}
// //               fill="none"
// //               stroke="#e5e7eb"
// //               strokeWidth={strokeMain}
// //               strokeLinecap="round"
// //             />
// //             <path
// //               d={arcPath(fullFrom, toDeg_LastMTD, rLastMTD)}
// //               fill="none"
// //               stroke="#f59e0b"
// //               strokeWidth={strokeLast}
// //               strokeLinecap="round"
// //             />
// //             <path
// //               d={arcPath(fullFrom, toDeg_MTD, rCurrent)}
// //               fill="none"
// //               stroke="#5EA68E"
// //               strokeWidth={strokeMain}
// //               strokeLinecap="round"
// //             />
// //             <circle
// //               cx={knobYellow.x}
// //               cy={knobYellow.y}
// //               r={10}
// //               fill="#f59e0b"
// //               stroke="#fffbeb"
// //               strokeWidth={4}
// //             />
// //             <circle
// //               cx={knobGreen.x}
// //               cy={knobGreen.y}
// //               r={14}
// //               fill="#5EA68E"
// //               stroke="#ecfdf3"
// //               strokeWidth={5}
// //             />
// //           </svg>
// //         </div>

// //         {/* Center metrics */}
// //         <div className="mt-2 text-center">
// //           <div className="text-3xl font-bold">{(pct * 100).toFixed(1)}%</div>
// //           <div
// //             className={`mx-auto mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
// //               badgeIsUp
// //                 ? "bg-green-50 text-green-700"
// //                 : "bg-rose-50 text-rose-700"
// //             }`}
// //           >
// //             {badgeStr}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Bottom cards */}
// //       <div className="mt-3 md:mt-12 mb-3 grid grid-cols-2 gap-4 text-base">
// //         <div className="flex flex-col text-center items-center justify-between rounded-xl bg-gray-50 p-3">
// //           <div className="text-charcoal-500">Today's Sale</div>
// //           <div className="mt-0.5 font-semibold">{fmtUSDk(todayApprox)}</div>
// //         </div>

// //         <div className="flex flex-col text-center items-center justify-between rounded-xl bg-gray-50 p-3">
// //           <div className="text-charcoal-500">MTD Sales</div>
// //           <div className="mt-0.5 font-semibold">{fmtUSDk(mtdUSD)}</div>
// //         </div>

// //         <div className="flex flex-col text-center items-center justify-between rounded-xl bg-gray-50 p-3">
// //           <div className="text-charcoal-500">Sales Target</div>
// //           <div className="mt-0.5 font-semibold">{fmtUSDk(targetUSD)}</div>
// //         </div>

// //         <div className="flex flex-col text-center items-center justify-between rounded-xl bg-gray-50 p-3">
// //           <div className="text-charcoal-500">{prevLabel} Sales</div>
// //           <div className="mt-0.5 font-semibold">
// //             {fmtUSDk(lastMonthTotalUSD)}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }





































// "use client";

// import React, { useMemo, useState } from "react";
// import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// import SegmentedToggle from "@/components/ui/SegmentedToggle";
// import { fmtUSDk } from "@/lib/dashboard/format";
// import {
//   getISTDayInfo,
//   getPrevMonthShortLabel,
//   getThisMonthShortLabel,
// } from "@/lib/dashboard/date";
// import type { RegionKey, RegionMetrics } from "@/lib/dashboard/types";

// type Props = {
//   regions: Record<RegionKey, RegionMetrics>;
//   defaultRegion?: RegionKey;
// };

// export default function SalesTargetCard({
//   regions,
//   defaultRegion = "Global",
// }: Props) {
//   // Tabs: Global + only connected countries
//   const availableRegions = useMemo<RegionKey[]>(() => {
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

//   const [tab, setTab] = useState<RegionKey>(defaultRegion);

//   const data = regions[tab] || regions.Global;
//   const { mtdUSD, lastMonthToDateUSD, lastMonthTotalUSD, targetUSD } = data;

//   const pct = targetUSD > 0 ? Math.min(mtdUSD / targetUSD, 1) : 0;
//   const pctLastMTD =
//     targetUSD > 0 ? Math.min(lastMonthToDateUSD / targetUSD, 1) : 0;

//   const deltaPct = (pct - pctLastMTD) * 100;

//   const { todayDay } = getISTDayInfo();
//   const todayApprox = todayDay > 0 ? mtdUSD / todayDay : 0;

//   const prevLabel = getPrevMonthShortLabel();
//   const thisMonthLabel = getThisMonthShortLabel();

//   // ↓ smaller gauge so the card is not too tall
//   const size = 220;
//   const strokeMain = 10;
//   const strokeLast = 5;

//   const cx = size / 2;
//   const rBase = size / 2 - strokeMain;
//   const gap = 12;

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
//     // removed h-full so the card height is just its content
//     <div className="rounded-2xl border bg-white py-4 px-3 shadow-sm flex flex-col gap-3">
//       {/* Header with tabs */}
//       <div className="flex flex-col items-center justify-between gap-1">
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
//           className="my-1"
//         />
//       </div>

//       {/* Legend */}
//       <div className="mt-2 flex items-center gap-2 text-xs">
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

//       {/* Gauge */}
//       {/* removed flex-1 so the gauge doesn't force extra height */}
//       <div className="mt-3 flex flex-col items-center justify-center">
//         <svg
//           width={size}
//           height={size / 2}
//           viewBox={`0 0 ${size} ${size / 2}`}
//         >
//           <path
//             d={arcPath(fullFrom, fullTo, rTarget)}
//             fill="none"
//             stroke="#e5e7eb"
//             strokeWidth={strokeMain}
//             strokeLinecap="round"
//           />
//           <path
//             d={arcPath(fullFrom, toDeg_LastMTD, rLastMTD)}
//             fill="none"
//             stroke="#f59e0b"
//             strokeWidth={strokeLast}
//             strokeLinecap="round"
//           />
//           <path
//             d={arcPath(fullFrom, toDeg_MTD, rCurrent)}
//             fill="none"
//             stroke="#5EA68E"
//             strokeWidth={strokeMain}
//             strokeLinecap="round"
//           />
//           <circle
//             cx={knobYellow.x}
//             cy={knobYellow.y}
//             r={9}
//             fill="#f59e0b"
//             stroke="#fffbeb"
//             strokeWidth={3}
//           />
//           <circle
//             cx={knobGreen.x}
//             cy={knobGreen.y}
//             r={12}
//             fill="#5EA68E"
//             stroke="#ecfdf3"
//             strokeWidth={4}
//           />
//         </svg>

//         {/* Center metrics */}
//         <div className="mt-1 text-center">
//           <div className="text-2xl font-bold">
//             {(pct * 100).toFixed(1)}%
//           </div>
//           <div
//             className={`mx-auto mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
//               badgeIsUp
//                 ? "bg-green-50 text-green-700"
//                 : "bg-rose-50 text-rose-700"
//             }`}
//           >
//             {badgeStr}
//           </div>
//         </div>
//       </div>

//       {/* Bottom cards */}
//       <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
//         <div className="flex flex-col text-center items-center justify-between rounded-xl bg-gray-50 p-2.5">
//           <div className="text-charcoal-500">Today's Sale</div>
//           <div className="mt-0.5 font-semibold">
//             {fmtUSDk(todayApprox)}
//           </div>
//         </div>

//         <div className="flex flex-col text-center items-center justify-between rounded-xl bg-gray-50 p-2.5">
//           <div className="text-charcoal-500">MTD Sales</div>
//           <div className="mt-0.5 font-semibold">
//             {fmtUSDk(mtdUSD)}
//           </div>
//         </div>

//         <div className="flex flex-col text-center items-center justify-between rounded-xl bg-gray-50 p-2.5">
//           <div className="text-charcoal-500">Sales Target</div>
//           <div className="mt-0.5 font-semibold">
//             {fmtUSDk(targetUSD)}
//           </div>
//         </div>

//         <div className="flex flex-col text-center items-center justify-between rounded-xl bg-gray-50 p-2.5">
//           <div className="text-charcoal-500">{prevLabel} Sales</div>
//           <div className="mt-0.5 font-semibold">
//             {fmtUSDk(lastMonthTotalUSD)}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }














"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import {
  getISTDayInfo,
  getPrevMonthShortLabel,
  getThisMonthShortLabel,
} from "@/lib/dashboard/date";
import type { RegionKey, RegionMetrics } from "@/lib/dashboard/types";

type CurrencyCode = "USD" | "GBP" | "INR" | "CAD";

// type Props = {
//   regions: Record<RegionKey, RegionMetrics>;
//   defaultRegion?: RegionKey;
// ✅ pass from DashboardPage
//   homeCurrency: CurrencyCode;
//   convertToHomeCurrency: (
//     value: number,
//     from: CurrencyCode
//   ) => number;
//   formatHomeK: (value: number) => string;
// };

type Props = {
  regions: Record<RegionKey, RegionMetrics>;
  value: RegionKey;
  onChange: (r: RegionKey) => void;
  defaultRegion?: RegionKey;
  hideTabs?: boolean;
  homeCurrency: CurrencyCode;
  convertToHomeCurrency: (value: number, from: CurrencyCode) => number;
  formatHomeK: (value: number) => string;
  todaySales?: number;

};

export default function SalesTargetCard({
  regions,
  value,
  onChange,
  homeCurrency,
  convertToHomeCurrency,
  formatHomeK,
  hideTabs,
  todaySales
}: Props) {
  const tab = value;

  const availableRegions = useMemo<RegionKey[]>(() => {
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

  const data = regions[tab] || regions.Global;

  // RegionMetrics are stored in USD in your current data model
  const mtdHome = convertToHomeCurrency(data.mtdUSD ?? 0, "USD");
  const lastMtdHome = convertToHomeCurrency(
    data.lastMonthToDateUSD ?? 0,
    "USD"
  );
  const lastMonthTotalHome = convertToHomeCurrency(
    data.lastMonthTotalUSD ?? 0,
    "USD"
  );
  const targetHome = convertToHomeCurrency(data.targetUSD ?? 0, "USD");

  const pct =
    targetHome > 0 ? Math.min(mtdHome / targetHome, 1) : 0;
  const pctLastMTD =
    targetHome > 0
      ? Math.min(lastMtdHome / targetHome, 1)
      : 0;

  const deltaPct = (pct - pctLastMTD) * 100;

  const { todayDay } = getISTDayInfo();
  const todayApproxHome = todayDay > 0 ? mtdHome / todayDay : 0;

  // ✅ NEW: if Dashboard passes todaySales, use it
  // const todayHome = useMemo(() => {
  //   if (typeof todaySales === "number" && !Number.isNaN(todaySales)) {
  //     return todaySales; // already in home currency from Dashboard
  //   }
  //   return todayApproxHome; // fallback
  // }, [todaySales, todayApproxHome]);

  const todayHome = typeof todaySales === "number" ? todaySales : todayApproxHome;

  const prevLabel = getPrevMonthShortLabel();
  const thisMonthLabel = getThisMonthShortLabel();

  // Gauge sizing
  const size = 220;
  const strokeMain = 10;
  const strokeLast = 5;

  const cx = size / 2;
  const rBase = size / 2 - strokeMain;
  const gap = 12;

  const rTarget = rBase;
  const rCurrent = rBase;
  const rLastMTD = rCurrent - strokeMain / 2 - gap - strokeLast / 2;

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

  const fullFrom = 0;
  const fullTo = 180;
  const toDeg_MTD = 180 * pct;
  const toDeg_LastMTD = 180;

  const knobGreen = toXYRadius(toDeg_MTD, rCurrent);
  const knobYellow = toXYRadius(toDeg_LastMTD, rLastMTD);

  const badgeIsUp = deltaPct >= 0;
  const badgeStr =
    (badgeIsUp ? "▲ " : "▼ ") + `${Math.abs(deltaPct).toFixed(2)}%`;


  const salesTrendPct =
    lastMtdHome > 0 ? ((mtdHome - lastMtdHome) / lastMtdHome) * 100 : 0;

  const targetTrendPct =
    lastMonthTotalHome > 0
      ? ((targetHome - lastMonthTotalHome) / lastMonthTotalHome) * 100
      : 0;

  return (
    <div className="rounded-2xl border p-5 shadow-sm h-full flex flex-col bg-[#D9D9D933]">
      {/* Header */}
      <div className="relative flex flex-col items-center gap-1">
        <PageBreadcrumb
          pageTitle="Sales Target"
          textSize="2xl"
          variant="page"
          align="center"
        />

        {!hideTabs && (
          <SegmentedToggle<RegionKey>
            value={tab}
            options={availableRegions.map((r) => ({ value: r }))}
            onChange={onChange}
            className="mt-2"
          />
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "#5EA68E" }} />
          <span className="text-gray-600">MTD Sales</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "#9ca3af" }} />
          <span className="text-gray-600">{thisMonthLabel} Target</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "#FFBE25" }} />
          <span className="text-gray-600">{prevLabel} MTD</span>
        </div>
      </div>

      {/* Gauge */}
      <div className="mt-6 flex flex-col items-center justify-center">
        <svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2}`}>
          <path
            d={arcPath(fullFrom, fullTo, rTarget)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeMain}
            strokeLinecap="round"
          />
          <path
            d={arcPath(fullFrom, toDeg_LastMTD, rLastMTD)}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={strokeLast}
            strokeLinecap="round"
          />
          <path
            d={arcPath(fullFrom, toDeg_MTD, rCurrent)}
            fill="none"
            stroke="#5EA68E"
            strokeWidth={strokeMain}
            strokeLinecap="round"
          />
          <circle
            cx={knobYellow.x}
            cy={knobYellow.y}
            r={9}
            fill="#f59e0b"
            stroke="#fffbeb"
            strokeWidth={3}
          />
          <circle
            cx={knobGreen.x}
            cy={knobGreen.y}
            r={12}
            fill="#5EA68E"
            stroke="#ecfdf3"
            strokeWidth={4}
          />
        </svg>

        <div className="mt-2 text-center">
          <div className="text-3xl font-semibold">{(pct * 100).toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">Target Achieved</div>

          <div
            className={`mx-auto mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${badgeIsUp ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"
              }`}
          >
            {badgeStr}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 text-sm">
          {[
            {
              title: "Today",
              // ✅ CHANGE THIS LINE
              value: formatHomeK(todayHome),
              helper: "\u00A0",
            },
            {
              title: "MTD Sales",
              value: formatHomeK(mtdHome),
              helper: "\u00A0",
            },
            {
              title: "Target",
              value: formatHomeK(targetHome),
              helper: "\u00A0",
            },
            {
              title: prevLabel,
              value: formatHomeK(lastMonthTotalHome),
              helper: "\u00A0",
            },
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
              className="rounded-xl p-3 text-center h-full flex flex-col items-center"
            >
              <div className="text-charcoal-500 whitespace-nowrap leading-none">
                {t.title}
              </div>
              <div className="mt-2 font-semibold whitespace-nowrap leading-none">
                {t.value}
              </div>
              <div
                className={`mt-1 text-[11px] leading-none ${t.helper === "\u00A0" ? "text-transparent select-none" : "text-gray-500"
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
