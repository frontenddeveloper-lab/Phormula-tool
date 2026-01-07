"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import {
  FaBoxArchive,
  FaMoneyBillTrendUp,
  FaTags,
  FaPercent,
  FaAmazon,
  FaLayerGroup,
  FaWallet,
  FaArrowRotateRight,
} from "react-icons/fa6";

/* ================= TYPES ================= */

type SummaryShape = {
  quantity_total?: number;
  gross_sales?: number;
  net_sales?: number;
  taxncredit?: number;
  amazon_fee?: number;
  advertising_total?: number;
  otherwplatform?: number;
  cashflow?: number;
  rembursement_fee?: number;
  fba_fees?: number;
  selling_fees?: number;
  promotional_rebates?: number;

};

type Props = {
  data: SummaryShape;
  previous_summary?: SummaryShape;
  previousLabel?: string;   // 👈 NEW
  periodType?: "monthly" | "quarterly" | "yearly";
  currency: string;
};

/* ================= COMPONENT ================= */

const CashFlowSankey: React.FC<Props> = ({
  data,
  previous_summary,
  previousLabel,
  currency,
  periodType = "monthly",
}) => {
  /* ---------- helpers ---------- */
  const [screenWidth, setScreenWidth] = React.useState(
  typeof window !== "undefined" ? window.innerWidth : 1920
);

React.useEffect(() => {
  const onResize = () => setScreenWidth(window.innerWidth);
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []);

const is2XL = screenWidth >= 1536;
const isXL = screenWidth >= 1280 && screenWidth < 1536;

  

  const formatNumber = (val?: number) =>
    val !== undefined
      ? Number(val).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "-";

      const formatPrevLabel = (label?: string) => {
  if (!label) return "";

  // Month format: "November 2025" → "Nov'25"
  const monthMatch = label.match(/^([A-Za-z]+)\s(\d{4})$/);
  if (monthMatch) {
    const month = monthMatch[1].slice(0, 3);
    const year = monthMatch[2].slice(-2);
    return `${month}'${year}`;
  }

  // Quarter format: "Q3 2025" → "Q3'25"
  const quarterMatch = label.match(/^(Q\d)\s(\d{4})$/);
  if (quarterMatch) {
    return `${quarterMatch[1]}'${quarterMatch[2].slice(-2)}`;
  }

  // Year format: "2024" → "2024"
  return label;
};

      

  const getChangePercent = (curr?: number, prev?: number) => {
    if (curr === undefined || prev === undefined || prev === 0) return undefined;
    return (((curr - prev) / Math.abs(prev)) * 100).toFixed(1);
  };

  const formatInteger = (val?: number) =>
  val !== undefined ? Math.round(val).toLocaleString() : "-";

  const getPerUnitValue = (amount?: number, units?: number) => {
  if (!amount || !units || units === 0) return undefined;
  return (amount / units).toFixed(2);
};

  /* ---------- CARDS CONFIG ---------- */

   const perUnitCards = [
    "Amazon Fees",
    "Others",
    "Cash Generated",
    "Net Reimbursement",
  ];

  const cards = [
    {
      label: "Units",
      value: data.quantity_total,
      prev: previous_summary?.quantity_total,
      icon: <FaBoxArchive size={16} color="#87AD12" />,
      bg: "bg-[#FDD36F4D]",
      border: "border-[#FDD36F]",
      isCurrency: false,
    },
    {
      label: "Gross Sales",
      value: data.gross_sales,
      prev: previous_summary?.gross_sales,
      icon: <FaMoneyBillTrendUp size={16} />,
      bg: "bg-[#ED9F504D]",
      border: "border-[#ED9F50]",
      isCurrency: true,
    },
    {
      label: "Net Sales",
      value: data.net_sales,
      prev: previous_summary?.net_sales,
      icon: <FaTags size={16} />,
      bg: "bg-[#75BBDA4D]",
      border: "border-[#75BBDA]",
      isCurrency: true,
    },
    {
  label: "Promotional Discount",
  value: data.promotional_rebates,
  prev: previous_summary?.promotional_rebates,
  icon: <FaPercent size={16} />,
  bg: "bg-[#B8C78C4D]",
  border: "border-[#B8C78C]", // 🔴 red border
  isCurrency: true,
  isDiscount: true,
  isNegative: true, // 👈 ADD THIS
},

    {
      label: "Amazon Fees",
      value: data.amazon_fee,
      prev: previous_summary?.amazon_fee,
      icon: <FaAmazon size={16} />,
      bg: "bg-[#B75A5A4D]",
      border: "border-[#B75A5A]",
      isCurrency: true,
    },
    {
      label: "Others",
      value: data.otherwplatform,
      prev: previous_summary?.otherwplatform,
      icon: <FaLayerGroup size={16} />,
      bg: "bg-[#3A8EA44D]",
      border: "border-[#3A8EA4]",
      isCurrency: true,
    },
    {
      label: "Cash Generated",
      value: data.cashflow,
      prev: previous_summary?.cashflow,
      icon: <FaWallet size={16} />,
      bg: "bg-[#7B9A6D4D]",
      border: "border-[#7B9A6D]",
      isCurrency: true,
    },
    {
      label: "Net Reimbursement",
      value: data.rembursement_fee,
      prev: previous_summary?.rembursement_fee,
      icon: <FaArrowRotateRight size={16} />,
      bg: "bg-[#C494664D]",
      border: "border-[#C49466]",
      isCurrency: true,
    },
  ];

  /* ---------- SANKEY ---------- */

const rows = [
  { name: "Gross Sales", value: data.gross_sales || 0, sign: "+", barColor: "#2CA9E0", signColor: "#2E7D32" },
  { name: "Tax and Credit", value: data.taxncredit || 0, sign: "+", barColor: "#2CA9E0", signColor: "#2E7D32" },
  { name: "Discount", value: data.promotional_rebates || 0, sign: "-", barColor: "#AB63B5", signColor: "#D32F2F" },
  { name: "FBA Fees", value: data.fba_fees || 0, sign: "-", barColor: "#ff5c5c", signColor: "#D32F2F" },
  { name: "Selling  Fees", value: data.selling_fees || 0, sign: "-", barColor: "#ff5c5c", signColor: "#D32F2F" },
  { name: "Ads Cost", value: data.advertising_total || 0, sign: "-", barColor: "#ff5c5c", signColor: "#D32F2F" },
  { name: "Other", value: data.otherwplatform || 0, sign: "-", barColor: "#ff5c5c", signColor: "#D32F2F" },
  { name: "Cash Generated", value: data.cashflow || 0, sign: "+", barColor: "#2E7D32", signColor: "#2E7D32" },
];




  const option = {
    tooltip: {
      formatter: (p: any) => {
  if (p.name === "Summary") return "";
  return `${p.name}<br/>${currency}${Number(p.value || 0).toLocaleString()}`;
},
    },
    series: [
      {
        type: "sankey",
        layout: "none",
        nodeWidth: 22,
        nodeGap: 18,
        layoutIterations: 0,
label: {
  show: true,
  position: "right",
  overflow: "none",
  width: is2XL ? 310 : isXL ? 210 : 210,
formatter: (n: any) => {
  const row = rows.find(r => r.name === n.name);
  if (!row) return "";

  const base = data.net_sales;
  let pct: number | undefined;

  if (base !== undefined && base !== 0) {
  pct = (Math.abs(row.value) / Math.abs(base)) * 100;
}

  const isUp = pct !== undefined && pct >= 0;

const showSign = row.name !== "Cash Generated";

return (
  `{label|${row.name}}` +
  (showSign
    ? `{sign${row.sign === "+" ? "Plus" : "Minus"}|(${row.sign})}`
    : "") +
  `{amount|${currency}${Number(n.value).toLocaleString()}}` +
  `{pct|(${Math.abs(pct || 0).toFixed(1)}%)}`
);
},
rich: {
  label: {
    width: is2XL ? 140 : isXL ? 80 : 80,
    fontSize: is2XL ? 12 : 11,
    align: "left",
    color: "#374151",
    fontWeight: 500,
  },

  signPlus: {
    fontSize: is2XL ? 12 : 11,
    color: "#2E7D32",
    fontWeight: 700,
  },

  signMinus: {
    fontSize: is2XL ? 12 : 11,
    color: "#D32F2F",
    fontWeight: 700,
  },

  amount: {
    width: is2XL ? 80 : isXL ? 60 : 60,
    align: "right",
    fontSize: is2XL ? 12 : 11,
    fontWeight: 700,
    color: "#111827",
  },

  pct: {
    width: is2XL ? 70 : isXL ? 50 : 50,
    align: "left",
    fontSize: is2XL ? 12 : 11,
    color: "#6B7280",
    fontWeight: 600,
  },
},

},



       data: [
  { name: "Summary", itemStyle: { color: "transparent" } },
  ...rows.map((r) => ({
    name: r.name,
    value: Math.abs(r.value),
    itemStyle: { color: r.barColor },
  })),
],

links: rows.map((r) => ({
  source: "Summary",
  target: r.name,
  value: Math.abs(r.value),
  lineStyle: {
    color: r.barColor,
    opacity: 0.45,
  },
})),
      },
    ],
  };
  /* ---------- RENDER ---------- */

  return (
    <div>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {cards.map((c) => {
         const p = getChangePercent(c.value, c.prev);
          const isNegative = Number(p) < 0;

          return (
            <div
              key={c.label}
              className={`rounded-2xl border ${c.border} ${c.bg} shadow-sm xl:px-4 px-2 py-3`}
            >
              <div className="2xl:text-xs text-[10px] text-charcoal-500 mb-1">{c.label}</div>

             <div className="2xl:text-lg text-sm font-semibold text-charcoal-700">
 {c.label === "Units" ? (
  formatInteger(c.value)
) : c.isDiscount ? (
  <>
    {currency}
    {formatNumber(Math.abs(c.value || 0))}
    <span className="ml-1 2xl:text-xs text-[10px] font-medium text-charcoal-500">
      (
      {(
        ((Math.abs(c.value || 0)) / (data.gross_sales || 1)) *
        100
      ).toFixed(1)}
      %)
    </span>
  </>
) : (
<>
  {c.isCurrency ? currency : ""}
  {formatNumber(c.value)}

  {perUnitCards.includes(c.label) && (
    <span className="ml-1 2xl:text-xs text-[10px] font-medium text-charcoal-500">
      ({currency}
      {getPerUnitValue(
        c.value,
        data.quantity_total
      )}{" "}
      / Unit)
    </span>
  )}
</>
  )}
</div>

              {p && (
                <div className="flex justify-between items-end 2xl:text-xs text-[10px] mt-2">
                  <div className="flex flex-col">
                    <span className="text-charcoal-400">
                      {formatPrevLabel(previousLabel)}:
                    </span>
                   <span className="font-semibold text-charcoal-700">
  {c.label === "Units"
    ? formatInteger(c.prev)
    : c.isDiscount ? (
        <>
          {currency}
          {formatNumber(Math.abs(c.prev || 0))}
          <span className="ml-1 2xl:text-xs text-[10px] font-medium text-charcoal-500">
            (
            {(
              ((Math.abs(c.prev || 0)) /
                (previous_summary?.gross_sales || 1)) *
              100
            ).toFixed(1)}
            %)
          </span>
        </>
      ) : (
        <>
          {c.isCurrency ? currency : ""}
          {formatNumber(c.prev)}
          {perUnitCards.includes(c.label) && (
            <span className="ml-1 2xl:text-xs text-[10px] font-medium text-charcoal-500">
              ({currency}
              {getPerUnitValue(
                c.prev,
                previous_summary?.quantity_total
              )}{" "}
              / Unit)
            </span>
          )}
        </>
      )
  }
</span>

                  </div>

                  <span className={` text-nowrap ${isNegative ? "text-red-600" : "text-green-600"}`}>
                    {isNegative ? "▼" : "▲"} {Math.abs(Number(p))}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
 <div className="rounded-xl border shadow bg-white p-4">
     
     

      {/* SANKEY */}
      <div className="h-[520px]  ">
        <ReactECharts option={option} style={{ height: "100%" }} />
      </div>
    </div>
    </div>
   
  );
};

export default CashFlowSankey;