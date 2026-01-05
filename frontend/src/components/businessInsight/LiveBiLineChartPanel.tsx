// "use client";

// import React, { useMemo, useState } from "react";
// import dynamic from "next/dynamic";
// import SegmentedToggle from "../ui/SegmentedToggle";
// import { usePlatform } from "@/components/context/PlatformContext";
// import type { PlatformId } from "@/lib/utils/platforms";
// import { platformToCurrencyCode, getCurrencySymbol } from "@/lib/utils/currency";

// const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

// type ChartMetric = "net_sales" | "quantity";

// type DailyPoint = {
//   date: string;
//   quantity?: number;
//   net_sales?: number;
// };

// type DailySeries = {
//   previous: DailyPoint[];
//   current_mtd: DailyPoint[];
// };

// type PeriodInfo = {
//   label: string;
//   start_date: string;
//   end_date: string;
// };

// type Props = {
//   dailySeries: DailySeries | null;
//   periods?: {
//     previous?: PeriodInfo;
//     current_mtd?: PeriodInfo;
//   } | null;
//   loading?: boolean;
//   error?: string | null;
// };

// type DayRange = { start: number; end: number };


// const monthTickLabel = (p?: PeriodInfo) => {
//   const src = p?.start_date || p?.end_date || "";
//   if (!src) return p?.label || "";

//   const [y, m] = src.split("-");
//   const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//   const mi = Number(m) - 1;

//   if (!Number.isFinite(mi) || mi < 0 || mi > 11) return p?.label || "";
//   return `${monthNames[mi]}'${y.slice(-2)}`;
// };

// const LiveLineChart: React.FC<{
//   dataPrev: DailyPoint[];
//   dataCurr: DailyPoint[];
//   metric: ChartMetric;
//   prevLabel?: string;
//   currLabel?: string;
//   currencySymbol?: string;
// }> = ({ dataPrev, dataCurr, metric, prevLabel, currLabel, currencySymbol }) => {
//   const getDay = (dateStr: string) => Number(dateStr?.split("-")?.[2]);

//   const prevDays = dataPrev.map((d) => getDay(d.date)).filter(Number.isFinite);
//   const currDays = dataCurr.map((d) => getDay(d.date)).filter(Number.isFinite);
//   const allDaysRaw = [...prevDays, ...currDays].sort((a, b) => a - b);

//   if (!allDaysRaw.length) {
//     return <p className="text-xs text-gray-500">No daily data available.</p>;
//   }

//   const minDay = allDaysRaw[0];
//   const maxDay = allDaysRaw[allDaysRaw.length - 1];
//   const allDays = Array.from({ length: maxDay - minDay + 1 }, (_, i) => minDay + i);

//   const buildSeries = (data: DailyPoint[]) =>
//     allDays.map((day) => {
//       const pt = data.find((d) => getDay(d.date) === day);
//       return pt ? (metric === "quantity" ? pt.quantity ?? null : pt.net_sales ?? null) : null;
//     });

//   const yAxisName =
//     metric === "net_sales"
//       ? currencySymbol
//         ? `Sales (${currencySymbol})`
//         : "Sales"
//       : "Units";

//   const option = {
//     color: ["#CECBC7", "#F47A00"],
//     // tooltip: { trigger: "axis" },
//     tooltip: {
//       trigger: "axis",
//       formatter: (params: any) => {
//         const day = params?.[0]?.axisValue ?? "";
//         const lines = (params || []).map((p: any) => {
//           const val = p.data;
//           const shown =
//             val == null
//               ? "-"
//               : metric === "net_sales"
//                 ? `${Number(val).toFixed(2)}`
//                 : `${Number(val)}`;
//           return `${p.marker}${p.seriesName} <b>${shown}</b>`;
//         });

//         return [`Day ${day}`, ...lines].join("<br/>");
//       },
//     },

//     legend: {
//       top: 4,
//       left: "left",
//       orient: "horizontal",
//       align: "left",
//       icon: "rect",
//       itemWidth: 12,
//       itemHeight: 12,
//       itemGap: 20,
//       textStyle: {
//         fontSize: 13,
//         lineHeight: 14,
//         color: "#6B7280",
//         padding: [0, 6, 0, 6],
//       },
//       data: [prevLabel || "Previous", currLabel || "Current"],
//     },

//     grid: { left: 40, right: 16, top: 50, bottom: 40 },
//     xAxis: {
//       type: "category",
//       data: allDays.map(String),
//       boundaryGap: false,
//       name: "Days",
//       nameLocation: "middle",
//       nameGap: 25,
//     },
//     yAxis: {
//       type: "value",
//       name: yAxisName,
//       nameLocation: "middle",
//       nameGap: 40,
//     },
//     series: [
//       { name: prevLabel || "Previous", type: "line", data: buildSeries(dataPrev), smooth: true, showSymbol: false },
//       { name: currLabel || "Current MTD", type: "line", data: buildSeries(dataCurr), smooth: true, showSymbol: false },
//     ],
//   };

//   return <ReactECharts option={option} style={{ width: "100%", height: 260 }} />;
// };

// export default function LiveBiLineGraph({ dailySeries, periods, loading, error }: Props) {
//   const [chartMetric, setChartMetric] = useState<ChartMetric>("net_sales");

//   // ✅ platform comes from your sidebar selection (PlatformContext)
//   const { platform } = usePlatform() as { platform?: PlatformId };

//   const prevLegend = useMemo(() => monthTickLabel(periods?.previous), [periods]);
//   const currLegend = useMemo(() => monthTickLabel(periods?.current_mtd), [periods]);

//   // ✅ auto currency based on selected platform
//   const currencyCode = useMemo(() => platformToCurrencyCode(platform), [platform]);
//   const currencySymbol = useMemo(() => getCurrencySymbol(currencyCode), [currencyCode]);

//   return (
//     <div className="w-full">
//       <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-3">
//         <div>
//           <h2 className="text-xl font-bold text-[#414042]">Performance Trend</h2>
//         </div>

//         <div className="w-full md:w-auto">
//           <SegmentedToggle<ChartMetric>
//             value={chartMetric}
//             onChange={setChartMetric}
//             options={[
//               { value: "net_sales", label: "Net Sales" },
//               { value: "quantity", label: "Units" },
//             ]}
//             textSizeClass="text-xs"
//             className="border-[#D9D9D9E5] bg-white"
//           />
//         </div>
//       </div>

//       <div className="mt-3">
//         {loading && <div className="text-sm text-gray-500">Loading chart…</div>}
//         {error && <div className="text-sm text-red-500">{error}</div>}

//         {!loading && !error && dailySeries && (
//           <LiveLineChart
//             dataPrev={dailySeries.previous || []}
//             dataCurr={dailySeries.current_mtd || []}
//             metric={chartMetric}
//             prevLabel={prevLegend}
//             currLabel={currLegend}
//             currencySymbol={currencySymbol}
//           />
//         )}

//         {!loading && !error && !dailySeries && <div className="text-sm text-gray-500">No daily data available.</div>}
//       </div>
//     </div>
//   );
// }
































"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import SegmentedToggle from "../ui/SegmentedToggle";
import { usePlatform } from "@/components/context/PlatformContext";
import type { PlatformId } from "@/lib/utils/platforms";
import { platformToCurrencyCode, getCurrencySymbol } from "@/lib/utils/currency";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

type ChartMetric = "net_sales" | "quantity";

type DailyPoint = {
  date: string;
  quantity?: number;
  net_sales?: number;
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

type Props = {
  dailySeries: DailySeries | null;
  periods?: {
    previous?: PeriodInfo;
    current_mtd?: PeriodInfo;
  } | null;
  loading?: boolean;
  error?: string | null;

  // ✅ NEW: range from dashboard picker
  selectedStartDay?: number | null;
  selectedEndDay?: number | null;
  currencySymbol?: string;
};

const monthTickLabel = (p?: PeriodInfo) => {
  const src = p?.start_date || p?.end_date || "";
  if (!src) return p?.label || "";

  const [y, m] = src.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mi = Number(m) - 1;

  if (!Number.isFinite(mi) || mi < 0 || mi > 11) return p?.label || "";
  return `${monthNames[mi]}'${y.slice(-2)}`;
};

const clampDay = (d: number) => Math.max(1, Math.min(31, d));

const LiveLineChart: React.FC<{
  dataPrev: DailyPoint[];
  dataCurr: DailyPoint[];
  metric: ChartMetric;
  prevLabel?: string;
  currLabel?: string;
  currencySymbol?: string;

  // ✅ NEW: range from dashboard picker
  selectedStartDay?: number | null;
  selectedEndDay?: number | null;
}> = ({
  dataPrev,
  dataCurr,
  metric,
  prevLabel,
  currLabel,
  currencySymbol,
  selectedStartDay,
  selectedEndDay,
}) => {
    const getDay = (dateStr: string) => Number(dateStr?.split("-")?.[2]);

    const rangeActive = selectedStartDay != null && selectedEndDay != null;
    const s = rangeActive ? clampDay(Math.min(selectedStartDay!, selectedEndDay!)) : null;
    const e = rangeActive ? clampDay(Math.max(selectedStartDay!, selectedEndDay!)) : null;

    // ✅ x-axis days forced to selected range, otherwise fallback to data min/max
    const allDays = useMemo(() => {
      if (rangeActive && s != null && e != null) {
        return Array.from({ length: e - s + 1 }, (_, i) => s + i);
      }

      const prevDays = dataPrev.map((d) => getDay(d.date)).filter(Number.isFinite);
      const currDays = dataCurr.map((d) => getDay(d.date)).filter(Number.isFinite);
      const allDaysRaw = [...prevDays, ...currDays].sort((a, b) => a - b);

      if (!allDaysRaw.length) return [];

      const minDay = allDaysRaw[0];
      const maxDay = allDaysRaw[allDaysRaw.length - 1];
      return Array.from({ length: maxDay - minDay + 1 }, (_, i) => minDay + i);
    }, [rangeActive, s, e, dataPrev, dataCurr]);

    if (!allDays.length) {
      return <p className="text-xs text-gray-500">No daily data available.</p>;
    }

    const buildSeries = (data: DailyPoint[]) =>
      allDays.map((day) => {
        const pt = data.find((d) => getDay(d.date) === day);
        return pt ? (metric === "quantity" ? pt.quantity ?? null : pt.net_sales ?? null) : null;
      });

    const yAxisName =
      metric === "net_sales"
        ? currencySymbol
          ? `Sales (${currencySymbol})`
          : "Sales"
        : "Units";

    const option = {
      color: ["#CECBC7", "#F47A00"],
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const day = params?.[0]?.axisValue ?? "";
          const lines = (params || []).map((p: any) => {
            const val = p.data;
            const shown =
              val == null
                ? "-"
                : metric === "net_sales"
                  ? `${Number(val).toFixed(2)}`
                  : `${Number(val)}`;
            return `${p.marker}${p.seriesName} <b>${shown}</b>`;
          });

          return [`Day ${day}`, ...lines].join("<br/>");
        },
      },
      legend: {
        top: 4,
        left: "left",
        orient: "horizontal",
        align: "left",
        icon: "rect",
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 20,
        textStyle: {
          fontSize: 13,
          lineHeight: 14,
          color: "#6B7280",
          padding: [0, 6, 0, 6],
        },
        data: [prevLabel || "Previous", currLabel || "Current"],
      },
      grid: { left: 40, right: 16, top: 50, bottom: 40 },
      xAxis: {
        type: "category",
        data: allDays.map(String),
        boundaryGap: false,
        name: "Days",
        nameLocation: "middle",
        nameGap: 25,
      },
      yAxis: {
        type: "value",
        name: yAxisName,
        nameLocation: "middle",
        nameGap: 40,
      },
      series: [
        {
          name: prevLabel || "Previous",
          type: "line",
          data: buildSeries(dataPrev),
          smooth: true,
          showSymbol: false,
        },
        {
          name: currLabel || "Current MTD",
          type: "line",
          data: buildSeries(dataCurr),
          smooth: true,
          showSymbol: false,
        },
      ],
    };

    return <ReactECharts option={option} style={{ width: "100%", height: 260 }} />;
  };

export default function LiveBiLineChartPanel({
  dailySeries,
  periods,
  loading,
  error,
  selectedStartDay,
  selectedEndDay,
  currencySymbol
}: Props) {
  const [chartMetric, setChartMetric] = useState<ChartMetric>("net_sales");

  // const { platform } = usePlatform() as { platform?: PlatformId };

  const prevLegend = useMemo(() => monthTickLabel(periods?.previous), [periods]);
  const currLegend = useMemo(() => monthTickLabel(periods?.current_mtd), [periods]);

  // const currencyCode = useMemo(() => platformToCurrencyCode(platform), [platform]);
  // const currencySymbol = useMemo(() => getCurrencySymbol(currencyCode), [currencyCode]);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#414042]">Performance Trend</h2>
        </div>

        <div className="w-full md:w-auto">
          <SegmentedToggle<ChartMetric>
            value={chartMetric}
            onChange={setChartMetric}
            options={[
              { value: "net_sales", label: "Net Sales" },
              { value: "quantity", label: "Units" },
            ]}
            textSizeClass="text-xs"
            className="border-[#D9D9D9E5] bg-white"
          />
        </div>
      </div>

      <div className="mt-3">
        {loading && <div className="text-sm text-gray-500">Loading chart…</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}

        {!loading && !error && dailySeries && (
          <LiveLineChart
            dataPrev={dailySeries.previous || []}
            dataCurr={dailySeries.current_mtd || []}
            metric={chartMetric}
            prevLabel={prevLegend}
            currLabel={currLegend}
            currencySymbol={currencySymbol}   // ✅ from props now
            selectedStartDay={selectedStartDay}
            selectedEndDay={selectedEndDay}
          />

        )}

        {!loading && !error && !dailySeries && (
          <div className="text-sm text-gray-500">No daily data available.</div>
        )}
      </div>
    </div>
  );
}
