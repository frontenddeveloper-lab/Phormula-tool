// // "use client";

// // import React, { useCallback, useEffect, useMemo, useState } from "react";
// // import * as XLSX from "xlsx";

// // import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// // import Loader from "@/components/loader/Loader";
// // import { getISTYearMonth } from "@/lib/dashboard/date";
// // import { toNumberSafe } from "@/lib/dashboard/format";

// // const baseURL =
// //   process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

// // type InventoryRow = Record<string, string | number>;

// // type Props = {
// //   /** Country name used for fetching / labelling, e.g. "global", "uk", "us" */
// //   inventoryCountry: string;
// // };

// // export default function CurrentInventorySection({
// //   inventoryCountry,
// // }: Props) {
// //   const [invLoading, setInvLoading] = useState(false);
// //   const [invError, setInvError] = useState<string>("");
// //   const [invRows, setInvRows] = useState<InventoryRow[]>([]);

// //   // current IST month/year for request
// //   const invMonthYear = useMemo(() => {
// //     const { monthName, year } = getISTYearMonth();
// //     return { month: monthName.toLowerCase(), year: String(year) };
// //   }, []);

// //   const getCurrentInventoryEndpoint = useCallback(() => {
// //     return inventoryCountry.toLowerCase() === "global"
// //       ? `${baseURL}/current_inventory_global`
// //       : `${baseURL}/current_inventory`;
// //   }, [inventoryCountry]);

// //   // column name helpers coming from backend
// //   const findMtdKey = useCallback((row: InventoryRow) => {
// //     const key = Object.keys(row).find((k) =>
// //       k.toLowerCase().startsWith("current month units sold")
// //     );
// //     return key || "";
// //   }, []);

// //   const findSales30Key = useCallback((row: InventoryRow) => {
// //     const keys = Object.keys(row);

// //     const exactOthers = keys.find(
// //       (k) => k.trim().toLowerCase() === "others"
// //     );
// //     if (exactOthers) return exactOthers;

// //     const past30 = keys.find((k) =>
// //       k.toLowerCase().includes("past 30")
// //     );
// //     if (past30) return past30;

// //     const days30 = keys.find((k) =>
// //       k.toLowerCase().includes("30 days")
// //     );
// //     if (days30) return days30;

// //     const same = keys.find(
// //       (k) =>
// //         k.trim().toLowerCase() === "sales for past 30 days"
// //     );
// //     if (same) return same;

// //     return "";
// //   }, []);

// //   const invDisplayedColumns = useMemo(
// //     () => [
// //       "Sno.",
// //       ...(inventoryCountry.toLowerCase() !== "global" ? ["SKU"] : []),
// //       "Product Name",
// //       "Current Inventory",
// //       "MTD Sales",
// //       "Sales for past 30 days",
// //       "Inventory Coverage Ratio (In Months)",
// //       "Inventory Alerts",
// //     ],
// //     [inventoryCountry]
// //   );

// //   const getInvCellValue = useCallback(
// //     (row: InventoryRow, col: string) => {
// //       const beginningKey = "Inventory at the beginning of the month";
// //       const inwardKey = "Inventory Inwarded";

// //       const mtdKey = findMtdKey(row);
// //       const sales30Key = findSales30Key(row);

// //       const currentInventory = toNumberSafe(row[beginningKey]);
// //       const mtdSales = toNumberSafe(mtdKey ? row[mtdKey] : 0);
// //       const sales30 = toNumberSafe(
// //         sales30Key ? row[sales30Key] : 0
// //       );
// //       const inwarded = toNumberSafe(row[inwardKey]);

// //       switch (col) {
// //         case "SKU":
// //           return row["SKU"];
// //         case "Product Name":
// //           return row["Product Name"];
// //         case "Current Inventory":
// //           return currentInventory;
// //         case "MTD Sales":
// //           return mtdSales;
// //         case "Sales for past 30 days":
// //           return sales30;
// //         case "Inventory Coverage Ratio (In Months)": {
// //           const denom = mtdSales + sales30;
// //           if (!denom || denom <= 0) return "—";
// //           const ratio = currentInventory / denom;
// //           return Number.isFinite(ratio) ? ratio : "—";
// //         }
// //         case "Inventory Alerts": {
// //           const denom = mtdSales + sales30;
// //           if (!denom || denom <= 0) return "";
// //           const ratio = currentInventory / denom;
// //           if (ratio < 1) return "Low";
// //           if (ratio < 2) return "Watch";
// //           return "";
// //         }
// //         default:
// //           return row[col as keyof InventoryRow];
// //       }
// //     },
// //     [findMtdKey, findSales30Key]
// //   );

// //   const splitInventoryRows = useMemo(() => {
// //     if (!invRows?.length)
// //       return {
// //         top5: [] as InventoryRow[],
// //         other: [] as InventoryRow[],
// //       };

// //     const usable = invRows.filter((r) => {
// //       const name = String(r["Product Name"] ?? "").trim();
// //       const sku = String(r["SKU"] ?? "").trim();
// //       return name.length > 0 || sku.length > 0;
// //     });

// //     const withMtd = usable.map((r) => {
// //       const mtdKey = findMtdKey(r);
// //       const mtd = toNumberSafe(mtdKey ? r[mtdKey] : 0);
// //       return { row: r, mtd };
// //     });

// //     withMtd.sort((a, b) => b.mtd - a.mtd);

// //     return {
// //       top5: withMtd.slice(0, 5).map((x) => x.row),
// //       other: withMtd.slice(5).map((x) => x.row),
// //     };
// //   }, [invRows, findMtdKey]);

// //   const fetchCurrentInventory = useCallback(async () => {
// //     const token =
// //       typeof window !== "undefined"
// //         ? localStorage.getItem("jwtToken")
// //         : null;

// //     if (!token) {
// //       setInvError("Authorization token is missing");
// //       setInvRows([]);
// //       return;
// //     }

// //     setInvLoading(true);
// //     setInvError("");

// //     try {
// //       const endpoint = getCurrentInventoryEndpoint();
// //       const { month, year } = invMonthYear;

// //       const res = await fetch(endpoint, {
// //         method: "POST",
// //         headers: {
// //           Authorization: `Bearer ${token}`,
// //           "Content-Type": "application/json",
// //         },
// //         body: JSON.stringify({
// //           month,
// //           year,
// //           country: inventoryCountry,
// //         }),
// //       });

// //       if (!res.ok) {
// //         const errJson = await res.json().catch(() => ({}));
// //         throw new Error(
// //           errJson?.error || "Failed to fetch CurrentInventory data"
// //         );
// //       }

// //       const json = await res.json();
// //       const fileData: string | undefined = json?.data;
// //       if (!fileData) {
// //         throw new Error(
// //           json?.message || "Empty file received from server"
// //         );
// //       }

// //       // decode base64 → ArrayBuffer
// //       const byteCharacters = atob(fileData);
// //       const buffers: ArrayBuffer[] = [];
// //       for (
// //         let offset = 0;
// //         offset < byteCharacters.length;
// //         offset += 1024
// //       ) {
// //         const slice = byteCharacters.slice(offset, offset + 1024);
// //         const byteNumbers = new Array(slice.length);
// //         for (let i = 0; i < slice.length; i++) {
// //           byteNumbers[i] = slice.charCodeAt(i);
// //         }
// //         buffers.push(
// //           new Uint8Array(byteNumbers).buffer as ArrayBuffer
// //         );
// //       }

// //       const blob = new Blob(buffers, {
// //         type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
// //       });

// //       const reader = new FileReader();
// //       reader.onload = (e) => {
// //         const arr = new Uint8Array(e.target?.result as ArrayBuffer);
// //         const wb = XLSX.read(arr, { type: "array" });
// //         const sheetName = wb.SheetNames[0];
// //         const sheet = wb.Sheets[sheetName];
// //         const jsonData = XLSX.utils.sheet_to_json<InventoryRow>(
// //           sheet,
// //           { defval: "" }
// //         );
// //         setInvRows(jsonData);
// //       };

// //       reader.readAsArrayBuffer(blob);
// //     } catch (e: any) {
// //       setInvError(e?.message || "Unknown error");
// //       setInvRows([]);
// //     } finally {
// //       setInvLoading(false);
// //     }
// //   }, [
// //     getCurrentInventoryEndpoint,
// //     invMonthYear,
// //     inventoryCountry,
// //   ]);

// //   useEffect(() => {
// //     fetchCurrentInventory();
// //   }, [fetchCurrentInventory]);

// //   // label for heading: "Dec '25" etc
// //   const monthLabel = useMemo(() => {
// //     const { monthName, year } = getISTYearMonth();
// //     const shortMon = new Date(
// //       `${monthName} 1, ${year}`
// //     ).toLocaleString("en-US", {
// //       month: "short",
// //       timeZone: "Asia/Kolkata",
// //     });
// //     return `${shortMon} '${String(year).slice(-2)}`;
// //   }, []);

// //   return (
// //     <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
// //       {/* Header */}
// //       <div className="mb-3">
// //         <div className="flex items-baseline gap-2">
// //           <PageBreadcrumb
// //             pageTitle="Current Inventory -"
// //             variant="page"
// //             align="left"
// //           />
// //           <span className="text-[#5EA68E] text-lg font-semibold">
// //             {monthLabel}
// //           </span>
// //         </div>
// //         <p className="mt-1 text-sm text-charcoal-500">
// //           Auto-loaded for the current month
// //         </p>
// //       </div>

// //       {/* Content */}
// //       {invLoading ? (
// //         <div className="py-10 flex justify-center">
// //           <Loader
// //             src="/infinity-unscreen.gif"
// //             size={40}
// //             transparent
// //             roundedClass="rounded-full"
// //             backgroundClass="bg-transparent"
// //             respectReducedMotion
// //           />
// //         </div>
// //       ) : invError ? (
// //         <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
// //           {invError}
// //         </div>
// //       ) : invRows.length > 0 ? (
// //         <div className="overflow-x-auto rounded-lg">
// //           <table className="min-w-[900px] w-full border-collapse border border-gray-300">
// //             <thead>
// //               <tr>
// //                 {invDisplayedColumns.map((col) => (
// //                   <th
// //                     key={col}
// //                     className="px-3 py-2 text-center text-sm font-semibold border border-gray-300 bg-[#5EA68E] text-[#f8edcf]"
// //                   >
// //                     {col}
// //                   </th>
// //                 ))}
// //               </tr>
// //             </thead>

// //             <tbody>
// //               {/* TOP 5 HEADER */}
// //               <tr className="bg-white">
// //                 <td
// //                   colSpan={invDisplayedColumns.length}
// //                   className="px-3 py-2 text-left text-xs font-semibold text-gray-800 border-0 border-t border-gray-300"
// //                 >
// //                   Top 5 Products
// //                 </td>
// //               </tr>

// //               {splitInventoryRows.top5.map((row, index) => (
// //                 <tr key={`top-${index}`} className="bg-white">
// //                   {invDisplayedColumns.map((col) => (
// //                     <td
// //                       key={col}
// //                       className="px-3 py-2 text-center text-sm text-gray-800 border border-gray-300"
// //                     >
// //                       {col === "Sno."
// //                         ? index + 1
// //                         : (() => {
// //                             const v = getInvCellValue(row, col);

// //                             if (typeof v === "number") {
// //                               if (
// //                                 col ===
// //                                 "Inventory Coverage Ratio (In Months)"
// //                               )
// //                                 return v.toFixed(1);
// //                               return v.toLocaleString();
// //                             }
// //                             return String(v ?? "");
// //                           })()}
// //                     </td>
// //                   ))}
// //                 </tr>
// //               ))}

// //               {/* OTHER HEADER */}
// //               <tr className="bg-white">
// //                 <td
// //                   colSpan={invDisplayedColumns.length}
// //                   className="px-3 py-2 text-left text-xs font-semibold text-gray-800 border-0 border-t border-gray-300"
// //                 >
// //                   Other Products
// //                 </td>
// //               </tr>

// //               {splitInventoryRows.other.map((row, index) => (
// //                 <tr key={`other-${index}`} className="bg-white">
// //                   {invDisplayedColumns.map((col) => (
// //                     <td
// //                       key={col}
// //                       className="px-3 py-2 text-center text-sm text-gray-800 border border-gray-300"
// //                     >
// //                       {col === "Sno."
// //                         ? index + 1
// //                         : (() => {
// //                             const v = getInvCellValue(row, col);

// //                             if (typeof v === "number") {
// //                               if (
// //                                 col ===
// //                                 "Inventory Coverage Ratio (In Months)"
// //                               )
// //                                 return v.toFixed(1);
// //                               return v.toLocaleString();
// //                             }
// //                             return String(v ?? "");
// //                           })()}
// //                     </td>
// //                   ))}
// //                 </tr>
// //               ))}

// //               {/* TOTAL ROW */}
// //               <tr className="bg-white">
// //                 <td
// //                   className="px-3 py-2 text-left text-sm font-semibold text-gray-900 border border-gray-300"
// //                   colSpan={
// //                     inventoryCountry.toLowerCase() !== "global"
// //                       ? 3
// //                       : 2
// //                   }
// //                 >
// //                   Total
// //                 </td>

// //                 {invDisplayedColumns
// //                   .slice(
// //                     inventoryCountry.toLowerCase() !== "global"
// //                       ? 3
// //                       : 2
// //                   )
// //                   .map((col) => {
// //                     const all = splitInventoryRows.top5.concat(
// //                       splitInventoryRows.other
// //                     );

// //                     if (
// //                       col ===
// //                       "Inventory Coverage Ratio (In Months)"
// //                     ) {
// //                       const totalInv = all.reduce(
// //                         (s, r) =>
// //                           s +
// //                           toNumberSafe(
// //                             getInvCellValue(
// //                               r,
// //                               "Current Inventory"
// //                             )
// //                           ),
// //                         0
// //                       );
// //                       const totalMtd = all.reduce(
// //                         (s, r) =>
// //                           s +
// //                           toNumberSafe(
// //                             getInvCellValue(r, "MTD Sales")
// //                           ),
// //                         0
// //                       );
// //                       const total30 = all.reduce(
// //                         (s, r) =>
// //                           s +
// //                           toNumberSafe(
// //                             getInvCellValue(
// //                               r,
// //                               "Sales for past 30 days"
// //                             )
// //                           ),
// //                         0
// //                       );

// //                       const denom = totalMtd + total30;
// //                       const ratio =
// //                         denom > 0 ? totalInv / denom : 0;

// //                       return (
// //                         <td
// //                           key={col}
// //                           className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border border-gray-300"
// //                         >
// //                           {denom > 0 ? ratio.toFixed(1) : "—"}
// //                         </td>
// //                       );
// //                     }

// //                     if (col === "Inventory Alerts") {
// //                       return (
// //                         <td
// //                           key={col}
// //                           className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border border-gray-300"
// //                         />
// //                       );
// //                     }

// //                     const total = all.reduce(
// //                       (s, r) =>
// //                         s +
// //                         toNumberSafe(
// //                           getInvCellValue(r, col)
// //                         ),
// //                       0
// //                     );

// //                     return (
// //                       <td
// //                         key={col}
// //                         className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border border-gray-300"
// //                       >
// //                         {total.toLocaleString()}
// //                       </td>
// //                     );
// //                   })}
// //               </tr>
// //             </tbody>
// //           </table>
// //         </div>
// //       ) : (
// //         <div className="text-sm text-gray-500">
// //           No inventory data.
// //         </div>
// //       )}
// //     </div>
// //   );
// // }




















// "use client";

// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useState,
// } from "react";
// import * as XLSX from "xlsx";
// import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// import Loader from "@/components/loader/Loader";
// import type { RegionKey } from "@/lib/dashboard/types";

// const baseURL =
//   process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

// /** 🔑 Keep this in sync with your main RegionKey type */
// // export type RegionKey = "Global" | "UK" | "US" | "CA";

// type InventoryRow = Record<string, string | number>;

// type CurrentInventorySectionProps = {
//   /** Follows your graphRegion: "Global" | "UK" | "US" | "CA" */
//   region: RegionKey;
// };

// /* ========= Shared helpers (you can import these from a utils file instead) ========= */

// function getISTYearMonth() {
//   const optsMonth: Intl.DateTimeFormatOptions = {
//     timeZone: "Asia/Kolkata",
//     month: "long",
//   };
//   const optsYear: Intl.DateTimeFormatOptions = {
//     timeZone: "Asia/Kolkata",
//     year: "numeric",
//   };
//   const now = new Date();
//   const monthName = now.toLocaleString("en-US", optsMonth);
//   const yearStr = now.toLocaleString("en-US", optsYear);
//   return { monthName, year: Number(yearStr) };
// }

// const toNumberSafe = (v: any) => {
//   if (v === null || v === undefined) return 0;
//   if (typeof v === "number") return v;
//   const s = String(v).replace(/[, ]+/g, "");
//   const n = Number(s);
//   return isNaN(n) ? 0 : n;
// };

// const isInventoryTotalRow = (r: InventoryRow) => {
//   const name = String(r["Product Name"] ?? "").trim().toLowerCase();
//   const sku = String(r["SKU"] ?? "").trim().toLowerCase();

//   if (!name && !sku) return false;

//   return (
//     name === "total" ||
//     name === "grand total" ||
//     name.includes("total") ||
//     sku === "total" ||
//     sku === "grand total" ||
//     sku.includes("total")
//   );
// };

// /* ===================== COMPONENT ===================== */

// export default function CurrentInventorySection({
//   region,
// }: CurrentInventorySectionProps) {
//   const [invLoading, setInvLoading] = useState(false);
//   const [invError, setInvError] = useState<string>("");
//   const [invRows, setInvRows] = useState<InventoryRow[]>([]);

//   // ✅ Match your previous logic: follow graphRegion, but send lowercase/“global” to backend
//   const inventoryCountry = useMemo(() => {
//     const v = (region || "").toString().trim().toLowerCase();
//     return v.length ? v : "global";
//   }, [region]);

//   // ✅ Current month/year in IST
//   const invMonthYear = useMemo(() => {
//     const { monthName, year } = getISTYearMonth();
//     return { month: monthName.toLowerCase(), year: String(year) };
//   }, []);

//   const getCurrentInventoryEndpoint = useCallback(() => {
//     return inventoryCountry === "global"
//       ? `${baseURL}/current_inventory_global`
//       : `${baseURL}/current_inventory`;
//   }, [inventoryCountry]);

//   // backend month column: "Current Month Units Sold (MonthName)" (dynamic)
//   const findMtdKey = useCallback((row: InventoryRow) => {
//     const key = Object.keys(row).find((k) =>
//       k.toLowerCase().startsWith("current month units sold")
//     );
//     return key || "";
//   }, []);

//   // ✅ Sales for past 30 days: backend may call it "Others" or something else
//   const findSales30Key = useCallback((row: InventoryRow) => {
//     const keys = Object.keys(row);

//     const exactOthers = keys.find((k) => k.trim().toLowerCase() === "others");
//     if (exactOthers) return exactOthers;

//     const past30 = keys.find((k) => k.toLowerCase().includes("past 30"));
//     if (past30) return past30;

//     const days30 = keys.find((k) => k.toLowerCase().includes("30 days"));
//     if (days30) return days30;

//     const same = keys.find(
//       (k) => k.trim().toLowerCase() === "sales for past 30 days"
//     );
//     if (same) return same;

//     return "";
//   }, []);

// const invDisplayedColumns = useMemo(() => {
//   return [
//     "Sno.",
//     ...(inventoryCountry !== "global" ? ["SKU"] : []),
//     "Product Name",
//     "Current Inventory",

//     // 🟡 Yellow Excel columns:
//     "0-90 Days Inventory",
//     "91-180 Days Inventory",
//     "181-270 Days Inventory",
//     "271-365 Days Inventory",
//     "365+ Days Inventory",
//     "Sales Rank",
//     "Est Storage Cost Next Month",

//     "MTD Sales",
//     "Sales for past 30 days",
//     "Inventory Coverage Ratio (In Months)",
//     "Inventory Alerts",
//   ];
// }, [inventoryCountry]);


// const getInvCellValue = useCallback(
//   (row: InventoryRow, col: string) => {
//     const beginningKey = "Inventory at the end of the month";
//     const inwardKey = "Inventory Inwarded";

//     const mtdKey = findMtdKey(row);
//     const sales30Key = findSales30Key(row);

//     const currentInventory = toNumberSafe(row[beginningKey]);
//     const mtdSales = toNumberSafe(mtdKey ? row[mtdKey] : 0);
//     const sales30 = toNumberSafe(sales30Key ? row[sales30Key] : 0);
//     const inwarded = toNumberSafe(row[inwardKey]); // reserved if you use later

//     switch (col) {
//       case "SKU":
//         return row["SKU"];

//       case "Product Name":
//         return row["Product Name"];

//       case "Current Inventory":
//         return currentInventory;

//       /* 🟡 New yellow columns: directly map to Excel headers */

//       case "0-90 Days Inventory":
//         return toNumberSafe(row["inv-age-0-to-90-days"]);

//       case "91-180 Days Inventory":
//         return toNumberSafe(row["inv-age-91-to-180-days"]);

//       case "181-270 Days Inventory":
//         return toNumberSafe(row["inv-age-181-to-270-days"]);

//       case "271-365 Days Inventory":
//         return toNumberSafe(row["inv-age-271-to-365-days"]);

//       case "365+ Days Inventory":
//         return toNumberSafe(row["inv-age-365-plus-days"]);

//       case "Sales Rank":
//         return toNumberSafe(row["sales-rank"]);

//       case "Est Storage Cost Next Month":
//         return toNumberSafe(row["estimated-storage-cost-next-month"]);

//       /* Existing derived columns */

//       case "MTD Sales":
//         return mtdSales;

//       case "Sales for past 30 days": {
//         const totalSales = sales30 + mtdSales;
//         return totalSales;
//       }

//       case "Inventory Coverage Ratio (In Months)": {
//         const denom = sales30 + mtdSales;
//         if (!denom || denom <= 0) return "—";
//         const ratio = currentInventory / denom;
//         return Number.isFinite(ratio) ? ratio : "—";
//       }

//       case "Inventory Alerts": {
//         const denom = sales30 + mtdSales;
//         if (!denom || denom <= 0) return "";
//         const ratio = currentInventory / denom;

//         if (ratio < 1) return "Low";
//         if (ratio < 2) return "Watch";
//         return "";
//       }

//       default:
//         return row[col as keyof InventoryRow];
//     }
//   },
//   [findMtdKey, findSales30Key]
// );


//   // Split rows into Top5 + Others, ignoring total rows
//   const splitInventoryRows = useMemo(() => {
//     if (!invRows?.length)
//       return { top5: [] as InventoryRow[], other: [] as InventoryRow[] };

//     const usable = invRows.filter((r) => {
//       const name = String(r["Product Name"] ?? "").trim();
//       const sku = String(r["SKU"] ?? "").trim();
//       const isEmpty = !name && !sku;
//       if (isEmpty) return false;

//       // remove Total / Grand Total rows from the main listing
//       if (isInventoryTotalRow(r)) return false;

//       return true;
//     });

//     const withMtd = usable.map((r) => {
//       const mtdKey = findMtdKey(r);
//       const mtd = toNumberSafe(mtdKey ? r[mtdKey] : 0);
//       return { row: r, mtd };
//     });

//     withMtd.sort((a, b) => b.mtd - a.mtd);

//     return {
//       top5: withMtd.slice(0, 5).map((x) => x.row),
//       other: withMtd.slice(5).map((x) => x.row),
//     };
//   }, [invRows, findMtdKey]);

//   // Single backend total row (if any)
//   const inventoryTotalRow = useMemo(
//     () => invRows.find((r) => isInventoryTotalRow(r)) || null,
//     [invRows]
//   );

//   // Fetch inventory from backend
//   const fetchCurrentInventory = useCallback(async () => {
//     const token =
//       typeof window !== "undefined"
//         ? localStorage.getItem("jwtToken")
//         : null;

//     if (!token) {
//       setInvError("Authorization token is missing");
//       setInvRows([]);
//       return;
//     }

//     setInvLoading(true);
//     setInvError("");

//     try {
//       const endpoint = getCurrentInventoryEndpoint();
//       const { month, year } = invMonthYear;

//       const res = await fetch(endpoint, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ month, year, country: inventoryCountry }),
//       });

//       if (!res.ok) {
//         const errJson = await res.json().catch(() => ({}));
//         throw new Error(
//           errJson?.error || "Failed to fetch CurrentInventory data"
//         );
//       }

//       const json = await res.json();
//       const fileData: string | undefined = json?.data;
//       if (!fileData)
//         throw new Error(json?.message || "Empty file received from server");

//       // Decode base64 → Blob → read via XLSX
//       const byteCharacters = atob(fileData);
//       const buffers: ArrayBuffer[] = [];
//       for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
//         const slice = byteCharacters.slice(offset, offset + 1024);
//         const byteNumbers = new Array(slice.length);
//         for (let i = 0; i < slice.length; i++)
//           byteNumbers[i] = slice.charCodeAt(i);
//         buffers.push(new Uint8Array(byteNumbers).buffer as ArrayBuffer);
//       }

//       const blob = new Blob(buffers, {
//         type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       });

//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const arr = new Uint8Array(e.target?.result as ArrayBuffer);
//         const wb = XLSX.read(arr, { type: "array" });
//         const sheetName = wb.SheetNames[0];
//         const sheet = wb.Sheets[sheetName];
//         const jsonData = XLSX.utils.sheet_to_json<InventoryRow>(sheet, {
//           defval: "",
//         });
//         setInvRows(jsonData);
//       };

//       reader.readAsArrayBuffer(blob);
//     } catch (e: any) {
//       setInvError(e?.message || "Unknown error");
//       setInvRows([]);
//     } finally {
//       setInvLoading(false);
//     }
//   }, [getCurrentInventoryEndpoint, invMonthYear, inventoryCountry]);

//   // Re-fetch on country change
//   useEffect(() => {
//     fetchCurrentInventory();
//   }, [fetchCurrentInventory]);

//   const { monthName, year } = getISTYearMonth();
//   const inventoryMonthLabel = useMemo(() => {
//     const shortMon = new Date(`${monthName} 1, ${year}`).toLocaleString(
//       "en-US",
//       {
//         month: "short",
//         timeZone: "Asia/Kolkata",
//       }
//     );
//     return `${shortMon} '${String(year).slice(-2)}`;
//   }, [monthName, year]);

//   return (
//     <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
//       <div className="mb-3">
//         <div className="flex items-baseline gap-2">
//           <PageBreadcrumb
//             pageTitle="Current Inventory -"
//             variant="page"
//             align="left"
//           />
//           <span className="text-[#5EA68E] text-lg font-semibold">
//             {inventoryMonthLabel}
//           </span>
//         </div>
//         <p className="mt-1 text-sm text-charcoal-500">
//           Auto-loaded for the current month
//         </p>
//       </div>

//       {invLoading ? (
//         <div className="py-10 flex justify-center">
//           <Loader
//             src="/infinity-unscreen.gif"
//             size={40}
//             transparent
//             roundedClass="rounded-full"
//             backgroundClass="bg-transparent"
//             respectReducedMotion
//           />
//         </div>
//       ) : invError ? (
//         <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
//           {invError}
//         </div>
//       ) : invRows.length > 0 ? (
//         <div className="overflow-x-auto rounded-lg">
//           <table className="min-w-[900px] w-full border-collapse border border-gray-300">
//             <thead>
//               <tr>
//                 {invDisplayedColumns.map((col) => (
//                   <th
//                     key={col}
//                     className="px-3 py-2 text-center text-sm font-semibold border border-gray-300 bg-[#5EA68E] text-[#f8edcf]"
//                   >
//                     {col}
//                   </th>
//                 ))}
//               </tr>
//             </thead>

//             <tbody>
//               {/* -------- TOP 5 PRODUCTS HEADER ROW -------- */}
//               <tr className="bg-white">
//                 <td
//                   colSpan={invDisplayedColumns.length}
//                   className="px-3 py-2 text-left text-xs font-semibold text-gray-800 border-0 border-t border-gray-300"
//                 >
//                   Top 5 Products
//                 </td>
//               </tr>

//               {splitInventoryRows.top5.map((row, index) => (
//                 <tr key={`top-${index}`} className="bg-white">
//                   {invDisplayedColumns.map((col) => (
//                     <td
//                       key={col}
//                       className="px-3 py-2 text-center text-sm text-gray-800 border border-gray-300"
//                     >
//                       {col === "Sno."
//                         ? index + 1
//                         : (() => {
//                             const v = getInvCellValue(row, col);
//                             if (typeof v === "number") {
//                               if (
//                                 col ===
//                                 "Inventory Coverage Ratio (In Months)"
//                               ) {
//                                 return v.toFixed(1);
//                               }
//                               return v.toLocaleString();
//                             }
//                             return String(v ?? "");
//                           })()}
//                     </td>
//                   ))}
//                 </tr>
//               ))}

//               {/* -------- OTHER PRODUCTS HEADER ROW -------- */}
//               <tr className="bg-white">
//                 <td
//                   colSpan={invDisplayedColumns.length}
//                   className="px-3 py-2 text-left text-xs font-semibold text-gray-800 border-0 border-t border-gray-300"
//                 >
//                   Other Products
//                 </td>
//               </tr>

//               {splitInventoryRows.other.map((row, index) => (
//                 <tr key={`other-${index}`} className="bg-white">
//                   {invDisplayedColumns.map((col) => (
//                     <td
//                       key={col}
//                       className="px-3 py-2 text-center text-sm text-gray-800 border border-gray-300"
//                     >
//                       {col === "Sno."
//                         ? index + 1
//                         : (() => {
//                             const v = getInvCellValue(row, col);
//                             if (typeof v === "number") {
//                               if (
//                                 col ===
//                                 "Inventory Coverage Ratio (In Months)"
//                               ) {
//                                 return v.toFixed(1);
//                               }
//                               return v.toLocaleString();
//                             }
//                             return String(v ?? "");
//                           })()}
//                     </td>
//                   ))}
//                 </tr>
//               ))}

//               {/* -------- BACKEND TOTAL ROW ONLY -------- */}
//               {inventoryTotalRow && (
//                 <tr className="bg-white">
//                   {invDisplayedColumns.map((col) => (
//                     <td
//                       key={col}
//                       className="px-3 py-2 text-center text-sm font-semibold text-gray-900 border border-gray-300"
//                     >
//                       {col === "Sno."
//                         ? "" // Total row ke liye S.No blank
//                         : (() => {
//                             const v = getInvCellValue(
//                               inventoryTotalRow,
//                               col
//                             );
//                             if (typeof v === "number") {
//                               if (
//                                 col ===
//                                 "Inventory Coverage Ratio (In Months)"
//                               ) {
//                                 return v.toFixed(1);
//                               }
//                               return v.toLocaleString();
//                             }
//                             return String(v ?? "");
//                           })()}
//                     </td>
//                   ))}
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       ) : (
//         <div className="text-sm text-gray-500">No inventory data.</div>
//       )}
//     </div>
//   );
// }






























"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as XLSX from "xlsx";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/loader/Loader";
import type { RegionKey } from "@/lib/dashboard/types";
import DataTable, { ColumnDef } from "../ui/table/DataTable";
import { FaCaretLeft, FaCaretRight } from "react-icons/fa";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

type InventoryRow = Record<string, string | number>;

/** Row shape for the DataTable */
type InventoryUiRow = {
  sno: React.ReactNode;
  // sku?: React.ReactNode;
  productName?: React.ReactNode;
  currentInventory?: React.ReactNode;
  // ageCombined?: React.ReactNode;
  // age0to90?: React.ReactNode;
  // age91to180?: React.ReactNode;
  // age181to270?: React.ReactNode;
  // age271to365?: React.ReactNode;
  // age365plus?: React.ReactNode;
  salesRank?: React.ReactNode;
  estStorage?: React.ReactNode;
  mtdSales?: React.ReactNode;
  sales30?: React.ReactNode;
  coverageMonths?: React.ReactNode;
  alert?: React.ReactNode;
  /** "normal" | "others" | "total" – for styling */
  rowType?: "normal" | "others" | "total";
} & Record<string, React.ReactNode>;


type CurrentInventorySectionProps = {
  /** Follows your graphRegion: "Global" | "UK" | "US" | "CA" */
  region: RegionKey;
};

/* ========= Shared helpers ========= */

function getISTYearMonth() {
  const optsMonth: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    month: "long",
  };
  const optsYear: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  };
  const now = new Date();
  const monthName = now.toLocaleString("en-US", optsMonth);
  const yearStr = now.toLocaleString("en-US", optsYear);
  return { monthName, year: Number(yearStr) };
}

const toNumberSafe = (v: any) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[, ]+/g, "");
  const n = Number(s);
  return isNaN(n) ? 0 : n;
};

const isInventoryTotalRow = (r: InventoryRow) => {
  const name = String(r["Product Name"] ?? "").trim().toLowerCase();
  const sku = String(r["SKU"] ?? "").trim().toLowerCase();

  if (!name && !sku) return false;

  return (
    name === "total" ||
    name === "grand total" ||
    name.includes("total") ||
    sku === "total" ||
    sku === "grand total" ||
    sku.includes("total")
  );
};

const formatInt = (n: number | null | undefined) => {
  const v = Number(n ?? 0);
  if (!v) return "0";
  return v.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
};

const formatRatio = (n: number | null | undefined) => {
  const v = Number(n ?? 0);
  if (!v || !Number.isFinite(v)) return "—";
  return v.toFixed(1);
};

/* ===================== COMPONENT ===================== */

export default function CurrentInventorySection({
  region,
}: CurrentInventorySectionProps) {
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState<string>("");
  const [invRows, setInvRows] = useState<InventoryRow[]>([]);

  const [ageExpanded, setAgeExpanded] = useState(false);
  const toggleAgeExpanded = React.useCallback(
    () => setAgeExpanded((v) => !v),
    []
  );

  // const ageHeader = (
  //   <div className="relative flex items-center justify-center px-4 py-1">
  //     {/* Left Icon */}
  //     <span className="absolute left-0 top-1/2 -translate-y-1/2">
  //       {ageExpanded ? <FaCaretRight /> : <FaCaretLeft />}
  //     </span>

  //     {/* Center Text */}
  //     <span>Inventory Age</span>

  //     {/* Right Icon */}
  //     <span className="absolute right-0 top-1/2 -translate-y-1/2">
  //       {ageExpanded ? <FaCaretLeft /> : <FaCaretRight />}
  //     </span>
  //   </div>
  // );


  // ✅ Match previous logic: follow graphRegion, but send lowercase/“global” to backend
  const inventoryCountry = useMemo(() => {
    const v = (region || "").toString().trim().toLowerCase();
    return v.length ? v : "global";
  }, [region]);

  // ✅ Current month/year in IST
  const invMonthYear = useMemo(() => {
    const { monthName, year } = getISTYearMonth();
    return { month: monthName.toLowerCase(), year: String(year) };
  }, []);

  const getCurrentInventoryEndpoint = useCallback(() => {
    return inventoryCountry === "global"
      ? `${baseURL}/current_inventory_global`
      : `${baseURL}/current_inventory`;
  }, [inventoryCountry]);

  // backend month column: "Current Month Units Sold (MonthName)" (dynamic)
  const findMtdKey = useCallback((row: InventoryRow) => {
    const key = Object.keys(row).find((k) =>
      k.toLowerCase().startsWith("current month units sold")
    );
    return key || "";
  }, []);

  // ✅ Sales for past 30 days: backend may call it "Others" or something else
  const findSales30Key = useCallback((row: InventoryRow) => {
    const keys = Object.keys(row);

    const exactOthers = keys.find((k) => k.trim().toLowerCase() === "others");
    if (exactOthers) return exactOthers;

    const past30 = keys.find((k) => k.toLowerCase().includes("past 30"));
    if (past30) return past30;

    const days30 = keys.find((k) => k.toLowerCase().includes("30 days"));
    if (days30) return days30;

    const same = keys.find(
      (k) => k.trim().toLowerCase() === "sales for past 30 days"
    );
    if (same) return same;

    return "";
  }, []);

  // Single backend total row (if any)
  const inventoryTotalRow = useMemo(
    () => invRows.find((r) => isInventoryTotalRow(r)) || null,
    [invRows]
  );

  // 🔁 Fetch inventory from backend
  const fetchCurrentInventory = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("jwtToken")
        : null;

    if (!token) {
      setInvError("Authorization token is missing");
      setInvRows([]);
      return;
    }

    setInvLoading(true);
    setInvError("");

    try {
      const endpoint = getCurrentInventoryEndpoint();
      const { month, year } = invMonthYear;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ month, year, country: inventoryCountry }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson?.error || "Failed to fetch CurrentInventory data"
        );
      }

      const json = await res.json();
      const fileData: string | undefined = json?.data;
      if (!fileData)
        throw new Error(json?.message || "Empty file received from server");

      // Decode base64 → Blob → read via XLSX
      const byteCharacters = atob(fileData);
      const buffers: ArrayBuffer[] = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++)
          byteNumbers[i] = slice.charCodeAt(i);
        buffers.push(new Uint8Array(byteNumbers).buffer as ArrayBuffer);
      }

      const blob = new Blob(buffers, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(arr, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<InventoryRow>(sheet, {
          defval: "",
        });
        setInvRows(jsonData);
      };

      reader.readAsArrayBuffer(blob);
    } catch (e: any) {
      setInvError(e?.message || "Unknown error");
      setInvRows([]);
    } finally {
      setInvLoading(false);
    }
  }, [getCurrentInventoryEndpoint, invMonthYear, inventoryCountry]);

  // Re-fetch on country change
  useEffect(() => {
    fetchCurrentInventory();
  }, [fetchCurrentInventory]);

  const { monthName, year } = getISTYearMonth();
  const inventoryMonthLabel = useMemo(() => {
    const shortMon = new Date(`${monthName} 1, ${year}`).toLocaleString(
      "en-US",
      {
        month: "short",
        timeZone: "Asia/Kolkata",
      }
    );
    return `${shortMon} '${String(year).slice(-2)}`;
  }, [monthName, year]);

  /* -------- Transform backend rows → UI rows for DataTable -------- */

  const tableRows: InventoryUiRow[] = useMemo(() => {
    if (!invRows?.length) return [];

    // 1) Filter out empty + backend total rows
    const usable = invRows.filter((r) => {
      const name = String(r["Product Name"] ?? "").trim();
      const sku = String(r["SKU"] ?? "").trim();
      const isEmpty = !name && !sku;
      if (isEmpty) return false;
      if (isInventoryTotalRow(r)) return false;
      return true;
    });

    type CalcRow = {
      index: number;
      row: InventoryRow;
      currentInventory: number;
      mtdSales: number;
      sales30: number;
      // age0to90: number;
      // age91to180: number;
      // age181to270: number;
      // age271to365: number;
      // age365plus: number;
      coverage: number;
      salesRank: number;
      estStorage: number;
    };

    // 2) Pre-calculate numeric metrics for each row
    const calcRows: CalcRow[] = usable.map((r, idx) => {
      const mtdKey = findMtdKey(r);
      const sales30Key = findSales30Key(r);

      const currentInventory = toNumberSafe(
        r["Inventory at the end of the month"]
      );
      const mtdSales = toNumberSafe(mtdKey ? r[mtdKey] : 0);
      const sales30 = toNumberSafe(sales30Key ? r[sales30Key] : 0);

      // const age0to90 = toNumberSafe(r["inv-age-0-to-90-days"]);
      // const age91to180 = toNumberSafe(r["inv-age-91-to-180-days"]);
      // const age181to270 = toNumberSafe(r["inv-age-181-to-270-days"]);
      // const age271to365 = toNumberSafe(r["inv-age-271-to-365-days"]);
      // const age365plus = toNumberSafe(r["inv-age-365-plus-days"]);

      const denom = mtdSales + sales30;
      const coverage = denom > 0 ? currentInventory / denom : 0;

      const salesRank = toNumberSafe(r["sales-rank"]);
      const estStorage = toNumberSafe(
        r["estimated-storage-cost-next-month"]
      );

      return {
        index: idx,
        row: r,
        currentInventory,
        mtdSales,
        sales30,
        // age0to90,
        // age91to180,
        // age181to270,
        // age271to365,
        // age365plus,
        coverage,
        salesRank,
        estStorage,
      };
    });

    if (!calcRows.length) return [];

    // 3) Top 5 by MTD Sales (desc)
    const sortedByMtd = [...calcRows].sort(
      (a, b) => b.mtdSales - a.mtdSales
    );
    const top5 = sortedByMtd.slice(0, 5);
    const top5Indices = new Set(top5.map((r) => r.index));

    // 4) Others = all remaining rows
    const othersRows = calcRows.filter((r) => !top5Indices.has(r.index));

    // 5) Build UI rows for top 5 (keep sorted by MTD desc)
    const uiRows: InventoryUiRow[] = top5.map((c, idx) => {
      const {
        row,
        currentInventory,
        mtdSales,
        sales30,
        // age0to90,
        // age91to180,
        // age181to270,
        // age271to365,
        // age365plus,
        coverage,
        salesRank,
        estStorage,
      } = c;

      // const ageTotal =
      //   age0to90 +
      //   age91to180 +
      //   age181to270 +
      //   age271to365 +
      //   age365plus;

      return {
        rowType: "normal",
        sno: idx + 1,
        // sku: row["SKU"] || "",
        sku: "",
        productName: row["Product Name"] || "",
        currentInventory: formatInt(currentInventory),
        // ageCombined: formatInt(ageTotal),
        // age0to90: formatInt(age0to90),
        // age91to180: formatInt(age91to180),
        // age181to270: formatInt(age181to270),
        // age271to365: formatInt(age271to365),
        // age365plus: formatInt(age365plus),
        salesRank: salesRank ? formatInt(salesRank) : "—",
        estStorage: estStorage ? formatInt(estStorage) : "—",
        mtdSales: formatInt(mtdSales),
        sales30: formatInt(mtdSales + sales30),
        coverageMonths: formatRatio(coverage),
        alert:
          mtdSales + sales30 <= 0
            ? ""
            : coverage < 1
              ? "Low"
              : coverage < 2
                ? "Watch"
                : "",
      };
    });

    // 6) "Others" aggregate row (if we actually have others)
    if (othersRows.length > 0) {
      const agg = othersRows.reduce(
        (acc, r) => {
          acc.currentInventory += r.currentInventory;
          acc.mtdSales += r.mtdSales;
          acc.sales30 += r.sales30;
          // acc.age0to90 += r.age0to90;
          // acc.age91to180 += r.age91to180;
          // acc.age181to270 += r.age181to270;
          // acc.age271to365 += r.age271to365;
          // acc.age365plus += r.age365plus;
          acc.salesRank += r.salesRank;
          acc.estStorage += r.estStorage;
          return acc;
        },
        {
          currentInventory: 0,
          mtdSales: 0,
          sales30: 0,
          age0to90: 0,
          age91to180: 0,
          age181to270: 0,
          age271to365: 0,
          age365plus: 0,
          salesRank: 0,
          estStorage: 0,
        }
      );

      const denom = agg.mtdSales + agg.sales30;
      const coverage = denom > 0 ? agg.currentInventory / denom : 0;

      uiRows.push({
        rowType: "others",
        sno: "", // no serial for Others
        sku: "",
        productName: <span className="font-semibold">OTHERS</span>,
        currentInventory: (
          <span className="font-semibold">
            {formatInt(agg.currentInventory)}
          </span>
        ),
        ageCombined: (
          <span className="font-semibold">
            {formatInt(
              agg.age0to90 +
              agg.age91to180 +
              agg.age181to270 +
              agg.age271to365 +
              agg.age365plus
            )}
          </span>
        ),
        age0to90: (
          <span className="font-semibold">
            {formatInt(agg.age0to90)}
          </span>
        ),
        age91to180: (
          <span className="font-semibold">
            {formatInt(agg.age91to180)}
          </span>
        ),
        age181to270: (
          <span className="font-semibold">
            {formatInt(agg.age181to270)}
          </span>
        ),
        age271to365: (
          <span className="font-semibold">
            {formatInt(agg.age271to365)}
          </span>
        ),
        age365plus: (
          <span className="font-semibold">
            {formatInt(agg.age365plus)}
          </span>
        ),
        salesRank: agg.salesRank
          ? <span className="font-semibold">{formatInt(agg.salesRank)}</span>
          : "—",
        estStorage: agg.estStorage
          ? <span className="font-semibold">{formatInt(agg.estStorage)}</span>
          : "—",
        mtdSales: (
          <span className="font-semibold">
            {formatInt(agg.mtdSales)}
          </span>
        ),
        sales30: (
          <span className="font-semibold">
            {formatInt(agg.mtdSales + agg.sales30)}
          </span>
        ),
        coverageMonths: (
          <span className="font-semibold">
            {formatRatio(coverage)}
          </span>
        ),
        alert: "",
      });
    }

    // 7) Backend grand total row (your existing Total)
    if (inventoryTotalRow) {
      const mtdKey = findMtdKey(inventoryTotalRow);
      const sales30Key = findSales30Key(inventoryTotalRow);

      const currentInventory = toNumberSafe(
        inventoryTotalRow["Inventory at the end of the month"]
      );
      const mtdSales = toNumberSafe(mtdKey ? inventoryTotalRow[mtdKey] : 0);
      const sales30 = toNumberSafe(
        sales30Key ? inventoryTotalRow[sales30Key] : 0
      );

      const age0to90 = toNumberSafe(
        inventoryTotalRow["inv-age-0-to-90-days"]
      );
      const age91to180 = toNumberSafe(
        inventoryTotalRow["inv-age-91-to-180-days"]
      );
      const age181to270 = toNumberSafe(
        inventoryTotalRow["inv-age-181-to-270-days"]
      );
      const age271to365 = toNumberSafe(
        inventoryTotalRow["inv-age-271-to-365-days"]
      );
      const age365plus = toNumberSafe(
        inventoryTotalRow["inv-age-365-plus-days"]
      );

      const ageTotal =
        age0to90 +
        age91to180 +
        age181to270 +
        age271to365 +
        age365plus;

      const denom = mtdSales + sales30;
      const coverage = denom > 0 ? currentInventory / denom : 0;

      uiRows.push({
        rowType: "total",
        sno: "",
        sku: "",
        productName: <span className="font-semibold">Total</span>,
        currentInventory: (
          <span className="font-semibold">
            {formatInt(currentInventory)}
          </span>
        ),
        ageCombined: (
          <span className="font-semibold">{formatInt(ageTotal)}</span>
        ),
        age0to90: (
          <span className="font-semibold">{formatInt(age0to90)}</span>
        ),
        age91to180: (
          <span className="font-semibold">{formatInt(age91to180)}</span>
        ),
        age181to270: (
          <span className="font-semibold">
            {formatInt(age181to270)}
          </span>
        ),
        age271to365: (
          <span className="font-semibold">
            {formatInt(age271to365)}
          </span>
        ),
        age365plus: (
          <span className="font-semibold">
            {formatInt(age365plus)}
          </span>
        ),
        salesRank: "",
        estStorage: "",
        mtdSales: (
          <span className="font-semibold">{formatInt(mtdSales)}</span>
        ),
        sales30: (
          <span className="font-semibold">
            {formatInt(mtdSales + sales30)}
          </span>
        ),
        coverageMonths: (
          <span className="font-semibold">
            {formatRatio(coverage)}
          </span>
        ),
        alert: "",
      });
    }

    return uiRows;
  }, [invRows, findMtdKey, findSales30Key, inventoryTotalRow]);


  /* -------- Build DataTable columns (with collapsible age group) -------- */

  const columns: ColumnDef<InventoryUiRow>[] = useMemo(() => {
    const cols: ColumnDef<InventoryUiRow>[] = [];

    cols.push({
      key: "sno",
      header: "Sno.",
      width: "60px",
      cellClassName: "text-center",
    });

    // if (inventoryCountry !== "global") {
    //   cols.push({
    //     key: "sku",
    //     header: "SKU",
    //     cellClassName: "text-center",
    //   });
    // }

    cols.push({
      key: "productName",
      header: "Product Name",
      cellClassName: "text-left",
      headerClassName: "text-left",
      width: "220px",
    });

    cols.push({
      key: "currentInventory",
      header: "Current Inventory",
      cellClassName: "text-center",
    });

    // 🔹 Inventory Age column – ALWAYS visible
    const ageHeader = (
      <div className="relative flex items-center justify-center px-4 py-1">
        {/* Left Icon */}
        {/* <span className="absolute left-0 top-1/2 -translate-y-1/2">
          {ageExpanded ? <FaCaretRight /> : <FaCaretLeft />}
        </span> */}

        {/* Center Text */}
        <span>Inventory Age</span>

        {/* Right Icon */}
        {/* <span className="absolute right-0 top-1/2 -translate-y-1/2">
          {ageExpanded ? <FaCaretLeft /> : <FaCaretRight />}
        </span> */}
      </div>
    );

    cols.push({
      key: "ageCombined",
      header: ageHeader,
      cellClassName: "text-center",
      onHeaderClick: toggleAgeExpanded,
    });

    // 🔹 When expanded: show extra bucket columns AFTER Inventory Age
    // if (ageExpanded) {
    //   cols.push(
    //     {
    //       key: "age0to90",
    //       header: "0-90 Days Inventory",
    //       cellClassName: "text-center",
    //     },
    //     {
    //       key: "age91to180",
    //       header: "91-180 Days Inventory",
    //       cellClassName: "text-center",
    //     },
    //     {
    //       key: "age181to270",
    //       header: "181-270 Days Inventory",
    //       cellClassName: "text-center",
    //     },
    //     {
    //       key: "age271to365",
    //       header: "271-365 Days Inventory",
    //       cellClassName: "text-center",
    //     },
    //     {
    //       key: "age365plus",
    //       header: "365+ Days Inventory",
    //       cellClassName: "text-center",
    //     }
    //   );
    // }

    // rest of your columns…
    cols.push(
      {
        key: "salesRank",
        header: "Sales Rank",
        cellClassName: "text-center",
      },
      {
        key: "estStorage",
        header: "Est Storage Cost Next Month",
        cellClassName: "text-center",
      },
      {
        key: "mtdSales",
        header: "MTD Sales",
        cellClassName: "text-center",
      },
      {
        key: "sales30",
        header: "Sales for past 30 days",
        cellClassName: "text-center",
      },
      {
        key: "coverageMonths",
        header: "Inventory Coverage Ratio (In Months)",
        cellClassName: "text-center",
      },
      {
        key: "alert",
        header: "Inventory Alerts",
        cellClassName: "text-center",
      }
    );

    return cols;
  }, [inventoryCountry]);

return (
  <div
    className="
      mt-6 rounded-2xl border bg-white p-4 shadow-sm
      w-full max-w-full overflow-hidden
      flex flex-col
    "
  >
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <PageBreadcrumb
            pageTitle="Current Inventory"
            variant="page"
            align="left"
          />
          {/* <span className="text-green-500 text-lg sm:text-2xl md:text-2xl font-semibold">
            {inventoryMonthLabel}
          </span> */}
        </div>
        <p className="mt-1 text-sm text-charcoal-500">
          Auto-loaded for the current month
        </p>
      </div>

      {invLoading ? (
        <div className="py-10 flex justify-center">
          <Loader
            src="/infinity-unscreen.gif"
            size={40}
            transparent
            roundedClass="rounded-full"
            backgroundClass="bg-transparent"
            respectReducedMotion
          />
        </div>
      ) : invError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {invError}
        </div>
      ) : (
        <div className="mt-2 flex-1 w-full max-w-full overflow-x-auto">
          {/* Inner wrapper: table can grow wider, but parent won't */}
          <div className="min-w-max [&_table]:w-auto">
            <DataTable
              columns={columns}
              data={tableRows}
              loading={false}
              paginate={true}
              pageSize={15}
              scrollY={false}
              maxHeight="none"
              emptyMessage="No inventory data."
              rowClassName={(row) => {
                if (row.rowType === "total") return "bg-slate-100 font-semibold";
                if (row.rowType === "others") return "bg-slate-50 font-semibold";
                return "";
              }}
            />
          </div>
        </div>

      )} 
    </div>
  );
}
