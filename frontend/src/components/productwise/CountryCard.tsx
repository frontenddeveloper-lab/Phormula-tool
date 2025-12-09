// // components/productwise/CountryCard.tsx
// "use client";

// import React from "react";
// import {
//   formatCurrencyByCountry,
//   formatMonthYear,
//   getCountryColor,
// } from "./productwiseHelpers";

// interface CountryCardProps {
//   country: string;
//   stats: any;
//   selectedYear: number | "";
// }

// const CountryCard: React.FC<CountryCardProps> = ({
//   country,
//   stats,
//   selectedYear,
// }) => (
//   <div className="rounded-lg border border-charcoal-500 bg-white p-4 sm:p-5 shadow-sm transition-shadow hover:shadow-md">
//     <div className="mb-4 flex items-center justify-between gap-2">
//       <h4 className="m-0 font-extrabold text-green-500 text-[clamp(14px,1.2vw,20px)] flex items-center gap-2">
//         <span
//           className="inline-block h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full"
//           style={{ backgroundColor: getCountryColor(country) }}
//         />
//         <span className="text-charcoal-500 text-[clamp(14px,1.1vw,18px)]">
//           {country.toUpperCase()}
//         </span>
//       </h4>
//     </div>

//     <div className="flex flex-col gap-4">
//       {/* Stats grid */}
//       <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
//         <div className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3">
//           <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-charcoal-500">
//             Net Sales
//           </p>
//           <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
//             {formatCurrencyByCountry(country, stats.totalSales)}
//           </p>
//         </div>

//         <div className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3">
//           <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
//             Units
//           </p>
//           <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
//             {stats.totalUnits.toLocaleString()}
//           </p>
//         </div>

//         <div className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3">
//           <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
//             CM1 Profit
//           </p>
//           <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
//             {formatCurrencyByCountry(country, stats.totalProfit)}
//           </p>
//         </div>

//         <div className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3">
//           <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
//             Avg. Monthly Sales
//           </p>
//           <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
//             {formatCurrencyByCountry(country, stats.avgSales)}
//           </p>
//         </div>

//         <div className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3">
//           <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
//             Avg. Selling Price
//           </p>
//           <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
//             {formatCurrencyByCountry(country, stats.avgSellingPrice)}
//           </p>
//         </div>

//         <div className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3">
//           <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
//             CM1 Profit (%)
//           </p>
//           <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
//             {stats.gross_margin_avg.toFixed(2)}%
//           </p>
//         </div>
//       </div>

//       <p className="m-0 text-[clamp(13px,1vw,16px)] font-bold">
//         Best Performance Month
//       </p>

//       <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
//         {/* Sales */}
//         <div
//           className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3"
//           style={{
//             borderTopWidth: 4,
//             borderTopColor: getCountryColor(country),
//           }}
//         >
//           <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
//             Sales
//           </p>
//           <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
//             {formatMonthYear(stats.maxSalesMonth.month, selectedYear || "")}
//           </p>
//           <p className="text-[clamp(12px,0.95vw,16px)]">
//             {formatCurrencyByCountry(country, stats.maxSalesMonth.net_sales)}
//           </p>
//         </div>

//         {/* Units */}
//         <div
//           className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3"
//           style={{
//             borderTopWidth: 4,
//             borderTopColor: getCountryColor(country),
//           }}
//         >
//           <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
//             Units
//           </p>
//           <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
//             {formatMonthYear(stats.maxUnitsMonth.month, selectedYear || "")}
//           </p>
//           <p className="text-[clamp(12px,0.95vw,16px)]">
//             {stats.maxUnitsMonth.quantity.toLocaleString()}
//           </p>
//         </div>

//         {/* CM1 Profit */}
//         <div
//           className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3"
//           style={{
//             borderTopWidth: 4,
//             borderTopColor: getCountryColor(country),
//           }}
//         >
//           <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
//             CM1 Profit
//           </p>
//           <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
//             {formatMonthYear(stats.maxSalesMonth.month, selectedYear || "")}
//           </p>
//           <p className="text-[clamp(12px,0.95vw,16px)]">
//             {formatCurrencyByCountry(country, stats.maxSalesMonth.profit)}
//           </p>
//         </div>
//       </div>
//     </div>
//   </div>
// );

// export default CountryCard;


































// components/productwise/CountryCard.tsx
"use client";

import React from "react";
import {
  formatCurrencyByCountry,
  formatMonthYear,
  getCountryColor,
} from "./productwiseHelpers";

interface CountryCardProps {
  country: string;
  stats: any;
  selectedYear: number | "";
  homeCurrency: "USD" | "GBP";
}

const CountryCard: React.FC<CountryCardProps> = ({
  country,
  stats,
  selectedYear,
  homeCurrency,
}) => {
  const countryKey = country.toLowerCase();

  // Decide which currency style to use:
  // - Global scope (homeCurrency = USD) → ALL cards show as USD
  // - UK scope (homeCurrency = GBP) → UK & Global cards show as GBP, others stay local
  const formatAmount = (value: number) => {
    if (homeCurrency === "USD") {
      // show everything as USD
      return formatCurrencyByCountry("us", value);
    }

    if (homeCurrency === "GBP") {
      // UK mode → UK & Global in GBP
      if (countryKey === "uk" || countryKey === "global") {
        return formatCurrencyByCountry("uk", value);
      }
      // others (e.g. us) keep their own formatter
      return formatCurrencyByCountry(country, value);
    }

    // Fallback
    return formatCurrencyByCountry(country, value);
  };

  return (
    <div className="rounded-lg border border-charcoal-500 bg-white p-4 sm:p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h4 className="m-0 font-extrabold text-green-500 text-[clamp(14px,1.2vw,20px)] flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full"
            style={{ backgroundColor: getCountryColor(country) }}
          />
          <span className="text-charcoal-500 text-[clamp(14px,1.1vw,18px)]">
            {country.toUpperCase()}
          </span>
        </h4>
      </div>

      <div className="flex flex-col gap-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3">
            <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-charcoal-500">
              Net Sales
            </p>
            <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
              {formatAmount(stats.totalSales)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3">
            <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
              Units
            </p>
            <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
              {stats.totalUnits.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3">
            <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
              CM1 Profit
            </p>
            <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
              {formatAmount(stats.totalProfit)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3">
            <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
              Avg. Monthly Sales
            </p>
            <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
              {formatAmount(stats.avgSales)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3">
            <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
              Avg. Selling Price
            </p>
            <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
              {formatAmount(stats.avgSellingPrice)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3">
            <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
              CM1 Profit (%)
            </p>
            <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
              {stats.gross_margin_avg.toFixed(2)}%
            </p>
          </div>
        </div>

        <p className="m-0 text-[clamp(13px,1vw,16px)] font-bold">
          Best Performing Month
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {/* Sales */}
          <div
            className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3"
            style={{
              borderTopWidth: 4,
              borderTopColor: getCountryColor(country),
            }}
          >
            <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
              Sales
            </p>
            <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
              {formatMonthYear(stats.maxSalesMonth.month, selectedYear || "")}
            </p>
            <p className="text-[clamp(12px,0.95vw,16px)]">
              {formatAmount(stats.maxSalesMonth.net_sales)}
            </p>
          </div>

          {/* Units */}
          <div
            className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3"
            style={{
              borderTopWidth: 4,
              borderTopColor: getCountryColor(country),
            }}
          >
            <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
              Units
            </p>
            <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
              {formatMonthYear(stats.maxUnitsMonth.month, selectedYear || "")}
            </p>
            <p className="text-[clamp(12px,0.95vw,16px)]">
              {stats.maxUnitsMonth.quantity.toLocaleString()}
            </p>
          </div>

          {/* CM1 Profit */}
          <div
            className="rounded-lg border border-gray-300 bg-gray-200/40 p-2 sm:p-3"
            style={{
              borderTopWidth: 4,
              borderTopColor: getCountryColor(country),
            }}
          >
            <p className="mb-1 text-[clamp(11px,0.85vw,13px)] font-semibold text-[#414042]">
              CM1 Profit
            </p>
            <p className="text-[clamp(12px,0.95vw,16px)] font-semibold">
              {formatMonthYear(stats.maxSalesMonth.month, selectedYear || "")}
            </p>
            <p className="text-[clamp(12px,0.95vw,16px)]">
              {formatAmount(stats.maxSalesMonth.profit)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountryCard;
