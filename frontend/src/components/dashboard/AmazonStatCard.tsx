// // // components/dashboard/AmazonStatCard.tsx
// // "use client";

// // import React from "react";
// // import ValueOrSkeleton from "@/components/common/ValueOrSkeleton";
// // import {
// //   calcDeltaPct,
// //   fmtGBP,
// //   fmtInt,
// //   fmtPct,
// //   toNumberSafe,
// // } from "@/lib/dashboard/format";

// // export type AmazonStatCardProps = {
// //   label: string;
// //   current: number | null | undefined;
// //   previous: number | null | undefined;
// //   loading: boolean;
// //   formatter?: (v: any) => string;
// //   bottomLabel: string; // e.g. "Nov'25"
// //   className?: string;
// //   deltaPct?: number;
// // };

// // export default function AmazonStatCard({
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

// //   let deltaContent: React.ReactNode = "—";
// //   if (delta != null) {
// //     deltaContent = (
// //       <>
// //         <span className="mr-0.5">{isUp ? "▲" : "▼"}</span>
// //         {Math.abs(delta).toFixed(2)}%
// //       </>
// //     );
// //   }

// //   const deltaColor =
// //     delta == null
// //       ? "text-gray-500"
// //       : isUp
// //       ? "text-emerald-600"
// //       : "text-rose-600";

// //   return (
// //     <div
// //       className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between ${
// //         className || ""
// //       }`}
// //     >
// //       <div className="text-sm font-medium text-charcoal-500">{label}</div>

// //       <div className="mt-1 text-lg font-semibold">
// //         <ValueOrSkeleton loading={loading} mode="inline" compact>
// //           {formatter(currVal)}
// //         </ValueOrSkeleton>
// //       </div>

// //       <div className="mt-3 flex items-end justify-between text-xs text-charcoal-500">
// //         <div className="flex flex-col">
// //           <span>{bottomLabel}:</span>
// //           <span className="font-medium">
// //             {previous == null ? "—" : formatter(prevVal)}
// //           </span>
// //         </div>

// //         <div
// //           className={`inline-flex items-center font-semibold ${deltaColor}`}
// //         >
// //           {deltaContent}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }






























// // components/dashboard/AmazonStatCard.tsx
// "use client";

// import React from "react";
// import ValueOrSkeleton from "@/components/common/ValueOrSkeleton";
// import { calcDeltaPct, fmtGBP, toNumberSafe } from "@/lib/dashboard/format";

// export type AmazonStatCardProps = {
//   label: string;
//   current: number | null | undefined;
//   previous: number | null | undefined;
//   loading: boolean;
//   formatter?: (v: any) => string;
//   bottomLabel: string; // e.g. "Nov'25"
//   className?: string;

//   /**
//    * Optional override for delta display.
//    * - If omitted: uses existing behavior calcDeltaPct(current, previous)
//    * - If provided (including null): uses this value (null => show "—")
//    * Use this for Profit % to show percentage-points (pp) deltas.
//    */
//   deltaPct?: number | null;
// };

// export default function AmazonStatCard({
//   label,
//   current,
//   previous,
//   loading,
//   formatter = fmtGBP,
//   bottomLabel,
//   className,
//   deltaPct,
// }: AmazonStatCardProps) {
//   const currVal = toNumberSafe(current);
//   const prevVal = previous != null ? toNumberSafe(previous) : 0;

//   // ✅ Preserve old behavior by default
//   const computedDelta = calcDeltaPct(currVal, prevVal); // may be null

//   // ✅ If deltaPct is passed, override display delta
//   const deltaToShow =
//     deltaPct === undefined ? computedDelta : deltaPct == null ? null : Number(deltaPct);

//   const isUp = deltaToShow != null && deltaToShow >= 0;

//   // ✅ If delta is overridden AND label is percent-ish, show "pp" (percentage points)
//   const isPercentLabel = label.trim().toLowerCase().includes("%");
//   const suffix = deltaPct !== undefined && isPercentLabel ? "pp" : "%";

//   let deltaContent: React.ReactNode = "—";
//   if (deltaToShow != null) {
//     deltaContent = (
//       <>
//         <span className="mr-0.5">{isUp ? "▲" : "▼"}</span>
//         {Math.abs(deltaToShow).toFixed(2)}
//         {suffix}
//       </>
//     );
//   }

//   const deltaColor =
//     deltaToShow == null
//       ? "text-gray-500"
//       : isUp
//       ? "text-emerald-600"
//       : "text-rose-600";

//   return (
//     <div
//       className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between ${
//         className || ""
//       }`}
//     >
//       <div className="text-sm font-medium text-charcoal-500">{label}</div>

//       <div className="mt-1 text-lg font-semibold">
//         <ValueOrSkeleton loading={loading} mode="inline" compact>
//           {formatter(currVal)}
//         </ValueOrSkeleton>
//       </div>

//       <div className="mt-3 flex items-end justify-between text-xs text-charcoal-500">
//         <div className="flex flex-col">
//           <span>{bottomLabel}:</span>
//           <span className="font-medium">
//             {previous == null ? "—" : formatter(prevVal)}
//           </span>
//         </div>

//         <div className={`inline-flex items-center font-semibold ${deltaColor}`}>
//           {deltaContent}
//         </div>
//       </div>
//     </div>
//   );
// }








"use client";

import React from "react";
import ValueOrSkeleton from "@/components/common/ValueOrSkeleton";
import { calcDeltaPct, fmtGBP, toNumberSafe } from "@/lib/dashboard/format";

export type AmazonStatCardProps = {
  label: string;
  current: number | null | undefined;
  previous: number | null | undefined;
  loading: boolean;
  formatter?: (v: any) => string;
  bottomLabel: string;
  className?: string;

  /**
   * Optional override for delta display.
   * - If omitted: uses calcDeltaPct(current, previous)
   * - If provided (including null): uses this value
   *   (null => show "—")
   */
  deltaPct?: number | null;
};

export default function AmazonStatCard({
  label,
  current,
  previous,
  loading,
  formatter = fmtGBP,
  bottomLabel,
  className = "",
  deltaPct,
}: AmazonStatCardProps) {
  const currVal = toNumberSafe(current);
  const prevVal = previous != null ? toNumberSafe(previous) : 0;

  // default delta logic
  const computedDelta = calcDeltaPct(currVal, prevVal);

  // override if provided
  const deltaToShow =
    deltaPct === undefined ? computedDelta : deltaPct == null ? null : Number(deltaPct);

  const isUp = deltaToShow != null && deltaToShow >= 0;

  const isPercentLabel = label.toLowerCase().includes("%");
  const suffix = "%";


  let deltaContent: React.ReactNode = "—";
  if (deltaToShow != null) {
    deltaContent = (
      <>
        <span className="mr-0.5">{isUp ? "▲" : "▼"}</span>
        {Math.abs(deltaToShow).toFixed(2)}
        {suffix}
      </>
    );
  }

  const deltaColor =
    deltaToShow == null
      ? "text-gray-400"
      : isUp
        ? "text-emerald-600"
        : "text-rose-600";

  return (
    <div
      className={`w-full min-w-0 rounded-2xl border p-3 sm:p-4 shadow-sm flex flex-col justify-between ${className}`}
    >
      {/* Label */}
      <div className="text-[11px] sm:text-xs font-medium text-charcoal-500 truncate">
        {label}
      </div>

      <div className="mt-1 text-lg font-semibold min-w-0 truncate">
        <ValueOrSkeleton loading={loading} mode="inline" compact>
          <span className="block min-w-0 truncate">
            {formatter(currVal)}
          </span>
        </ValueOrSkeleton>
      </div>

      {/* Bottom row */}
      <div className="mt-3 flex items-end justify-between gap-2 text-[10px] sm:text-xs text-charcoal-500 min-w-0">
        {/* Previous value */}
        <div className="flex flex-col min-w-0">
          <span className="truncate">{bottomLabel}:</span>
          <span className="font-medium truncate">
            {previous == null ? "—" : formatter(prevVal)}
          </span>
        </div>

        {/* Delta */}
        <div className={`shrink-0 inline-flex items-center font-semibold ${deltaColor}`}>
          {deltaContent}
        </div>
      </div>
    </div>
  );
}
