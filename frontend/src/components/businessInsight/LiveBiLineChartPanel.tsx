// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import dynamic from "next/dynamic";
// import { DateRange } from "react-date-range";
// import "react-date-range/dist/styles.css";
// import "react-date-range/dist/theme/default.css";
// import { FaCalendarAlt } from "react-icons/fa";

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

// type ApiResponse = {
//   periods?: {
//     previous?: PeriodInfo;
//     current_mtd?: PeriodInfo;
//   };
//   daily_series?: DailySeries;
// };

// type Props = {
//   countryName: string; // "uk" | "us" | "ca"
//   ranged: string;      // "MTD" etc
//   month: string;       // "november"
//   year: string;        // "2025"
// };

// const API_BASE = "http://127.0.0.1:5000";

// const api = axios.create({ baseURL: API_BASE });
// api.interceptors.request.use((cfg) => {
//   const t = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
//   if (t) cfg.headers.Authorization = `Bearer ${t}`;
//   return cfg;
// });

// // ---------- small helpers ----------
// const getShort = (label?: string) => (label ? label.split(" ")[0] || label : "");

// const LiveLineChart: React.FC<{
//   dataPrev: DailyPoint[];
//   dataCurr: DailyPoint[];
//   metric: ChartMetric;
//   prevLabel?: string;
//   currLabel?: string;
//   selectedStartDay?: number | null;
//   selectedEndDay?: number | null;
// }> = ({
//   dataPrev,
//   dataCurr,
//   metric,
//   prevLabel,
//   currLabel,
//   selectedStartDay,
//   selectedEndDay,
// }) => {
//   const getDay = (dateStr: string) => Number(dateStr?.split("-")?.[2]);

//   const allDates = [...dataPrev, ...dataCurr].map((d) => d.date).filter(Boolean);
//   if (!allDates.length) return <p className="text-xs text-gray-500">No daily data available.</p>;

//   const base = new Date(allDates[0]);
//   if (Number.isNaN(base.getTime())) return <p className="text-xs text-gray-500">No daily data available.</p>;

//   const year = base.getFullYear();
//   const monthIndex = base.getMonth();
//   const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

//   let allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
//   if (selectedStartDay && selectedEndDay) {
//     const s = Math.min(selectedStartDay, selectedEndDay);
//     const e = Math.max(selectedStartDay, selectedEndDay);
//     allDays = allDays.filter((d) => d >= s && d <= e);
//   }

//   const prevSeries = allDays.map((day) => {
//     const pt = dataPrev.find((d) => getDay(d.date) === day);
//     return pt ? (metric === "quantity" ? pt.quantity ?? null : pt.net_sales ?? null) : null;
//   });

//   const currSeries = allDays.map((day) => {
//     const pt = dataCurr.find((d) => getDay(d.date) === day);
//     return pt ? (metric === "quantity" ? pt.quantity ?? null : pt.net_sales ?? null) : null;
//   });

//   const option = {
//     color: ['#CECBC7', '#F47A00'],
//     tooltip: { trigger: "axis" },
//     grid: { left: 40, right: 16, top: 24, bottom: 40 },
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
//       name: metric === "net_sales" ? "Sales" : "Units",
//       nameLocation: "middle",
//       nameGap: 40,
//     },
//     series: [
//       { name: prevLabel || "Previous", type: "line", data: prevSeries, smooth: true, showSymbol: false },
//       { name: currLabel || "Current MTD", type: "line", data: currSeries, smooth: true, showSymbol: false },
//     ],
//   };

//   return <ReactECharts option={option} style={{ width: "100%", height: 260 }} />;
// };

// export default function LiveBiLineGraph({ countryName, ranged, month, year }: Props) {
//   const normalizedCountry = (countryName || "").toLowerCase();

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const [periods, setPeriods] = useState<ApiResponse["periods"] | null>(null);
//   const [dailySeries, setDailySeries] = useState<DailySeries | null>(null);

//   const [chartMetric, setChartMetric] = useState<ChartMetric>("net_sales");

//   // date-range UI state (same behavior as MonthsforBI, but simplified)
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [calendarRange, setCalendarRange] = useState<any>([
//     { startDate: null, endDate: null, key: "selection" },
//   ]);
//   const [selectedStartDay, setSelectedStartDay] = useState<number | null>(null);
//   const [selectedEndDay, setSelectedEndDay] = useState<number | null>(null);
//   const [pendingStartDay, setPendingStartDay] = useState<number | null>(null);
//   const [pendingEndDay, setPendingEndDay] = useState<number | null>(null);

//   const fetchGraph = async (startDay?: number | null, endDay?: number | null) => {
//     if (!normalizedCountry || normalizedCountry === "global") return;

//     setLoading(true);
//     setError(null);

//     try {
//       const res = await api.get<ApiResponse>("/live_mtd_bi", {
//         params: {
//           countryName: normalizedCountry,
//           ranged,
//           month,
//           year,
//           generate_ai_insights: "false",
//           start_day: startDay ?? undefined,
//           end_day: endDay ?? undefined,
//         },
//       });

//       setPeriods(res.data.periods || null);
//       setDailySeries(res.data.daily_series || null);
//     } catch (err: any) {
//       setError(err?.response?.data?.error || "Failed to load line graph.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchGraph(null, null);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [normalizedCountry, ranged, month, year]);

//   const prevShort = getShort(periods?.previous?.label);
//   const currShort = getShort(periods?.current_mtd?.label);

//   const handleCalendarChange = (ranges: any) => {
//     const range = ranges.selection;
//     setCalendarRange([range]);

//     if (range.startDate && range.endDate) {
//       setPendingStartDay(range.startDate.getDate());
//       setPendingEndDay(range.endDate.getDate());
//     } else {
//       setPendingStartDay(null);
//       setPendingEndDay(null);
//     }
//   };

//   const applyRange = () => {
//     setSelectedStartDay(pendingStartDay);
//     setSelectedEndDay(pendingEndDay);
//     fetchGraph(pendingStartDay, pendingEndDay);
//     setShowCalendar(false);
//   };

//   const clearRange = () => {
//     setCalendarRange([{ startDate: null, endDate: null, key: "selection" }]);
//     setPendingStartDay(null);
//     setPendingEndDay(null);
//   };

//   const closeAndReset = () => {
//     setCalendarRange([{ startDate: null, endDate: null, key: "selection" }]);
//     setPendingStartDay(null);
//     setPendingEndDay(null);
//     setSelectedStartDay(null);
//     setSelectedEndDay(null);
//     fetchGraph(null, null);
//     setShowCalendar(false);
//   };

//   return (
//     <div className="w-full">
//       <div className="flex items-start justify-between gap-3">
//         <div>
//           <h2 className="text-xl font-bold text-[#414042]">
//           Performance Trend{" "}
//             {/* <span className="text-[#5EA68E]">
//               {prevShort && currShort ? `(${currShort} vs ${prevShort})` : ""}
//             </span> */}
//           </h2>
//           {/* <p className="text-sm text-gray-500">
//             {chartMetric === "net_sales" ? "Net Sales Trend" : "Units Trend"}
//           </p> */}
//         </div>

//         <div className="flex items-center gap-2">
//           {/* Metric toggle */}
//           <div className="p-1 text-xs" style={{ border: "1px solid #D9D9D9E5", borderRadius: 8 }}>
//             <button
//               type="button"
//               onClick={() => setChartMetric("net_sales")}
//               style={{
//                 padding: "3px 12px",
//                 border: "none",
//                 borderRadius: 5,
//                 background: chartMetric === "net_sales" ? "#5EA68E80" : "#fff",
//               }}
//             >
//               Net Sales
//             </button>
//             <button
//               type="button"
//               onClick={() => setChartMetric("quantity")}
//               style={{
//                 padding: "3px 12px",
//                 border: "none",
//                 borderRadius: 5,
//                 background: chartMetric === "quantity" ? "#5EA68E80" : "#fff",
//               }}
//             >
//               Units
//             </button>
//           </div>

//           {/* Calendar */}
//           <div className="relative">
//             <button
//               type="button"
//               onClick={() => setShowCalendar((s) => !s)}
//               className="flex items-center gap-2"
//               style={{
//                 padding: "6px 10px",
//                 borderRadius: 8,
//                 border: "1px solid #D9D9D9E5",
//                 backgroundColor: "#ffffff",
//                 fontSize: 12,
//               }}
//             >
//               <FaCalendarAlt size={15} />
//               {selectedStartDay && selectedEndDay
//                 ? `Day ${selectedStartDay} – ${selectedEndDay}`
//                 : "Select Date Range"}
//             </button>

//             {showCalendar && (
//               <div
//                 style={{
//                   position: "absolute",
//                   right: 0,
//                   top: "110%",
//                   zIndex: 50,
//                   backgroundColor: "#ffffff",
//                   boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
//                   padding: 8,
//                   borderRadius: 8,
//                 }}
//               >
//                 <DateRange
//                   ranges={calendarRange}
//                   onChange={handleCalendarChange}
//                   moveRangeOnFirstSelection={false}
//                   showMonthAndYearPickers={false}
//                   rangeColors={["#5EA68E"]}
//                 />

//                 <div className="flex justify-between mt-2 gap-2">
//                   <button type="button" onClick={clearRange} className="text-xs px-2 py-1 border rounded">
//                     Clear
//                   </button>

//                   <div className="flex gap-2">
//                     <button
//                       type="button"
//                       onClick={applyRange}
//                       disabled={pendingStartDay == null || pendingEndDay == null}
//                       className="text-xs px-2 py-1 rounded text-white"
//                       style={{ background: "#2c3e50", opacity: pendingStartDay == null ? 0.6 : 1 }}
//                     >
//                       Submit
//                     </button>
//                     <button
//                       type="button"
//                       onClick={closeAndReset}
//                       className="text-xs px-2 py-1 rounded text-white"
//                       style={{ background: "#5EA68E" }}
//                     >
//                       Close
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
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
//             prevLabel={periods?.previous?.label}
//             currLabel={periods?.current_mtd?.label}
//             selectedStartDay={selectedStartDay}
//             selectedEndDay={selectedEndDay}
//           />
//         )}
//       </div>
//     </div>
//   );
// }





"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";

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
};

// small helper
const getShort = (label?: string) => (label ? label.split(" ")[0] || label : "");

// chart renderer
const LiveLineChart: React.FC<{
  dataPrev: DailyPoint[];
  dataCurr: DailyPoint[];
  metric: ChartMetric;
  prevLabel?: string;
  currLabel?: string;
}> = ({ dataPrev, dataCurr, metric, prevLabel, currLabel }) => {
  const getDay = (dateStr: string) => Number(dateStr?.split("-")?.[2]);

  const prevDays = dataPrev.map((d) => getDay(d.date)).filter((n) => Number.isFinite(n));
  const currDays = dataCurr.map((d) => getDay(d.date)).filter((n) => Number.isFinite(n));
  const allDaysRaw = [...prevDays, ...currDays].sort((a, b) => a - b);

  if (!allDaysRaw.length) {
    return <p className="text-xs text-gray-500">No daily data available.</p>;
  }

  const minDay = allDaysRaw[0];
  const maxDay = allDaysRaw[allDaysRaw.length - 1];
  const allDays = Array.from({ length: maxDay - minDay + 1 }, (_, i) => minDay + i);

  const prevSeries = allDays.map((day) => {
    const pt = dataPrev.find((d) => getDay(d.date) === day);
    return pt ? (metric === "quantity" ? pt.quantity ?? null : pt.net_sales ?? null) : null;
  });

  const currSeries = allDays.map((day) => {
    const pt = dataCurr.find((d) => getDay(d.date) === day);
    return pt ? (metric === "quantity" ? pt.quantity ?? null : pt.net_sales ?? null) : null;
  });

  const option = {
    color: ["#CECBC7", "#F47A00"],
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 16, top: 24, bottom: 40 },
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
      name: metric === "net_sales" ? "Sales" : "Units",
      nameLocation: "middle",
      nameGap: 40,
    },
    series: [
      { name: prevLabel || "Previous", type: "line", data: prevSeries, smooth: true, showSymbol: false },
      { name: currLabel || "Current MTD", type: "line", data: currSeries, smooth: true, showSymbol: false },
    ],
  };

  return <ReactECharts option={option} style={{ width: "100%", height: 260 }} />;
};

export default function LiveBiLineGraph({ dailySeries, periods, loading, error }: Props) {
  const [chartMetric, setChartMetric] = useState<ChartMetric>("net_sales");

  const prevShort = useMemo(() => getShort(periods?.previous?.label), [periods]);
  const currShort = useMemo(() => getShort(periods?.current_mtd?.label), [periods]);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#414042]">
            Performance Trend{" "}
            <span className="text-[#5EA68E]">
              {prevShort && currShort ? `(${currShort} vs ${prevShort})` : ""}
            </span>
          </h2>
        </div>

        {/* Metric toggle stays inside graph */}
        <div className="p-1 text-xs" style={{ border: "1px solid #D9D9D9E5", borderRadius: 8 }}>
          <button
            type="button"
            onClick={() => setChartMetric("net_sales")}
            style={{
              padding: "3px 12px",
              border: "none",
              borderRadius: 5,
              background: chartMetric === "net_sales" ? "#5EA68E80" : "#fff",
            }}
          >
            Net Sales
          </button>
          <button
            type="button"
            onClick={() => setChartMetric("quantity")}
            style={{
              padding: "3px 12px",
              border: "none",
              borderRadius: 5,
              background: chartMetric === "quantity" ? "#5EA68E80" : "#fff",
            }}
          >
            Units
          </button>
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
            prevLabel={periods?.previous?.label}
            currLabel={periods?.current_mtd?.label}
          />
        )}

        {!loading && !error && !dailySeries && (
          <div className="text-sm text-gray-500">No daily data available.</div>
        )}
      </div>
    </div>
  );
}
