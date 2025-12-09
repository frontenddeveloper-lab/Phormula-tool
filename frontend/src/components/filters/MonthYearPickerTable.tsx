// "use client";

// import React from "react";

// type ValueMode = "lower" | "preserve";

// export interface MonthYearPickerTableProps {
//   month: string;                          // current month value (string)
//   year: string | number;                  // current year value
//   yearOptions: (string | number)[];       // list of year options
//   onMonthChange: (value: string) => void; // emitted month value
//   onYearChange: (value: string) => void;  // emitted year value
//   valueMode?: ValueMode;                  // 'lower' = emit lowercase months (default: 'preserve')
//   className?: string;                     // extra class if needed
//   monthsOverride?: string[];              // optionally pass your own months list
// }

// /**
//  * A compact Month/Year dropdown rendered as a table with sticky headers,
//  * matching your referral fees dropdown styling.
//  */
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
//   // Default months (capitalized for display). Values emitted depend on valueMode.
//   const DEFAULT_MONTHS = [
//     "January","February","March","April","May","June",
//     "July","August","September","October","November","December",
//   ];

//   const months = monthsOverride && monthsOverride.length ? monthsOverride : DEFAULT_MONTHS;

//   // Determine <select> value shown. If caller passes a lowercase like "january",
//   // we still want the select to show it correctly by matching (case-insensitively).
//   const normalizeForSelect = (m: string) => {
//     if (!m) return "";
//     const idx = months.findIndex((x) => x.toLowerCase() === m.toLowerCase());
//     return idx >= 0 ? months[idx] : m; // fall back to whatever came
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

//   return (
//     <div
//       className={[
//         "border-collapse rounded w-auto min-w-[80px] max-w-[100px]",
//         className,
//       ].join(" ")}
//     >
//       <table className="border-collapse rounded w-auto min-w-[80px] max-w-[100px]">
//         <thead>
//           <tr className="bg-white text-[#5EA68E] border border-[#414042]">
//             <th className="px-3 py-2 text-center border border-[#414042] text-xs">Month</th>
//             <th className="px-3 py-2 text-center border border-[#414042] text-xs">Year</th>
//           </tr>
//         </thead>
//         <tbody>
//           <tr>
//             <td className="px-3 py-2 text-center border border-[#414042]">
//               <select
//                 className="text-center text-xs outline-none"
//                 value={selectMonthValue}
//                 onChange={(e) => emitMonth(e.target.value)}
//               >
//                 <option value="" disabled>
//                   Select
//                 </option>
//                 {months.map((m) => (
//                   <option key={m} value={m}>
//                     {m}
//                   </option>
//                 ))}
//               </select>
//             </td>
//             <td className="px-3 py-2 text-center border border-[#414042]">
//               <select
//                 className="text-center text-xs outline-none"
//                 value={String(year ?? "")}
//                 onChange={(e) => onYearChange(e.target.value)}
//               >
//                 <option value="" disabled>
//                   Select
//                 </option>
//                 {yearOptions.map((y) => (
//                   <option key={y} value={y}>
//                     {y}
//                   </option>
//                 ))}
//               </select>
//             </td>
//           </tr>
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default MonthYearPickerTable;















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

//   return (
//     // <div
//     //   className={[
//     //     "inline-flex rounded-md border border-[#414042] bg-white",
//     //     "text-[clamp(12px,0.729vw,16px)] font-[Lato] overflow-hidden",
//     //     className,
//     //   ].join(" ")}
//     // >
//     <div className="inline-flex rounded-md border border-[#414042] bg-white text-[clamp(12px,0.729vw,16px)] font-[Lato] overflow-hidden">
//       {/* MONTH SELECT */}
//       <div className="relative flex items-center">
//         <select
//           value={selectMonthValue || ""}
//           onChange={(e) => emitMonth(e.target.value)}
//           // className="appearance-none pl-3 pr-4 py-1.5 text-center bg-white focus:outline-none leading-tight"
//           className="appearance-none px-3 pr-8 py-2 text-center bg-white focus:outline-none"
//         >
//           <option value="" disabled>
//             Month
//           </option>
//           {months.map((m) => (
//             <option key={m} value={m}>
//               {m}
//             </option>
//           ))}
//         </select>
//        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
//            <FaAngleDown />
//         </span>
//       </div>

//       {/* YEAR SELECT */}
//       <div className="relative flex items-center border-l border-[#414042]">
//         <select
//           value={year ? String(year) : ""}
//           onChange={(e) => onYearChange(e.target.value)}
//           // className="appearance-none pl-3 pr-4 py-1.5 text-center bg-white focus:outline-none leading-tight"
//            className="appearance-none px-3 pr-8 py-2 text-center bg-white focus:outline-none"
//         >
//           <option value="">Year</option>
//           {yearOptions.map((y) => (
//             <option key={y} value={y}>
//               {y}
//             </option>
//           ))}
//         </select>
//         <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
//            <FaAngleDown />
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
    const idx = months.findIndex(
      (x) => x.toLowerCase() === m.toLowerCase()
    );
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

  // === Current month & year on client ===
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthLabel = months[now.getMonth()] ?? ""; // e.g. "December"

  return (
    <div className="inline-flex rounded-md border border-[#414042] bg-white text-[clamp(12px,0.729vw,16px)] font-[Lato] overflow-hidden">
      {/* MONTH SELECT */}
      <div className="relative flex items-center">
        <select
          value={selectMonthValue || ""}
          onChange={(e) => emitMonth(e.target.value)}
          className="appearance-none px-3 pr-8 py-2 text-center bg-white focus:outline-none"
        >
          <option value="" disabled>
            Month
          </option>
          {months.map((m) => {
            const isCurrentMonthAndYear =
              m === currentMonthLabel && String(year) === String(currentYear);

            // Disable current month for current year,
            // but DON'T disable if it's already the selected month
            const shouldDisableMonth =
              isCurrentMonthAndYear && selectMonthValue !== m;

            return (
              <option key={m} value={m} disabled={shouldDisableMonth}>
                {m}
              </option>
            );
          })}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
          <FaAngleDown />
        </span>
      </div>

      {/* YEAR SELECT */}
      <div className="relative flex items-center border-l border-[#414042]">
        <select
          value={year ? String(year) : ""}
          onChange={(e) => onYearChange(e.target.value)}
          className="appearance-none px-3 pr-8 py-2 text-center bg-white focus:outline-none"
        >
          <option value="">Year</option>
          {yearOptions.map((y) => {
            const isCurrentYearAndMonth =
              String(y) === String(currentYear) &&
              selectMonthValue === currentMonthLabel;

            // Disable current year when current month is selected,
            // but DON'T disable if it's already the selected year
            const shouldDisableYear =
              isCurrentYearAndMonth && String(year) !== String(currentYear);

            return (
              <option key={y} value={y} disabled={shouldDisableYear}>
                {y}
              </option>
            );
          })}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
          <FaAngleDown />
        </span>
      </div>
    </div>
  );
};

export default MonthYearPickerTable;
