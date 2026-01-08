// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import * as XLSX from "xlsx";
// import { jwtDecode } from "jwt-decode";
// import SkuMultiCountryUpload from "../ui/modal/SkuMultiCountryUpload";
// import Productinfoinpopup from "./Productinfoinpopup";
// import PageBreadcrumb from "../common/PageBreadCrumb";
// import DownloadIconButton from "../ui/button/DownloadIconButton";
// import { FaCaretLeft, FaCaretRight } from "react-icons/fa";
// import Tooltip from "./Tooltip";
// import { SkuExportPayload } from "@/lib/utils/exportTypes";
// import GroupedCollapsibleTable, {
//   ColGroup,
//   LeafCol,
// } from "../ui/table/GroupedCollapsibleTable";

// /* ---------- Types ---------- */

// type RangeType = "monthly" | "quarterly" | "yearly";

// type SKUtableProps = {
//   range: RangeType;
//   month?: string;
//   quarter?: string;
//   year: string | number;
//   countryName: string;
//   homeCurrency?: string;
//   onExportPayloadChange?: (payload: SkuExportPayload) => void;
//   hideDownloadButton?: boolean;
// };

// type TableRow = {
//   product_name?: string;
//   sku?: string;
//   quantity?: number;
//   asp?: number;
//   ASP?: number;
//   product_sales?: number;
//   net_sales?: number;
//   cost_of_unit_sold?: number;
//   amazon_fee?: number;
//   selling_fees?: number;
//   fba_fees?: number;
//   net_credits?: number;
//   net_taxes?: number;
//   profit?: number;
//   profit_percentage?: number;
//   unit_wise_profitability?: number;
//   platform_fee?: number;
//   rembursement_fee?: number;
//   advertising_total?: number;
//   shipment_charges?: number;
//   reimbursement_vs_sales?: number;
//   cm2_profit?: number;
//   cm2_margins?: number;
//   acos?: number;
//   rembursment_vs_cm2_margins?: number;
//   Profit?: number;
//   Net_Sales?: number;
//   profit_mix?: number;
//   sales_mix?: number;
//   total_quantity?: number;
//   gross_sales?: number;
//   refund_sales?: number;
//   tex_and_credits?: number;
//   promotional_rebates?: number;
//   promotional_rebates_percentage?: number;
//   misc_transaction?: number;
//   other_transaction_fees?: number;
//   units_sold?: number;             // will map from total_quantity (if units_sold not provided)
//   return_units?: number;           // map from return_units/Return/returns if present, else 0
//   net_units_sold?: number;         // units_sold - return_units
//   platformfeenew?: number;                 // Platform Fees
//   platform_fee_inventory_storage?: number;
//   other_transactions?: number;
// };

// type Totals = {
//   advertising_total: number;
//   visible_ads: number;          // "Visibility - Ads"
//   dealsvouchar_ads: number;     // "Visibility - Deals, Vouchers and Reviews"
//   other_transactions: number;   // "Other Transactions" (derived)
//   platform_fee: number;         // "Platform Fees"
//   inventory_storage_fees: number;
//   reimbursement_lost_inventory_amount: number;
//   reimbursement_lost_inventory_units?: number;
//   shipment_charges: number;
//   reimbursement_vs_sales: number;
//   cm2_profit: number;
//   cm2_margins: number;
//   acos: number;
//   rembursment_vs_cm2_margins: number;
//   profit: number;
//   net_sales: number;
// };

// type GroupId = "units" | "amazonFees" | "others" | "cm1";


// type JwtPayload = {
//   user_id?: string | number;
//   [k: string]: unknown;
// };

// /* ---------- Helpers ---------- */

// const getCurrencySymbol = (codeOrCountry: string) => {
//   switch ((codeOrCountry || "").toLowerCase()) {
//     case "uk":
//     case "gb":
//     case "gbp":
//       return "£";
//     case "india":
//     case "in":
//     case "inr":
//       return "₹";
//     case "us":
//     case "usa":
//     case "usd":
//       return "$";
//     case "europe":
//     case "eu":
//     case "eur":
//       return "€";
//     default:
//       return "¤";
//   }
// };

// const capitalizeFirstLetter = (str: string) =>
//   str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

// const convertToAbbreviatedMonth = (m?: string) =>
//   m ? capitalizeFirstLetter(m).slice(0, 3) : "";

// const isMissingName = (v: unknown) => {
//   if (v === undefined || v === null) return true;

//   if (typeof v === "number" && Number.isNaN(v)) return true;

//   const s = String(v).trim().toLowerCase();
//   return (
//     s === "" ||
//     s === "0" ||
//     s === "nan" ||
//     s === "none" ||
//     s === "null" ||
//     s === "undefined"
//   );
// };

// const toNumber = (v: any) => {
//   if (v === undefined || v === null || v === "") return 0;
//   if (typeof v === "number") return Number.isFinite(v) ? v : 0;

//   // handle "1,234.56" strings etc.
//   const n = Number(String(v).replace(/,/g, "").trim());
//   return Number.isFinite(n) ? n : 0;
// };

// /* ---------- Component ---------- */

// const SKUtable: React.FC<SKUtableProps> = ({
//   range,
//   month = "",
//   quarter = "",
//   year,
//   countryName,
//   homeCurrency,
//   onExportPayloadChange,
//   hideDownloadButton = false,
// }) => {
//   const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
//   const [showModal, setShowModal] = useState(false);
//   const [noDataFound, setNoDataFound] = useState(false);
//   const [showModal2, setShowModal2] = useState(false);

//   const [tableData, setTableData] = useState<TableRow[]>([]);
//   const [totals, setTotals] = useState<Totals>({
//     advertising_total: 0,
//     visible_ads: 0,
//     dealsvouchar_ads: 0,
//     other_transactions: 0,
//     platform_fee: 0,
//     inventory_storage_fees: 0,
//     reimbursement_lost_inventory_amount: 0,
//     reimbursement_lost_inventory_units: 0,

//     shipment_charges: 0,
//     reimbursement_vs_sales: 0,
//     cm2_profit: 0,
//     cm2_margins: 0,
//     acos: 0,
//     rembursment_vs_cm2_margins: 0,
//     profit: 0,
//     net_sales: 0,
//   });

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   // const [showamazonfee, setshowamazonfee] = useState(false);
//   // const [showprofit, setshowprofit] = useState(false);
//   const [userData, setUserData] = useState<{ brand_name?: string; company_name?: string } | null>(
//     null
//   );

//   const isGlobalPage = (countryName || "").toLowerCase() === "global";

//   // ✅ Persist homeCurrency so refresh doesn't flip to USD
//   const [persistedHomeCurrency, setPersistedHomeCurrency] = useState<string>(() => {
//     if (typeof window === "undefined") return "";
//     return (localStorage.getItem("homeCurrency") || "").toLowerCase();
//   });



//   const getDisplayProductNameFromRow = (row: TableRow): string => {
//     if (!isMissingName(row.product_name)) return String(row.product_name);

//     // ✅ fallback to SKU when product_name is missing/nan
//     if (!isMissingName(row.sku)) return String(row.sku);

//     return "-";
//   };


//   useEffect(() => {
//     if (!isGlobalPage) return;
//     const hc = (homeCurrency || "").toLowerCase();
//     if (hc) {
//       setPersistedHomeCurrency(hc);
//       localStorage.setItem("homeCurrency", hc);
//     }
//   }, [homeCurrency, isGlobalPage]);

//   const effectiveHomeCurrency = isGlobalPage
//     ? (homeCurrency || persistedHomeCurrency || "usd").toLowerCase()
//     : "";

//   const currencySymbol = isGlobalPage
//     ? getCurrencySymbol(effectiveHomeCurrency || "usd")
//     : getCurrencySymbol(countryName || "");

//   // find asp key (asp or ASP)
//   const aspKey = useMemo(() => {
//     const first = tableData[0] || {};
//     const k = Object.keys(first).find((key) => key.toLowerCase() === "asp");
//     return k as keyof TableRow | undefined;
//   }, [tableData]);


//   // ---- Columns config (Excel-like groups) ----
//   const LEFT_COLS: LeafCol<TableRow>[] = [
//     { key: "sno", label: "Sno.", align: "center" },
//     { key: "product_name", label: "Product Name", align: "left" },

//     // ✅ SKU column (rowSpan=2)
//     { key: "sku", label: "SKU", align: "left" },


//   ];

//   const GROUPS: ColGroup<TableRow>[] = [
//     {
//       id: "Net Units",
//       label: "Net Units Sold",
//       headerClassName: "bg-[#f8edcf] text-black",
//       collapsedCols: [{ key: "net_units_sold", label: "Net Units Sold", align: "center" }],
//       expandedCols: [
//         { key: "units_sold", label: "Units Sold", align: "center" },
//         { key: "return_units", label: "Return", align: "center" },
//         { key: "net_units_sold", label: "Net Units Sold", align: "center" },
//       ],
//     },
//     {
//       id: "amazonFees",
//       label: "Amazon Fees",
//       headerClassName: "bg-[#4a8773] text-[#f8edcf]",
//       collapsedCols: [{ key: "amazon_fee", label: "", align: "center" }],
//       expandedCols: [
//         { key: "selling_fees", label: "Selling Fees", align: "center" },
//         { key: "fba_fees", label: "FBA Fees", align: "center" },
//         { key: "amazon_fee", label: "Amazon Fees", align: "center" },
//       ],
//     },
//   ];

//   // const SINGLE_COLS: LeafCol<TableRow>[] = [
//   //   { key: "product_sales", label: "Gross Sales", align: "center" },
//   //   { key: "net_sales", label: "Net Sales", align: "center" },
//   //   { key: "cost_of_unit_sold", label: "COGS", align: "center" },
//   //   { key: "profit", label: "CM1 Profit", align: "center" },
//   //   { key: "quantity", label: "Quantity Sold", align: "center" },
//   //   { key: (aspKey ?? "asp") as string, label: "ASP", align: "center" },
//   // ];


//   const SINGLE_COLS: LeafCol<TableRow>[] = [
//     // ======================
//     // Sales
//     // ======================
//     { key: "product_sales", label: "Gross Sales", align: "center" },
//     { key: "refund_sales", label: "Sales - Refund", align: "center" },
//     { key: "net_sales", label: "Net Sales", align: "center" },

//     // ======================
//     // Units (mapped correctly)
//     // ======================
//     { key: "units_sold", label: "Units Sold", align: "center" },
//     { key: "return_units", label: "Return Units", align: "center" },
//     { key: "net_units_sold", label: "Net Units Sold", align: "center" },

//     // ======================
//     // Amazon Fees ✅ NEW
//     // ======================
//     { key: "selling_fees", label: "Selling Fees", align: "center" },
//     { key: "fba_fees", label: "FBA Fees", align: "center" },
//     { key: "amazon_fee", label: "Amazon Fees", align: "center" },

//     // ======================
//     // Pricing / Cost
//     // ======================
//     { key: (aspKey ?? "asp") as string, label: "ASP", align: "center" },
//     { key: "cost_of_unit_sold", label: "COGS", align: "center" },

//     // ======================
//     // Taxes / Credits
//     // ======================
//     { key: "tex_and_credits", label: "Tax & Credits", align: "center" },
//     { key: "net_taxes", label: "Net Taxes", align: "center" },
//     { key: "net_credits", label: "Net Credits", align: "center" },

//     // ======================
//     // Promotions ✅ NEW
//     // ======================
//     { key: "promotional_rebates", label: "Promotions", align: "center" },
//     { key: "promotional_rebates_percentage", label: "Promotions %", align: "center" },

//     // ======================
//     // Misc / Other
//     // ======================
//     { key: "misc_transaction", label: "Misc.", align: "center" },
//     { key: "other_transactions", label: "Other Transactions", align: "center" },

//     // ======================
//     // Platform / Storage Fees
//     // ======================
//     // { key: "platformfeenew", label: "Platform Fees", align: "center" },
//     { key: "platform_fee_inventory_storage", label: "Inventory Storage Fees", align: "center" },

//     // ======================
//     // CM1 Metrics
//     // ======================
//     { key: "profit", label: "CM1 Profit", align: "center" },
//     { key: "profit_percentage", label: "CM1 Profit %", align: "center" },
//     { key: "unit_wise_profitability", label: "CM1 Profit / Unit", align: "center" },
//   ];



//   const yearShort =
//     typeof year === "string" ? year.toString().slice(-2) : String(year).slice(-2);

//   const quarterMapping: Record<string, string> = {
//     Q1: "quarter1",
//     Q2: "quarter2",
//     Q3: "quarter3",
//     Q4: "quarter4",
//   };

//   // decode user id from JWT
//   const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
//   const userid = useMemo(() => {
//     if (!token) return "";
//     try {
//       const decoded = jwtDecode<JwtPayload>(token);
//       return decoded?.user_id ?? "";
//     } catch {
//       return "";
//     }
//   }, [token]);

//   // dummy table in case API has no data
//   const dummyTableData: TableRow[] = [
//     {
//       product_name: "Sample Product A",
//       quantity: 100,
//       asp: 12.5,
//       product_sales: 1250,
//       net_sales: 1250,
//       cost_of_unit_sold: 500,
//       amazon_fee: 100,
//       selling_fees: 60,
//       fba_fees: 40,
//       net_credits: 100,
//       net_taxes: 50,
//       profit: 700,
//       profit_percentage: 56,
//       unit_wise_profitability: 7,
//     },
//     {
//       product_name: "Sample Product B",
//       quantity: 80,
//       asp: 10,
//       product_sales: 800,
//       net_sales: 800,
//       cost_of_unit_sold: 300,
//       amazon_fee: 80,
//       selling_fees: 50,
//       fba_fees: 30,
//       net_credits: 70,
//       net_taxes: 40,
//       profit: 450,
//       profit_percentage: 56.25,
//       unit_wise_profitability: 5.625,
//     },
//     {
//       product_name: "Sample Product C",
//       quantity: 80,
//       asp: 8,
//       product_sales: 800,
//       net_sales: 400,
//       cost_of_unit_sold: 400,
//       amazon_fee: 50,
//       selling_fees: 80,
//       fba_fees: 30,
//       net_credits: 70,
//       net_taxes: 54,
//       profit: 310,
//       profit_percentage: 56.25,
//       unit_wise_profitability: 5.625,
//     },
//     {
//       product_name: "Total",
//       quantity: 260,
//       asp: 10,
//       product_sales: 2850,
//       net_sales: 2450,
//       cost_of_unit_sold: 1200,
//       amazon_fee: 230,
//       selling_fees: 190,
//       fba_fees: 100,
//       net_credits: 240,
//       net_taxes: 144,
//       profit: 1460,
//       profit_percentage: 59.6,
//       unit_wise_profitability: 5.62,
//     },
//   ];


//   const periodLabel =
//     range === "monthly"
//       ? `SKU-wise Profitability-${convertToAbbreviatedMonth(month)}'${yearShort}`
//       : range === "quarterly"
//         ? `SKU-wise Profitability-${quarter}'${yearShort}`
//         : `SKU-wise Profitability-Year'${yearShort}`;


//   const CustomModal: React.FC<React.PropsWithChildren<{ onClose: () => void }>> = ({
//     onClose,
//     children,
//   }) => {
//     return (
//       <div
//         onClick={onClose}
//         className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
//       >
//         <div
//           onClick={(e) => e.stopPropagation()}
//           className="relative flex h-[30vh] w-[30vw] flex-col items-center justify-between overflow-y-auto rounded-lg bg-white p-4"
//         >
//           <div className="flex flex-1 flex-col items-center justify-center">{children}</div>
//         </div>
//       </div>
//     );
//   };


//   // columns visible (controlled by toggles)
//   // const columnsToDisplay = useMemo(() => {
//   //   const cols: (keyof TableRow | string | false)[] = [
//   //     "product_name",
//   //     "quantity",
//   //     aspKey || "asp",
//   //     "product_sales",
//   //     "net_sales",
//   //     "cost_of_unit_sold",
//   //     "amazon_fee",
//   //     showamazonfee && "selling_fees",
//   //     showamazonfee && "fba_fees",
//   //     "net_credits",
//   //     "net_taxes",
//   //     "profit",
//   //     showprofit && "profit_percentage",
//   //     showprofit && "unit_wise_profitability",
//   //   ];
//   //   return cols.filter(Boolean) as (keyof TableRow | string)[];
//   // }, [aspKey, showamazonfee, showprofit]);

//   // const totalTableColumns = 1 + columnsToDisplay.length;
//   // const summaryLabelColSpan = totalTableColumns - 1;

//   /* --------- Fetch user data (brand/company names) --------- */
//   useEffect(() => {
//     const fetchUserData = async () => {
//       if (!token) {
//         setError("No token found. Please log in.");
//         return;
//       }
//       try {
//         const res = await fetch("http://127.0.0.1:5000/get_user_data", {
//           method: "GET",
//           headers: { Authorization: `Bearer ${token}` },
//           cache: "no-store",
//         });
//         if (!res.ok) {
//           const data = await res.json().catch(() => ({}));
//           setError(data?.error || "Something went wrong.");
//           return;
//         }
//         const data = (await res.json()) as { brand_name?: string; company_name?: string };
//         setUserData(data);
//       } catch {
//         setError("Error fetching user data");
//       }
//     };
//     fetchUserData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   /* --------- Fetch table data --------- */
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         let response: Response | null = null;

//         if (range === "monthly") {
//           const skuwiseFileName =
//             countryName.toLowerCase() === "global"
//               ? `skuwisemonthly_${userid}_${countryName}_${(month || "").toLowerCase()}${year}_table`
//               : `skuwisemonthly_${userid}_${countryName.toLowerCase()}_${(month || "").toLowerCase()}${year}`;

//           const url = new URL(`http://127.0.0.1:5000/skutableprofit/${skuwiseFileName}`);

//           url.searchParams.set("country", countryName);
//           url.searchParams.set("month", (month || "").toLowerCase());
//           url.searchParams.set("year", String(year));

//           // ✅ GLOBAL only (stable across refresh)
//           if (isGlobalPage) {
//             url.searchParams.set("homeCurrency", effectiveHomeCurrency);
//           }

//           response = await fetch(url.toString(), {
//             method: "GET",
//             headers: token ? { Authorization: `Bearer ${token}` } : {},
//             cache: "no-store",
//           });
//         } else if (range === "quarterly") {
//           const backendQuarter = quarterMapping[quarter] || "";

//           const url = new URL("http://127.0.0.1:5000/quarterlyskutable");
//           url.searchParams.set("quarter", backendQuarter);
//           url.searchParams.set("country", countryName);
//           url.searchParams.set("year", String(year));
//           url.searchParams.set("userid", String(userid));

//           // ✅ GLOBAL only (stable across refresh)
//           if (isGlobalPage) {
//             url.searchParams.set("homeCurrency", effectiveHomeCurrency);
//           }

//           response = await fetch(url.toString(), {
//             method: "GET",
//             headers: token ? { Authorization: `Bearer ${token}` } : {},
//             cache: "no-store",
//           });
//         } else if (range === "yearly") {
//           const url = new URL("http://127.0.0.1:5000/YearlySKU");
//           url.searchParams.set("country", countryName);
//           url.searchParams.set("year", String(year));

//           // ✅ GLOBAL only (stable across refresh)
//           if (isGlobalPage) {
//             url.searchParams.set("homeCurrency", effectiveHomeCurrency);
//           }

//           response = await fetch(url.toString(), {
//             method: "GET",
//             headers: token ? { Authorization: `Bearer ${token}` } : {},
//             cache: "no-store",
//           });
//         }

//         if (!response || !response.ok) {
//           console.warn("Fetch failed. Showing dummy data.");
//           setNoDataFound(true);
//           setTableData(dummyTableData);
//           return;
//         }

//         const data = (await response.json()) as TableRow[] | unknown;

//         if (Array.isArray(data) && data.length === 0) {
//           setNoDataFound(true);
//           setTableData(dummyTableData);
//           return;
//         }

//         if (Array.isArray(data)) {
//           const normalized = data.map((r) => {
//             const row: any = r || {};

//             // ---- product name fallback ----
//             const product_name =
//               !isMissingName(row.product_name)
//                 ? String(row.product_name)
//                 : !isMissingName(row.sku)
//                   ? String(row.sku)
//                   : "-";

//             const isTotalRow = String(product_name).trim().toLowerCase() === "total";

//             const netUnits = toNumber(
//               row.total_quantity
//             );

//             return {
//               ...row,

//               // Identity
//               product_name: isTotalRow ? "Total" : product_name,
//               sku: row.sku ?? "-",

//               // Units (correct)
//               units_sold: toNumber(row.quantity),
//               return_units: toNumber(row.return_quantity),
//               net_units_sold: netUnits,

//               // Pricing / Sales (correct from CSV)
//               asp: toNumber(row.asp),
//               product_sales: toNumber(row.gross_sales ?? row.product_sales),
//               refund_sales: toNumber(row.refund_sales),
//               net_sales: toNumber(row.net_sales),

//               // Costs / Fees
//               cost_of_unit_sold: toNumber(row.cost_of_unit_sold),
//               shipment_charges: toNumber(row.shipment_charges),
//               selling_fees: toNumber(row.selling_fees),
//               fba_fees: toNumber(row.fba_fees),
//               amazon_fee: toNumber(row.amazon_fee),

//               // Taxes / Credits
//               tex_and_credits: toNumber(row.tex_and_credits),
//               net_taxes: toNumber(row.net_taxes),
//               net_credits: toNumber(row.net_credits),

//               // Other
//               misc_transaction: toNumber(row.misc_transaction),
//               other_transaction_fees: toNumber(row.other_transaction_fees),
//               other_transactions: toNumber(row.platform_fee), // ✅ map from backend

//               // CM1
//               profit: toNumber(row.profit),
//               profit_percentage: toNumber(row.profit_percentage),
//               unit_wise_profitability: toNumber(row.unit_wise_profitability),

//               // Promotions
//               promotional_rebates: toNumber(row.promotional_rebates),
//               promotional_rebates_percentage: toNumber(row.promotional_rebates_percentage),
//             } as TableRow;
//           });

//           setTableData(normalized);
//           setNoDataFound(false);

//           const lastRow: any = normalized[normalized.length - 1] || {};


//           const platformFees = toNumber(lastRow.platformfeenew);
//           const inventoryStorageFees = toNumber(lastRow.platform_fee_inventory_storage);


//           const reimbursementAmount =
//             toNumber(lastRow.reimbursement_lost_inventory_amount) ||
//             toNumber(lastRow.rembursement_fee) || 0; // fallback if you’re using rembursement_fee

//           const reimbursementUnits =
//             toNumber(lastRow.reimbursement_lost_inventory_units) || 0;
//           const otherTransactions = toNumber(lastRow.platform_fee);

//           const lastRowProfit = Number(lastRow.Profit ?? lastRow.profit ?? 0) || 0;
//           const lastRowSales = Number(lastRow.Net_Sales ?? lastRow.net_sales ?? 0) || 0;
//           const cm2MarginsValue = toNumber(
//             lastRow.cm2_margins ??
//             lastRow.cm2_profit_percentage ??
//             lastRow.cm2_profit_percent ??
//             lastRow.cm2_profit_percentage_value
//           );

//           setTotals({
//             advertising_total: toNumber(lastRow.advertising_total),
//             visible_ads: toNumber(lastRow.visible_ads),
//             dealsvouchar_ads: toNumber(lastRow.dealsvouchar_ads),
//             other_transactions: otherTransactions,
//             inventory_storage_fees: inventoryStorageFees,
//             platform_fee: platformFees,
//             reimbursement_lost_inventory_amount: reimbursementAmount,
//             reimbursement_lost_inventory_units: reimbursementUnits,

//             shipment_charges: toNumber(lastRow.shipment_charges),
//             reimbursement_vs_sales: toNumber(lastRow.reimbursement_vs_sales),
//             cm2_profit: toNumber(lastRow.cm2_profit),
//             cm2_margins: cm2MarginsValue,
//             acos: toNumber(lastRow.acos),
//             rembursment_vs_cm2_margins: toNumber(lastRow.rembursment_vs_cm2_margins),

//             profit: toNumber(lastRow.Profit ?? lastRow.profit),
//             net_sales: toNumber(lastRow.Net_Sales ?? lastRow.net_sales),
//           });


//         }
//         else {
//           setNoDataFound(true);
//           setTableData(dummyTableData);
//         }
//       } catch (err) {
//         console.error("Error during fetch:", err);
//         setNoDataFound(true);
//         setTableData(dummyTableData);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (countryName) fetchData();
//     // ✅ IMPORTANT: include effectiveHomeCurrency so refresh/homeCurrency change triggers refetch
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [
//     countryName,
//     range,
//     month,
//     quarter,
//     year,
//     token,
//     userid,
//     isGlobalPage,
//     effectiveHomeCurrency,
//   ]);

//   useEffect(() => {
//     if (!tableData || tableData.length === 0) return;

//     onExportPayloadChange?.({
//       tableData,
//       totals,
//       currencySymbol,
//       brandName: userData?.brand_name,
//       companyName: userData?.company_name,
//       title: "Profit Breakup (SKU Level)",
//       periodLabel,
//       range,
//       countryName, // ✅ ADD THIS (from props)
//     });
//   }, [
//     tableData,
//     totals,
//     currencySymbol,
//     userData?.brand_name,
//     userData?.company_name,
//     periodLabel,
//     range,
//     countryName, // ✅ ADD in deps
//     onExportPayloadChange,
//   ]);

//   /* --------- UI Handlers --------- */
//   const handleProductClick = (product: string) => {
//     setSelectedProduct(product);
//     setShowModal(true);
//   };
//   // const handleAmazonFeeClick = () => setshowamazonfee((p) => !p);
//   // const handleprofitClick = () => setshowprofit((p) => !p);

//   /* --------- Top/Bottom helpers --------- */
//   function getTop5Profitable(data: TableRow[]) {
//     const rows = data.slice(0, -1);
//     const top5 = [...rows].sort((a, b) => (b.profit || 0) - (a.profit || 0)).slice(0, 5);

//     const totalProfit = top5.reduce((s, r) => s + (r.profit || 0), 0);
//     const totalProfitMix = top5.reduce((s, r) => s + (r.profit_mix || 0), 0);
//     const totalSalesMix = top5.reduce((s, r) => s + (r.sales_mix || 0), 0);
//     const totalUnitWise = top5.reduce((s, r) => s + (r.unit_wise_profitability || 0), 0);

//     const formatted = top5.map((item) => ({
//       product_name: getDisplayProductNameFromRow(item),
//       profit: (item.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//       profitMix: (item.profit_mix || 0).toFixed(2),
//       salesMix: (item.sales_mix || 0).toFixed(2),
//       unit_wise_profitability: (item.unit_wise_profitability || 0).toFixed(2),
//     }));

//     return {
//       rows: formatted,
//       totals: {
//         profit: totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//         profitMix: totalProfitMix.toFixed(2),
//         salesMix: totalSalesMix.toFixed(2),
//         unit_wise_profitability: totalUnitWise.toFixed(2),
//       },
//     };
//   }

//   function getBottom5Profitable(data: TableRow[]) {
//     const rows = data.slice(0, -1);
//     const bottom5 = [...rows].sort((a, b) => (a.profit || 0) - (b.profit || 0)).slice(0, 5);

//     const totalProfit = bottom5.reduce((s, r) => s + (r.profit || 0), 0);
//     const totalProfitMix = bottom5.reduce((s, r) => s + (r.profit_mix || 0), 0);
//     const totalSalesMix = bottom5.reduce((s, r) => s + (r.sales_mix || 0), 0);
//     const totalUnitWise = bottom5.reduce((s, r) => s + (r.unit_wise_profitability || 0), 0);

//     const formatted = bottom5.map((item) => ({
//       product_name: getDisplayProductNameFromRow(item),
//       profit: (item.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//       profitMix: (item.profit_mix || 0).toFixed(2),
//       salesMix: (item.sales_mix || 0).toFixed(2),
//       unit_wise_profitability: (item.unit_wise_profitability || 0).toFixed(2),
//     }));

//     return {
//       rows: formatted,
//       totals: {
//         profit: totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//         profitMix: totalProfitMix.toFixed(2),
//         salesMix: totalSalesMix.toFixed(2),
//         unit_wise_profitability: totalUnitWise.toFixed(2),
//       },
//     };
//   }

//   const topData = useMemo(() => getTop5Profitable(tableData), [tableData]);
//   const bottomData = useMemo(() => getBottom5Profitable(tableData), [tableData]);

//   /* --------- Formatting helpers --------- */
//   const formatValue = (value: unknown, key: string) => {
//     if (value === undefined || value === null || value === "") return "-";

//     const intKeys = new Set(["quantity", "units_sold", "return_units", "net_units_sold"]);

//     if (intKeys.has(key)) {
//       const n = Number(value);
//       return Number.isFinite(n) ? n : "-";
//     }

//     const n = typeof value === "number" ? value : Number(value);
//     if (!Number.isFinite(n)) return "-";

//     const formatted = n.toLocaleString(undefined, {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });


//     if (key === "profit_percentage") return `${formatted}%`;
//     return formatted;
//   };


//   const getTitle = () => `Profit Breakup (SKU Level)`;

//   const getExtraRows = () => {
//     const formattedCountry = isGlobalPage ? "GLOBAL" : (countryName || "").toUpperCase();
//     return [
//       [`${userData?.brand_name || "N/A"}`],
//       [`${userData?.company_name || "N/A"}`],
//       [getTitle()],
//       [`Currency:  ${currencySymbol}`],
//       [`Country: ${formattedCountry}`],
//       [`Platform: Amazon`],
//     ];
//   };

//   /* --------- Excel Download --------- */
//   const handleDownloadExcel = () => {
//     const wb = XLSX.utils.book_new();

//     const columnsToDisplay2 = [
//       "product_name",
//       "quantity",
//       "asp",
//       "product_sales",
//       "net_sales",
//       "cost_of_unit_sold",
//       "amazon_fee",
//       "selling_fees",
//       "fba_fees",
//       "net_credits",
//       "net_taxes",
//       "profit",
//       "profit_percentage",
//       "unit_wise_profitability",
//     ] as const;

//     const percentageSummaryLabels = [
//       "CM2 Margins",
//       "TACoS (Total Advertising Cost of Sale)",
//       "Reimbursement vs CM2 Margins",
//       "Reimbursement vs Sales",
//     ];

//     const tableDataForExcel = tableData.map((row) => {
//       const rowData: Record<string, string | number> = {};

//       columnsToDisplay2.forEach((column) => {
//         let value: any =
//           column === "product_sales"
//             ? (row.product_sales ?? (row as any).gross_sales ?? 0)
//             : column === "quantity"
//               ? (row.quantity ?? (row as any).total_quantity ?? 0)
//               : row[column];


//         // ✅ Product name fallback to SKU only if name missing
//         if (column === "product_name") {
//           value = getDisplayProductNameFromRow(row);
//         }

//         if (typeof value === "number") {
//           if (Math.abs(value) < 1e-10) value = 0;
//           if (column !== "product_name" && column !== "quantity") {
//             value = Number(value.toFixed(2));
//           }
//         }

//         if (column === "asp" && typeof value === "number") value = Number(value.toFixed(2));
//         if (column === "unit_wise_profitability" && typeof value === "number")
//           value = Number(value.toFixed(2));
//         if (column === "profit_percentage" && typeof value === "number") value = Number(value) / 100;

//         rowData[column] = typeof value === "number" && isNaN(value) ? "-" : value;
//       });

//       return rowData;
//     });

//     const summaryRows: Record<string, string | number>[] = [
//       { [columnsToDisplay2[0]]: "Cost of Advertisement (-)", [columnsToDisplay2[10]]: Math.abs(Number(totals.advertising_total)) },
//       ...((countryName === "us" || countryName === "global")
//         ? [{
//           [columnsToDisplay2[0]]: "Shipment Charges (-)",
//           [columnsToDisplay2[10]]: Math.abs(Number(totals.shipment_charges)),
//         }]
//         : []),
//       { [columnsToDisplay2[0]]: "Platform Fees (-)", [columnsToDisplay2[10]]: Math.abs(Number(totals.platform_fee)) },
//       { [columnsToDisplay2[0]]: "CM2 Profit/Loss", [columnsToDisplay2[10]]: Math.abs(Number(totals.cm2_profit)) },
//       { [columnsToDisplay2[0]]: "CM2 Margins", [columnsToDisplay2[10]]: Number(totals.cm2_margins) / 100 },
//       { [columnsToDisplay2[0]]: "TACoS (Total Advertising Cost of Sale)", [columnsToDisplay2[10]]: Number(totals.acos) / 100 },
//       { [columnsToDisplay2[0]]: "Net Reimbursement during the month", [columnsToDisplay2[10]]: Math.abs(Number(totals.rembursement_fee)) },
//       { [columnsToDisplay2[0]]: "Reimbursement vs CM2 Margins", [columnsToDisplay2[10]]: Number(totals.rembursment_vs_cm2_margins) / 100 },
//       { [columnsToDisplay2[0]]: "Reimbursement vs Sales", [columnsToDisplay2[10]]: Number(totals.reimbursement_vs_sales) / 100 },
//     ];

//     const headerRow = {
//       [columnsToDisplay2[0]]: "Product Name",
//       [columnsToDisplay2[1]]: "Quantity Sold",
//       [columnsToDisplay2[2]]: "ASP",
//       [columnsToDisplay2[3]]: "Gross Sales",
//       [columnsToDisplay2[4]]: "Net Sales",
//       [columnsToDisplay2[5]]: "Cost of Goods Sold",
//       [columnsToDisplay2[6]]: "Amazon Fees",
//       [columnsToDisplay2[7]]: "Selling Fees",
//       [columnsToDisplay2[8]]: "FBA fees",
//       [columnsToDisplay2[9]]: "Net Credits",
//       [columnsToDisplay2[10]]: "Net Taxes",
//       [columnsToDisplay2[11]]: "CM1 Profit",
//       [columnsToDisplay2[12]]: "CM1 Profit (%)",
//       [columnsToDisplay2[13]]: "CM1 Profit per Unit",
//     };

//     const signageRow = {
//       [columnsToDisplay2[2]]: "",
//       [columnsToDisplay2[3]]: "",
//       [columnsToDisplay2[4]]: "(+)",
//       [columnsToDisplay2[5]]: "(-)",
//       [columnsToDisplay2[6]]: "(-)",
//       [columnsToDisplay2[7]]: "(-)",
//       [columnsToDisplay2[8]]: "(-)",
//       [columnsToDisplay2[9]]: "(+)",
//       [columnsToDisplay2[10]]: "",
//       [columnsToDisplay2[11]]: "",
//       [columnsToDisplay2[12]]: "",
//       [columnsToDisplay2[13]]: "",
//     };

//     const fullData = [
//       ...getExtraRows().map((row) => ({ [columnsToDisplay2[0]]: row[0] })),
//       {},
//       headerRow,
//       signageRow,
//       ...tableDataForExcel,
//       ...summaryRows,
//     ];

//     const finalWs = XLSX.utils.json_to_sheet(fullData, { skipHeader: true });

//     if (finalWs["!ref"]) {
//       const rng = XLSX.utils.decode_range(finalWs["!ref"]);
//       for (let r = 6; r <= rng.e.r; r++) {
//         for (let c = 1; c < columnsToDisplay2.length; c++) {
//           const cellAddress = XLSX.utils.encode_cell({ r, c });
//           const colKey = columnsToDisplay2[c] as string;

//           if (finalWs[cellAddress] && typeof finalWs[cellAddress].v === "number") {
//             finalWs[cellAddress].t = "n";

//             const rowHeaderVal =
//               finalWs[XLSX.utils.encode_cell({ r, c: 0 })]?.v as string | undefined;
//             const isPct =
//               colKey === "profit_percentage" ||
//               (rowHeaderVal ? percentageSummaryLabels.includes(rowHeaderVal) : false);

//             if (isPct) finalWs[cellAddress].z = "#,##0.00%";
//             else if (colKey === "quantity") finalWs[cellAddress].z = "#,##0";
//             else finalWs[cellAddress].z = "#,##0.00";
//           }
//         }
//       }
//     }

//     XLSX.utils.book_append_sheet(wb, finalWs, "SKU Profitability");

//     const filename =
//       range === "monthly"
//         ? `SKU-wise Profitability-${convertToAbbreviatedMonth(month)}'${yearShort}.xlsx`
//         : range === "quarterly"
//           ? `SKU-wise Profitability-${quarter}'${yearShort}.xlsx`
//           : `SKU-wise Profitability-Year'${yearShort}.xlsx`;

//     XLSX.writeFile(wb, filename);
//   };

//   /* --------- Render --------- */

//   // if (loading) return <div>Loading...</div>;
//   // if (error) return <div className="text-red-600">Error: {error}</div>;

//   // return (
//   //   <>
//   //     <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-1 sm:p-2">
//   //       <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//   //         <div className="flex flex-wrap items-baseline gap-2 justify-center sm:justify-start">
//   //           <PageBreadcrumb pageTitle={getTitle()} variant="page" align="left" textSize="2xl" />
//   //           <span className="text-[#5EA68E] text-lg sm:text-2xl md:text-2xl font-bold">
//   //             ({currencySymbol})
//   //           </span>
//   //         </div>

//   //         <div className="flex justify-center sm:justify-end">
//   //           {!hideDownloadButton && <DownloadIconButton onClick={handleDownloadExcel} />}
//   //         </div>

//   //       </div>

//   //       <div className={`transition-opacity ${noDataFound ? "opacity-30" : "opacity-100"}`}>
//   //         {showModal2 && (
//   //           <CustomModal onClose={() => setShowModal2(false)}>
//   //             <SkuMultiCountryUpload
//   //               onClose={() => setShowModal2(false)}
//   //               onComplete={() => setShowModal2(false)}
//   //             />
//   //           </CustomModal>
//   //         )}

//   //         <div className="w-full overflow-x-auto rounded-xl border border-gray-300">
//   //           <div className="min-w-full">
//   //             {/* <table className="min-w-[800px] w-full table-auto border-collapse text-[#414042]">
//   //               <thead className="sticky top-0 z-10 font-bold text-[#f8edcf]">
//   //                 <tr className="bg-[#5EA68E]">
//   //                   <th className="w-[60px] whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     Sno.
//   //                   </th>
//   //                   <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                     Product Name
//   //                   </th>
//   //                   <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     Quantity Sold
//   //                   </th>
//   //                   <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     ASP
//   //                   </th>
//   //                   <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     Gross Sales
//   //                   </th>
//   //                   <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     Net Sales
//   //                   </th>
//   //                   <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     COGS
//   //                   </th>

//   //                   <th
//   //                     onClick={handleAmazonFeeClick}
//   //                     className="relative cursor-pointer select-none whitespace-nowrap border border-gray-300 bg-[#4a8773] px-6 py-2 text-center text-[clamp(12px,0.729vw,16px)]"
//   //                   >
//   //                     <span className="absolute left-2 top-1/2 caret-pulse">
//   //                       {showamazonfee ? <FaCaretRight /> : <FaCaretLeft />}
//   //                     </span>
//   //                     <span>Amazon Fees </span>
//   //                     <span className="absolute right-2 top-1/2 caret-pulse">
//   //                       {showamazonfee ? <FaCaretLeft /> : <FaCaretRight />}
//   //                     </span>
//   //                   </th>

//   //                   {showamazonfee && (
//   //                     <>
//   //                       <th className="whitespace-nowrap border border-gray-300 bg-[#4a8773] px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                         Selling Fees
//   //                       </th>
//   //                       <th className="whitespace-nowrap border border-gray-300 bg-[#4a8773] px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                         FBA fees
//   //                       </th>
//   //                     </>
//   //                   )}

//   //                   <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     <div className="flex items-center justify-center gap-1">
//   //                       Net Credits
//   //                       <Tooltip text="Net Credits Formula: Postage Credits + Gift Wrap Credits" />
//   //                     </div>
//   //                   </th>

//   //                   <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     <div className="flex items-center justify-center gap-1">
//   //                       Net Taxes
//   //                       <Tooltip text="Net Taxes Formula: Shipping Credits Tax + Giftwrap Credits Tax + Promotional Rebates tax - Marketplace Withheld Tax" />
//   //                     </div>
//   //                   </th>

//   //                   <th
//   //                     onClick={handleprofitClick}
//   //                     className="relative cursor-pointer select-none whitespace-nowrap border border-gray-300 bg-[#4a8773] px-6 py-2 text-center text-[clamp(12px,0.729vw,16px)]"
//   //                   >
//   //                     <span className="absolute left-2 top-1/2 caret-pulse">
//   //                       {showprofit ? <FaCaretRight /> : <FaCaretLeft />}
//   //                     </span>
//   //                     <span>CM1 Profit </span>
//   //                     <span className="absolute right-2 top-1/2 caret-pulse">
//   //                       {showprofit ? <FaCaretLeft /> : <FaCaretRight />}
//   //                     </span>
//   //                   </th>

//   //                   {showprofit && (
//   //                     <>
//   //                       <th className="whitespace-nowrap border border-gray-300 bg-[#4a8773] px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                         CM1 Profit (%)
//   //                       </th>
//   //                       <th className="whitespace-nowrap border border-gray-300 bg-[#4a8773] px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                         CM1 Profit per Unit
//   //                       </th>
//   //                     </>
//   //                   )}
//   //                 </tr>

//   //                 <tr className="font-bold text-center">
//   //                   <td className="border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)]" />
//   //                   <td className="border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)]" />
//   //                   <td className="border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)]" />
//   //                   <td className="border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)]" />
//   //                   <td className="border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)]" />
//   //                   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)] text-green-700">
//   //                     (+)
//   //                   </td>
//   //                   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)] text-[#ff5c5c]">
//   //                     (-)
//   //                   </td>
//   //                   <td
//   //                     onClick={handleAmazonFeeClick}
//   //                     className="whitespace-nowrap border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)] text-[#ff5c5c]"
//   //                   >
//   //                     (-)
//   //                   </td>
//   //                   {showamazonfee && (
//   //                     <>
//   //                       <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)] text-[#ff5c5c]">
//   //                         (-)
//   //                       </td>
//   //                       <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)] text-[#ff5c5c]">
//   //                         (-)
//   //                       </td>
//   //                     </>
//   //                   )}
//   //                   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)] text-green-700">
//   //                     (+)
//   //                   </td>
//   //                   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)]" />
//   //                   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)]" />
//   //                   {showprofit && (
//   //                     <>
//   //                       <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)]" />
//   //                       <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)]" />
//   //                     </>
//   //                   )}
//   //                 </tr>
//   //               </thead>

//   //               <tbody>
//   //                 {tableData.length > 0 ? (
//   //                   tableData.map((row, index) => {
//   //                     const isLastRow = index === tableData.length - 1;

//   //                     return (
//   //                       <tr
//   //                         key={index}
//   //                         className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${isLastRow ? "bg-gray-200 font-semibold" : ""
//   //                           }`}
//   //                       >
//   //                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                           {isLastRow ? "" : index + 1}
//   //                         </td>

//   //                         {columnsToDisplay.map((column, idx) => {
//   //                           const col = column as keyof TableRow;
//   //                           const isProductName = col === "product_name";

//   //                           let rawValue: any = (row as any)[col];

//   //                           if (col === "quantity") {
//   //                             const q = toNumber((row as any).quantity);
//   //                             const tq = toNumber((row as any).total_quantity);
//   //                             rawValue = q > 0 ? q : tq;
//   //                           }

//   //                           if (col === "product_sales") {
//   //                             rawValue = (row as any).product_sales ?? (row as any).gross_sales;
//   //                           }

//   //                           let cellContent: React.ReactNode = formatValue(rawValue, col as string);

//   //                           if (isProductName) {
//   //                             cellContent = getDisplayProductNameFromRow(row);
//   //                           }

//   //                           return (
//   //                             <td
//   //                               key={idx}
//   //                               className={`whitespace-nowrap border border-gray-300 px-2 py-2 text-[clamp(12px,0.729vw,16px)] ${isProductName ? "text-left" : "text-center"
//   //                                 }`}
//   //                             >
//   //                               {isProductName && !isLastRow ? (
//   //                                 <span
//   //                                   onClick={() => handleProductClick(String(cellContent || ""))}
//   //                                   className="inline-block max-w-[220px] cursor-pointer truncate align-middle text-[#60a68e] no-underline"
//   //                                   title={String(cellContent || "")}
//   //                                 >
//   //                                   {String(cellContent || "-")}
//   //                                   {isMissingName(row.product_name) && (
//   //                                     <span className="ml-2 inline-flex items-center">
//   //                                       <i
//   //                                         className="fa-solid fa-circle-info ml-1 cursor-pointer"
//   //                                         title="Product name is not available. You may need to upload SKU data file."
//   //                                         onClick={(e) => {
//   //                                           e.stopPropagation();
//   //                                           setShowModal2(true);
//   //                                         }}
//   //                                       />
//   //                                     </span>
//   //                                   )}
//   //                                 </span>
//   //                               ) : (
//   //                                 <span className="inline-block max-w-[220px] truncate">
//   //                                   {cellContent}
//   //                                 </span>
//   //                               )}
//   //                             </td>
//   //                           );
//   //                         })}
//   //                       </tr>
//   //                     );
//   //                   })
//   //                 ) : (
//   //                   <tr>
//   //                     <td
//   //                       className="border border-gray-300 px-2 py-3 text-center text-[clamp(12px,0.729vw,16px)]"
//   //                       colSpan={columnsToDisplay.length + 1}
//   //                     >
//   //                       No data available
//   //                     </td>
//   //                   </tr>
//   //                 )}

//   //                 <tr>
//   //                   <td colSpan={summaryLabelColSpan} className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                     Cost of Advertisement <strong>(-)</strong>
//   //                   </td>
//   //                   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     {formatValue(totals.advertising_total, "advertising_total")}
//   //                   </td>
//   //                 </tr>

//   //                 {(countryName === "us" || countryName === "global") && (
//   //                   <tr>
//   //                     <td colSpan={summaryLabelColSpan} className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                       Shipment Charges <strong>(-)</strong>
//   //                     </td>
//   //                     <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                       {formatValue(totals.shipment_charges, "shipment_charges")}
//   //                     </td>
//   //                   </tr>
//   //                 )}

//   //                 <tr>
//   //                   <td colSpan={summaryLabelColSpan} className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                     Platform Fees <strong>(-)</strong>
//   //                   </td>
//   //                   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     {formatValue(totals.platform_fee, "platform_fee")}
//   //                   </td>
//   //                 </tr>

//   //                 <tr>
//   //                   <td colSpan={summaryLabelColSpan} className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                     CM2 Profit/Loss
//   //                   </td>
//   //                   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     {formatValue(totals.cm2_profit, "cm2_profit")}
//   //                   </td>
//   //                 </tr>

//   //                 <tr>
//   //                   <td colSpan={summaryLabelColSpan} className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                     CM2 Margins
//   //                   </td>
//   //                   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     {formatValue(totals.cm2_margins, "cm2_margins")}%
//   //                   </td>
//   //                 </tr>

//   //                 <tr>
//   //                   <td colSpan={summaryLabelColSpan} className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                     TACoS (Total Advertising Cost of Sale)
//   //                   </td>
//   //                   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     {formatValue(totals.acos, "acos")}%
//   //                   </td>
//   //                 </tr>

//   //                 <tr>
//   //                   <td colSpan={summaryLabelColSpan} className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                     Net Reimbursement
//   //                   </td>
//   //                   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     {formatValue(totals.rembursement_fee, "rembursement_fee")}
//   //                   </td>
//   //                 </tr>

//   //                 <tr>
//   //                   <td colSpan={summaryLabelColSpan} className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                     Reimbursement vs CM2 Margins
//   //                   </td>
//   //                   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     {formatValue(totals.rembursment_vs_cm2_margins, "rembursment_vs_cm2_margins")}%
//   //                   </td>
//   //                 </tr>

//   //                 <tr>
//   //                   <td colSpan={summaryLabelColSpan} className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                     Reimbursement vs Sales
//   //                   </td>
//   //                   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                     {formatValue(totals.reimbursement_vs_sales, "reimbursement_vs_sales")}%
//   //                   </td>
//   //                 </tr>
//   //               </tbody>
//   //             </table> */}

//   //             <div className="min-w-full">
//   //               <GroupedCollapsibleTable<TableRow>
//   //                 rows={tableData}
//   //                 leftCols={LEFT_COLS}
//   //                 groups={GROUPS}
//   //                 singleCols={SINGLE_COLS}
//   //                 initialCollapsed={{
//   //                   units: true,
//   //                   amazonFees: true,
//   //                   others: false,
//   //                   cm1: true,
//   //                 }}
//   //                 showSignRowInBody
//   //                 getSignForCol={(colKey) => {
//   //                   const plus = new Set(["net_sales", "net_credits"]);
//   //                   const minus = new Set(["cost_of_unit_sold", "amazon_fee", "selling_fees", "fba_fees"]);
//   //                   if (plus.has(colKey)) return { text: "(+)", className: "text-green-700" };
//   //                   if (minus.has(colKey)) return { text: "(-)", className: "text-[#ff5c5c]" };
//   //                   return null;
//   //                 }}
//   //                 getRowClassName={(row, index) => {
//   //                   const isLastRow = index === tableData.length - 1;
//   //                   return `${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${isLastRow ? "bg-gray-200 font-semibold" : ""
//   //                     }`;
//   //                 }}
//   //                 getValue={(row, colKey, rowIndex) => {
//   //                   const isLastRow = rowIndex === tableData.length - 1;

//   //                   if (colKey === "sno") return isLastRow ? "" : rowIndex + 1;
//   //                   if (colKey === "sku") return (row as any).sku ?? "-";

//   //                   if (colKey === "units_sold") return formatValue((row as any).units_sold, "units_sold");
//   //                   if (colKey === "return_units") return formatValue((row as any).return_units, "return_units");
//   //                   if (colKey === "net_units_sold") return formatValue((row as any).net_units_sold, "net_units_sold");

//   //                   if (colKey === "product_name") {
//   //                     const name = getDisplayProductNameFromRow(row);
//   //                     return !isLastRow ? (
//   //                       <span
//   //                         onClick={() => handleProductClick(String(name || ""))}
//   //                         className="inline-block max-w-[220px] cursor-pointer truncate align-middle text-[#60a68e] no-underline"
//   //                         title={String(name || "")}
//   //                       >
//   //                         {String(name || "-")}
//   //                       </span>
//   //                     ) : (
//   //                       <span className="inline-block max-w-[220px] truncate">{String(name || "-")}</span>
//   //                     );
//   //                   }

//   //                   if (colKey === "quantity") {
//   //                     const q = toNumber((row as any).quantity);
//   //                     const tq = toNumber((row as any).total_quantity);
//   //                     return formatValue(q > 0 ? q : tq, "quantity");
//   //                   }

//   //                   if (colKey === "product_sales") {
//   //                     const v = (row as any).product_sales ?? (row as any).gross_sales;
//   //                     return formatValue(v, "product_sales");
//   //                   }

//   //                   return formatValue((row as any)[colKey], colKey);
//   //                 }}
//   //               />


//   //               {/* ✅ Summary rows (kept exactly like you had) */}
//   //               <table className="w-full table-auto border-collapse text-[#414042]">
//   //                 <tbody>
//   //                   {/* NOTE: colspan should match visible columns.
//   //         Since collapse state lives inside the table component, we keep summary visually aligned by spanning "all but last value col".
//   //         Easiest: use full-width rows with 2 cols layout below.
//   //     */}

//   //                   <tr>
//   //                     <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                       Cost of Advertisement <strong>(-)</strong>
//   //                     </td>
//   //                     <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                       {formatValue(totals.advertising_total, "advertising_total")}
//   //                     </td>
//   //                   </tr>

//   //                   {(countryName === "us" || countryName === "global") && (
//   //                     <tr>
//   //                       <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                         Shipment Charges <strong>(-)</strong>
//   //                       </td>
//   //                       <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                         {formatValue(totals.shipment_charges, "shipment_charges")}
//   //                       </td>
//   //                     </tr>
//   //                   )}

//   //                   <tr>
//   //                     <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                       Platform Fees <strong>(-)</strong>
//   //                     </td>
//   //                     <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                       {formatValue(totals.platform_fee, "platform_fee")}
//   //                     </td>
//   //                   </tr>

//   //                   <tr>
//   //                     <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                       CM2 Profit/Loss
//   //                     </td>
//   //                     <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                       {formatValue(totals.cm2_profit, "cm2_profit")}
//   //                     </td>
//   //                   </tr>

//   //                   <tr>
//   //                     <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                       CM2 Margins
//   //                     </td>
//   //                     <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                       {formatValue(totals.cm2_margins, "cm2_margins")}%
//   //                     </td>
//   //                   </tr>

//   //                   <tr>
//   //                     <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                       TACoS (Total Advertising Cost of Sale)
//   //                     </td>
//   //                     <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                       {formatValue(totals.acos, "acos")}%
//   //                     </td>
//   //                   </tr>

//   //                   <tr>
//   //                     <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                       Net Reimbursement
//   //                     </td>
//   //                     <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                       {formatValue(totals.rembursement_fee, "rembursement_fee")}
//   //                     </td>
//   //                   </tr>

//   //                   <tr>
//   //                     <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                       Reimbursement vs CM2 Margins
//   //                     </td>
//   //                     <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                       {formatValue(totals.rembursment_vs_cm2_margins, "rembursment_vs_cm2_margins")}%
//   //                     </td>
//   //                   </tr>

//   //                   <tr>
//   //                     <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                       Reimbursement vs Sales
//   //                     </td>
//   //                     <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                       {formatValue(totals.reimbursement_vs_sales, "reimbursement_vs_sales")}%
//   //                     </td>
//   //                   </tr>
//   //                 </tbody>
//   //               </table>
//   //             </div>


//   //           </div>
//   //         </div>
//   //       </div>
//   //     </div>

//   // {/* Top & Bottom tables */}
//   // <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-1 sm:p-2">
//   //   <div className="flex flex-col justify-between gap-7 md:gap-3 text-[#414042] md:flex-row min-w-0">
//   //     <div className="flex-1 min-w-0">
//   //       <div className="flex gap-2 text-lg sm:text-2xl md:text-2xl mb-2 md:mb-4 font-bold">
//   //         <PageBreadcrumb pageTitle="Most 5 Profitable Products" variant="page" align="left" textSize="2xl" />
//   //       </div>

//   //       <div className="overflow-x-auto rounded-xl border border-gray-300">
//   //         <table className="w-full table-auto border-collapse">
//   //           <thead>
//   //             <tr className="bg-green-500 font-bold text-[#f8edcf]">
//   //               <th className="w-[160px] whitespace-nowrap border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                 Product Name
//   //               </th>
//   //               <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 CM1 Profit ({currencySymbol})
//   //               </th>
//   //               <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 Profit Mix (%)
//   //               </th>
//   //               <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 Sales Mix (%)
//   //               </th>
//   //               <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 CM1 Profit per Unit ({currencySymbol})
//   //               </th>
//   //             </tr>
//   //           </thead>
//   //           <tbody>
//   //             {topData.rows.map((item, index) => (
//   //               <tr key={index} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
//   //                 <td className="w-[160px] whitespace-nowrap border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                   <span className="flex max-w-[220px] items-center truncate" title={item.product_name}>
//   //                     {item.product_name || "-"}
//   //                   </span>
//   //                 </td>
//   //                 <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                   {item.profit}
//   //                 </td>
//   //                 <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                   {item.profitMix}%
//   //                 </td>
//   //                 <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                   {item.salesMix}%
//   //                 </td>
//   //                 <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                   {item.unit_wise_profitability}
//   //                 </td>
//   //               </tr>
//   //             ))}

//   //             <tr className="bg-gray-200 font-semibold">
//   //               <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                 <strong>Total</strong>
//   //               </td>
//   //               <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 <strong>{topData.totals.profit}</strong>
//   //               </td>
//   //               <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 <strong>{topData.totals.profitMix}%</strong>
//   //               </td>
//   //               <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 <strong>{topData.totals.salesMix}%</strong>
//   //               </td>
//   //               <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 {/* <strong>{topData.totals.unit_wise_profitability}</strong> */}
//   //                 <strong></strong>
//   //               </td>
//   //             </tr>
//   //           </tbody>
//   //         </table>
//   //       </div>
//   //     </div>

//   //     <div className="flex-1 min-w-0">
//   //       <div className="flex gap-2 text-lg sm:text-2xl md:text-2xl mb-2 md:mb-4 font-bold">
//   //         <PageBreadcrumb pageTitle="Least 5 Profitable Products" variant="page" align="left" textSize="2xl" />
//   //       </div>

//   //       <div className="overflow-x-auto rounded-xl border border-gray-300">
//   //         <table className="w-full table-auto border-collapse">
//   //           <thead>
//   //             <tr className="bg-[#ff5c5c] font-bold text-[#f8edcf]">
//   //               <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                 Product Name
//   //               </th>
//   //               <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 CM1 Profit ({currencySymbol})
//   //               </th>
//   //               <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 Profit Mix (%)
//   //               </th>
//   //               <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 Sales Mix (%)
//   //               </th>
//   //               <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 CM1 Profit per Unit ({currencySymbol})
//   //               </th>
//   //             </tr>
//   //           </thead>
//   //           <tbody>
//   //             {bottomData.rows.map((item, index) => (
//   //               <tr key={index} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
//   //                 <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                   <span className="inline-flex max-w-[220px] items-center truncate" title={item.product_name}>
//   //                     {item.product_name || "-"}
//   //                   </span>
//   //                 </td>
//   //                 <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                   {item.profit}
//   //                 </td>
//   //                 <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                   {item.profitMix}%
//   //                 </td>
//   //                 <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                   {item.salesMix}%
//   //                 </td>
//   //                 <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                   {item.unit_wise_profitability}
//   //                 </td>
//   //               </tr>
//   //             ))}

//   //             <tr className="bg-gray-200 font-semibold">
//   //               <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//   //                 <strong>Total</strong>
//   //               </td>
//   //               <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 <strong>{bottomData.totals.profit}</strong>
//   //               </td>
//   //               <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 <strong>{bottomData.totals.profitMix}%</strong>
//   //               </td>
//   //               <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 <strong>{bottomData.totals.salesMix}%</strong>
//   //               </td>
//   //               <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//   //                 {/* <strong>{bottomData.totals.unit_wise_profitability}</strong> */}
//   //                 <strong></strong>
//   //               </td>
//   //             </tr>
//   //           </tbody>
//   //         </table>
//   //       </div>
//   //     </div>
//   //   </div>
//   // </div>

//   // {showModal && selectedProduct && (
//   //   <Productinfoinpopup
//   //     productname={selectedProduct}
//   //     countryName={countryName}
//   //     month={month}
//   //     year={year}
//   //     onClose={() => setShowModal(false)}
//   //   />
//   // )}
//   //   </>
//   // );

//   /* --------- Render --------- */

//   const content = React.useMemo(() => {
//     if (loading) return <div>Loading...</div>;
//     if (error) return <div className="text-red-600">Error: {error}</div>;

//     return (
//       <>
//         <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-1 sm:p-2">
//           <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//             <div className="flex flex-wrap items-baseline gap-2 justify-center sm:justify-start">
//               <PageBreadcrumb pageTitle={getTitle()} variant="page" align="left" textSize="2xl" />
//               <span className="text-[#5EA68E] text-lg sm:text-2xl md:text-2xl font-bold">
//                 ({currencySymbol})
//               </span>
//             </div>

//             <div className="flex justify-center sm:justify-end">
//               {!hideDownloadButton && <DownloadIconButton onClick={handleDownloadExcel} />}
//             </div>
//           </div>

//           <div className={`transition-opacity ${noDataFound ? "opacity-30" : "opacity-100"}`}>
//             {showModal2 && (
//               <CustomModal onClose={() => setShowModal2(false)}>
//                 <SkuMultiCountryUpload
//                   onClose={() => setShowModal2(false)}
//                   onComplete={() => setShowModal2(false)}
//                 />
//               </CustomModal>
//             )}

//             <div className="w-full overflow-x-auto rounded-xl border border-gray-300">
//               <div className="min-w-full">
//                 <div className="min-w-full">
//                   <GroupedCollapsibleTable<TableRow>
//                     rows={tableData}
//                     leftCols={LEFT_COLS}
//                     groups={[]}
//                     singleCols={SINGLE_COLS}
//                     // initialCollapsed={{
//                     //   units: true,
//                     //   amazonFees: true,
//                     //   others: false,
//                     //   cm1: true,
//                     // }}
//                     showSignRowInBody
//                     getSignForCol={(colKey) => {
//                       const plus = new Set(["net_sales", "net_credits"]);

//                       const minus = new Set([
//                         "cost_of_unit_sold",
//                         "selling_fees",
//                         "fba_fees",
//                         "amazon_fee",
//                         "promotional_rebates",
//                         "platformfeenew",
//                         "platform_fee_inventory_storage",
//                         "other_transactions",
//                       ]);

//                       if (plus.has(colKey)) return { text: "(+)", className: "text-green-700" };
//                       if (minus.has(colKey)) return { text: "(-)", className: "text-[#ff5c5c]" };
//                       return null;
//                     }}


//                     getRowClassName={(row, index) => {
//                       const isLastRow = index === tableData.length - 1;
//                       return `${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${isLastRow ? "bg-gray-200 font-semibold" : ""
//                         }`;
//                     }}
//                     getValue={(row, colKey, rowIndex) => {
//                       const isLastRow = rowIndex === tableData.length - 1;

//                       if (colKey === "sno") return isLastRow ? "" : rowIndex + 1;
//                       if (colKey === "sku") return (row as any).sku ?? "-";

//                       if (colKey === "product_name") {
//                         const name = getDisplayProductNameFromRow(row);
//                         return !isLastRow ? (
//                           <span
//                             onClick={() => handleProductClick(String(name || ""))}
//                             className="inline-block max-w-[220px] cursor-pointer truncate align-middle text-[#60a68e] no-underline"
//                             title={String(name || "")}
//                           >
//                             {String(name || "-")}
//                           </span>
//                         ) : (
//                           <span className="inline-block max-w-[220px] truncate">{String(name || "-")}</span>
//                         );
//                       }

//                       return formatValue((row as any)[colKey], colKey);
//                     }}

//                   />

//                   {/* Summary rows */}
//                   <table className="w-full table-auto border-collapse text-[#414042]">
//                     <tbody>
//                       {/* <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           Cost of Advertisement <strong>(-)</strong>
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {formatValue(totals.advertising_total, "advertising_total")}
//                         </td>
//                       </tr> */}

//                       <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           Cost of Advertisement <strong>(-)</strong>
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {/* {formatValue(Math.abs(totals.advertising_total), "advertising_total")} */}
//                           {formatValue(totals.advertising_total, "advertising_total")}
//                         </td>
//                       </tr>

//                       <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           Visibility - Ads <strong>(-)</strong>
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {/* {formatValue(Math.abs(totals.visible_ads), "visible_ads")} */}
//                           {formatValue(totals.visible_ads, "visible_ads")}
//                         </td>
//                       </tr>

//                       <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           Visibility - Deals, Vouchers and Reviews <strong>(-)</strong>
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {/* {formatValue(Math.abs(totals.dealsvouchar_ads), "dealsvouchar_ads")} */}
//                           {formatValue(totals.visible_ads, "visible_ads")}
//                         </td>
//                       </tr>

//                       <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           Other Transactions
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {formatValue(totals.other_transactions, "other_transactions")}
//                         </td>
//                       </tr>


//                       <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           Platform Fees <strong>(-)</strong>
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {/* {formatValue(Math.abs(totals.platform_fee), "platform_fee")} */}
//                           {formatValue(totals.platform_fee, "platform_fee")}
//                         </td>
//                       </tr>

//                       <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           Inventory Storage Fees <strong>(-)</strong>
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {/* {formatValue(Math.abs(totals.inventory_storage_fees), "inventory_storage_fees")} */}
//                           {formatValue(totals.inventory_storage_fees, "inventory_storage_fees")}
//                         </td>
//                       </tr>

//                       <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           Reimbursement for lost Inventory
//                           {totals.reimbursement_lost_inventory_units
//                             ? ` - ${totals.reimbursement_lost_inventory_units} Units `
//                             : " "}
//                           <strong>(+)</strong>
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {/* {formatValue(Math.abs(totals.reimbursement_lost_inventory_amount), "reimbursement_lost_inventory_amount")} */}
//                         </td>
//                       </tr>


//                       {(countryName === "us" || countryName === "global") && (
//                         <tr>
//                           <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                             Shipment Charges <strong>(-)</strong>
//                           </td>
//                           <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                             {formatValue(totals.shipment_charges, "shipment_charges")}
//                           </td>
//                         </tr>
//                       )}

//                       {/* <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           Platform Fees <strong>(-)</strong>
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {formatValue(totals.platform_fee, "platform_fee")}
//                         </td>
//                       </tr> */}

//                       <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           CM2 Profit/Loss
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {formatValue(totals.cm2_profit, "cm2_profit")}
//                         </td>
//                       </tr>

//                       <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           CM2 Margins
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {formatValue(totals.cm2_margins, "cm2_margins")}%
//                         </td>
//                       </tr>

//                       <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           TACoS (Total Advertising Cost of Sale)
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {formatValue(totals.acos, "acos")}%
//                         </td>
//                       </tr>

// <tr>
//   <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//     Net Reimbursement
//   </td>
//   <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//     {formatValue(Math.abs(totals.reimbursement_lost_inventory_amount), "reimbursement_lost_inventory_amount")}
//   </td>
// </tr>

//                       <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           Reimbursement vs CM2 Margins
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {formatValue(totals.rembursment_vs_cm2_margins, "rembursment_vs_cm2_margins")}%
//                         </td>
//                       </tr>

//                       <tr>
//                         <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           Reimbursement vs Sales
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {formatValue(totals.reimbursement_vs_sales, "reimbursement_vs_sales")}%
//                         </td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Top & Bottom tables */}
//         <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-1 sm:p-2">
//           <div className="flex flex-col justify-between gap-7 md:gap-3 text-[#414042] md:flex-row min-w-0">
//             <div className="flex-1 min-w-0">
//               <div className="flex gap-2 text-lg sm:text-2xl md:text-2xl mb-2 md:mb-4 font-bold">
//                 <PageBreadcrumb pageTitle="Most 5 Profitable Products" variant="page" align="left" textSize="2xl" />
//               </div>

//               <div className="overflow-x-auto rounded-xl border border-gray-300">
//                 <table className="w-full table-auto border-collapse">
//                   <thead>
//                     <tr className="bg-green-500 font-bold text-[#f8edcf]">
//                       <th className="w-[160px] whitespace-nowrap border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                         Product Name
//                       </th>
//                       <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         CM1 Profit ({currencySymbol})
//                       </th>
//                       <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         Profit Mix (%)
//                       </th>
//                       <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         Sales Mix (%)
//                       </th>
//                       <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         CM1 Profit per Unit ({currencySymbol})
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {topData.rows.map((item, index) => (
//                       <tr key={index} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
//                         <td className="w-[160px] whitespace-nowrap border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           <span className="flex max-w-[220px] items-center truncate" title={item.product_name}>
//                             {item.product_name || "-"}
//                           </span>
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {item.profit}
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {item.profitMix}%
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {item.salesMix}%
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {item.unit_wise_profitability}
//                         </td>
//                       </tr>
//                     ))}

//                     <tr className="bg-gray-200 font-semibold">
//                       <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                         <strong>Total</strong>
//                       </td>
//                       <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         <strong>{topData.totals.profit}</strong>
//                       </td>
//                       <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         <strong>{topData.totals.profitMix}%</strong>
//                       </td>
//                       <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         <strong>{topData.totals.salesMix}%</strong>
//                       </td>
//                       <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         {/* <strong>{topData.totals.unit_wise_profitability}</strong> */}
//                         <strong></strong>
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             <div className="flex-1 min-w-0">
//               <div className="flex gap-2 text-lg sm:text-2xl md:text-2xl mb-2 md:mb-4 font-bold">
//                 <PageBreadcrumb pageTitle="Least 5 Profitable Products" variant="page" align="left" textSize="2xl" />
//               </div>

//               <div className="overflow-x-auto rounded-xl border border-gray-300">
//                 <table className="w-full table-auto border-collapse">
//                   <thead>
//                     <tr className="bg-[#ff5c5c] font-bold text-[#f8edcf]">
//                       <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                         Product Name
//                       </th>
//                       <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         CM1 Profit ({currencySymbol})
//                       </th>
//                       <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         Profit Mix (%)
//                       </th>
//                       <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         Sales Mix (%)
//                       </th>
//                       <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         CM1 Profit per Unit ({currencySymbol})
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {bottomData.rows.map((item, index) => (
//                       <tr key={index} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                           <span className="inline-flex max-w-[220px] items-center truncate" title={item.product_name}>
//                             {item.product_name || "-"}
//                           </span>
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {item.profit}
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {item.profitMix}%
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {item.salesMix}%
//                         </td>
//                         <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                           {item.unit_wise_profitability}
//                         </td>
//                       </tr>
//                     ))}

//                     <tr className="bg-gray-200 font-semibold">
//                       <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
//                         <strong>Total</strong>
//                       </td>
//                       <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         <strong>{bottomData.totals.profit}</strong>
//                       </td>
//                       <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         <strong>{bottomData.totals.profitMix}%</strong>
//                       </td>
//                       <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         <strong>{bottomData.totals.salesMix}%</strong>
//                       </td>
//                       <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
//                         {/* <strong>{bottomData.totals.unit_wise_profitability}</strong> */}
//                         <strong></strong>
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         </div>

//         {showModal && selectedProduct && (
//           <Productinfoinpopup
//             productname={selectedProduct}
//             countryName={countryName}
//             month={month}
//             year={year}
//             onClose={() => setShowModal(false)}
//           />
//         )}
//       </>
//     );
//   }, [
//     loading,
//     error,
//     noDataFound,
//     showModal2,
//     showModal,
//     selectedProduct,
//     tableData,
//     totals,
//     currencySymbol,
//     hideDownloadButton,
//     countryName,
//     month,
//     year,
//   ]);

//   return content;


// };

// export default SKUtable;




































































































"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { jwtDecode } from "jwt-decode";

import SkuMultiCountryUpload from "../ui/modal/SkuMultiCountryUpload";
import Productinfoinpopup from "./Productinfoinpopup";
import PageBreadcrumb from "../common/PageBreadCrumb";
import DownloadIconButton from "../ui/button/DownloadIconButton";
import { SkuExportPayload } from "@/lib/utils/exportTypes";
import GroupedCollapsibleTable, { LeafCol } from "../ui/table/GroupedCollapsibleTable";

/* ---------- Types ---------- */

type RangeType = "monthly" | "quarterly" | "yearly";

type SKUtableProps = {
  range: RangeType;
  month?: string;
  quarter?: string;
  year: string | number;
  countryName: string;
  homeCurrency?: string;
  onExportPayloadChange?: (payload: SkuExportPayload) => void;
  hideDownloadButton?: boolean;
};

type TableRow = {
  product_name?: string;
  sku?: string;

  quantity?: number; // may exist from backend
  total_quantity?: number;

  asp?: number;
  ASP?: number;

  gross_sales?: number;
  product_sales?: number;
  refund_sales?: number;
  net_sales?: number;
  lost_total?: number;

  cost_of_unit_sold?: number;
  shipment_charges?: number;

  amazon_fee?: number;
  selling_fees?: number;
  fba_fees?: number;

  tex_and_credits?: number;
  net_taxes?: number;
  net_credits?: number;

  promotional_rebates?: number;
  promotional_rebates_percentage?: number;

  misc_transaction?: number;
  other_transaction_fees?: number;
  platform_fee?: number; // backend sometimes sends this
  other_transactions?: number; // derived mapping

  profit?: number;
  profit_percentage?: number;
  unit_wise_profitability?: number;

  // derived units fields
  units_sold?: number;
  return_units?: number;
  net_units_sold?: number;

  // totals-only fields (often on last row)
  platformfeenew?: number;
  platform_fee_inventory_storage?: number;

  advertising_total?: number;
  visible_ads?: number;
  dealsvouchar_ads?: number;

  reimbursement_lost_inventory_amount?: number;
  reimbursement_lost_inventory_units?: number;

  reimbursement_vs_sales?: number;

  cm2_profit?: number;
  cm2_margins?: number;
  acos?: number;
  rembursment_vs_cm2_margins?: number;

  Profit?: number;
  Net_Sales?: number;

  profit_mix?: number;
  sales_mix?: number;

  // backend might send this as well
  return_quantity?: number;
};

type Totals = {
  advertising_total: number;
  visible_ads: number;
  dealsvouchar_ads: number;
  other_transactions: number;
  platform_fee: number;
  inventory_storage_fees: number;
  reimbursement_lost_inventory_amount: number;
  reimbursement_lost_inventory_units?: number;
  shipment_charges: number;
  reimbursement_vs_sales: number;
  cm2_profit: number;
  cm2_margins: number;
  acos: number;
  rembursment_vs_cm2_margins: number;
  profit: number;
  net_sales: number;
  lost_total: number;

};

type JwtPayload = {
  user_id?: string | number;
  [k: string]: unknown;
};

/* ---------- Helpers ---------- */

const getCurrencySymbol = (codeOrCountry: string) => {
  switch ((codeOrCountry || "").toLowerCase()) {
    case "uk":
    case "gb":
    case "gbp":
      return "£";
    case "india":
    case "in":
    case "inr":
      return "₹";
    case "us":
    case "usa":
    case "usd":
      return "$";
    case "europe":
    case "eu":
    case "eur":
      return "€";
    default:
      return "¤";
  }
};

const capitalizeFirstLetter = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const convertToAbbreviatedMonth = (m?: string) =>
  m ? capitalizeFirstLetter(m).slice(0, 3) : "";

const isMissingName = (v: unknown) => {
  if (v === undefined || v === null) return true;
  if (typeof v === "number" && Number.isNaN(v)) return true;

  const s = String(v).trim().toLowerCase();
  return s === "" || s === "0" || s === "nan" || s === "none" || s === "null" || s === "undefined";
};

const toNumber = (v: any) => {
  if (v === undefined || v === null || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
};

function normalizeRows(data: any[]): TableRow[] {
  return data.map((row) => {
    const productName =
      !isMissingName(row.product_name)
        ? String(row.product_name)
        : !isMissingName(row.sku)
          ? String(row.sku)
          : "-";

    const isTotalRow = productName.trim().toLowerCase() === "total";

    return {
      ...row,

      product_name: isTotalRow ? "Total" : productName,
      sku: row.sku ?? "-",

      // Units
      units_sold: toNumber(row.quantity),
      return_units: toNumber(row.return_quantity),
      net_units_sold: toNumber(row.total_quantity),

      // Sales
      asp: toNumber(row.asp ?? row.ASP),
      product_sales: toNumber(row.gross_sales ?? row.product_sales),
      refund_sales: toNumber(row.refund_sales),
      net_sales: toNumber(row.net_sales),
      lost_total: toNumber(row.lost_total),

      // Costs / Fees
      cost_of_unit_sold: toNumber(row.cost_of_unit_sold),
      shipment_charges: toNumber(row.shipment_charges),
      selling_fees: toNumber(row.selling_fees),
      fba_fees: toNumber(row.fba_fees),
      amazon_fee: toNumber(row.amazon_fee),

      // Taxes / Credits
      tex_and_credits: toNumber(row.tex_and_credits),
      net_taxes: toNumber(row.net_taxes),
      net_credits: toNumber(row.net_credits),

      // Promotions
      promotional_rebates: toNumber(row.promotional_rebates),
      promotional_rebates_percentage: toNumber(row.promotional_rebates_percentage),

      // Other / Misc
      misc_transaction: toNumber(row.misc_transaction),
      other_transaction_fees: toNumber(row.other_transaction_fees),

      // ✅ TABLE column "Other Transactions" should show other_transaction_fees
      other_transactions: toNumber(row.other_transaction_fees),



      // CM1
      profit: toNumber(row.profit),
      profit_percentage: toNumber(row.profit_percentage),
      unit_wise_profitability: toNumber(row.unit_wise_profitability),
    } as TableRow;
  });
}

function computeTotalsFromLastRow(rows: TableRow[]): Totals {
  const lastRow: any = rows[rows.length - 1] || {};

  const platformFees = toNumber(lastRow.platformfeenew);
  const inventoryStorageFees = toNumber(lastRow.platform_fee_inventory_storage);

  const reimbursementAmount =
    toNumber(lastRow.reimbursement_lost_inventory_amount) ||
    toNumber(lastRow.rembursement_fee) ||
    0;

  const reimbursementUnits = toNumber(lastRow.reimbursement_lost_inventory_units) || 0;

  const cm2MarginsValue = toNumber(
    lastRow.cm2_margins ??
    lastRow.cm2_profit_percentage ??
    lastRow.cm2_profit_percent ??
    lastRow.cm2_profit_percentage_value
  );

  return {
    advertising_total: toNumber(lastRow.advertising_total),
    visible_ads: toNumber(lastRow.visible_ads),
    dealsvouchar_ads: toNumber(lastRow.dealsvouchar_ads),
    // ✅ SUMMARY "Other Transactions" should show platform_fee (total row)
    other_transactions: toNumber(lastRow.platform_fee),
    platform_fee: platformFees,
    inventory_storage_fees: inventoryStorageFees,
    reimbursement_lost_inventory_amount: reimbursementAmount,
    reimbursement_lost_inventory_units: reimbursementUnits,
    lost_total: toNumber(lastRow.lost_total),

    shipment_charges: toNumber(lastRow.shipment_charges),
    reimbursement_vs_sales: toNumber(lastRow.reimbursement_vs_sales),

    cm2_profit: toNumber(lastRow.cm2_profit),
    cm2_margins: cm2MarginsValue,
    acos: toNumber(lastRow.acos),
    rembursment_vs_cm2_margins: toNumber(lastRow.rembursment_vs_cm2_margins),

    profit: toNumber(lastRow.Profit ?? lastRow.profit),
    net_sales: toNumber(lastRow.Net_Sales ?? lastRow.net_sales),
  };
}

/* ---------- Component ---------- */

const SKUtable: React.FC<SKUtableProps> = ({
  range,
  month = "",
  quarter = "",
  year,
  countryName,
  homeCurrency,
  onExportPayloadChange,
  hideDownloadButton = false,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);

  const [noDataFound, setNoDataFound] = useState(false);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [totals, setTotals] = useState<Totals>({
    advertising_total: 0,
    visible_ads: 0,
    dealsvouchar_ads: 0,
    other_transactions: 0,
    platform_fee: 0,
    inventory_storage_fees: 0,
    reimbursement_lost_inventory_amount: 0,
    reimbursement_lost_inventory_units: 0,
    shipment_charges: 0,
    reimbursement_vs_sales: 0,
    cm2_profit: 0,
    cm2_margins: 0,
    acos: 0,
    rembursment_vs_cm2_margins: 0,
    profit: 0,
    net_sales: 0,
    lost_total: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ brand_name?: string; company_name?: string } | null>(null);

  const isGlobalPage = (countryName || "").toLowerCase() === "global";

  // Token (memo once)
  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("jwtToken");
  }, []);

  // Persist homeCurrency for global
  const [persistedHomeCurrency, setPersistedHomeCurrency] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return (localStorage.getItem("homeCurrency") || "").toLowerCase();
  });

  useEffect(() => {
    if (!isGlobalPage) return;
    const hc = (homeCurrency || "").toLowerCase();
    if (hc) {
      setPersistedHomeCurrency(hc);
      localStorage.setItem("homeCurrency", hc);
    }
  }, [homeCurrency, isGlobalPage]);

  const effectiveHomeCurrency = isGlobalPage
    ? (homeCurrency || persistedHomeCurrency || "usd").toLowerCase()
    : "";

  const currencySymbol = isGlobalPage
    ? getCurrencySymbol(effectiveHomeCurrency || "usd")
    : getCurrencySymbol(countryName || "");

  const userid = useMemo(() => {
    if (!token) return "";
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded?.user_id ?? "";
    } catch {
      return "";
    }
  }, [token]);

  const getDisplayProductNameFromRow = useCallback((row: TableRow): string => {
    if (!isMissingName(row.product_name)) return String(row.product_name);
    if (!isMissingName(row.sku)) return String(row.sku);
    return "-";
  }, []);

  // Find asp key (asp or ASP) based on first row
  const aspKey = useMemo(() => {
    const first = tableData[0] || {};
    const k = Object.keys(first).find((key) => key.toLowerCase() === "asp");
    return k as keyof TableRow | undefined;
  }, [tableData]);

  // Columns
  const LEFT_COLS: LeafCol<TableRow>[] = useMemo(
    () => [
      { key: "sno", label: "Sno.", align: "center" },
      { key: "product_name", label: "Product Name", align: "left" },
      { key: "sku", label: "SKU", align: "left" },
    ],
    []
  );

  const SINGLE_COLS: LeafCol<TableRow>[] = useMemo(
    () => [
      { key: "product_sales", label: "Gross Sales", align: "center" },
      { key: "refund_sales", label: "Sales - Refund", align: "center" },
      { key: "net_sales", label: "Net Sales", align: "center" },

      { key: "units_sold", label: "Units Sold", align: "center" },
      { key: "return_units", label: "Return Units", align: "center" },
      { key: "net_units_sold", label: "Net Units Sold", align: "center" },
      { key: "lost_total", label: "Lost Total", align: "center" },

      { key: "selling_fees", label: "Selling Fees", align: "center" },
      { key: "fba_fees", label: "FBA Fees", align: "center" },
      { key: "amazon_fee", label: "Amazon Fees", align: "center" },

      { key: (aspKey ?? "asp") as string, label: "ASP", align: "center" },
      { key: "cost_of_unit_sold", label: "COGS", align: "center" },

      { key: "tex_and_credits", label: "Tax & Credits", align: "center" },
      { key: "net_taxes", label: "Net Taxes", align: "center" },
      { key: "net_credits", label: "Net Credits", align: "center" },

      { key: "promotional_rebates", label: "Promotions", align: "center" },
      { key: "promotional_rebates_percentage", label: "Promotions %", align: "center" },

      { key: "misc_transaction", label: "Misc.", align: "center" },
      { key: "other_transactions", label: "Other ", align: "center" },

      // { key: "platform_fee_inventory_storage", label: "Inventory Storage Fees", align: "center" },

      { key: "profit", label: "CM1 Profit", align: "center" },
      { key: "profit_percentage", label: "CM1 Profit %", align: "center" },
      { key: "unit_wise_profitability", label: "CM1 Profit / Unit", align: "center" },
    ],
    [aspKey]
  );

  // Formatting
  const INT_KEYS = useMemo(() => new Set(["quantity", "units_sold", "return_units", "net_units_sold"]), []);

  const formatValue = useCallback(
    (value: unknown, key: string) => {
      if (value === undefined || value === null || value === "") return "-";

      const n = toNumber(value);
      if (!Number.isFinite(n)) return "-";

      if (INT_KEYS.has(key)) return n;

      const formatted = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (key === "profit_percentage") return `${formatted}%`;
      return formatted;
    },
    [INT_KEYS]
  );

  // Sign row (stable sets)
  const SIGN_PLUS = useMemo(() => new Set(["net_sales", "net_credits"]), []);
  const SIGN_MINUS = useMemo(
    () =>
      new Set([
        "cost_of_unit_sold",
        "selling_fees",
        "fba_fees",
        "amazon_fee",
        "promotional_rebates",
        "platformfeenew",
        "platform_fee_inventory_storage",
        "other_transactions",
        "lost_total",
      ]),
    []
  );

  const getSignForCol = useCallback(
    (colKey: string) => {
      if (SIGN_PLUS.has(colKey)) return { text: "(+)", className: "text-green-700" };
      if (SIGN_MINUS.has(colKey)) return { text: "(-)", className: "text-[#ff5c5c]" };
      return null;
    },
    [SIGN_PLUS, SIGN_MINUS]
  );

  // Period label
  const yearShort = typeof year === "string" ? year.toString().slice(-2) : String(year).slice(-2);

  const periodLabel =
    range === "monthly"
      ? `SKU-wise Profitability-${convertToAbbreviatedMonth(month)}'${yearShort}`
      : range === "quarterly"
        ? `SKU-wise Profitability-${quarter}'${yearShort}`
        : `SKU-wise Profitability-Year'${yearShort}`;

  // Dummy table data
  const dummyTableData: TableRow[] = useMemo(
    () => [
      {
        product_name: "Sample Product A",
        sku: "SKU-A",
        units_sold: 100,
        return_units: 0,
        net_units_sold: 100,
        asp: 12.5,
        product_sales: 1250,
        refund_sales: 0,
        net_sales: 1250,
        cost_of_unit_sold: 500,
        selling_fees: 60,
        fba_fees: 40,
        amazon_fee: 100,
        net_credits: 100,
        net_taxes: 50,
        profit: 700,
        profit_percentage: 56,
        unit_wise_profitability: 7,
      },
      {
        product_name: "Sample Product B",
        sku: "SKU-B",
        units_sold: 80,
        return_units: 0,
        net_units_sold: 80,
        asp: 10,
        product_sales: 800,
        refund_sales: 0,
        net_sales: 800,
        cost_of_unit_sold: 300,
        selling_fees: 50,
        fba_fees: 30,
        amazon_fee: 80,
        net_credits: 70,
        net_taxes: 40,
        profit: 450,
        profit_percentage: 56.25,
        unit_wise_profitability: 5.625,
      },
      {
        product_name: "Total",
        sku: "-",
        units_sold: 180,
        return_units: 0,
        net_units_sold: 180,
        asp: 11,
        product_sales: 2050,
        refund_sales: 0,
        net_sales: 2050,
        cost_of_unit_sold: 800,
        selling_fees: 110,
        fba_fees: 70,
        amazon_fee: 180,
        net_credits: 170,
        net_taxes: 90,
        profit: 1150,
        profit_percentage: 56.1,
        unit_wise_profitability: 6.39,
      },
    ],
    []
  );

  // Modal shell
  const CustomModal: React.FC<React.PropsWithChildren<{ onClose: () => void }>> = ({ onClose, children }) => {
    return (
      <div onClick={onClose} className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative flex h-[30vh] w-[30vw] flex-col items-center justify-between overflow-y-auto rounded-lg bg-white p-4"
        >
          <div className="flex flex-1 flex-col items-center justify-center">{children}</div>
        </div>
      </div>
    );
  };

  /* --------- Fetch user data --------- */
  useEffect(() => {
    if (!token) {
      setError("No token found. Please log in.");
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/get_user_data", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal: ac.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data?.error || "Something went wrong.");
          return;
        }

        const data = (await res.json()) as { brand_name?: string; company_name?: string };
        setUserData(data);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError("Error fetching user data");
      }
    })();

    return () => ac.abort();
  }, [token]);

  // Quarter mapping
  const quarterMapping: Record<string, string> = useMemo(
    () => ({ Q1: "quarter1", Q2: "quarter2", Q3: "quarter3", Q4: "quarter4" }),
    []
  );

  const buildSkuUrl = useCallback(() => {
    if (range === "monthly") {
      const skuwiseFileName =
        countryName.toLowerCase() === "global"
          ? `skuwisemonthly_${userid}_${countryName}_${(month || "").toLowerCase()}${year}_table`
          : `skuwisemonthly_${userid}_${countryName.toLowerCase()}_${(month || "").toLowerCase()}${year}`;

      const url = new URL(`http://127.0.0.1:5000/skutableprofit/${skuwiseFileName}`);
      url.searchParams.set("country", countryName);
      url.searchParams.set("month", (month || "").toLowerCase());
      url.searchParams.set("year", String(year));

      if (isGlobalPage) url.searchParams.set("homeCurrency", effectiveHomeCurrency);
      return url.toString();
    }

    if (range === "quarterly") {
      const backendQuarter = quarterMapping[quarter] || "";
      const url = new URL("http://127.0.0.1:5000/quarterlyskutable");
      url.searchParams.set("quarter", backendQuarter);
      url.searchParams.set("country", countryName);
      url.searchParams.set("year", String(year));
      url.searchParams.set("userid", String(userid));

      if (isGlobalPage) url.searchParams.set("homeCurrency", effectiveHomeCurrency);
      return url.toString();
    }

    // yearly
    const url = new URL("http://127.0.0.1:5000/YearlySKU");
    url.searchParams.set("country", countryName);
    url.searchParams.set("year", String(year));

    if (isGlobalPage) url.searchParams.set("homeCurrency", effectiveHomeCurrency);
    return url.toString();
  }, [
    range,
    countryName,
    userid,
    month,
    year,
    quarter,
    quarterMapping,
    isGlobalPage,
    effectiveHomeCurrency,
  ]);

  /* --------- Fetch table data (AbortController to prevent race) --------- */
  useEffect(() => {
    if (!countryName) return;

    const ac = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const url = buildSkuUrl();

        const res = await fetch(url, {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
          signal: ac.signal,
        });

        if (!res.ok) {
          setNoDataFound(true);
          setTableData(dummyTableData);
          return;
        }

        const data = (await res.json()) as unknown;

        if (!Array.isArray(data) || data.length === 0) {
          setNoDataFound(true);
          setTableData(dummyTableData);
          return;
        }

        const normalized = normalizeRows(data);
        setTableData(normalized);
        setTotals(computeTotalsFromLastRow(normalized));
        setNoDataFound(false);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setNoDataFound(true);
        setTableData(dummyTableData);
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [countryName, buildSkuUrl, token, dummyTableData]);

  /* --------- Export payload --------- */
  useEffect(() => {
    if (!tableData || tableData.length === 0) return;

    onExportPayloadChange?.({
      tableData,
      totals,
      currencySymbol,
      brandName: userData?.brand_name,
      companyName: userData?.company_name,
      title: "Profit Breakup (SKU Level)",
      periodLabel,
      range,
      countryName,
    });
  }, [
    tableData,
    totals,
    currencySymbol,
    userData?.brand_name,
    userData?.company_name,
    periodLabel,
    range,
    countryName,
    onExportPayloadChange,
  ]);

  /* --------- Top/Bottom helpers --------- */
  const getTop5Profitable = useCallback(
    (data: TableRow[]) => {
      const rows = data.slice(0, -1);
      const top5 = [...rows].sort((a, b) => (b.profit || 0) - (a.profit || 0)).slice(0, 5);

      const totalProfit = top5.reduce((s, r) => s + (r.profit || 0), 0);
      const totalProfitMix = top5.reduce((s, r) => s + (r.profit_mix || 0), 0);
      const totalSalesMix = top5.reduce((s, r) => s + (r.sales_mix || 0), 0);
      const totalUnitWise = top5.reduce((s, r) => s + (r.unit_wise_profitability || 0), 0);

      const formatted = top5.map((item) => ({
        product_name: getDisplayProductNameFromRow(item),
        profit: (item.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        profitMix: (item.profit_mix || 0).toFixed(2),
        salesMix: (item.sales_mix || 0).toFixed(2),
        unit_wise_profitability: (item.unit_wise_profitability || 0).toFixed(2),
      }));

      return {
        rows: formatted,
        totals: {
          profit: totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          profitMix: totalProfitMix.toFixed(2),
          salesMix: totalSalesMix.toFixed(2),
          unit_wise_profitability: totalUnitWise.toFixed(2),
        },
      };
    },
    [getDisplayProductNameFromRow]
  );

  const getBottom5Profitable = useCallback(
    (data: TableRow[]) => {
      const rows = data.slice(0, -1);
      const bottom5 = [...rows].sort((a, b) => (a.profit || 0) - (b.profit || 0)).slice(0, 5);

      const totalProfit = bottom5.reduce((s, r) => s + (r.profit || 0), 0);
      const totalProfitMix = bottom5.reduce((s, r) => s + (r.profit_mix || 0), 0);
      const totalSalesMix = bottom5.reduce((s, r) => s + (r.sales_mix || 0), 0);
      const totalUnitWise = bottom5.reduce((s, r) => s + (r.unit_wise_profitability || 0), 0);

      const formatted = bottom5.map((item) => ({
        product_name: getDisplayProductNameFromRow(item),
        profit: (item.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        profitMix: (item.profit_mix || 0).toFixed(2),
        salesMix: (item.sales_mix || 0).toFixed(2),
        unit_wise_profitability: (item.unit_wise_profitability || 0).toFixed(2),
      }));

      return {
        rows: formatted,
        totals: {
          profit: totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          profitMix: totalProfitMix.toFixed(2),
          salesMix: totalSalesMix.toFixed(2),
          unit_wise_profitability: totalUnitWise.toFixed(2),
        },
      };
    },
    [getDisplayProductNameFromRow]
  );

  const topData = useMemo(() => getTop5Profitable(tableData), [tableData, getTop5Profitable]);
  const bottomData = useMemo(() => getBottom5Profitable(tableData), [tableData, getBottom5Profitable]);

  /* --------- UI handlers --------- */
  const handleProductClick = useCallback((product: string) => {
    setSelectedProduct(product);
    setShowModal(true);
  }, []);

  const getTitle = useCallback(() => `Profit Breakup (SKU Level)`, []);

  const getExtraRows = useCallback(() => {
    const formattedCountry = isGlobalPage ? "GLOBAL" : (countryName || "").toUpperCase();
    return [
      [`${userData?.brand_name || "N/A"}`],
      [`${userData?.company_name || "N/A"}`],
      [getTitle()],
      [`Currency:  ${currencySymbol}`],
      [`Country: ${formattedCountry}`],
      [`Platform: Amazon`],
    ];
  }, [countryName, currencySymbol, getTitle, isGlobalPage, userData?.brand_name, userData?.company_name]);

  /* --------- Excel Download --------- */
  const handleDownloadExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    const columnsToDisplay2 = [
      "product_name",
      "quantity",
      "asp",
      "product_sales",
      "net_sales",
      "cost_of_unit_sold",
      "amazon_fee",
      "selling_fees",
      "fba_fees",
      "net_credits",
      "net_taxes",
      "profit",
      "profit_percentage",
      "unit_wise_profitability",
    ] as const;

    const percentageSummaryLabels = [
      "CM2 Margins",
      "TACoS (Total Advertising Cost of Sale)",
      "Reimbursement vs CM2 Margins",
      "Reimbursement vs Sales",
    ];

    const tableDataForExcel = tableData.map((row) => {
      const rowData: Record<string, string | number> = {};

      columnsToDisplay2.forEach((column) => {
        let value: any =
          column === "product_sales"
            ? (row.product_sales ?? (row as any).gross_sales ?? 0)
            : column === "quantity"
              ? (row.quantity ?? (row as any).total_quantity ?? 0)
              : (row as any)[column];

        if (column === "product_name") value = getDisplayProductNameFromRow(row);

        if (typeof value === "number") {
          if (Math.abs(value) < 1e-10) value = 0;
          if (column !== "product_name" && column !== "quantity") value = Number(value.toFixed(2));
        }

        if (column === "asp" && typeof value === "number") value = Number(value.toFixed(2));
        if (column === "unit_wise_profitability" && typeof value === "number") value = Number(value.toFixed(2));
        if (column === "profit_percentage" && typeof value === "number") value = Number(value) / 100;

        rowData[column] = typeof value === "number" && isNaN(value) ? "-" : value;
      });

      return rowData;
    });

    const summaryRows: Record<string, string | number>[] = [
      { [columnsToDisplay2[0]]: "Cost of Advertisement (-)", [columnsToDisplay2[10]]: Math.abs(Number(totals.advertising_total)) },

      { [columnsToDisplay2[0]]: "Visibility - Ads (-)", [columnsToDisplay2[10]]: Math.abs(Number(totals.visible_ads)) },
      { [columnsToDisplay2[0]]: "Visibility - Deals, Vouchers and Reviews (-)", [columnsToDisplay2[10]]: Math.abs(Number(totals.dealsvouchar_ads)) },

      ...(countryName === "us" || countryName === "global"
        ? [
          {
            [columnsToDisplay2[0]]: "Shipment Charges (-)",
            [columnsToDisplay2[10]]: Math.abs(Number(totals.shipment_charges)),
          },
        ]
        : []),

      { [columnsToDisplay2[0]]: "Other Transactions (-)", [columnsToDisplay2[10]]: Math.abs(Number(totals.other_transactions)) },
      { [columnsToDisplay2[0]]: "Platform Fees (-)", [columnsToDisplay2[10]]: Math.abs(Number(totals.platform_fee)) },
      { [columnsToDisplay2[0]]: "Inventory Storage Fees (-)", [columnsToDisplay2[10]]: Math.abs(Number(totals.inventory_storage_fees)) },

      { [columnsToDisplay2[0]]: "CM2 Profit/Loss", [columnsToDisplay2[10]]: Number(totals.cm2_profit) },
      { [columnsToDisplay2[0]]: "CM2 Margins", [columnsToDisplay2[10]]: Number(totals.cm2_margins) / 100 },
      { [columnsToDisplay2[0]]: "TACoS (Total Advertising Cost of Sale)", [columnsToDisplay2[10]]: Number(totals.acos) / 100 },

      { [columnsToDisplay2[0]]: "Net Reimbursement during the month", [columnsToDisplay2[10]]: Math.abs(Number(totals.reimbursement_lost_inventory_amount)) },
      { [columnsToDisplay2[0]]: "Reimbursement vs CM2 Margins", [columnsToDisplay2[10]]: Number(totals.rembursment_vs_cm2_margins) / 100 },
      { [columnsToDisplay2[0]]: "Reimbursement vs Sales", [columnsToDisplay2[10]]: Number(totals.reimbursement_vs_sales) / 100 },
    ];

    const headerRow = {
      [columnsToDisplay2[0]]: "Product Name",
      [columnsToDisplay2[1]]: "Quantity Sold",
      [columnsToDisplay2[2]]: "ASP",
      [columnsToDisplay2[3]]: "Gross Sales",
      [columnsToDisplay2[4]]: "Net Sales",
      [columnsToDisplay2[5]]: "Cost of Goods Sold",
      [columnsToDisplay2[6]]: "Amazon Fees",
      [columnsToDisplay2[7]]: "Selling Fees",
      [columnsToDisplay2[8]]: "FBA fees",
      [columnsToDisplay2[9]]: "Net Credits",
      [columnsToDisplay2[10]]: "Net Taxes",
      [columnsToDisplay2[11]]: "CM1 Profit",
      [columnsToDisplay2[12]]: "CM1 Profit (%)",
      [columnsToDisplay2[13]]: "CM1 Profit per Unit",
    };

    const signageRow = {
      [columnsToDisplay2[2]]: "",
      [columnsToDisplay2[3]]: "",
      [columnsToDisplay2[4]]: "(+)",
      [columnsToDisplay2[5]]: "(-)",
      [columnsToDisplay2[6]]: "(-)",
      [columnsToDisplay2[7]]: "(-)",
      [columnsToDisplay2[8]]: "(-)",
      [columnsToDisplay2[9]]: "(+)",
      [columnsToDisplay2[10]]: "",
      [columnsToDisplay2[11]]: "",
      [columnsToDisplay2[12]]: "",
      [columnsToDisplay2[13]]: "",
    };

    const fullData = [
      ...getExtraRows().map((row) => ({ [columnsToDisplay2[0]]: row[0] })),
      {},
      headerRow,
      signageRow,
      ...tableDataForExcel,
      ...summaryRows,
    ];

    const finalWs = XLSX.utils.json_to_sheet(fullData, { skipHeader: true });

    if (finalWs["!ref"]) {
      const rng = XLSX.utils.decode_range(finalWs["!ref"]);
      for (let r = 6; r <= rng.e.r; r++) {
        for (let c = 1; c < columnsToDisplay2.length; c++) {
          const cellAddress = XLSX.utils.encode_cell({ r, c });
          const colKey = columnsToDisplay2[c] as string;

          if (finalWs[cellAddress] && typeof finalWs[cellAddress].v === "number") {
            finalWs[cellAddress].t = "n";

            const rowHeaderVal = finalWs[XLSX.utils.encode_cell({ r, c: 0 })]?.v as string | undefined;
            const isPct =
              colKey === "profit_percentage" ||
              (rowHeaderVal ? percentageSummaryLabels.includes(rowHeaderVal) : false);

            if (isPct) finalWs[cellAddress].z = "#,##0.00%";
            else if (colKey === "quantity") finalWs[cellAddress].z = "#,##0";
            else finalWs[cellAddress].z = "#,##0.00";
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, finalWs, "SKU Profitability");

    const filename =
      range === "monthly"
        ? `SKU-wise Profitability-${convertToAbbreviatedMonth(month)}'${yearShort}.xlsx`
        : range === "quarterly"
          ? `SKU-wise Profitability-${quarter}'${yearShort}.xlsx`
          : `SKU-wise Profitability-Year'${yearShort}.xlsx`;

    XLSX.writeFile(wb, filename);
  }, [
    tableData,
    totals,
    getExtraRows,
    range,
    month,
    yearShort,
    quarter,
    countryName,
    getDisplayProductNameFromRow,
  ]);

  /* --------- Render guards --------- */
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-1 sm:p-2">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-baseline gap-2 justify-center sm:justify-start">
            <PageBreadcrumb pageTitle={getTitle()} variant="page" align="left" textSize="2xl" />
            <span className="text-[#5EA68E] text-lg sm:text-2xl md:text-2xl font-bold">({currencySymbol})</span>
          </div>

          <div className="flex justify-center sm:justify-end">
            {!hideDownloadButton && <DownloadIconButton onClick={handleDownloadExcel} />}
          </div>
        </div>

        <div className={`transition-opacity ${noDataFound ? "opacity-30" : "opacity-100"}`}>
          {showModal2 && (
            <CustomModal onClose={() => setShowModal2(false)}>
              <SkuMultiCountryUpload onClose={() => setShowModal2(false)} onComplete={() => setShowModal2(false)} />
            </CustomModal>
          )}

          <div className="w-full overflow-x-auto rounded-xl border border-gray-300">
            <div className="min-w-full">
              <GroupedCollapsibleTable<TableRow>
                rows={tableData}
                leftCols={LEFT_COLS}
                groups={[]}
                singleCols={SINGLE_COLS}
                showSignRowInBody
                getSignForCol={getSignForCol}
                getRowClassName={(_, index) => {
                  const isLastRow = index === tableData.length - 1;
                  return `${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${isLastRow ? "bg-gray-200 font-semibold" : ""}`;
                }}
                getValue={(row, colKey, rowIndex) => {
                  const isLastRow = rowIndex === tableData.length - 1;

                  if (colKey === "sno") return isLastRow ? "" : rowIndex + 1;
                  if (colKey === "sku") return (row as any).sku ?? "-";

                  if (colKey === "product_name") {
                    const name = getDisplayProductNameFromRow(row);
                    return !isLastRow ? (
                      <span
                        onClick={() => handleProductClick(String(name || ""))}
                        className="inline-block max-w-[220px] cursor-pointer truncate align-middle text-[#60a68e] no-underline"
                        title={String(name || "")}
                      >
                        {String(name || "-")}
                      </span>
                    ) : (
                      <span className="inline-block max-w-[220px] truncate">{String(name || "-")}</span>
                    );
                  }

                  return formatValue((row as any)[colKey], colKey);
                }}
              />

              {/* Summary rows */}
              <table className="w-full table-auto border-collapse text-[#414042]">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                      Cost of Advertisement <strong>(-)</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      {formatValue(totals.advertising_total, "advertising_total")}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                      Visibility - Ads <strong>(-)</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      {formatValue(totals.visible_ads, "visible_ads")}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                      Visibility - Deals, Vouchers and Reviews <strong>(-)</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      {formatValue(totals.dealsvouchar_ads, "dealsvouchar_ads")}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                      Other Transactions
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      {formatValue(totals.other_transactions, "other_transactions")}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                      Platform Fees <strong>(-)</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      {formatValue(totals.platform_fee, "platform_fee")}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                      Inventory Storage Fees <strong>(-)</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      {formatValue(totals.inventory_storage_fees, "inventory_storage_fees")}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                      Reimbursement for lost Inventory
                      {totals.reimbursement_lost_inventory_units ? ` - ${totals.reimbursement_lost_inventory_units} Units ` : " "}
                      <strong>(+)</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      {formatValue(totals.lost_total, "lost_total")}
                    </td>
                  </tr>

                  {(countryName === "us" || countryName === "global") && (
                    <tr>
                      <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                        Shipment Charges <strong>(-)</strong>
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                        {formatValue(totals.shipment_charges, "shipment_charges")}
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">CM2 Profit/Loss</td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      {formatValue(totals.cm2_profit, "cm2_profit")}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">CM2 Margins</td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      {formatValue(totals.cm2_margins, "cm2_margins")}%
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                      Net Reimbursement
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      {formatValue(Math.abs(totals.reimbursement_lost_inventory_amount), "reimbursement_lost_inventory_amount")}
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">TACoS (Total Advertising Cost of Sale)</td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      {formatValue(totals.acos, "acos")}%
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">Reimbursement vs CM2 Margins</td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      {formatValue(totals.rembursment_vs_cm2_margins, "rembursment_vs_cm2_margins")}%
                    </td>
                  </tr>

                  <tr>
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">Reimbursement vs Sales</td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      {formatValue(totals.reimbursement_vs_sales, "reimbursement_vs_sales")}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Top & Bottom tables */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-1 sm:p-2">
        <div className="flex flex-col justify-between gap-7 md:gap-3 text-[#414042] md:flex-row min-w-0">
          {/* Top 5 */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 text-lg sm:text-2xl md:text-2xl mb-2 md:mb-4 font-bold">
              <PageBreadcrumb pageTitle="Most 5 Profitable Products" variant="page" align="left" textSize="2xl" />
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-300">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-green-500 font-bold text-[#f8edcf]">
                    <th className="w-[160px] whitespace-nowrap border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                      Product Name
                    </th>
                    <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      CM1 Profit ({currencySymbol})
                    </th>
                    <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      Profit Mix (%)
                    </th>
                    <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      Sales Mix (%)
                    </th>
                    <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      CM1 Profit per Unit ({currencySymbol})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topData.rows.map((item, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="w-[160px] whitespace-nowrap border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                        <span className="flex max-w-[220px] items-center truncate" title={item.product_name}>
                          {item.product_name || "-"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                        {item.profit}
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                        {item.profitMix}%
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                        {item.salesMix}%
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                        {item.unit_wise_profitability}
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-gray-200 font-semibold">
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                      <strong>Total</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      <strong>{topData.totals.profit}</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      <strong>{topData.totals.profitMix}%</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      <strong>{topData.totals.salesMix}%</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      <strong></strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom 5 */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 text-lg sm:text-2xl md:text-2xl mb-2 md:mb-4 font-bold">
              <PageBreadcrumb pageTitle="Least 5 Profitable Products" variant="page" align="left" textSize="2xl" />
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-300">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-[#B75A5A] font-bold text-[#f8edcf]">
                    <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                      Product Name
                    </th>
                    <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      CM1 Profit ({currencySymbol})
                    </th>
                    <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      Profit Mix (%)
                    </th>
                    <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      Sales Mix (%)
                    </th>
                    <th className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      CM1 Profit per Unit ({currencySymbol})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bottomData.rows.map((item, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                        <span className="inline-flex max-w-[220px] items-center truncate" title={item.product_name}>
                          {item.product_name || "-"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                        {item.profit}
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                        {item.profitMix}%
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                        {item.salesMix}%
                      </td>
                      <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                        {item.unit_wise_profitability}
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-gray-200 font-semibold">
                    <td className="border border-gray-300 px-2 py-2 text-left text-[clamp(12px,0.729vw,16px)]">
                      <strong>Total</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      <strong>{bottomData.totals.profit}</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      <strong>{bottomData.totals.profitMix}%</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      <strong>{bottomData.totals.salesMix}%</strong>
                    </td>
                    <td className="whitespace-nowrap border border-gray-300 px-2 py-2 text-center text-[clamp(12px,0.729vw,16px)]">
                      <strong></strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedProduct && (
        <Productinfoinpopup
          productname={selectedProduct}
          countryName={countryName}
          month={month}
          year={year}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default SKUtable;
