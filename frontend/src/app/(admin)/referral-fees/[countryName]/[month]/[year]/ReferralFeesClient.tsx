





"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  type JSX,
  useCallback,
} from "react";
import { useParams } from "next/navigation";
import MonthYearPickerTable from "@/components/filters/MonthYearPickerTable";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { jwtDecode } from "jwt-decode";
import * as XLSX from "xlsx";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DataTable, { ColumnDef, Row } from "@/components/ui/table/DataTable";
import Loader from "@/components/loader/Loader";
import DownloadButton from "@/components/ui/button/DownloadIconButton";

// ✅ home currency hook (already used in your profits page)
import { useHomeCurrencyContext } from "@/lib/hooks/useHomeCurrencyContext";
import { AiButton } from "@/components/ui/button/AiButton";

/* ===================== Overlap Plugin ===================== */
const overlapPlugin = {
  id: "overlapPlugin",
  afterDatasetsDraw(chart: any, _args: any, pluginOptions: any) {
    const opts = pluginOptions || {};
    const salesTotal = Math.max(0, Number(opts.salesTotal || 0));
    if (!salesTotal) return;

    const applicableValue = Math.max(0, Number(opts.applicableValue || 0));
    const overchargedValue = Math.max(0, Number(opts.overchargedValue || 0));

    const showApplicable = opts.showApplicable !== false;
    const showOvercharged = opts.showOvercharged !== false;

    if (!showApplicable && !showOvercharged) return;

    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    const maskArc = meta.data[0];
    const { x, y, innerRadius, outerRadius, startAngle, endAngle } = maskArc;

    const full = Math.PI * 2;
    const applAngleRaw = showApplicable ? (applicableValue / salesTotal) * full : 0;
    const overAngleRaw = showOvercharged ? (overchargedValue / salesTotal) * full : 0;

    const maskSpan = Math.max(0, endAngle - startAngle);
    const applAngle = Math.min(applAngleRaw, maskSpan);
    const overAngle = Math.min(overAngleRaw, Math.max(0, maskSpan - applAngle));

    const radius = (innerRadius + outerRadius) / 2;
    const thickness = outerRadius - innerRadius;

    const ctx = chart.ctx;
    ctx.save();
    ctx.lineWidth = thickness;
    ctx.lineCap = "butt";

    if (applAngle > 0) {
      ctx.beginPath();
      ctx.strokeStyle = "#14B8A6";
      ctx.arc(x, y, radius, startAngle, startAngle + applAngle);
      ctx.stroke();
    }

    if (overAngle > 0) {
      ctx.beginPath();
      ctx.strokeStyle = "#EF4444";
      ctx.arc(
        x,
        y,
        radius,
        startAngle + applAngle,
        startAngle + applAngle + overAngle
      );
      ctx.stroke();
    }

    ctx.restore();
  },
};

ChartJS.register(ArcElement, Tooltip, Legend, overlapPlugin);

/* ===================== ENV ===================== */
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

/* ===================== Types ===================== */
type ReferralRow = Partial<{
  sku: string;
  product_name: string;
  category: string;
  asin: string;
  quantity: number | string;
  sales: number | string;
  product_sales: number | string;
  refRate: number | string;
  refFeesApplicable: number | string;
  refFeesCharged: number | string;
  overcharged: number | string;
  difference: number | string;
  errorstatus: string;
  selling_fees: number | string;
  answer: number | string;

  net_sales_total_value: number | string;
  status: string;
  total_value: number | string;
}>;

type Summary = {
  ordersUnits: number;
  totalSales: number;
  feeImpact: number;
};

type FeeSummaryRow = {
  label: string;
  units: number;
  sales: number;
  refFeesApplicable: number;
  refFeesCharged: number;
  overcharged: number;
};

type Card6Summary = {
  sales: number;
  totalFees: number;          // charged
  refFeesApplied: number;     // charged
  refFeesApplicable: number;  // applicable
  fbaFees: number;
  platformFees: number;
  otherFees: number;
};

type SalesStatusSummary = {
  totalSales: number;
  accurateSales: number;
  overchargedSales: number;
  underchargedSales: number;
  noRefFeeSales: number;
};

type RefFeesBreakdown = {
  totalApplicable: number; // Grand Total "answer"
  accurateApplicable: number; // Charge - Accurate "answer"
  overchargedApplicable: number; // Charge - Overcharged "answer"
  underchargedApplicable: number; // Charge - Undercharged "answer"
  noRefFeeApplicable: number; // Charge - noreferallfee "answer"
};


/* ===================== Helpers ===================== */
const fmtInteger = (n: number): string =>
  typeof n === "number"
    ? n.toLocaleString(undefined, {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })
    : "-";

const toNumberSafe = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const num = Number(String(v).replace(/[, ]+/g, ""));
  return Number.isNaN(num) ? 0 : num;
};

const getNetSales = (r: any): number => {
  const net = toNumberSafe(r?.net_sales_total_value);
  if (net) return net;
  return toNumberSafe(r?.product_sales ?? r?.sales);
};

const currencyFromCountryName = (countryName: string) => {
  const c = (countryName || "").toLowerCase();
  if (c === "uk") return "GBP";
  if (c === "us") return "USD";
  // add more mappings later if needed
  return "USD";
};

const pctDelta = (current: number, previous: number) => {
  const prev = toNumberSafe(previous);
  if (prev === 0) return 0;
  return ((toNumberSafe(current) - prev) / prev) * 100;
};

const fmtPct = (p: number) => `${Math.abs(p).toFixed(2)}%`;

// --- Fee buckets helpers ---
const isSummaryLine = (sku: any) => {
  const s = String(sku ?? "");
  return s.startsWith("Charge -") || s === "Grand Total" || s.toLowerCase() === "total";
};

const sumByKey = (list: any[], key: string) =>
  list.reduce((acc, r) => acc + toNumberSafe(r?.[key]), 0);

// Customize these patterns to match your data keys/naming
const FBA_KEYS = ["fba_fees", "fulfillment_fees"];
const PLATFORM_KEYS = ["platform_fees", "marketplace_fees"];
const OTHER_KEYS = ["other_fees", "misc_fees"];


/* ===================== Donut Component ===================== */
type OverlapSalesDonutProps = {
  sales: number;
  applicable: number;
  charged: number;
  fmtCurrency: (n: number) => string;
};


function StatCard({
  title,
  value,
  valueFmt,
  bottomLeftLabel,
  bottomLeftValue,
  bottomRightDeltaPct,

  borderColor = "#cbd5e1",
  bgColor = "#ffffff",
}: {
  title: string;
  value: number;
  valueFmt: (n: number) => string;

  bottomLeftLabel?: string;
  bottomLeftValue?: number;
  bottomRightDeltaPct?: number;

  borderColor?: string;
  bgColor?: string;
}) {
  const showBottom =
    bottomLeftLabel !== undefined ||
    bottomLeftValue !== undefined ||
    bottomRightDeltaPct !== undefined;

  const d = typeof bottomRightDeltaPct === "number" ? bottomRightDeltaPct : null;
  const isUp = (d ?? 0) > 0;
  const isDown = (d ?? 0) < 0;

  return (
    <div
      className={`rounded-2xl border shadow-sm px-4 py-3 ${showBottom ? "min-h-[110px] flex flex-col" : ""
        }`}
      style={{ borderColor, backgroundColor: bgColor }}
    >
      <p className="text-xs font-semibold text-charcoal-500">{title}</p>

      <p className="mt-1 text-base font-bold text-charcoal-500">
        {valueFmt(toNumberSafe(value))}
      </p>

      {showBottom && (
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="text-left">
            <p className="text-[11px] sm:text-xs text-slate-600">
              {bottomLeftLabel ?? ""}
            </p>
            <p className="text-[11px] sm:text-xs font-semibold text-charcoal-500">
              {bottomLeftValue !== undefined ? valueFmt(toNumberSafe(bottomLeftValue)) : ""}
            </p>
          </div>

          {d !== null ? (
            <div
              className={`text-[11px] sm:text-xs font-bold flex items-center gap-1 ${isUp ? "text-emerald-600" : isDown ? "text-red-600" : "text-slate-500"
                }`}
            >
              <span className="text-sm leading-none">{isUp ? "▲" : isDown ? "▼" : ""}</span>
              <span>{fmtPct(d)}</span>
            </div>
          ) : (
            <div />
          )}
        </div>
      )}
    </div>
  );
}

/* ===================== MAIN DASHBOARD PAGE ===================== */
export default function ReferralFeesDashboard(): JSX.Element {
  const routeParams = useParams();

  // ✅ IMPORTANT: pick platform/country from URL
  const country = ((routeParams?.countryName as string) || "global").toLowerCase();

  // ✅ Global vs country behavior
  const isGlobalPage = country === "global";

  // ✅ get home currency ONLY for global formatting + api param
  const { homeCurrency: rawHomeCurrency } = useHomeCurrencyContext(country);
  const homeCurrency = isGlobalPage ? (rawHomeCurrency || "USD").toUpperCase() : "";

  // ✅ formatting currency code (NO fallback to homeCurrency on country pages)
  const displayCurrencyCode = useMemo(() => {
    if (isGlobalPage) return homeCurrency;
    return currencyFromCountryName(country);
  }, [isGlobalPage, homeCurrency, country]);

  const [card6, setCard6] = useState<Card6Summary>({
    sales: 0,
    totalFees: 0,
    refFeesApplied: 0,
    refFeesApplicable: 0, // ✅ add this
    fbaFees: 0,
    platformFees: 0,
    otherFees: 0,
  });


  const fmtCurrency = useCallback(
    (n: number): string => {
      if (typeof n !== "number" || Number.isNaN(n)) return "-";
      return n.toLocaleString(undefined, {
        style: "currency",
        currency: displayCurrencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    [displayCurrencyCode]
  );

  const refDeltaPct = useMemo(
    () => pctDelta(card6.refFeesApplied, card6.refFeesApplicable),
    [card6.refFeesApplied, card6.refFeesApplicable]
  );


  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [skuwiseRows, setSkuwiseRows] = useState<ReferralRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    ordersUnits: 0,
    totalSales: 0,
    feeImpact: 0,
  });
  const [feeSummaryRows, setFeeSummaryRows] = useState<FeeSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("unknown");
  const [allOrdersByStatus, setAllOrdersByStatus] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [salesStatus, setSalesStatus] = useState<SalesStatusSummary>({
    totalSales: 0,
    accurateSales: 0,
    overchargedSales: 0,
    underchargedSales: 0,
    noRefFeeSales: 0,
  });

  const [refBreakdown, setRefBreakdown] = useState<RefFeesBreakdown>({
    totalApplicable: 0,
    accurateApplicable: 0,
    overchargedApplicable: 0,
    underchargedApplicable: 0,
    noRefFeeApplicable: 0,
  });

  // ✅ hydrate month/year from URL first, else localStorage.latestFetchedPeriod
  useEffect(() => {
    const mFromRoute = (routeParams?.month as string | undefined)?.toLowerCase();
    const yFromRoute = routeParams?.year as string | undefined;

    if (mFromRoute && yFromRoute) {
      setMonth(mFromRoute);
      setYear(String(yFromRoute));
      setError(null);
      return;
    }

    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem("latestFetchedPeriod");
      if (raw) {
        const parsed = JSON.parse(raw) as { month?: string; year?: string };
        if (parsed.month && parsed.year) {
          setMonth(String(parsed.month).toLowerCase());
          setYear(String(parsed.year));
          setError(null);
          return;
        }
      }
    } catch { }

    setError("Please select both month and year to view referral fees.");
  }, [routeParams?.month, routeParams?.year]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!month || !year) return;
    localStorage.setItem("latestFetchedPeriod", JSON.stringify({ month, year }));
  }, [month, year]);

  /* ======= derive userId from JWT ======= */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("jwtToken");
    if (!token) return;
    try {
      const decoded: any = jwtDecode(token);
      const id = decoded?.user_id?.toString() ?? "unknown";
      setUserId(id);
    } catch {
      setUserId("unknown");
    }
  }, []);

  /* ======= fileName ======= */
  const fileName = useMemo(
    () => `user_${userId}_${country}_${month}${year}_data`.toLowerCase(),
    [userId, country, month, year]
  );

  /* ===================== API Fetch ===================== */
  const fetchReferralData = useCallback(async () => {
    if (!month || !year || !country) {
      setError("Please select both month and year to view referral fees.");
      setRows([]);
      setSkuwiseRows([]);
      setFeeSummaryRows([]);
      setAllOrdersByStatus([]);
      setSummary({ ordersUnits: 0, totalSales: 0, feeImpact: 0 });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

      const params = new URLSearchParams({
        country: country,
        month: month,
        year: year,
      });

      // ✅ ONLY GLOBAL sends homeCurrency
      if (isGlobalPage && homeCurrency) {
        params.set("homeCurrency", homeCurrency.toLowerCase());
      }

      const url = `${baseURL}/get_table_data/${fileName}?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error(`Failed to fetch referral data (${res.status})`);

      const json: any = await res.json();

      const platformFeeTotalFromApi = toNumberSafe(json?.platform_fee_total);
      const otherTotalFromApi = toNumberSafe(json?.other_total);


      const table = json?.table ?? [];
      const arr: ReferralRow[] = Array.isArray(table) ? table : [];


      // ✅ Pick summary rows directly from backend table
      const getRowBySku = (skuLabel: string) =>
        arr.find((r) => String(r.sku ?? "").trim().toLowerCase() === skuLabel.trim().toLowerCase());

      const rAcc = getRowBySku("Charge - Accurate");
      const rUnder = getRowBySku("Charge - Undercharged");
      const rOver = getRowBySku("Charge - Overcharged");
      const rNoRef = getRowBySku("Charge - noreferallfee");
      const rGrand = getRowBySku("Grand Total");

      // ✅ Sales & Status Summary MUST use net_sales_total_value from these rows
      const grandSales = toNumberSafe(rGrand?.net_sales_total_value);

      setSalesStatus({
        totalSales: grandSales,
        accurateSales: toNumberSafe(rAcc?.net_sales_total_value),
        underchargedSales: toNumberSafe(rUnder?.net_sales_total_value),
        overchargedSales: toNumberSafe(rOver?.net_sales_total_value),
        noRefFeeSales: toNumberSafe(rNoRef?.net_sales_total_value),
      });

      setRows(arr);
      setSkuwiseRows(arr);

      const accurate = Array.isArray(json?.accurate_data) ? json.accurate_data : [];
      const overcharged = Array.isArray(json?.overcharged_data) ? json.overcharged_data : [];
      const undercharged = Array.isArray(json?.undercharged_data) ? json.undercharged_data : [];
      const noRef = Array.isArray(json?.no_ref_fee_data) ? json.no_ref_fee_data : [];

      const mergedAll = [
        { Category: "Overcharged" },
        ...overcharged.map((r: any) => ({ Category: "Overcharged", ...r })),
        {},
        { Category: "Undercharged" },
        ...undercharged.map((r: any) => ({ Category: "Undercharged", ...r })),
        {},
        { Category: "No Ref Fees" },
        ...noRef.map((r: any) => ({ Category: "No Ref Fees", ...r })),
        {},
        { Category: "Accurate" },
        ...accurate.map((r: any) => ({ Category: "Accurate", ...r })),
      ];

      setAllOrdersByStatus(mergedAll);

      const summarySource = arr.filter((r) => {
        const sku = String(r.sku ?? "");
        return sku.startsWith("Charge -") || sku === "Grand Total";
      });

      const findChargeRow = (skuLabel: string) =>
        summarySource.find((r) => String(r.sku ?? "").toLowerCase() === skuLabel.toLowerCase());

      const chAcc = findChargeRow("Charge - Accurate");
      const chOver = findChargeRow("Charge - Overcharged");
      const chUnder = findChargeRow("Charge - Undercharged");
      const chNoRef = findChargeRow("Charge - noreferallfee");
      const grand = findChargeRow("Grand Total") ?? arr.find((r) => String(r.sku ?? "").toLowerCase() === "grand total");

      // ✅ LEFT PANEL: SALES split by status (use net sales)
      const totalSalesVal = toNumberSafe(grand?.net_sales_total_value ?? 0);
      setSalesStatus({
        totalSales: totalSalesVal,
        accurateSales: toNumberSafe(chAcc?.net_sales_total_value ?? 0),
        overchargedSales: toNumberSafe(chOver?.net_sales_total_value ?? 0),
        underchargedSales: toNumberSafe(chUnder?.net_sales_total_value ?? 0),
        noRefFeeSales: toNumberSafe(chNoRef?.net_sales_total_value ?? 0),
      });

      // ✅ RIGHT PANEL: REF FEES breakdown (use "answer" i.e. applicable)
      setRefBreakdown({
        totalApplicable: toNumberSafe(grand?.answer ?? 0),
        accurateApplicable: toNumberSafe(chAcc?.answer ?? 0),
        overchargedApplicable: toNumberSafe(chOver?.answer ?? 0),     // <- 216.75
        underchargedApplicable: toNumberSafe(chUnder?.answer ?? 0),   // <- 205.22
        noRefFeeApplicable: toNumberSafe(chNoRef?.answer ?? 0),       // <- 0
      });


      const order = [
        "Charge - Accurate",
        "Charge - Undercharged",
        "Charge - Overcharged",
        "Charge - noreferallfee",
        "Grand Total",
      ];

      summarySource.sort((a, b) => {
        const aSku = String(a.sku ?? "");
        const bSku = String(b.sku ?? "");
        const ai = order.indexOf(aSku);
        const bi = order.indexOf(bSku);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });

      const mappedSummary: FeeSummaryRow[] = summarySource.map((r: ReferralRow) => ({
        label: String(r.sku ?? ""),
        units: Math.round(toNumberSafe(r.quantity)),
        sales: getNetSales(r),
        refFeesApplicable: toNumberSafe(r.answer),
        refFeesCharged: toNumberSafe(r.selling_fees),
        overcharged: toNumberSafe(r.difference),
      }));

      // use only actual SKU/product lines (exclude Charge-/Grand Total lines)
      const lineItems = arr.filter((r) => {
        const skuStr = String(r.sku ?? "");
        if (skuStr === "Grand Total") return false;
        if (skuStr.startsWith("Charge -")) return false;
        return true;
      });

      const salesTotal = lineItems.reduce((acc, r) => acc + getNetSales(r), 0);


      const totalFees = lineItems.reduce((acc, r) => acc + toNumberSafe(r.selling_fees), 0);

      const refFeesApplicable = lineItems.reduce((acc, r) => acc + toNumberSafe(r.answer), 0);

      const refFeesApplied = totalFees;


      // FBA stays derived from rows (or do the same if you later add fba_fee_total)
      const fbaFees = lineItems.reduce((acc, r) => {
        return acc + FBA_KEYS.reduce((s, k) => s + toNumberSafe((r as any)[k]), 0);
      }, 0);


      const platformFeesDerived = lineItems.reduce((acc, r) => {
        return acc + PLATFORM_KEYS.reduce((s, k) => s + toNumberSafe((r as any)[k]), 0);
      }, 0);

      const otherFeesDerived = lineItems.reduce((acc, r) => {
        return acc + OTHER_KEYS.reduce((s, k) => s + toNumberSafe((r as any)[k]), 0);
      }, 0);

      const platformFees = platformFeeTotalFromApi !== 0 ? platformFeeTotalFromApi : platformFeesDerived;
      const otherFees = otherTotalFromApi !== 0 ? otherTotalFromApi : otherFeesDerived;




      setCard6({
        sales: salesTotal,
        totalFees,                 // charged
        refFeesApplied,            // charged (986.71)
        refFeesApplicable,         // applicable (959.76)
        fbaFees,
        platformFees,
        otherFees,
      });



      setFeeSummaryRows(mappedSummary);

      let totalUnits = 0;
      let totalSales = 0;
      let feeImpact = 0;

      for (const r of arr) {
        totalUnits += Math.round(toNumberSafe(r.quantity));
        totalSales += getNetSales(r);
        feeImpact += toNumberSafe(r.overcharged ?? r.difference);
      }

      setSummary({ ordersUnits: totalUnits, totalSales, feeImpact });
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
      setRows([]);
      setSkuwiseRows([]);
      setFeeSummaryRows([]);
      setAllOrdersByStatus([]);
      setSummary({ ordersUnits: 0, totalSales: 0, feeImpact: 0 });
    } finally {
      setLoading(false);
    }
  }, [month, year, country, fileName, isGlobalPage, homeCurrency]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  /* ===================== Derived ===================== */
  const totalFeeRow = useMemo<FeeSummaryRow | null>(() => {
    if (!feeSummaryRows.length) return null;
    const total =
      feeSummaryRows.find((r) => r.label && r.label.toLowerCase() === "total") ||
      feeSummaryRows[feeSummaryRows.length - 1];
    return total || null;
  }, [feeSummaryRows]);

  const cardSummary = useMemo(
    () => ({
      ordersUnits: totalFeeRow?.units ?? 0,
      totalSales: totalFeeRow?.sales ?? 0,
      feeImpact: totalFeeRow?.overcharged ?? 0,
    }),
    [totalFeeRow]
  );

  const summaryTableRows: Row[] = useMemo(() => {
    return feeSummaryRows.map((r, index) => ({
      label: r.label,
      units: r.units,
      sales: r.sales,
      refFeesApplicable: r.refFeesApplicable,
      refFeesCharged: r.refFeesCharged,
      overcharged: r.overcharged,
      _isTotal: index === feeSummaryRows.length - 1,
    })) as Row[];
  }, [feeSummaryRows]);

  const skuTableAll: Row[] = useMemo(() => {
    if (!skuwiseRows.length) return [];

    const filtered = skuwiseRows.filter((r) => {
      const skuStr = String(r.sku ?? "");
      if (skuStr === "Grand Total") return true;
      return !skuStr.startsWith("Charge -");
    });

    return filtered.map((r) => {
      const quantity = Math.round(toNumberSafe(r.quantity));
      const sales = getNetSales(r);
      const applicable = toNumberSafe(r.answer);
      const charged = toNumberSafe(r.selling_fees);
      const overcharged = toNumberSafe(r.overcharged ?? r.difference);

      const skuStr = String(r.sku ?? "");
      const isTotal = skuStr.toLowerCase() === "grand total";

      return {
        sku: isTotal ? "" : (r.sku ?? ""),                 // ✅ blank SKU for total
        productName: isTotal ? "Grand Total" : (r.product_name ?? ""), // ✅ label in Product Name
        units: quantity,
        sales,
        applicable,
        charged,
        overcharged,
        _isTotal: isTotal,
      };

    });
  }, [skuwiseRows]);

  const skuColumns: ColumnDef<Row>[] = [
    { key: "sku", header: "SKU" },
    { key: "productName", header: "Product Name" },
    { key: "units", header: "Units" },
    { key: "sales", header: "Net Sales", render: (_, v) => fmtCurrency(Number(v)) },
    { key: "applicable", header: "Ref Fees Applicable", render: (_, v) => fmtCurrency(Number(v)) },
    { key: "charged", header: "Ref Fees Charged", render: (_, v) => fmtCurrency(Number(v)) },
    { key: "overcharged", header: "Overcharged", render: (_, v) => <span>{fmtCurrency(Number(v))}</span> },
  ];

  const summaryColumns: ColumnDef<Row>[] = [
    { key: "label", header: "Ref. Fees" },
    { key: "units", header: "Units", render: (_, v) => fmtInteger(Number(v)) },
    { key: "sales", header: "Net Sales", render: (_, v) => fmtCurrency(Number(v)) },
    { key: "refFeesApplicable", header: "Ref Fees Applicable", render: (_, v) => fmtCurrency(Number(v)) },
    { key: "refFeesCharged", header: "Ref Fees Charged", render: (_, v) => fmtCurrency(Number(v)) },
    { key: "overcharged", header: "Overcharged", render: (_, v) => fmtCurrency(Number(v)) },
  ];

  const skuTableDisplay: Row[] = useMemo(() => {
    if (!skuTableAll.length) return [];

    const nonTotal = skuTableAll.filter((row) => !(row as any)._isTotal);
    const totalRow = skuTableAll.find((row) => (row as any)._isTotal) || null;

    if (!nonTotal.length) return totalRow ? [totalRow] : [];

    const sorted = [...nonTotal].sort(
      (a, b) => toNumberSafe((b as any).sales) - toNumberSafe((a as any).sales)
    );

    const top5 = sorted.slice(0, 5);
    const remaining = sorted.slice(5);
    let othersRow: Row | null = null;

    if (remaining.length) {
      const agg = remaining.reduce(
        (acc: any, row: any) => {
          acc.units += Math.round(toNumberSafe(row.units));
          acc.sales += toNumberSafe(row.sales);
          acc.applicable += toNumberSafe(row.applicable);
          acc.charged += toNumberSafe(row.charged);
          acc.overcharged += toNumberSafe(row.overcharged);
          return acc;
        },
        { units: 0, sales: 0, applicable: 0, charged: 0, overcharged: 0 }
      );

      othersRow = {
        sku: "",
        productName: "Others",
        units: agg.units,
        sales: agg.sales,
        applicable: agg.applicable,
        charged: agg.charged,
        overcharged: agg.overcharged,
        _isOthers: true,
      } as Row;
    }

    // Build final rows (top5 + optional others + optional total)
    const finalRows: Row[] = [...top5];
    if (othersRow) finalRows.push(othersRow);
    if (totalRow) finalRows.push(totalRow);

    // ✅ Add serial numbers only up to (and including) Others, not for Grand Total
    let counter = 1;
    return finalRows.map((row: any) => {
      if (row._isTotal) return { ...row, sno: "" };
      return { ...row, sno: counter++ };
    });
  }, [skuTableAll]);

  const handleDownloadExcel = useCallback(() => {
    if (!feeSummaryRows.length && !skuTableAll.length && !rows.length) return;

    const wb = XLSX.utils.book_new();

    /* ---------------- Sheet 1: Summary ---------------- */
    const summaryData = feeSummaryRows.map((r) => {
      const units = Math.round(toNumberSafe(r.units));
      const sales = toNumberSafe(r.sales);
      const applicable = toNumberSafe(r.refFeesApplicable);
      const charged = toNumberSafe(r.refFeesCharged);
      const overcharged = toNumberSafe(r.overcharged);

      return {
        "Ref Fees": r.label,
        Units: units,
        "Net Sales": Number(sales.toFixed(2)),
        "Ref Fees Applicable": Number(applicable.toFixed(2)),
        "Ref Fees Charged": Number(charged.toFixed(2)),
        Overcharged: Number(overcharged.toFixed(2)),
      };
    });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Summary");

    /* ---------------- Sheet 2: Overcharged Ref Fees (SKU-wise) ---------------- */
    const overData = skuTableAll.map((r: any) => {
      const units = Math.round(toNumberSafe(r.units));
      const sales = toNumberSafe(r.sales);
      const applicable = toNumberSafe(r.applicable);
      const charged = toNumberSafe(r.charged);
      const overcharged = toNumberSafe(r.overcharged);

      return {
        SKU: String(r.sku ?? ""),
        "Product Name": String(r.productName ?? ""),
        Units: units,
        "Net Sales": Number(sales.toFixed(2)),
        "Ref Fees Applicable": Number(applicable.toFixed(2)),
        "Ref Fees Charged": Number(charged.toFixed(2)),
        Overcharged: Number(overcharged.toFixed(2)),
      };
    });

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(overData),
      "Overcharged Ref Fees"
    );

    /* ---------------- Sheet 3: Orders by Status (CLEANED) ---------------- */
    const cleanedOrdersByStatus = (allOrdersByStatus || []).map((r: any) => {
      // keep separators / headers as-is
      const isSeparatorRow =
        !r || Object.keys(r).length === 0 || (r.Category && Object.keys(r).length === 1);

      if (isSeparatorRow) return r;

      return {
        Category: r.Category ?? "",
        "Order ID": r.order_id ?? "",
        SKU: r.sku ?? "",
        "Product Name": r.product_name ?? "",
        Quantity: toNumberSafe(r.quantity),
        "Net Sales": getNetSales(r), // ✅ net sales
        "Referral Fees Applicable": toNumberSafe(r.answer),
        "Referral Fees Charged": toNumberSafe(r.selling_fees),
        Overcharged: toNumberSafe(r.difference ?? r.overcharged),
        Status: r.errorstatus ?? "",
      };
    });

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(cleanedOrdersByStatus),
      "Orders by Status"
    );

    /* ---------------- Save ---------------- */
    XLSX.writeFile(wb, `Referral-Fees-${country}-${month}-${year}.xlsx`);
  }, [
    feeSummaryRows,
    skuTableAll,
    rows,
    allOrdersByStatus,
    country,
    month,
    year,
  ]);


  const canShowContent = !loading && !error && month && year;



  return (
    <div className="space-y-1.5 font-sans text-charcoal-500">

      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* LEFT: Title + Subtitle */}
        <div className="flex flex-col leading-tight w-full md:w-auto">
          <div className="flex items-baseline gap-2">
            <PageBreadcrumb pageTitle="Amazon Fees -" variant="page" align="left" textSize="2xl" className="mb-0 md:mb-2" />
            <span className="text-[#5EA68E] font-bold text-lg sm:text-2xl md:text-2xl">
              {country.toUpperCase()}
            </span>
          </div>

        </div>

        {/* RIGHT: Filters */}
        <div className="flex w-full md:w-auto justify-start md:justify-end">
          <MonthYearPickerTable
            month={month}
            year={year}
            yearOptions={[new Date().getFullYear(), new Date().getFullYear() - 1]}
            onMonthChange={(v) => {
              setMonth(v);
              if (v && year) setError(null);
            }}
            onYearChange={(v) => {
              setYear(v);
              if (v && month) setError(null);
            }}
            valueMode="lower"
          />
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader
            src="/infinity-unscreen.gif"
            size={150}
            transparent
            roundedClass="rounded-none"
            backgroundClass="bg-transparent"
            respectReducedMotion
          />
        </div>
      )}

      {!loading && !!error && (
        <div className="mt-5 box-border flex w-full items-center justify-between rounded-md border-t-4 border-[#ff5c5c] bg-[#f2f2f2] px-4 py-3 text-sm text-[#414042] lg:max-w-fit">
          <div className="flex items-center">
            <i className="fa-solid fa-circle-exclamation mr-2 text-lg text-[#ff5c5c]" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {canShowContent && (
        <>
          {/* <PageBreadcrumb pageTitle="Summary Overview" variant="page" align="left" className="mt-0 md:mt-4 mb-0 md:mb-2" /> */}

          {/* ===================== 6 CARDS (UPDATED) ===================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-4">
            <StatCard
              title="Sales"
              value={card6.sales}
              valueFmt={fmtCurrency}
              borderColor="#2CA9E0"
              bgColor="#2CA9E026"
            />

            <StatCard
              title="Total Fees"
              value={card6.totalFees}
              valueFmt={fmtCurrency}
              borderColor="#F47A00"
              bgColor="#F47A0026"
            />

            {/* ✅ ONLY this card has bottom section */}
            <StatCard
              title="Ref Fees Applied"
              value={card6.refFeesApplied}
              valueFmt={fmtCurrency}
              bottomLeftLabel="Applicable"
              bottomLeftValue={card6.refFeesApplicable}
              bottomRightDeltaPct={pctDelta(card6.refFeesApplied, card6.refFeesApplicable)}
              borderColor="#FF5C5C"
              bgColor="#FF5C5C26"
            />

            <StatCard
              title="FBA Fees"
              value={card6.fbaFees}
              valueFmt={fmtCurrency}
              borderColor="#2DA49A"
              bgColor="#2DA49A26"
            />

            <StatCard
              title="Platform Fees"
              value={card6.platformFees}
              valueFmt={fmtCurrency}
              borderColor="#FFBE25"
              bgColor="#FFBE2526"
            />

            <StatCard
              title="Other Fees"
              value={card6.otherFees}
              valueFmt={fmtCurrency}
              borderColor="#01627F"
              bgColor="#01627F26"
            />
          </div>

          {/* ===================== BREAKDOWN SECTION (NEW) ===================== */}
          {(() => {
            /* =========================
               1) Pull Charge rows + Grand Total
            ========================= */
            const chargeAcc = rows.find(
              (r) => String(r.sku ?? "").toLowerCase() === "charge - accurate"
            );
            const chargeOver = rows.find(
              (r) => String(r.sku ?? "").toLowerCase() === "charge - overcharged"
            );
            const chargeUnder = rows.find(
              (r) => String(r.sku ?? "").toLowerCase() === "charge - undercharged"
            );
            const chargeNoRef = rows.find(
              (r) => String(r.sku ?? "").toLowerCase() === "charge - noreferallfee"
            );
            const grand = rows.find(
              (r) => String(r.sku ?? "").toLowerCase() === "grand total"
            );

            /* =========================
               2) LEFT PANEL (Sales based): use net_sales_total_value from Charge lines
               Requirement: show net_sales_total_value for:
               Charge - Accurate, Charge - Undercharged, Charge - Overcharged, Charge - noreferallfee, Grand Total
            ========================= */
            const leftList = [
              {
                label: "Total Sales",
                value: toNumberSafe(grand?.net_sales_total_value),
                color: "#F47A00",
              },
              {
                label: "Accurately charged",
                value: toNumberSafe(chargeAcc?.net_sales_total_value),
                color: "#14B8A6",
              },
              {
                label: "Over charged",
                value: toNumberSafe(chargeOver?.net_sales_total_value),
                color: "#EF4444",
              },
              {
                label: "Undercharged",
                value: toNumberSafe(chargeUnder?.net_sales_total_value),
                color: "#F59E0B",
              },
              {
                label: "No ref fee",
                value: toNumberSafe(chargeNoRef?.net_sales_total_value),
                color: "#94A3B8",
              },
            ];

            /* =========================
               3) RIGHT PANEL (Ref fee breakdown): use selling_fees from Charge lines
               Also show difference in brackets next to value
            ========================= */
            const rightList = [
              {
                label: "Total Ref Fees",
                value: toNumberSafe(grand?.selling_fees),
                diff: toNumberSafe(grand?.difference),
                color: "#64748B",
              },
              {
                label: "Accurately charged",
                value: toNumberSafe(chargeAcc?.selling_fees),
                diff: toNumberSafe(chargeAcc?.difference),
                color: "#14B8A6",
              },
              {
                label: "Over charged",
                value: toNumberSafe(chargeOver?.selling_fees),
                diff: toNumberSafe(chargeOver?.difference),
                color: "#EF4444",
              },
              {
                label: "Undercharged",
                value: toNumberSafe(chargeUnder?.selling_fees),
                diff: toNumberSafe(chargeUnder?.difference),
                color: "#F59E0B",
              },
              {
                label: "No ref fee",
                value: toNumberSafe(chargeNoRef?.selling_fees),
                diff: toNumberSafe(chargeNoRef?.difference),
                color: "#94A3B8",
              },
            ];

            /* =========================
               4) Bar scaling totals
               - LEFT: scale by Grand Total sales (so bars are "out of total sales")
               - RIGHT: scale by Grand Total ref fees (so bars are "out of total ref fees")
            ========================= */
            const leftTotalForBars = Math.max(
              1,
              Math.abs(toNumberSafe(grand?.net_sales_total_value))
            );

            const rightTotalForBars = Math.max(
              1,
              Math.abs(toNumberSafe(grand?.selling_fees))
            );

            /* =========================
               5) Row renderer
               - shows bar + value (and optional diff in brackets)
            ========================= */
            const BarRow = ({
              label,
              value,
              total,
              color,
              diff,
            }: {
              label: string;
              value: number;
              total: number;
              color: string;
              diff?: number;
            }) => {
              const v = Math.abs(toNumberSafe(value));
              const t = Math.max(1, Math.abs(toNumberSafe(total)));
              const pct = Math.min(100, (v / t) * 100);

              const d = typeof diff === "number" ? toNumberSafe(diff) : null;

              return (
                <div className="grid grid-cols-[180px_1fr_170px] items-center gap-3">
                  <div className="text-sm text-slate-700">{label}</div>

                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>

                  <div className="text-right text-sm font-semibold text-slate-800 whitespace-nowrap">
                    {fmtNumber(value)}
                    {d !== null ? (
                      <span className="ml-2 text-xs font-semibold text-slate-500">
                        ({fmtCurrency(d)})
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            };

            const currencySymbol = fmtCurrency(0).replace(/[\d.,\s]/g, "");
            const fmtNumber = (n: number) =>
              toNumberSafe(n).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });

            /* =========================
               6) UI (wrapped in bordered div with heading)
            ========================= */
            return (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                {/* <div className="text-lg font-semibold text-slate-800 mb-4">
                  Referral Fee Recon
                </div> */}

                <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap w-full mb-2 md:mb-0">
                  <PageBreadcrumb
                    pageTitle="Referral Fee Recon"
                    variant="page"
                    align="left"
                    className="mb-0 md:mb-4 text-center"
                  />
                  <DownloadButton onClick={handleDownloadExcel} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* LEFT PANEL */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                    <div className="text-base font-semibold text-slate-800 mb-4">
                      Sales Summary <span className="text-slate-500">({currencySymbol})</span>
                    </div>


                    <div className="space-y-3">
                      {leftList.map((x) => (
                        <BarRow
                          key={x.label}
                          label={x.label}
                          value={x.value}
                          total={leftTotalForBars}
                          color={x.color}
                        />
                      ))}
                    </div>
                  </div>

                  {/* RIGHT PANEL */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                    <div className="text-base font-semibold text-slate-800 mb-4">
                      Referral Fees Breakdown <span className="text-slate-500">(£)</span>
                    </div>


                    <div className="space-y-3">
                      {rightList.map((x) => (
                        <BarRow
                          key={x.label}
                          label={x.label}
                          value={x.value}
                          diff={x.diff}
                          total={rightTotalForBars}
                          color={x.color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}



          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-2 md:px-4 pb-2 md:pb-4 w-full overflow-x-auto mt-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-2 flex-wrap w-full mb-2 md:mb-0">
              <PageBreadcrumb
                pageTitle="Product-wise Details of Overcharged Ref Fees"
                variant="page"
                align="left"
                className="mt-4 mb-0 md:mb-4 text-center"
              />
              {/* <DownloadButton onClick={handleDownloadExcel} /> */}
            </div>

            {/* <AiButton /> */}

            <div className="[&_table]:w-full [&_th]:text-center [&_td]:text-center">
              <DataTable
                columns={[
                  { key: "sno", header: "S. No." },
                  { key: "productName", header: "Product Name" },
                  { key: "sku", header: "SKU" },
                  { key: "units", header: "Units" },
                  { key: "sales", header: "Net Sales", render: (_, v) => fmtCurrency(Number(v)) },
                  { key: "applicable", header: "Ref Fees Applicable", render: (_, v) => fmtCurrency(Number(v)) },
                  { key: "charged", header: "Ref Fees Charged", render: (_, v) => fmtCurrency(Number(v)) },
                  { key: "overcharged", header: "Overcharged", render: (_, v) => <span>{fmtCurrency(Number(v))}</span> },
                ]}

                data={skuTableDisplay}
                paginate={false}
                scrollY={false}
                maxHeight="none"
                zebra={true}
                stickyHeader={false}
                rowClassName={(row) => ((row as any)._isTotal ? "bg-[#DDDDDD] font-bold" : "")}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
