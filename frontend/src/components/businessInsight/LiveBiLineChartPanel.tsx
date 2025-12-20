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

const monthTickLabel = (p?: PeriodInfo) => {
  // Prefer dates (more reliable than label text)
  const src = p?.start_date || p?.end_date || "";
  if (!src) return p?.label || "";

  // src: "2025-10-01"
  const [y, m] = src.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mi = Number(m) - 1;

  if (!Number.isFinite(mi) || mi < 0 || mi > 11) return p?.label || "";
  const yy = (y || "").slice(-2);

  return `${monthNames[mi]}'${yy}`; // Oct'25
};



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

    legend: {
      top: 4,                 // aligns nicely under title
      left: "left",
      orient: "horizontal",
      align: "left",

      icon: "rect",
      itemWidth: 12,
      itemHeight: 12,          // 👈 slightly larger than font
      itemGap: 20,

      textStyle: {
        fontSize: 13,
        lineHeight: 14,        // 👈 MUST be >= itemHeight
        color: "#6B7280",
        padding: [0, 6, 0, 6],
      },

      data: [prevLabel || "Previous", currLabel || "Current"],
    },



    grid: { left: 40, right: 16, top: 50, bottom: 40 }, // 👈 top increased to make room for legend
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
      name: metric === "net_sales" ? "Sales (₹)" : "Units", // optional
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

  // const prevShort = useMemo(() => getShort(periods?.previous?.label), [periods]);
  // const currShort = useMemo(() => getShort(periods?.current_mtd?.label), [periods]);

  const prevLegend = useMemo(() => monthTickLabel(periods?.previous), [periods]);
  const currLegend = useMemo(() => monthTickLabel(periods?.current_mtd), [periods]);


  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#414042]">
            Performance Trend{" "}
            {/* <span className="text-[#5EA68E]">
              {prevShort && currShort ? `(${currShort} vs ${prevShort})` : ""}
            </span> */}
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
            prevLabel={prevLegend}
            currLabel={currLegend}
          />
        )}

        {!loading && !error && !dailySeries && (
          <div className="text-sm text-gray-500">No daily data available.</div>
        )}
      </div>
    </div>
  );
}
