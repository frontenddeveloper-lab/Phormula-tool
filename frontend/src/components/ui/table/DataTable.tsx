// "use client";

// import * as React from "react";
// import clsx from "clsx";
// import Loader from "@/components/loader/Loader"; // 👈 NEW

// export type Row = Record<string, React.ReactNode>;

// export type ColumnDef<T extends Row> = {
//   key: keyof T | string;
//   header: string;
//   render?: (row: T, value: React.ReactNode, rowIndex: number) => React.ReactNode;
//   width?: string;
//   cellClassName?: string;
//   headerClassName?: string;
// };

// type DataTableProps<T extends Row> = {
//   columns: ColumnDef<T>[];
//   data: T[];

//   /** Layout & UX */
//   className?: string;
//   tableClassName?: string;
//   maxHeight?: number | string;
//   stickyHeader?: boolean;
//   zebra?: boolean;
//   emptyMessage?: string;
//   showCellTitle?: boolean;

//   /** Pagination (client-side) */
//   pageSize?: number; // default 10
//   initialPage?: number; // 1-based index
//   paginate?: boolean;
//   scrollY?: boolean;

//   /** Row styling */
//   rowClassName?: (row: T, rowIndex: number) => string;

//   /** Optional callback when page changes (1-based) */
//   onPageChange?: (page: number) => void;

//   /** Loading state */
//   loading?: boolean;              // 👈 NEW
//   loaderHeight?: number | string; // 👈 NEW (optional custom height)
// };

// export default function DataTable<T extends Row>({
//   columns,
//   data,
//   className,
//   tableClassName,
//   maxHeight = "60vh",
//   stickyHeader = true,
//   zebra = true,
//   emptyMessage = "No data found.",
//   showCellTitle = false,
//   pageSize = 10,
//   initialPage = 1,
//   paginate = true, // default on
//   scrollY = true, // default on
//   rowClassName,
//   onPageChange,
//   loading = false,          // 👈 NEW default
//   loaderHeight = 260,       // 👈 NEW default height
// }: DataTableProps<T>) {
//   const containerStyle: React.CSSProperties = {
//     // only limit height (and allow vertical scroll) when scrollY is true
//     maxHeight: scrollY
//       ? typeof maxHeight === "number"
//         ? `${maxHeight}px`
//         : maxHeight
//       : undefined,
//   };

//   const hasData = Array.isArray(data) && data.length > 0;

//   // 👇 Loader handling
//   const loaderStyleHeight =
//     typeof loaderHeight === "number" ? `${loaderHeight}px` : loaderHeight;

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center" style={{ height: loaderStyleHeight }}>
//         <Loader
//           src="/infinity-unscreen.gif"
//           size={150}
//           transparent
//           roundedClass="rounded-full"
//           backgroundClass="bg-transparent"
//           respectReducedMotion
//         />
//       </div>
//     );
//   }
//   // 👆 end loader

//   // Pagination state (1-based)
//   const [page, setPage] = React.useState<number>(Math.max(1, initialPage));

//   // Reset to page 1 if data changes and current page exceeds new total
//   React.useEffect(() => {
//     const totalPages = Math.max(1, Math.ceil((data?.length ?? 0) / pageSize));
//     if (page > totalPages) {
//       setPage(1);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [data, pageSize]);

//   const total = data?.length ?? 0;

//   const totalPages = paginate ? Math.max(1, Math.ceil(total / pageSize)) : 1;

//   const startIdx =
//     !paginate || total === 0
//       ? total === 0
//         ? 0
//         : 1
//       : (page - 1) * pageSize + 1;

//   const endIdx =
//     !paginate || total === 0 ? total : Math.min(page * pageSize, total);

//   const pageRows = React.useMemo(() => {
//     if (!hasData) return [];
//     if (!paginate) return data; // no slicing when pagination disabled
//     const start = (page - 1) * pageSize;
//     return data.slice(start, start + pageSize);
//   }, [data, page, pageSize, hasData, paginate]);

//   const goToPage = (p: number) => {
//     const next = Math.min(Math.max(1, p), totalPages);
//     setPage(next);
//     onPageChange?.(next);
//   };

//   const onFirst = () => goToPage(1);
//   const onPrev = () => goToPage(page - 1);
//   const onNext = () => goToPage(page + 1);
//   const onLast = () => goToPage(totalPages);

//   return (
//     <div
//       className={clsx(
//         "overflow-hidden rounded border border-gray-200",
//         className
//       )}
//     >
//       <div
//         className={clsx(
//           "w-full",
//           scrollY ? "overflow-auto" : "overflow-x-auto", // only horizontal scroll when scrollY=false
//           stickyHeader && "scroll-pt-12"
//         )}
//         style={containerStyle}
//       >
//         <table
//           className={clsx(
//             // let parent control width, no forced min-width, no forced nowrap
//             "w-full border-collapse text-xs md:text-sm",
//             tableClassName
//           )}
//         >

//           <thead
//             className={clsx(
//               "bg-green-500 text-amber-100 ",
//               stickyHeader && "sticky top-0 z-10"
//             )}
//           >
//             <tr>
//               {columns.map((col, i) => (
//                 <th
//                   key={String(col.key) + i}
//                   className={clsx(
//                     "border border-slate-300 px-3 py-2 md:py-3",
//                     col.headerClassName
//                   )}
//                   style={col.width ? { width: col.width } : undefined}
//                 >

//                   {col.header}
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             {!hasData && (
//               <tr>
//                 <td
//                   className="px-3 py-4 text-xs md:text-sm text-gray-500"
//                   colSpan={columns.length}
//                 >
//                   {emptyMessage}
//                 </td>
//               </tr>
//             )}

//             {hasData &&
//               pageRows.map((row, ri) => (
//                 <tr
//                   key={ri}
//                   className={clsx(
//                     zebra && ri % 2 === 1 ? "bg-gray-50" : "bg-white",
//                     "hover:bg-emerald-50/70",
//                     rowClassName?.(row, (page - 1) * pageSize + ri)
//                   )}
//                 >
//                   {columns.map((col, ci) => {
//                     const value = (row as Record<string, React.ReactNode>)[
//                       String(col.key)
//                     ];
//                     return (
//                       <td
//                         key={String(col.key) + ci}
//                         className={clsx(
//                           "max-w-[240px] truncate border border-slate-200 px-3 py-2",
//                           col.cellClassName
//                         )}
//                         title={
//                           showCellTitle ? String(value ?? "\u00A0") : undefined
//                         }
//                       >
//                         {col.render
//                           ? col.render(
//                             row,
//                             value,
//                             (page - 1) * pageSize + ri
//                           )
//                           : value ?? "\u00A0"}
//                       </td>
//                     );
//                   })}
//                 </tr>
//               ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination footer */}
//       {paginate && (
//         <div className="flex flex-col items-center gap-2 border-t border-gray-200 p-3 sm:flex-row sm:justify-between">
//           <div className="text-xs text-gray-600">
//             {total > 0 ? (
//               <>
//                 Showing <span className="font-medium">{startIdx}</span>–
//                 <span className="font-medium">{endIdx}</span> of{" "}
//                 <span className="font-medium">{total}</span>
//               </>
//             ) : (
//               <>No records</>
//             )}
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               onClick={onFirst}
//               disabled={page <= 1}
//               className="rounded border px-2 py-1 text-xs disabled:opacity-50"
//               aria-label="First page"
//             >
//               « First
//             </button>
//             <button
//               onClick={onPrev}
//               disabled={page <= 1}
//               className="rounded border px-2 py-1 text-xs disabled:opacity-50"
//               aria-label="Previous page"
//             >
//               ‹ Prev
//             </button>

//             <span className="text-xs text-gray-700">
//               Page <span className="font-medium">{page}</span> of{" "}
//               <span className="font-medium">{totalPages}</span>
//             </span>

//             <button
//               onClick={onNext}
//               disabled={page >= totalPages}
//               className="rounded border px-2 py-1 text-xs disabled:opacity-50"
//               aria-label="Next page"
//             >
//               Next ›
//             </button>
//             <button
//               onClick={onLast}
//               disabled={page >= totalPages}
//               className="rounded border px-2 py-1 text-xs disabled:opacity-50"
//               aria-label="Last page"
//             >
//               Last »
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// // // Usage

// // <DataTable
// //   columns={columns}
// //   data={rows}
// //   loading={isLoading}      // 👈 pass your loading state here
// //   loaderHeight={320}       // optional, can omit
// // />




























// "use client";

// import * as React from "react";
// import clsx from "clsx";
// import Loader from "@/components/loader/Loader";
// import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

// export type Row = Record<string, React.ReactNode>;

// export type ColumnDef<T extends Row> = {
//   key: keyof T | string;
//   header: React.ReactNode; // string OR JSX
//   render?: (row: T, value: React.ReactNode, rowIndex: number) => React.ReactNode;
//   width?: string;
//   cellClassName?: string;
//   headerClassName?: string;
//   onHeaderClick?: () => void; // header click handler
// };

// type DataTableProps<T extends Row> = {
//   columns: ColumnDef<T>[];
//   data: T[];

//   className?: string;
//   tableClassName?: string;
//   maxHeight?: number | string;
//   stickyHeader?: boolean;
//   zebra?: boolean;
//   emptyMessage?: string;
//   showCellTitle?: boolean;

//   pageSize?: number;
//   initialPage?: number;
//   paginate?: boolean;
//   scrollY?: boolean;

//   rowClassName?: (row: T, rowIndex: number) => string;
//   onPageChange?: (page: number) => void;

//   loading?: boolean;
//   loaderHeight?: number | string;
// };

// export default function DataTable<T extends Row>({
//   columns,
//   data,
//   className,
//   tableClassName,
//   maxHeight = "60vh",
//   stickyHeader = true,
//   zebra = true,
//   emptyMessage = "No data found.",
//   showCellTitle = false,
//   pageSize = 10,
//   initialPage = 1,
//   paginate = true,
//   scrollY = true,
//   rowClassName,
//   onPageChange,
//   loading = false,
//   loaderHeight = 260,
// }: DataTableProps<T>) {
//   const containerStyle: React.CSSProperties = {
//     maxHeight: scrollY
//       ? typeof maxHeight === "number"
//         ? `${maxHeight}px`
//         : maxHeight
//       : undefined,
//   };

//   const hasData = Array.isArray(data) && data.length > 0;

//   // Loader
//   const loaderStyleHeight =
//     typeof loaderHeight === "number" ? `${loaderHeight}px` : loaderHeight;

//   if (loading) {
//     return (
//       <div
//         className={clsx(
//           "flex items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm",
//           className
//         )}
//         style={{ minHeight: loaderStyleHeight }}
//       >
//         <Loader
//           src="/infinity-unscreen.gif"
//           size={150}
//           transparent
//           roundedClass="rounded-full"
//           backgroundClass="bg-transparent"
//           respectReducedMotion
//         />
//       </div>
//     );
//   }

//   // Pagination
//   const [page, setPage] = React.useState<number>(Math.max(1, initialPage));

//   React.useEffect(() => {
//     const totalPages = Math.max(1, Math.ceil((data?.length ?? 0) / pageSize));
//     if (page > totalPages) {
//       setPage(1);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [data, pageSize]);

//   const total = data?.length ?? 0;
//   const totalPages = paginate ? Math.max(1, Math.ceil(total / pageSize)) : 1;

//   const startIdx =
//     !paginate || total === 0
//       ? total === 0
//         ? 0
//         : 1
//       : (page - 1) * pageSize + 1;

//   const endIdx =
//     !paginate || total === 0 ? total : Math.min(page * pageSize, total);

//   const pageRows = React.useMemo(() => {
//     if (!hasData) return [];
//     if (!paginate) return data;
//     const start = (page - 1) * pageSize;
//     return data.slice(start, start + pageSize);
//   }, [data, page, pageSize, hasData, paginate]);

//   const goToPage = (p: number) => {
//     const next = Math.min(Math.max(1, p), totalPages);
//     setPage(next);
//     onPageChange?.(next);
//   };

//   const onPrev = () => goToPage(page - 1);
//   const onNext = () => goToPage(page + 1);

//   // -------- helper to build "1 2 3 … 8 9 10" style pages --------
//   const getPageItems = (
//     current: number,
//     totalP: number
//   ): (number | "dots")[] => {
//     const items: (number | "dots")[] = [];
//     if (totalP <= 7) {
//       for (let i = 1; i <= totalP; i += 1) items.push(i);
//       return items;
//     }

//     if (current <= 3) {
//       items.push(1, 2, 3, "dots", totalP - 1, totalP);
//     } else if (current >= totalP - 2) {
//       items.push(1, 2, "dots", totalP - 2, totalP - 1, totalP);
//     } else {
//       items.push(1, "dots", current - 1, current, current + 1, "dots", totalP);
//     }

//     return items;
//   };

//   const pageItems = getPageItems(page, totalPages);

//   const formatHeader = (header: React.ReactNode) => {
//     if (typeof header !== "string") return header; // JSX → return as-is

//     const words = header.split(" ");

//     return words
//       .map((w, idx) => {
//         const lower = w.toLowerCase();

//         if (lower === "sku") return "SKU";

//         if (
//           idx > 0 &&
//           words[idx - 1].toLowerCase() === "sku" &&
//           ["uk", "us", "canada"].includes(lower)
//         ) {
//           return w.toUpperCase();
//         }

//         return w.charAt(0).toUpperCase() + w.slice(1);
//       })
//       .join(" ");
//   };

//   return (
//     <div
//       className={clsx(
//         "relative w-full max-w-full border border-slate-200 bg-white shadow-sm",
//         "overflow-x-auto",                      // 👈 horizontal scroll ONLY inside this container
//         scrollY && "overflow-y-auto",          // 👈 vertical scroll inside container if enabled
//         className
//       )}
//       style={containerStyle}
//     >
//       <table
//         className={clsx(
//           // 👇 table can be wider than container; container scrolls it
//           "min-w-max border-collapse text-xs sm:text-sm text-slate-700",
//           tableClassName
//         )}
//       >
//         {/* HEADER */}
//         <thead
//           className={clsx(
//             "bg-[#5EA68E] text-yellow-200",
//             "text-xs sm:text-sm font-semibold",
//             stickyHeader && "sticky top-0 z-10"
//           )}
//         >
//           <tr>
//             {columns.map((col, i) => (
//               <th
//                 key={String(col.key) + i}
//                 onClick={col.onHeaderClick}
//                 className={clsx(
//                   "border border-[#e1e5ea] px-3 py-2.5 text-center align-middle",
//                    "whitespace-normal break-words",
//                   col.headerClassName,
//                   col.onHeaderClick && "cursor-pointer select-none"
//                 )}
//                 style={col.width ? { width: col.width } : undefined}
//               >
//                 {formatHeader(col.header)}
//               </th>
//             ))}
//           </tr>
//         </thead>

//         {/* BODY */}
//         <tbody>
//           {!hasData && (
//             <tr>
//               <td
//                 className="px-3 py-8 text-center text-xs sm:text-sm text-slate-400"
//                 colSpan={columns.length}
//               >
//                 {emptyMessage}
//               </td>
//             </tr>
//           )}

//           {hasData &&
//             pageRows.map((row, ri) => (
//               <tr
//   key={ri}
//   className={clsx(
//     rowClassName?.(row, (page - 1) * pageSize + ri),
//     "transition-colors",
//     !row.__isTotal && "hover:bg-emerald-50/80",
//     !row.__isTotal && "bg-white"
//   )}
// >
//                 {columns.map((col, ci) => {
//                   const value = (row as Record<string, React.ReactNode>)[
//                     String(col.key)
//                   ];
//                   return (
//                     <td
//                       key={String(col.key) + ci}
//                       className={clsx(
//                         "max-w-[260px] truncate border border-[#e1e5ea] px-3 py-2.5 align-middle text-center text-xs sm:text-sm",
//                         col.cellClassName
//                       )}
//                       title={
//                         showCellTitle ? String(value ?? "\u00A0") : undefined
//                       }
//                     >
//                       {col.render
//                         ? col.render(row, value, (page - 1) * pageSize + ri)
//                         : value ?? "\u00A0"}
//                     </td>
//                   );
//                 })}
//               </tr>
//             ))}
//         </tbody>
//       </table>

//       {/* PAGINATION */}
//       {paginate && totalPages > 1 && (
//         <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
//           <div className="flex items-center justify-between gap-4 text-xs sm:text-sm">
//             {/* Previous */}
//             <button
//               onClick={onPrev}
//               disabled={page <= 1}
//               className={clsx(
//                 "inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700 shadow-sm hover:bg-slate-100",
//                 "disabled:cursor-not-allowed disabled:opacity-50"
//               )}
//             >
//               <FaChevronLeft />
//             </button>

//             {/* Page numbers */}
//             <div className="flex items-center justify-center gap-1 sm:gap-1.5">
//               {pageItems.map((item, idx) =>
//                 item === "dots" ? (
//                   <span
//                     key={`dots-${idx}`}
//                     className="px-1 text-slate-400 select-none"
//                   >
//                     …
//                   </span>
//                 ) : (
//                   <button
//                     key={item}
//                     onClick={() => goToPage(item)}
//                     className={clsx(
//                       "h-7 w-7 sm:h-8 sm:w-8 rounded-full text-xs sm:text-sm",
//                       "flex items-center justify-center",
//                       "transition-colors",
//                       item === page
//                         ? "bg-slate-200 text-slate-900 font-semibold"
//                         : "text-slate-700 hover:bg-slate-100"
//                     )}
//                   >
//                     {item}
//                   </button>
//                 )
//               )}
//             </div>

//             {/* Next */}
//             <button
//               onClick={onNext}
//               disabled={page >= totalPages}
//               className={clsx(
//                 "inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700 shadow-sm hover:bg-slate-100",
//                 "disabled:cursor-not-allowed disabled:opacity-50"
//               )}
//             >
//               <FaChevronRight />
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


















"use client";

import * as React from "react";
import clsx from "clsx";
import Loader from "@/components/loader/Loader";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export type Row = Record<string, React.ReactNode>;

export type ColumnDef<T extends Row> = {
  key: keyof T | string;
  header: React.ReactNode;
  render?: (row: T, value: React.ReactNode, rowIndex: number) => React.ReactNode;
  width?: string; // optional fixed width (e.g. "140px")
  cellClassName?: string;
  headerClassName?: string;
  onHeaderClick?: () => void;
};

type DataTableProps<T extends Row> = {
  columns: ColumnDef<T>[];
  data: T[];

  className?: string;
  tableClassName?: string;
  maxHeight?: number | string;
  stickyHeader?: boolean;
  zebra?: boolean;
  emptyMessage?: string;
  showCellTitle?: boolean;

  pageSize?: number;
  initialPage?: number;
  paginate?: boolean;
  scrollY?: boolean;

  rowClassName?: (row: T, rowIndex: number) => string;
  onPageChange?: (page: number) => void;

  loading?: boolean;
  loaderHeight?: number | string;

  /**
   * ✅ New: header wrap control
   * This sets the default max-width for headers so they wrap naturally
   * instead of forcing horizontal scroll.
   */
  headerMaxWidth?: number; // default 140
};

export default function DataTable<T extends Row>({
  columns,
  data,
  className,
  tableClassName,
  maxHeight = "60vh",
  stickyHeader = true,
  zebra = true,
  emptyMessage = "No data found.",
  showCellTitle = false,
  pageSize = 10,
  initialPage = 1,
  paginate = true,
  scrollY = true,
  rowClassName,
  onPageChange,
  loading = false,
  loaderHeight = 260,
  headerMaxWidth = 140, // ✅ tune this (120–180 usually best)
}: DataTableProps<T>) {
  const containerStyle: React.CSSProperties = {
    maxHeight: scrollY
      ? typeof maxHeight === "number"
        ? `${maxHeight}px`
        : maxHeight
      : undefined,
  };

  const hasData = Array.isArray(data) && data.length > 0;

  const loaderStyleHeight =
    typeof loaderHeight === "number" ? `${loaderHeight}px` : loaderHeight;

  if (loading) {
    return (
      <div
        className={clsx(
          "flex items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm",
          className
        )}
        style={{ minHeight: loaderStyleHeight }}
      >
        <Loader
          src="/infinity-unscreen.gif"
          size={150}
          transparent
          roundedClass="rounded-full"
          backgroundClass="bg-transparent"
          respectReducedMotion
        />
      </div>
    );
  }

  // Pagination
  const [page, setPage] = React.useState<number>(Math.max(1, initialPage));

  React.useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((data?.length ?? 0) / pageSize));
    if (page > totalPages) setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, pageSize]);

  const total = data?.length ?? 0;
  const totalPages = paginate ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  const pageRows = React.useMemo(() => {
    if (!hasData) return [];
    if (!paginate) return data;
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize, hasData, paginate]);

  const goToPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    onPageChange?.(next);
  };

  const onPrev = () => goToPage(page - 1);
  const onNext = () => goToPage(page + 1);

  const getPageItems = (current: number, totalP: number): (number | "dots")[] => {
    const items: (number | "dots")[] = [];
    if (totalP <= 7) {
      for (let i = 1; i <= totalP; i += 1) items.push(i);
      return items;
    }
    if (current <= 3) items.push(1, 2, 3, "dots", totalP - 1, totalP);
    else if (current >= totalP - 2) items.push(1, 2, "dots", totalP - 2, totalP - 1, totalP);
    else items.push(1, "dots", current - 1, current, current + 1, "dots", totalP);
    return items;
  };

  const pageItems = getPageItems(page, totalPages);

  // keep your existing capitalization behavior (but NO "()" splitting)
  const formatHeader = (header: React.ReactNode) => {
    if (typeof header !== "string") return header;

    const words = header.split(" ");
    return words
      .map((w, idx) => {
        const lower = w.toLowerCase();
        if (lower === "sku") return "SKU";

        if (
          idx > 0 &&
          words[idx - 1].toLowerCase() === "sku" &&
          ["uk", "us", "canada"].includes(lower)
        ) {
          return w.toUpperCase();
        }

        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(" ");
  };

  // ✅ If a column has width, use it, else use headerMaxWidth
  const thStyle = (col: ColumnDef<T>): React.CSSProperties => {
    const w = col.width ? col.width : `${headerMaxWidth}px`;
    // With table-fixed, width is respected. maxWidth helps wrapping if widths are not strict.
    return { width: w, maxWidth: w };
  };

  return (
    <div
      className={clsx(
        "relative w-full max-w-full border border-slate-200 bg-white shadow-sm",
        // ✅ allow scroll ONLY when truly needed
        "overflow-x-auto",
        scrollY && "overflow-y-auto",
        className
      )}
      style={containerStyle}
    >
      <table
        className={clsx(
          // ✅ table-fixed makes widths and wrapping behave predictably
          "w-full table-fixed border-collapse text-xs  text-slate-700",
          tableClassName
        )}
      >
        <thead
          className={clsx(
            "bg-[#5EA68E] text-yellow-200",
            "text-xs font-semibold",
            stickyHeader && "sticky top-0 z-10"
          )}
        >
          <tr>
            {columns.map((col, i) => (
              <th
                key={String(col.key) + i}
                onClick={col.onHeaderClick}
                className={clsx(
                  // slightly tighter padding reduces scroll chances
                  "border border-[#e1e5ea] px-2 sm:px-3 py-2 text-center align-middle",
                  // ✅ wrapping behavior
                  "whitespace-normal break-words leading-tight",
                  col.headerClassName,
                  col.onHeaderClick && "cursor-pointer select-none"
                )}
                style={thStyle(col)}
              >
                {formatHeader(col.header)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {!hasData && (
            <tr>
              <td
                className="px-3 py-8 text-center text-xs  text-slate-400"
                colSpan={columns.length}
              >
                {emptyMessage}
              </td>
            </tr>
          )}

          {hasData &&
            pageRows.map((row, ri) => (
              <tr
                key={ri}
                className={clsx(
                  rowClassName?.(row, (page - 1) * pageSize + ri),
                  "transition-colors",
                  // @ts-expect-error: your rows may include __isTotal
                  !(row as any).__isTotal ,
                  zebra && ri % 2 === 1 && ""
                )}
              >
                {columns.map((col, ci) => {
                  const value = (row as Record<string, React.ReactNode>)[String(col.key)];

                  return (
                    <td
                      key={String(col.key) + ci}
                      className={clsx(
                        "border border-[#e1e5ea] px-2 sm:px-3 py-2 align-middle text-center text-xs ",
                        // ✅ default: don’t wrap numbers; wrap text only if you want per-column
                        // If you want wrapping in a specific column, pass: cellClassName="whitespace-normal break-words"
                        "whitespace-nowrap",
                        col.cellClassName
                      )}
                      title={showCellTitle ? String(value ?? "\u00A0") : undefined}
                    >
                      {col.render
                        ? col.render(row as any, value, (page - 1) * pageSize + ri)
                        : value ?? "\u00A0"}
                    </td>
                  );
                })}
              </tr>
            ))}
        </tbody>
      </table>

      {paginate && totalPages > 1 && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between gap-4 text-xs">
            <button
              onClick={onPrev}
              disabled={page <= 1}
              className={clsx(
                "inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700 shadow-sm hover:bg-slate-100",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              <FaChevronLeft />
            </button>

            <div className="flex items-center justify-center gap-1 sm:gap-1.5">
              {pageItems.map((item, idx) =>
                item === "dots" ? (
                  <span key={`dots-${idx}`} className="px-1 text-slate-400 select-none">
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => goToPage(item)}
                    className={clsx(
                      "h-7 w-7 sm:h-8 sm:w-8 rounded-full text-xs ",
                      "flex items-center justify-center",
                      "transition-colors",
                      item === page
                        ? "bg-slate-200 text-slate-900 font-semibold"
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    {item}
                  </button>
                )
              )}
            </div>

            <button
              onClick={onNext}
              disabled={page >= totalPages}
              className={clsx(
                "inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1.5 text-slate-700 shadow-sm hover:bg-slate-100",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
