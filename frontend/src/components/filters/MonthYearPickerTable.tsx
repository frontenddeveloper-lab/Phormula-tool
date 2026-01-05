// // "use client";

// // import React from "react";
// // import { FaAngleDown } from "react-icons/fa";

// // type ValueMode = "lower" | "preserve";

// // export interface MonthYearPickerTableProps {
// //   month: string;
// //   year: string | number;
// //   yearOptions: (string | number)[];
// //   onMonthChange: (value: string) => void;
// //   onYearChange: (value: string) => void;
// //   valueMode?: ValueMode;
// //   className?: string;
// //   monthsOverride?: string[];
// // }

// // const MonthYearPickerTable: React.FC<MonthYearPickerTableProps> = ({
// //   month,
// //   year,
// //   yearOptions,
// //   onMonthChange,
// //   onYearChange,
// //   valueMode = "preserve",
// //   className = "",
// //   monthsOverride,
// // }) => {
// //   const DEFAULT_MONTHS = [
// //     "January",
// //     "February",
// //     "March",
// //     "April",
// //     "May",
// //     "June",
// //     "July",
// //     "August",
// //     "September",
// //     "October",
// //     "November",
// //     "December",
// //   ];

// //   const months =
// //     monthsOverride && monthsOverride.length ? monthsOverride : DEFAULT_MONTHS;

// //   const normalizeForSelect = (m: string) => {
// //     if (!m) return "";
// //     const idx = months.findIndex((x) => x.toLowerCase() === m.toLowerCase());
// //     return idx >= 0 ? months[idx] : m;
// //   };

// //   const selectMonthValue = normalizeForSelect(month);

// //   const emitMonth = (raw: string) => {
// //     if (!raw) {
// //       onMonthChange("");
// //       return;
// //     }
// //     const emitted = valueMode === "lower" ? raw.toLowerCase() : raw;
// //     onMonthChange(emitted);
// //   };

// //   // Current month/year (client)
// //   const now = new Date();
// //   const currentYear = now.getFullYear();
// //   const currentMonthLabel = months[now.getMonth()] ?? "";

// //   // ✅ Same classes as PeriodFiltersTable
// //   const wrapCls =
// //     "relative inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs sm:text-sm shadow-sm";
// //   const selectCls =
// //     "appearance-none bg-transparent px-2 py-1 pr-6 text-center text-xs sm:text-sm text-[#414042] focus:outline-none cursor-pointer leading-tight";

// //   return (
// //     <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
// //       {/* MONTH */}
// //       <div className={wrapCls}>
// //         <select
// //           value={selectMonthValue || ""}
// //           onChange={(e) => emitMonth(e.target.value)}
// //           className={selectCls}
// //         >
// //           <option value="">Month</option>

// //           {months.map((m) => {
// //             const isCurrentMonthAndYear =
// //               m === currentMonthLabel && String(year) === String(currentYear);

// //             // disable current month for current year (unless already selected)
// //             const shouldDisableMonth =
// //               isCurrentMonthAndYear && selectMonthValue !== m;

// //             return (
// //               <option key={m} value={m} disabled={shouldDisableMonth}>
// //                 {m}
// //               </option>
// //             );
// //           })}
// //         </select>

// //         <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-[10px] text-[#414042]">
// //           <FaAngleDown />
// //         </span>
// //       </div>

// //       {/* YEAR */}
// //       <div className={wrapCls}>
// //         <select
// //           value={year ? String(year) : ""}
// //           onChange={(e) => onYearChange(e.target.value)}
// //           className={selectCls}
// //         >
// //           <option value="">Year</option>

// //           {yearOptions.map((y) => {
// //             const isCurrentYearAndMonth =
// //               String(y) === String(currentYear) &&
// //               selectMonthValue === currentMonthLabel;

// //             // disable current year when current month selected (unless already selected year)
// //             const shouldDisableYear =
// //               isCurrentYearAndMonth && String(year) !== String(currentYear);

// //             return (
// //               <option key={y} value={y} disabled={shouldDisableYear}>
// //                 {y}
// //               </option>
// //             );
// //           })}
// //         </select>

// //         <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-[10px] text-[#414042]">
// //           <FaAngleDown />
// //         </span>
// //       </div>
// //     </div>
// //   );
// // };

// // export default MonthYearPickerTable;






















// "use client";

// import React from "react";
// import { FaAngleDown } from "react-icons/fa";

// type ValueMode = "lower" | "preserve";

// export interface MonthYearPickerTableProps {
//   month: string;
//   year: string | number;
//   yearOptions: (string | number)[]; // kept for compatibility, not used to build list
//   onMonthChange: (value: string) => void;
//   onYearChange: (value: string) => void;
//   valueMode?: ValueMode;
//   className?: string;
//   monthsOverride?: string[];
// }

// const MIN_YEAR = 2024;

// const MonthYearPickerTable: React.FC<MonthYearPickerTableProps> = ({
//   month,
//   year,
//   yearOptions, // intentionally unused for generating year list
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
//     const idx = months.findIndex((x) => x.toLowerCase() === m.toLowerCase());
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

//   // Current month/year (client)
//   const now = new Date();
//   const currentYear = now.getFullYear();
//   const currentMonthIndex = now.getMonth(); // 0..11
//   const currentMonthLabel = months[currentMonthIndex] ?? "";

//   // Year list: 2024 → currentYear
//   const yearList = Array.from(
//     { length: currentYear - MIN_YEAR + 1 },
//     (_, i) => MIN_YEAR + i
//   );

//   const selectedYearNum = Number(year);

//   // Disable current month and future months for current year
//   const isMonthDisabled = (m: string) => {
//     // If selected year isn't current year, allow all months (within allowed years)
//     if (selectedYearNum !== currentYear) return false;

//     const idx = months.findIndex((x) => x.toLowerCase() === m.toLowerCase());
//     if (idx === -1) return false;

//     // Disable current month and onwards (>= current month)
//     return idx >= currentMonthIndex;
//   };

//   // ✅ Same classes as PeriodFiltersTable
//   const wrapCls =
//     "relative inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs sm:text-sm shadow-sm";
//   const selectCls =
//     "appearance-none bg-transparent px-2 py-1 pr-6 text-center text-xs sm:text-sm text-[#414042] focus:outline-none cursor-pointer leading-tight";

//   return (
//     <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
//       {/* MONTH */}
//       <div className={wrapCls}>
//         <select
//           value={selectMonthValue || ""}
//           onChange={(e) => emitMonth(e.target.value)}
//           className={selectCls}
//           disabled={!year} // optional: prevents month picking before year
//         >
//           <option value="">Month</option>

//           {months.map((m) => (
//             <option key={m} value={m} disabled={isMonthDisabled(m)}>
//               {m}
//             </option>
//           ))}
//         </select>

//         <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-[10px] text-[#414042]">
//           <FaAngleDown />
//         </span>
//       </div>

//       {/* YEAR */}
//       <div className={wrapCls}>
//         <select
//           value={year ? String(year) : ""}
//           onChange={(e) => onYearChange(e.target.value)}
//           className={selectCls}
//         >
//           <option value="">Year</option>

//           {yearList.map((y) => (
//             <option key={y} value={y}>
//               {y}
//             </option>
//           ))}
//         </select>

//         <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-[10px] text-[#414042]">
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
  yearOptions: (string | number)[]; // kept for compatibility, not used to build list
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  valueMode?: ValueMode;
  className?: string;
  monthsOverride?: string[];
}

type LatestPeriod = { month?: string; year?: string };

const MIN_YEAR = 2024;

const MonthYearPickerTable: React.FC<MonthYearPickerTableProps> = ({
  month,
  year,
  yearOptions, // intentionally unused for generating year list
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
  const currentMonthIndex = now.getMonth(); // 0..11

  // Year list: 2024 → currentYear
  const yearList = Array.from(
    { length: currentYear - MIN_YEAR + 1 },
    (_, i) => MIN_YEAR + i
  );

  const selectedYearNum = Number(year);

  // Disable current month and future months for current year
  const isMonthDisabled = (m: string) => {
    if (selectedYearNum !== currentYear) return false;

    const idx = months.findIndex((x) => x.toLowerCase() === m.toLowerCase());
    if (idx === -1) return false;

    return idx >= currentMonthIndex; // disable current month and onwards
  };

  /* =========================
     ✅ NEW: Seed from latestFetchedPeriod ONCE
     ========================= */
  const getLatestPeriod = (): LatestPeriod | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("latestFetchedPeriod");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as LatestPeriod;
      if (!parsed.year || !parsed.month) return null;
      return { year: String(parsed.year), month: String(parsed.month) };
    } catch {
      return null;
    }
  };

  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const latest = getLatestPeriod();
    if (!latest) return;

    const y = Number(latest.year);
    if (Number.isNaN(y)) return;

    const clampedYear = Math.min(Math.max(y, MIN_YEAR), currentYear);

    // ✅ Force year to last fetched (only once)
    if (String(year) !== String(clampedYear)) {
      onYearChange(String(clampedYear));
    }

    // ✅ Force month to last fetched (only once) if empty or different
    const latestMonthNormalized = normalizeForSelect(latest.month);
    if (latestMonthNormalized && selectMonthValue !== latestMonthNormalized) {
      // emitMonth uses valueMode, so call that to preserve behavior
      emitMonth(latestMonthNormalized);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* ========================= */

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
          disabled={!year} // optional
        >
          <option value="">Month</option>

          {months.map((m) => (
            <option key={m} value={m} disabled={isMonthDisabled(m)}>
              {m}
            </option>
          ))}
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

          {yearList.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-[10px] text-[#414042]">
          <FaAngleDown />
        </span>
      </div>
    </div>
  );
};

export default MonthYearPickerTable;
