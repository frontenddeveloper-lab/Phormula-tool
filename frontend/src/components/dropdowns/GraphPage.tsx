// // // "use client";

// // // import React, { useEffect, useMemo, useState } from "react";
// // // import "@/lib/chartSetup";
// // // import { Line } from "react-chartjs-2";
// // // import {
// // //   Chart as ChartJS,
// // //   CategoryScale,
// // //   LinearScale,
// // //   LineElement,
// // //   PointElement,
// // //   Title as ChartTitle,
// // //   Tooltip,
// // //   Legend,
// // // } from "chart.js";
// // // import * as XLSX from "xlsx";
// // // import { useRouter } from "next/navigation";
// // // import ModalMsg from "@/components/common/ModalMsg";
// // // import Button from "../ui/button/Button";
// // // import PageBreadcrumb from "../common/PageBreadCrumb";
// // // import { FiDownload } from "react-icons/fi";
// // // import Loader from "@/components/loader/Loader"; // 👈 NEW
// // // import DownloadIconButton from "../ui/button/DownloadIconButton";

// // // ChartJS.register(
// // //   CategoryScale,
// // //   LinearScale,
// // //   LineElement,
// // //   PointElement,
// // //   ChartTitle,
// // //   Tooltip,
// // //   Legend
// // // );

// // // type GraphPageProps = {
// // //   range: "monthly" | "quarterly" | "yearly";
// // //   selectedMonth?: string;
// // //   selectedQuarter?: "Q1" | "Q2" | "Q3" | "Q4";
// // //   selectedYear: number | string;
// // //   countryName: string;
// // //   onNoDataChange?: (noData: boolean) => void; // 👈 NEW
// // // };


// // // type UploadRow = {
// // //   country: string;
// // //   month: string;
// // //   year: string | number;
// // //   total_sales: number;
// // //   total_amazon_fee: number;
// // //   total_cous: number;
// // //   advertising_total: number;
// // //   otherwplatform: number;
// // //   taxncredit?: number;
// // //   cm2_profit: number;
// // //   total_profit: number;
// // //   total_net_credits?: number;
// // // };

// // // const getCurrencySymbol = (country: string) => {
// // //   switch (country.toLowerCase()) {
// // //     case "uk":
// // //       return "£";
// // //     case "india":
// // //       return "₹";
// // //     case "us":
// // //       return "$";
// // //     case "europe":
// // //     case "eu":
// // //       return "€";
// // //     case "global":
// // //       return "$";
// // //     default:
// // //       return "¤";
// // //   }
// // // };

// // // const GraphPage: React.FC<GraphPageProps> = ({
// // //   range,
// // //   selectedMonth,
// // //   selectedQuarter,
// // //   selectedYear,
// // //   countryName,
// // //   onNoDataChange,
// // // }) => {
// // //   const router = useRouter();
// // //   const currencySymbol = countryName ? getCurrencySymbol(countryName) : "¤";

// // //   const [data, setData] = useState<UploadRow[]>([]);
// // //   const [allValuesZero, setAllValuesZero] = useState(false);
// // //   const [showModal, setShowModal] = useState(false);
// // //   const [loading, setLoading] = useState<boolean>(true); // 👈 NEW

// // //   const [selectedGraphs, setSelectedGraphs] = useState<Record<string, boolean>>({
// // //     sales: true,
// // //     total_cous: true,
// // //     AmazonExpense: true,
// // //     taxncredit: true,
// // //     profit2: true,
// // //     advertisingCosts: true,
// // //     Other: true,
// // //     profit: true,
// // //   });

// // //   const token =
// // //     typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
// // //   const [fetchError, setFetchError] = useState<string | null>(null);
// // //   const [userData, setUserData] = useState<{
// // //     company_name?: string;
// // //     brand_name?: string;
// // //   } | null>(null);

// // //   const generateDummyData = (labels: string[]) => {
// // //     const dummyMetrics: Record<string, number[]> = {
// // //       sales: labels.map(
// // //         (_, index) => 15000 + Math.random() * 5000 + index * 1000
// // //       ),
// // //       AmazonExpense: labels.map(
// // //         (_, index) => 3000 + Math.random() * 1000 + index * 200
// // //       ),
// // //       total_cous: labels.map(
// // //         (_, index) => 8000 + Math.random() * 2000 + index * 500
// // //       ),
// // //       advertisingCosts: labels.map(
// // //         (_, index) => 2000 + Math.random() * 800 + index * 150
// // //       ),
// // //       Other: labels.map(
// // //         (_, index) => 1000 + Math.random() * 500 + index * 100
// // //       ),
// // //       taxncredit: labels.map(
// // //         (_, index) => 500 + Math.random() * 300 + index * 50
// // //       ),
// // //       profit: labels.map(
// // //         (_, index) => 1500 + Math.random() * 800 + index * 200
// // //       ),
// // //       profit2: labels.map(
// // //         (_, index) => 2000 + Math.random() * 1000 + index * 250
// // //       ),
// // //     };
// // //     return dummyMetrics;
// // //   };

// // //   const getQuarterLabels = (
// // //     year: number | string,
// // //     quarter: "Q1" | "Q2" | "Q3" | "Q4"
// // //   ) => {
// // //     const qMap: Record<string, string[]> = {
// // //       Q1: ["january", "february", "march"],
// // //       Q2: ["april", "may", "june"],
// // //       Q3: ["july", "august", "september"],
// // //       Q4: ["october", "november", "december"],
// // //     };
// // //     return qMap[quarter]?.map((m) => `${m} ${year}`) ?? [];
// // //   };

// // //   const capitalizeFirstLetter = (str: string) =>
// // //     str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
// // //   const convertToAbbreviatedMonth = (m?: string) =>
// // //     m ? capitalizeFirstLetter(m).slice(0, 3) : "";

// // //   const getTitle = () => {
// // //     if (range === "quarterly" && selectedQuarter) {
// // //       return `${capitalizeFirstLetter(
// // //         range
// // //       )} Tracking Profitability - ${selectedQuarter}'${String(selectedYear).slice(
// // //         -2
// // //       )}`;
// // //     }
// // //     if (range === "monthly" && selectedMonth) {
// // //       return `${capitalizeFirstLetter(
// // //         range
// // //       )} Tracking Profitability - ${convertToAbbreviatedMonth(
// // //         selectedMonth
// // //       )} ${selectedYear}`;
// // //     }
// // //     return `${capitalizeFirstLetter(range)} Tracking Profitability - ${selectedYear}`;
// // //   };

// // //   const labelMap: Record<string, string> = {
// // //     sales: "Sales",
// // //     total_cous: "COGS",
// // //     taxncredit: "Taxes & Credits",
// // //     AmazonExpense: "Amazon Fees",
// // //     advertisingCosts: "Advertising Costs",
// // //     Other: "Other",
// // //     profit: "CM2 Profit",
// // //     profit2: "CM1 Profit",
// // //   };

// // //   useEffect(() => {
// // //     const fetchUploadHistory = async () => {
// // //       try {
// // //         if (!token) {
// // //           setLoading(false);
// // //           return;
// // //         }
// // //         setLoading(true); // 👈 start loader
// // //         const resp = await fetch(`http://127.0.0.1:5000/upload_history`, {
// // //           method: "GET",
// // //           headers: { Authorization: `Bearer ${token}` },
// // //         });
// // //         const json = await resp.json();
// // //         if (json?.uploads) {
// // //           const filtered = (json.uploads as UploadRow[]).filter(
// // //             (item) => item.country.toLowerCase() === countryName.toLowerCase()
// // //           );
// // //           setData(filtered);
// // //         }
// // //       } catch (e) {
// // //         console.error("Failed to fetch upload history:", e);
// // //       } finally {
// // //         setLoading(false); // 👈 stop loader
// // //       }
// // //     };
// // //     fetchUploadHistory();
// // //   }, [countryName, token]);

// // //   useEffect(() => {
// // //     const fetchUser = async () => {
// // //       if (!token) {
// // //         setFetchError("No token found. Please log in.");
// // //         return;
// // //       }
// // //       try {
// // //         const response = await fetch("http://127.0.0.1:5000/get_user_data", {
// // //           method: "GET",
// // //           headers: { Authorization: `Bearer ${token}` },
// // //         });
// // //         if (!response.ok) {
// // //           const j = await response.json().catch(() => ({}));
// // //           setFetchError(j?.error || "Something went wrong.");
// // //           return;
// // //         }
// // //         const j = await response.json();
// // //         setUserData(j);
// // //       } catch {
// // //         setFetchError("Error fetching user data");
// // //       }
// // //     };
// // //     fetchUser();
// // //   }, [token]);

// // //   const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// // //     const { name, checked } = e.target;
// // //     const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;
// // //     if (!checked && selectedCount === 1) {
// // //       setShowModal(true);
// // //       return;
// // //     }
// // //     setSelectedGraphs((prev) => ({ ...prev, [name]: checked }));
// // //   };

// // //   const monthlyLabels = useMemo(() => {
// // //     if (range === "monthly" && selectedMonth && selectedYear) {
// // //       const label = `${selectedMonth} ${selectedYear}`;
// // //       return [label.toLowerCase()];
// // //     }
// // //     if (range === "quarterly" && selectedQuarter && selectedYear) {
// // //       return getQuarterLabels(selectedYear, selectedQuarter).map((l) =>
// // //         l.toLowerCase()
// // //       );
// // //     }
// // //     if (range === "yearly" && selectedYear) {
// // //       return [
// // //         `January ${selectedYear}`,
// // //         `February ${selectedYear}`,
// // //         `March ${selectedYear}`,
// // //         `April ${selectedYear}`,
// // //         `May ${selectedYear}`,
// // //         `June ${selectedYear}`,
// // //         `July ${selectedYear}`,
// // //         `August ${selectedYear}`,
// // //         `September ${selectedYear}`,
// // //         `October ${selectedYear}`,
// // //         `November ${selectedYear}`,
// // //         `December ${selectedYear}`,
// // //       ].map((l) => l.toLowerCase());
// // //     }
// // //     return [] as string[];
// // //   }, [range, selectedMonth, selectedQuarter, selectedYear]);

// // //   const processData = () => {
// // //     if (!data || data.length === 0)
// // //       return { labels: [] as string[], datasets: [] as any[], isAllZero: false };

// // //     const monthSums: Record<
// // //       string,
// // //       {
// // //         sales: number;
// // //         AmazonExpense: number;
// // //         taxncredit: number;
// // //         total_cous: number;
// // //         advertisingCosts: number;
// // //         Other: number;
// // //         profit: number;
// // //         profit2: number;
// // //       }
// // //     > = {};

// // //     data.forEach((upload) => {
// // //       const key = `${upload.month.toLowerCase()} ${upload.year}`;
// // //       if (!monthSums[key]) {
// // //         monthSums[key] = {
// // //           sales: 0,
// // //           AmazonExpense: 0,
// // //           taxncredit: 0,
// // //           total_cous: 0,
// // //           advertisingCosts: 0,
// // //           Other: 0,
// // //           profit: 0,
// // //           profit2: 0,
// // //         };
// // //       }
// // //       monthSums[key].sales += upload.total_sales;
// // //       monthSums[key].AmazonExpense += upload.total_amazon_fee;
// // //       monthSums[key].total_cous += upload.total_cous;
// // //       monthSums[key].advertisingCosts += Math.abs(upload.advertising_total);
// // //       monthSums[key].Other += Math.abs(upload.otherwplatform);
// // //       monthSums[key].taxncredit += upload.taxncredit || 0;
// // //       monthSums[key].profit += upload.cm2_profit;
// // //       monthSums[key].profit2 += upload.total_profit;
// // //     });

// // //     const labels = monthlyLabels;

// // //     if (labels.length > 0) {
// // //       const allDataValues: number[] = [];
// // //       Object.entries(selectedGraphs)
// // //         .filter(([, checked]) => checked)
// // //         .forEach(([metric]) => {
// // //           const vals = labels.map(
// // //             (l) =>
// // //               monthSums[l]?.[metric as keyof (typeof monthSums)[string]] || 0
// // //           );
// // //           allDataValues.push(...(vals as number[]));
// // //         });

// // //       const isAllZero = !allDataValues.some((v) => Math.abs(v) > 0.01);

// // //       let dataToUse = monthSums;
// // //       if (isAllZero) {
// // //         const dummy = generateDummyData(labels);
// // //         dataToUse = {};
// // //         labels.forEach((l, idx) => {
// // //           dataToUse[l] = {
// // //             sales: dummy.sales[idx],
// // //             AmazonExpense: dummy.AmazonExpense[idx],
// // //             taxncredit: dummy.taxncredit[idx],
// // //             total_cous: dummy.total_cous[idx],
// // //             advertisingCosts: dummy.advertisingCosts[idx],
// // //             Other: dummy.Other[idx],
// // //             profit: dummy.profit[idx],
// // //             profit2: dummy.profit2[idx],
// // //           };
// // //         });
// // //       }

// // //       const colorMap: Record<string, string> = {
// // //         sales: "#2CA9E0",
// // //         AmazonExpense: "#ff5c5c",
// // //         taxncredit: "#154B9B",
// // //         total_cous: "#AB64B5",
// // //         profit: "#87AD12",
// // //         advertisingCosts: "#F47A00",
// // //         Other: "#00627D",
// // //         profit2: "#5EA49B",
// // //       };

// // //       const datasets = Object.entries(selectedGraphs)
// // //         .filter(([, checked]) => checked)
// // //         .map(([metric]) => ({
// // //           // use human-friendly labels for lines
// // //           label: labelMap[metric] ?? metric,
// // //           data: labels.map(
// // //             (l) =>
// // //               dataToUse[l]?.[metric as keyof (typeof dataToUse)[string]] || 0
// // //           ),
// // //           fill: false,
// // //           borderColor: colorMap[metric] ?? "#000",
// // //           backgroundColor: colorMap[metric] ?? "#000",
// // //           tension: 0.1,
// // //         }));

// // //       return { labels, datasets, isAllZero };
// // //     }

// // //     return { labels: [], datasets: [], isAllZero: false };
// // //   };

// // //   const {
// // //     labels: rawLabels,
// // //     datasets,
// // //     isAllZero,
// // //   } = useMemo(processData, [
// // //     data,
// // //     selectedGraphs,
// // //     range,
// // //     selectedMonth,
// // //     selectedQuarter,
// // //     selectedYear,
// // //     monthlyLabels,
// // //   ]);

// // //   // useEffect(() => setAllValuesZero(isAllZero), [isAllZero]);

// // //   useEffect(() => {
// // //     setAllValuesZero(isAllZero);
// // //     console.log("GraphPage isAllZero:", isAllZero);
// // //     onNoDataChange?.(isAllZero);
// // //   }, [isAllZero, onNoDataChange]);


// // //   // X-axis tick labels like "Jan '25"
// // //   const formattedLabels = useMemo(() => {
// // //     return rawLabels.map((label) => {
// // //       const [m, y] = label.trim().split(" ");
// // //       const mm = convertToAbbreviatedMonth(m);
// // //       const yy = (y ?? "").slice(-2);
// // //       return `${mm}\u00A0'${yy}`;
// // //     });
// // //   }, [rawLabels]);

// // //   const allDataPoints = datasets.flatMap((d: any) => d.data as number[]);
// // //   const minValue = allDataPoints.length ? Math.min(...allDataPoints) : 0;
// // //   const minY = minValue < 0 ? Math.floor(minValue * 1.1) : 0;

// // //   const periodInfo = useMemo(() => {
// // //     if (range === "monthly" && selectedMonth) {
// // //       return `${convertToAbbreviatedMonth(selectedMonth)}'${String(
// // //         selectedYear
// // //       ).slice(-2)}`;
// // //     }
// // //     if (range === "quarterly" && selectedQuarter) {
// // //       return `${selectedQuarter}'${String(selectedYear).slice(-2)}`;
// // //     }
// // //     return `Year'${String(selectedYear).slice(-2)}`;
// // //   }, [range, selectedMonth, selectedQuarter, selectedYear]);

// // //   const getExtraRows = () => {
// // //     const formattedCountry =
// // //       countryName?.toLowerCase() === "global"
// // //         ? "GLOBAL"
// // //         : countryName?.toUpperCase();
// // //     return [
// // //       [`${userData?.brand_name || "N/A"}`],
// // //       [`${userData?.company_name || "N/A"}`],
// // //       [`Profit Breakup (SKU Level) - ${periodInfo}`],
// // //       [`Currency:  ${currencySymbol}`],
// // //       [`Country: ${formattedCountry}`],
// // //       [`Platform: Amazon`],
// // //     ];
// // //   };

// // //   const exportToExcel = () => {
// // //     const labelsNorm = rawLabels.map((l) => {
// // //       const [m, y] = l.split(" ");
// // //       const mm = convertToAbbreviatedMonth(m);
// // //       const yy = (y ?? "").slice(-2);
// // //       return `${mm}'${yy}`;
// // //     });

// // //     const monthSums: Record<string, any> = {};
// // //     data.forEach((upload) => {
// // //       const key = `${upload.month.toLowerCase()} ${upload.year}`;
// // //       if (!monthSums[key]) {
// // //         monthSums[key] = {
// // //           sales: 0,
// // //           AmazonExpense: 0,
// // //           total_cous: 0,
// // //           advertisingCosts: 0,
// // //           Other: 0,
// // //           net_credits: 0,
// // //           taxncredit: 0,
// // //           profit: 0,
// // //           profit2: 0,
// // //         };
// // //       }
// // //       monthSums[key].sales += upload.total_sales;
// // //       monthSums[key].total_cous += upload.total_cous;
// // //       monthSums[key].AmazonExpense += upload.total_amazon_fee;
// // //       monthSums[key].taxncredit += upload.taxncredit || 0;
// // //       monthSums[key].net_credits += upload.total_net_credits || 0;
// // //       monthSums[key].profit2 += upload.total_profit;
// // //       monthSums[key].advertisingCosts += upload.advertising_total;
// // //       monthSums[key].Other += upload.otherwplatform;
// // //       monthSums[key].profit += upload.cm2_profit;
// // //     });

// // //     const fixedOrder = [
// // //       { key: "sales", label: "Sales", sign: "(+)" },
// // //       { key: "total_cous", label: "COGS", sign: "(-)" },
// // //       { key: "AmazonExpense", label: "Amazon Fees", sign: "(-)" },
// // //       { key: "taxncredit", label: "Taxes & Credits", sign: "(+)" },
// // //       { key: "profit2", label: "CM1 Profit", sign: "" },
// // //       { key: "advertisingCosts", label: "Advertising Costs", sign: "(-)" },
// // //       { key: "Other", label: "Others", sign: "(-)" },
// // //       { key: "profit", label: "CM2 Profit", sign: "" },
// // //     ];

// // //     const header = ["Month", ...fixedOrder.map((i) => i.label)];
// // //     const signRow = [" ", ...fixedOrder.map((i) => i.sign)];
// // //     const worksheetData: (string | number)[][] = [header, signRow];

// // //     rawLabels.forEach((raw, idx) => {
// // //       const display = labelsNorm[idx];
// // //       const key = raw.toLowerCase();
// // //       const row: (string | number)[] = [display];
// // //       fixedOrder.forEach(({ key: k }) => {
// // //         const rawVal = monthSums[key]?.[k] ?? 0;
// // //         row.push(typeof rawVal === "number" ? Number(rawVal.toFixed(2)) : 0);
// // //       });
// // //       worksheetData.push(row);
// // //     });

// // //     const totalRow: (string | number)[] = ["Total"];
// // //     fixedOrder.forEach(({ key }) => {
// // //       let sum = 0;
// // //       rawLabels.forEach((raw) => {
// // //         const k = raw.toLowerCase();
// // //         sum += monthSums[k]?.[key] || 0;
// // //       });
// // //       totalRow.push(Number(sum.toFixed(2)));
// // //     });
// // //     worksheetData.push(totalRow);

// // //     const finalSheet = [...getExtraRows(), [""], ...worksheetData];

// // //     const ws = XLSX.utils.aoa_to_sheet(finalSheet);
// // //     const wb = XLSX.utils.book_new();
// // //     XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
// // //     XLSX.writeFile(wb, `Metrics-${periodInfo}.xlsx`);
// // //   };

// // //   const noMetricSelected = Object.values(selectedGraphs).every(
// // //     (v) => v === false
// // //   );

// // //   const accentClass: Record<string, string> = {
// // //     sales: "accent-sky-500",
// // //     total_cous: "accent-purple-500",
// // //     AmazonExpense: "accent-red-500",
// // //     taxncredit: "accent-blue-800",
// // //     profit2: "accent-teal-500",
// // //     advertisingCosts: "accent-orange-500",
// // //     Other: "accent-teal-700",
// // //     profit: "accent-lime-600",
// // //   };

// // //   const swatchClass: Record<string, string> = {
// // //     sales: "bg-sky-500",
// // //     total_cous: "bg-purple-500",
// // //     AmazonExpense: "bg-red-500",
// // //     taxncredit: "bg-blue-800",
// // //     profit2: "bg-teal-500",
// // //     advertisingCosts: "bg-orange-500",
// // //     Other: "bg-teal-700",
// // //     profit: "bg-lime-600",
// // //   };

// // //   const toggleMetric = (name: string) => {
// // //     const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;
// // //     const isChecked = !!selectedGraphs[name];

// // //     // prevent turning off the last metric
// // //     if (isChecked && selectedCount === 1) {
// // //       setShowModal(true);
// // //       return;
// // //     }

// // //     setSelectedGraphs((prev) => ({
// // //       ...prev,
// // //       [name]: !isChecked,
// // //     }));
// // //   };


// // //   // 👇 NEW: show loader while fetchUploadHistory is in progress
// // //   if (loading) {
// // //     return (
// // //       <div className="flex h-[260px] md:h-[320px] items-center justify-center">
// // //         <Loader
// // //           src="/infinity-unscreen.gif"
// // //           size={150}
// // //           transparent
// // //           roundedClass="rounded-full"
// // //           backgroundClass="bg-transparent"
// // //           respectReducedMotion
// // //         />
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     <div className="py-3 sm:py-4 md:y-6 relative">

// // //       {/* 🔹 everything fades when no data */}
// // //       <div className={allValuesZero ? "opacity-30 pointer-events-none" : "opacity-100"}>

// // //         <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
// // //           {/* Left: title + period */}
// // //           <div className="flex flex-wrap items-baseline gap-2 justify-center sm:justify-start">
// // //             <PageBreadcrumb
// // //               pageTitle="Tracking Profitability -"
// // //               variant="page"
// // //               align="left"
// // //               textSize="2xl"
// // //             />
// // //             <span className="text-[#5EA68E] font-bold text-lg sm:text-2xl md:text-2xl">
// // //               {countryName?.toLowerCase() === "global"
// // //                 ? "GLOBAL"
// // //                 : countryName?.toUpperCase()}
// // //             </span>
// // //           </div>

// // //           {/* Right: Download button */}
// // //           <div className="flex justify-center sm:justify-end">
// // //             <DownloadIconButton onClick={exportToExcel} />
// // //           </div>
// // //         </div>

// // //         {/* Metric toggles */}
// // //         <div
// // //           className={[
// // //             "mt-3 sm:mt-4",
// // //             "flex flex-wrap items-center justify-center",   // ✅ CENTERED
// // //             "gap-3 sm:gap-4 md:gap-5",                      // ✅ MORE SPACE BETWEEN TOGGLES
// // //             "w-full mx-auto",
// // //             allValuesZero ? "opacity-30" : "opacity-100",
// // //             "transition-opacity duration-300",
// // //           ].join(" ")}
// // //         >
// // //           {[
// // //             { name: "sales", label: "Sales", color: "#2CA9E0" },
// // //             { name: "total_cous", label: "COGS", color: "#AB64B5" },
// // //             { name: "AmazonExpense", label: "Amazon Fees", color: "#FF5C5C" },
// // //             { name: "taxncredit", label: "Taxes & Credits", color: "#154B9B" },
// // //             { name: "profit2", label: "CM1 Profit", color: "#5EA49B" },
// // //             { name: "advertisingCosts", label: "Advertising Costs", color: "#F47A00" },
// // //             { name: "Other", label: "Other", color: "#00627D" },
// // //             { name: "profit", label: "CM2 Profit", color: "#87AD12" },
// // //           ].map(({ name, label, color }) => {
// // //             const isChecked = !!selectedGraphs[name];

// // //             return (
// // //               <label
// // //                 key={name}
// // //                 className={[
// // //                   "shrink-0",
// // //                   "flex items-center gap-1 sm:gap-1.5",
// // //                   "font-semibold select-none whitespace-nowrap",
// // //                   // 👇 SAME FONT-SIZES YOU ALREADY HAD
// // //                   "text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs xl:text-sm",
// // //                   "text-charcoal-500 ",         // text color
// // //                   isChecked ? "opacity-100" : "opacity-40",
// // //                   allValuesZero ? "cursor-not-allowed" : "cursor-pointer",
// // //                 ].join(" ")}
// // //               >
// // //                 {/* Colored box */}
// // //                 <span
// // //                   className="
// // //             flex items-center justify-center
// // //             h-3 w-3 sm:h-3.5 sm:w-3.5
// // //             rounded-sm border transition
// // //           "
// // //                   style={{
// // //                     borderColor: color,
// // //                     backgroundColor: isChecked ? color : "white",
// // //                     opacity: allValuesZero ? 0.6 : 1,
// // //                   }}
// // //                   onClick={() => !allValuesZero && toggleMetric(name)}
// // //                 >
// // //                   {isChecked && (
// // //                     <svg
// // //                       viewBox="0 0 24 24"
// // //                       width="14"
// // //                       height="14"
// // //                       className="text-white"
// // //                     >
// // //                       <path
// // //                         fill="currentColor"
// // //                         d="M20.285 6.709a1 1 0 0 0-1.414-1.414L9 15.168l-3.879-3.88a1 1 0 0 0-1.414 1.415l4.586 4.586a1 1 0 0 0 1.414 0l10-10Z"
// // //                       />
// // //                     </svg>
// // //                   )}
// // //                 </span>

// // //                 <span className="capitalize">{label}</span>


// // //               </label>
// // //             );
// // //           })}
// // //         </div>



// // //         {/* Chart */}
// // //         <div className="relative mt-2 sm:mt-3">
// // //          <div
// // //     className={`flex w-full items-center justify-center
// // //       h-[320px] sm:h-[360px] md:h-[400px] lg:h-[420px]
// // //       transition-opacity duration-300
// // //       ${allValuesZero ? "opacity-30" : "opacity-100"}`}
// // //   >

// // //             {datasets.length > 0 && (
// // //               <Line
// // //                 data={{ labels: formattedLabels, datasets }}
// // //                 options={{
// // //                   responsive: true,
// // //                   maintainAspectRatio: false,
// // //                   interaction: {
// // //                     intersect: false,
// // //                     mode: allValuesZero ? "nearest" : "index",
// // //                   },
// // //                   plugins: {
// // //                     tooltip: {
// // //                       enabled: !allValuesZero,
// // //                       mode: "index",
// // //                       intersect: false,
// // //                       callbacks: {
// // //                         label: (tooltipItem: any) => {
// // //                           // dataset.label already contains pretty label (e.g. "Sales")
// // //                           const displayLabel =
// // //                             (tooltipItem.dataset.label as string) || "";
// // //                           const value = tooltipItem.raw as number;
// // //                           return `${displayLabel}: ${currencySymbol} ${value.toLocaleString(
// // //                             undefined,
// // //                             {
// // //                               minimumFractionDigits: 2,
// // //                               maximumFractionDigits: 2,
// // //                             }
// // //                           )}`;
// // //                         },
// // //                       },
// // //                     },
// // //                     legend: { display: false },
// // //                   },
// // //                   scales: {
// // //                     x: {
// // //                       title: { display: true, text: "Month" },
// // //                       ticks: {
// // //                         minRotation: 0,
// // //                         maxRotation: 0,
// // //                         // IMPORTANT: always show the tick if there's only 1 label (monthly case)
// // //                         autoSkip: formattedLabels.length > 6,
// // //                         maxTicksLimit:
// // //                           formattedLabels.length > 0
// // //                             ? formattedLabels.length
// // //                             : 12,
// // //                         callback: (_v, idx) =>
// // //                           String(formattedLabels[idx] ?? ""),
// // //                       },
// // //                     },
// // //                     y: {
// // //                       title: {
// // //                         display: true,
// // //                         text: `Amount (${currencySymbol})`,
// // //                       },
// // //                       min: minY,
// // //                       ticks: { padding: 0 },
// // //                     },
// // //                   },
// // //                 }}
// // //               />
// // //             )}
// // //           </div>

// // //           {/* Must select >= 1 metric */}
// // //           {noMetricSelected && (
// // //             <ModalMsg
// // //               show={showModal}
// // //               onClose={() => setShowModal(false)}
// // //               message="At least one metric must be selected to display the graph."
// // //             />
// // //           )}


// // //         </div>

// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default GraphPage;








































// // "use client";

// // import React, { useEffect, useMemo, useState } from "react";
// // import "@/lib/chartSetup";
// // import { Line } from "react-chartjs-2";
// // import {
// //   Chart as ChartJS,
// //   CategoryScale,
// //   LinearScale,
// //   LineElement,
// //   PointElement,
// //   Title as ChartTitle,
// //   Tooltip,
// //   Legend,
// // } from "chart.js";
// // import * as XLSX from "xlsx";
// // import { useRouter } from "next/navigation";
// // import ModalMsg from "@/components/common/ModalMsg";
// // import Button from "../ui/button/Button";
// // import PageBreadcrumb from "../common/PageBreadCrumb";
// // import { FiDownload } from "react-icons/fi";
// // import Loader from "@/components/loader/Loader";
// // import DownloadIconButton from "../ui/button/DownloadIconButton";

// // ChartJS.register(
// //   CategoryScale,
// //   LinearScale,
// //   LineElement,
// //   PointElement,
// //   ChartTitle,
// //   Tooltip,
// //   Legend
// // );

// // type GraphPageProps = {
// //   range: "monthly" | "quarterly" | "yearly";
// //   selectedMonth?: string;
// //   selectedQuarter?: "Q1" | "Q2" | "Q3" | "Q4";
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
// //   total_net_credits?: number;
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

// // const GraphPage: React.FC<GraphPageProps> = ({
// //   range,
// //   selectedMonth,
// //   selectedQuarter,
// //   selectedYear,
// //   countryName,
// //   onNoDataChange,
// // }) => {
// //   const router = useRouter();
// //   const currencySymbol = countryName ? getCurrencySymbol(countryName) : "¤";

// //   const [data, setData] = useState<UploadRow[]>([]);
// //   const [allValuesZero, setAllValuesZero] = useState(false);
// //   const [showModal, setShowModal] = useState(false);
// //   const [loading, setLoading] = useState<boolean>(true);

// //   const [selectedGraphs, setSelectedGraphs] = useState<Record<string, boolean>>({
// //     sales: true,
// //     total_cous: true,
// //     AmazonExpense: true,
// //     taxncredit: true,
// //     profit2: true,
// //     advertisingCosts: true,
// //     Other: true,
// //     profit: true,
// //   });

// //   const token =
// //     typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
// //   const [fetchError, setFetchError] = useState<string | null>(null);
// //   const [userData, setUserData] = useState<{
// //     company_name?: string;
// //     brand_name?: string;
// //   } | null>(null);

// //   const generateDummyData = (labels: string[]) => {
// //     const dummyMetrics: Record<string, number[]> = {
// //       sales: labels.map(
// //         (_, index) => 15000 + Math.random() * 5000 + index * 1000
// //       ),
// //       AmazonExpense: labels.map(
// //         (_, index) => 3000 + Math.random() * 1000 + index * 200
// //       ),
// //       total_cous: labels.map(
// //         (_, index) => 8000 + Math.random() * 2000 + index * 500
// //       ),
// //       advertisingCosts: labels.map(
// //         (_, index) => 2000 + Math.random() * 800 + index * 150
// //       ),
// //       Other: labels.map(
// //         (_, index) => 1000 + Math.random() * 500 + index * 100
// //       ),
// //       taxncredit: labels.map(
// //         (_, index) => 500 + Math.random() * 300 + index * 50
// //       ),
// //       profit: labels.map(
// //         (_, index) => 1500 + Math.random() * 800 + index * 200
// //       ),
// //       profit2: labels.map(
// //         (_, index) => 2000 + Math.random() * 1000 + index * 250
// //       ),
// //     };
// //     return dummyMetrics;
// //   };

// //   const getQuarterLabels = (
// //     year: number | string,
// //     quarter: "Q1" | "Q2" | "Q3" | "Q4"
// //   ) => {
// //     const qMap: Record<string, string[]> = {
// //       Q1: ["january", "february", "march"],
// //       Q2: ["april", "may", "june"],
// //       Q3: ["july", "august", "september"],
// //       Q4: ["october", "november", "december"],
// //     };
// //     return qMap[quarter]?.map((m) => `${m} ${year}`) ?? [];
// //   };

// //   const capitalizeFirstLetter = (str: string) =>
// //     str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
// //   const convertToAbbreviatedMonth = (m?: string) =>
// //     m ? capitalizeFirstLetter(m).slice(0, 3) : "";

// //   const getTitle = () => {
// //     if (range === "quarterly" && selectedQuarter) {
// //       return `${capitalizeFirstLetter(
// //         range
// //       )} Tracking Profitability - ${selectedQuarter}'${String(selectedYear).slice(
// //         -2
// //       )}`;
// //     }
// //     if (range === "monthly" && selectedMonth) {
// //       return `${capitalizeFirstLetter(
// //         range
// //       )} Tracking Profitability - ${convertToAbbreviatedMonth(
// //         selectedMonth
// //       )} ${selectedYear}`;
// //     }
// //     return `${capitalizeFirstLetter(range)} Tracking Profitability - ${selectedYear}`;
// //   };

// //   const labelMap: Record<string, string> = {
// //     sales: "Sales",
// //     total_cous: "COGS",
// //     taxncredit: "Taxes & Credits",
// //     AmazonExpense: "Amazon Fees",
// //     advertisingCosts: "Advertising Costs",
// //     Other: "Other",
// //     profit: "CM2 Profit",
// //     profit2: "CM1 Profit",
// //   };

// //   useEffect(() => {
// //     const fetchUploadHistory = async () => {
// //       try {
// //         if (!token) {
// //           setLoading(false);
// //           return;
// //         }
// //         setLoading(true);
// //         const resp = await fetch(`http://127.0.0.1:5000/upload_history`, {
// //           method: "GET",
// //           headers: { Authorization: `Bearer ${token}` },
// //         });
// //         const json = await resp.json();
// //         if (json?.uploads) {
// //           const filtered = (json.uploads as UploadRow[]).filter(
// //             (item) => item.country.toLowerCase() === countryName.toLowerCase()
// //           );
// //           setData(filtered);
// //         }
// //       } catch (e) {
// //         console.error("Failed to fetch upload history:", e);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchUploadHistory();
// //   }, [countryName, token]);

// //   useEffect(() => {
// //     const fetchUser = async () => {
// //       if (!token) {
// //         setFetchError("No token found. Please log in.");
// //         return;
// //       }
// //       try {
// //         const response = await fetch("http://127.0.0.1:5000/get_user_data", {
// //           method: "GET",
// //           headers: { Authorization: `Bearer ${token}` },
// //         });
// //         if (!response.ok) {
// //           const j = await response.json().catch(() => ({}));
// //           setFetchError(j?.error || "Something went wrong.");
// //           return;
// //         }
// //         const j = await response.json();
// //         setUserData(j);
// //       } catch {
// //         setFetchError("Error fetching user data");
// //       }
// //     };
// //     fetchUser();
// //   }, [token]);

// //   const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const { name, checked } = e.target;
// //     const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;
// //     if (!checked && selectedCount === 1) {
// //       setShowModal(true);
// //       return;
// //     }
// //     setSelectedGraphs((prev) => ({ ...prev, [name]: checked }));
// //   };

// //   const monthlyLabels = useMemo(() => {
// //     if (range === "monthly" && selectedMonth && selectedYear) {
// //       const label = `${selectedMonth} ${selectedYear}`;
// //       return [label.toLowerCase()];
// //     }
// //     if (range === "quarterly" && selectedQuarter && selectedYear) {
// //       return getQuarterLabels(selectedYear, selectedQuarter).map((l) =>
// //         l.toLowerCase()
// //       );
// //     }
// //     if (range === "yearly" && selectedYear) {
// //       return [
// //         `January ${selectedYear}`,
// //         `February ${selectedYear}`,
// //         `March ${selectedYear}`,
// //         `April ${selectedYear}`,
// //         `May ${selectedYear}`,
// //         `June ${selectedYear}`,
// //         `July ${selectedYear}`,
// //         `August ${selectedYear}`,
// //         `September ${selectedYear}`,
// //         `October ${selectedYear}`,
// //         `November ${selectedYear}`,
// //         `December ${selectedYear}`,
// //       ].map((l) => l.toLowerCase());
// //     }
// //     return [] as string[];
// //   }, [range, selectedMonth, selectedQuarter, selectedYear]);

// //   const processData = () => {
// //     if (!data || data.length === 0)
// //       return { labels: [] as string[], datasets: [] as any[], isAllZero: false };

// //     const monthSums: Record<
// //       string,
// //       {
// //         sales: number;
// //         AmazonExpense: number;
// //         taxncredit: number;
// //         total_cous: number;
// //         advertisingCosts: number;
// //         Other: number;
// //         profit: number;
// //         profit2: number;
// //       }
// //     > = {};

// //     data.forEach((upload) => {
// //       const key = `${upload.month.toLowerCase()} ${upload.year}`;
// //       if (!monthSums[key]) {
// //         monthSums[key] = {
// //           sales: 0,
// //           AmazonExpense: 0,
// //           taxncredit: 0,
// //           total_cous: 0,
// //           advertisingCosts: 0,
// //           Other: 0,
// //           profit: 0,
// //           profit2: 0,
// //         };
// //       }
// //       monthSums[key].sales += upload.total_sales;
// //       monthSums[key].AmazonExpense += upload.total_amazon_fee;
// //       monthSums[key].total_cous += upload.total_cous;
// //       monthSums[key].advertisingCosts += Math.abs(upload.advertising_total);
// //       monthSums[key].Other += Math.abs(upload.otherwplatform);
// //       monthSums[key].taxncredit += upload.taxncredit || 0;
// //       monthSums[key].profit += upload.cm2_profit;
// //       monthSums[key].profit2 += upload.total_profit;
// //     });

// //     const labels = monthlyLabels;

// //     if (labels.length > 0) {
// //       const allDataValues: number[] = [];
// //       Object.entries(selectedGraphs)
// //         .filter(([, checked]) => checked)
// //         .forEach(([metric]) => {
// //           const vals = labels.map(
// //             (l) =>
// //               monthSums[l]?.[metric as keyof (typeof monthSums)[string]] || 0
// //           );
// //           allDataValues.push(...(vals as number[]));
// //         });

// //       const isAllZero = !allDataValues.some((v) => Math.abs(v) > 0.01);

// //       let dataToUse = monthSums;
// //       if (isAllZero) {
// //         const dummy = generateDummyData(labels);
// //         dataToUse = {};
// //         labels.forEach((l, idx) => {
// //           dataToUse[l] = {
// //             sales: dummy.sales[idx],
// //             AmazonExpense: dummy.AmazonExpense[idx],
// //             taxncredit: dummy.taxncredit[idx],
// //             total_cous: dummy.total_cous[idx],
// //             advertisingCosts: dummy.advertisingCosts[idx],
// //             Other: dummy.Other[idx],
// //             profit: dummy.profit[idx],
// //             profit2: dummy.profit2[idx],
// //           };
// //         });
// //       }

// //       const colorMap: Record<string, string> = {
// //         sales: "#2CA9E0",
// //         AmazonExpense: "#ff5c5c",
// //         taxncredit: "#FFBE26",
// //         total_cous: "#AB64B5",
// //         profit: "#5EA49B",
// //         advertisingCosts: "#F47A00",
// //         Other: "#00627D",
// //         profit2: "#87AD12",
// //       };

// //       const datasets = Object.entries(selectedGraphs)
// //         .filter(([, checked]) => checked)
// //         .map(([metric]) => ({
// //           label: labelMap[metric] ?? metric,
// //           data: labels.map(
// //             (l) =>
// //               dataToUse[l]?.[metric as keyof (typeof dataToUse)[string]] || 0
// //           ),
// //           fill: false,
// //           borderColor: colorMap[metric] ?? "#000",
// //           backgroundColor: colorMap[metric] ?? "#000",
// //           tension: 0.1,
// //         }));

// //       return { labels, datasets, isAllZero };
// //     }

// //     return { labels: [], datasets: [], isAllZero: false };
// //   };

// //   const {
// //     labels: rawLabels,
// //     datasets,
// //     isAllZero,
// //   } = useMemo(processData, [
// //     data,
// //     selectedGraphs,
// //     range,
// //     selectedMonth,
// //     selectedQuarter,
// //     selectedYear,
// //     monthlyLabels,
// //   ]);

// //   useEffect(() => {
// //     setAllValuesZero(isAllZero);
// //     onNoDataChange?.(isAllZero);
// //   }, [isAllZero, onNoDataChange]);

// //   const formattedLabels = useMemo(() => {
// //     return rawLabels.map((label) => {
// //       const [m, y] = label.trim().split(" ");
// //       const mm = convertToAbbreviatedMonth(m);
// //       const yy = (y ?? "").slice(-2);
// //       return `${mm}\u00A0'${yy}`;
// //     });
// //   }, [rawLabels]);

// //   const allDataPoints = datasets.flatMap((d: any) => d.data as number[]);
// //   const minValue = allDataPoints.length ? Math.min(...allDataPoints) : 0;
// //   const minY = minValue < 0 ? Math.floor(minValue * 1.1) : 0;

// //   const periodInfo = useMemo(() => {
// //     if (range === "monthly" && selectedMonth) {
// //       return `${convertToAbbreviatedMonth(selectedMonth)}'${String(
// //         selectedYear
// //       ).slice(-2)}`;
// //     }
// //     if (range === "quarterly" && selectedQuarter) {
// //       return `${selectedQuarter}'${String(selectedYear).slice(-2)}`;
// //     }
// //     return `Year'${String(selectedYear).slice(-2)}`;
// //   }, [range, selectedMonth, selectedQuarter, selectedYear]);

// //   const getExtraRows = () => {
// //     const formattedCountry =
// //       countryName?.toLowerCase() === "global"
// //         ? "GLOBAL"
// //         : countryName?.toUpperCase();
// //     return [
// //       [`${userData?.brand_name || "N/A"}`],
// //       [`${userData?.company_name || "N/A"}`],
// //       [`Profit Breakup (SKU Level) - ${periodInfo}`],
// //       [`Currency:  ${currencySymbol}`],
// //       [`Country: ${formattedCountry}`],
// //       [`Platform: Amazon`],
// //     ];
// //   };

// //   const exportToExcel = () => {
// //     const labelsNorm = rawLabels.map((l) => {
// //       const [m, y] = l.split(" ");
// //       const mm = convertToAbbreviatedMonth(m);
// //       const yy = (y ?? "").slice(-2);
// //       return `${mm}'${yy}`;
// //     });

// //     const monthSums: Record<string, any> = {};
// //     data.forEach((upload) => {
// //       const key = `${upload.month.toLowerCase()} ${upload.year}`;
// //       if (!monthSums[key]) {
// //         monthSums[key] = {
// //           sales: 0,
// //           AmazonExpense: 0,
// //           total_cous: 0,
// //           advertisingCosts: 0,
// //           Other: 0,
// //           net_credits: 0,
// //           taxncredit: 0,
// //           profit: 0,
// //           profit2: 0,
// //         };
// //       }
// //       monthSums[key].sales += upload.total_sales;
// //       monthSums[key].total_cous += upload.total_cous;
// //       monthSums[key].AmazonExpense += upload.total_amazon_fee;
// //       monthSums[key].taxncredit += upload.taxncredit || 0;
// //       monthSums[key].net_credits += upload.total_net_credits || 0;
// //       monthSums[key].profit2 += upload.total_profit;
// //       monthSums[key].advertisingCosts += upload.advertising_total;
// //       monthSums[key].Other += upload.otherwplatform;
// //       monthSums[key].profit += upload.cm2_profit;
// //     });

// //     const fixedOrder = [
// //       { key: "sales", label: "Sales", sign: "(+)" },
// //       { key: "total_cous", label: "COGS", sign: "(-)" },
// //       { key: "AmazonExpense", label: "Amazon Fees", sign: "(-)" },
// //       { key: "taxncredit", label: "Taxes & Credits", sign: "(+)" },
// //       { key: "profit2", label: "CM1 Profit", sign: "" },
// //       { key: "advertisingCosts", label: "Advertising Costs", sign: "(-)" },
// //       { key: "Other", label: "Others", sign: "(-)" },
// //       { key: "profit", label: "CM2 Profit", sign: "" },
// //     ];

// //     const header = ["Month", ...fixedOrder.map((i) => i.label)];
// //     const signRow = [" ", ...fixedOrder.map((i) => i.sign)];
// //     const worksheetData: (string | number)[][] = [header, signRow];

// //     rawLabels.forEach((raw, idx) => {
// //       const display = labelsNorm[idx];
// //       const key = raw.toLowerCase();
// //       const row: (string | number)[] = [display];
// //       fixedOrder.forEach(({ key: k }) => {
// //         const rawVal = monthSums[key]?.[k] ?? 0;
// //         row.push(typeof rawVal === "number" ? Number(rawVal.toFixed(2)) : 0);
// //       });
// //       worksheetData.push(row);
// //     });

// //     const totalRow: (string | number)[] = ["Total"];
// //     fixedOrder.forEach(({ key }) => {
// //       let sum = 0;
// //       rawLabels.forEach((raw) => {
// //         const k = raw.toLowerCase();
// //         sum += monthSums[k]?.[key] || 0;
// //       });
// //       totalRow.push(Number(sum.toFixed(2)));
// //     });
// //     worksheetData.push(totalRow);

// //     const finalSheet = [...getExtraRows(), [""], ...worksheetData];

// //     const ws = XLSX.utils.aoa_to_sheet(finalSheet);
// //     const wb = XLSX.utils.book_new();
// //     XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
// //     XLSX.writeFile(wb, `Metrics-${periodInfo}.xlsx`);
// //   };

// //   const noMetricSelected = Object.values(selectedGraphs).every(
// //     (v) => v === false
// //   );

// //   const toggleMetric = (name: string) => {
// //     const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;
// //     const isChecked = !!selectedGraphs[name];

// //     if (isChecked && selectedCount === 1) {
// //       setShowModal(true);
// //       return;
// //     }

// //     setSelectedGraphs((prev) => ({
// //       ...prev,
// //       [name]: !isChecked,
// //     }));
// //   };

// //   return (
// //     <div className="relative w-full rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
// //       {loading ? (
// //         <div className="flex h-[260px] md:h-[320px] items-center justify-center">
// //           <Loader
// //             src="/infinity-unscreen.gif"
// //             size={150}
// //             transparent
// //             roundedClass="rounded-full"
// //             backgroundClass="bg-transparent"
// //             respectReducedMotion
// //           />
// //         </div>
// //       ) : (
// //         <div
// //           className={
// //             allValuesZero ? "opacity-30 pointer-events-none" : "opacity-100"
// //           }
// //         >
// //           {/* Header row */}
// //           <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
// //             <div className="flex flex-wrap items-baseline gap-2 justify-center sm:justify-start">
// //               <PageBreadcrumb
// //                 pageTitle="Tracking Profitability -"
// //                 variant="page"
// //                 align="left"
// //                 textSize="2xl"
// //               />
// //               <span className="text-[#5EA68E] font-bold text-lg sm:text-2xl md:text-2xl">
// //                 {countryName?.toLowerCase() === "global"
// //                   ? "GLOBAL"
// //                   : countryName?.toUpperCase()}
// //               </span>
// //             </div>

// //             <div className="flex justify-center sm:justify-end">
// //               <DownloadIconButton onClick={exportToExcel} />
// //             </div>
// //           </div>

// //           {/* Metric toggles */}
// //           <div
// //             className={[
// //               "mt-3 sm:mt-4",
// //               "flex flex-wrap items-center justify-center",
// //               "gap-3 sm:gap-4 md:gap-5",
// //               "w-full mx-auto",
// //               allValuesZero ? "opacity-30" : "opacity-100",
// //               "transition-opacity duration-300",
// //             ].join(" ")}
// //           >
// //             {[
// //               { name: "sales", label: "Sales", color: "#2CA9E0" },
// //               { name: "total_cous", label: "COGS", color: "#AB64B5" },
// //               { name: "AmazonExpense", label: "Amazon Fees", color: "#FF5C5C" },
// //               { name: "taxncredit", label: "Taxes & Credits", color: "#FFBE26" },
// //               { name: "profit2", label: "CM1 Profit", color: "#87AD12" },
// //               {
// //                 name: "advertisingCosts",
// //                 label: "Advertising Costs",
// //                 color: "#F47A00",
// //               },
// //               { name: "Other", label: "Other", color: "#00627D" },
// //               { name: "profit", label: "CM2 Profit", color: "#5EA49B" },
// //             ].map(({ name, label, color }) => {
// //               const isChecked = !!selectedGraphs[name];

// //               return (
// //                 <label
// //                   key={name}
// //                   className={[
// //                     "shrink-0",
// //                     "flex items-center gap-1 sm:gap-1.5",
// //                     "font-semibold select-none whitespace-nowrap",
// //                     "text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs xl:text-sm",
// //                     "text-charcoal-500",
// //                     isChecked ? "opacity-100" : "opacity-40",
// //                     allValuesZero ? "cursor-not-allowed" : "cursor-pointer",
// //                   ].join(" ")}
// //                 >
// //                   <span
// //                     className="
// //                       flex items-center justify-center
// //                       h-3 w-3 sm:h-3.5 sm:w-3.5
// //                       rounded-sm border transition
// //                     "
// //                     style={{
// //                       borderColor: color,
// //                       backgroundColor: isChecked ? color : "white",
// //                       opacity: allValuesZero ? 0.6 : 1,
// //                     }}
// //                     onClick={() => !allValuesZero && toggleMetric(name)}
// //                   >
// //                     {isChecked && (
// //                       <svg
// //                         viewBox="0 0 24 24"
// //                         width="14"
// //                         height="14"
// //                         className="text-white"
// //                       >
// //                         <path
// //                           fill="currentColor"
// //                           d="M20.285 6.709a1 1 0 0 0-1.414-1.414L9 15.168l-3.879-3.88a1 1 0 0 0-1.414 1.415l4.586 4.586a1 1 0 0 0 1.414 0l10-10Z"
// //                         />
// //                       </svg>
// //                     )}
// //                   </span>
// //                   <span className="capitalize">{label}</span>
// //                 </label>
// //               );
// //             })}
// //           </div>

// //           {/* Chart */}
// //           <div className="relative mt-2 sm:mt-3">
// //             <div
// //               className={`flex w-full items-center justify-center
// //                 h-[320px] sm:h-[360px] md:h-[400px] lg:h-[420px]
// //                 transition-opacity duration-300
// //                 ${allValuesZero ? "opacity-30" : "opacity-100"}`}
// //             >
// //               {datasets.length > 0 && (
// //                 <Line
// //                   data={{ labels: formattedLabels, datasets }}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     interaction: {
// //                       intersect: false,
// //                       mode: allValuesZero ? "nearest" : "index",
// //                     },
// //                     plugins: {
// //                       tooltip: {
// //                         enabled: !allValuesZero,
// //                         mode: "index",
// //                         intersect: false,
// //                         callbacks: {
// //                           label: (tooltipItem: any) => {
// //                             const displayLabel =
// //                               (tooltipItem.dataset.label as string) || "";
// //                             const value = tooltipItem.raw as number;
// //                             return `${displayLabel}: ${currencySymbol} ${value.toLocaleString(
// //                               undefined,
// //                               {
// //                                 minimumFractionDigits: 2,
// //                                 maximumFractionDigits: 2,
// //                               }
// //                             )}`;
// //                           },
// //                         },
// //                       },
// //                       legend: { display: false },
// //                     },
// //                     scales: {
// //                       x: {
// //                         title: { display: true, text: "Month" },
// //                         ticks: {
// //                           minRotation: 0,
// //                           maxRotation: 0,
// //                           autoSkip: formattedLabels.length > 6,
// //                           maxTicksLimit:
// //                             formattedLabels.length > 0
// //                               ? formattedLabels.length
// //                               : 12,
// //                           callback: (_v, idx) =>
// //                             String(formattedLabels[idx] ?? ""),
// //                         },
// //                       },
// //                       y: {
// //                         title: {
// //                           display: true,
// //                           text: `Amount (${currencySymbol})`,
// //                         },
// //                         min: minY,
// //                         ticks: { padding: 0 },
// //                       },
// //                     },
// //                   }}
// //                 />
// //               )}
// //             </div>

// //             {/* Must select >= 1 metric */}
// //             {noMetricSelected && (
// //               <ModalMsg
// //                 show={showModal}
// //                 onClose={() => setShowModal(false)}
// //                 message="At least one metric must be selected to display the graph."
// //               />
// //             )}
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default GraphPage;


































// // "use client";

// // import React, { useEffect, useMemo, useState } from "react";
// // import "@/lib/chartSetup";
// // import { Line } from "react-chartjs-2";
// // import {
// //   Chart as ChartJS,
// //   CategoryScale,
// //   LinearScale,
// //   LineElement,
// //   PointElement,
// //   Title as ChartTitle,
// //   Tooltip,
// //   Legend,
// // } from "chart.js";
// // import * as XLSX from "xlsx";
// // import { useRouter } from "next/navigation";
// // import ModalMsg from "@/components/common/ModalMsg";
// // import Button from "../ui/button/Button";
// // import PageBreadcrumb from "../common/PageBreadCrumb";
// // import { FiDownload } from "react-icons/fi";
// // import Loader from "@/components/loader/Loader";
// // import DownloadIconButton from "../ui/button/DownloadIconButton";

// // ChartJS.register(
// //   CategoryScale,
// //   LinearScale,
// //   LineElement,
// //   PointElement,
// //   ChartTitle,
// //   Tooltip,
// //   Legend
// // );

// // type GraphPageProps = {
// //   range: "monthly" | "quarterly" | "yearly";
// //   selectedMonth?: string;
// //   selectedQuarter?: "Q1" | "Q2" | "Q3" | "Q4";
// //   selectedYear: number | string;
// //   countryName: string;
// //   homeCurrency: string;            // 👈 NEW
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
// //   total_net_credits?: number;
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


// // const GraphPage: React.FC<GraphPageProps> = ({
// //   range,
// //   selectedMonth,
// //   selectedQuarter,
// //   selectedYear,
// //   countryName,
// //   homeCurrency,          // 👈 NEW
// //   onNoDataChange,
// // }) => {
// //   const router = useRouter();

// //   const normalizedHomeCurrency = (homeCurrency || "usd").toLowerCase(); // 👈 ensure lowercase like inr,usd,gbp,cad
// //   const currencySymbol = getCurrencySymbol(normalizedHomeCurrency);

// //   const [data, setData] = useState<UploadRow[]>([]);
// //   const [allValuesZero, setAllValuesZero] = useState(false);
// //   const [showModal, setShowModal] = useState(false);
// //   const [loading, setLoading] = useState<boolean>(true);

// //   const [selectedGraphs, setSelectedGraphs] = useState<Record<string, boolean>>({
// //     sales: true,
// //     total_cous: true,
// //     AmazonExpense: true,
// //     taxncredit: true,
// //     profit2: true,
// //     advertisingCosts: true,
// //     Other: true,
// //     profit: true,
// //   });

// //   const token =
// //     typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
// //   const [fetchError, setFetchError] = useState<string | null>(null);
// //   const [userData, setUserData] = useState<{
// //     company_name?: string;
// //     brand_name?: string;
// //   } | null>(null);

// //   const generateDummyData = (labels: string[]) => {
// //     const dummyMetrics: Record<string, number[]> = {
// //       sales: labels.map(
// //         (_, index) => 15000 + Math.random() * 5000 + index * 1000
// //       ),
// //       AmazonExpense: labels.map(
// //         (_, index) => 3000 + Math.random() * 1000 + index * 200
// //       ),
// //       total_cous: labels.map(
// //         (_, index) => 8000 + Math.random() * 2000 + index * 500
// //       ),
// //       advertisingCosts: labels.map(
// //         (_, index) => 2000 + Math.random() * 800 + index * 150
// //       ),
// //       Other: labels.map(
// //         (_, index) => 1000 + Math.random() * 500 + index * 100
// //       ),
// //       taxncredit: labels.map(
// //         (_, index) => 500 + Math.random() * 300 + index * 50
// //       ),
// //       profit: labels.map(
// //         (_, index) => 1500 + Math.random() * 800 + index * 200
// //       ),
// //       profit2: labels.map(
// //         (_, index) => 2000 + Math.random() * 1000 + index * 250
// //       ),
// //     };
// //     return dummyMetrics;
// //   };

// //   const getQuarterLabels = (
// //     year: number | string,
// //     quarter: "Q1" | "Q2" | "Q3" | "Q4"
// //   ) => {
// //     const qMap: Record<string, string[]> = {
// //       Q1: ["january", "february", "march"],
// //       Q2: ["april", "may", "june"],
// //       Q3: ["july", "august", "september"],
// //       Q4: ["october", "november", "december"],
// //     };
// //     return qMap[quarter]?.map((m) => `${m} ${year}`) ?? [];
// //   };

// //   const capitalizeFirstLetter = (str: string) =>
// //     str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
// //   const convertToAbbreviatedMonth = (m?: string) =>
// //     m ? capitalizeFirstLetter(m).slice(0, 3) : "";

// //   const getTitle = () => {
// //     if (range === "quarterly" && selectedQuarter) {
// //       return `${capitalizeFirstLetter(
// //         range
// //       )} Tracking Profitability - ${selectedQuarter}'${String(selectedYear).slice(
// //         -2
// //       )}`;
// //     }
// //     if (range === "monthly" && selectedMonth) {
// //       return `${capitalizeFirstLetter(
// //         range
// //       )} Tracking Profitability - ${convertToAbbreviatedMonth(
// //         selectedMonth
// //       )} ${selectedYear}`;
// //     }
// //     return `${capitalizeFirstLetter(range)} Tracking Profitability - ${selectedYear}`;
// //   };

// //   const labelMap: Record<string, string> = {
// //     sales: "Sales",
// //     total_cous: "COGS",
// //     taxncredit: "Taxes & Credits",
// //     AmazonExpense: "Amazon Fees",
// //     advertisingCosts: "Advertising Costs",
// //     Other: "Other",
// //     profit: "CM2 Profit",
// //     profit2: "CM1 Profit",
// //   };

// //   // 🔹 Fetch upload history (with homeCurrency)
// //   useEffect(() => {
// //     const fetchUploadHistory = async () => {
// //       try {
// //         if (!token) {
// //           setLoading(false);
// //           return;
// //         }
// //         setLoading(true);

// //         const url = new URL("http://127.0.0.1:5000/upload_history");
// //         url.searchParams.set("homeCurrency", normalizedHomeCurrency); // 👈 pass lowercase homeCurrency

// //         const resp = await fetch(url.toString(), {
// //           method: "GET",
// //           headers: { Authorization: `Bearer ${token}` },
// //         });
// //         const json = await resp.json();
// //         if (json?.uploads) {
// //           const filtered = (json.uploads as UploadRow[]).filter(
// //             (item) => item.country.toLowerCase() === countryName.toLowerCase()
// //           );
// //           setData(filtered);
// //         }
// //       } catch (e) {
// //         console.error("Failed to fetch upload history:", e);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchUploadHistory();
// //   }, [countryName, token, normalizedHomeCurrency]); // 👈 include homeCurrency

// //   useEffect(() => {
// //     const fetchUser = async () => {
// //       if (!token) {
// //         setFetchError("No token found. Please log in.");
// //         return;
// //       }
// //       try {
// //         const response = await fetch("http://127.0.0.1:5000/get_user_data", {
// //           method: "GET",
// //           headers: { Authorization: `Bearer ${token}` },
// //         });
// //         if (!response.ok) {
// //           const j = await response.json().catch(() => ({}));
// //           setFetchError(j?.error || "Something went wrong.");
// //           return;
// //         }
// //         const j = await response.json();
// //         setUserData(j);
// //       } catch {
// //         setFetchError("Error fetching user data");
// //       }
// //     };
// //     fetchUser();
// //   }, [token]);

// //   const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const { name, checked } = e.target;
// //     const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;
// //     if (!checked && selectedCount === 1) {
// //       setShowModal(true);
// //       return;
// //     }
// //     setSelectedGraphs((prev) => ({ ...prev, [name]: checked }));
// //   };

// //   const monthlyLabels = useMemo(() => {
// //     if (range === "monthly" && selectedMonth && selectedYear) {
// //       const label = `${selectedMonth} ${selectedYear}`;
// //       return [label.toLowerCase()];
// //     }
// //     if (range === "quarterly" && selectedQuarter && selectedYear) {
// //       return getQuarterLabels(selectedYear, selectedQuarter).map((l) =>
// //         l.toLowerCase()
// //       );
// //     }
// //     if (range === "yearly" && selectedYear) {
// //       return [
// //         `January ${selectedYear}`,
// //         `February ${selectedYear}`,
// //         `March ${selectedYear}`,
// //         `April ${selectedYear}`,
// //         `May ${selectedYear}`,
// //         `June ${selectedYear}`,
// //         `July ${selectedYear}`,
// //         `August ${selectedYear}`,
// //         `September ${selectedYear}`,
// //         `October ${selectedYear}`,
// //         `November ${selectedYear}`,
// //         `December ${selectedYear}`,
// //       ].map((l) => l.toLowerCase());
// //     }
// //     return [] as string[];
// //   }, [range, selectedMonth, selectedQuarter, selectedYear]);

// //   const processData = () => {
// //     if (!data || data.length === 0)
// //       return { labels: [] as string[], datasets: [] as any[], isAllZero: false };

// //     const monthSums: Record<
// //       string,
// //       {
// //         sales: number;
// //         AmazonExpense: number;
// //         taxncredit: number;
// //         total_cous: number;
// //         advertisingCosts: number;
// //         Other: number;
// //         profit: number;
// //         profit2: number;
// //       }
// //     > = {};

// //     data.forEach((upload) => {
// //       const key = `${upload.month.toLowerCase()} ${upload.year}`;
// //       if (!monthSums[key]) {
// //         monthSums[key] = {
// //           sales: 0,
// //           AmazonExpense: 0,
// //           taxncredit: 0,
// //           total_cous: 0,
// //           advertisingCosts: 0,
// //           Other: 0,
// //           profit: 0,
// //           profit2: 0,
// //         };
// //       }
// //       monthSums[key].sales += upload.total_sales;
// //       monthSums[key].AmazonExpense += upload.total_amazon_fee;
// //       monthSums[key].total_cous += upload.total_cous;
// //       monthSums[key].advertisingCosts += Math.abs(upload.advertising_total);
// //       monthSums[key].Other += Math.abs(upload.otherwplatform);
// //       monthSums[key].taxncredit += upload.taxncredit || 0;
// //       monthSums[key].profit += upload.cm2_profit;
// //       monthSums[key].profit2 += upload.total_profit;
// //     });

// //     const labels = monthlyLabels;

// //     if (labels.length > 0) {
// //       const allDataValues: number[] = [];
// //       Object.entries(selectedGraphs)
// //         .filter(([, checked]) => checked)
// //         .forEach(([metric]) => {
// //           const vals = labels.map(
// //             (l) =>
// //               monthSums[l]?.[metric as keyof (typeof monthSums)[string]] || 0
// //           );
// //           allDataValues.push(...(vals as number[]));
// //         });

// //       const isAllZero = !allDataValues.some((v) => Math.abs(v) > 0.01);

// //       let dataToUse = monthSums;
// //       if (isAllZero) {
// //         const dummy = generateDummyData(labels);
// //         dataToUse = {};
// //         labels.forEach((l, idx) => {
// //           dataToUse[l] = {
// //             sales: dummy.sales[idx],
// //             AmazonExpense: dummy.AmazonExpense[idx],
// //             taxncredit: dummy.taxncredit[idx],
// //             total_cous: dummy.total_cous[idx],
// //             advertisingCosts: dummy.advertisingCosts[idx],
// //             Other: dummy.Other[idx],
// //             profit: dummy.profit[idx],
// //             profit2: dummy.profit2[idx],
// //           };
// //         });
// //       }

// //       const colorMap: Record<string, string> = {
// //         sales: "#2CA9E0",
// //         AmazonExpense: "#ff5c5c",
// //         taxncredit: "#FFBE26",
// //         total_cous: "#AB64B5",
// //         profit: "#5EA49B",
// //         advertisingCosts: "#F47A00",
// //         Other: "#00627D",
// //         profit2: "#87AD12",
// //       };

// //       const datasets = Object.entries(selectedGraphs)
// //         .filter(([, checked]) => checked)
// //         .map(([metric]) => ({
// //           label: labelMap[metric] ?? metric,
// //           data: labels.map(
// //             (l) =>
// //               dataToUse[l]?.[metric as keyof (typeof dataToUse)[string]] || 0
// //           ),
// //           fill: false,
// //           borderColor: colorMap[metric] ?? "#000",
// //           backgroundColor: colorMap[metric] ?? "#000",
// //           tension: 0.1,
// //         }));

// //       return { labels, datasets, isAllZero };
// //     }

// //     return { labels: [], datasets: [], isAllZero: false };
// //   };

// //   const {
// //     labels: rawLabels,
// //     datasets,
// //     isAllZero,
// //   } = useMemo(processData, [
// //     data,
// //     selectedGraphs,
// //     range,
// //     selectedMonth,
// //     selectedQuarter,
// //     selectedYear,
// //     monthlyLabels,
// //   ]);

// //   useEffect(() => {
// //     setAllValuesZero(isAllZero);
// //     onNoDataChange?.(isAllZero);
// //   }, [isAllZero, onNoDataChange]);

// //   const formattedLabels = useMemo(() => {
// //     return rawLabels.map((label) => {
// //       const [m, y] = label.trim().split(" ");
// //       const mm = convertToAbbreviatedMonth(m);
// //       const yy = (y ?? "").slice(-2);
// //       return `${mm}\u00A0'${yy}`;
// //     });
// //   }, [rawLabels]);

// //   const allDataPoints = datasets.flatMap((d: any) => d.data as number[]);
// //   const minValue = allDataPoints.length ? Math.min(...allDataPoints) : 0;
// //   const minY = minValue < 0 ? Math.floor(minValue * 1.1) : 0;

// //   const periodInfo = useMemo(() => {
// //     if (range === "monthly" && selectedMonth) {
// //       return `${convertToAbbreviatedMonth(selectedMonth)}'${String(
// //         selectedYear
// //       ).slice(-2)}`;
// //     }
// //     if (range === "quarterly" && selectedQuarter) {
// //       return `${selectedQuarter}'${String(selectedYear).slice(-2)}`;
// //     }
// //     return `Year'${String(selectedYear).slice(-2)}`;
// //   }, [range, selectedMonth, selectedQuarter, selectedYear]);

// //   const getExtraRows = () => {
// //     const formattedCountry =
// //       countryName?.toLowerCase() === "global"
// //         ? "GLOBAL"
// //         : countryName?.toUpperCase();
// //     return [
// //       [`${userData?.brand_name || "N/A"}`],
// //       [`${userData?.company_name || "N/A"}`],
// //       [`Profit Breakup (SKU Level) - ${periodInfo}`],
// //       [`Currency:  ${currencySymbol}`],
// //       [`Country: ${formattedCountry}`],
// //       [`Platform: Amazon`],
// //     ];
// //   };

// //   const exportToExcel = () => {
// //     const labelsNorm = rawLabels.map((l) => {
// //       const [m, y] = l.split(" ");
// //       const mm = convertToAbbreviatedMonth(m);
// //       const yy = (y ?? "").slice(-2);
// //       return `${mm}'${yy}`;
// //     });

// //     const monthSums: Record<string, any> = {};
// //     data.forEach((upload) => {
// //       const key = `${upload.month.toLowerCase()} ${upload.year}`;
// //       if (!monthSums[key]) {
// //         monthSums[key] = {
// //           sales: 0,
// //           AmazonExpense: 0,
// //           total_cous: 0,
// //           advertisingCosts: 0,
// //           Other: 0,
// //           net_credits: 0,
// //           taxncredit: 0,
// //           profit: 0,
// //           profit2: 0,
// //         };
// //       }
// //       monthSums[key].sales += upload.total_sales;
// //       monthSums[key].total_cous += upload.total_cous;
// //       monthSums[key].AmazonExpense += upload.total_amazon_fee;
// //       monthSums[key].taxncredit += upload.taxncredit || 0;
// //       monthSums[key].net_credits += upload.total_net_credits || 0;
// //       monthSums[key].profit2 += upload.total_profit;
// //       monthSums[key].advertisingCosts += upload.advertising_total;
// //       monthSums[key].Other += upload.otherwplatform;
// //       monthSums[key].profit += upload.cm2_profit;
// //     });

// //     const fixedOrder = [
// //       { key: "sales", label: "Sales", sign: "(+)" },
// //       { key: "total_cous", label: "COGS", sign: "(-)" },
// //       { key: "AmazonExpense", label: "Amazon Fees", sign: "(-)" },
// //       { key: "taxncredit", label: "Taxes & Credits", sign: "(+)" },
// //       { key: "profit2", label: "CM1 Profit", sign: "" },
// //       { key: "advertisingCosts", label: "Advertising Costs", sign: "(-)" },
// //       { key: "Other", label: "Others", sign: "(-)" },
// //       { key: "profit", label: "CM2 Profit", sign: "" },
// //     ];

// //     const header = ["Month", ...fixedOrder.map((i) => i.label)];
// //     const signRow = [" ", ...fixedOrder.map((i) => i.sign)];
// //     const worksheetData: (string | number)[][] = [header, signRow];

// //     rawLabels.forEach((raw, idx) => {
// //       const display = labelsNorm[idx];
// //       const key = raw.toLowerCase();
// //       const row: (string | number)[] = [display];
// //       fixedOrder.forEach(({ key: k }) => {
// //         const rawVal = monthSums[key]?.[k] ?? 0;
// //         row.push(typeof rawVal === "number" ? Number(rawVal.toFixed(2)) : 0);
// //       });
// //       worksheetData.push(row);
// //     });

// //     const totalRow: (string | number)[] = ["Total"];
// //     fixedOrder.forEach(({ key }) => {
// //       let sum = 0;
// //       rawLabels.forEach((raw) => {
// //         const k = raw.toLowerCase();
// //         sum += monthSums[k]?.[key] || 0;
// //       });
// //       totalRow.push(Number(sum.toFixed(2)));
// //     });
// //     worksheetData.push(totalRow);

// //     const finalSheet = [...getExtraRows(), [""], ...worksheetData];

// //     const ws = XLSX.utils.aoa_to_sheet(finalSheet);
// //     const wb = XLSX.utils.book_new();
// //     XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
// //     XLSX.writeFile(wb, `Metrics-${periodInfo}.xlsx`);
// //   };

// //   const noMetricSelected = Object.values(selectedGraphs).every(
// //     (v) => v === false
// //   );

// //   const toggleMetric = (name: string) => {
// //     const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;
// //     const isChecked = !!selectedGraphs[name];

// //     if (isChecked && selectedCount === 1) {
// //       setShowModal(true);
// //       return;
// //     }

// //     setSelectedGraphs((prev) => ({
// //       ...prev,
// //       [name]: !isChecked,
// //     }));
// //   };

// //   return (
// //     <div className="relative w-full rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
// //       {loading ? (
// //         <div className="flex h-[260px] md:h-[320px] items-center justify-center">
// //           <Loader
// //             src="/infinity-unscreen.gif"
// //             size={150}
// //             transparent
// //             roundedClass="rounded-full"
// //             backgroundClass="bg-transparent"
// //             respectReducedMotion
// //           />
// //         </div>
// //       ) : (
// //         <div
// //           className={
// //             allValuesZero ? "opacity-30 pointer-events-none" : "opacity-100"
// //           }
// //         >
// //           {/* Header row */}
// //           <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
// //             <div className="flex flex-wrap items-baseline gap-2 justify-center sm:justify-start">
// //               <PageBreadcrumb
// //                 pageTitle="Tracking Profitability -"
// //                 variant="page"
// //                 align="left"
// //                 textSize="2xl"
// //               />
// //               <span className="text-[#5EA68E] font-bold text-lg sm:text-2xl md:text-2xl">
// //                 {countryName?.toLowerCase() === "global"
// //                   ? "GLOBAL"
// //                   : countryName?.toUpperCase()}
// //               </span>
// //             </div>

// //             <div className="flex justify-center sm:justify-end">
// //               <DownloadIconButton onClick={exportToExcel} />
// //             </div>
// //           </div>

// //           {/* Metric toggles */}
// //           <div
// //             className={[
// //               "mt-3 sm:mt-4",
// //               "flex flex-wrap items-center justify-center",
// //               "gap-3 sm:gap-4 md:gap-5",
// //               "w-full mx-auto",
// //               allValuesZero ? "opacity-30" : "opacity-100",
// //               "transition-opacity duration-300",
// //             ].join(" ")}
// //           >
// //             {[
// //               { name: "sales", label: "Sales", color: "#2CA9E0" },
// //               { name: "total_cous", label: "COGS", color: "#AB64B5" },
// //               { name: "AmazonExpense", label: "Amazon Fees", color: "#FF5C5C" },
// //               { name: "taxncredit", label: "Taxes & Credits", color: "#FFBE26" },
// //               { name: "profit2", label: "CM1 Profit", color: "#87AD12" },
// //               {
// //                 name: "advertisingCosts",
// //                 label: "Advertising Costs",
// //                 color: "#F47A00",
// //               },
// //               { name: "Other", label: "Other", color: "#00627D" },
// //               { name: "profit", label: "CM2 Profit", color: "#5EA49B" },
// //             ].map(({ name, label, color }) => {
// //               const isChecked = !!selectedGraphs[name];

// //               return (
// //                 <label
// //                   key={name}
// //                   className={[
// //                     "shrink-0",
// //                     "flex items-center gap-1 sm:gap-1.5",
// //                     "font-semibold select-none whitespace-nowrap",
// //                     "text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs xl:text-sm",
// //                     "text-charcoal-500",
// //                     isChecked ? "opacity-100" : "opacity-40",
// //                     allValuesZero ? "cursor-not-allowed" : "cursor-pointer",
// //                   ].join(" ")}
// //                 >
// //                   <span
// //                     className="
// //                       flex items-center justify-center
// //                       h-3 w-3 sm:h-3.5 sm:w-3.5
// //                       rounded-sm border transition
// //                     "
// //                     style={{
// //                       borderColor: color,
// //                       backgroundColor: isChecked ? color : "white",
// //                       opacity: allValuesZero ? 0.6 : 1,
// //                     }}
// //                     onClick={() => !allValuesZero && toggleMetric(name)}
// //                   >
// //                     {isChecked && (
// //                       <svg
// //                         viewBox="0 0 24 24"
// //                         width="14"
// //                         height="14"
// //                         className="text-white"
// //                       >
// //                         <path
// //                           fill="currentColor"
// //                           d="M20.285 6.709a1 1 0 0 0-1.414-1.414L9 15.168l-3.879-3.88a1 1 0 0 0-1.414 1.415l4.586 4.586a1 1 0 0 0 1.414 0l10-10Z"
// //                         />
// //                       </svg>
// //                     )}
// //                   </span>
// //                   <span className="capitalize">{label}</span>
// //                 </label>
// //               );
// //             })}
// //           </div>

// //           {/* Chart */}
// //           <div className="relative mt-2 sm:mt-3">
// //             <div
// //               className={`flex w-full items-center justify-center
// //                 h-[320px] sm:h-[360px] md:h-[400px] lg:h-[420px]
// //                 transition-opacity duration-300
// //                 ${allValuesZero ? "opacity-30" : "opacity-100"}`}
// //             >
// //               {datasets.length > 0 && (
// //                 <Line
// //                   data={{ labels: formattedLabels, datasets }}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     interaction: {
// //                       intersect: false,
// //                       mode: allValuesZero ? "nearest" : "index",
// //                     },
// //                     plugins: {
// //                       tooltip: {
// //                         enabled: !allValuesZero,
// //                         mode: "index",
// //                         intersect: false,
// //                         callbacks: {
// //                           label: (tooltipItem: any) => {
// //                             const displayLabel =
// //                               (tooltipItem.dataset.label as string) || "";
// //                             const value = tooltipItem.raw as number;
// //                             return `${displayLabel}: ${currencySymbol} ${value.toLocaleString(
// //                               undefined,
// //                               {
// //                                 minimumFractionDigits: 2,
// //                                 maximumFractionDigits: 2,
// //                               }
// //                             )}`;
// //                           },
// //                         },
// //                       },
// //                       legend: { display: false },
// //                     },
// //                     scales: {
// //                       x: {
// //                         title: { display: true, text: "Month" },
// //                         ticks: {
// //                           minRotation: 0,
// //                           maxRotation: 0,
// //                           autoSkip: formattedLabels.length > 6,
// //                           maxTicksLimit:
// //                             formattedLabels.length > 0
// //                               ? formattedLabels.length
// //                               : 12,
// //                           callback: (_v, idx) =>
// //                             String(formattedLabels[idx] ?? ""),
// //                         },
// //                       },
// //                       y: {
// //                         title: {
// //                           display: true,
// //                           text: `Amount (${currencySymbol})`,
// //                         },
// //                         min: minY,
// //                         ticks: { padding: 0 },
// //                       },
// //                     },
// //                   }}
// //                 />
// //               )}
// //             </div>

// //             {/* Must select >= 1 metric */}
// //             {noMetricSelected && (
// //               <ModalMsg
// //                 show={showModal}
// //                 onClose={() => setShowModal(false)}
// //                 message="At least one metric must be selected to display the graph."
// //               />
// //             )}
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default GraphPage;








// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import "@/lib/chartSetup";
// import { Line } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   LineElement,
//   PointElement,
//   Title as ChartTitle,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import * as XLSX from "xlsx";
// import ModalMsg from "@/components/common/ModalMsg";
// import PageBreadcrumb from "../common/PageBreadCrumb";
// import Loader from "@/components/loader/Loader";
// import DownloadIconButton from "../ui/button/DownloadIconButton";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   LineElement,
//   PointElement,
//   ChartTitle,
//   Tooltip,
//   Legend
// );

// type GraphPageProps = {
//   range: "monthly" | "quarterly" | "yearly";
//   selectedMonth?: string;
//   selectedQuarter?: "Q1" | "Q2" | "Q3" | "Q4";
//   selectedYear: number | string;
//   countryName: string;
//   /** Only passed for GLOBAL pages from Dropdowns */
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
//   total_net_credits?: number;
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

// const GraphPage: React.FC<GraphPageProps> = ({
//   range,
//   selectedMonth,
//   selectedQuarter,
//   selectedYear,
//   countryName,
//   homeCurrency, // optional now; only set for GLOBAL
//   onNoDataChange,
// }) => {
//   const isGlobalPage = countryName.toLowerCase() === "global";

//   const normalizedHomeCurrency = (homeCurrency || "").toLowerCase();
//   const currencySymbol = isGlobalPage
//     ? getCurrencySymbol(normalizedHomeCurrency || "usd")
//     : getCurrencySymbol(countryName || "");

//   const [data, setData] = useState<UploadRow[]>([]);
//   const [allValuesZero, setAllValuesZero] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const [loading, setLoading] = useState<boolean>(true);

//   const [selectedGraphs, setSelectedGraphs] = useState<Record<string, boolean>>({
//     sales: true,
//     total_cous: false,
//     AmazonExpense: true,
//     taxncredit: false,
//     profit2: true,
//     advertisingCosts: true,
//     Other: false,
//     profit: true,
//   });

//   const token =
//     typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
//   const [fetchError, setFetchError] = useState<string | null>(null);
//   const [userData, setUserData] = useState<{
//     company_name?: string;
//     brand_name?: string;
//   } | null>(null);

//   const generateDummyData = (labels: string[]) => {
//     const dummyMetrics: Record<string, number[]> = {
//       sales: labels.map(
//         (_, index) => 15000 + Math.random() * 5000 + index * 1000
//       ),
//       AmazonExpense: labels.map(
//         (_, index) => 3000 + Math.random() * 1000 + index * 200
//       ),
//       total_cous: labels.map(
//         (_, index) => 8000 + Math.random() * 2000 + index * 500
//       ),
//       advertisingCosts: labels.map(
//         (_, index) => 2000 + Math.random() * 800 + index * 150
//       ),
//       Other: labels.map(
//         (_, index) => 1000 + Math.random() * 500 + index * 100
//       ),
//       taxncredit: labels.map(
//         (_, index) => 500 + Math.random() * 300 + index * 50
//       ),
//       profit: labels.map(
//         (_, index) => 1500 + Math.random() * 800 + index * 200
//       ),
//       profit2: labels.map(
//         (_, index) => 2000 + Math.random() * 1000 + index * 250
//       ),
//     };
//     return dummyMetrics;
//   };

//   const getQuarterLabels = (
//     year: number | string,
//     quarter: "Q1" | "Q2" | "Q3" | "Q4"
//   ) => {
//     const qMap: Record<string, string[]> = {
//       Q1: ["january", "february", "march"],
//       Q2: ["april", "may", "june"],
//       Q3: ["july", "august", "september"],
//       Q4: ["october", "november", "december"],
//     };
//     return qMap[quarter]?.map((m) => `${m} ${year}`) ?? [];
//   };

//   const capitalizeFirstLetter = (str: string) =>
//     str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
//   const convertToAbbreviatedMonth = (m?: string) =>
//     m ? capitalizeFirstLetter(m).slice(0, 3) : "";

//   const labelMap: Record<string, string> = {
//     sales: "Sales",
//     total_cous: "COGS",
//     taxncredit: "Taxes & Credits",
//     AmazonExpense: "Amazon Fees",
//     advertisingCosts: "Advertising Costs",
//     Other: "Other",
//     profit: "CM2 Profit",
//     profit2: "CM1 Profit",
//   };

//   // 🔹 Fetch upload history
//   //    - GLOBAL: send homeCurrency (converted by backend)
//   //    - Country: don't send homeCurrency (use native currency)
//   useEffect(() => {
//     const fetchUploadHistory = async () => {
//       try {
//         if (!token) {
//           setLoading(false);
//           return;
//         }
//         setLoading(true);

//         // const url = new URL("http://127.0.0.1:5000/upload_history");

//         // if (isGlobalPage && normalizedHomeCurrency) {
//         //   url.searchParams.set("homeCurrency", normalizedHomeCurrency);
//         // }

//         const url = new URL("http://127.0.0.1:5000/upload_history");
// url.searchParams.set("country", countryName.toLowerCase());

// if (isGlobalPage && homeCurrency) {
//   url.searchParams.set("homeCurrency", normalizedHomeCurrency);
// }


//         const resp = await fetch(url.toString(), {
//           method: "GET",
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const json = await resp.json();
//         if (json?.uploads) {
//           const filtered = (json.uploads as UploadRow[]).filter(
//             (item) => item.country.toLowerCase() === countryName.toLowerCase()
//           );
//           setData(filtered);
//         }
//       } catch (e) {
//         console.error("Failed to fetch upload history:", e);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchUploadHistory();
//   }, [countryName, token, isGlobalPage, normalizedHomeCurrency]);

//   useEffect(() => {
//     const fetchUser = async () => {
//       if (!token) {
//         setFetchError("No token found. Please log in.");
//         return;
//       }
//       try {
//         const response = await fetch("http://127.0.0.1:5000/get_user_data", {
//           method: "GET",
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (!response.ok) {
//           const j = await response.json().catch(() => ({}));
//           setFetchError(j?.error || "Something went wrong.");
//           return;
//         }
//         const j = await response.json();
//         setUserData(j);
//       } catch {
//         setFetchError("Error fetching user data");
//       }
//     };
//     fetchUser();
//   }, [token]);

//   const handleCheckboxChange = () => {
//     const { name, checked } = e.target;
//     const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;
//     if (!checked && selectedCount === 1) {
//       setShowModal(true);
//       return;
//     }e: React.ChangeEvent<HTMLInputElement>
//     setSelectedGraphs((prev) => ({ ...prev, [name]: checked }));
//   };

//   const monthlyLabels = useMemo(() => {
//     if (range === "monthly" && selectedMonth && selectedYear) {
//       const label = `${selectedMonth} ${selectedYear}`;
//       return [label.toLowerCase()];
//     }
//     if (range === "quarterly" && selectedQuarter && selectedYear) {
//       return getQuarterLabels(selectedYear, selectedQuarter).map((l) =>
//         l.toLowerCase()
//       );
//     }
//     if (range === "yearly" && selectedYear) {
//       return [
//         `January ${selectedYear}`,
//         `February ${selectedYear}`,
//         `March ${selectedYear}`,
//         `April ${selectedYear}`,
//         `May ${selectedYear}`,
//         `June ${selectedYear}`,
//         `July ${selectedYear}`,
//         `August ${selectedYear}`,
//         `September ${selectedYear}`,
//         `October ${selectedYear}`,
//         `November ${selectedYear}`,
//         `December ${selectedYear}`,
//       ].map((l) => l.toLowerCase());
//     }
//     return [] as string[];
//   }, [range, selectedMonth, selectedQuarter, selectedYear]);

//   const processData = () => {
//     if (!data || data.length === 0)
//       return { labels: [] as string[], datasets: [] as any[], isAllZero: false };

//     const monthSums: Record<
//       string,
//       {
//         sales: number;
//         AmazonExpense: number;
//         taxncredit: number;
//         total_cous: number;
//         advertisingCosts: number;
//         Other: number;
//         profit: number;
//         profit2: number;
//       }
//     > = {};

//     data.forEach((upload) => {
//       const key = `${upload.month.toLowerCase()} ${upload.year}`;
//       if (!monthSums[key]) {
//         monthSums[key] = {
//           sales: 0,
//           AmazonExpense: 0,
//           taxncredit: 0,
//           total_cous: 0,
//           advertisingCosts: 0,
//           Other: 0,
//           profit: 0,
//           profit2: 0,
//         };
//       }
//       monthSums[key].sales += upload.total_sales;
//       monthSums[key].AmazonExpense += upload.total_amazon_fee;
//       monthSums[key].total_cous += upload.total_cous;
//       monthSums[key].advertisingCosts += Math.abs(upload.advertising_total);
//       monthSums[key].Other += Math.abs(upload.otherwplatform);
//       monthSums[key].taxncredit += upload.taxncredit || 0;
//       monthSums[key].profit += upload.cm2_profit;
//       monthSums[key].profit2 += upload.total_profit;
//     });

//     const labels = monthlyLabels;

//     if (labels.length > 0) {
//       const allDataValues: number[] = [];
//       Object.entries(selectedGraphs)
//         .filter(([, checked]) => checked)
//         .forEach(([metric]) => {
//           const vals = labels.map(
//             (l) =>
//               monthSums[l]?.[metric as keyof (typeof monthSums)[string]] || 0
//           );
//           allDataValues.push(...(vals as number[]));
//         });

//       const isAllZero = !allDataValues.some((v) => Math.abs(v) > 0.01);

//       let dataToUse = monthSums;
//       if (isAllZero) {
//         const dummy = generateDummyData(labels);
//         dataToUse = {};
//         labels.forEach((l, idx) => {
//           dataToUse[l] = {
//             sales: dummy.sales[idx],
//             AmazonExpense: dummy.AmazonExpense[idx],
//             taxncredit: dummy.taxncredit[idx],
//             total_cous: dummy.total_cous[idx],
//             advertisingCosts: dummy.advertisingCosts[idx],
//             Other: dummy.Other[idx],
//             profit: dummy.profit[idx],
//             profit2: dummy.profit2[idx],
//           };
//         });
//       }

//       const colorMap: Record<string, string> = {
//         sales: "#2CA9E0",
//         AmazonExpense: "#ff5c5c",
//         taxncredit: "#FFBE26",
//         total_cous: "#AB64B5",
//         profit: "#5EA49B",
//         advertisingCosts: "#F47A00",
//         Other: "#00627D",
//         profit2: "#87AD12",
//       };

//       const datasets = Object.entries(selectedGraphs)
//         .filter(([, checked]) => checked)
//         .map(([metric]) => ({
//           label: labelMap[metric] ?? metric,
//           data: labels.map(
//             (l) =>
//               dataToUse[l]?.[metric as keyof (typeof dataToUse)[string]] || 0
//           ),
//           fill: false,
//           borderColor: colorMap[metric] ?? "#000",
//           backgroundColor: colorMap[metric] ?? "#000",
//           tension: 0.1,
//         }));

//       return { labels, datasets, isAllZero };
//     }

//     return { labels: [], datasets: [], isAllZero: false };
//   };

//   const {
//     labels: rawLabels,
//     datasets,
//     isAllZero,
//   } = useMemo(processData, [
//     data,
//     selectedGraphs,
//     range,
//     selectedMonth,
//     selectedQuarter,
//     selectedYear,
//     monthlyLabels,
//   ]);

//   useEffect(() => {
//     setAllValuesZero(isAllZero);
//     onNoDataChange?.(isAllZero);
//   }, [isAllZero, onNoDataChange]);

//   const formattedLabels = useMemo(() => {
//     return rawLabels.map((label) => {
//       const [m, y] = label.trim().split(" ");
//       const mm = convertToAbbreviatedMonth(m);
//       const yy = (y ?? "").slice(-2);
//       return `${mm}\u00A0'${yy}`;
//     });
//   }, [rawLabels]);

//   const allDataPoints = datasets.flatMap((d: any) => d.data as number[]);
//   const minValue = allDataPoints.length ? Math.min(...allDataPoints) : 0;
//   const minY = minValue < 0 ? Math.floor(minValue * 1.1) : 0;

//   const periodInfo = useMemo(() => {
//     if (range === "monthly" && selectedMonth) {
//       return `${convertToAbbreviatedMonth(selectedMonth)}'${String(
//         selectedYear
//       ).slice(-2)}`;
//     }
//     if (range === "quarterly" && selectedQuarter) {
//       return `${selectedQuarter}'${String(selectedYear).slice(-2)}`;
//     }
//     return `Year'${String(selectedYear).slice(-2)}`;
//   }, [range, selectedMonth, selectedQuarter, selectedYear]);

//   const getExtraRows = () => {
//     const formattedCountry = isGlobalPage
//       ? "GLOBAL"
//       : countryName?.toUpperCase();
//     return [
//       [`${userData?.brand_name || "N/A"}`],
//       [`${userData?.company_name || "N/A"}`],
//       [`Profit Breakup (SKU Level) - ${periodInfo}`],
//       [`Currency:  ${currencySymbol}`],
//       [`Country: ${formattedCountry}`],
//       [`Platform: Amazon`],
//     ];
//   };

//   const exportToExcel = () => {
//     const labelsNorm = rawLabels.map((l) => {
//       const [m, y] = l.split(" ");
//       const mm = convertToAbbreviatedMonth(m);
//       const yy = (y ?? "").slice(-2);
//       return `${mm}'${yy}`;
//     });

//     const monthSums: Record<string, any> = {};
//     data.forEach((upload) => {
//       const key = `${upload.month.toLowerCase()} ${upload.year}`;
//       if (!monthSums[key]) {
//         monthSums[key] = {
//           sales: 0,
//           AmazonExpense: 0,
//           total_cous: 0,
//           advertisingCosts: 0,
//           Other: 0,
//           net_credits: 0,
//           taxncredit: 0,
//           profit: 0,
//           profit2: 0,
//         };
//       }
//       monthSums[key].sales += upload.total_sales;
//       monthSums[key].total_cous += upload.total_cous;
//       monthSums[key].AmazonExpense += upload.total_amazon_fee;
//       monthSums[key].taxncredit += upload.taxncredit || 0;
//       monthSums[key].net_credits += upload.total_net_credits || 0;
//       monthSums[key].profit2 += upload.total_profit;
//       monthSums[key].advertisingCosts += upload.advertising_total;
//       monthSums[key].Other += upload.otherwplatform;
//       monthSums[key].profit += upload.cm2_profit;
//     });

//     const fixedOrder = [
//       { key: "sales", label: "Sales", sign: "(+)" },
//       { key: "total_cous", label: "COGS", sign: "(-)" },
//       { key: "AmazonExpense", label: "Amazon Fees", sign: "(-)" },
//       { key: "taxncredit", label: "Taxes & Credits", sign: "(+)" },
//       { key: "profit2", label: "CM1 Profit", sign: "" },
//       { key: "advertisingCosts", label: "Advertising Costs", sign: "(-)" },
//       { key: "Other", label: "Others", sign: "(-)" },
//       { key: "profit", label: "CM2 Profit", sign: "" },
//     ];

//     const header = ["Month", ...fixedOrder.map((i) => i.label)];
//     const signRow = [" ", ...fixedOrder.map((i) => i.sign)];
//     const worksheetData: (string | number)[][] = [header, signRow];

//     rawLabels.forEach((raw, idx) => {
//       const display = labelsNorm[idx];
//       const key = raw.toLowerCase();
//       const row: (string | number)[] = [display];
//       fixedOrder.forEach(({ key: k }) => {
//         const rawVal = monthSums[key]?.[k] ?? 0;
//         row.push(typeof rawVal === "number" ? Number(rawVal.toFixed(2)) : 0);
//       });
//       worksheetData.push(row);
//     });

//     const totalRow: (string | number)[] = ["Total"];
//     fixedOrder.forEach(({ key }) => {
//       let sum = 0;
//       rawLabels.forEach((raw) => {
//         const k = raw.toLowerCase();
//         sum += monthSums[k]?.[key] || 0;
//       });
//       totalRow.push(Number(sum.toFixed(2)));
//     });
//     worksheetData.push(totalRow);

//     const finalSheet = [...getExtraRows(), [""], ...worksheetData];

//     const ws = XLSX.utils.aoa_to_sheet(finalSheet);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
//     XLSX.writeFile(wb, `Metrics-${periodInfo}.xlsx`);
//   };

//   const noMetricSelected = Object.values(selectedGraphs).every(
//     (v) => v === false
//   );

//   const toggleMetric = (name: string) => {
//     const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;
//     const isChecked = !!selectedGraphs[name];

//     if (isChecked && selectedCount === 1) {
//       setShowModal(true);
//       return;
//     }

//     setSelectedGraphs((prev) => ({
//       ...prev,
//       [name]: !isChecked,
//     }));
//   };

//   return (
//     <div className="relative w-full rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
//       {loading ? (
//         <div className="flex h-[260px] md:h-[320px] items-center justify-center">
//           <Loader
//             src="/infinity-unscreen.gif"
//             size={150}
//             transparent
//             roundedClass="rounded-full"
//             backgroundClass="bg-transparent"
//             respectReducedMotion
//           />
//         </div>
//       ) : (
//         <div
//           className={
//             allValuesZero ? "opacity-30 pointer-events-none" : "opacity-100"
//           }
//         >
//           {/* Header row */}
//           <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//             <div className="flex flex-wrap items-baseline gap-2 justify-center sm:justify-start">
//               <PageBreadcrumb
//                 pageTitle="Profitability"
//                 variant="page"
//                 align="left"
//                 textSize="2xl"
//               />
//               {/* <span className="text-[#5EA68E] font-bold text-lg sm:text-2xl md:text-2xl">
//                 {isGlobalPage ? "GLOBAL" : countryName?.toUpperCase()}
//               </span> */}
//             </div>

//             <div className="flex justify-center sm:justify-end">
//               <DownloadIconButton onClick={exportToExcel} />
//             </div>
//           </div>

//           {/* Metric toggles */}
//           <div
//             className={[
//               "mt-3 sm:mt-4",
//               "flex flex-wrap items-center justify-center",
//               "gap-3 sm:gap-4 md:gap-5",
//               "w-full mx-auto",
//               allValuesZero ? "opacity-30" : "opacity-100",
//               "transition-opacity duration-300",
//             ].join(" ")}
//           >
//             {[
//               { name: "sales", label: "Sales", color: "#2CA9E0" },
//               { name: "total_cous", label: "COGS", color: "#AB64B5" },
//               { name: "AmazonExpense", label: "Amazon Fees", color: "#FF5C5C" },
//               { name: "taxncredit", label: "Taxes & Credits", color: "#FFBE26" },
//               { name: "profit2", label: "CM1 Profit", color: "#87AD12" },
//               {
//                 name: "advertisingCosts",
//                 label: "Advertising Costs",
//                 color: "#F47A00",
//               },
//               { name: "Other", label: "Other", color: "#00627D" },
//               { name: "profit", label: "CM2 Profit", color: "#5EA49B" },
//             ].map(({ name, label, color }) => {
//               const isChecked = !!selectedGraphs[name];

//               return (
//                 <label
//                   key={name}
//                   className={[
//                     "shrink-0",
//                     "flex items-center gap-1 sm:gap-1.5",
//                     "font-semibold select-none whitespace-nowrap",
//                     "text-[9px] sm:text[10px] md:text-[11px] lg:text-xs xl:text-sm",
//                     "text-charcoal-500",
//                     isChecked ? "opacity-100" : "opacity-40",
//                     allValuesZero ? "cursor-not-allowed" : "cursor-pointer",
//                   ].join(" ")}
//                 >
//                   <span
//                     className="
//                       flex items-center justify-center
//                       h-3 w-3 sm:h-3.5 sm:w-3.5
//                       rounded-sm border transition
//                     "
//                     style={{
//                       borderColor: color,
//                       backgroundColor: isChecked ? color : "white",
//                       opacity: allValuesZero ? 0.6 : 1,
//                     }}
//                     onClick={() => !allValuesZero && toggleMetric(name)}
//                   >
//                     {isChecked && (
//                       <svg
//                         viewBox="0 0 24 24"
//                         width="14"
//                         height="14"
//                         className="text-white"
//                       >
//                         <path
//                           fill="currentColor"
//                           d="M20.285 6.709a1 1 0 0 0-1.414-1.414L9 15.168l-3.879-3.88a1 1 0 0 0-1.414 1.415l4.586 4.586a1 1 0 0 0 1.414 0l10-10Z"
//                         />
//                       </svg>
//                     )}
//                   </span>
//                   <span className="capitalize">{label}</span>
//                 </label>
//               );
//             })}
//           </div>

//           {/* Chart */}
//           <div className="relative mt-2 sm:mt-3">
//             <div
//               className={`flex w-full items-center justify-center
//                 h-[320px] sm:h-[360px] md:h-[400px] lg:h-[420px]
//                 transition-opacity duration-300
//                 ${allValuesZero ? "opacity-30" : "opacity-100"}`}
//             >
//               {datasets.length > 0 && (
//                 <Line
//                   data={{ labels: formattedLabels, datasets }}
//                   options={{
//                     responsive: true,
//                     maintainAspectRatio: false,
//                     interaction: {
//                       intersect: false,
//                       mode: allValuesZero ? "nearest" : "index",
//                     },
//                     plugins: {
//                       tooltip: {
//                         enabled: !allValuesZero,
//                         mode: "index",
//                         intersect: false,
//                         callbacks: {
//                           label: (tooltipItem: any) => {
//                             const displayLabel =
//                               (tooltipItem.dataset.label as string) || "";
//                             const value = tooltipItem.raw as number;
//                             return `${displayLabel}: ${currencySymbol} ${value.toLocaleString(
//                               undefined,
//                               {
//                                 minimumFractionDigits: 2,
//                                 maximumFractionDigits: 2,
//                               }
//                             )}`;
//                           },
//                         },
//                       },
//                       legend: { display: false },
//                     },
//                     scales: {
//                       x: {
//                         title: { display: true, text: "Month" },
//                         ticks: {
//                           minRotation: 0,
//                           maxRotation: 0,
//                           autoSkip: formattedLabels.length > 6,
//                           maxTicksLimit:
//                             formattedLabels.length > 0
//                               ? formattedLabels.length
//                               : 12,
//                           callback: (_v, idx) =>
//                             String(formattedLabels[idx] ?? ""),
//                         },
//                       },
//                       y: {
//                         title: {
//                           display: true,
//                           text: `Amount (${currencySymbol})`,
//                         },
//                         min: minY,
//                         ticks: { padding: 0 },
//                       },
//                     },
//                   }}
//                 />
//               )}
//             </div>

//             {/* Must select >= 1 metric */}
//             {noMetricSelected && (
//               <ModalMsg
//                 show={showModal}
//                 onClose={() => setShowModal(false)}
//                 message="At least one metric must be selected to display the graph."
//               />
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default GraphPage;












































"use client";

import React, { useEffect, useMemo, useState } from "react";
import "@/lib/chartSetup";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from "chart.js";
import * as XLSX from "xlsx";
import ModalMsg from "@/components/common/ModalMsg";
import PageBreadcrumb from "../common/PageBreadCrumb";
import Loader from "@/components/loader/Loader";
import DownloadIconButton from "../ui/button/DownloadIconButton";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  ChartTitle,
  Tooltip,
  Legend
);

type GraphPageProps = {
  range: "monthly" | "quarterly" | "yearly";
  selectedMonth?: string;
  selectedQuarter?: "Q1" | "Q2" | "Q3" | "Q4";
  selectedYear: number | string;
  countryName: string;
  /** Only passed for GLOBAL pages from Dropdowns */
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
  total_net_credits?: number;
};

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
    case "cad":
      return "C$";
    default:
      return "¤";
  }
};

const GraphPage: React.FC<GraphPageProps> = ({
  range,
  selectedMonth,
  selectedQuarter,
  selectedYear,
  countryName,
  homeCurrency,
  onNoDataChange,
}) => {
  const isGlobalPage = (countryName || "").toLowerCase() === "global";

  const normalizedHomeCurrency = (homeCurrency || "").trim().toLowerCase();

  // ✅ For global pages: we want to filter rows by `country` field.
  // Examples in your response:
  // - global (base)
  // - global_inr, global_cad, global_gbp
  const globalCountryKey = normalizedHomeCurrency
    ? `global_${normalizedHomeCurrency}`
    : "global";

  const currencySymbol = isGlobalPage
    ? getCurrencySymbol(normalizedHomeCurrency || "usd")
    : getCurrencySymbol(countryName || "");

  const [data, setData] = useState<UploadRow[]>([]);
  const [allValuesZero, setAllValuesZero] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedGraphs, setSelectedGraphs] = useState<Record<string, boolean>>({
    sales: true,
    total_cous: false,
    AmazonExpense: true,
    taxncredit: false,
    profit2: true,
    advertisingCosts: true,
    Other: false,
    profit: true,
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{
    company_name?: string;
    brand_name?: string;
  } | null>(null);

  const generateDummyData = (labels: string[]) => {
    const dummyMetrics: Record<string, number[]> = {
      sales: labels.map((_, i) => 15000 + Math.random() * 5000 + i * 1000),
      AmazonExpense: labels.map((_, i) => 3000 + Math.random() * 1000 + i * 200),
      total_cous: labels.map((_, i) => 8000 + Math.random() * 2000 + i * 500),
      advertisingCosts: labels.map((_, i) => 2000 + Math.random() * 800 + i * 150),
      Other: labels.map((_, i) => 1000 + Math.random() * 500 + i * 100),
      taxncredit: labels.map((_, i) => 500 + Math.random() * 300 + i * 50),
      profit: labels.map((_, i) => 1500 + Math.random() * 800 + i * 200),
      profit2: labels.map((_, i) => 2000 + Math.random() * 1000 + i * 250),
    };
    return dummyMetrics;
  };

  const getQuarterLabels = (
    year: number | string,
    quarter: "Q1" | "Q2" | "Q3" | "Q4"
  ) => {
    const qMap: Record<string, string[]> = {
      Q1: ["january", "february", "march"],
      Q2: ["april", "may", "june"],
      Q3: ["july", "august", "september"],
      Q4: ["october", "november", "december"],
    };
    return qMap[quarter]?.map((m) => `${m} ${year}`) ?? [];
  };

  const capitalizeFirstLetter = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  const convertToAbbreviatedMonth = (m?: string) =>
    m ? capitalizeFirstLetter(m).slice(0, 3) : "";

  const labelMap: Record<string, string> = {
    sales: "Sales",
    total_cous: "COGS",
    taxncredit: "Taxes & Credits",
    AmazonExpense: "Amazon Fees",
    advertisingCosts: "Advertising Costs",
    Other: "Other",
    profit: "CM2 Profit",
    profit2: "CM1 Profit",
  };

  // ✅ Fetch upload history
  // We can still pass homeCurrency for global (fine),
  // but IMPORTANT: we also filter returned rows correctly.
  useEffect(() => {
    const fetchUploadHistory = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }
        setLoading(true);

        const url = new URL("http://127.0.0.1:5000/upload_history");

        // optional: keep sending it (backend might use it later)
        if (isGlobalPage && normalizedHomeCurrency) {
          url.searchParams.set("homeCurrency", normalizedHomeCurrency);
        }

        const resp = await fetch(url.toString(), {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) {
          const j = await resp.json().catch(() => ({}));
          throw new Error(j?.error || "Failed to fetch upload history");
        }

        const json = await resp.json();

        if (json?.uploads) {
          const rows = json.uploads as UploadRow[];

          const isUsd = normalizedHomeCurrency === "usd";

          const filtered = rows.filter((item) => {
            const itemCountry = (item.country || "").toLowerCase();

            if (isGlobalPage) {
              if (isUsd) {
                // ✅ USD global supports BOTH legacy + converted
                return itemCountry === "global" || itemCountry === "global_usd";
              }
              // ✅ Non-USD global currencies
              return itemCountry === `global_${normalizedHomeCurrency}`;
            }

            // ✅ Normal country pages (UK, US, etc.)
            return itemCountry === countryName.toLowerCase();
          });

          setData(filtered);

        } else {
          setData([]);
        }
      } catch (e) {
        console.error("Failed to fetch upload history:", e);
        const msg = e instanceof Error ? e.message : "Failed to fetch upload history";
        setFetchError(msg);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUploadHistory();
  }, [token, countryName, isGlobalPage, normalizedHomeCurrency, globalCountryKey]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setFetchError("No token found. Please log in.");
        return;
      }
      try {
        const response = await fetch("http://127.0.0.1:5000/get_user_data", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const j = await response.json().catch(() => ({}));
          setFetchError(j?.error || "Something went wrong.");
          return;
        }
        const j = await response.json();
        setUserData(j);
      } catch {
        setFetchError("Error fetching user data");
      }
    };
    fetchUser();
  }, [token]);

  // ✅ FIXED: checkbox handler
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;

    // prevent deselecting last one
    if (!checked && selectedCount === 1) {
      setShowModal(true);
      return;
    }

    setSelectedGraphs((prev) => ({ ...prev, [name]: checked }));
  };

  const monthlyLabels = useMemo(() => {
    if (range === "monthly" && selectedMonth && selectedYear) {
      return [`${selectedMonth} ${selectedYear}`.toLowerCase()];
    }
    if (range === "quarterly" && selectedQuarter && selectedYear) {
      return getQuarterLabels(selectedYear, selectedQuarter).map((l) => l.toLowerCase());
    }
    if (range === "yearly" && selectedYear) {
      return [
        `January ${selectedYear}`,
        `February ${selectedYear}`,
        `March ${selectedYear}`,
        `April ${selectedYear}`,
        `May ${selectedYear}`,
        `June ${selectedYear}`,
        `July ${selectedYear}`,
        `August ${selectedYear}`,
        `September ${selectedYear}`,
        `October ${selectedYear}`,
        `November ${selectedYear}`,
        `December ${selectedYear}`,
      ].map((l) => l.toLowerCase());
    }
    return [] as string[];
  }, [range, selectedMonth, selectedQuarter, selectedYear]);

  const processData = () => {
    if (!data || data.length === 0) {
      return { labels: [] as string[], datasets: [] as any[], isAllZero: false };
    }

    const monthSums: Record<
      string,
      {
        sales: number;
        AmazonExpense: number;
        taxncredit: number;
        total_cous: number;
        advertisingCosts: number;
        Other: number;
        profit: number;
        profit2: number;
      }
    > = {};

    data.forEach((upload) => {
      const key = `${upload.month.toLowerCase()} ${upload.year}`;
      if (!monthSums[key]) {
        monthSums[key] = {
          sales: 0,
          AmazonExpense: 0,
          taxncredit: 0,
          total_cous: 0,
          advertisingCosts: 0,
          Other: 0,
          profit: 0,
          profit2: 0,
        };
      }

      monthSums[key].sales += Number(upload.total_sales || 0);
      monthSums[key].AmazonExpense += Number(upload.total_amazon_fee || 0);
      monthSums[key].total_cous += Number(upload.total_cous || 0);
      monthSums[key].advertisingCosts += Math.abs(Number(upload.advertising_total || 0));
      monthSums[key].Other += Math.abs(Number(upload.otherwplatform || 0));
      monthSums[key].taxncredit += Number(upload.taxncredit || 0);
      monthSums[key].profit += Number(upload.cm2_profit || 0);
      monthSums[key].profit2 += Number(upload.total_profit || 0);
    });

    const labels = monthlyLabels;

    if (labels.length > 0) {
      const allDataValues: number[] = [];
      Object.entries(selectedGraphs)
        .filter(([, checked]) => checked)
        .forEach(([metric]) => {
          const vals = labels.map((l) => (monthSums[l]?.[metric as keyof (typeof monthSums)[string]] || 0));
          allDataValues.push(...vals);
        });

      const isAllZero = !allDataValues.some((v) => Math.abs(v) > 0.01);

      let dataToUse = monthSums;
      if (isAllZero) {
        const dummy = generateDummyData(labels);
        dataToUse = {};
        labels.forEach((l, idx) => {
          dataToUse[l] = {
            sales: dummy.sales[idx],
            AmazonExpense: dummy.AmazonExpense[idx],
            taxncredit: dummy.taxncredit[idx],
            total_cous: dummy.total_cous[idx],
            advertisingCosts: dummy.advertisingCosts[idx],
            Other: dummy.Other[idx],
            profit: dummy.profit[idx],
            profit2: dummy.profit2[idx],
          };
        });
      }

      const colorMap: Record<string, string> = {
        sales: "#2CA9E0",
        AmazonExpense: "#FFBE25",
        taxncredit: "#C03030",
        total_cous: "#AB64B5",
        profit: "#2DA49A",
        advertisingCosts: "#F47A00",
        Other: "#00627D",
        profit2: "#87AD12",
      };

      // const datasets = Object.entries(selectedGraphs)
      //   .filter(([, checked]) => checked)
      //   .map(([metric]) => ({
      //     label: labelMap[metric] ?? metric,
      //     data: labels.map((l) => dataToUse[l]?.[metric as keyof (typeof dataToUse)[string]] || 0),
      //     fill: false,
      //     borderColor: colorMap[metric] ?? "#000",
      //     backgroundColor: colorMap[metric] ?? "#000",
      //     tension: 0.1,
      //   }));

      const datasets = Object.entries(selectedGraphs)
  .filter(([, checked]) => checked)
  .map(([metric]) => ({
    label: labelMap[metric] ?? metric,
    data: labels.map(
      (l) => dataToUse[l]?.[metric as keyof (typeof dataToUse)[string]] || 0
    ),
    fill: false,
    borderColor: colorMap[metric] ?? "#000",
    backgroundColor: colorMap[metric] ?? "#000",

    // 👇 Make the line curved
    tension: 0.35,        // try 0.3 – 0.5
    cubicInterpolationMode: "monotone", // keeps curve smooth & realistic
    pointRadius: 3,
    pointHoverRadius: 5,
  }));


      return { labels, datasets, isAllZero };
    }

    return { labels: [], datasets: [], isAllZero: false };
  };

  const { labels: rawLabels, datasets, isAllZero } = useMemo(processData, [
    data,
    selectedGraphs,
    range,
    selectedMonth,
    selectedQuarter,
    selectedYear,
    monthlyLabels,
  ]);

  useEffect(() => {
    setAllValuesZero(isAllZero);
    onNoDataChange?.(isAllZero);
  }, [isAllZero, onNoDataChange]);

  const formattedLabels = useMemo(() => {
    return rawLabels.map((label) => {
      const [m, y] = label.trim().split(" ");
      const mm = convertToAbbreviatedMonth(m);
      const yy = (y ?? "").slice(-2);
      return `${mm}\u00A0'${yy}`;
    });
  }, [rawLabels]);

  const allDataPoints = datasets.flatMap((d: any) => d.data as number[]);
  const minValue = allDataPoints.length ? Math.min(...allDataPoints) : 0;
  const minY = minValue < 0 ? Math.floor(minValue * 1.1) : 0;

  const periodInfo = useMemo(() => {
    if (range === "monthly" && selectedMonth) {
      return `${convertToAbbreviatedMonth(selectedMonth)}'${String(selectedYear).slice(-2)}`;
    }
    if (range === "quarterly" && selectedQuarter) {
      return `${selectedQuarter}'${String(selectedYear).slice(-2)}`;
    }
    return `Year'${String(selectedYear).slice(-2)}`;
  }, [range, selectedMonth, selectedQuarter, selectedYear]);

  const getExtraRows = () => {
    const formattedCountry = isGlobalPage ? "GLOBAL" : (countryName || "").toUpperCase();
    return [
      [`${userData?.brand_name || "N/A"}`],
      [`${userData?.company_name || "N/A"}`],
      [`Profit Breakup (SKU Level) - ${periodInfo}`],
      [`Currency:  ${currencySymbol}`],
      [`Country: ${formattedCountry}`],
      [`Platform: Amazon`],
    ];
  };

  const exportToExcel = () => {
    const labelsNorm = rawLabels.map((l) => {
      const [m, y] = l.split(" ");
      const mm = convertToAbbreviatedMonth(m);
      const yy = (y ?? "").slice(-2);
      return `${mm}'${yy}`;
    });

    const monthSums: Record<string, any> = {};
    data.forEach((upload) => {
      const key = `${upload.month.toLowerCase()} ${upload.year}`;
      if (!monthSums[key]) {
        monthSums[key] = {
          sales: 0,
          AmazonExpense: 0,
          total_cous: 0,
          advertisingCosts: 0,
          Other: 0,
          net_credits: 0,
          taxncredit: 0,
          profit: 0,
          profit2: 0,
        };
      }
      monthSums[key].sales += Number(upload.total_sales || 0);
      monthSums[key].total_cous += Number(upload.total_cous || 0);
      monthSums[key].AmazonExpense += Number(upload.total_amazon_fee || 0);
      monthSums[key].taxncredit += Number(upload.taxncredit || 0);
      monthSums[key].net_credits += Number(upload.total_net_credits || 0);
      monthSums[key].profit2 += Number(upload.total_profit || 0);
      monthSums[key].advertisingCosts += Number(upload.advertising_total || 0);
      monthSums[key].Other += Number(upload.otherwplatform || 0);
      monthSums[key].profit += Number(upload.cm2_profit || 0);
    });

    const fixedOrder = [
      { key: "sales", label: "Sales", sign: "(+)" },
      { key: "total_cous", label: "COGS", sign: "(-)" },
      { key: "AmazonExpense", label: "Amazon Fees", sign: "(-)" },
      { key: "taxncredit", label: "Taxes & Credits", sign: "(+)" },
      { key: "profit2", label: "CM1 Profit", sign: "" },
      { key: "advertisingCosts", label: "Advertising Costs", sign: "(-)" },
      { key: "Other", label: "Others", sign: "(-)" },
      { key: "profit", label: "CM2 Profit", sign: "" },
    ];

    const header = ["Month", ...fixedOrder.map((i) => i.label)];
    const signRow = [" ", ...fixedOrder.map((i) => i.sign)];
    const worksheetData: (string | number)[][] = [header, signRow];

    rawLabels.forEach((raw, idx) => {
      const display = labelsNorm[idx];
      const key = raw.toLowerCase();
      const row: (string | number)[] = [display];
      fixedOrder.forEach(({ key: k }) => {
        const rawVal = monthSums[key]?.[k] ?? 0;
        row.push(typeof rawVal === "number" ? Number(rawVal.toFixed(2)) : 0);
      });
      worksheetData.push(row);
    });

    const totalRow: (string | number)[] = ["Total"];
    fixedOrder.forEach(({ key }) => {
      let sum = 0;
      rawLabels.forEach((raw) => {
        const k = raw.toLowerCase();
        sum += monthSums[k]?.[key] || 0;
      });
      totalRow.push(Number(sum.toFixed(2)));
    });
    worksheetData.push(totalRow);

    const finalSheet = [...getExtraRows(), [""], ...worksheetData];

    const ws = XLSX.utils.aoa_to_sheet(finalSheet);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
    XLSX.writeFile(wb, `Metrics-${periodInfo}.xlsx`);
  };

  const noMetricSelected = Object.values(selectedGraphs).every((v) => v === false);

  const toggleMetric = (name: string) => {
    const selectedCount = Object.values(selectedGraphs).filter(Boolean).length;
    const isChecked = !!selectedGraphs[name];

    if (isChecked && selectedCount === 1) {
      setShowModal(true);
      return;
    }

    setSelectedGraphs((prev) => ({ ...prev, [name]: !isChecked }));
  };

  return (
    <div className="relative w-full rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
      {loading ? (
        <div className="flex h-[260px] md:h-[320px] items-center justify-center">
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
        <div className={allValuesZero ? "opacity-30 pointer-events-none" : "opacity-100"}>
          <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-baseline gap-2 justify-center sm:justify-start">
              <PageBreadcrumb
                pageTitle="Profitability"
                variant="page"
                align="left"
                textSize="2xl"
              />
            </div>

            <div className="flex justify-center sm:justify-end">
              <DownloadIconButton onClick={exportToExcel} />
            </div>
          </div>

          {/* Metric toggles */}
          <div
            className={[
              "mt-3 sm:mt-4",
              "flex flex-wrap items-center justify-center",
              "gap-3 sm:gap-4 md:gap-5",
              "w-full mx-auto",
              allValuesZero ? "opacity-30" : "opacity-100",
              "transition-opacity duration-300",
            ].join(" ")}
          >
            {[
              { name: "sales", label: "Net Sales", color: "#2CA9E0" },
              { name: "total_cous", label: "COGS", color: "#AB64B5" },
              { name: "AmazonExpense", label: "Amazon Fees", color: "#FFBE25" },
              { name: "taxncredit", label: "Taxes & Credits", color: "#C03030" },
              { name: "profit2", label: "CM1 Profit", color: "#87AD12" },
              { name: "advertisingCosts", label: "Advertising Costs", color: "#F47A00" },
              { name: "Other", label: "Other", color: "#01627F" },
              { name: "profit", label: "CM2 Profit", color: "#2DA49A" },
            ].map(({ name, label, color }) => {
              const isChecked = !!selectedGraphs[name];

              return (
                <label
                  key={name}
                  className={[
                    "shrink-0",
                    "flex items-center gap-1 sm:gap-1.5",
                    "font-semibold select-none whitespace-nowrap",
                    "text-[9px] sm:text[10px] md:text-[11px] lg:text-xs xl:text-sm",
                    "text-charcoal-500",
                    allValuesZero ? "cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}

                >
                  <span
                    className="flex items-center justify-center h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-sm border transition"
                    style={{
                      borderColor: color,
                      backgroundColor: isChecked ? color : "white",
                      opacity: allValuesZero ? 0.6 : 1,
                    }}
                    onClick={() => !allValuesZero && toggleMetric(name)}
                  >
                    {isChecked && (
                      <svg viewBox="0 0 24 24" width="14" height="14" className="text-white">
                        <path
                          fill="currentColor"
                          d="M20.285 6.709a1 1 0 0 0-1.414-1.414L9 15.168l-3.879-3.88a1 1 0 0 0-1.414 1.415l4.586 4.586a1 1 0 0 0 1.414 0l10-10Z"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="capitalize">{label}</span>
                </label>
              );
            })}
          </div>

          {/* Chart */}
          <div className="relative mt-2 sm:mt-3">
            <div
              className={`flex w-full items-center justify-center
                h-[320px] sm:h-[360px] md:h-[400px] lg:h-[420px]
                transition-opacity duration-300
                ${allValuesZero ? "opacity-30" : "opacity-100"}`}
            >
              {datasets.length > 0 && (
                <Line
                  data={{ labels: formattedLabels, datasets }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                      intersect: false,
                      mode: allValuesZero ? "nearest" : "index",
                    },
                    plugins: {
                      tooltip: {
                        enabled: !allValuesZero,
                        mode: "index",
                        intersect: false,
                        callbacks: {
                          label: (tooltipItem: any) => {
                            const displayLabel = (tooltipItem.dataset.label as string) || "";
                            const value = tooltipItem.raw as number;
                            return `${displayLabel}: ${currencySymbol} ${value.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`;
                          },
                        },
                      },
                      legend: { display: false },
                    },
                    scales: {
                      x: {
                        title: { display: true, text: "Month" },
                        ticks: {
                          minRotation: 0,
                          maxRotation: 0,
                          autoSkip: formattedLabels.length > 6,
                          maxTicksLimit: formattedLabels.length > 0 ? formattedLabels.length : 12,
                          callback: (_v, idx) => String(formattedLabels[idx] ?? ""),
                        },
                      },
                      y: {
                        title: { display: true, text: `Amount (${currencySymbol})` },
                        min: minY,
                        ticks: { padding: 0 },
                      },
                    },
                  }}
                />
              )}
            </div>

            {noMetricSelected && (
              <ModalMsg
                show={showModal}
                onClose={() => setShowModal(false)}
                message="At least one metric must be selected to display the graph."
              />
            )}
          </div>

          {fetchError && (
            <p className="mt-3 text-center text-sm text-red-600">
              Error: {fetchError}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GraphPage;
