// "use client";

// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { useSelector } from "react-redux";
// import ExcelJS from "exceljs";
// import { saveAs } from "file-saver";

// import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// import Loader from "@/components/loader/Loader";
// import DownloadIconButton from "@/components/ui/button/DownloadIconButton";
// import SegmentedToggle from "@/components/ui/SegmentedToggle";
// import DashboardBargraphCard from "@/components/dashboard/DashboardBargraphCard";
// import SalesTargetCard from "@/components/dashboard/SalesTargetCard";
// import AmazonStatCard from "@/components/dashboard/AmazonStatCard";
// import CurrentInventorySection from "@/components/dashboard/CurrentInventorySection";

// import { RootState } from "@/lib/store";
// import { useAmazonConnections } from "@/lib/utils/useAmazonConnections";

// import {
//   getISTYearMonth,
//   getPrevISTYearMonth,
//   getPrevMonthShortLabel,
//   getISTDayInfo,
// } from "@/lib/dashboard/date";

// import {
//   fmtGBP,
//   fmtUSD,
//   fmtNum,
//   fmtPct,
//   fmtInt,
//   toNumberSafe,
// } from "@/lib/dashboard/format";

// import type { RegionKey, RegionMetrics } from "@/lib/dashboard/types";

// import { useGetUserDataQuery } from "@/lib/api/profileApi";
// import { usePlatform } from "@/components/context/PlatformContext";
// import type { PlatformId } from "@/lib/utils/platforms";
// import MonthsforBI from "./live-business-insight/[ranged]/[countryName]/[month]/[year]/page";
// import { useParams } from "next/navigation";
// import LiveBiLineGraph from "@/components/businessInsight/LiveBiLineChartPanel";

// type CurrencyCode = "USD" | "GBP" | "INR" | "CAD";

// /* ===================== ENV & ENDPOINTS ===================== */
// const baseURL =
//   process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

// const API_URL = `${baseURL}/amazon_api/orders`;
// const SHOPIFY_DROPDOWN_ENDPOINT = `${baseURL}/shopify/dropdown`;
// const FX_ENDPOINT = `${baseURL}/currency-rate`;

// /** 💵 FX defaults (used until backend answers) */
// const GBP_TO_USD_ENV = Number(process.env.NEXT_PUBLIC_GBP_TO_USD || "1.25");
// const INR_TO_USD_ENV = Number(process.env.NEXT_PUBLIC_INR_TO_USD || "0.01128");
// const CAD_TO_USD_ENV = Number(process.env.NEXT_PUBLIC_CAD_TO_USD || "0.74");

// const USE_MANUAL_LAST_MONTH =
//   (process.env.NEXT_PUBLIC_USE_MANUAL_LAST_MONTH || "false").toLowerCase() ===
//   "true";

// const MANUAL_LAST_MONTH_USD_GLOBAL = Number(
//   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_GLOBAL || "0"
// );
// const MANUAL_LAST_MONTH_USD_UK = Number(
//   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_UK || "0"
// );
// const MANUAL_LAST_MONTH_USD_US = Number(
//   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_US || "0"
// );
// const MANUAL_LAST_MONTH_USD_CA = Number(
//   process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_CA || "0"
// );

// /* ===================== LOCAL HELPERS ===================== */
// const parsePercentToNumber = (
//   value: string | number | null | undefined
// ): number | null => {
//   if (value == null) return null;
//   const raw = typeof value === "number" ? String(value) : value;
//   const cleaned = raw.replace("%", "").trim();
//   const n = Number(cleaned);
//   return Number.isNaN(n) ? null : n;
// };



// export default function DashboardPage() {
//   const { platform } = usePlatform();
//   const { data: userData } = useGetUserDataQuery();
//   const params = useParams();

//   const isCountryMode = platform !== "global" && platform !== "shopify";

//   const countryName = useMemo(() => {
//     switch (platform) {
//       case "amazon-uk":
//         return "uk";
//       case "amazon-us":
//         return "us";
//       case "amazon-ca":
//         return "ca";
//       default:
//         return "global";
//     }
//   }, [platform]);

//   const showLiveBI = isCountryMode;

//   const brandName = useSelector((state: RootState) => state.auth.user?.brand_name);

//   /* ===================== PLATFORM → DISPLAY CURRENCY ===================== */
//   const profileHomeCurrency = ((userData?.homeCurrency || "USD").toUpperCase() as CurrencyCode);

//   const displayCurrency: CurrencyCode = useMemo(() => {
//     switch (platform as PlatformId) {
//       case "global":
//         return profileHomeCurrency;
//       case "amazon-uk":
//         return "GBP";
//       case "amazon-us":
//         return "USD";
//       case "amazon-ca":
//         return "CAD";
//       case "shopify":
//         return "INR"; // change to profileHomeCurrency if desired
//       default:
//         return profileHomeCurrency;
//     }
//   }, [platform, profileHomeCurrency]);

//   /* ===================== AMAZON / SHOPIFY STATE ===================== */
//   const [loading, setLoading] = useState(false);
//   const [unauthorized, setUnauthorized] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [data, setData] = useState<any>(null);

//   const { connections: amazonConnections } = useAmazonConnections();

//   // Shopify (current month)
//   const [shopifyLoading, setShopifyLoading] = useState(false);
//   const [shopifyError, setShopifyError] = useState<string | null>(null);
//   const [shopifyRows, setShopifyRows] = useState<any[]>([]);
//   const shopify = shopifyRows?.[0] || null;
//   const [shopifyPrevRows, setShopifyPrevRows] = useState<any[]>([]);
//   const [shopifyStore, setShopifyStore] = useState<any | null>(null);
//   const [amazonRegion, setAmazonRegion] = useState<RegionKey>("Global");
//   const [graphRegion, setGraphRegion] = useState<RegionKey>("Global");

//   const chartRef = React.useRef<HTMLDivElement | null>(null);
//   const prevLabel = useMemo(() => getPrevMonthShortLabel(), []);

//   /* ===================== FX RATES ===================== */
//   const [gbpToUsd, setGbpToUsd] = useState(GBP_TO_USD_ENV);
//   const [inrToUsd, setInrToUsd] = useState(INR_TO_USD_ENV);
//   const [cadToUsd, setCadToUsd] = useState(CAD_TO_USD_ENV);
//   const [fxLoading, setFxLoading] = useState(false);

//   const fetchFxRates = useCallback(async () => {
//     try {
//       setFxLoading(true);

//       const token =
//         typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

//       const headers: HeadersInit = {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       };
//       if (token) (headers as any).Authorization = `Bearer ${token}`;

//       const { monthName, year } = getISTYearMonth();
//       const month = monthName.toLowerCase();

//       const commonBody = { month, year, fetch_if_missing: true };

//       const [ukRes, inrRes, cadRes] = await Promise.all([
//         fetch(FX_ENDPOINT, {
//           method: "POST",
//           headers,
//           body: JSON.stringify({
//             ...commonBody,
//             user_currency: "GBP",
//             country: "uk",
//             selected_currency: "USD",
//           }),
//         }),
//         fetch(FX_ENDPOINT, {
//           method: "POST",
//           headers,
//           body: JSON.stringify({
//             ...commonBody,
//             user_currency: "INR",
//             country: "india",
//             selected_currency: "USD",
//           }),
//         }),
//         fetch(FX_ENDPOINT, {
//           method: "POST",
//           headers,
//           body: JSON.stringify({
//             ...commonBody,
//             user_currency: "CAD",
//             country: "ca",
//             selected_currency: "USD",
//           }),
//         }),
//       ]);

//       if (ukRes.ok) {
//         const json = await ukRes.json();
//         const rate = json?.record?.conversion_rate;
//         if (json?.success && rate != null) setGbpToUsd(Number(rate));
//       }

//       if (inrRes.ok) {
//         const json = await inrRes.json();
//         const rate = json?.record?.conversion_rate;
//         if (json?.success && rate != null) setInrToUsd(Number(rate));
//       }

//       if (cadRes.ok) {
//         const json = await cadRes.json();
//         const rate = json?.record?.conversion_rate;
//         if (json?.success && rate != null) setCadToUsd(Number(rate));
//       }
//     } catch (err) {
//       console.error("Failed to fetch FX rates", err);
//     } finally {
//       setFxLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchFxRates();
//   }, [fetchFxRates]);



//   const forcedRegion: RegionKey = useMemo(() => {
//     switch (platform) {
//       case "amazon-uk":
//         return "UK";
//       case "amazon-us":
//         return "US";
//       case "amazon-ca":
//         return "CA";
//       default:
//         return "Global";
//     }
//   }, [platform]);

//   const graphRegionToUse: RegionKey = isCountryMode ? forcedRegion : graphRegion;

//   useEffect(() => {
//     if (!isCountryMode) return;
//     setGraphRegion(forcedRegion);
//     setAmazonRegion(forcedRegion);
//   }, [isCountryMode, forcedRegion]);


//   /* ===================== CONVERSION + FORMATTING (DISPLAY CURRENCY) ===================== */
//   const convertToDisplayCurrency = useCallback(
//     (value: number | null | undefined, from: CurrencyCode) => {
//       const n = toNumberSafe(value ?? 0);
//       if (!n) return 0;

//       // from -> USD
//       let usd = n;
//       if (from === "GBP") usd = n * gbpToUsd;
//       if (from === "INR") usd = n * inrToUsd;
//       if (from === "CAD") usd = n * cadToUsd;

//       // USD -> displayCurrency
//       if (displayCurrency === "USD") return usd;
//       if (displayCurrency === "GBP") return gbpToUsd ? usd / gbpToUsd : usd;
//       if (displayCurrency === "INR") return inrToUsd ? usd / inrToUsd : usd;
//       if (displayCurrency === "CAD") return cadToUsd ? usd / cadToUsd : usd;

//       return usd;
//     },
//     [displayCurrency, gbpToUsd, inrToUsd, cadToUsd]
//   );

//   const formatDisplayAmount = useCallback(
//     (value: number | null | undefined) => {
//       const n = toNumberSafe(value ?? 0);

//       switch (displayCurrency) {
//         case "USD":
//           return fmtUSD(n);
//         case "GBP":
//           return fmtGBP(n);
//         case "CAD":
//           return new Intl.NumberFormat("en-CA", {
//             style: "currency",
//             currency: "CAD",
//           }).format(n);
//         case "INR":
//           return new Intl.NumberFormat("en-IN", {
//             style: "currency",
//             currency: "INR",
//           }).format(n);
//         default:
//           return fmtNum(n);
//       }
//     },
//     [displayCurrency]
//   );

//   const formatDisplayK = useCallback(
//     (value: number | null | undefined) => {
//       const n = toNumberSafe(value ?? 0);
//       const abs = Math.abs(n);
//       const isK = abs >= 1000;

//       const displayVal = isK ? n / 1000 : n;
//       const suffix = isK ? "k" : "";

//       return `${formatDisplayAmount(displayVal)}${suffix}`;
//     },
//     [formatDisplayAmount]
//   );

//   const currencySymbol =
//     displayCurrency === "USD"
//       ? "$"
//       : displayCurrency === "GBP"
//         ? "£"
//         : displayCurrency === "CAD"
//           ? "CA$"
//           : displayCurrency === "INR"
//             ? "₹"
//             : "¤";

//   /* ===================== AMAZON FETCH ===================== */
//   const fetchAmazon = useCallback(async () => {
//     setLoading(true);
//     setUnauthorized(false);
//     setError(null);
//     try {
//       const token =
//         typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
//       if (!token) {
//         setUnauthorized(true);
//         throw new Error("No token found. Please sign in.");
//       }
//       const res = await fetch(API_URL, {
//         method: "GET",
//         headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
//         credentials: "omit",
//       });
//       if (res.status === 401) {
//         setUnauthorized(true);
//         throw new Error("Unauthorized — token missing/invalid/expired.");
//       }
//       if (!res.ok) throw new Error(`Request failed: ${res.status}`);
//       const json = await res.json();
//       setData(json);
//     } catch (e: any) {
//       setError(e?.message || "Failed to load data");
//       setData(null);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   /* ===================== SHOPIFY STORE INFO ===================== */
//   useEffect(() => {
//     const fetchShopifyStore = async () => {
//       try {
//         const token =
//           typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
//         if (!token) return;

//         const res = await fetch(`${baseURL}/shopify/store`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         const ct = res.headers.get("content-type") || "";
//         if (!ct.includes("application/json")) return;

//         const d = await res.json();
//         if (!res.ok || d?.error) return;

//         setShopifyStore(d);
//       } catch (err) {
//         console.error("Error fetching Shopify store in Dashboard:", err);
//       }
//     };
//     fetchShopifyStore();
//   }, []);

//   /* ===================== SHOPIFY CURRENT MONTH ===================== */
//   const fetchShopify = useCallback(async () => {
//     setShopifyLoading(true);
//     setShopifyError(null);
//     try {
//       const user_token =
//         typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
//       if (!user_token) throw new Error("No token found. Please sign in.");

//       if (!shopifyStore?.shop_name || !shopifyStore?.access_token) {
//         throw new Error("Shopify store not connected.");
//       }

//       const { monthName, year } = getISTYearMonth();

//       const params = new URLSearchParams({
//         range: "monthly",
//         month: monthName.toLowerCase(),
//         year: String(year),
//         user_token,
//         shop: shopifyStore.shop_name,
//         token: shopifyStore.access_token,
//       });

//       const url = `${SHOPIFY_DROPDOWN_ENDPOINT}?${params.toString()}`;

//       const res = await fetch(url, {
//         method: "GET",
//         headers: { Accept: "application/json", Authorization: `Bearer ${user_token}` },
//         credentials: "omit",
//       });

//       if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
//       if (!res.ok) throw new Error(`Shopify request failed: ${res.status}`);

//       const json = await res.json();
//       const row = json?.last_row_data ? json.last_row_data : null;
//       setShopifyRows(row ? [row] : []);
//     } catch (e: any) {
//       setShopifyError(e?.message || "Failed to load Shopify data");
//       setShopifyRows([]);
//     } finally {
//       setShopifyLoading(false);
//     }
//   }, [shopifyStore]);

//   /* ===================== SHOPIFY PREVIOUS MONTH ===================== */
//   const fetchShopifyPrev = useCallback(async () => {
//     try {
//       const user_token =
//         typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
//       if (!user_token) throw new Error("No token found. Please sign in.");

//       if (!shopifyStore?.shop_name || !shopifyStore?.access_token) {
//         throw new Error("Shopify store not connected.");
//       }

//       const { year, monthName } = getPrevISTYearMonth();

//       const params = new URLSearchParams({
//         range: "monthly",
//         month: monthName.toLowerCase(),
//         year: String(year),
//         user_token,
//         shop: shopifyStore.shop_name,
//         token: shopifyStore.access_token,
//       });

//       const url = `${SHOPIFY_DROPDOWN_ENDPOINT}?${params.toString()}`;

//       const res = await fetch(url, {
//         method: "GET",
//         headers: { Accept: "application/json", Authorization: `Bearer ${user_token}` },
//         credentials: "omit",
//       });

//       if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
//       if (!res.ok) throw new Error(`Shopify (prev) request failed: ${res.status}`);

//       const json = await res.json();
//       const row = json?.last_row_data ? json.last_row_data : null;
//       setShopifyPrevRows(row ? [row] : []);
//     } catch (e: any) {
//       console.warn("Shopify prev-month fetch failed:", e?.message);
//       setShopifyPrevRows([]);
//     }
//   }, [shopifyStore]);

//   /* ===================== REFRESH ALL ===================== */
//   const refreshAll = useCallback(async () => {
//     await fetchAmazon();
//     if (shopifyStore?.shop_name && shopifyStore?.access_token) {
//       await Promise.all([fetchShopify(), fetchShopifyPrev()]);
//     }
//   }, [fetchAmazon, fetchShopify, fetchShopifyPrev, shopifyStore]);

//   useEffect(() => {
//     refreshAll();
//   }, [refreshAll]);

//   /* ===================== AMAZON DERIVED DATA ===================== */
//   const cms = data?.current_month_summary || null;
//   const cmp = data?.current_month_profit || null;
//   const skuTotals = data?.current_month_skuwise_totals || null;

//   const uk = useMemo(() => {
//     const netSalesGBP =
//       cms?.net_sales?.GBP != null ? toNumberSafe(cms.net_sales.GBP) : null;

//     const aspGBP = cms?.asp?.GBP != null ? toNumberSafe(cms.asp.GBP) : null;

//     const breakdownGBP = cmp?.breakdown?.GBP || {};

//     const cogsGBP = breakdownGBP.cogs !== undefined ? toNumberSafe(breakdownGBP.cogs) : 0;
//     const fbaFeesGBP = breakdownGBP.fba_fees !== undefined ? toNumberSafe(breakdownGBP.fba_fees) : 0;
//     const sellingFeesGBP = breakdownGBP.selling_fees !== undefined ? toNumberSafe(breakdownGBP.selling_fees) : 0;
//     const amazonFeesGBP = fbaFeesGBP + sellingFeesGBP;

//     const advertisingGBP =
//       skuTotals?.advertising_total !== undefined ? toNumberSafe(skuTotals.advertising_total) : 0;

//     const platformFeeGBP =
//       skuTotals?.platform_fee_total !== undefined ? toNumberSafe(skuTotals.platform_fee_total) : 0;

//     let profitGBP: number | null = null;
//     if (cmp?.profit && typeof cmp.profit === "object" && cmp.profit.GBP !== undefined) {
//       profitGBP = toNumberSafe(cmp.profit.GBP);
//     } else if ((typeof cmp?.profit === "number" || typeof cmp?.profit === "string") && netSalesGBP !== null) {
//       profitGBP = toNumberSafe(cmp.profit);
//     }

//     let unitsGBP: number | null = null;
//     if (breakdownGBP.quantity !== undefined) unitsGBP = toNumberSafe(breakdownGBP.quantity);

//     let profitPctGBP: number | null = null;
//     if (profitGBP !== null && netSalesGBP && netSalesGBP !== 0) {
//       profitPctGBP = (profitGBP / netSalesGBP) * 100;
//     }

//     return {
//       unitsGBP,
//       netSalesGBP,
//       aspGBP,
//       profitGBP,
//       profitPctGBP,
//       cogsGBP,
//       amazonFeesGBP,
//       advertisingGBP,
//       platformFeeGBP,
//     };
//   }, [cms, cmp, skuTotals]);

//   /* ===================== INTEGRATION FLAGS ===================== */
//   const shopifyDeriv = useMemo(() => {
//     if (!shopify) return null;
//     const totalOrders = toNumberSafe(shopify.total_orders);
//     const netSales = toNumberSafe(shopify.net_sales);
//     return { totalOrders, netSales };
//   }, [shopify]);

//   const shopifyPrevDeriv = useMemo(() => {
//     const row = shopifyPrevRows?.[0];
//     if (!row) return null;
//     const netSales = toNumberSafe(row.net_sales);
//     const totalOrders = toNumberSafe(row.total_orders);
//     return { netSales, totalOrders };
//   }, [shopifyPrevRows]);

//   const shopifyNotConnected =
//     !shopifyStore?.shop_name ||
//     !shopifyStore?.access_token ||
//     (shopifyError &&
//       (shopifyError.toLowerCase().includes("shopify store not connected") ||
//         shopifyError.toLowerCase().includes("no token")));

//   const shopifyIntegrated = !shopifyNotConnected && !!shopify;

//   const amazonIntegrated =
//     Array.isArray(amazonConnections) && amazonConnections.length > 0;

//   const noIntegrations = !amazonIntegrated && !shopifyIntegrated;

//   /* ===================== GLOBAL / FX COMBINED (BASE USD DATA) ===================== */
//   const amazonUK_USD = useMemo(() => {
//     const amazonUK_GBP = toNumberSafe(uk.netSalesGBP);
//     return amazonUK_GBP * gbpToUsd;
//   }, [uk.netSalesGBP, gbpToUsd]);

//   const combinedUSD = useMemo(() => {
//     const aUK = amazonUK_USD;
//     const shopifyUSD = toNumberSafe(shopifyDeriv?.netSales) * inrToUsd;
//     return aUK + shopifyUSD;
//   }, [amazonUK_USD, shopifyDeriv?.netSales, inrToUsd]);

//   const prevAmazonUKTotalUSD = useMemo(() => {
//     const prevTotalGBP = toNumberSafe(data?.previous_month_total_net_sales?.total);
//     return prevTotalGBP * gbpToUsd;
//   }, [data?.previous_month_total_net_sales?.total, gbpToUsd]);

//   const prevShopifyTotalUSD = useMemo(() => {
//     const prevINRTotal = toNumberSafe(shopifyPrevDeriv?.netSales);
//     return prevINRTotal * inrToUsd;
//   }, [shopifyPrevDeriv, inrToUsd]);

//   const globalPrevTotalUSD = prevShopifyTotalUSD + prevAmazonUKTotalUSD;

//   const chooseLastMonthTotal = (manualUSD: number, computedUSD: number) =>
//     USE_MANUAL_LAST_MONTH && manualUSD > 0 ? manualUSD : computedUSD;

//   const prorateToDate = (lastMonthTotalUSD: number) => {
//     const { todayDay, daysInPrevMonth } = getISTDayInfo();
//     return daysInPrevMonth > 0 ? (lastMonthTotalUSD * todayDay) / daysInPrevMonth : 0;
//   };

//   const regions = useMemo(() => {
//     const globalLastMonthTotal = chooseLastMonthTotal(
//       MANUAL_LAST_MONTH_USD_GLOBAL,
//       globalPrevTotalUSD
//     );

//     const global: RegionMetrics = {
//       mtdUSD: combinedUSD,
//       lastMonthToDateUSD: prorateToDate(globalLastMonthTotal),
//       lastMonthTotalUSD: globalLastMonthTotal,
//       targetUSD: globalLastMonthTotal,
//     };

//     const ukLastMonthTotal = chooseLastMonthTotal(
//       MANUAL_LAST_MONTH_USD_UK,
//       prevAmazonUKTotalUSD
//     );
//     const ukRegion: RegionMetrics = {
//       mtdUSD: amazonUK_USD,
//       lastMonthToDateUSD: prorateToDate(ukLastMonthTotal),
//       lastMonthTotalUSD: ukLastMonthTotal,
//       targetUSD: ukLastMonthTotal,
//     };

//     const usLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_US, 0);
//     const usRegion: RegionMetrics = {
//       mtdUSD: 0,
//       lastMonthToDateUSD: prorateToDate(usLastMonthTotal),
//       lastMonthTotalUSD: usLastMonthTotal,
//       targetUSD: usLastMonthTotal,
//     };

//     const caLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_CA, 0);
//     const caRegion: RegionMetrics = {
//       mtdUSD: 0,
//       lastMonthToDateUSD: prorateToDate(caLastMonthTotal),
//       lastMonthTotalUSD: caLastMonthTotal,
//       targetUSD: caLastMonthTotal,
//     };

//     return {
//       Global: global,
//       UK: ukRegion,
//       US: usRegion,
//       CA: caRegion,
//     } as Record<RegionKey, RegionMetrics>;
//   }, [combinedUSD, amazonUK_USD, globalPrevTotalUSD, prevAmazonUKTotalUSD]);

//   const anyLoading = loading || shopifyLoading;

//   const amazonTabs = useMemo<RegionKey[]>(() => {
//     const tabs: RegionKey[] = [];
//     (["UK", "US", "CA"] as RegionKey[]).forEach((key) => {
//       const r = regions[key];
//       if (!r) return;
//       if (r.mtdUSD || r.lastMonthToDateUSD || r.lastMonthTotalUSD || r.targetUSD) tabs.push(key);
//     });
//     return tabs;
//   }, [regions]);

//   useEffect(() => {
//     if (amazonTabs.length && !amazonTabs.includes(amazonRegion)) setAmazonRegion(amazonTabs[0]);
//   }, [amazonTabs, amazonRegion]);

//   const graphRegions = useMemo<RegionKey[]>(() => {
//     const list: RegionKey[] = ["Global"];
//     (["UK", "US", "CA"] as RegionKey[]).forEach((key) => {
//       const r = regions[key];
//       if (!r) return;
//       if (r.mtdUSD || r.lastMonthToDateUSD || r.lastMonthTotalUSD || r.targetUSD) list.push(key);
//     });
//     return list;
//   }, [regions]);

//   useEffect(() => {
//     if (!graphRegions.includes(graphRegion)) setGraphRegion("Global");
//   }, [graphRegions, graphRegion]);

//   const onlyAmazon = amazonIntegrated && !shopifyIntegrated;
//   const onlyShopify = shopifyIntegrated && !amazonIntegrated;

//   /* ===================== P&L ITEMS (DISPLAY CURRENCY OUTPUT) ===================== */
//   // const plItems = useMemo(() => {
//   //   // Global P&L sales shown as combined USD -> displayCurrency
//   //   if (graphRegion === "Global") {
//   //     const sales = convertToDisplayCurrency(combinedUSD, "USD");
//   //     return [
//   //       { label: "Sales", raw: sales, display: formatDisplayAmount(sales) },
//   //       { label: "Amazon Fees", raw: 0, display: formatDisplayAmount(0) },
//   //       { label: "COGS", raw: 0, display: formatDisplayAmount(0) },
//   //       { label: "Advertisements", raw: 0, display: formatDisplayAmount(0) },
//   //       { label: "Other Charges", raw: 0, display: formatDisplayAmount(0) },
//   //       { label: "Profit", raw: 0, display: formatDisplayAmount(0) },
//   //     ];
//   //   }

//   //   // UK P&L is in GBP in backend, then converted to displayCurrency
//   //   const sales = convertToDisplayCurrency(uk.netSalesGBP ?? 0, "GBP");
//   //   const fees = convertToDisplayCurrency(uk.amazonFeesGBP ?? 0, "GBP");
//   //   const cogs = convertToDisplayCurrency(uk.cogsGBP ?? 0, "GBP");
//   //   const adv = convertToDisplayCurrency(uk.advertisingGBP ?? 0, "GBP");
//   //   const platformFee = convertToDisplayCurrency(uk.platformFeeGBP ?? 0, "GBP");
//   //   const profit = convertToDisplayCurrency(uk.profitGBP ?? 0, "GBP");

//   //   return [
//   //     { label: "Sales", raw: sales, display: formatDisplayAmount(sales) },
//   //     { label: "Amazon Fees", raw: fees, display: formatDisplayAmount(fees) },
//   //     { label: "COGS", raw: cogs, display: formatDisplayAmount(cogs) },
//   //     { label: "Advertisements", raw: adv, display: formatDisplayAmount(adv) },
//   //     { label: "Platform Fees", raw: platformFee, display: formatDisplayAmount(platformFee) },
//   //     { label: "Profit", raw: profit, display: formatDisplayAmount(profit) },
//   //   ];
//   // }, [
//   //   graphRegion,
//   //   combinedUSD,
//   //   uk.netSalesGBP,
//   //   uk.amazonFeesGBP,
//   //   uk.cogsGBP,
//   //   uk.advertisingGBP,
//   //   uk.platformFeeGBP,
//   //   uk.profitGBP,
//   //   convertToDisplayCurrency,
//   //   formatDisplayAmount,
//   // ]);


//   const plItems = useMemo(() => {
//     // Helper for UK P&L (used by UK tab + Global when onlyAmazon)
//     const ukPl = () => {
//       const sales = convertToDisplayCurrency(uk.netSalesGBP ?? 0, "GBP");
//       const fees = convertToDisplayCurrency(uk.amazonFeesGBP ?? 0, "GBP");
//       const cogs = convertToDisplayCurrency(uk.cogsGBP ?? 0, "GBP");
//       const adv = convertToDisplayCurrency(uk.advertisingGBP ?? 0, "GBP");
//       const platformFee = convertToDisplayCurrency(uk.platformFeeGBP ?? 0, "GBP");
//       const profit = convertToDisplayCurrency(uk.profitGBP ?? 0, "GBP");

//       return [
//         { label: "Sales", raw: sales, display: formatDisplayAmount(sales) },
//         { label: "Amazon Fees", raw: fees, display: formatDisplayAmount(fees) },
//         { label: "COGS", raw: cogs, display: formatDisplayAmount(cogs) },
//         { label: "Advertisements", raw: adv, display: formatDisplayAmount(adv) },
//         { label: "Platform Fees", raw: platformFee, display: formatDisplayAmount(platformFee) },
//         { label: "Profit", raw: profit, display: formatDisplayAmount(profit) },
//       ];
//     };

//     // ✅ GLOBAL VIEW (when graphRegionToUse is Global)
//     if (graphRegionToUse === "Global") {
//       // ✅ If only Amazon UK connected → Global should match UK exactly
//       if (onlyAmazon) return ukPl();

//       // ✅ If only Shopify connected → Global is Shopify-only Sales
//       if (onlyShopify) {
//         const sales = convertToDisplayCurrency(shopifyDeriv?.netSales ?? 0, "INR");
//         return [
//           { label: "Sales", raw: sales, display: formatDisplayAmount(sales) },
//           { label: "Amazon Fees", raw: 0, display: formatDisplayAmount(0) },
//           { label: "COGS", raw: 0, display: formatDisplayAmount(0) },
//           { label: "Advertisements", raw: 0, display: formatDisplayAmount(0) },
//           { label: "Other Charges", raw: 0, display: formatDisplayAmount(0) },
//           { label: "Profit", raw: 0, display: formatDisplayAmount(0) },
//         ];
//       }

//       // ✅ Both connected → Sales combined, costs unknown (keep your current behavior)
//       const sales = convertToDisplayCurrency(combinedUSD, "USD");
//       return [
//         { label: "Sales", raw: sales, display: formatDisplayAmount(sales) },
//         { label: "Amazon Fees", raw: 0, display: formatDisplayAmount(0) },
//         { label: "COGS", raw: 0, display: formatDisplayAmount(0) },
//         { label: "Advertisements", raw: 0, display: formatDisplayAmount(0) },
//         { label: "Other Charges", raw: 0, display: formatDisplayAmount(0) },
//         { label: "Profit", raw: 0, display: formatDisplayAmount(0) },
//       ];
//     }

//     // ✅ REGION VIEW
//     if (graphRegionToUse === "UK") return ukPl();

//     // (Optional placeholders until you implement US/CA breakdowns)
//     const zero = formatDisplayAmount(0);
//     return [
//       { label: "Sales", raw: 0, display: zero },
//       { label: "Amazon Fees", raw: 0, display: zero },
//       { label: "COGS", raw: 0, display: zero },
//       { label: "Advertisements", raw: 0, display: zero },
//       { label: "Other Charges", raw: 0, display: zero },
//       { label: "Profit", raw: 0, display: zero },
//     ];
//   }, [
//     graphRegionToUse,          // ✅ changed
//     onlyAmazon,
//     onlyShopify,
//     combinedUSD,
//     uk.netSalesGBP,
//     uk.amazonFeesGBP,
//     uk.cogsGBP,
//     uk.advertisingGBP,
//     uk.platformFeeGBP,
//     uk.profitGBP,
//     shopifyDeriv?.netSales,
//     convertToDisplayCurrency,
//     formatDisplayAmount,
//   ]);

//   const labels = plItems.map((i) => i.label);
//   const values = plItems.map((i) => i.raw);

//   const colorMapping: Record<string, string> = {
//     Sales: "#2CA9E0",
//     "Amazon Fees": "#ff5c5c",
//     COGS: "#AB64B5",
//     Advertisements: "#F47A00",
//     "Other Charges": "#00627D",
//     "Platform Fees": "#154B9B",
//     Profit: "#87AD12",
//   };
//   const colors = labels.map(
//     (label) => colorMapping[label] || "#2CA9E0"
//   );

//   const allValuesZero = values.every((v) => !v || v === 0);

//   /* ===================== EXCEL EXPORT (USES displayCurrency symbol) ===================== */
//   const captureChartPng = useCallback(async () => {
//     const container = chartRef.current;
//     if (!container) return null;

//     const canvas = container.querySelector("canvas") as HTMLCanvasElement | null;
//     if (canvas) {
//       try {
//         const tmpCanvas = document.createElement("canvas");
//         tmpCanvas.width = canvas.width;
//         tmpCanvas.height = canvas.height;
//         const ctx = tmpCanvas.getContext("2d");
//         if (!ctx) return null;

//         ctx.fillStyle = "#ffffff";
//         ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
//         ctx.drawImage(canvas, 0, 0);

//         return tmpCanvas.toDataURL("image/png");
//       } catch {
//         return null;
//       }
//     }
//     return null;
//   }, []);

//   const { monthName: currMonthName, year: currYear } = getISTYearMonth();
//   const shortMonForGraph = new Date(`${currMonthName} 1, ${currYear}`).toLocaleString("en-US", {
//     month: "short",
//     timeZone: "Asia/Kolkata",
//   });
//   const formattedMonthYear = `${shortMonForGraph}'${String(currYear).slice(-2)}`;

//   const countryNameForGraph =
//     graphRegionToUse === "Global" ? "global" : graphRegionToUse.toLowerCase();


//   const handleDownload = useCallback(async () => {
//     try {
//       const pngDataUrl = await captureChartPng();

//       const workbook = new ExcelJS.Workbook();
//       const sheet = workbook.addWorksheet("Amazon P&L");

//       sheet.addRow([brandName || "Brand"]);
//       sheet.addRow([`Amazon P&L - ${formattedMonthYear}`]);
//       sheet.addRow([`Country: ${countryNameForGraph.toUpperCase()}`]);
//       sheet.addRow([`Currency: ${currencySymbol}`]);
//       sheet.addRow([""]);

//       sheet.addRow(["Metric", "", `Amount (${currencySymbol})`]);

//       const signs: Record<string, string> = {
//         Sales: "(+)",
//         "Amazon Fees": "(-)",
//         COGS: "(-)",
//         Advertisements: "(-)",
//         "Other Charges": "(-)",
//         "Platform Fees": "(-)",
//         Profit: "",
//       };

//       values.forEach((v, idx) => {
//         const label = labels[idx];
//         const sign = signs[label] || "";
//         const num = Number(v || 0);
//         sheet.addRow([label, sign, Number(num.toFixed(2))]);
//       });

//       const totalValue = values.reduce((acc, v) => acc + (Number(v) || 0), 0);
//       sheet.addRow(["Total", "", Number(totalValue.toFixed(2))]);

//       if (pngDataUrl) {
//         const base64 = pngDataUrl.replace(/^data:image\/png;base64,/, "");
//         const imageId = workbook.addImage({ base64, extension: "png" });

//         sheet.addImage(
//           imageId,
//           { tl: { col: 0, row: 9 } as any, br: { col: 8, row: 28 } as any, editAs: "oneCell" } as any
//         );
//       }

//       const buffer = await workbook.xlsx.writeBuffer();
//       const blob = new Blob([buffer], {
//         type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       });
//       saveAs(blob, `Amazon-PnL-${formattedMonthYear}.xlsx`);
//     } catch (err) {
//       console.error("Error generating Excel with chart", err);
//     }
//   }, [
//     brandName,
//     formattedMonthYear,
//     countryNameForGraph,
//     currencySymbol,
//     captureChartPng,
//     labels,
//     values,
//   ]);

//   /* ===================== RENDER ===================== */
//   const hasAnyGraphData = amazonIntegrated || shopifyIntegrated;
//   const hasGlobalCard = !noIntegrations;
//   const hasAmazonCard = amazonIntegrated;
//   const hasShopifyCard = !shopifyNotConnected;

//   const leftColumnHeightClass = !hasShopifyCard ? "lg:min-h-[520px]" : "";

//   return (
//     <div className="relative">
//       {(loading || shopifyLoading) && !data && !shopify && (
//         <>
//           <div className="fixed inset-0 z-40 bg-white/70" />
//           <div className="fixed inset-0 z-50 flex items-center justify-center">
//             <Loader
//               src="/infinity-unscreen.gif"
//               label="Loading sales dashboard…"
//               size={120}
//               roundedClass="rounded-xl"
//               backgroundClass="bg-transparent"
//               respectReducedMotion
//             />
//           </div>
//         </>
//       )}

//       <div className="">
//         <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
//           <div className="flex flex-col leading-tight">
//             <p className="text-lg text-charcoal-500 mb-1">
//               Let&apos;s get started, <span className="text-green-500">{brandName}!</span>
//             </p>

//             <div className="flex items-center gap-2">
//               <PageBreadcrumb
//                 pageTitle="Sales Dashboard -"
//                 variant="page"
//                 textSize="2xl"
//                 className="text-2xl font-semibold"
//               />

//               <span className="text-lg sm:text-2xl md:text-2xl font-semibold text-[#5EA68E]">
//                 {formattedMonthYear}
//               </span>

//             </div>
//           </div>

//           <button
//             onClick={refreshAll}
//             disabled={loading || shopifyLoading}
//             className={`w-full rounded-md border px-3 py-1.5 text-sm shadow-sm active:scale-[.99] sm:w-auto ${loading || shopifyLoading
//               ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
//               : "border-gray-300 bg-white hover:bg-gray-50"
//               }`}
//           >
//             {loading || shopifyLoading ? "Refreshing…" : "Refresh"}
//           </button>
//         </div>

//         <div className={`grid grid-cols-12 gap-6 ${!noIntegrations ? "items-stretch" : ""}`}>
//           {/* LEFT COLUMN */}
//           <div className={`col-span-12 lg:col-span-8 order-2 lg:order-1 flex flex-col gap-6 ${leftColumnHeightClass}`}>
//             {/* GLOBAL CARD */}
//             {!isCountryMode && hasGlobalCard && (
//               <div className="flex lg:flex-1">
//                 <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
//                   <div className="mb-4">
//                     <div className="flex items-baseline gap-2">
//                       <PageBreadcrumb pageTitle="Global" variant="page" align="left" />
//                     </div>
//                     <p className="mt-1 text-sm text-charcoal-500">
//                       Real-time data from Amazon &amp; Shopify
//                     </p>
//                   </div>

//                   <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
//                     <AmazonStatCard
//                       label="Sales"
//                       current={convertToDisplayCurrency(combinedUSD, "USD")}
//                       previous={convertToDisplayCurrency(globalPrevTotalUSD, "USD")}
//                       loading={loading || shopifyLoading}
//                       formatter={formatDisplayAmount}
//                       bottomLabel={prevLabel}
//                       className="border-[#87AD12] bg-[#87AD1226]"
//                     />
//                     <AmazonStatCard
//                       label="Units"
//                       current={(toNumberSafe(cms?.total_quantity ?? 0) + toNumberSafe(shopifyDeriv?.totalOrders ?? 0))}
//                       previous={(toNumberSafe(shopifyPrevDeriv?.totalOrders ?? 0))}
//                       loading={loading || shopifyLoading}
//                       formatter={fmtInt}
//                       bottomLabel={prevLabel}
//                       className="border-[#F47A00] bg-[#F47A0026]"
//                     />
//                     <AmazonStatCard
//                       label="ASP"
//                       current={(() => {
//                         const units = toNumberSafe(cms?.total_quantity ?? 0) + toNumberSafe(shopifyDeriv?.totalOrders ?? 0);
//                         const sales = convertToDisplayCurrency(combinedUSD, "USD");
//                         return units > 0 ? sales / units : 0;
//                       })()}
//                       previous={0}
//                       loading={loading || shopifyLoading}
//                       formatter={formatDisplayAmount}
//                       bottomLabel={prevLabel}
//                       className="border-[#2CA9E0] bg-[#2CA9E026]"
//                     />
//                     <AmazonStatCard
//                       label="Profit"
//                       current={convertToDisplayCurrency((toNumberSafe(uk.profitGBP ?? 0) * gbpToUsd), "USD")}
//                       previous={0}
//                       loading={loading || shopifyLoading}
//                       formatter={formatDisplayAmount}
//                       bottomLabel={prevLabel}
//                       className="border-[#AB64B5] bg-[#AB64B526]"
//                     />
//                     <AmazonStatCard
//                       label="Profit %"
//                       current={0}
//                       previous={0}
//                       loading={loading || shopifyLoading}
//                       formatter={fmtPct}
//                       bottomLabel={prevLabel}
//                       className="border-[#00627B] bg-[#00627B26]"
//                     />
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* AMAZON CARD */}
//             {/* {hasAmazonCard && (
//               <div className="flex lg:flex-1">
//                 <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
//                   <div className="mb-4 flex flex-row gap-4 items-start md:items-start md:justify-between">
//                     <div className="flex flex-col flex-1 min-w-0">
//                       <div className="flex flex-wrap items-baseline gap-2">
//                         <PageBreadcrumb pageTitle="Amazon" variant="page" align="left" />
//                       </div>
//                       <p className="mt-1 text-sm text-charcoal-500">Real-time data from Amazon</p>
//                     </div>

//                     {!isCountryMode && amazonTabs.length > 0 && (
//                       <SegmentedToggle<RegionKey>
//                         value={amazonRegion}
//                         options={amazonTabs.map((r) => ({ value: r }))}
//                         onChange={setAmazonRegion}
//                       />
//                     )}

//                   </div>

//                   <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
//                     <AmazonStatCard
//                       label="Sales"
//                       current={convertToDisplayCurrency(uk.netSalesGBP ?? 0, "GBP")}
//                       previous={0}
//                       loading={loading}
//                       formatter={formatDisplayAmount}
//                       bottomLabel={prevLabel}
//                       className="border-[#87AD12] bg-[#87AD1226]"
//                     />
//                     <AmazonStatCard
//                       label="Units"
//                       current={cms?.total_quantity ?? 0}
//                       previous={0}
//                       loading={loading}
//                       formatter={fmtInt}
//                       bottomLabel={prevLabel}
//                       className="border-[#F47A00] bg-[#F47A0026]"
//                     />
//                     <AmazonStatCard
//                       label="ASP"
//                       current={convertToDisplayCurrency(uk.aspGBP ?? 0, "GBP")}
//                       previous={0}
//                       loading={loading}
//                       formatter={formatDisplayAmount}
//                       bottomLabel={prevLabel}
//                       className="border-[#2CA9E0] bg-[#2CA9E026]"
//                     />
//                     <AmazonStatCard
//                       label="Profit"
//                       current={convertToDisplayCurrency(uk.profitGBP ?? 0, "GBP")}
//                       previous={0}
//                       loading={loading}
//                       formatter={formatDisplayAmount}
//                       bottomLabel={prevLabel}
//                       className="border-[#AB64B5] bg-[#AB64B526]"
//                     />
//                     <AmazonStatCard
//                       label="Profit %"
//                       current={uk.profitPctGBP ?? 0}
//                       previous={0}
//                       loading={loading}
//                       formatter={fmtPct}
//                       bottomLabel={prevLabel}
//                       className="border-[#00627B] bg-[#00627B26]"
//                     />
//                   </div>
//                   {showLiveBI && (
//                     <div className="mt-6">
//                       <LiveBiLineGraph
//                         countryName={countryName}      
//                         ranged="MTD"
//                         month={currMonthName.toLowerCase()}
//                         year={String(currYear)}
//                       />
//                     </div>
//                   )}
//                 </div>

//               </div>
//             )} */}

//             {/* AMAZON SECTION */}
//             {hasAmazonCard && (
//               <div className="flex flex-col lg:flex-1 gap-4">
//                 {/* KPI Card (Amazon header + stat grid) */}
//                 <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
//                   <div className="mb-4 flex flex-row gap-4 items-start md:items-start md:justify-between">
//                     <div className="flex flex-col flex-1 min-w-0">
//                       <div className="flex flex-wrap items-baseline gap-2">
//                         <PageBreadcrumb pageTitle="Amazon" variant="page" align="left" />
//                       </div>
//                       <p className="mt-1 text-sm text-charcoal-500">Real-time data from Amazon</p>
//                     </div>

//                     {!isCountryMode && amazonTabs.length > 0 && (
//                       <SegmentedToggle<RegionKey>
//                         value={amazonRegion}
//                         options={amazonTabs.map((r) => ({ value: r }))}
//                         onChange={setAmazonRegion}
//                       />
//                     )}
//                   </div>

//                   <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
//                     <AmazonStatCard
//                       label="Sales"
//                       current={convertToDisplayCurrency(uk.netSalesGBP ?? 0, "GBP")}
//                       previous={0}
//                       loading={loading}
//                       formatter={formatDisplayAmount}
//                       bottomLabel={prevLabel}
//                       className="border-[#87AD12] bg-[#87AD1226]"
//                     />
//                     <AmazonStatCard
//                       label="Units"
//                       current={cms?.total_quantity ?? 0}
//                       previous={0}
//                       loading={loading}
//                       formatter={fmtInt}
//                       bottomLabel={prevLabel}
//                       className="border-[#F47A00] bg-[#F47A0026]"
//                     />
//                     <AmazonStatCard
//                       label="ASP"
//                       current={convertToDisplayCurrency(uk.aspGBP ?? 0, "GBP")}
//                       previous={0}
//                       loading={loading}
//                       formatter={formatDisplayAmount}
//                       bottomLabel={prevLabel}
//                       className="border-[#2CA9E0] bg-[#2CA9E026]"
//                     />
//                     <AmazonStatCard
//                       label="Profit"
//                       current={convertToDisplayCurrency(uk.profitGBP ?? 0, "GBP")}
//                       previous={0}
//                       loading={loading}
//                       formatter={formatDisplayAmount}
//                       bottomLabel={prevLabel}
//                       className="border-[#AB64B5] bg-[#AB64B526]"
//                     />
//                     <AmazonStatCard
//                       label="Profit %"
//                       current={uk.profitPctGBP ?? 0}
//                       previous={0}
//                       loading={loading}
//                       formatter={fmtPct}
//                       bottomLabel={prevLabel}
//                       className="border-[#00627B] bg-[#00627B26]"
//                     />
//                   </div>
//                 </div>

//                 {/* Chart BELOW as its own card */}
//                 {showLiveBI && (
//                   <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
//                     <LiveBiLineGraph
//                       countryName={countryName}
//                       ranged="MTD"
//                       month={currMonthName.toLowerCase()}
//                       year={String(currYear)}
//                     />
//                   </div>
//                 )}
//               </div>
//             )}


//             {/* SHOPIFY CARD */}
//             {!isCountryMode && hasShopifyCard && (
//               <div className="flex lg:flex-1">
//                 <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
//                   <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
//                     <div className="flex flex-col">
//                       <div className="flex items-baseline gap-2">
//                         <PageBreadcrumb pageTitle="Shopify" variant="page" align="left" textSize="2xl" />
//                       </div>
//                       <p className="mt-1 text-sm text-charcoal-500">Real-time data from Shopify</p>
//                     </div>
//                   </div>

//                   {shopifyLoading ? (
//                     <div className="mt-3 text-sm text-gray-500">Loading Shopify…</div>
//                   ) : shopify ? (
//                     <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                       <AmazonStatCard
//                         label="Sales"
//                         current={convertToDisplayCurrency(shopifyDeriv?.netSales ?? 0, "INR")}
//                         previous={convertToDisplayCurrency(shopifyPrevDeriv?.netSales ?? 0, "INR")}
//                         loading={shopifyLoading}
//                         formatter={formatDisplayAmount}
//                         bottomLabel={prevLabel}
//                         className="border-[#87AD12] bg-[#87AD1226]"
//                       />
//                       <AmazonStatCard
//                         label="Units"
//                         current={shopifyDeriv?.totalOrders ?? 0}
//                         previous={shopifyPrevDeriv?.totalOrders ?? 0}
//                         loading={shopifyLoading}
//                         formatter={fmtInt}
//                         bottomLabel={prevLabel}
//                         className="border-[#F47A00] bg-[#F47A0026]"
//                       />
//                       <AmazonStatCard
//                         label="ASP"
//                         current={(() => {
//                           const units = shopifyDeriv?.totalOrders ?? 0;
//                           if (!units) return 0;
//                           const net = convertToDisplayCurrency(shopifyDeriv?.netSales ?? 0, "INR");
//                           return net / units;
//                         })()}
//                         previous={0}
//                         loading={shopifyLoading}
//                         formatter={formatDisplayAmount}
//                         bottomLabel={prevLabel}
//                         className="border-[#2CA9E0] bg-[#2CA9E026]"
//                       />
//                     </div>
//                   ) : (
//                     <div className="mt-2 text-sm text-gray-500">No Shopify data for the current month.</div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* RIGHT COLUMN: Sales Target */}
//           <aside className="col-span-12 lg:col-span-4 order-1 lg:order-2 flex">
//             <div className="w-full flex">
//               <div className="w-full lg:sticky lg:top-6 self-start flex">
//                 <div className="w-full h-full ">
//                   <SalesTargetCard
//                     regions={regions}
//                     defaultRegion={isCountryMode ? forcedRegion : "Global"}
//                     hideTabs={isCountryMode}
//                     homeCurrency={displayCurrency}
//                     convertToHomeCurrency={(v, from) => convertToDisplayCurrency(v, from)}
//                     formatHomeK={formatDisplayK}
//                   />
//                 </div>
//               </div>
//             </div>
//           </aside>

//         </div>

//         <div className="mt-4">

//           {showLiveBI && (
//             <MonthsforBI
//               countryName={countryName}
//               ranged="MTD"
//               month={currMonthName.toLowerCase()}
//               year={String(currYear)}
//             />
//           )}
//         </div>

//         {hasAnyGraphData && (
//           <>
//             <div className="mt-8 rounded-2xl border bg-[#D9D9D933] p-5 shadow-sm">
//               <div className="mb-3 flex items-center justify-between">
//                 <div className="text-sm text-gray-500">
//                   <PageBreadcrumb pageTitle="Amazon" align="left" textSize="2xl" variant="page" />
//                   <p className="text-charcoal-500">
//                     Real-time data{" "}
//                     {graphRegionToUse === "Global" ? "Global" : graphRegionToUse}

//                   </p>
//                 </div>

//                 {!isCountryMode && (
//                   <div className="flex items-center gap-3">
//                     <SegmentedToggle<RegionKey>
//                       value={graphRegion}
//                       options={graphRegions.map((r) => ({ value: r }))}
//                       onChange={setGraphRegion}
//                     />
//                     <DownloadIconButton onClick={handleDownload} />
//                   </div>
//                 )}
//               </div>

//               <div ref={chartRef}>
//                 <DashboardBargraphCard
//                   countryName={countryNameForGraph}
//                   formattedMonthYear={formattedMonthYear}
//                   currencySymbol={currencySymbol}
//                   labels={labels}
//                   values={values}
//                   colors={colors}
//                   loading={loading}
//                   allValuesZero={allValuesZero}
//                 />
//               </div>
//             </div>




//              {amazonIntegrated && <CurrentInventorySection region={graphRegionToUse} />
// } 
//           </>
//         )}
//       </div>
//     </div>
//   );
// }























































"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/loader/Loader";
import DownloadIconButton from "@/components/ui/button/DownloadIconButton";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import DashboardBargraphCard from "@/components/dashboard/DashboardBargraphCard";
import SalesTargetCard from "@/components/dashboard/SalesTargetCard";
import AmazonStatCard from "@/components/dashboard/AmazonStatCard";
import CurrentInventorySection from "@/components/dashboard/CurrentInventorySection";

import { RootState } from "@/lib/store";
import { useAmazonConnections } from "@/lib/utils/useAmazonConnections";

import {
  getISTYearMonth,
  getPrevISTYearMonth,
  getPrevMonthShortLabel,
  getISTDayInfo,
} from "@/lib/dashboard/date";

import {
  fmtGBP,
  fmtUSD,
  fmtNum,
  fmtPct,
  fmtInt,
  toNumberSafe,
} from "@/lib/dashboard/format";

import type { RegionKey, RegionMetrics } from "@/lib/dashboard/types";

import { useGetUserDataQuery } from "@/lib/api/profileApi";
import { usePlatform } from "@/components/context/PlatformContext";
import type { PlatformId } from "@/lib/utils/platforms";
import MonthsforBI from "./live-business-insight/[ranged]/[countryName]/[month]/[year]/page";
import LiveBiLineGraph from "@/components/businessInsight/LiveBiLineChartPanel";

// ✅ moved range picker deps here
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { FaCalendarAlt } from "react-icons/fa";

type CurrencyCode = "USD" | "GBP" | "INR" | "CAD";

/* ===================== ENV & ENDPOINTS ===================== */
const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

// const API_URL = `${baseURL}/amazon_api/orders`;
const FIN_MTD_TX_ENDPOINT = `${baseURL}/amazon_api/finances/mtd_transactions`;
const SHOPIFY_DROPDOWN_ENDPOINT = `${baseURL}/shopify/dropdown`;
const FX_ENDPOINT = `${baseURL}/currency-rate`;

// ✅ BI endpoint (same one your graph uses)
const LIVE_MTD_BI_ENDPOINT = `${baseURL}/live_mtd_bi`;

/** 💵 FX defaults (used until backend answers) */
const GBP_TO_USD_ENV = Number(process.env.NEXT_PUBLIC_GBP_TO_USD || "1.25");
const INR_TO_USD_ENV = Number(process.env.NEXT_PUBLIC_INR_TO_USD || "0.01128");
const CAD_TO_USD_ENV = Number(process.env.NEXT_PUBLIC_CAD_TO_USD || "0.74");

const USE_MANUAL_LAST_MONTH =
  (process.env.NEXT_PUBLIC_USE_MANUAL_LAST_MONTH || "false").toLowerCase() ===
  "true";

const MANUAL_LAST_MONTH_USD_GLOBAL = Number(
  process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_GLOBAL || "0"
);
const MANUAL_LAST_MONTH_USD_UK = Number(
  process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_UK || "0"
);
const MANUAL_LAST_MONTH_USD_US = Number(
  process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_US || "0"
);
const MANUAL_LAST_MONTH_USD_CA = Number(
  process.env.NEXT_PUBLIC_MANUAL_LAST_MONTH_USD_CA || "0"
);

/* ===================== BI TYPES (for shared cards + graph) ===================== */
type ChartMetric = "net_sales" | "quantity";

type DailyPoint = {
  date: string;
  quantity?: number;
  net_sales?: number;
};

type DailySeries = {
  previous: DailyPoint[];
  current_mtd: DailyPoint[];
};

type PeriodInfo = {
  label: string;
  start_date: string;
  end_date: string;
};

type BiApiResponse = {
  message?: string;
  periods?: {
    previous?: PeriodInfo;
    current_mtd?: PeriodInfo;
  };
  daily_series?: DailySeries;

  // 👇 add these for MonthsforBI
  categorized_growth?: any;
  insights?: Record<string, any>;
  ai_insights?: Record<string, any>;
  overall_summary?: string[];
  overall_actions?: string[];
};


/* ===================== SMALL HELPERS ===================== */
const getShort = (label?: string) => (label ? label.split(" ")[0] || label : "");

const currencyForCountry = (countryName: string): CurrencyCode => {
  const c = (countryName || "").toLowerCase();
  if (c === "uk") return "GBP";
  if (c === "us") return "USD";
  if (c === "ca") return "CAD";
  // fallback (if you ever use india/shopify here)
  if (c === "india") return "INR";
  return "USD";
};

/* ===================== RANGE PICKER (moved above graph) ===================== */
function RangePicker({
  selectedStartDay,
  selectedEndDay,
  onSubmit,
  onClear,
  onCloseReset,
}: {
  selectedStartDay: number | null;
  selectedEndDay: number | null;
  onSubmit: (s: number | null, e: number | null) => void;
  onClear: () => void;
  onCloseReset: () => void;
}) {
  const [showCalendar, setShowCalendar] = useState(false);

  const [calendarRange, setCalendarRange] = useState<any>([
    { startDate: null, endDate: null, key: "selection" },
  ]);

  const [pendingStartDay, setPendingStartDay] = useState<number | null>(null);
  const [pendingEndDay, setPendingEndDay] = useState<number | null>(null);

  const handleCalendarChange = (ranges: any) => {
    const range = ranges.selection;
    setCalendarRange([range]);

    if (range.startDate && range.endDate) {
      setPendingStartDay(range.startDate.getDate());
      setPendingEndDay(range.endDate.getDate());
    } else {
      setPendingStartDay(null);
      setPendingEndDay(null);
    }
  };

  const applyRange = () => {
    onSubmit(pendingStartDay, pendingEndDay);
    setShowCalendar(false);
  };

  const clearRange = () => {
    setCalendarRange([{ startDate: null, endDate: null, key: "selection" }]);
    setPendingStartDay(null);
    setPendingEndDay(null);
    onClear();
  };

  const closeAndReset = () => {
    setCalendarRange([{ startDate: null, endDate: null, key: "selection" }]);
    setPendingStartDay(null);
    setPendingEndDay(null);
    setShowCalendar(false);
    onCloseReset();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowCalendar((s) => !s)}
        className="flex items-center gap-2"
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid #D9D9D9E5",
          backgroundColor: "#ffffff",
          fontSize: 12,
        }}
      >
        <FaCalendarAlt size={15} />
        {selectedStartDay && selectedEndDay
          ? `Day ${selectedStartDay} – ${selectedEndDay}`
          : "Select Date Range"}
      </button>

      {showCalendar && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            zIndex: 50,
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            padding: 8,
            borderRadius: 8,
            minWidth: 320,
          }}
        >
          <DateRange
            ranges={calendarRange}
            onChange={handleCalendarChange}
            moveRangeOnFirstSelection={false}
            showMonthAndYearPickers={false}
            rangeColors={["#5EA68E"]}
          />

          <div className="flex justify-between mt-2 gap-2">
            <button
              type="button"
              onClick={clearRange}
              className="text-xs px-2 py-1 border rounded"
            >
              Clear
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyRange}
                disabled={pendingStartDay == null || pendingEndDay == null}
                className="text-xs px-2 py-1 rounded text-yellow-200"
                style={{
                  background: "#37455F",
                  opacity: pendingStartDay == null ? 0.6 : 1,
                }}
              >
                Submit
              </button>
              <button
                type="button"
                onClick={closeAndReset}
                className="text-xs px-2 py-1 rounded text-charcoal-500 border border-charcoal-500"
              // style={{ background: "#5EA68E" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { platform } = usePlatform();
  const { data: userData } = useGetUserDataQuery();

  const isCountryMode = platform !== "global" && platform !== "shopify";

  const countryName = useMemo(() => {
    switch (platform) {
      case "amazon-uk":
        return "uk";
      case "amazon-us":
        return "us";
      case "amazon-ca":
        return "ca";
      default:
        return "global";
    }
  }, [platform]);

  const showLiveBI = isCountryMode;

  const brandName = useSelector(
    (state: RootState) => state.auth.user?.brand_name
  );

  /* ===================== PLATFORM → DISPLAY CURRENCY ===================== */
  const profileHomeCurrency = ((userData?.homeCurrency || "USD").toUpperCase() as CurrencyCode);

  const displayCurrency: CurrencyCode = useMemo(() => {
    switch (platform as PlatformId) {
      case "global":
        return profileHomeCurrency;
      case "amazon-uk":
        return "GBP";
      case "amazon-us":
        return "USD";
      case "amazon-ca":
        return "CAD";
      case "shopify":
        return "INR";
      default:
        return profileHomeCurrency;
    }
  }, [platform, profileHomeCurrency]);

  /* ===================== AMAZON / SHOPIFY STATE ===================== */
  const [loading, setLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const { connections: amazonConnections } = useAmazonConnections();

  // Shopify (current month)
  const [shopifyLoading, setShopifyLoading] = useState(false);
  const [shopifyError, setShopifyError] = useState<string | null>(null);
  const [shopifyRows, setShopifyRows] = useState<any[]>([]);
  const shopify = shopifyRows?.[0] || null;

  // Shopify (previous month)
  const [shopifyPrevRows, setShopifyPrevRows] = useState<any[]>([]);

  // Shopify store info
  const [shopifyStore, setShopifyStore] = useState<any | null>(null);

  // which region tab is selected in the Amazon card
  const [amazonRegion, setAmazonRegion] = useState<RegionKey>("Global");

  // which region is selected in the P&L graph
  const [graphRegion, setGraphRegion] = useState<RegionKey>("Global");


  const chartRef = React.useRef<HTMLDivElement | null>(null);
  const prevLabel = useMemo(() => getPrevMonthShortLabel(), []);

  /* ===================== ✅ SHARED RANGE STATE (PARENT) ===================== */
  const [selectedStartDay, setSelectedStartDay] = useState<number | null>(null);
  const [selectedEndDay, setSelectedEndDay] = useState<number | null>(null);

  const [biLoading, setBiLoading] = useState(false);
  const [biError, setBiError] = useState<string | null>(null);
  const [biDailySeries, setBiDailySeries] = useState<DailySeries | null>(null);
  const [biPeriods, setBiPeriods] = useState<BiApiResponse["periods"] | null>(null);
  const [liveBiPayload, setLiveBiPayload] = useState<BiApiResponse | null>(null);

  /* ===================== FX RATES ===================== */
  const [gbpToUsd, setGbpToUsd] = useState(GBP_TO_USD_ENV);
  const [inrToUsd, setInrToUsd] = useState(INR_TO_USD_ENV);
  const [cadToUsd, setCadToUsd] = useState(CAD_TO_USD_ENV);
  const [fxLoading, setFxLoading] = useState(false);

  const fetchFxRates = useCallback(async () => {
    try {
      setFxLoading(true);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) (headers as any).Authorization = `Bearer ${token}`;

      const { monthName, year } = getISTYearMonth();
      const month = monthName.toLowerCase();

      const commonBody = { month, year, fetch_if_missing: true };

      const [ukRes, inrRes, cadRes] = await Promise.all([
        fetch(FX_ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...commonBody,
            user_currency: "GBP",
            country: "uk",
            selected_currency: "USD",
          }),
        }),
        fetch(FX_ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...commonBody,
            user_currency: "INR",
            country: "india",
            selected_currency: "USD",
          }),
        }),
        fetch(FX_ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...commonBody,
            user_currency: "CAD",
            country: "ca",
            selected_currency: "USD",
          }),
        }),
      ]);

      if (ukRes.ok) {
        const json = await ukRes.json();
        const rate = json?.record?.conversion_rate;
        if (json?.success && rate != null) setGbpToUsd(Number(rate));
      }

      if (inrRes.ok) {
        const json = await inrRes.json();
        const rate = json?.record?.conversion_rate;
        if (json?.success && rate != null) setInrToUsd(Number(rate));
      }

      if (cadRes.ok) {
        const json = await cadRes.json();
        const rate = json?.record?.conversion_rate;
        if (json?.success && rate != null) setCadToUsd(Number(rate));
      }
    } catch (err) {
      console.error("Failed to fetch FX rates", err);
    } finally {
      setFxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFxRates();
  }, [fetchFxRates]);

  const forcedRegion: RegionKey = useMemo(() => {
    switch (platform) {
      case "amazon-uk":
        return "UK";
      case "amazon-us":
        return "US";
      case "amazon-ca":
        return "CA";
      default:
        return "Global";
    }
  }, [platform]);

  const graphRegionToUse: RegionKey = isCountryMode ? forcedRegion : graphRegion;

  useEffect(() => {
    if (!isCountryMode) return;
    setGraphRegion(forcedRegion);
    setAmazonRegion(forcedRegion);
  }, [isCountryMode, forcedRegion]);

  // ✅ which region is selected in the Sales Target card
  const [targetRegion, setTargetRegion] = useState<RegionKey>(
    isCountryMode ? forcedRegion : "Global"
  );

  useEffect(() => {
    if (isCountryMode) setTargetRegion(forcedRegion);
  }, [isCountryMode, forcedRegion]);


  /* ===================== CONVERSION + FORMATTING (DISPLAY CURRENCY) ===================== */
  const convertToDisplayCurrency = useCallback(
    (value: number | null | undefined, from: CurrencyCode) => {
      const n = toNumberSafe(value ?? 0);
      if (!n) return 0;

      // from -> USD
      let usd = n;
      if (from === "GBP") usd = n * gbpToUsd;
      if (from === "INR") usd = n * inrToUsd;
      if (from === "CAD") usd = n * cadToUsd;

      // USD -> displayCurrency
      if (displayCurrency === "USD") return usd;
      if (displayCurrency === "GBP") return gbpToUsd ? usd / gbpToUsd : usd;
      if (displayCurrency === "INR") return inrToUsd ? usd / inrToUsd : usd;
      if (displayCurrency === "CAD") return cadToUsd ? usd / cadToUsd : usd;

      return usd;
    },
    [displayCurrency, gbpToUsd, inrToUsd, cadToUsd]
  );

  const formatDisplayAmount = useCallback(
    (value: number | null | undefined) => {
      const n = toNumberSafe(value ?? 0);

      switch (displayCurrency) {
        case "USD":
          return fmtUSD(n);
        case "GBP":
          return fmtGBP(n);
        case "CAD":
          return new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: "CAD",
          }).format(n);
        case "INR":
          return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(n);
        default:
          return fmtNum(n);
      }
    },
    [displayCurrency]
  );




  const formatDisplayK = useCallback(
    (value: number | null | undefined) => {
      const n = toNumberSafe(value ?? 0);
      const abs = Math.abs(n);
      const isK = abs >= 1000;

      const displayVal = isK ? n / 1000 : n;
      const suffix = isK ? "k" : "";

      return `${formatDisplayAmount(displayVal)}${suffix}`;
    },
    [formatDisplayAmount]
  );

  const currencySymbol =
    displayCurrency === "USD"
      ? "$"
      : displayCurrency === "GBP"
        ? "£"
        : displayCurrency === "CAD"
          ? "CA$"
          : displayCurrency === "INR"
            ? "₹"
            : "¤";

  /* ===================== AMAZON FETCH ===================== */
  const fetchAmazon = useCallback(async () => {
    setLoading(true);
    setUnauthorized(false);
    setError(null);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

      if (!token) {
        setUnauthorized(true);
        throw new Error("No token found. Please sign in.");
      }

      // ✅ decide country from platform
      const uiCountry =
        platform === "amazon-us" ? "us" : platform === "amazon-ca" ? "ca" : "uk";

      // ✅ marketplace id (fallback to UK one you provided)
      const marketplaceId =
        (amazonConnections?.find?.((c: any) => (c?.country || "").toLowerCase() === uiCountry)
          ?.marketplace_id) ||
        (uiCountry === "uk"
          ? "A1F83G8C2ARO7P"
          : uiCountry === "us"
            ? "ATVPDKIKX0DER"
            : uiCountry === "ca"
              ? "A2EUQ1WTGCTBG2"
              : "A1F83G8C2ARO7P");

      const params = new URLSearchParams({
        marketplace_id: marketplaceId,
        store_in_db: "true",
        country: uiCountry,
      });

      const url = `${FIN_MTD_TX_ENDPOINT}?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "omit",
      });

      if (res.status === 401) {
        setUnauthorized(true);
        throw new Error("Unauthorized — token missing/invalid/expired.");
      }

      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || `Request failed: ${res.status}`);
      }

      setData(json); // ✅ data now matches your new response shape
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [platform, amazonConnections]);


  /* ===================== SHOPIFY STORE INFO ===================== */
  useEffect(() => {
    const fetchShopifyStore = async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
        if (!token) return;

        const res = await fetch(`${baseURL}/shopify/store`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) return;

        const d = await res.json();
        if (!res.ok || d?.error) return;

        setShopifyStore(d);
      } catch (err) {
        console.error("Error fetching Shopify store in Dashboard:", err);
      }
    };
    fetchShopifyStore();
  }, []);

  /* ===================== SHOPIFY CURRENT MONTH ===================== */
  const fetchShopify = useCallback(async () => {
    setShopifyLoading(true);
    setShopifyError(null);
    try {
      const user_token =
        typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
      if (!user_token) throw new Error("No token found. Please sign in.");

      if (!shopifyStore?.shop_name || !shopifyStore?.access_token) {
        throw new Error("Shopify store not connected.");
      }

      const { monthName, year } = getISTYearMonth();

      const params = new URLSearchParams({
        range: "monthly",
        month: monthName.toLowerCase(),
        year: String(year),
        user_token,
        shop: shopifyStore.shop_name,
        token: shopifyStore.access_token,
      });

      const url = `${SHOPIFY_DROPDOWN_ENDPOINT}?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${user_token}` },
        credentials: "omit",
      });

      if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
      if (!res.ok) throw new Error(`Shopify request failed: ${res.status}`);

      const json = await res.json();
      const row = json?.last_row_data ? json.last_row_data : null;
      setShopifyRows(row ? [row] : []);
    } catch (e: any) {
      setShopifyError(e?.message || "Failed to load Shopify data");
      setShopifyRows([]);
    } finally {
      setShopifyLoading(false);
    }
  }, [shopifyStore]);

  /* ===================== SHOPIFY PREVIOUS MONTH ===================== */
  const fetchShopifyPrev = useCallback(async () => {
    try {
      const user_token =
        typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
      if (!user_token) throw new Error("No token found. Please sign in.");

      if (!shopifyStore?.shop_name || !shopifyStore?.access_token) {
        throw new Error("Shopify store not connected.");
      }

      const { year, monthName } = getPrevISTYearMonth();

      const params = new URLSearchParams({
        range: "monthly",
        month: monthName.toLowerCase(),
        year: String(year),
        user_token,
        shop: shopifyStore.shop_name,
        token: shopifyStore.access_token,
      });

      const url = `${SHOPIFY_DROPDOWN_ENDPOINT}?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${user_token}` },
        credentials: "omit",
      });

      if (res.status === 401) throw new Error("Unauthorized — token missing/invalid/expired.");
      if (!res.ok) throw new Error(`Shopify (prev) request failed: ${res.status}`);

      const json = await res.json();
      const row = json?.last_row_data ? json.last_row_data : null;
      setShopifyPrevRows(row ? [row] : []);
    } catch (e: any) {
      console.warn("Shopify prev-month fetch failed:", e?.message);
      setShopifyPrevRows([]);
    }
  }, [shopifyStore]);






  /* ===================== ✅ SHARED BI FETCH (FOR CARDS + GRAPH) ===================== */
  const { monthName: currMonthName, year: currYear } = getISTYearMonth();

  const lastBiKeyRef = useRef<string>("");

  const fetchBiSeries = useCallback(
    async (startDay?: number | null, endDay?: number | null) => {
      if (!showLiveBI) return;
      
      const normalized = (countryName || "").toLowerCase();
      if (!normalized || normalized === "global") return;


      const key = JSON.stringify({
        country: normalized,
        ranged: "MTD",
        month: currMonthName.toLowerCase(),
        year: currYear,
        startDay: startDay ?? null,
        endDay: endDay ?? null,
      });

      if (lastBiKeyRef.current === key) return;
      lastBiKeyRef.current = key;
      // ✅ END ADD


      setBiLoading(true);
      setBiError(null);

      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

        const params = new URLSearchParams({
          countryName: normalized,
          ranged: "MTD",
          month: currMonthName.toLowerCase(),
          year: String(currYear),
          generate_ai_insights: "false",
        });

        if (startDay != null) params.set("start_day", String(startDay));
        if (endDay != null) params.set("end_day", String(endDay));

        const res = await fetch(`${LIVE_MTD_BI_ENDPOINT}?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        const json: BiApiResponse = await res.json();
        if (!res.ok) throw new Error((json as any)?.error || "Failed to load BI series");

        setLiveBiPayload(json);
        setBiPeriods(json?.periods || null);
        setBiDailySeries(json?.daily_series || null);
      } catch (e: any) {
        setBiPeriods(null);
        setBiDailySeries(null);
        setBiError(e?.message || "Failed to load BI series");
      } finally {
        setBiLoading(false);
      }
    },
    [showLiveBI, countryName, currMonthName, currYear]
  );

  useEffect(() => {
    if (!showLiveBI) return;
    fetchBiSeries(selectedStartDay, selectedEndDay);
  }, [showLiveBI, fetchBiSeries, selectedStartDay, selectedEndDay]);

  /* ===================== REFRESH ALL ===================== */
  const refreshAll = useCallback(async () => {
    await fetchAmazon();
    if (shopifyStore?.shop_name && shopifyStore?.access_token) {
      await Promise.all([fetchShopify(), fetchShopifyPrev()]);
    }
    // also refresh BI (keep current selected range)
    // if (showLiveBI) {
    //   await fetchBiSeries(selectedStartDay, selectedEndDay);
    // }
  }, [
    fetchAmazon,
    fetchShopify,
    fetchShopifyPrev,
    shopifyStore,
    // showLiveBI,
    // fetchBiSeries,
    // selectedStartDay,
    // selectedEndDay,
  ]);

  // useEffect(() => {
  //   refreshAll();
  // }, [refreshAll]);

  const didRefreshRef = useRef(false);

  useEffect(() => {
    if (didRefreshRef.current) return;
    didRefreshRef.current = true;

    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  /* ===================== AMAZON DERIVED DATA ===================== */
  const totals = data?.totals || null;
  const derived = data?.derived_totals || null;

  const uk = useMemo(() => {
    const netSalesGBP = derived?.net_sales != null ? toNumberSafe(derived.net_sales) : null;
    const aspGBP = derived?.asp != null ? toNumberSafe(derived.asp) : null;

    const cogsGBP = totals?.cogs != null ? toNumberSafe(totals.cogs) : 0;
    const fbaFeesGBP = totals?.fba_fees != null ? toNumberSafe(totals.fba_fees) : 0;
    const sellingFeesGBP = totals?.selling_fees != null ? toNumberSafe(totals.selling_fees) : 0;

    // ✅ your backend already computed amazon_fees = selling + fba, but we can compute too
    const amazonFeesGBP =
      derived?.amazon_fees != null
        ? toNumberSafe(derived.amazon_fees)
        : (fbaFeesGBP + sellingFeesGBP);

    const profitGBP = derived?.profit != null ? toNumberSafe(derived.profit) : null;

    const unitsGBP = totals?.quantity != null ? toNumberSafe(totals.quantity) : null;

    let profitPctGBP: number | null = null;
    if (profitGBP !== null && netSalesGBP && netSalesGBP !== 0) {
      profitPctGBP = (profitGBP / netSalesGBP) * 100;
    }

    const grossSalesGBP =
      totals?.product_sales != null ? toNumberSafe(totals.product_sales) : null; // ✅ current gross

    const advertisingGBP =
      derived?.advertising_fees != null ? toNumberSafe(derived.advertising_fees) : 0;

    const platformFeeGBP =
      derived?.platform_fee != null ? toNumberSafe(derived.platform_fee) : 0;


    return {
      unitsGBP,
      netSalesGBP,
      grossSalesGBP,
      aspGBP,
      profitGBP,
      profitPctGBP,
      cogsGBP,
      amazonFeesGBP,
      advertisingGBP,
      platformFeeGBP,
    };
  }, [totals, derived]);

  // helpers (return null => AmazonStatCard shows "—")
  const safeDeltaPct = (current: number, previous: number) => {
    const c = Number(current) || 0;
    const p = Number(previous) || 0;
    if (!p) return null;
    return ((c - p) / p) * 100;
  };



  const prevTotals = data?.previous_period?.totals || null;

  const prev = useMemo(() => {
    return {
      quantity: toNumberSafe(prevTotals?.quantity ?? 0),
      netSales: toNumberSafe(prevTotals?.net_sales ?? 0),
      grossSales: toNumberSafe(prevTotals?.gross_sales ?? 0), // ✅ add
      asp: toNumberSafe(prevTotals?.asp ?? 0),
      profit: toNumberSafe(prevTotals?.profit ?? 0),
      profitPct: toNumberSafe(prevTotals?.profit_percentage ?? 0),
    };
  }, [prevTotals]);




  const curr = useMemo(() => {
    return {
      quantity: toNumberSafe(totals?.quantity ?? 0),
      netSales: toNumberSafe(derived?.net_sales ?? 0),
      asp: toNumberSafe(derived?.asp ?? 0),
      profit: toNumberSafe(derived?.profit ?? 0),
      profitPct: toNumberSafe(uk.profitPctGBP ?? 0),
    };
  }, [totals, derived, uk.profitPctGBP]);

  const deltas = useMemo(() => {
    return {
      quantityPct: safeDeltaPct(curr.quantity, prev.quantity),
      netSalesPct: safeDeltaPct(curr.netSales, prev.netSales),
      aspPct: safeDeltaPct(curr.asp, prev.asp),
      profitPct: safeDeltaPct(curr.profit, prev.profit),

      // Profit % must be percentage-points (pp)
      profitMarginPctPts:
        curr.profitPct != null && prev.profitPct != null
          ? Number(curr.profitPct) - Number(prev.profitPct)
          : null,
    };
  }, [curr, prev]);



  /* ===================== ✅ RANGE KPIs FOR CARDS (FROM SAME BI DATA AS GRAPH) ===================== */
  const rangeKpis = useMemo(() => {
    if (!biDailySeries?.current_mtd?.length) return { sales: 0, units: 0, asp: 0 };

    const sales = biDailySeries.current_mtd.reduce(
      (a, d) => a + (Number(d.net_sales) || 0),
      0
    );
    const units = biDailySeries.current_mtd.reduce(
      (a, d) => a + (Number(d.quantity) || 0),
      0
    );
    const asp = units > 0 ? sales / units : 0;

    return { sales, units, asp };
  }, [biDailySeries]);

  const rangeActive = selectedStartDay != null && selectedEndDay != null;

  /* ===================== INTEGRATION FLAGS ===================== */
  const shopifyDeriv = useMemo(() => {
    if (!shopify) return null;
    const totalOrders = toNumberSafe(shopify.total_orders);
    const netSales = toNumberSafe(shopify.net_sales);
    return { totalOrders, netSales };
  }, [shopify]);

  const shopifyPrevDeriv = useMemo(() => {
    const row = shopifyPrevRows?.[0];
    if (!row) return null;
    const netSales = toNumberSafe(row.net_sales);
    const totalOrders = toNumberSafe(row.total_orders);
    return { netSales, totalOrders };
  }, [shopifyPrevRows]);

  const shopifyNotConnected =
    !shopifyStore?.shop_name ||
    !shopifyStore?.access_token ||
    (shopifyError &&
      (shopifyError.toLowerCase().includes("shopify store not connected") ||
        shopifyError.toLowerCase().includes("no token")));

  const shopifyIntegrated = !shopifyNotConnected && !!shopify;

  const amazonIntegrated =
    Array.isArray(amazonConnections) && amazonConnections.length > 0;

  const noIntegrations = !amazonIntegrated && !shopifyIntegrated;

  /* ===================== GLOBAL / FX COMBINED (BASE USD DATA) ===================== */
  const amazonUK_USD = useMemo(() => {
    const amazonUK_GBP = toNumberSafe(uk.netSalesGBP);
    return amazonUK_GBP * gbpToUsd;
  }, [uk.netSalesGBP, gbpToUsd]);

  const combinedUSD = useMemo(() => {
    const aUK = amazonUK_USD;
    const shopifyUSD = toNumberSafe(shopifyDeriv?.netSales) * inrToUsd;
    return aUK + shopifyUSD;
  }, [amazonUK_USD, shopifyDeriv?.netSales, inrToUsd]);

  const prevAmazonMtdSalesGBP = toNumberSafe(data?.previous_period?.totals?.net_sales ?? 0);
  const prevAmazonMtdSalesUSD = prevAmazonMtdSalesGBP * gbpToUsd;

  const prevAmazonUKTotalUSD = useMemo(() => {
    const prevTotalGBP = toNumberSafe(data?.previous_month_total_net_sales?.total);
    if (prevTotalGBP > 0) return prevTotalGBP * gbpToUsd;

    // fallback: estimate full last-month total from last-month MTD
    const { todayDay, daysInPrevMonth } = getISTDayInfo();
    if (!todayDay || !daysInPrevMonth) return 0;

    // prevAmazonMtdSalesUSD is already last month MTD (USD)
    return (prevAmazonMtdSalesUSD * daysInPrevMonth) / todayDay;
  }, [data?.previous_month_total_net_sales?.total, gbpToUsd, prevAmazonMtdSalesUSD]);


  const amazonUK_Gross_USD = useMemo(() => {
    const grossGBP = toNumberSafe(totals?.product_sales); // ✅ current gross
    return grossGBP * gbpToUsd;
  }, [totals?.product_sales, gbpToUsd]);



  const combinedGrossUSD = useMemo(() => {
    const shopifyUSD = toNumberSafe(shopifyDeriv?.netSales) * inrToUsd;
    return amazonUK_Gross_USD + shopifyUSD;
  }, [amazonUK_Gross_USD, shopifyDeriv?.netSales, inrToUsd]);

  const prevAmazonGrossUSD = useMemo(() => {
    return toNumberSafe(prev.grossSales) * gbpToUsd; // prev gross in GBP → USD
  }, [prev.grossSales, gbpToUsd]);

  const prevGlobalGrossUSD = useMemo(() => {
    const prevShopifyUSD = toNumberSafe(shopifyPrevDeriv?.netSales) * inrToUsd; // shopify gross not available; using net like you do elsewhere
    return prevAmazonGrossUSD + prevShopifyUSD;
  }, [prevAmazonGrossUSD, shopifyPrevDeriv?.netSales, inrToUsd]);


  const fallbackTargetUSD = useMemo(() => {
    return prevAmazonUKTotalUSD > 0 ? prevAmazonUKTotalUSD : 0;
  }, [prevAmazonUKTotalUSD]);


  const prevShopifyTotalUSD = useMemo(() => {
    const prevINRTotal = toNumberSafe(shopifyPrevDeriv?.netSales);
    return prevINRTotal * inrToUsd;
  }, [shopifyPrevDeriv, inrToUsd]);


  const globalPrevTotalUSD = prevShopifyTotalUSD + prevAmazonUKTotalUSD;


  const chooseLastMonthTotal = (manualUSD: number, computedUSD: number) =>
    USE_MANUAL_LAST_MONTH && manualUSD > 0 ? manualUSD : computedUSD;

  const prorateToDate = (lastMonthTotalUSD: number) => {
    const { todayDay, daysInPrevMonth } = getISTDayInfo();
    return daysInPrevMonth > 0 ? (lastMonthTotalUSD * todayDay) / daysInPrevMonth : 0;
  };



  const regions = useMemo(() => {
    const globalLastMonthTotal = chooseLastMonthTotal(
      MANUAL_LAST_MONTH_USD_GLOBAL,
      globalPrevTotalUSD
    );

    const global: RegionMetrics = {
      mtdUSD: combinedUSD,
      lastMonthToDateUSD: prorateToDate(globalLastMonthTotal),
      lastMonthTotalUSD: globalLastMonthTotal,
      targetUSD: globalLastMonthTotal > 0 ? globalLastMonthTotal : combinedUSD,
    };

    const ukLastMonthTotal = chooseLastMonthTotal(
      MANUAL_LAST_MONTH_USD_UK,
      prevAmazonUKTotalUSD
    );

    const ukRegion: RegionMetrics = {
      mtdUSD: amazonUK_USD,
      lastMonthToDateUSD: prevAmazonMtdSalesUSD, // ✅ actual prev-month MTD sales
      lastMonthTotalUSD: ukLastMonthTotal,
      targetUSD: ukLastMonthTotal > 0 ? ukLastMonthTotal : fallbackTargetUSD,
    };


    const usLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_US, 0);
    const usRegion: RegionMetrics = {
      mtdUSD: 0,
      lastMonthToDateUSD: prorateToDate(usLastMonthTotal),
      lastMonthTotalUSD: usLastMonthTotal,
      targetUSD: usLastMonthTotal,
    };

    const caLastMonthTotal = chooseLastMonthTotal(MANUAL_LAST_MONTH_USD_CA, 0);
    const caRegion: RegionMetrics = {
      mtdUSD: 0,
      lastMonthToDateUSD: prorateToDate(caLastMonthTotal),
      lastMonthTotalUSD: caLastMonthTotal,
      targetUSD: caLastMonthTotal,
    };

    return {
      Global: global,
      UK: ukRegion,
      US: usRegion,
      CA: caRegion,
    } as Record<RegionKey, RegionMetrics>;
  }, [combinedUSD, amazonUK_USD, globalPrevTotalUSD, prevAmazonUKTotalUSD, prevAmazonMtdSalesUSD]);


  const anyLoading = loading || shopifyLoading;

  const amazonTabs = useMemo<RegionKey[]>(() => {
    const tabs: RegionKey[] = [];
    (["UK", "US", "CA"] as RegionKey[]).forEach((key) => {
      const r = regions[key];
      if (!r) return;
      if (r.mtdUSD || r.lastMonthToDateUSD || r.lastMonthTotalUSD || r.targetUSD) tabs.push(key);
    });
    return tabs;
  }, [regions]);

  useEffect(() => {
    if (amazonTabs.length && !amazonTabs.includes(amazonRegion)) setAmazonRegion(amazonTabs[0]);
  }, [amazonTabs, amazonRegion]);

  const graphRegions = useMemo<RegionKey[]>(() => {
    const list: RegionKey[] = ["Global"];
    (["UK", "US", "CA"] as RegionKey[]).forEach((key) => {
      const r = regions[key];
      if (!r) return;
      if (r.mtdUSD || r.lastMonthToDateUSD || r.lastMonthTotalUSD || r.targetUSD) list.push(key);
    });
    return list;
  }, [regions]);

  useEffect(() => {
    if (!graphRegions.includes(graphRegion)) setGraphRegion("Global");
  }, [graphRegions, graphRegion]);

  const onlyAmazon = amazonIntegrated && !shopifyIntegrated;
  const onlyShopify = shopifyIntegrated && !amazonIntegrated;

  /* ===================== P&L ITEMS (DISPLAY CURRENCY OUTPUT) ===================== */
  const plItems = useMemo(() => {
    const ukPl = () => {
      const sales = convertToDisplayCurrency(uk.netSalesGBP ?? 0, "GBP");
      const fees = convertToDisplayCurrency(uk.amazonFeesGBP ?? 0, "GBP");
      const cogs = convertToDisplayCurrency(uk.cogsGBP ?? 0, "GBP");
      const adv = convertToDisplayCurrency(uk.advertisingGBP ?? 0, "GBP");
      const platformFee = convertToDisplayCurrency(uk.platformFeeGBP ?? 0, "GBP");
      const profit = convertToDisplayCurrency(uk.profitGBP ?? 0, "GBP");

      return [
        { label: "Sales", raw: sales, display: formatDisplayAmount(sales) },
        { label: "Amazon Fees", raw: fees, display: formatDisplayAmount(fees) },
        { label: "COGS", raw: cogs, display: formatDisplayAmount(cogs) },
        { label: "Advertisements", raw: adv, display: formatDisplayAmount(adv) },
        { label: "Platform Fees", raw: platformFee, display: formatDisplayAmount(platformFee) },
        { label: "Profit", raw: profit, display: formatDisplayAmount(profit) },
      ];
    };

    if (graphRegionToUse === "Global") {
      if (onlyAmazon) return ukPl();

      if (onlyShopify) {
        const sales = convertToDisplayCurrency(shopifyDeriv?.netSales ?? 0, "INR");
        return [
          { label: "Sales", raw: sales, display: formatDisplayAmount(sales) },
          { label: "Amazon Fees", raw: 0, display: formatDisplayAmount(0) },
          { label: "COGS", raw: 0, display: formatDisplayAmount(0) },
          { label: "Advertisements", raw: 0, display: formatDisplayAmount(0) },
          { label: "Other Charges", raw: 0, display: formatDisplayAmount(0) },
          { label: "Profit", raw: 0, display: formatDisplayAmount(0) },
        ];
      }

      const sales = convertToDisplayCurrency(combinedUSD, "USD");
      return [
        { label: "Sales", raw: sales, display: formatDisplayAmount(sales) },
        { label: "Amazon Fees", raw: 0, display: formatDisplayAmount(0) },
        { label: "COGS", raw: 0, display: formatDisplayAmount(0) },
        { label: "Advertisements", raw: 0, display: formatDisplayAmount(0) },
        { label: "Other Charges", raw: 0, display: formatDisplayAmount(0) },
        { label: "Profit", raw: 0, display: formatDisplayAmount(0) },
      ];
    }

    if (graphRegionToUse === "UK") return ukPl();

    const zero = formatDisplayAmount(0);
    return [
      { label: "Sales", raw: 0, display: zero },
      { label: "Amazon Fees", raw: 0, display: zero },
      { label: "COGS", raw: 0, display: zero },
      { label: "Advertisements", raw: 0, display: zero },
      { label: "Other Charges", raw: 0, display: zero },
      { label: "Profit", raw: 0, display: zero },
    ];
  }, [
    graphRegionToUse,
    onlyAmazon,
    onlyShopify,
    combinedUSD,
    uk.netSalesGBP,
    uk.amazonFeesGBP,
    uk.cogsGBP,
    uk.advertisingGBP,
    uk.platformFeeGBP,
    uk.profitGBP,
    shopifyDeriv?.netSales,
    convertToDisplayCurrency,
    formatDisplayAmount,
  ]);

  // ✅ remove empty categories so bars don't get spaced out
  const chartItems = useMemo(() => {
    return (plItems || []).filter((i) => {
      const v = Number(i?.raw ?? 0);
      // keep only meaningful values
      return Math.abs(v) > 1e-9;
    });
  }, [plItems]);

  const labels = chartItems.map((i) => i.label);
  const values = chartItems.map((i) => Number(i.raw ?? 0));

  const colorMapping: Record<string, string> = {
    Sales: "#2CA9E0",
    "Amazon Fees": "#ff5c5c",
    COGS: "#AB64B5",
    Advertisements: "#F47A00",
    "Other Charges": "#00627D",
    "Platform Fees": "#154B9B",
    Profit: "#87AD12",
  };

  const colors = labels.map((label) => colorMapping[label] || "#2CA9E0");

  const allValuesZero = values.length === 0 || values.every((v) => !v || v === 0);


  /* ===================== EXCEL EXPORT (USES displayCurrency symbol) ===================== */
  const captureChartPng = useCallback(async () => {
    const container = chartRef.current;
    if (!container) return null;

    const canvas = container.querySelector("canvas") as HTMLCanvasElement | null;
    if (canvas) {
      try {
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = canvas.width;
        tmpCanvas.height = canvas.height;
        const ctx = tmpCanvas.getContext("2d");
        if (!ctx) return null;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        ctx.drawImage(canvas, 0, 0);

        return tmpCanvas.toDataURL("image/png");
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const shortMonForGraph = new Date(`${currMonthName} 1, ${currYear}`).toLocaleString("en-US", {
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  const formattedMonthYear = `${shortMonForGraph}'${String(currYear).slice(-2)}`;

  const countryNameForGraph =
    graphRegionToUse === "Global" ? "global" : graphRegionToUse.toLowerCase();

  const handleDownload = useCallback(async () => {
    try {
      const pngDataUrl = await captureChartPng();

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Amazon P&L");

      sheet.addRow([brandName || "Brand"]);
      sheet.addRow([`Amazon P&L - ${formattedMonthYear}`]);
      sheet.addRow([`Country: ${countryNameForGraph.toUpperCase()}`]);
      sheet.addRow([`Currency: ${currencySymbol}`]);
      sheet.addRow([""]);

      sheet.addRow(["Metric", "", `Amount (${currencySymbol})`]);

      const signs: Record<string, string> = {
        Sales: "(+)",
        "Amazon Fees": "(-)",
        COGS: "(-)",
        Advertisements: "(-)",
        "Other Charges": "(-)",
        "Platform Fees": "(-)",
        Profit: "",
      };

      values.forEach((v, idx) => {
        const label = labels[idx];
        const sign = signs[label] || "";
        const num = Number(v || 0);
        sheet.addRow([label, sign, Number(num.toFixed(2))]);
      });

      const totalValue = values.reduce((acc, v) => acc + (Number(v) || 0), 0);
      sheet.addRow(["Total", "", Number(totalValue.toFixed(2))]);

      if (pngDataUrl) {
        const base64 = pngDataUrl.replace(/^data:image\/png;base64,/, "");
        const imageId = workbook.addImage({ base64, extension: "png" });

        sheet.addImage(
          imageId,
          { tl: { col: 0, row: 9 } as any, br: { col: 8, row: 28 } as any, editAs: "oneCell" } as any
        );
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `Amazon-PnL-${formattedMonthYear}.xlsx`);
    } catch (err) {
      console.error("Error generating Excel with chart", err);
    }
  }, [
    brandName,
    formattedMonthYear,
    countryNameForGraph,
    currencySymbol,
    captureChartPng,
    labels,
    values,
  ]);


  /* ===================== ✅ GLOBAL CARD: prev/current + deltas ===================== */

  // Global Units
  const globalCurrUnits = useMemo(() => {
    return toNumberSafe(totals?.quantity ?? 0) + toNumberSafe(shopifyDeriv?.totalOrders ?? 0);
  }, [totals?.quantity, shopifyDeriv?.totalOrders]);

  const globalPrevUnits = useMemo(() => {
    return toNumberSafe(prev.quantity ?? 0) + toNumberSafe(shopifyPrevDeriv?.totalOrders ?? 0);
  }, [prev.quantity, shopifyPrevDeriv?.totalOrders]);

  const globalCurrSalesDisp = useMemo(() => {
    return convertToDisplayCurrency(combinedUSD, "USD");
  }, [combinedUSD, convertToDisplayCurrency]);

  const globalPrevSalesDisp = useMemo(() => {
    return convertToDisplayCurrency(globalPrevTotalUSD, "USD");
  }, [globalPrevTotalUSD, convertToDisplayCurrency]);

  const globalCurrAsp = useMemo(() => {
    return globalCurrUnits > 0 ? globalCurrSalesDisp / globalCurrUnits : 0;
  }, [globalCurrSalesDisp, globalCurrUnits]);

  const globalPrevAsp = useMemo(() => {
    return globalPrevUnits > 0 ? globalPrevSalesDisp / globalPrevUnits : 0;
  }, [globalPrevSalesDisp, globalPrevUnits]);


  // Global Profit (you currently show Amazon profit only in global card)
  const globalCurrProfit = useMemo(() => {
    const pUsd = toNumberSafe(uk.profitGBP ?? 0) * gbpToUsd;
    return convertToDisplayCurrency(pUsd, "USD");
  }, [uk.profitGBP, gbpToUsd, convertToDisplayCurrency]);

  const globalPrevProfit = useMemo(() => {
    // previous month MTD Amazon profit in GBP from your API
    const prevProfitGbp = toNumberSafe(prev.profit ?? 0);
    const pUsd = prevProfitGbp * gbpToUsd;
    return convertToDisplayCurrency(pUsd, "USD");
  }, [prev.profit, gbpToUsd, convertToDisplayCurrency]);

  const globalDeltas = useMemo(() => {
    return {
      units: safeDeltaPct(globalCurrUnits, globalPrevUnits),
      sales: safeDeltaPct(globalCurrSalesDisp, globalPrevSalesDisp),
      asp: safeDeltaPct(globalCurrAsp, globalPrevAsp),
      profit: safeDeltaPct(globalCurrProfit, globalPrevProfit),
      profitPct: null as number | null,
    };
  }, [
    globalCurrUnits,
    globalPrevUnits,
    globalCurrSalesDisp,
    globalPrevSalesDisp,
    globalCurrAsp,
    globalPrevAsp,
    globalCurrProfit,
    globalPrevProfit,
  ]);

  const globalCurrGrossDisp = useMemo(() => {
    return convertToDisplayCurrency(combinedGrossUSD, "USD");
  }, [combinedGrossUSD, convertToDisplayCurrency]);

  const globalPrevGrossDisp = useMemo(() => {
    const prevAmazonGrossUSD = toNumberSafe(prev.grossSales) * gbpToUsd; // prev gross comes in GBP
    const prevShopifyUSD = toNumberSafe(shopifyPrevDeriv?.netSales) * inrToUsd;
    return convertToDisplayCurrency(prevAmazonGrossUSD + prevShopifyUSD, "USD");
  }, [prev.grossSales, gbpToUsd, shopifyPrevDeriv?.netSales, inrToUsd, convertToDisplayCurrency]);



  /* ===================== RENDER FLAGS ===================== */
  const hasAnyGraphData = amazonIntegrated || shopifyIntegrated;
  const hasGlobalCard = !noIntegrations;
  const hasAmazonCard = amazonIntegrated;
  const hasShopifyCard = !shopifyNotConnected;

  const leftColumnHeightClass = !hasShopifyCard ? "lg:min-h-[520px]" : "";

  const prevShort = getShort(biPeriods?.previous?.label);
  const currShort = getShort(biPeriods?.current_mtd?.label);

  const rangeCurrency = currencyForCountry(countryName);

  const amazonDataCurrency: CurrencyCode = useMemo(() => {
    // your fetchAmazon uses UK when platform is "global"
    if (platform === "amazon-us") return "USD";
    if (platform === "amazon-ca") return "CAD";
    return "GBP"; // amazon-uk OR global default
  }, [platform]);

  return (
    <div className="relative overflow-x-hidden">
      {(loading || shopifyLoading) && !data && !shopify && (
        <>
          <div className="fixed inset-0 z-40 bg-white/70" />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <Loader
              src="/infinity-unscreen.gif"
              label="Loading sales dashboard…"
              size={120}
              roundedClass="rounded-xl"
              backgroundClass="bg-transparent"
              respectReducedMotion
            />
          </div>
        </>
      )}

      <div className="mx-auto w-full max-w-full px-4 lg:px-6">

        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col leading-tight">
            <p className="text-lg text-charcoal-500 mb-1">
              Let&apos;s get started,{" "}
              <span className="text-green-500">{brandName}!</span>
            </p>

            <div className="flex items-center gap-2">
              <PageBreadcrumb
                pageTitle="Sales Dashboard -"
                variant="page"
                textSize="2xl"
                className="text-2xl font-semibold"
              />

              <span className="text-lg sm:text-2xl md:text-2xl font-semibold text-[#5EA68E]">
                {formattedMonthYear}
              </span>
            </div>
          </div>

          <button
            onClick={refreshAll}
            disabled={loading || shopifyLoading || biLoading}
            className={`w-full rounded-md border px-3 py-1.5 text-sm shadow-sm active:scale-[.99] sm:w-auto ${loading || shopifyLoading || biLoading
              ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
              : "border-gray-300 bg-white hover:bg-gray-50"
              }`}
          >
            {loading || shopifyLoading || biLoading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className={`grid grid-cols-12 gap-6 items-stretch`}>

          {/* LEFT COLUMN */}
          <div className={`col-span-12 lg:col-span-8 order-2 lg:order-1 flex flex-col gap-6 ${leftColumnHeightClass}`}>

            {/* GLOBAL CARD */}
            {!isCountryMode && hasGlobalCard && (
              <div className="flex lg:flex-1">
                <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <PageBreadcrumb pageTitle="Global" variant="page" align="left" />
                    </div>
                    <p className="mt-1 text-sm text-charcoal-500">
                      Real-time data from Amazon &amp; Shopify
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-6 gap-3 auto-rows-fr">

                    <AmazonStatCard
                      label="Units"
                      current={globalCurrUnits}
                      previous={globalPrevUnits}
                      deltaPct={globalDeltas.units}
                      loading={loading || shopifyLoading}
                      formatter={fmtInt}
                      bottomLabel={prevLabel}
                      className="border-[#F47A00] bg-[#F47A0026]"
                    />

                    <AmazonStatCard
                      label="Sales"
                      current={convertToDisplayCurrency(combinedUSD, "USD")}
                      previous={convertToDisplayCurrency(globalPrevTotalUSD, "USD")}
                      deltaPct={safeDeltaPct(
                        convertToDisplayCurrency(combinedUSD, "USD"),
                        convertToDisplayCurrency(globalPrevTotalUSD, "USD")
                      )}
                      loading={loading || shopifyLoading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#87AD12] bg-[#87AD1226]"
                    />

                    <AmazonStatCard
                      label="Gross Sales"
                      current={globalCurrGrossDisp}
                      previous={globalPrevGrossDisp}
                      deltaPct={safeDeltaPct(combinedGrossUSD, prevGlobalGrossUSD)}
                      loading={loading || shopifyLoading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#5EA68E] bg-[#5EA68E26]"
                    />

                    <AmazonStatCard
                      label="ASP"
                      current={globalCurrAsp}
                      previous={globalPrevAsp}
                      deltaPct={safeDeltaPct(globalCurrAsp, globalPrevAsp)}
                      loading={loading || shopifyLoading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#2CA9E0] bg-[#2CA9E026]"
                    />


                    <AmazonStatCard
                      label="Profit"
                      current={globalCurrProfit}
                      previous={globalPrevProfit}
                      deltaPct={globalDeltas.profit}
                      loading={loading || shopifyLoading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#AB64B5] bg-[#AB64B526]"
                    />

                    <AmazonStatCard
                      label="Profit %"
                      current={curr.profitPct}          // ✅ Amazon margin
                      previous={prev.profitPct}         // ✅ prev Amazon margin
                      deltaPct={deltas.profitMarginPctPts} // ✅ pp
                      loading={loading || shopifyLoading}
                      formatter={fmtPct}
                      bottomLabel={prevLabel}
                      className="border-[#00627B] bg-[#00627B26]"
                    />

                  </div>
                </div>
              </div>
            )}

            {/* AMAZON SECTION */}
            {hasAmazonCard && (
              <div className="flex flex-col lg:flex-1 gap-4">

                {/* Amazon KPI Box */}
                <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-row gap-3 items-start md:items-start md:justify-between">
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <PageBreadcrumb pageTitle="Amazon" variant="page" align="left" />
                        {showLiveBI && (
                          <span className="text-xs text-gray-400">
                            {prevShort && currShort ? `(${currShort} vs ${prevShort})` : ""}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-charcoal-500">
                        Real-time data from Amazon
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {showLiveBI && (
                        <RangePicker
                          selectedStartDay={selectedStartDay}
                          selectedEndDay={selectedEndDay}
                          onSubmit={(s, e) => {
                            setSelectedStartDay(s);
                            setSelectedEndDay(e);
                          }}
                          onClear={() => {
                            setSelectedStartDay(null);
                            setSelectedEndDay(null);
                          }}
                          onCloseReset={() => {
                            setSelectedStartDay(null);
                            setSelectedEndDay(null);
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-6 gap-3 auto-rows-fr">

                    <AmazonStatCard
                      label="Units"
                      current={showLiveBI && rangeActive ? rangeKpis.units : (totals?.quantity ?? 0)}
                      previous={prev.quantity}
                      deltaPct={deltas.quantityPct}
                      loading={loading || biLoading}
                      formatter={fmtInt}
                      bottomLabel={prevLabel}
                      className="border-[#F47A00] bg-[#F47A0026]"
                    />


                    <AmazonStatCard
                      label="Sales"
                      current={
                        showLiveBI && rangeActive
                          ? convertToDisplayCurrency(rangeKpis.sales, rangeCurrency)
                          : convertToDisplayCurrency(uk.netSalesGBP ?? 0, "GBP")
                      }
                      previous={convertToDisplayCurrency(prev.netSales, "GBP")}
                      deltaPct={deltas.netSalesPct}
                      loading={loading || biLoading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#87AD12] bg-[#87AD1226]"
                    />

                    <AmazonStatCard
                      label="Gross Sales"
                      current={convertToDisplayCurrency(uk.grossSalesGBP ?? 0, "GBP")}
                      previous={convertToDisplayCurrency(prev.grossSales ?? 0, "GBP")}
                      deltaPct={safeDeltaPct(uk.grossSalesGBP ?? 0, prev.grossSales ?? 0)}
                      loading={loading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#5EA68E] bg-[#5EA68E26]"
                    />




                    <AmazonStatCard
                      label="ASP"
                      current={
                        showLiveBI && rangeActive
                          ? convertToDisplayCurrency(rangeKpis.asp, rangeCurrency)
                          : convertToDisplayCurrency(uk.aspGBP ?? 0, "GBP")
                      }
                      previous={convertToDisplayCurrency(prev.asp, "GBP")}
                      deltaPct={deltas.aspPct}
                      loading={loading || biLoading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#2CA9E0] bg-[#2CA9E026]"
                    />

                    <AmazonStatCard
                      label="Profit"
                      current={convertToDisplayCurrency(uk.profitGBP ?? 0, "GBP")}
                      previous={convertToDisplayCurrency(prev.profit, "GBP")}
                      deltaPct={deltas.profitPct}
                      loading={loading}
                      formatter={formatDisplayAmount}
                      bottomLabel={prevLabel}
                      className="border-[#AB64B5] bg-[#AB64B526]"
                    />


                    <AmazonStatCard
                      label="Profit %"
                      current={curr.profitPct}
                      previous={prev.profitPct}
                      deltaPct={deltas.profitMarginPctPts}
                      loading={loading}
                      formatter={fmtPct}
                      bottomLabel={prevLabel}
                      className="border-[#00627B] bg-[#00627B26]"
                    />

                  </div>
                </div>

                {/* Live BI graph */}
                {showLiveBI && (
                  <div className="w-full rounded-2xl border bg-white p-4 sm:p-5 shadow-sm overflow-x-hidden">
                    <div className="w-full max-w-full min-w-0">
                      <LiveBiLineGraph
                        dailySeries={biDailySeries}
                        periods={biPeriods}
                        loading={biLoading}
                        error={biError}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shopify Block */}
            {!isCountryMode && hasShopifyCard && (
              <div className="flex lg:flex-1">
                <div className="w-full rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <PageBreadcrumb
                          pageTitle="Shopify"
                          variant="page"
                          align="left"
                          textSize="2xl"
                        />
                      </div>
                      <p className="mt-1 text-sm text-charcoal-500">
                        Real-time data from Shopify
                      </p>
                    </div>
                  </div>

                  {shopifyLoading ? (
                    <div className="mt-3 text-sm text-gray-500">Loading Shopify…</div>
                  ) : shopify ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <AmazonStatCard
                        label="Sales"
                        current={convertToDisplayCurrency(shopifyDeriv?.netSales ?? 0, "INR")}
                        previous={convertToDisplayCurrency(shopifyPrevDeriv?.netSales ?? 0, "INR")}
                        loading={shopifyLoading}
                        formatter={formatDisplayAmount}
                        bottomLabel={prevLabel}
                        className="border-[#87AD12] bg-[#87AD1226]"
                      />
                      <AmazonStatCard
                        label="Units"
                        current={shopifyDeriv?.totalOrders ?? 0}
                        previous={shopifyPrevDeriv?.totalOrders ?? 0}
                        loading={shopifyLoading}
                        formatter={fmtInt}
                        bottomLabel={prevLabel}
                        className="border-[#F47A00] bg-[#F47A0026]"
                      />
                      <AmazonStatCard
                        label="ASP"
                        current={(() => {
                          const units = shopifyDeriv?.totalOrders ?? 0;
                          if (!units) return 0;
                          const net = convertToDisplayCurrency(shopifyDeriv?.netSales ?? 0, "INR");
                          return net / units;
                        })()}
                        previous={0}
                        loading={shopifyLoading}
                        formatter={formatDisplayAmount}
                        bottomLabel={prevLabel}
                        className="border-[#2CA9E0] bg-[#2CA9E026]"
                      />
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-gray-500">
                      No Shopify data for the current month.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN – Sales Target */}
          <aside className="col-span-12 lg:col-span-4 order-1 lg:order-2 flex flex-col h-full">
            {/* This wrapper must be allowed to stretch */}
            <div className="w-full h-full flex">
              {/* Sticky can still work, but it must also be h-full and NOT self-start */}
              <div className="w-full h-full lg:sticky lg:top-6 flex">
                {/* SalesTargetCard already has h-full, so give its parent h-full too */}
                <div className="w-full h-full">
                  <SalesTargetCard
                    regions={regions}
                    value={targetRegion}
                    onChange={setTargetRegion}
                    hideTabs={isCountryMode}
                    homeCurrency={displayCurrency}
                    convertToHomeCurrency={(v, from) => convertToDisplayCurrency(v, from)}
                    formatHomeK={formatDisplayK}
                  />

                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Months for BI */}
        <div className="w-full overflow-x-hidden">
          {showLiveBI && (
            <div className="w-full max-w-full min-w-0">
              <MonthsforBI
                countryName={countryName}
                ranged="MTD"
                month={currMonthName.toLowerCase()}
                year={String(currYear)}
                initialData={liveBiPayload}
              />

            </div>
          )}
        </div>

        {/* Lower P&L Graph and Inventory */}
        {hasAnyGraphData && (
          <>
            <div className="mt-6 rounded-2xl border bg-[#D9D9D933] p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <PageBreadcrumb
                    pageTitle="Amazon"
                    align="left"
                    textSize="2xl"
                    variant="page"
                  />
                  <p className="text-charcoal-500">
                    Real-time data{" "}
                    {graphRegionToUse === "Global" ? "Global" : graphRegionToUse}
                  </p>
                </div>

                {!isCountryMode && (
                  <div className="flex items-center gap-3">
                    <SegmentedToggle<RegionKey>
                      value={graphRegion}
                      options={graphRegions.map((r) => ({ value: r }))}
                      onChange={setGraphRegion}
                    />
                    <DownloadIconButton onClick={handleDownload} />
                  </div>
                )}
              </div>

              <div ref={chartRef} className="overflow-x-hidden">
                <div className="w-full max-w-full min-w-0">

                  <DashboardBargraphCard
                    countryName={countryNameForGraph}
                    formattedMonthYear={formattedMonthYear}
                    currencySymbol={currencySymbol}
                    labels={labels}
                    values={values}
                    colors={colors}
                    loading={loading}
                    allValuesZero={allValuesZero}
                  />
                </div>
              </div>
            </div>

            {amazonIntegrated && graphRegionToUse !== "Global" && (
              <CurrentInventorySection region={graphRegionToUse} />
            )}

          </>
        )}
      </div>
    </div>
  );


}
