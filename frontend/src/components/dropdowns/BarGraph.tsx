// // "use client";

// // import React, { useEffect, useMemo, useState } from "react";
// // import { Bar } from "react-chartjs-2";
// // import {
// //   Chart as ChartJS,
// //   CategoryScale,
// //   LinearScale,
// //   BarElement,
// //   Title as ChartTitle,
// //   Tooltip,
// //   Legend,
// //   PointElement,
// //   ChartData,
// //   ChartOptions,
// //   TooltipItem,
// // } from "chart.js";
// // import * as XLSX from "xlsx";
// // import { useRouter } from "next/navigation";
// // import PageBreadcrumb from "../common/PageBreadCrumb";
// // import Loader from "@/components/loader/Loader";
// // import DownloadIconButton from "../ui/button/DownloadIconButton";

// // ChartJS.register(
// //   CategoryScale,
// //   LinearScale,
// //   BarElement,
// //   PointElement,
// //   ChartTitle,
// //   Tooltip,
// //   Legend
// // );

// // type BargraphProps = {
// //   range: "monthly" | "quarterly" | "yearly";
// //   selectedMonth: string;
// //   selectedYear: number | string;
// //   countryName: string;
// //   onNoDataChange?: (noData: boolean) => void;
// // };

// // type UploadRow = {
// //   country: string;
// //   month: string;
// //   year: string | number;
// //   total_sales: number;
// //   total_amazon_fee: number;
// //   total_cous: number;
// //   advertising_total: number;
// //   otherwplatform: number;
// //   taxncredit?: number;
// //   cm2_profit: number;
// //   total_profit: number;
// // };

// // const getCurrencySymbol = (country: string) => {
// //   switch (country.toLowerCase()) {
// //     case "uk":
// //       return "£";
// //     case "india":
// //       return "₹";
// //     case "us":
// //       return "$";
// //     case "europe":
// //     case "eu":
// //       return "€";
// //     case "global":
// //       return "$";
// //     default:
// //       return "¤";
// //   }
// // };

// // const Bargraph: React.FC<BargraphProps> = ({
// //   range,
// //   selectedMonth,
// //   selectedYear,
// //   countryName,
// //   onNoDataChange,
// // }) => {
// //   const router = useRouter();
// //   const currencySymbol = getCurrencySymbol(countryName || "");

// //   const [data, setData] = useState<UploadRow[]>([]);
// //   const [loading, setLoading] = useState<boolean>(false);
// //   const [selectedGraphs, setSelectedGraphs] = useState({
// //     sales: true,
// //     profit: true,
// //     profit2: true,
// //     AmazonExpense: true,
// //     total_cous: true,
// //     sellingFees: true,
// //     advertisingCosts: true,
// //     Other: true,
// //     taxncredit: true,
// //   });

// //   const capitalizeFirstLetter = (str: string) =>
// //     str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
// //   const convertToAbbreviatedMonth = (m?: string) =>
// //     m ? capitalizeFirstLetter(m).slice(0, 3) : "";

// //   const token =
// //     typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
// //   const [userData, setUserData] = useState<{
// //     company_name?: string;
// //     brand_name?: string;
// //   } | null>(null);

// //   useEffect(() => {
// //     const fetchData = async () => {
// //       setLoading(true);
// //       try {
// //         const response = await fetch(`http://127.0.0.1:5000/upload_history`, {
// //           method: "GET",
// //           headers: token ? { Authorization: `Bearer ${token}` } : {},
// //         });
// //         const result = (await response.json()) as { uploads?: UploadRow[] };
// //         if (result.uploads) {
// //           const filtered = result.uploads.filter(
// //             (item) => item.country.toLowerCase() === countryName.toLowerCase()
// //           );
// //           setData(filtered);
// //         }
// //       } catch (error) {
// //         console.error("Failed to fetch upload history:", error);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchData();
// //   }, [countryName, token]);

// //   useEffect(() => {
// //     const fetchUser = async () => {
// //       if (!token) return;
// //       try {
// //         const response = await fetch("http://127.0.0.1:5000/get_user_data", {
// //           method: "GET",
// //           headers: { Authorization: `Bearer ${token}` },
// //         });
// //         if (!response.ok) return;
// //         const j = (await response.json()) as {
// //           company_name?: string;
// //           brand_name?: string;
// //         };
// //         setUserData(j);
// //       } catch {
// //         // ignore
// //       }
// //     };
// //     fetchUser();
// //   }, [token]);

// //   const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const { name, checked } = e.target;
// //     const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;
// //     const newSelectedCount = checked ? selectedCount + 1 : selectedCount - 1;

// //     if (!checked && newSelectedCount < 2) return;

// //     setSelectedGraphs((prev) => ({ ...prev, [name]: checked }));
// //   };

// //   const formattedMonthYear = useMemo(
// //     () =>
// //       `${convertToAbbreviatedMonth(selectedMonth)}'${String(selectedYear).slice(
// //         -2
// //       )}`,
// //     [selectedMonth, selectedYear]
// //   );

// //   const getExtraRows = () => {
// //     const formattedCountry =
// //       countryName?.toLowerCase() === "global"
// //         ? "GLOBAL"
// //         : countryName?.toUpperCase();
// //     return [
// //       [`${userData?.brand_name || "N/A"}`],
// //       [`${userData?.company_name || "N/A"}`],
// //       [`Profit Breakup (SKU Level) - ${formattedMonthYear}`],
// //       [`Currency:  ${currencySymbol}`],
// //       [`Country: ${formattedCountry}`],
// //       [`Platform: Amazon`],
// //     ];
// //   };

// //   const metricMapping: Record<
// //     | "Sales"
// //     | "COGS"
// //     | "Amazon Fees"
// //     | "Taxes & Credits"
// //     | "CM1 Profit"
// //     | "Advertising Cost"
// //     | "Other"
// //     | "CM2 Profit",
// //     keyof UploadRow
// //   > = {
// //     Sales: "total_sales",
// //     COGS: "total_cous",
// //     "Amazon Fees": "total_amazon_fee",
// //     "Taxes & Credits": "taxncredit",
// //     "CM1 Profit": "total_profit",
// //     "Advertising Cost": "advertising_total",
// //     Other: "otherwplatform",
// //     "CM2 Profit": "cm2_profit",
// //   };

// //   const colorMapping: Record<
// //     | "Sales"
// //     | "COGS"
// //     | "Amazon Fees"
// //     | "Taxes & Credits"
// //     | "CM1 Profit"
// //     | "Advertising Cost"
// //     | "Other"
// //     | "CM2 Profit",
// //     string
// //   > = {
// //     Sales: "#2CA9E0",
// //     COGS: "#AB64B5",
// //     "Amazon Fees": "#ff5c5c",
// //     "Advertising Cost": "#F47A00",
// //     Other: "#00627D",
// //     "Taxes & Credits": "#FFBE26",
// //     "CM1 Profit": "#87AD12",
// //     "CM2 Profit": "#5EA49B",
// //   };

// //   const preferredOrder = [
// //     "Sales",
// //     "COGS",
// //     "Amazon Fees",
// //     "Taxes & Credits",
// //     "CM1 Profit",
// //     "Advertising Cost",
// //     "Other",
// //     "CM2 Profit",
// //   ] as const;

// //   const {
// //     chartData,
// //     chartOptions,
// //     exportToExcel,
// //     allValuesZero,
// //   }: {
// //     chartData: ChartData<"bar">;
// //     chartOptions: ChartOptions<"bar">;
// //     exportToExcel: () => void;
// //     allValuesZero: boolean;
// //   } = useMemo(() => {
// //     if (!data || data.length === 0) {
// //       const emptyData: ChartData<"bar"> = { labels: [], datasets: [] };
// //       const emptyOptions: ChartOptions<"bar"> = {};
// //       const noop = () => {};
// //       return {
// //         chartData: emptyData,
// //         chartOptions: emptyOptions,
// //         exportToExcel: noop,
// //         allValuesZero: true,
// //       };
// //     }

// //     const selectedMonthYearKey = `${selectedMonth} ${selectedYear}`.toLowerCase();
// //     const monthData = data.find(
// //       (upload) =>
// //         `${upload.month} ${upload.year}`.toLowerCase() === selectedMonthYearKey
// //     );

// //     const metricsToShow = (
// //       Object.entries(selectedGraphs)
// //         .filter(([, isChecked]) => isChecked)
// //         .map(([key]) => {
// //           switch (key) {
// //             case "sales":
// //               return "Sales";
// //             case "total_cous":
// //               return "COGS";
// //             case "AmazonExpense":
// //               return "Amazon Fees";
// //             case "taxncredit":
// //               return "Taxes & Credits";
// //             case "profit2":
// //               return "CM1 Profit";
// //             case "advertisingCosts":
// //               return "Advertising Cost";
// //             case "Other":
// //               return "Other";
// //             case "profit":
// //               return "CM2 Profit";
// //             default:
// //               return null;
// //           }
// //         })
// //         .filter(Boolean) as typeof preferredOrder[number][]
// //     ).sort((a, b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b));

// //     const labels = metricsToShow as string[];

// //     const viewportWidth =
// //       typeof window !== "undefined" ? window.innerWidth : 1200;
// //     const barWidthInPixels = viewportWidth * 0.05;

// //     let values = metricsToShow.map((label) => {
// //       const field = metricMapping[label];
// //       const v = monthData ? Math.abs(Number(monthData?.[field] ?? 0)) : 0;
// //       return v;
// //     });

// //     const zero = values.every((v) => v === 0);

// //     if (zero)
// //       values = metricsToShow.map(() => Math.floor(Math.random() * 1000 + 100));

// //     const chartData: ChartData<"bar"> = {
// //       labels,
// //       datasets: [
// //         {
// //           label: formattedMonthYear,
// //           data: values,
// //           maxBarThickness: barWidthInPixels,
// //           backgroundColor: metricsToShow.map((l) => colorMapping[l]),
// //           borderWidth: 0,
// //         },
// //       ],
// //     };

// //     const options: ChartOptions<"bar"> = {
// //       responsive: true,
// //       maintainAspectRatio: false,
// //       plugins: {
// //         legend: { display: false },
// //         tooltip: {
// //           intersect: false,
// //           callbacks: {
// //             title: (tooltipItems: TooltipItem<"bar">[]) =>
// //               tooltipItems[0]?.label ?? "",
// //             label: (context: TooltipItem<"bar">) => {
// //               const value = Number(context.raw ?? 0);
// //               const salesIndex = (labels as string[]).findIndex(
// //                 (l) => l === "Sales"
// //               );
// //               const salesValue =
// //                 salesIndex >= 0
// //                   ? Number(
// //                       (chartData.datasets[0].data as number[])[salesIndex] ?? 1
// //                     )
// //                   : 1;
// //               const percentage = (value / (salesValue || 1)) * 100;
// //               const metricLabel = String(context.label ?? "");
// //               const formattedValue = Number(value.toFixed(2)).toLocaleString();
// //               return `${metricLabel}: ${currencySymbol}${formattedValue} (${percentage.toFixed(
// //                 1
// //               )}%)`;
// //             },
// //           },
// //         },
// //       },
// //       scales: {
// //         x: {
// //           ticks: {
// //             callback: (_value, index) => String(labels[index] ?? ""),
// //           },
// //           title: { display: true, text: formattedMonthYear },
// //         },
// //         y: {
// //           title: { display: true, text: `Amount (${currencySymbol})` },
// //         },
// //       },
// //     };

// //     const exportToExcel = () => {
// //       const extraRows = getExtraRows();
// //       const blankRow = [""];
// //       const sheetHeader: (string | number)[][] = [
// //         ["Metric", "", `Amount (${currencySymbol})`],
// //       ];

// //       const signs: Record<(typeof preferredOrder)[number], string> = {
// //         Sales: "(+)",
// //         COGS: "(-)",
// //         "Amazon Fees": "(-)",
// //         "Taxes & Credits": "(+)",
// //         "CM1 Profit": "",
// //         "Advertising Cost": "(-)",
// //         Other: "(-)",
// //         "CM2 Profit": "",
// //       };

// //       values.forEach((v, idx) => {
// //         const label = metricsToShow[idx];
// //         sheetHeader.push([label, signs[label], Number(v.toFixed(2))]);
// //       });

// //       const totalValue = values.reduce((acc, v) => acc + v, 0);
// //       sheetHeader.push(["Total", "", Number(totalValue.toFixed(2))]);

// //       const finalSheetData = [...extraRows, blankRow, ...sheetHeader];
// //       const ws = XLSX.utils.aoa_to_sheet(finalSheetData);
// //       const wb = XLSX.utils.book_new();
// //       XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
// //       XLSX.writeFile(wb, `Metrics-${formattedMonthYear}.xlsx`);
// //     };

// //     return {
// //       chartData,
// //       chartOptions: options,
// //       exportToExcel,
// //       allValuesZero: zero,
// //     };
// //   }, [
// //     data,
// //     selectedGraphs,
// //     selectedMonth,
// //     selectedYear,
// //     countryName,
// //     formattedMonthYear,
// //     currencySymbol,
// //   ]);

// //   useEffect(() => {
// //     if (!onNoDataChange) return;
// //     onNoDataChange(!loading && allValuesZero);
// //   }, [onNoDataChange, allValuesZero, loading]);

// //   return (
// //     <div className="relative w-full rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
// //       {/* fade content if allValuesZero (sample data) */}
// //       <div
// //         className={
// //           allValuesZero && !loading
// //             ? "opacity-30 pointer-events-none"
// //             : "opacity-100"
// //         }
// //       >
// //         {/* Header row */}
// //         <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
// //           <div className="flex flex-wrap items-baseline gap-2 justify-center sm:justify-start">
// //             <PageBreadcrumb
// //               pageTitle="Tracking Profitability -"
// //               variant="page"
// //               align="left"
// //               textSize="2xl"
// //             />
// //             <span className="text-[#5EA68E] font-bold text-lg sm:text-2xl md:text-2xl">
// //               {countryName?.toLowerCase() === "global"
// //                 ? "GLOBAL"
// //                 : countryName?.toUpperCase()}
// //             </span>
// //           </div>

// //           <div className="flex justify-center sm:justify-end">
// //             <DownloadIconButton onClick={exportToExcel} />
// //           </div>
// //         </div>

// //         {/* Chart container */}
// //         <div className="mt-4 w-full h-[46vh] sm:h-[48vh] md:h-[50vh] transition-opacity duration-300">
// //           {loading ? (
// //             <div className="flex h-full items-center justify-center">
// //               <Loader
// //                 src="/infinity-unscreen.gif"
// //                 size={150}
// //                 transparent
// //                 roundedClass="rounded-full"
// //                 backgroundClass="bg-transparent"
// //                 respectReducedMotion
// //               />
// //             </div>
// //           ) : (
// //             chartData.datasets.length > 0 && (
// //               <Bar data={chartData} options={chartOptions} />
// //             )
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default Bargraph;































// // "use client";

// // import React, { useEffect, useMemo, useState } from "react";
// // import { Bar } from "react-chartjs-2";
// // import {
// //   Chart as ChartJS,
// //   CategoryScale,
// //   LinearScale,
// //   BarElement,
// //   Title as ChartTitle,
// //   Tooltip,
// //   Legend,
// //   PointElement,
// //   ChartData,
// //   ChartOptions,
// //   TooltipItem,
// // } from "chart.js";
// // import * as XLSX from "xlsx";
// // import { useRouter } from "next/navigation";
// // import PageBreadcrumb from "../common/PageBreadCrumb";
// // import Loader from "@/components/loader/Loader";
// // import DownloadIconButton from "../ui/button/DownloadIconButton";

// // ChartJS.register(
// //   CategoryScale,
// //   LinearScale,
// //   BarElement,
// //   PointElement,
// //   ChartTitle,
// //   Tooltip,
// //   Legend
// // );

// // type BargraphProps = {
// //   range: "monthly" | "quarterly" | "yearly";
// //   selectedMonth: string;
// //   selectedYear: number | string;
// //   countryName: string;
// //   /** 👇 only used on global pages */
// //   homeCurrency?: string;
// //   onNoDataChange?: (noData: boolean) => void;
// // };

// // type UploadRow = {
// //   country: string;
// //   month: string;
// //   year: string | number;
// //   total_sales: number;
// //   total_amazon_fee: number;
// //   total_cous: number;
// //   advertising_total: number;
// //   otherwplatform: number;
// //   taxncredit?: number;
// //   cm2_profit: number;
// //   total_profit: number;
// // };

// // const getCurrencySymbol = (codeOrCountry: string) => {
// //   switch (codeOrCountry.toLowerCase()) {
// //     case "uk":
// //     case "gb":
// //     case "gbp":
// //       return "£";
// //     case "india":
// //     case "in":
// //     case "inr":
// //       return "₹";
// //     case "us":
// //     case "usa":
// //     case "usd":
// //       return "$";
// //     case "europe":
// //     case "eu":
// //     case "eur":
// //       return "€";
// //     default:
// //       return "¤";
// //   }
// // };


// // const Bargraph: React.FC<BargraphProps> = ({
// //   range,
// //   selectedMonth,
// //   selectedYear,
// //   countryName,
// //   homeCurrency,                       // 👈 NEW
// //   onNoDataChange,
// // }) => {
// //   const router = useRouter();

// //   const normalizedHomeCurrency = (homeCurrency || "usd").toLowerCase(); // 👈 ensure lowercase
// //   const currencySymbol = getCurrencySymbol(normalizedHomeCurrency);

// //   const [data, setData] = useState<UploadRow[]>([]);
// //   const [loading, setLoading] = useState<boolean>(false);
// //   const [selectedGraphs, setSelectedGraphs] = useState({
// //     sales: true,
// //     profit: true,
// //     profit2: true,
// //     AmazonExpense: true,
// //     total_cous: true,
// //     sellingFees: true,
// //     advertisingCosts: true,
// //     Other: true,
// //     taxncredit: true,
// //   });

// //   const capitalizeFirstLetter = (str: string) =>
// //     str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
// //   const convertToAbbreviatedMonth = (m?: string) =>
// //     m ? capitalizeFirstLetter(m).slice(0, 3) : "";

// //   const token =
// //     typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
// //   const [userData, setUserData] = useState<{
// //     company_name?: string;
// //     brand_name?: string;
// //   } | null>(null);

// //   // 🔹 Fetch upload history (with homeCurrency)
// //   useEffect(() => {
// //     const fetchData = async () => {
// //       setLoading(true);
// //       try {
// //         const url = new URL("http://127.0.0.1:5000/upload_history");
// //         url.searchParams.set("homeCurrency", normalizedHomeCurrency); // 👈 pass lowercase

// //         const response = await fetch(url.toString(), {
// //           method: "GET",
// //           headers: token ? { Authorization: `Bearer ${token}` } : {},
// //         });
// //         const result = (await response.json()) as { uploads?: UploadRow[] };
// //         if (result.uploads) {
// //           const filtered = result.uploads.filter(
// //             (item) => item.country.toLowerCase() === countryName.toLowerCase()
// //           );
// //           setData(filtered);
// //         }
// //       } catch (error) {
// //         console.error("Failed to fetch upload history:", error);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchData();
// //   }, [countryName, token, normalizedHomeCurrency]); // 👈 include homeCurrency

// //   useEffect(() => {
// //     const fetchUser = async () => {
// //       if (!token) return;
// //       try {
// //         const response = await fetch("http://127.0.0.1:5000/get_user_data", {
// //           method: "GET",
// //           headers: { Authorization: `Bearer ${token}` },
// //         });
// //         if (!response.ok) return;
// //         const j = (await response.json()) as {
// //           company_name?: string;
// //           brand_name?: string;
// //         };
// //         setUserData(j);
// //       } catch {
// //         // ignore
// //       }
// //     };
// //     fetchUser();
// //   }, [token]);

// //   const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const { name, checked } = e.target;
// //     const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;
// //     const newSelectedCount = checked ? selectedCount + 1 : selectedCount - 1;

// //     if (!checked && newSelectedCount < 2) return;

// //     setSelectedGraphs((prev) => ({ ...prev, [name]: checked }));
// //   };

// //   const formattedMonthYear = useMemo(
// //     () =>
// //       `${convertToAbbreviatedMonth(selectedMonth)}'${String(selectedYear).slice(
// //         -2
// //       )}`,
// //     [selectedMonth, selectedYear]
// //   );

// //   const getExtraRows = () => {
// //     const formattedCountry =
// //       countryName?.toLowerCase() === "global"
// //         ? "GLOBAL"
// //         : countryName?.toUpperCase();
// //     return [
// //       [`${userData?.brand_name || "N/A"}`],
// //       [`${userData?.company_name || "N/A"}`],
// //       [`Profit Breakup (SKU Level) - ${formattedMonthYear}`],
// //       [`Currency:  ${currencySymbol}`],
// //       [`Country: ${formattedCountry}`],
// //       [`Platform: Amazon`],
// //     ];
// //   };

// //   const metricMapping: Record<
// //     | "Sales"
// //     | "COGS"
// //     | "Amazon Fees"
// //     | "Taxes & Credits"
// //     | "CM1 Profit"
// //     | "Advertising Cost"
// //     | "Other"
// //     | "CM2 Profit",
// //     keyof UploadRow
// //   > = {
// //     Sales: "total_sales",
// //     COGS: "total_cous",
// //     "Amazon Fees": "total_amazon_fee",
// //     "Taxes & Credits": "taxncredit",
// //     "CM1 Profit": "total_profit",
// //     "Advertising Cost": "advertising_total",
// //     Other: "otherwplatform",
// //     "CM2 Profit": "cm2_profit",
// //   };

// //   const colorMapping: Record<
// //     | "Sales"
// //     | "COGS"
// //     | "Amazon Fees"
// //     | "Taxes & Credits"
// //     | "CM1 Profit"
// //     | "Advertising Cost"
// //     | "Other"
// //     | "CM2 Profit",
// //     string
// //   > = {
// //     Sales: "#2CA9E0",
// //     COGS: "#AB64B5",
// //     "Amazon Fees": "#ff5c5c",
// //     "Advertising Cost": "#F47A00",
// //     Other: "#00627D",
// //     "Taxes & Credits": "#FFBE26",
// //     "CM1 Profit": "#87AD12",
// //     "CM2 Profit": "#5EA49B",
// //   };

// //   const preferredOrder = [
// //     "Sales",
// //     "COGS",
// //     "Amazon Fees",
// //     "Taxes & Credits",
// //     "CM1 Profit",
// //     "Advertising Cost",
// //     "Other",
// //     "CM2 Profit",
// //   ] as const;

// //   const {
// //     chartData,
// //     chartOptions,
// //     exportToExcel,
// //     allValuesZero,
// //   }: {
// //     chartData: ChartData<"bar">;
// //     chartOptions: ChartOptions<"bar">;
// //     exportToExcel: () => void;
// //     allValuesZero: boolean;
// //   } = useMemo(() => {
// //     if (!data || data.length === 0) {
// //       const emptyData: ChartData<"bar"> = { labels: [], datasets: [] };
// //       const emptyOptions: ChartOptions<"bar"> = {};
// //       const noop = () => {};
// //       return {
// //         chartData: emptyData,
// //         chartOptions: emptyOptions,
// //         exportToExcel: noop,
// //         allValuesZero: true,
// //       };
// //     }

// //     const selectedMonthYearKey = `${selectedMonth} ${selectedYear}`.toLowerCase();
// //     const monthData = data.find(
// //       (upload) =>
// //         `${upload.month} ${upload.year}`.toLowerCase() === selectedMonthYearKey
// //     );

// //     const metricsToShow = (
// //       Object.entries(selectedGraphs)
// //         .filter(([, isChecked]) => isChecked)
// //         .map(([key]) => {
// //           switch (key) {
// //             case "sales":
// //               return "Sales";
// //             case "total_cous":
// //               return "COGS";
// //             case "AmazonExpense":
// //               return "Amazon Fees";
// //             case "taxncredit":
// //               return "Taxes & Credits";
// //             case "profit2":
// //               return "CM1 Profit";
// //             case "advertisingCosts":
// //               return "Advertising Cost";
// //             case "Other":
// //               return "Other";
// //             case "profit":
// //               return "CM2 Profit";
// //             default:
// //               return null;
// //           }
// //         })
// //         .filter(Boolean) as typeof preferredOrder[number][]
// //     ).sort((a, b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b));

// //     const labels = metricsToShow as string[];

// //     const viewportWidth =
// //       typeof window !== "undefined" ? window.innerWidth : 1200;
// //     const barWidthInPixels = viewportWidth * 0.05;

// //     let values = metricsToShow.map((label) => {
// //       const field = metricMapping[label];
// //       const v = monthData ? Math.abs(Number(monthData?.[field] ?? 0)) : 0;
// //       return v;
// //     });

// //     const zero = values.every((v) => v === 0);

// //     if (zero)
// //       values = metricsToShow.map(() => Math.floor(Math.random() * 1000 + 100));

// //     const chartData: ChartData<"bar"> = {
// //       labels,
// //       datasets: [
// //         {
// //           label: formattedMonthYear,
// //           data: values,
// //           maxBarThickness: barWidthInPixels,
// //           backgroundColor: metricsToShow.map((l) => colorMapping[l]),
// //           borderWidth: 0,
// //         },
// //       ],
// //     };

// //     const options: ChartOptions<"bar"> = {
// //       responsive: true,
// //       maintainAspectRatio: false,
// //       plugins: {
// //         legend: { display: false },
// //         tooltip: {
// //           intersect: false,
// //           callbacks: {
// //             title: (tooltipItems: TooltipItem<"bar">[]) =>
// //               tooltipItems[0]?.label ?? "",
// //             label: (context: TooltipItem<"bar">) => {
// //               const value = Number(context.raw ?? 0);
// //               const salesIndex = (labels as string[]).findIndex(
// //                 (l) => l === "Sales"
// //               );
// //               const salesValue =
// //                 salesIndex >= 0
// //                   ? Number(
// //                       (chartData.datasets[0].data as number[])[salesIndex] ?? 1
// //                     )
// //                   : 1;
// //               const percentage = (value / (salesValue || 1)) * 100;
// //               const metricLabel = String(context.label ?? "");
// //               const formattedValue = Number(value.toFixed(2)).toLocaleString();
// //               return `${metricLabel}: ${currencySymbol}${formattedValue} (${percentage.toFixed(
// //                 1
// //               )}%)`;
// //             },
// //           },
// //         },
// //       },
// //       scales: {
// //         x: {
// //           ticks: {
// //             callback: (_value, index) => String(labels[index] ?? ""),
// //           },
// //           title: { display: true, text: formattedMonthYear },
// //         },
// //         y: {
// //           title: { display: true, text: `Amount (${currencySymbol})` },
// //         },
// //       },
// //     };

// //     const exportToExcel = () => {
// //       const extraRows = getExtraRows();
// //       const blankRow = [""];
// //       const sheetHeader: (string | number)[][] = [
// //         ["Metric", "", `Amount (${currencySymbol})`],
// //       ];

// //       const signs: Record<(typeof preferredOrder)[number], string> = {
// //         Sales: "(+)",
// //         COGS: "(-)",
// //         "Amazon Fees": "(-)",
// //         "Taxes & Credits": "(+)",
// //         "CM1 Profit": "",
// //         "Advertising Cost": "(-)",
// //         Other: "(-)",
// //         "CM2 Profit": "",
// //       };

// //       values.forEach((v, idx) => {
// //         const label = metricsToShow[idx];
// //         sheetHeader.push([label, signs[label], Number(v.toFixed(2))]);
// //       });

// //       const totalValue = values.reduce((acc, v) => acc + v, 0);
// //       sheetHeader.push(["Total", "", Number(totalValue.toFixed(2))]);

// //       const finalSheetData = [...extraRows, blankRow, ...sheetHeader];
// //       const ws = XLSX.utils.aoa_to_sheet(finalSheetData);
// //       const wb = XLSX.utils.book_new();
// //       XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
// //       XLSX.writeFile(wb, `Metrics-${formattedMonthYear}.xlsx`);
// //     };

// //     return {
// //       chartData,
// //       chartOptions: options,
// //       exportToExcel,
// //       allValuesZero: zero,
// //     };
// //   }, [
// //     data,
// //     selectedGraphs,
// //     selectedMonth,
// //     selectedYear,
// //     countryName,
// //     formattedMonthYear,
// //     currencySymbol,
// //   ]);

// //   useEffect(() => {
// //     if (!onNoDataChange) return;
// //     onNoDataChange(!loading && allValuesZero);
// //   }, [onNoDataChange, allValuesZero, loading]);

// //   return (
// //     <div className="relative w-full rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
// //       {/* fade content if allValuesZero (sample data) */}
// //       <div
// //         className={
// //           allValuesZero && !loading
// //             ? "opacity-30 pointer-events-none"
// //             : "opacity-100"
// //         }
// //       >
// //         {/* Header row */}
// //         <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
// //           <div className="flex flex-wrap items-baseline gap-2 justify-center sm:justify-start">
// //             <PageBreadcrumb
// //               pageTitle="Tracking Profitability -"
// //               variant="page"
// //               align="left"
// //               textSize="2xl"
// //             />
// //             <span className="text-[#5EA68E] font-bold text-lg sm:text-2xl md:text-2xl">
// //               {countryName?.toLowerCase() === "global"
// //                 ? "GLOBAL"
// //                 : countryName?.toUpperCase()}
// //             </span>
// //           </div>

// //           <div className="flex justify-center sm:justify-end">
// //             <DownloadIconButton onClick={exportToExcel} />
// //           </div>
// //         </div>

// //         {/* Chart container */}
// //         <div className="mt-4 w-full h-[46vh] sm:h-[48vh] md:h-[50vh] transition-opacity duration-300">
// //           {loading ? (
// //             <div className="flex h-full items-center justify-center">
// //               <Loader
// //                 src="/infinity-unscreen.gif"
// //                 size={150}
// //                 transparent
// //                 roundedClass="rounded-full"
// //                 backgroundClass="bg-transparent"
// //                 respectReducedMotion
// //               />
// //             </div>
// //           ) : (
// //             chartData.datasets.length > 0 && (
// //               <Bar data={chartData} options={chartOptions} />
// //             )
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default Bargraph;










// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { Bar } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title as ChartTitle,
//   Tooltip,
//   Legend,
//   PointElement,
//   ChartData,
//   ChartOptions,
//   TooltipItem,
// } from "chart.js";
// import * as XLSX from "xlsx";
// import { useRouter } from "next/navigation";
// import PageBreadcrumb from "../common/PageBreadCrumb";
// import Loader from "@/components/loader/Loader";
// import DownloadIconButton from "../ui/button/DownloadIconButton";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   PointElement,
//   ChartTitle,
//   Tooltip,
//   Legend
// );

// type BargraphProps = {
//   range: "monthly" | "quarterly" | "yearly";
//   selectedMonth: string;
//   selectedYear: number | string;
//   countryName: string;
//   /** only used on global pages */
//   homeCurrency?: string;
//   onNoDataChange?: (noData: boolean) => void;
// };

// type UploadRow = {
//   country: string;
//   month: string;
//   year: string | number;
//   total_sales: number;
//   total_amazon_fee: number;
//   total_cous: number;
//   advertising_total: number;
//   otherwplatform: number;
//   taxncredit?: number;
//   cm2_profit: number;
//   total_profit: number;
// };

// const getCurrencySymbol = (codeOrCountry: string) => {
//   switch (codeOrCountry.toLowerCase()) {
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

// const Bargraph: React.FC<BargraphProps> = ({
//   range,
//   selectedMonth,
//   selectedYear,
//   countryName,
//   homeCurrency,
//   onNoDataChange,
// }) => {
//   const router = useRouter();

//   const isGlobalPage = countryName.toLowerCase() === "global";

//   // 👇 For GLOBAL → use homeCurrency; for others → use countryName
//   const normalizedHomeCurrency = (homeCurrency || "usd").toLowerCase();
//   const effectiveCurrencyCode = isGlobalPage ? normalizedHomeCurrency : countryName;
//   const currencySymbol = getCurrencySymbol(effectiveCurrencyCode);

//   const [data, setData] = useState<UploadRow[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [selectedGraphs, setSelectedGraphs] = useState({
//     sales: true,
//     profit: true,
//     profit2: true,
//     AmazonExpense: true,
//     total_cous: true,
//     sellingFees: true,
//     advertisingCosts: true,
//     Other: true,
//     taxncredit: true,
//   });

//   const capitalizeFirstLetter = (str: string) =>
//     str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
//   const convertToAbbreviatedMonth = (m?: string) =>
//     m ? capitalizeFirstLetter(m).slice(0, 3) : "";

//   const token =
//     typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
//   const [userData, setUserData] = useState<{
//     company_name?: string;
//     brand_name?: string;
//   } | null>(null);

//   // 🔹 Fetch upload history (homeCurrency only for GLOBAL)
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const url = new URL("http://127.0.0.1:5000/upload_history");

//         // ✅ Only send homeCurrency for GLOBAL
//         if (isGlobalPage && homeCurrency) {
//           url.searchParams.set("homeCurrency", normalizedHomeCurrency);
//         }

//         const response = await fetch(url.toString(), {
//           method: "GET",
//           headers: token ? { Authorization: `Bearer ${token}` } : {},
//         });
//         const result = (await response.json()) as { uploads?: UploadRow[] };
//         if (result.uploads) {
//           const filtered = result.uploads.filter(
//             (item) => item.country.toLowerCase() === countryName.toLowerCase()
//           );
//           setData(filtered);
//         }
//       } catch (error) {
//         console.error("Failed to fetch upload history:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [countryName, token, normalizedHomeCurrency, isGlobalPage, homeCurrency]);

//   useEffect(() => {
//     const fetchUser = async () => {
//       if (!token) return;
//       try {
//         const response = await fetch("http://127.0.0.1:5000/get_user_data", {
//           method: "GET",
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (!response.ok) return;
//         const j = (await response.json()) as {
//           company_name?: string;
//           brand_name?: string;
//         };
//         setUserData(j);
//       } catch {
//         // ignore
//       }
//     };
//     fetchUser();
//   }, [token]);

//   const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, checked } = e.target;
//     const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;
//     const newSelectedCount = checked ? selectedCount + 1 : selectedCount - 1;

//     if (!checked && newSelectedCount < 2) return;

//     setSelectedGraphs((prev) => ({ ...prev, [name]: checked }));
//   };

//   const formattedMonthYear = useMemo(
//     () =>
//       `${convertToAbbreviatedMonth(selectedMonth)}'${String(selectedYear).slice(
//         -2
//       )}`,
//     [selectedMonth, selectedYear]
//   );

//   const getExtraRows = () => {
//     const formattedCountry =
//       countryName?.toLowerCase() === "global"
//         ? "GLOBAL"
//         : countryName?.toUpperCase();
//     return [
//       [`${userData?.brand_name || "N/A"}`],
//       [`${userData?.company_name || "N/A"}`],
//       [`Profit Breakup (SKU Level) - ${formattedMonthYear}`],
//       [`Currency:  ${currencySymbol}`],
//       [`Country: ${formattedCountry}`],
//       [`Platform: Amazon`],
//     ];
//   };

//   const metricMapping: Record<
//     | "Sales"
//     | "COGS"
//     | "Amazon Fees"
//     | "Taxes & Credits"
//     | "CM1 Profit"
//     | "Advertising Cost"
//     | "Other"
//     | "CM2 Profit",
//     keyof UploadRow
//   > = {
//     Sales: "total_sales",
//     COGS: "total_cous",
//     "Amazon Fees": "total_amazon_fee",
//     "Taxes & Credits": "taxncredit",
//     "CM1 Profit": "total_profit",
//     "Advertising Cost": "advertising_total",
//     Other: "otherwplatform",
//     "CM2 Profit": "cm2_profit",
//   };

//   const colorMapping: Record<
//     | "Sales"
//     | "COGS"
//     | "Amazon Fees"
//     | "Taxes & Credits"
//     | "CM1 Profit"
//     | "Advertising Cost"
//     | "Other"
//     | "CM2 Profit",
//     string
//   > = {
//     Sales: "#2CA9E0",
//     COGS: "#AB64B5",
//     "Amazon Fees": "#ff5c5c",
//     "Advertising Cost": "#F47A00",
//     Other: "#00627D",
//     "Taxes & Credits": "#FFBE26",
//     "CM1 Profit": "#87AD12",
//     "CM2 Profit": "#5EA49B",
//   };

//   const preferredOrder = [
//     "Sales",
//     "COGS",
//     "Amazon Fees",
//     "Taxes & Credits",
//     "CM1 Profit",
//     "Advertising Cost",
//     "Other",
//     "CM2 Profit",
//   ] as const;

//   const {
//     chartData,
//     chartOptions,
//     exportToExcel,
//     allValuesZero,
//   }: {
//     chartData: ChartData<"bar">;
//     chartOptions: ChartOptions<"bar">;
//     exportToExcel: () => void;
//     allValuesZero: boolean;
//   } = useMemo(() => {
//     if (!data || data.length === 0) {
//       const emptyData: ChartData<"bar"> = { labels: [], datasets: [] };
//       const emptyOptions: ChartOptions<"bar"> = {};
//       const noop = () => {};
//       return {
//         chartData: emptyData,
//         chartOptions: emptyOptions,
//         exportToExcel: noop,
//         allValuesZero: true,
//       };
//     }

//     const selectedMonthYearKey = `${selectedMonth} ${selectedYear}`.toLowerCase();
//     const monthData = data.find(
//       (upload) =>
//         `${upload.month} ${upload.year}`.toLowerCase() === selectedMonthYearKey
//     );

//     const metricsToShow = (
//       Object.entries(selectedGraphs)
//         .filter(([, isChecked]) => isChecked)
//         .map(([key]) => {
//           switch (key) {
//             case "sales":
//               return "Sales";
//             case "total_cous":
//               return "COGS";
//             case "AmazonExpense":
//               return "Amazon Fees";
//             case "taxncredit":
//               return "Taxes & Credits";
//             case "profit2":
//               return "CM1 Profit";
//             case "advertisingCosts":
//               return "Advertising Cost";
//             case "Other":
//               return "Other";
//             case "profit":
//               return "CM2 Profit";
//             default:
//               return null;
//           }
//         })
//         .filter(Boolean) as typeof preferredOrder[number][]
//     ).sort((a, b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b));

//     const labels = metricsToShow as string[];

//     const viewportWidth =
//       typeof window !== "undefined" ? window.innerWidth : 1200;
//     const barWidthInPixels = viewportWidth * 0.05;

//     let values = metricsToShow.map((label) => {
//       const field = metricMapping[label];
//       const v = monthData ? Math.abs(Number(monthData?.[field] ?? 0)) : 0;
//       return v;
//     });

//     const zero = values.every((v) => v === 0);

//     if (zero)
//       values = metricsToShow.map(() => Math.floor(Math.random() * 1000 + 100));

//     const chartData: ChartData<"bar"> = {
//       labels,
//       datasets: [
//         {
//           label: formattedMonthYear,
//           data: values,
//           maxBarThickness: barWidthInPixels,
//           backgroundColor: metricsToShow.map((l) => colorMapping[l]),
//           borderWidth: 0,
//         },
//       ],
//     };

//     const options: ChartOptions<"bar"> = {
//       responsive: true,
//       maintainAspectRatio: false,
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           intersect: false,
//           callbacks: {
//             title: (tooltipItems: TooltipItem<"bar">[]) =>
//               tooltipItems[0]?.label ?? "",
//             label: (context: TooltipItem<"bar">) => {
//               const value = Number(context.raw ?? 0);
//               const salesIndex = (labels as string[]).findIndex(
//                 (l) => l === "Sales"
//               );
//               const salesValue =
//                 salesIndex >= 0
//                   ? Number(
//                       (chartData.datasets[0].data as number[])[salesIndex] ?? 1
//                     )
//                   : 1;
//               const percentage = (value / (salesValue || 1)) * 100;
//               const metricLabel = String(context.label ?? "");
//               const formattedValue = Number(value.toFixed(2)).toLocaleString();
//               return `${metricLabel}: ${currencySymbol}${formattedValue} (${percentage.toFixed(
//                 1
//               )}%)`;
//             },
//           },
//         },
//       },
//       scales: {
//         x: {
//           ticks: {
//             callback: (_value, index) => String(labels[index] ?? ""),
//           },
//           title: { display: true, text: formattedMonthYear },
//         },
//         y: {
//           title: { display: true, text: `Amount (${currencySymbol})` },
//         },
//       },
//     };

//     const exportToExcel = () => {
//       const extraRows = getExtraRows();
//       const blankRow = [""];
//       const sheetHeader: (string | number)[][] = [
//         ["Metric", "", `Amount (${currencySymbol})`],
//       ];

//       const signs: Record<(typeof preferredOrder)[number], string> = {
//         Sales: "(+)",
//         COGS: "(-)",
//         "Amazon Fees": "(-)",
//         "Taxes & Credits": "(+)",
//         "CM1 Profit": "",
//         "Advertising Cost": "(-)",
//         Other: "(-)",
//         "CM2 Profit": "",
//       };

//       values.forEach((v, idx) => {
//         const label = metricsToShow[idx];
//         sheetHeader.push([label, signs[label], Number(v.toFixed(2))]);
//       });

//       const totalValue = values.reduce((acc, v) => acc + v, 0);
//       sheetHeader.push(["Total", "", Number(totalValue.toFixed(2))]);

//       const finalSheetData = [...extraRows, blankRow, ...sheetHeader];
//       const ws = XLSX.utils.aoa_to_sheet(finalSheetData);
//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
//       XLSX.writeFile(wb, `Metrics-${formattedMonthYear}.xlsx`);
//     };

//     return {
//       chartData,
//       chartOptions: options,
//       exportToExcel,
//       allValuesZero: zero,
//     };
//   }, [
//     data,
//     selectedGraphs,
//     selectedMonth,
//     selectedYear,
//     countryName,
//     formattedMonthYear,
//     currencySymbol,
//   ]);

//   useEffect(() => {
//     if (!onNoDataChange) return;
//     onNoDataChange(!loading && allValuesZero);
//   }, [onNoDataChange, allValuesZero, loading]);

//   return (
//     <div className="relative w-full rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
//       {/* fade content if allValuesZero (sample data) */}
//       <div
//         className={
//           allValuesZero && !loading
//             ? "opacity-30 pointer-events-none"
//             : "opacity-100"
//         }
//       >
//         {/* Header row */}
//         <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <div className="flex flex-wrap items-baseline gap-2 justify-center sm:justify-start">
//             <PageBreadcrumb
//               pageTitle="Profitability"
//               variant="page"
//               align="left"
//               textSize="2xl"
//             />
//             {/* <span className="text-[#5EA68E] font-bold text-lg sm:text-2xl md:text-2xl">
//               {countryName?.toLowerCase() === "global"
//                 ? "GLOBAL"
//                 : countryName?.toUpperCase()}
//             </span> */}
//           </div>

//           <div className="flex justify-center sm:justify-end">
//             <DownloadIconButton onClick={exportToExcel} />
//           </div>
//         </div>

//         {/* Chart container */}
//         <div className="mt-4 w-full h-[46vh] sm:h-[48vh] md:h-[50vh] transition-opacity duration-300">
//           {loading ? (
//             <div className="flex h-full items-center justify-center">
//               <Loader
//                 src="/infinity-unscreen.gif"
//                 size={150}
//                 transparent
//                 roundedClass="rounded-full"
//                 backgroundClass="bg-transparent"
//                 respectReducedMotion
//               />
//             </div>
//           ) : (
//             chartData.datasets.length > 0 && (
//               <Bar data={chartData} options={chartOptions} />
//             )
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Bargraph;






























"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  PointElement,
  ChartData,
  ChartOptions,
  TooltipItem,
} from "chart.js";
import * as XLSX from "xlsx";
import PageBreadcrumb from "../common/PageBreadCrumb";
import Loader from "@/components/loader/Loader";
import DownloadIconButton from "../ui/button/DownloadIconButton";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  ChartTitle,
  Tooltip,
  Legend
);

type BargraphProps = {
  range: "monthly" | "quarterly" | "yearly";
  selectedMonth: string;
  selectedYear: number | string;
  countryName: string;
  /** only used on global pages */
  homeCurrency?: string;
  onNoDataChange?: (noData: boolean) => void;
};

type UploadRow = {
  country: string;
  month: string;
  year: string | number;
  total_sales: number;
  total_amazon_fee: number;
  total_cous: number;
  advertising_total: number;
  otherwplatform: number;
  taxncredit?: number;
  cm2_profit: number;
  total_profit: number;
};

const getCurrencySymbol = (codeOrCountry: string) => {
  switch (codeOrCountry.toLowerCase()) {
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

const Bargraph: React.FC<BargraphProps> = ({
  range,
  selectedMonth,
  selectedYear,
  countryName,
  homeCurrency,
  onNoDataChange,
}) => {
  const isGlobalPage = countryName.toLowerCase() === "global";

  const normalizedHomeCurrency = (homeCurrency || "").toLowerCase();
  const effectiveCurrencyCode = isGlobalPage
    ? normalizedHomeCurrency || "usd"
    : countryName;
  const currencySymbol = getCurrencySymbol(effectiveCurrencyCode);

  const [data, setData] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedGraphs, setSelectedGraphs] = useState({
    sales: true,
    profit: true,
    profit2: true,
    AmazonExpense: true,
    total_cous: true,
    sellingFees: true,
    advertisingCosts: true,
    Other: true,
    taxncredit: true,
  });

  const capitalizeFirstLetter = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  const convertToAbbreviatedMonth = (m?: string) =>
    m ? capitalizeFirstLetter(m).slice(0, 3) : "";

  const token =
    typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

  const [userData, setUserData] = useState<{
    company_name?: string;
    brand_name?: string;
  } | null>(null);

  // ✅ FIXED: Always pass ?country=<countryName>
  // - If GLOBAL: also pass &homeCurrency=<homeCurrency>
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = new URL("http://127.0.0.1:5000/upload_history");

        url.searchParams.set("country", countryName.toLowerCase());
        if (isGlobalPage && normalizedHomeCurrency) {
          url.searchParams.set("homeCurrency", normalizedHomeCurrency);
        }

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const result = (await response.json()) as { uploads?: UploadRow[] };
        setData(result.uploads ?? []);
      } catch (error) {
        console.error("Failed to fetch upload history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [countryName, token, isGlobalPage, normalizedHomeCurrency]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const response = await fetch("http://127.0.0.1:5000/get_user_data", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const j = (await response.json()) as {
          company_name?: string;
          brand_name?: string;
        };
        setUserData(j);
      } catch {
        // ignore
      }
    };
    fetchUser();
  }, [token]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;
    const newSelectedCount = checked ? selectedCount + 1 : selectedCount - 1;
    if (!checked && newSelectedCount < 2) return;

    setSelectedGraphs((prev) => ({ ...prev, [name]: checked }));
  };

  const formattedMonthYear = useMemo(
    () =>
      `${convertToAbbreviatedMonth(selectedMonth)}'${String(selectedYear).slice(
        -2
      )}`,
    [selectedMonth, selectedYear]
  );

  const getExtraRows = () => {
    const formattedCountry = isGlobalPage ? "GLOBAL" : countryName?.toUpperCase();
    return [
      [`${userData?.brand_name || "N/A"}`],
      [`${userData?.company_name || "N/A"}`],
      [`Profit Breakup (SKU Level) - ${formattedMonthYear}`],
      [`Currency:  ${currencySymbol}`],
      [`Country: ${formattedCountry}`],
      [`Platform: Amazon`],
    ];
  };

  const metricMapping: Record<
    | "Sales"
    | "COGS"
    | "Amazon Fees"
    | "Taxes & Credits"
    | "CM1 Profit"
    | "Advertising Cost"
    | "Other"
    | "CM2 Profit",
    keyof UploadRow
  > = {
    Sales: "total_sales",
    COGS: "total_cous",
    "Amazon Fees": "total_amazon_fee",
    "Taxes & Credits": "taxncredit",
    "CM1 Profit": "total_profit",
    "Advertising Cost": "advertising_total",
    Other: "otherwplatform",
    "CM2 Profit": "cm2_profit",
  };

  const colorMapping: Record<
    | "Sales"
    | "COGS"
    | "Amazon Fees"
    | "Taxes & Credits"
    | "CM1 Profit"
    | "Advertising Cost"
    | "Other"
    | "CM2 Profit",
    string
  > = {
    Sales: "#2CA9E0",
    COGS: "#AB64B5",
    "Amazon Fees": "#ff5c5c",
    "Advertising Cost": "#F47A00",
    Other: "#00627D",
    "Taxes & Credits": "#FFBE26",
    "CM1 Profit": "#87AD12",
    "CM2 Profit": "#5EA49B",
  };

  const preferredOrder = [
    "Sales",
    "COGS",
    "Amazon Fees",
    "Taxes & Credits",
    "CM1 Profit",
    "Advertising Cost",
    "Other",
    "CM2 Profit",
  ] as const;

  const { chartData, chartOptions, exportToExcel, allValuesZero } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        chartData: { labels: [], datasets: [] } as ChartData<"bar">,
        chartOptions: {} as ChartOptions<"bar">,
        exportToExcel: () => {},
        allValuesZero: true,
      };
    }

    const selectedMonthYearKey = `${selectedMonth} ${selectedYear}`.toLowerCase();
    const monthData = data.find(
      (upload) =>
        `${upload.month} ${upload.year}`.toLowerCase() === selectedMonthYearKey
    );

    const metricsToShow = (
      Object.entries(selectedGraphs)
        .filter(([, isChecked]) => isChecked)
        .map(([key]) => {
          switch (key) {
            case "sales":
              return "Sales";
            case "total_cous":
              return "COGS";
            case "AmazonExpense":
              return "Amazon Fees";
            case "taxncredit":
              return "Taxes & Credits";
            case "profit2":
              return "CM1 Profit";
            case "advertisingCosts":
              return "Advertising Cost";
            case "Other":
              return "Other";
            case "profit":
              return "CM2 Profit";
            default:
              return null;
          }
        })
        .filter(Boolean) as typeof preferredOrder[number][]
    ).sort((a, b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b));

    const labels = metricsToShow as string[];

    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1200;
    const barWidthInPixels = viewportWidth * 0.05;

    let values = metricsToShow.map((label) => {
      const field = metricMapping[label];
      return monthData ? Math.abs(Number(monthData?.[field] ?? 0)) : 0;
    });

    const zero = values.every((v) => v === 0);
    if (zero) values = metricsToShow.map(() => Math.floor(Math.random() * 1000 + 100));

    const chartData: ChartData<"bar"> = {
      labels,
      datasets: [
        {
          label: formattedMonthYear,
          data: values,
          maxBarThickness: barWidthInPixels,
          backgroundColor: metricsToShow.map((l) => colorMapping[l]),
          borderWidth: 0,
        },
      ],
    };

    const options: ChartOptions<"bar"> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          intersect: false,
          callbacks: {
            title: (tooltipItems: TooltipItem<"bar">[]) =>
              tooltipItems[0]?.label ?? "",
            label: (context: TooltipItem<"bar">) => {
              const value = Number(context.raw ?? 0);
              const salesIndex = labels.findIndex((l) => l === "Sales");
              const salesValue =
                salesIndex >= 0 ? Number((chartData.datasets[0].data as number[])[salesIndex] ?? 1) : 1;
              const percentage = (value / (salesValue || 1)) * 100;
              const metricLabel = String(context.label ?? "");
              const formattedValue = Number(value.toFixed(2)).toLocaleString();
              return `${metricLabel}: ${currencySymbol}${formattedValue} (${percentage.toFixed(1)}%)`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { callback: (_value, index) => String(labels[index] ?? "") },
          title: { display: true, text: formattedMonthYear },
        },
        y: {
          title: { display: true, text: `Amount (${currencySymbol})` },
        },
      },
    };

    const exportToExcel = () => {
      const extraRows = getExtraRows();
      const blankRow = [""];
      const sheetHeader: (string | number)[][] = [["Metric", "", `Amount (${currencySymbol})`]];

      const signs: Record<(typeof preferredOrder)[number], string> = {
        Sales: "(+)",
        COGS: "(-)",
        "Amazon Fees": "(-)",
        "Taxes & Credits": "(+)",
        "CM1 Profit": "",
        "Advertising Cost": "(-)",
        Other: "(-)",
        "CM2 Profit": "",
      };

      values.forEach((v, idx) => {
        const label = metricsToShow[idx];
        sheetHeader.push([label, signs[label], Number(v.toFixed(2))]);
      });

      const totalValue = values.reduce((acc, v) => acc + v, 0);
      sheetHeader.push(["Total", "", Number(totalValue.toFixed(2))]);

      const finalSheetData = [...extraRows, blankRow, ...sheetHeader];
      const ws = XLSX.utils.aoa_to_sheet(finalSheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
      XLSX.writeFile(wb, `Metrics-${formattedMonthYear}.xlsx`);
    };

    return { chartData, chartOptions: options, exportToExcel, allValuesZero: zero };
  }, [data, selectedGraphs, selectedMonth, selectedYear, formattedMonthYear, currencySymbol]);

  useEffect(() => {
    onNoDataChange?.(!loading && allValuesZero);
  }, [onNoDataChange, allValuesZero, loading]);

  return (
    <div className="relative w-full rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
      <div
        className={
          allValuesZero && !loading ? "opacity-30 pointer-events-none" : "opacity-100"
        }
      >
        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-baseline gap-2 justify-center sm:justify-start">
            <PageBreadcrumb pageTitle="Profitability" variant="page" align="left" textSize="2xl" />
          </div>

          <div className="flex justify-center sm:justify-end">
            <DownloadIconButton onClick={exportToExcel} />
          </div>
        </div>

        <div className="mt-4 w-full h-[46vh] sm:h-[48vh] md:h-[50vh] transition-opacity duration-300">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader
                src="/infinity-unscreen.gif"
                size={150}
                transparent
                roundedClass="rounded-full"
                backgroundClass="bg-transparent"
                respectReducedMotion
              />
            </div>
          ) : (
            chartData.datasets.length > 0 && <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Bargraph;
