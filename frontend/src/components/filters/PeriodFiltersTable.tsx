// // // // "use client";

// // // // import React from "react";
// // // // import { FaAngleDown } from "react-icons/fa";

// // // // export type Range = "monthly" | "quarterly" | "yearly";

// // // // interface Props {
// // // //   range: "monthly" | "quarterly" | "yearly";
// // // //   selectedMonth: string;
// // // //   selectedQuarter: string;
// // // //   selectedYear: string | number;
// // // //   yearOptions: (string | number)[];
// // // //   onRangeChange: (v: Range) => void;
// // // //   onMonthChange: (v: string) => void;
// // // //   onQuarterChange: (v: string) => void;
// // // //   onYearChange: (v: string) => void;
// // // //   allowedRanges?: Range[];
// // // // }

// // // // const ALL_RANGES: Range[] = ["monthly", "quarterly", "yearly"];

// // // // const PeriodFiltersTable: React.FC<Props> = (props) => {
// // // //   const {
// // // //     range,
// // // //     selectedMonth,
// // // //     selectedQuarter,
// // // //     selectedYear,
// // // //     yearOptions,
// // // //     onRangeChange,
// // // //     onMonthChange,
// // // //     onQuarterChange,
// // // //     onYearChange,
// // // //     allowedRanges = ALL_RANGES,
// // // //   } = props;

// // // //   const months = [
// // // //     "january",
// // // //     "february",
// // // //     "march",
// // // //     "april",
// // // //     "may",
// // // //     "june",
// // // //     "july",
// // // //     "august",
// // // //     "september",
// // // //     "october",
// // // //     "november",
// // // //     "december",
// // // //   ];

// // // //   const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : "");

// // // //   const safeRange: Range | "" =
// // // //     range && allowedRanges.includes(range as Range) ? (range as Range) : "";

// // // //   const showMonthly = allowedRanges.includes("monthly");
// // // //   const showQuarterly = allowedRanges.includes("quarterly");
// // // //   const showYearly = allowedRanges.includes("yearly");

// // // //   return (
// // // //     <>
// // // //       {/* Global styles for <option> */}
// // // //       <style jsx global>{`
// // // //         select option {
// // // //           text-align: center;
// // // //         }
// // // //         /* mimic Tailwind: bg-green-500 + text-yellow-200 */
// // // //         select option:hover {
// // // //           background-color: #22c55e; /* bg-green-500 */
// // // //           color: #fef08a; /* text-yellow-200 */
// // // //         }
// // // //       `}</style>

// // // //       <div className="inline-flex overflow-hidden rounded-md border border-[#414042] bg-white font-[Lato] text-[clamp(12px,0.729vw,16px)]">
// // // //         {/* PERIOD SELECT */}
// // // //         <div className="relative flex items-center">
// // // //           <select
// // // //             value={safeRange}
// // // //             onChange={(e) => onRangeChange(e.target.value as Range)}
// // // //             className="appearance-none bg-white px-3 py-2 pr-8 text-center focus:outline-none"
// // // //           >
// // // //             <option value="" disabled>
// // // //               Period
// // // //             </option>

// // // //             {showMonthly && <option value="monthly">Monthly</option>}
// // // //             {showQuarterly && <option value="quarterly">Quarterly</option>}
// // // //             {showYearly && <option value="yearly">Yearly</option>}
// // // //           </select>
// // // //           <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
// // // //             <FaAngleDown />
// // // //           </span>
// // // //         </div>

// // // //         {/* RANGE: MONTH or QUARTER */}
// // // //         {(safeRange === "monthly" || safeRange === "quarterly") && (
// // // //           <div className="relative flex items-center border-l border-[#414042]">
// // // //             <select
// // // //               value={safeRange === "monthly" ? selectedMonth : selectedQuarter}
// // // //               onChange={(e) =>
// // // //                 safeRange === "monthly"
// // // //                   ? onMonthChange(e.target.value)
// // // //                   : onQuarterChange(e.target.value)
// // // //               }
// // // //               className="appearance-none bg-white px-3 py-2 pr-8 text-center focus:outline-none"
// // // //             >
// // // //               <option value="">Range</option>

// // // //               {safeRange === "monthly" &&
// // // //                 months.map((m) => (
// // // //                   <option key={m} value={m}>
// // // //                     {cap(m)}
// // // //                   </option>
// // // //                 ))}

// // // //               {safeRange === "quarterly" &&
// // // //                 ["Q1", "Q2", "Q3", "Q4"].map((q) => (
// // // //                   <option key={q} value={q}>
// // // //                     {q}
// // // //                   </option>
// // // //                 ))}
// // // //             </select>
// // // //             <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
// // // //               <FaAngleDown />
// // // //             </span>
// // // //           </div>
// // // //         )}

// // // //         {/* YEAR SELECT */}
// // // //         <div className="relative flex items-center border-l border-[#414042]">
// // // //           <select
// // // //             value={selectedYear ? String(selectedYear) : ""}
// // // //             onChange={(e) => onYearChange(e.target.value)}
// // // //             className="appearance-none bg-white px-3 py-2 pr-8 text-center focus:outline-none"
// // // //           >
// // // //             <option value="">Year</option>
// // // //             {yearOptions.map((y) => (
// // // //               <option key={y} value={y}>
// // // //                 {y}
// // // //               </option>
// // // //             ))}
// // // //           </select>
// // // //           <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-charcoal-500">
// // // //             <FaAngleDown />
// // // //           </span>
// // // //         </div>
// // // //       </div>
// // // //     </>
// // // //   );
// // // // };

// // // // export default PeriodFiltersTable;




















// // // "use client";

// // // import React from "react";
// // // import { FaAngleDown } from "react-icons/fa";

// // // export type Range = "monthly" | "quarterly" | "yearly";

// // // interface Props {
// // //   range: "monthly" | "quarterly" | "yearly";
// // //   selectedMonth: string;
// // //   selectedQuarter: string;
// // //   selectedYear: string | number;
// // //   yearOptions: (string | number)[];
// // //   onRangeChange: (v: Range) => void;
// // //   onMonthChange: (v: string) => void;
// // //   onQuarterChange: (v: string) => void;
// // //   onYearChange: (v: string) => void;
// // //   allowedRanges?: Range[];
// // // }

// // // const ALL_RANGES: Range[] = ["monthly", "quarterly", "yearly"];

// // // const PeriodFiltersTable: React.FC<Props> = (props) => {
// // //   const {
// // //     range,
// // //     selectedMonth,
// // //     selectedQuarter,
// // //     selectedYear,
// // //     yearOptions,
// // //     onRangeChange,
// // //     onMonthChange,
// // //     onQuarterChange,
// // //     onYearChange,
// // //     allowedRanges = ALL_RANGES,
// // //   } = props;

// // //   const months = [
// // //     "january",
// // //     "february",
// // //     "march",
// // //     "april",
// // //     "may",
// // //     "june",
// // //     "july",
// // //     "august",
// // //     "september",
// // //     "october",
// // //     "november",
// // //     "december",
// // //   ];

// // //   const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : "");

// // //   const safeRange: Range | "" =
// // //     range && allowedRanges.includes(range as Range) ? (range as Range) : "";

// // //   const showMonthly = allowedRanges.includes("monthly");
// // //   const showQuarterly = allowedRanges.includes("quarterly");
// // //   const showYearly = allowedRanges.includes("yearly");

// // //   // Current month & year on client
// // //   const now = new Date();
// // //   const currentMonthValue = months[now.getMonth()]; // e.g. "december"
// // //   const currentYear = now.getFullYear();

// // //   return (
// // //     <>
// // //       {/* Global styles for <option> */}
// // //       <style jsx global>{`
// // //         select option {
// // //           text-align: center;
// // //         }
// // //         /* mimic Tailwind: bg-green-500 + text-yellow-200 */
// // //         select option:hover {
// // //           background-color: #22c55e; /* bg-green-500 */
// // //           color: #fef08a; /* text-yellow-200 */
// // //         }
// // //       `}</style>

// // //       <div className="inline-flex overflow-hidden rounded-md border border-[#414042] bg-white font-[Lato] text-[clamp(12px,0.729vw,16px)]">
// // //         {/* PERIOD SELECT */}
// // //         <div className="relative flex items-center">
// // //           <select
// // //             value={safeRange}
// // //             onChange={(e) => onRangeChange(e.target.value as Range)}
// // //             className="appearance-none bg-white px-3 py-2 pr-8 text-center focus:outline-none"
// // //           >
// // //             <option value="" disabled>
// // //               Period
// // //             </option>

// // //             {showMonthly && <option value="monthly">Monthly</option>}
// // //             {showQuarterly && <option value="quarterly">Quarterly</option>}
// // //             {showYearly && <option value="yearly">Yearly</option>}
// // //           </select>
// // //           <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
// // //             <FaAngleDown />
// // //           </span>
// // //         </div>

// // //         {/* RANGE: MONTH or QUARTER */}
// // //         {(safeRange === "monthly" || safeRange === "quarterly") && (
// // //           <div className="relative flex items-center border-l border-[#414042]">
// // //             <select
// // //               value={safeRange === "monthly" ? selectedMonth : selectedQuarter}
// // //               onChange={(e) =>
// // //                 safeRange === "monthly"
// // //                   ? onMonthChange(e.target.value)
// // //                   : onQuarterChange(e.target.value)
// // //               }
// // //               className="appearance-none bg-white px-3 py-2 pr-8 text-center focus:outline-none"
// // //             >
// // //               <option value="">Range</option>

// // //               {safeRange === "monthly" &&
// // //                 months.map((m) => {
// // //                   const isCurrentMonthAndYear =
// // //                     m === currentMonthValue &&
// // //                     String(selectedYear) === String(currentYear);

// // //                   // Disable current month for current year,
// // //                   // but DON'T disable if it's already selected
// // //                   const shouldDisableMonth =
// // //                     isCurrentMonthAndYear && selectedMonth !== m;

// // //                   return (
// // //                     <option
// // //                       key={m}
// // //                       value={m}
// // //                       disabled={shouldDisableMonth}
// // //                     >
// // //                       {cap(m)}
// // //                     </option>
// // //                   );
// // //                 })}

// // //               {safeRange === "quarterly" &&
// // //                 ["Q1", "Q2", "Q3", "Q4"].map((q) => (
// // //                   <option key={q} value={q}>
// // //                     {q}
// // //                   </option>
// // //                 ))}
// // //             </select>
// // //             <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
// // //               <FaAngleDown />
// // //             </span>
// // //           </div>
// // //         )}

// // //         {/* YEAR SELECT */}
// // //         <div className="relative flex items-center border-l border-[#414042]">
// // //           <select
// // //             value={selectedYear ? String(selectedYear) : ""}
// // //             onChange={(e) => onYearChange(e.target.value)}
// // //             className="appearance-none bg-white px-3 py-2 pr-8 text-center focus:outline-none"
// // //           >
// // //             <option value="">Year</option>
// // //             {yearOptions.map((y) => {
// // //               const isCurrentYearAndMonth =
// // //                 String(y) === String(currentYear) &&
// // //                 selectedMonth === currentMonthValue;

// // //               // Disable current year when current month is selected,
// // //               // but DON'T disable if it's already selected
// // //               const shouldDisableYear =
// // //                 isCurrentYearAndMonth &&
// // //                 String(selectedYear) !== String(currentYear);

// // //               return (
// // //                 <option
// // //                   key={y}
// // //                   value={y}
// // //                   disabled={shouldDisableYear}
// // //                 >
// // //                   {y}
// // //                 </option>
// // //               );
// // //             })}
// // //           </select>
// // //           <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-charcoal-500">
// // //             <FaAngleDown />
// // //           </span>
// // //         </div>
// // //       </div>
// // //     </>
// // //   );
// // // };

// // // export default PeriodFiltersTable;



























// // "use client";

// // import React from "react";
// // import { FaAngleDown } from "react-icons/fa";

// // export type Range = "monthly" | "quarterly" | "yearly";

// // interface Props {
// //   range: "monthly" | "quarterly" | "yearly" | undefined;
// //   selectedMonth: string;
// //   selectedQuarter: string;
// //   selectedYear: string | number;
// //   yearOptions: (string | number)[];
// //   onRangeChange: (v: Range) => void;
// //   onMonthChange: (v: string) => void;
// //   onQuarterChange: (v: string) => void;
// //   onYearChange: (v: string) => void;
// //   allowedRanges?: Range[];
// // }

// // const ALL_RANGES: Range[] = ["monthly", "quarterly", "yearly"];

// // const PeriodFiltersTable: React.FC<Props> = (props) => {
// //   const {
// //     range,
// //     selectedMonth,
// //     selectedQuarter,
// //     selectedYear,
// //     yearOptions,
// //     onRangeChange,
// //     onMonthChange,
// //     onQuarterChange,
// //     onYearChange,
// //     allowedRanges = ALL_RANGES,
// //   } = props;

// //   const months = [
// //     "january",
// //     "february",
// //     "march",
// //     "april",
// //     "may",
// //     "june",
// //     "july",
// //     "august",
// //     "september",
// //     "october",
// //     "november",
// //     "december",
// //   ];

// //   const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : "");

// //   const safeRange: Range | "" =
// //     range && allowedRanges.includes(range as Range) ? (range as Range) : "";

// //   const showMonthly = allowedRanges.includes("monthly");
// //   const showQuarterly = allowedRanges.includes("quarterly");
// //   const showYearly = allowedRanges.includes("yearly");

// //   // current month & year (client)
// //   const now = new Date();
// //   const currentMonthValue = months[now.getMonth()]; // "december" etc.
// //   const currentYear = now.getFullYear();

// //   return (
// //     <>
// //       {/* Global styles for <option> */}
// //       <style jsx global>{`
// //         select option {
// //           text-align: center;
// //         }
// //         select option:hover {
// //           background-color: #22c55e;
// //           color: #fef08a;
// //         }
// //       `}</style>

// //       <div className="inline-flex overflow-hidden rounded-md border border-[#414042] bg-white font-[Lato] text-[clamp(12px,0.729vw,16px)]">
// //         {/* PERIOD SELECT */}
// //         <div className="relative flex items-center">
// //           <select
// //             value={safeRange}
// //             onChange={(e) => onRangeChange(e.target.value as Range)}
// //             className="appearance-none bg-white px-3 py-2 pr-8 text-center focus:outline-none"
// //           >
// //             <option value="" disabled>
// //               Period
// //             </option>

// //             {showMonthly && <option value="monthly">Monthly</option>}
// //             {showQuarterly && <option value="quarterly">Quarterly</option>}
// //             {showYearly && <option value="yearly">Yearly</option>}
// //           </select>
// //           <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
// //             <FaAngleDown />
// //           </span>
// //         </div>

// //         {/* RANGE: MONTH or QUARTER */}
// //         {(safeRange === "monthly" || safeRange === "quarterly") && (
// //           <div className="relative flex items-center border-l border-[#414042]">
// //             <select
// //               value={safeRange === "monthly" ? selectedMonth : selectedQuarter}
// //               onChange={(e) =>
// //                 safeRange === "monthly"
// //                   ? onMonthChange(e.target.value)
// //                   : onQuarterChange(e.target.value)
// //               }
// //               className="appearance-none bg-white px-3 py-2 pr-8 text-center focus:outline-none"
// //             >
// //               <option value="">Range</option>

// //               {safeRange === "monthly" &&
// //                 months.map((m) => {
// //                   const isCurrentMonthAndYear =
// //                     safeRange === "monthly" &&
// //                     m === currentMonthValue &&
// //                     String(selectedYear) === String(currentYear);

// //                   // disable current month for current year,
// //                   // but DON'T disable if it's already selected
// //                   const shouldDisableMonth =
// //                     isCurrentMonthAndYear && selectedMonth !== m;

// //                   return (
// //                     <option
// //                       key={m}
// //                       value={m}
// //                       disabled={shouldDisableMonth}
// //                     >
// //                       {cap(m)}
// //                     </option>
// //                   );
// //                 })}

// //               {safeRange === "quarterly" &&
// //                 ["Q1", "Q2", "Q3", "Q4"].map((q) => (
// //                   <option key={q} value={q}>
// //                     {q}
// //                   </option>
// //                 ))}
// //             </select>
// //             <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
// //               <FaAngleDown />
// //             </span>
// //           </div>
// //         )}

// //         {/* YEAR SELECT */}
// //         <div className="relative flex items-center border-l border-[#414042]">
// //           <select
// //             value={selectedYear ? String(selectedYear) : ""}
// //             onChange={(e) => onYearChange(e.target.value)}
// //             className="appearance-none bg-white px-3 py-2 pr-8 text-center focus:outline-none"
// //           >
// //             <option value="">Year</option>
// //             {yearOptions.map((y) => {
// //               // 🚩 Only apply the "block current year" rule in MONTHLY mode
// //               const isCurrentYearAndMonth =
// //                 safeRange === "monthly" &&
// //                 String(y) === String(currentYear) &&
// //                 selectedMonth === currentMonthValue;

// //               // disable current year when current month selected,
// //               // but DON'T disable if it's already selected
// //               const shouldDisableYear =
// //                 isCurrentYearAndMonth &&
// //                 String(selectedYear) !== String(currentYear);

// //               return (
// //                 <option
// //                   key={y}
// //                   value={y}
// //                   disabled={shouldDisableYear}
// //                 >
// //                   {y}
// //                 </option>
// //               );
// //             })}
// //           </select>
// //           <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-charcoal-500">
// //             <FaAngleDown />
// //           </span>
// //         </div>
// //       </div>
// //     </>
// //   );
// // };

// // export default PeriodFiltersTable;




















// "use client";

// import React from "react";
// import { FaAngleDown } from "react-icons/fa";

// export type Range = "monthly" | "quarterly" | "yearly";

// interface Props {
//   range: "monthly" | "quarterly" | "yearly" | undefined;
//   selectedMonth: string;
//   selectedQuarter: string;          // e.g. "Q1", "Q2", ...
//   selectedYear: string | number;
//   yearOptions: (string | number)[];
//   onRangeChange: (v: Range) => void;
//   onMonthChange: (v: string) => void;
//   onQuarterChange: (v: string) => void; // expects "Q1" / "Q2" / ...
//   onYearChange: (v: string) => void;
//   allowedRanges?: Range[];
// }

// const ALL_RANGES: Range[] = ["monthly", "quarterly", "yearly"];

// type LatestPeriod = { month?: string; year?: string };

// const months = [
//   "january",
//   "february",
//   "march",
//   "april",
//   "may",
//   "june",
//   "july",
//   "august",
//   "september",
//   "october",
//   "november",
//   "december",
// ];

// const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : "");

// // map month -> Q1..Q4
// const monthToQuarter = (m?: string) => {
//   if (!m) return "";
//   const idx = months.indexOf(m.toLowerCase());
//   if (idx === -1) return "";
//   return `Q${Math.floor(idx / 3) + 1}`;
// };

// const PeriodFiltersTable: React.FC<Props> = (props) => {
//   const {
//     range,
//     selectedMonth,
//     selectedQuarter,
//     selectedYear,
//     yearOptions,
//     onRangeChange,
//     onMonthChange,
//     onQuarterChange,
//     onYearChange,
//     allowedRanges = ALL_RANGES,
//   } = props;

//   const safeRange: Range | "" =
//     range && allowedRanges.includes(range as Range) ? (range as Range) : "";

//   const showMonthly = allowedRanges.includes("monthly");
//   const showQuarterly = allowedRanges.includes("quarterly");
//   const showYearly = allowedRanges.includes("yearly");

//   // current month & year (client)
//   const now = new Date();
//   const currentMonthValue = months[now.getMonth()]; // "december" etc.
//   const currentYear = now.getFullYear();

//   // ------------- Read latest fetched period from localStorage -------------
//   const getLatestPeriod = (): LatestPeriod | null => {
//     if (typeof window === "undefined") return null;
//     try {
//       const raw = localStorage.getItem("latestFetchedPeriod");
//       if (!raw) return null;
//       const parsed = JSON.parse(raw) as LatestPeriod;
//       if (!parsed.month || !parsed.year) return null;
//       return {
//         month: parsed.month.toLowerCase(),
//         year: String(parsed.year),
//       };
//     } catch {
//       return null;
//     }
//   };

//   // ------------- Apply latest period when user changes "Period" -------------
//   const handleRangeChange = (nextRange: Range) => {
//     onRangeChange(nextRange);

//     const latest = getLatestPeriod();
//     if (!latest) return;

//     const { month, year } = latest;

//     // always set the year for all ranges if we have it
//     if (year) {
//       onYearChange(String(year));
//     }

//     if (nextRange === "monthly" && month) {
//       onMonthChange(month); // "november"
//     } else if (nextRange === "quarterly" && month) {
//       const q = monthToQuarter(month); // e.g. "Q4"
//       if (q) {
//         onQuarterChange(q);
//       }
//     }
//     // yearly: only year matters, already set above
//   };

//   // ------------- On first mount: auto seed based on latestFetchedPeriod -------------
//   const initializedRef = React.useRef(false);

//   React.useEffect(() => {
//     if (initializedRef.current) return;
//     initializedRef.current = true;

//     const latest = getLatestPeriod();
//     if (!latest) return;

//     const { month, year } = latest;

//     // If parent hasn't given any selection yet, pre-fill from latestFetchedPeriod
//     const hasYear = selectedYear !== "" && selectedYear !== undefined;
//     const hasMonth = !!selectedMonth;
//     const hasQuarter = !!selectedQuarter && selectedQuarter !== "Range";

//     // seed year if empty
//     if (!hasYear && year) {
//       onYearChange(String(year));
//     }

//     // seed based on current safeRange
//     if (safeRange === "monthly" && month && !hasMonth) {
//       onMonthChange(month);
//     } else if (safeRange === "quarterly" && month && !hasQuarter) {
//       const q = monthToQuarter(month);
//       if (q) {
//         onQuarterChange(q);
//       }
//     }
//     // yearly: only year, already handled above
//   }, [
//     safeRange,
//     selectedMonth,
//     selectedQuarter,
//     selectedYear,
//     onYearChange,
//     onMonthChange,
//     onQuarterChange,
//   ]);

//   return (
//     <>
//       {/* Global styles for <option> */}
//       <style jsx global>{`
//         select option {
//           text-align: center;
//         }
//         select option:hover {
//           background-color: #22c55e;
//           color: #fef08a;
//         }
//       `}</style>

//       <div className="inline-flex overflow-hidden rounded-md border border-[#414042] bg-white font-[Lato] text-[clamp(12px,0.729vw,16px)]">
//         {/* PERIOD SELECT */}
//         <div className="relative flex items-center">
//           <select
//             value={safeRange}
//             onChange={(e) => handleRangeChange(e.target.value as Range)}
//             className="appearance-none bg-white px-3 py-2 pr-8 text-center focus:outline-none"
//           >
//             <option value="" disabled>
//               Period
//             </option>

//             {showMonthly && <option value="monthly">Monthly</option>}
//             {showQuarterly && <option value="quarterly">Quarterly</option>}
//             {showYearly && <option value="yearly">Yearly</option>}
//           </select>
//           <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
//             <FaAngleDown />
//           </span>
//         </div>

//         {/* RANGE: MONTH or QUARTER */}
//         {(safeRange === "monthly" || safeRange === "quarterly") && (
//           <div className="relative flex items-center border-l border-[#414042]">
//             <select
//               value={safeRange === "monthly" ? selectedMonth : selectedQuarter}
//               onChange={(e) =>
//                 safeRange === "monthly"
//                   ? onMonthChange(e.target.value)
//                   : onQuarterChange(e.target.value)
//               }
//               className="appearance-none bg-white px-3 py-2 pr-8 text-center focus:outline-none"
//             >
//               <option value="">Range</option>

//               {safeRange === "monthly" &&
//                 months.map((m) => {
//                   const isCurrentMonthAndYear =
//                     safeRange === "monthly" &&
//                     m === currentMonthValue &&
//                     String(selectedYear) === String(currentYear);

//                   // disable current month for current year,
//                   // but DON'T disable if it's already selected
//                   const shouldDisableMonth =
//                     isCurrentMonthAndYear && selectedMonth !== m;

//                   return (
//                     <option key={m} value={m} disabled={shouldDisableMonth}>
//                       {cap(m)}
//                     </option>
//                   );
//                 })}

//               {safeRange === "quarterly" &&
//                 ["Q1", "Q2", "Q3", "Q4"].map((q) => (
//                   <option key={q} value={q}>
//                     {q}
//                   </option>
//                 ))}
//             </select>
//             <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#414042]">
//               <FaAngleDown />
//             </span>
//           </div>
//         )}

//         {/* YEAR SELECT */}
//         <div className="relative flex items-center border-l border-[#414042]">
//           <select
//             value={selectedYear ? String(selectedYear) : ""}
//             onChange={(e) => onYearChange(e.target.value)}
//             className="appearance-none bg-white px-3 py-2 pr-8 text-center focus:outline-none"
//           >
//             <option value="">Year</option>
//             {yearOptions.map((y) => {
//               // 🚩 Only apply the "block current year" rule in MONTHLY mode
//               const isCurrentYearAndMonth =
//                 safeRange === "monthly" &&
//                 String(y) === String(currentYear) &&
//                 selectedMonth === currentMonthValue;

//               // disable current year when current month selected,
//               // but DON'T disable if it's already selected
//               const shouldDisableYear =
//                 isCurrentYearAndMonth &&
//                 String(selectedYear) !== String(currentYear);

//               return (
//                 <option key={y} value={y} disabled={shouldDisableYear}>
//                   {y}
//                 </option>
//               );
//             })}
//           </select>
//           <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-charcoal-500">
//             <FaAngleDown />
//           </span>
//         </div>
//       </div>
//     </>
//   );
// };

// export default PeriodFiltersTable;












"use client";

import React from "react";
import { FaAngleDown } from "react-icons/fa";
import { HiOutlineCalculator } from "react-icons/hi";

export type Range = "monthly" | "quarterly" | "yearly";

interface Props {
  range: "monthly" | "quarterly" | "yearly" | undefined;
  selectedMonth: string;
  selectedQuarter: string; // "Q1".."Q4"
  selectedYear: string | number;
  yearOptions: (string | number)[];
  onRangeChange: (v: Range) => void;
  onMonthChange: (v: string) => void;
  onQuarterChange: (v: string) => void;
  onYearChange: (v: string) => void;
  allowedRanges?: Range[];
}

const ALL_RANGES: Range[] = ["monthly", "quarterly", "yearly"];
type LatestPeriod = { month?: string; year?: string };

const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : "");

// month -> "Q1".."Q4"
const monthToQuarter = (m?: string) => {
  if (!m) return "";
  const idx = months.indexOf(m.toLowerCase());
  if (idx === -1) return "";
  return `Q${Math.floor(idx / 3) + 1}`;
};

const PeriodFiltersTable: React.FC<Props> = (props) => {
  const {
    range,
    selectedMonth,
    selectedQuarter,
    selectedYear,
    yearOptions,
    onRangeChange,
    onMonthChange,
    onQuarterChange,
    onYearChange,
    allowedRanges = ALL_RANGES,
  } = props;

  const safeRange: Range | "" =
    range && allowedRanges.includes(range as Range) ? (range as Range) : "";

  const showMonthly = allowedRanges.includes("monthly");
  const showQuarterly = allowedRanges.includes("quarterly");
  const showYearly = allowedRanges.includes("yearly");

  // current month/year (client)
  const now = new Date();
  const currentMonthValue = months[now.getMonth()];
  const currentYear = now.getFullYear();

  // ----- localStorage latestFetchedPeriod -----
  const getLatestPeriod = (): LatestPeriod | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("latestFetchedPeriod");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as LatestPeriod;
      if (!parsed.month || !parsed.year) return null;
      return { month: parsed.month.toLowerCase(), year: String(parsed.year) };
    } catch {
      return null;
    }
  };

  // ----- apply latest period when Period changes -----
  const handleRangeChange = (nextRange: Range) => {
    onRangeChange(nextRange);

    const latest = getLatestPeriod();
    if (!latest) return;

    const { month, year } = latest;

    if (year) onYearChange(String(year));

    if (nextRange === "monthly" && month) {
      onMonthChange(month);
    } else if (nextRange === "quarterly" && month) {
      const q = monthToQuarter(month);
      if (q) onQuarterChange(q);
    }
    // yearly: only year matters (already set)
  };

  // ----- seed from latestFetchedPeriod once -----
  const initializedRef = React.useRef(false);
  React.useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const latest = getLatestPeriod();
    if (!latest) return;

    const { month, year } = latest;

    const hasYear = selectedYear !== "" && selectedYear !== undefined;
    const hasMonth = !!selectedMonth;
    const hasQuarter = !!selectedQuarter && selectedQuarter !== "Range";

    if (!hasYear && year) onYearChange(String(year));

    if (safeRange === "monthly" && month && !hasMonth) {
      onMonthChange(month);
    } else if (safeRange === "quarterly" && month && !hasQuarter) {
      const q = monthToQuarter(month);
      if (q) onQuarterChange(q);
    }
  }, [
    safeRange,
    selectedMonth,
    selectedQuarter,
    selectedYear,
    onYearChange,
    onMonthChange,
    onQuarterChange,
  ]);

  // ---------------- UI classes (matching your QuarterlyLast12Filters look) ----------------
  const wrapCls =
    "relative inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs sm:text-sm shadow-sm";
  const selectCls =
    "appearance-none bg-transparent px-2 py-1 pr-6 text-center text-xs sm:text-sm text-[#414042] focus:outline-none cursor-pointer leading-tight";

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* 1) Period */}
      <div className={wrapCls}>
        <select
          value={safeRange}
          onChange={(e) => handleRangeChange(e.target.value as Range)}
          className={selectCls}
        >
          <option value="" disabled>
            Period
          </option>
          {showMonthly && <option value="monthly">Monthly</option>}
          {showQuarterly && <option value="quarterly">Quarterly</option>}
          {showYearly && <option value="yearly">Yearly</option>}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-[10px] text-[#414042]">
          <FaAngleDown />
        </span>
      </div>

      {/* 2) Month / Quarter (only for monthly + quarterly) */}
      {(safeRange === "monthly" || safeRange === "quarterly") && (
        <div className={wrapCls}>
          {/* <span className="mr-2 flex items-center text-base text-[#414042]/70">
            <HiOutlineCalculator />
          </span> */}

          <select
            value={safeRange === "monthly" ? selectedMonth : selectedQuarter}
            onChange={(e) =>
              safeRange === "monthly"
                ? onMonthChange(e.target.value)
                : onQuarterChange(e.target.value)
            }
            className={selectCls}
          >
            <option value="">Range</option>

            {safeRange === "monthly" &&
              months.map((m) => {
                const isCurrentMonthAndYear =
                  m === currentMonthValue &&
                  String(selectedYear) === String(currentYear);

                // disable current month for current year, unless already selected
                const shouldDisableMonth =
                  isCurrentMonthAndYear && selectedMonth !== m;

                return (
                  <option key={m} value={m} disabled={shouldDisableMonth}>
                    {cap(m)}
                  </option>
                );
              })}

            {safeRange === "quarterly" &&
              ["Q1", "Q2", "Q3", "Q4"].map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
          </select>

          <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-[10px] text-[#414042]">

            <FaAngleDown />
          </span>
        </div>
      )}

      {/* 3) Year */}
      <div className={wrapCls}>
        <select
          value={selectedYear ? String(selectedYear) : ""}
          onChange={(e) => onYearChange(e.target.value)}
          className={selectCls}
        >
          <option value="">Year</option>

          {yearOptions.map((y) => {
            // Only block current year when MONTHLY + current month selected
            const isCurrentYearAndMonth =
              safeRange === "monthly" &&
              String(y) === String(currentYear) &&
              selectedMonth === currentMonthValue;

            const shouldDisableYear =
              isCurrentYearAndMonth && String(selectedYear) !== String(currentYear);

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

export default PeriodFiltersTable;
