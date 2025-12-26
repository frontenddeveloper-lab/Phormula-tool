"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Bargraph from "./BarGraph";
import GraphPage from "./GraphPage";
import CircleChart from "./CircleChart";
import CMchartofsku from "./CMchartofsku";
import SKUtable from "./SKUtable";
import IntegrationDashboard from "@/features/integration/IntegrationDashboard";
import PageBreadcrumb from "../common/PageBreadCrumb";
import Button from "../ui/button/Button";
import { AiOutlinePlus } from "react-icons/ai";
import { Modal } from "@/components/ui/modal";
import FileUploadForm from "@/app/(admin)/(ui-elements)/modals/FileUploadForm";
import PeriodFiltersTable from "../filters/PeriodFiltersTable";
import { FaBoxArchive, FaMoneyBillTrendUp } from "react-icons/fa6";
import { IoMdLock } from "react-icons/io";
import { MdEditDocument } from "react-icons/md";
import { TbMoneybag } from "react-icons/tb";
import { FcSalesPerformance } from "react-icons/fc";
import Loader from "@/components/loader/Loader";
import { useGetUserDataQuery } from "@/lib/api/profileApi";

/* ---------------------- Types ---------------------- */
type Summary = {
  unit_sold: number;
  total_sales: number;      // (your current "Sales")
  gross_sales?: number;     // ✅ ADD THIS
  total_product_sales?: number;
  total_expense: number;
  cm2_profit: number;
  total_cous?: number;
  otherwplatform?: number;
  advertising_total?: number;
  total_amazon_fee?: number;
};



type SummaryComparisons = {
  lastMonth?: Summary;
  lastQuarter?: Summary;
  lastYear?: Summary;
};


type UploadHistoryResponse = {
  summary: Summary;
  summaryComparisons?: SummaryComparisons;
  [key: string]: unknown;
};



type RangeType = "monthly" | "quarterly" | "yearly" | "";

/** Quarter union and helpers */
type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
const isQuarter = (v: string): v is Quarter =>
  (["Q1", "Q2", "Q3", "Q4"] as const).includes(v as Quarter);

type DropdownsProps = {
  initialRanged: string;
  initialCountryName: string;
  initialMonth: string;
  initialYear: string;
};
type ComparisonItem = {
  label: string;
  value?: number;
  diffPct?: number | null;
};

const monthIndexMap: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

const getPrevMonthLabel = (selectedMonth: string, selectedYear: number) => {
  const idx = monthIndexMap[selectedMonth.toLowerCase()];
  if (idx === undefined) return "Last month";

  const prev = new Date(selectedYear, idx - 1, 1);
  const mon = prev.toLocaleString("en-US", { month: "short" }); // Nov
  const yy = String(prev.getFullYear()).slice(-2); // 25
  return `${mon}'${yy}`; // Nov'25
};


/* ---------------------- Utils ---------------------- */
const getCurrencySymbol = (codeOrCountry: string) => {
  const v = (codeOrCountry || "").toLowerCase();

  switch (v) {
    // Home currency / common codes
    case "usd":
    case "us":
    case "global":
      return "$";
    case "inr":
    case "india":
      return "₹";
    case "gbp":
    case "uk":
      return "£";
    case "eur":
    case "europe":
    case "eu":
      return "€";
    case "cad":
    case "ca":
    case "canada":
      return "C$";
    default:
      return "¤";
  }
};

const getQuarterFromMonth = (m: string): Quarter | "" => {
  const month = (m ?? "").toLowerCase();
  const quarters: Record<Quarter, string[]> = {
    Q1: ["january", "february", "march"],
    Q2: ["april", "may", "june"],
    Q3: ["july", "august", "september"],
    Q4: ["october", "november", "december"],
  };
  for (const q of Object.keys(quarters) as Quarter[]) {
    if (quarters[q].includes(month)) return q;
  }
  return "";
};

const getPrevQuarterLabel = (q: Quarter, selectedYear: number) => {
  const order: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
  const idx = order.indexOf(q);
  if (idx === -1) return "Prev quarter";

  const prevIdx = (idx - 1 + 4) % 4;
  const prevQuarter = order[prevIdx];

  const prevYear = idx === 0 ? selectedYear - 1 : selectedYear; // if Q1 -> prev is Q4 of prev year
  const yy = String(prevYear).slice(-2);

  return `${prevQuarter}'${yy}`; // Q4'25
};

const getPrevYearLabel = (selectedYear: number) => {
  return String(selectedYear - 1); // 2024
};


/* ---------------------- Component ---------------------- */
const Dropdowns: React.FC<DropdownsProps> = ({
  initialRanged,
  initialCountryName,
  initialMonth,
  initialYear,
}) => {
  const { data: userData } = useGetUserDataQuery();

  // Normalized home currency from profile (e.g. "usd", "inr")
  const homeCurrency = (userData?.homeCurrency || "USD").toLowerCase();

  const router = useRouter();

  // params from parent
  const ranged = initialRanged;
  const countryName = initialCountryName;
  const month = initialMonth;
  const year = initialYear;

  // Global vs Country page
  const isGlobalPage = countryName.toLowerCase() === "global";

  // For child components: only pass homeCurrency when global
  const globalHomeCurrency = isGlobalPage ? homeCurrency : undefined;

  // Symbol for summary cards
  const currencySymbol = isGlobalPage
    ? getCurrencySymbol(homeCurrency) // GLOBAL → homeCurrency
    : getCurrencySymbol(countryName || ""); // Country → country currency

  const [range, setRange] = useState<RangeType>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | "">("");
  const [uploadsData, setUploadsData] = useState<UploadHistoryResponse | null>(
    null
  );
  const [allDropdownsSelected, setAllDropdownsSelected] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNoDataOverlay, setShowNoDataOverlay] = useState(false);

  const layoutRef = useRef<HTMLDivElement | null>(null);
  const [overlayBounds, setOverlayBounds] = useState<{
    left: number;
    width: number;
  }>({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    setShowNoDataOverlay(false);
  }, [range, selectedMonth, selectedQuarter, selectedYear]);

  useEffect(() => {
    if (!showNoDataOverlay) return;

    const updateBounds = () => {
      if (!layoutRef.current) return;
      const rect = layoutRef.current.getBoundingClientRect();
      setOverlayBounds({
        left: rect.left,
        width: rect.width,
      });
    };

    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, [showNoDataOverlay]);

  const yearOptions = useMemo(
    () => [new Date().getFullYear(), new Date().getFullYear() - 1].map(String),
    []
  );

  const zeroData: Summary = {
    unit_sold: 0,
    total_sales: 0,
    gross_sales: 0, // ✅ ADD THIS
    total_product_sales: 0,
    total_expense: 0,
    cm2_profit: 0,
    total_cous: 0,
    otherwplatform: 0,
    advertising_total: 0,
    total_amazon_fee: 0,
  };


  const displayData: Summary =
    allDropdownsSelected && uploadsData?.summary
      ? uploadsData.summary
      : zeroData;


  console.log("🔍 displayData:", displayData);

  // range: "monthly" | "quarterly" | "yearly"
  const handleRangeChange = (v: "monthly" | "quarterly" | "yearly") => {
    setRange(v);
    setSelectedMonth("");
    setSelectedQuarter("");
    setSelectedYear("");
    setUploadsData(null);
  };

  const fetchUploadHistory = async (
    rangeType: RangeType,
    monthVal: string,
    quarterVal: string, // safe for the API as plain string
    yearVal: string,
    country: string
  ) => {
    if (!rangeType || !yearVal) return;

    setLoading(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("jwtToken")
          : null;

      const url = new URL("http://127.0.0.1:5000/upload_history2");
      url.searchParams.set("range", rangeType);
      url.searchParams.set("month", monthVal);
      url.searchParams.set("quarter", quarterVal);
      url.searchParams.set("year", yearVal);
      url.searchParams.set("country", country);

      // ✅ Only for GLOBAL send homeCurrency
      if (country.toLowerCase() === "global" && homeCurrency) {
        url.searchParams.set("homeCurrency", homeCurrency);
      }

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error(`API Error: ${err?.error ?? res.statusText}`);
        // setUploadsData(null);
        return;
      }

      const data: UploadHistoryResponse = await res.json();
      setUploadsData(data);
    } catch (error) {
      console.error("Error fetching data: ", error);
      // setUploadsData(null);
    } finally {
      setLoading(false);
    }
  };

  // month comes in as lowercase from PeriodFiltersTable ("january", etc.)
  const handleMonthChange = (v: string) => {
    setSelectedMonth(v);

    if (selectedYear) {
      fetchUploadHistory(range, v, selectedQuarter || "", selectedYear, countryName);
    } else {
      setUploadsData(null);
    }
  };

  // quarter is "Q1" | "Q2" | "Q3" | "Q4"
  const handleQuarterChange = (v: string) => {
    const q = isQuarter(v) ? v : "";
    setSelectedQuarter(q);

    if (selectedYear && q) {
      fetchUploadHistory(range, selectedMonth, q, selectedYear, countryName);
    } else {
      setUploadsData(null);
    }
  };

  const handleYearChange = (v: string) => {
    setSelectedYear(v);

    if (
      (range === "monthly" && selectedMonth) ||
      (range === "quarterly" && selectedQuarter) ||
      range === "yearly"
    ) {
      fetchUploadHistory(range, selectedMonth, selectedQuarter || "", v, countryName);
    } else {
      setUploadsData(null);
    }
  };

  // Initialize range & selections from incoming params
  useEffect(() => {
    if (ranged === "QTD") {
      setRange("quarterly");
      const q = getQuarterFromMonth(month);
      setSelectedQuarter(q); // Quarter | ""
      setSelectedYear(year);
    } else if (ranged === "MTD") {
      setRange("monthly");
      setSelectedMonth(month);
      setSelectedYear(year);
    } else if (ranged === "YTD") {
      setRange("yearly");
      setSelectedYear(year);
    }
  }, [ranged, month, year]);

  // ✅ only change when global currency changes (prevents country pages going 0)
  const fetchCurrencyKey = isGlobalPage ? homeCurrency : "country";

  useEffect(() => {
    if (!countryName) return;
    if (range === "" || !selectedYear) return;

    fetchUploadHistory(
      range,
      selectedMonth,
      selectedQuarter || "",
      selectedYear,
      countryName
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, selectedMonth, selectedQuarter, selectedYear, countryName, fetchCurrencyKey]);


  // Validate dropdown completeness
  useEffect(() => {
    if (range === "monthly") {
      setAllDropdownsSelected(!!selectedMonth && !!selectedYear);
    } else if (range === "quarterly") {
      setAllDropdownsSelected(!!selectedQuarter && !!selectedYear);
    } else if (range === "yearly") {
      setAllDropdownsSelected(!!selectedYear);
    } else {
      setAllDropdownsSelected(false);
    }
  }, [range, selectedMonth, selectedQuarter, selectedYear]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const body = document.body;

    if (showNoDataOverlay) {
      body.style.overflow = "hidden"; // lock both X/Y scroll
    } else {
      body.style.overflow = ""; // restore default
    }

    return () => {
      body.style.overflow = ""; // cleanup on unmount
    };
  }, [showNoDataOverlay]);

  const goBack = () => router.push("/country/QTD/global/NA/NA");

  if (month === "NA" || year === "NA") {
    return <IntegrationDashboard />;
  }

  /* 🌟 Initial fullscreen loader for this page */
  const hasAnyContent = !!uploadsData?.summary;
  const initialLoading = loading && !hasAnyContent;



  if (initialLoading) {
    return (
      <Loader
        src="/infinity-unscreen.gif"
        label="Loading financial metrics…"
        fullscreen
        size={120}
        roundedClass="rounded-none"
        backgroundClass="bg-neutral-900/60"
        respectReducedMotion
      />
    );
  }

  // 🔹 4) TITLE HELPERS FOR THE OVERLAY
  const capitalizeFirstLetter = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const convertToAbbreviatedMonth = (m?: string) =>
    m ? capitalizeFirstLetter(m).slice(0, 3) : "";

  const getTitle = () => {
    if (range === "quarterly" && selectedQuarter) {
      return `${capitalizeFirstLetter(
        range
      )} Tracking Profitability - ${selectedQuarter}'${String(selectedYear).slice(
        -2
      )}`;
    }
    if (range === "monthly" && selectedMonth) {
      return `${capitalizeFirstLetter(
        range
      )} Tracking Profitability - ${convertToAbbreviatedMonth(
        selectedMonth
      )} ${selectedYear}`;
    }
    return `${capitalizeFirstLetter(range)} Tracking Profitability - ${selectedYear}`;
  };

  return (
    <div ref={layoutRef} className="space-y-6 relative">

      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* LEFT: Title + Subtitle */}
        <div className="flex flex-col leading-tight w-full md:w-auto">
          <div className="flex items-baseline gap-2">
            <PageBreadcrumb
              pageTitle="Financial Metrics -"
              variant="page"
              align="left"
              textSize="2xl"
            />

            <span className="text-green-500 font-bold text-lg sm:text-2xl md:text-2xl">
              {countryName?.toLowerCase() === "global"
                ? "Global"
                : countryName?.toUpperCase()}
            </span>
          </div>

          <p className="text-sm text-charcoal-500 mt-1">
            Track your profitability and key metrics
          </p>
        </div>

        {/* RIGHT: Filters */}
        <div className="flex w-full md:w-auto justify-start md:justify-end">
          <PeriodFiltersTable
            range={range === "" ? "monthly" : (range as "monthly" | "quarterly" | "yearly")}
            selectedMonth={selectedMonth}
            selectedQuarter={selectedQuarter || ""}
            selectedYear={selectedYear}
            yearOptions={yearOptions}
            onRangeChange={handleRangeChange}
            onMonthChange={handleMonthChange}
            onQuarterChange={handleQuarterChange}
            onYearChange={handleYearChange}
          />
        </div>
      </div>

      {/* WRAPPER: stacked layout */}
      <div className="flex flex-col gap-5 w-full">

        {/* Summary Cards */}
        {uploadsData?.summary &&
          (() => {
            const summary = displayData;
            const netSales = summary.total_sales;


            // ✅ comparisons (camelCase OR snake_case)
            const rawComparisons =
              (uploadsData as any).summaryComparisons ??
              (uploadsData as any).summary_comparisons;

            const comparisons: SummaryComparisons | undefined = rawComparisons
              ? (rawComparisons as SummaryComparisons)
              : undefined;

            // ✅ define formatters FIRST (used below)
            const formatMoney = (val: number) =>
              `${currencySymbol} ${val.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;

            const formatUnits = (val: number) =>
              val.toLocaleString(undefined, { maximumFractionDigits: 0 });

            const formatPercent = (val: number) =>
              `${val.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}%`;

            // ✅ gross sales accessor (uses backend total_product_sales)
            const getGrossSales = (s?: Summary) =>
              s?.total_product_sales ?? s?.gross_sales ?? 0;

            const isSummaryZero =
              summary.unit_sold === 0 &&
              summary.total_sales === 0 &&
              summary.total_expense === 0 &&
              summary.cm2_profit === 0;

            // const cm2Percent =
            //   summary.total_sales > 0 ? (summary.cm2_profit / summary.total_sales) * 100 : 0;

            const cm2Percent =
              netSales > 0 ? (summary.cm2_profit / netSales) * 100 : 0;

            console.log("SUMMARY KEYS:", Object.keys(summary as any));
            console.log("SUMMARY RAW:", summary);


            // ---------- generic comparisons helper ----------
            const getComparisons = (metric: keyof Summary): ComparisonItem[] => {
              const current = summary[metric] ?? 0;

              const lm = comparisons?.lastMonth?.[metric];
              const lq = comparisons?.lastQuarter?.[metric];
              const ly = comparisons?.lastYear?.[metric];

              const makeItem = (label: string, prevVal?: number): ComparisonItem => {
                if (typeof prevVal !== "number") return { label, value: undefined, diffPct: null };
                const diffPct = prevVal === 0 ? null : ((current - prevVal) / prevVal) * 100;
                return { label, value: prevVal, diffPct };
              };

              const yNum = Number(selectedYear);

              if (range === "monthly") {
                const label = selectedMonth && yNum ? getPrevMonthLabel(selectedMonth, yNum) : "Prev month";
                return [makeItem(label, lm)];
              }

              if (range === "quarterly") {
                const label =
                  selectedQuarter && yNum
                    ? getPrevQuarterLabel(selectedQuarter as Quarter, yNum)
                    : "Prev quarter";
                return [makeItem(label, lq)];
              }

              if (range === "yearly") {
                const label = yNum ? getPrevYearLabel(yNum) : "Prev year";
                return [makeItem(label, ly)];
              }

              return [];
            };

            const renderComparisons = (metric: keyof Summary, formatter: (val: number) => string) => {
              const items = getComparisons(metric);
              if (!items.length) return null;

              return (
                <div className="mt-3 space-y-2">
                  {items.map((item) => {
                    const hasValue = typeof item.value === "number" && !isNaN(item.value);
                    const hasDiff = typeof item.diffPct === "number" && !isNaN(item.diffPct);

                    const diffClass = hasDiff
                      ? item.diffPct! >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                      : "text-gray-400";

                    return (
                      <div
                        key={item.label}
                        className="flex items-end justify-between gap-3 text-xs leading-tight tabular-nums"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-600 whitespace-nowrap">
                            {item.label}:
                          </div>
                          <div className="font-semibold text-gray-800 whitespace-nowrap">
                            {hasValue ? formatter(item.value!) : "-"}
                          </div>
                        </div>

                        <div className={`font-bold whitespace-nowrap ${diffClass}`}>
                          {hasDiff ? (
                            <>
                              {item.diffPct! >= 0 ? "▲" : "▼"}{" "}
                              {Math.abs(item.diffPct!).toFixed(2)}%
                            </>
                          ) : (
                            "-"
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            };

            const pickNum = (obj: any, keys: string[]) => {
              for (const k of keys) {
                const v = obj?.[k];
                if (v === 0) return 0;
                if (typeof v === "number" && !isNaN(v)) return v;
                if (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))) return Number(v);
              }
              return 0;
            };


            // ---------- Gross Sales comparisons ----------
            const getGrossSalesComparisons = (): ComparisonItem[] => {
              const current = getGrossSales(summary);
              const yNum = Number(selectedYear);

              const prevMonth = comparisons?.lastMonth ? getGrossSales(comparisons.lastMonth) : undefined;
              const prevQuarter = comparisons?.lastQuarter ? getGrossSales(comparisons.lastQuarter) : undefined;
              const prevYear = comparisons?.lastYear ? getGrossSales(comparisons.lastYear) : undefined;

              const makeItem = (label: string, prevVal?: number): ComparisonItem => {
                if (typeof prevVal !== "number") return { label, value: undefined, diffPct: null };
                const diffPct = prevVal === 0 ? null : ((current - prevVal) / prevVal) * 100;
                return { label, value: prevVal, diffPct };
              };

              if (range === "monthly") {
                const label = selectedMonth && yNum ? getPrevMonthLabel(selectedMonth, yNum) : "Prev month";
                return [makeItem(label, prevMonth)];
              }

              if (range === "quarterly") {
                const label =
                  selectedQuarter && yNum
                    ? getPrevQuarterLabel(selectedQuarter as Quarter, yNum)
                    : "Prev quarter";
                return [makeItem(label, prevQuarter)];
              }

              if (range === "yearly") {
                const label = yNum ? getPrevYearLabel(yNum) : "Prev year";
                return [makeItem(label, prevYear)];
              }

              return [];
            };

            const renderGrossSalesComparisons = () => {
              const items = getGrossSalesComparisons();
              if (!items.length) return null;
              return (
                <div className="mt-3 space-y-2">
                  {items.map((item) => {
                    const hasValue = typeof item.value === "number" && !isNaN(item.value);
                    const hasDiff = typeof item.diffPct === "number" && !isNaN(item.diffPct);

                    const diffClass = hasDiff
                      ? item.diffPct! >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                      : "text-gray-400";

                    return (
                      <div
                        key={item.label}
                        className="flex items-end justify-between gap-3 text-xs leading-tight tabular-nums"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-600 whitespace-nowrap">
                            {item.label}:
                          </div>
                          <div className="font-semibold text-gray-800 whitespace-nowrap">
                            {hasValue ? formatMoney(item.value!) : "-"}
                          </div>
                        </div>

                        <div className={`font-bold whitespace-nowrap ${diffClass}`}>
                          {hasDiff ? (
                            <>
                              {item.diffPct! >= 0 ? "▲" : "▼"}{" "}
                              {Math.abs(item.diffPct!).toFixed(2)}%
                            </>
                          ) : (
                            "-"
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            };

            // ---------- CM2% comparisons ----------
            const getCm2Percent = (s?: Summary) =>
              s && s.total_sales > 0 ? (s.cm2_profit / s.total_sales) * 100 : 0;
            const renderCm2PercentComparisons = () => {
              const yNum = Number(selectedYear);

              const label =
                range === "monthly"
                  ? selectedMonth && yNum
                    ? getPrevMonthLabel(selectedMonth, yNum)
                    : "Prev month"
                  : range === "quarterly"
                    ? selectedQuarter && yNum
                      ? getPrevQuarterLabel(selectedQuarter as Quarter, yNum)
                      : "Prev quarter"
                    : yNum
                      ? getPrevYearLabel(yNum)
                      : "Prev year";

              const prevVal =
                range === "monthly"
                  ? comparisons?.lastMonth
                    ? getCm2Percent(comparisons.lastMonth)
                    : undefined
                  : range === "quarterly"
                    ? comparisons?.lastQuarter
                      ? getCm2Percent(comparisons.lastQuarter)
                      : undefined
                    : comparisons?.lastYear
                      ? getCm2Percent(comparisons.lastYear)
                      : undefined;

              const hasPrev = typeof prevVal === "number" && !isNaN(prevVal);

              const diffPct =
                hasPrev && prevVal !== 0 ? ((cm2Percent - prevVal) / prevVal) * 100 : null;

              const diffClass =
                typeof diffPct === "number"
                  ? diffPct >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                  : "text-gray-400";

              return (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-end justify-between gap-3 text-xs leading-tight tabular-nums">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-600 whitespace-nowrap">
                        {label}:
                      </div>
                      <div className="font-semibold text-gray-800 whitespace-nowrap">
                        {hasPrev ? formatPercent(prevVal!) : "-"}
                      </div>
                    </div>

                    <span className={`font-bold whitespace-nowrap ${diffClass}`}>
                      {typeof diffPct === "number" ? (
                        <>
                          {diffPct >= 0 ? "▲" : "▼"} {Math.abs(diffPct).toFixed(1)}%
                        </>
                      ) : (
                        "-"
                      )}
                    </span>
                  </div>
                </div>
              );
            };


            return (
              <div
                className={[
                  "w-full grid gap-4",
                  "grid-cols-2 xl:grid-cols-6",
                  isSummaryZero ? "opacity-30" : "opacity-100",
                ].join(" ")}
              >
                {/* Units */}
                <div className="w-full rounded-2xl border border-[#87AD12] bg-[#87AD1226] shadow-sm px-4 py-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-charcoal-500">Units</span>
                    <FaBoxArchive color="#87AD12" size={16} />
                  </div>
                  <div className="text-lg font-extrabold text-charcoal-500 leading-tight tabular-nums">
                    {formatUnits(summary.unit_sold)}
                  </div>
                  {renderComparisons("unit_sold", formatUnits)}
                </div>

                {/* Gross Sales (✅ uses homeCurrency symbol when global because currencySymbol comes from homeCurrency) */}
                <div className="w-full rounded-2xl border border-[#FFD54F] bg-[#FFD54F26] shadow-sm px-4 py-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-charcoal-500">Gross Sales</span>
                    <FcSalesPerformance fill="000" color="#000" size={16} />
                  </div>
                  <div className="text-lg font-extrabold text-charcoal-500 leading-tight tabular-nums">
                    {formatMoney(getGrossSales(summary))}
                  </div>
                  {renderGrossSalesComparisons()}
                </div>

                {/* Net Sales */}
                <div className="w-full rounded-2xl border border-[#FFBE25] bg-[#FFBE2526] shadow-sm px-4 py-3 flex flex-col justify-between">
                  <span className="text-xs text-charcoal-500">Net Sales</span>
                  <div className="text-lg font-extrabold text-charcoal-500 leading-tight tabular-nums">
                    {formatMoney(netSales)}
                  </div>
                  {renderComparisons("total_sales", formatMoney)}
                </div>


                {/* Expenses */}
                <div className="w-full rounded-2xl border border-[#FF5C5C] bg-[#FF5C5C26] shadow-sm px-4 py-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-charcoal-500">Expenses</span>
                    <MdEditDocument color="#FF5C5C" size={16} />
                  </div>
                  <div className="text-lg font-extrabold text-charcoal-500 leading-tight tabular-nums">
                    {formatMoney(summary.total_expense)}
                  </div>
                  {renderComparisons("total_expense", formatMoney)}
                </div>

                {/* CM2 Profit */}
                <div className="w-full rounded-2xl border border-[#AB64B5] bg-[#AB64B526] shadow-sm px-4 py-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-charcoal-500">CM2 Profit</span>
                    <TbMoneybag fill="#AB64B5" color="#AB64B5" size={16} />
                  </div>
                  <div className="text-lg font-extrabold text-charcoal-500 leading-tight tabular-nums">
                    {formatMoney(summary.cm2_profit)}
                  </div>
                  {renderComparisons("cm2_profit", formatMoney)}
                </div>

                {/* CM2 Profit % */}
                <div className="w-full rounded-2xl border border-[#00627B] bg-[#00627B26] shadow-sm px-4 py-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-charcoal-500">CM2 Profit %</span>
                    <FaMoneyBillTrendUp color="#00627B" size={16} />
                  </div>
                  <div className="text-lg font-extrabold text-charcoal-500 leading-tight tabular-nums">
                    {formatPercent(cm2Percent)}
                  </div>
                  {renderCm2PercentComparisons()}
                </div>
              </div>
            );
          })()}

      </div>

      {/* Charts & Tables */}
      {range === "monthly" && selectedMonth && selectedYear && (
        <>
          <Bargraph
            range={range}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            countryName={initialCountryName}
            homeCurrency={globalHomeCurrency}
            onNoDataChange={(noData) => {
              console.log("🔥 [Monthly] Bargraph → onNoDataChange:", noData);
              setShowNoDataOverlay(noData);
            }}
          />
          <div className="flex flex-wrap justify-between gap-6 md:gap-4 mb-4">
            <div className="flex-1 min-w-[300px]">
              <CircleChart
                range={range}
                month={selectedMonth}
                year={selectedYear}
                countryName={initialCountryName}
                homeCurrency={globalHomeCurrency}
              />
            </div>
            <div className="flex-1 min-w-[300px]">
              <CMchartofsku
                range={range}
                month={selectedMonth}
                year={selectedYear}
                countryName={initialCountryName}
                homeCurrency={globalHomeCurrency}
              />
            </div>
          </div>
          <SKUtable
            range={range}
            month={selectedMonth}
            year={selectedYear}
            countryName={initialCountryName}
            homeCurrency={globalHomeCurrency}
          />
        </>
      )}

      {range === "quarterly" && isQuarter(selectedQuarter) && selectedYear && (
        <>
          <GraphPage
            range={range}
            selectedQuarter={selectedQuarter}
            selectedYear={selectedYear}
            countryName={initialCountryName}
            homeCurrency={globalHomeCurrency}
            onNoDataChange={(noData) => {
              console.log("🔥 [Quarterly] GraphPage → onNoDataChange:", noData);
              setShowNoDataOverlay(noData);
            }}
          />
          <div className="flex flex-wrap justify-between gap-6 md:gap-4">
            <div className="flex-1 min-w-[300px]">
              <CircleChart
                range={range}
                selectedQuarter={selectedQuarter}
                year={selectedYear}
                countryName={initialCountryName}
                homeCurrency={globalHomeCurrency}
              />
            </div>
            <div className="flex-1 min-w-[300px]">
              <CMchartofsku
                range={range}
                selectedQuarter={selectedQuarter}
                year={selectedYear}
                countryName={initialCountryName}
                homeCurrency={globalHomeCurrency}
              />
            </div>
          </div>
          <SKUtable
            range={range}
            quarter={selectedQuarter}
            year={selectedYear}
            countryName={initialCountryName}
            homeCurrency={globalHomeCurrency}
          />
        </>
      )}

      {range === "yearly" && selectedYear && (
        <>
          <GraphPage
            range={range}
            selectedYear={selectedYear}
            countryName={initialCountryName}
            homeCurrency={globalHomeCurrency}
            onNoDataChange={(noData) => {
              console.log("🔥 [Yearly] GraphPage → onNoDataChange:", noData);
              setShowNoDataOverlay(noData);
            }}
          />
          <div className="flex flex-wrap justify-between gap-6 md:gap-4">
            <div className="flex-1 min-w-[300px]">
              <CircleChart
                range={range}
                year={selectedYear}
                countryName={initialCountryName}
                homeCurrency={globalHomeCurrency}
              />
            </div>
            <div className="flex-1 min-w-[300px]">
              <CMchartofsku
                range={range}
                year={selectedYear}
                countryName={initialCountryName}
                homeCurrency={globalHomeCurrency}
              />
            </div>
          </div>
          <SKUtable
            range={range}
            year={selectedYear}
            countryName={initialCountryName}
            homeCurrency={globalHomeCurrency}
          />
        </>
      )}

      {showNoDataOverlay && (
        <div
          className="fixed inset-y-0 z-[9999] flex items-center justify-center pointer-events-none"
          style={{ left: overlayBounds.left, width: overlayBounds.width || "100%" }}
        >
          <div className="bg-white border border-[#D9D9D9] rounded-xl shadow-xl p-6 max-w-lg w-[90%] text-center pointer-events-auto">
            {/* Lock icon */}
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D9D9D9]">
                <IoMdLock className="text-green-500 text-2xl" />
              </div>
            </div>

            <PageBreadcrumb
              pageTitle="No Data Available"
              variant="table"
              align="center"
              textSize="2xl"
            />

            <p className="text-charcoal-500 text-xs sm:text-sm leading-relaxed my-4">
              To see performance metrics, you need to upload more files for
              <span className="block mt-0.5">{getTitle()}</span>
            </p>

            {/* {countryName.toLowerCase() !== "global" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowUploadModal(true)}
                className="mt-1 inline-flex items-center justify-center text-sm font-medium"
              >
                Upload MTD(s)
              </Button>
            )} */}
          </div>
        </div>
      )}

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        className="max-w-3xl w-[90vw] mx-auto p-0 shadow-[6px_6px_7px_0px_#00000026] border border-[#D9D9D9]"
        showCloseButton
      >
        <div className="max-h-[85vh] overflow-y-auto">
          <FileUploadForm
            initialCountry={initialCountryName}
            onClose={() => setShowUploadModal(false)}
            onComplete={() => {
              setShowUploadModal(false);
              fetchUploadHistory(
                range,
                selectedMonth,
                selectedQuarter || "",
                selectedYear,
                initialCountryName
              );
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Dropdowns;
