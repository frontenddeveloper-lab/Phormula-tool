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
import Loader from "@/components/loader/Loader"; // 👈 NEW

/* ---------------------- Types ---------------------- */
type Summary = {
  unit_sold: number;
  total_sales: number;
  total_expense: number;
  cm2_profit: number;
  total_cous?: number;
  otherwplatform?: number;
  advertising_total?: number;
  total_amazon_fee?: number;
};

type UploadHistoryResponse = {
  summary: Summary;
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

/* ---------------------- Utils ---------------------- */
const getCurrencySymbol = (country: string) => {
  switch (country.toLowerCase()) {
    case "uk":
      return "£";
    case "india":
      return "₹";
    case "us":
      return "$";
    case "europe":
    case "eu":
      return "€";
    case "global":
      return "$";
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

/* ---------------------- Component ---------------------- */
const Dropdowns: React.FC<DropdownsProps> = ({
  initialRanged,
  initialCountryName,
  initialMonth,
  initialYear,
}) => {
  const router = useRouter();

  // params from parent
  const ranged = initialRanged;
  const countryName = initialCountryName;
  const month = initialMonth;
  const year = initialYear;

  const currencySymbol = countryName ? getCurrencySymbol(countryName) : "¤";

  const [range, setRange] = useState<RangeType>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | "">("");
  const [uploadsData, setUploadsData] = useState<UploadHistoryResponse | null>(
    null
  );
  const [allDropdownsSelected, setAllDropdownsSelected] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(false); // 👈 NEW
  const [showNoDataOverlay, setShowNoDataOverlay] = useState(false);

  const layoutRef = useRef<HTMLDivElement | null>(null);
  const [overlayBounds, setOverlayBounds] = useState<{ left: number; width: number }>({
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

    setLoading(true); // 👈 NEW
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

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error(`API Error: ${err?.error ?? res.statusText}`);
        setUploadsData(null);
        return;
      }

      const data: UploadHistoryResponse = await res.json();
      setUploadsData(data);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setUploadsData(null);
    } finally {
      setLoading(false); // 👈 NEW
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

  // Auto-fetch when selections change
  useEffect(() => {
    if (!countryName) return;
    if (range === "") return;

    fetchUploadHistory(
      range,
      selectedMonth,
      selectedQuarter || "",
      selectedYear,
      countryName
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, selectedMonth, selectedQuarter, selectedYear, countryName]);

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
      body.style.overflow = "hidden";   // lock both X/Y scroll
    } else {
      body.style.overflow = "";         // restore default
    }

    return () => {
      body.style.overflow = "";         // cleanup on unmount
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
    <div ref={layoutRef} className="space-y-5 relative">
      {/* Back / Title */}
      <div className="flex flex-col leading-tight">

        {/* TOP ROW: Title + Country */}
        <div className="flex gap-2">
          <PageBreadcrumb
            pageTitle="Financial Metrics -"
            variant="page"
            align="left"
            textSize="2xl"
          />

          <span className="text-green-500 font-bold text-lg sm:text-2xl md:text-2xl">
            {countryName?.toLowerCase() === "global"
              ? "GLOBAL"
              : countryName?.toUpperCase()}
          </span>
        </div>

        {/* SUBTITLE (same as image) */}
        <p className="text-sm text-charcoal-500 mt-1">
          Track your profitability and key metrics
        </p>
      </div>


      {/* WRAPPER: stacked layout */}
      <div className="flex flex-col gap-5 w-full">
        {/* Top Row: Period Filter + Upload MTD Button */}
        <div className="w-full flex flex-col md:flex-row gap-3 items-center justify-between">
          <PeriodFiltersTable
            range={
              range === ""
                ? "monthly"
                : (range as "monthly" | "quarterly" | "yearly")
            }
            selectedMonth={selectedMonth}
            selectedQuarter={selectedQuarter || ""}
            selectedYear={selectedYear}
            yearOptions={yearOptions}
            onRangeChange={handleRangeChange}
            onMonthChange={handleMonthChange}
            onQuarterChange={handleQuarterChange}
            onYearChange={handleYearChange}
          />

          {countryName !== "global" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowUploadModal(true)}
              startIcon={<AiOutlinePlus className="text-yellow-200" />}
            >
              Upload MTD(s)
            </Button>
          )}
        </div>


        {/* Summary Cards */}
        {uploadsData?.summary &&
          (() => {
            const summary = displayData;
            const isSummaryZero =
              summary.unit_sold === 0 &&
              summary.total_sales === 0 &&
              summary.total_expense === 0 &&
              summary.cm2_profit === 0;

            const cm2Percent =
              summary.total_sales > 0
                ? (summary.cm2_profit / summary.total_sales) * 100
                : 0;

            const formatMoney = (val: number) =>
              `${currencySymbol} ${val.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}`;

            const formatUnits = (val: number) =>
              val.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              });

            const formatPercent = (val: number) =>
              `${val.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}%`;

            return (
              <div
                className={[
                  "w-full flex flex-wrap gap-7",
                  isSummaryZero ? "opacity-30" : "opacity-100",
                ].join(" ")}
              >
                {/* Units */}
                <div className="flex-1 min-w-[180px] max-w-xs rounded-2xl border border-[#87AD12] bg-[#87AD1226] shadow-sm px-4 py-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-charcoal-500">Units</span>
                    <FaBoxArchive color="#87AD12" size={16} />
                  </div>
                  <div className="text-xl font-extrabold text-charcoal-500">
                    {formatUnits(summary.unit_sold)}
                  </div>
                </div>

                {/* Sales */}
                <div className="flex-1 min-w-[180px] max-w-xs rounded-2xl border border-[#FFBE25] bg-[#FFBE2526] shadow-sm px-4 py-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-charcoal-500">Sales</span>
                    <FcSalesPerformance fill="000" color="#000" size={16} />
                  </div>
                  <div className="text-xl font-extrabold text-charcoal-500">
                    {formatMoney(summary.total_sales)}
                  </div>
                </div>

                {/* Expense */}
                <div className="flex-1 min-w-[180px] max-w-xs rounded-2xl border border-[#FF5C5C] bg-[#FF5C5C26] shadow-sm px-4 py-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-charcoal-500">Expenses</span>
                    <MdEditDocument color="#FF5C5C" size={16} />
                  </div>
                  <div className="text-xl font-extrabold text-charcoal-500">
                    {formatMoney(summary.total_expense)}
                  </div>
                </div>

                {/* CM2 Profit */}
                <div className="flex-1 min-w-[180px] max-w-xs rounded-2xl border border-[#AB64B5] bg-[#AB64B526] shadow-sm px-4 py-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-charcoal-500">CM2 Profit</span>
                    <TbMoneybag fill="#AB64B5" color="#AB64B5" size={16} />
                  </div>
                  <div className="text-xl font-extrabold text-charcoal-500">
                    {formatMoney(summary.cm2_profit)}
                  </div>
                </div>

                {/* CM2 Profit % */}
                <div className="flex-1 min-w-[180px] max-w-xs rounded-2xl border border-[#00627B] bg-[#00627B26] shadow-sm px-4 py-3 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-charcoal-500">CM2 Profit %</span>
                    <FaMoneyBillTrendUp color="#00627B" size={16} />
                  </div>
                  <div className="text-xl font-extrabold text-charcoal-500">
                    {formatPercent(cm2Percent)}
                  </div>
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
              />
            </div>
            <div className="flex-1 min-w-[300px]">
              <CMchartofsku
                range={range}
                month={selectedMonth}
                year={selectedYear}
                countryName={initialCountryName}
              />
            </div>
          </div>
          <SKUtable
            range={range}
            month={selectedMonth}
            year={selectedYear}
            countryName={initialCountryName}
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
              />
            </div>
            <div className="flex-1 min-w-[300px]">
              <CMchartofsku
                range={range}
                selectedQuarter={selectedQuarter}
                year={selectedYear}
                countryName={initialCountryName}
              />
            </div>
          </div>
          <SKUtable
            range={range}
            quarter={selectedQuarter}
            year={selectedYear}
            countryName={initialCountryName}
          />
        </>
      )}

      {range === "yearly" && selectedYear && (
        <>
          <GraphPage
            range={range}
            selectedYear={selectedYear}
            countryName={initialCountryName}
            onNoDataChange={(noData) => {
              console.log("🔥 [Yearly] GraphPage → onNoDataChange:", noData);
              setShowNoDataOverlay(noData);
            }}
          />
          <div className="flex flex-wrap justify-between gap-6 md:gap-4">
            <div className="flex-1 min-w-[300px]">
              <CircleChart range={range} year={selectedYear} countryName={initialCountryName} />
            </div>
            <div className="flex-1 min-w-[300px]">
              <CMchartofsku range={range} year={selectedYear} countryName={initialCountryName} />
            </div>
          </div>
          <SKUtable range={range} year={selectedYear} countryName={initialCountryName} />
        </>
      )}

      {showNoDataOverlay && (<div className=" fixed inset-y-0 z-[99999] flex items-center justify-center pointer-events-none " style={{ left: overlayBounds.left, width: overlayBounds.width || "100%", }} > <div className=" bg-white border border-[#D9D9D9] rounded-xl shadow-xl p-6 max-w-lg w-[90%] text-center pointer-events-auto " >
        {/* Lock icon */}
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D9D9D9]">
           <IoMdLock className="text-green-500 text-2xl"/>
          </div>
        </div>

        {/* Title */}
        {/* <h3 className="text-slate-800 font-semibold text-lg mb-1">
          No Data Available
        </h3> */}
        <PageBreadcrumb pageTitle="No Data Available" variant="table" align="center" textSize="2xl" />

        {/* Subtitle */}
        <p className="text-charcoal-500 text-xs sm:text-sm leading-relaxed my-4">
          To see performance metrics, you need to upload more files for
          <span className="block  mt-0.5">
            {getTitle()}
          </span>
        </p>

        {/* CTA */}
        {countryName !== "global" && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUploadModal(true)}
            className="mt-1 inline-flex items-center justify-center text-sm font-medium"
          >
            Upload MTD(s)
          </Button>
        )}
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
