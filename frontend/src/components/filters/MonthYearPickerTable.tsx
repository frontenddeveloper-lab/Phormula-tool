// "use client";

// import React from "react";
// import { FaAngleDown } from "react-icons/fa";

// type ValueMode = "lower" | "preserve";

// export interface MonthYearPickerTableProps {
//   month: string;
//   year: string | number;
//   yearOptions: (string | number)[];
//   onMonthChange: (value: string) => void;
//   onYearChange: (value: string) => void;
//   valueMode?: ValueMode;
//   className?: string;
//   monthsOverride?: string[];
// }

// const MonthYearPickerTable: React.FC<MonthYearPickerTableProps> = ({
//   month,
//   year,
//   yearOptions,
//   onMonthChange,
//   onYearChange,
//   valueMode = "preserve",
//   className = "",
//   monthsOverride,
// }) => {
//   const DEFAULT_MONTHS = [
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
//   ];

//   const months =
//     monthsOverride && monthsOverride.length ? monthsOverride : DEFAULT_MONTHS;

//   const normalizeForSelect = (m: string) => {
//     if (!m) return "";
//     const idx = months.findIndex(
//       (x) => x.toLowerCase() === m.toLowerCase()
//     );
//     return idx >= 0 ? months[idx] : m;
//   };

//   const selectMonthValue = normalizeForSelect(month);

//   const emitMonth = (raw: string) => {
//     if (!raw) {
//       onMonthChange("");
//       return;
//     }
//     const emitted = valueMode === "lower" ? raw.toLowerCase() : raw;
//     onMonthChange(emitted);
//   };

//   // === Current month & year on client ===
//   const now = new Date();
//   const currentYear = now.getFullYear();
//   const currentMonthLabel = months[now.getMonth()] ?? ""; // e.g. "December"

//   return (
//     <div className="inline-flex rounded-md border border-[#414042] bg-white text-[clamp(12px,0.729vw,16px)] font-[Lato] overflow-hidden">
//       {/* MONTH SELECT */}
//       <div className="relative flex items-center">
//         <select
//           value={selectMonthValue || ""}
//           onChange={(e) => emitMonth(e.target.value)}
//           className="appearance-none px-3 pr-8 py-2 text-center bg-white focus:outline-none"
//         >
//           <option value="" disabled>
//             Month
//           </option>
//           {months.map((m) => {
//             const isCurrentMonthAndYear =
//               m === currentMonthLabel && String(year) === String(currentYear);

//             // Disable current month for current year,
//             // but DON'T disable if it's already the selected month
//             const shouldDisableMonth =
//               isCurrentMonthAndYear && selectMonthValue !== m;

//             return (
//               <option key={m} value={m} disabled={shouldDisableMonth}>
//                 {m}
//               </option>
//             );
//           })}
//         </select>
//         <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
//           <FaAngleDown />
//         </span>
//       </div>

//       {/* YEAR SELECT */}
//       <div className="relative flex items-center border-l border-[#414042]">
//         <select
//           value={year ? String(year) : ""}
//           onChange={(e) => onYearChange(e.target.value)}
//           className="appearance-none px-3 pr-8 py-2 text-center bg-white focus:outline-none"
//         >
//           <option value="">Year</option>
//           {yearOptions.map((y) => {
//             const isCurrentYearAndMonth =
//               String(y) === String(currentYear) &&
//               selectMonthValue === currentMonthLabel;

//             // Disable current year when current month is selected,
//             // but DON'T disable if it's already the selected year
//             const shouldDisableYear =
//               isCurrentYearAndMonth && String(year) !== String(currentYear);

//             return (
//               <option key={y} value={y} disabled={shouldDisableYear}>
//                 {y}
//               </option>
//             );
//           })}
//         </select>
//         <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
//           <FaAngleDown />
//         </span>
//       </div>
//     </div>
//   );
// };

// export default MonthYearPickerTable;






















"use client";

import React from "react";
import { FaAngleDown } from "react-icons/fa";

type ValueMode = "lower" | "preserve";

export interface MonthYearPickerTableProps {
  month: string;
  year: string | number;
  yearOptions: (string | number)[];
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  valueMode?: ValueMode;
  className?: string;
  monthsOverride?: string[];
  months?: string[];
}

const MonthYearPickerTable: React.FC<MonthYearPickerTableProps> = ({
  month,
  year,
  yearOptions,
  onMonthChange,
  onYearChange,
  valueMode = "preserve",
  className = "",
  monthsOverride,
}) => {
  const DEFAULT_MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const months =
    monthsOverride && monthsOverride.length ? monthsOverride : DEFAULT_MONTHS;

  const normalizeForSelect = (m: string) => {
    if (!m) return "";
    const idx = months.findIndex((x) => x.toLowerCase() === m.toLowerCase());
    return idx >= 0 ? months[idx] : m;
  };

  const selectMonthValue = normalizeForSelect(month);

  const emitMonth = (raw: string) => {
    if (!raw) {
      onMonthChange("");
      return;
    }
    const emitted = valueMode === "lower" ? raw.toLowerCase() : raw;
    onMonthChange(emitted);
  };

  // Current month/year (client)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthLabel = months[now.getMonth()] ?? "";

  // ✅ Same classes as PeriodFiltersTable
  const wrapCls =
    "relative inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs sm:text-sm shadow-sm";
  const selectCls =
    "appearance-none bg-transparent px-2 py-1 pr-6 text-center text-xs sm:text-sm text-[#414042] focus:outline-none cursor-pointer leading-tight";

  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {/* MONTH */}
      <div className={wrapCls}>
        <select
          value={selectMonthValue || ""}
          onChange={(e) => emitMonth(e.target.value)}
          className={selectCls}
        >
          <option value="">Month</option>

          {months.map((m) => {
            const isCurrentMonthAndYear =
              m === currentMonthLabel && String(year) === String(currentYear);

            // disable current month for current year (unless already selected)
            const shouldDisableMonth =
              isCurrentMonthAndYear && selectMonthValue !== m;

            return (
              <option key={m} value={m} disabled={shouldDisableMonth}>
                {m}
              </option>
            );
          })}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-[10px] text-[#414042]">
          <FaAngleDown />
        </span>
      </div>

      {/* YEAR */}
      <div className={wrapCls}>
        <select
          value={year ? String(year) : ""}
          onChange={(e) => onYearChange(e.target.value)}
          className={selectCls}
        >
          <option value="">Year</option>

          {yearOptions.map((y) => {
            const isCurrentYearAndMonth =
              String(y) === String(currentYear) &&
              selectMonthValue === currentMonthLabel;

            // disable current year when current month selected (unless already selected year)
            const shouldDisableYear =
              isCurrentYearAndMonth && String(year) !== String(currentYear);

            return (
              <option key={y} value={y} disabled={shouldDisableYear}>
                {y}
              </option>
            );
          })}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-[10px] text-[#414042]">
          <FaAngleDown />
        </span>
      </div>
    </div>
  );
};

export default MonthYearPickerTable;
