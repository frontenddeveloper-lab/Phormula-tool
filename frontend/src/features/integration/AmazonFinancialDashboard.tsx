"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaCheckCircle as CheckCircle2,
  FaExclamationCircle as AlertCircle,
} from "react-icons/fa";
import { ImInfinite } from "react-icons/im";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

const getAuthToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

/** ======= HARD OVERRIDE FOR TESTING ======= **/
const FORCE = {
  enabled: true,
  country: "uk",
  region: "eu-west-1",
  marketplaceId: "A1F83G8C2ARO7P",

  // // US
  // enabled: true,
  // country: "us",
  // region: "us-east-1",
  // marketplaceId: "ATVPDKIKX0DER",
};
/** ======================================== **/

const fullMonthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const monthSlugOrder = fullMonthNames.map((m) => m.toLowerCase());

const two = (n: number | string) => String(n).padStart(2, "0");

/** Canonical mappings (kept only for inferring default country/marketplace) */
const marketplaceForCountry = (c: string) =>
  c === "uk"
    ? "A1F83G8C2ARO7P"
    : c === "us"
      ? "ATVPDKIKX0DER"
      : c === "canada"
        ? "A2EUQ1WTGCTBG2"
        : "";

/**
 * Only update localStorage.latestFetchedPeriod if the new (year, month)
 * is later than or equal to what is already stored.
 */
function updateLatestFetchedPeriod(monthSlug: string, yearStr: string) {
  if (typeof window === "undefined") return;

  const key = "latestFetchedPeriod";

  const newMonthIdx = monthSlugOrder.indexOf(monthSlug.toLowerCase());
  if (newMonthIdx === -1) return;

  const newYear = parseInt(yearStr, 10);
  if (Number.isNaN(newYear)) return;

  const newValue = newYear * 12 + newMonthIdx;

  const existingRaw = window.localStorage.getItem(key);
  if (!existingRaw) {
    window.localStorage.setItem(
      key,
      JSON.stringify({ month: monthSlug, year: yearStr })
    );
    return;
  }

  try {
    const existing = JSON.parse(existingRaw);
    const existingMonthIdx = monthSlugOrder.indexOf(
      String(existing.month || "").toLowerCase()
    );
    const existingYear = parseInt(existing.year, 10);

    if (
      Number.isNaN(existingYear) ||
      existingMonthIdx === -1 ||
      newValue >= existingYear * 12 + existingMonthIdx
    ) {
      window.localStorage.setItem(
        key,
        JSON.stringify({ month: monthSlug, year: yearStr })
      );
    }
  } catch {
    window.localStorage.setItem(
      key,
      JSON.stringify({ month: monthSlug, year: yearStr })
    );
  }
}

/** ---------------- JSON API helper ---------------- */
async function apiJson(path: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const text = await res.text().catch(() => "");
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      data?.error ||
      data?.message ||
      text ||
      `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

/** ---------------- localStorage run-once guards ---------------- */
function lsKeyFees(country: string, year: number, month: number) {
  return `feesSynced:${country}:${year}:${month}`;
}
function lsKeyFeeUpload(country: string) {
  return `feeUploadReady:${country}`;
}
function wasDone(key: string) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key) === "1";
}
function markDone(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, "1");
}

/**
 * Ensure we hit:
 * 1) /amazon_api/fees/sync_and_upload   (one-time per country)
 * 2) /fetch_fees                       (one-time per country+year+month)
 */
async function ensureFeesPrimedOnce(params: {
  country: string;
  regionUsed?: string;
  marketplaceId: string;
  year: number;
  month: number; // 1-12
}) {
  const { country, regionUsed, marketplaceId, year, month } = params;

  // 1) fee upload table (usually one-time per country)
  const uploadKey = lsKeyFeeUpload(country);
  if (!wasDone(uploadKey)) {
    await apiJson(`/amazon_api/fees/sync_and_upload`, {
      method: "POST",
      body: JSON.stringify({
        country,
        marketplace_id: marketplaceId,
        region: regionUsed,
        transit_time: 0,
        stock_unit: 0,
      }),
    });

    markDone(uploadKey);
  }

  // 2) fetch_fees (month-specific)
  const feesKey = lsKeyFees(country, year, month);
  if (!wasDone(feesKey)) {
    const monthParam = `${year}-${two(month)}`; // e.g. 2025-01

    await apiJson(`/fetch_fees`, {
      method: "POST",
      body: JSON.stringify({
        region: regionUsed,
        marketplace_id: marketplaceId,
        month: monthParam,
        year: String(year),
        country,
      }),
    });

    markDone(feesKey);
  }
}

/** ---------------- Monthly transactions Excel fetch (no download) ---------------- */
async function fetchMonthlyTransactionsExcel(params: {
  year: number;
  month: number;
  marketplace_id: string;
  country: string;
  run_upload_pipeline: boolean;
  store_in_db: boolean;
}) {
  const token = getAuthToken();
  const qs = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
    marketplace_id: params.marketplace_id,
    run_upload_pipeline: String(params.run_upload_pipeline),
    country: params.country,
    format: "excel",
    store_in_db: String(params.store_in_db),
  });

  const url = `${API_BASE}/amazon_api/finances/monthly_transactions?${qs.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const ct = res.headers.get("content-type") || "";
    const raw = await res.text().catch(() => "");
    let msg = raw;

    if (ct.includes("application/json")) {
      try {
        const j = JSON.parse(raw);
        msg = j?.error || j?.message || JSON.stringify(j, null, 2);
      } catch {}
    }

    throw new Error(`API ${res.status} ${res.statusText}\nURL: ${url}\n\n${msg}`);
  }

  // ✅ IMPORTANT: consume body so request completes, but do NOT download
  await res.arrayBuffer();

  return { ok: true, url };
}

/** Build a month range ending at previous month (not current ongoing month) */
function buildMonthRange(count: number) {
  const now = new Date();

  // Anchor = previous month
  const anchor = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
  );

  const out: { y: number; mIdx: number; mNum: number }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - i, 1)
    );
    const y = d.getUTCFullYear();
    const mIdx = d.getUTCMonth();
    out.push({ y, mIdx, mNum: mIdx + 1 });
  }

  return out.reverse(); // oldest -> newest
}

/** Build range from Jan 2024 up to previous month (current month - 1), oldest -> newest */
function buildLifetimeRange() {
  const startY = 2024;
  const startMIdx = 0; // Jan

  const now = new Date();
  const anchor = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
  ); // prev month
  const endY = anchor.getUTCFullYear();
  const endMIdx = anchor.getUTCMonth();

  const startValue = startY * 12 + startMIdx;
  const endValue = endY * 12 + endMIdx;

  if (endValue < startValue) return [];

  const out: { y: number; mIdx: number; mNum: number }[] = [];
  for (let v = startValue; v <= endValue; v++) {
    const y = Math.floor(v / 12);
    const mIdx = v % 12;
    out.push({ y, mIdx, mNum: mIdx + 1 });
  }

  return out;
}

type Props = {
  region?: string; // not sent to monthly_transactions API anymore, but used for fee priming
  country?: string;
  onClose?: () => void;
};

const AmazonFinancialDashboard: React.FC<Props> = ({
  region,
  country,
  onClose,
}) => {
  const router = useRouter();

  // infer country
  const countryNormalized = (country || "").toLowerCase();
  let countryUsed = countryNormalized || "uk";
  let marketplaceIdUsed = marketplaceForCountry(countryUsed) || "A1F83G8C2ARO7P";

  /** ---- HARD OVERRIDE (testing) ---- */
  const regionUsed = FORCE.enabled ? FORCE.region : region;
  if (FORCE.enabled) {
    countryUsed = FORCE.country;
    marketplaceIdUsed = FORCE.marketplaceId;
  }

  // current month/year
  const today = new Date();
  const currentMonthIdx0 = today.getMonth(); // 0–11
  const currentMonth01 = two(currentMonthIdx0 + 1);
  const currentYear = today.getFullYear();

  // default selection = previous month (not current ongoing month)
  let defaultYear = currentYear;
  let defaultMonthIdx0 = currentMonthIdx0 - 1;
  if (defaultMonthIdx0 < 0) {
    defaultMonthIdx0 = 11;
    defaultYear -= 1;
  }

  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [selMonth, setSelMonth] = useState(two(defaultMonthIdx0 + 1)); // "01".."12"
  const [selYear, setSelYear] = useState(String(defaultYear));

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{
    active: boolean;
    label: string;
    detail?: string;
    current: number;
    total: number;
    ok?: number;
    fail?: number;
  }>({
    active: false,
    label: "",
    detail: "",
    current: 0,
    total: 0,
    ok: 0,
    fail: 0,
  });

  const startProgress = (total: number, label: string, detail = "") => {
    setProgress({
      active: true,
      label,
      detail,
      current: 0,
      total,
      ok: 0,
      fail: 0,
    });
  };

  const setProgressStep = (current: number, label: string, detail = "") => {
    setProgress((p) => ({
      ...p,
      active: true,
      current,
      label,
      detail,
    }));
  };

  const bumpOk = () =>
    setProgress((p) => ({ ...p, ok: (p.ok || 0) + 1 }));

  const bumpFail = () =>
    setProgress((p) => ({ ...p, fail: (p.fail || 0) + 1 }));

  const stopProgress = () =>
    setProgress((p) => ({ ...p, active: false }));
  const [selectedPeriod, setSelectedPeriod] = useState<
    number | "lifetime" | null
  >(12);

    const wrap = async (fn: () => Promise<void>) => {
    try {
      setBusy(true);
      setError("");
      setMessage("");
      // keep progress as-is (startProgress fn ke andar hoga)
      await fn();
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setBusy(false);
    }
  };


    const handleFetchByMonth = () =>
    wrap(async () => {
      const y = parseInt(selYear, 10);
      const mNum = parseInt(selMonth, 10);

      // total steps: 2 (fees priming + monthly fetch)
      startProgress(2, "Starting fetch…", `Month: ${y}-${two(mNum)}`);

      setProgressStep(1, "Priming fees…");

// isolate backend call from React state cycle
await Promise.resolve().then(() =>
  ensureFeesPrimedOnce({
    country: countryUsed,
    regionUsed,
    marketplaceId: marketplaceIdUsed,
    year: y,
    month: mNum,
  })
);


      setProgressStep(2, "Fetching monthly transactions…", `Month: ${y}-${two(mNum)}`);
      await fetchMonthlyTransactionsExcel({
        year: y,
        month: mNum,
        marketplace_id: marketplaceIdUsed,
        country: countryUsed,
        run_upload_pipeline: true,
        store_in_db: true,
      });

      const monthSlug = fullMonthNames[mNum - 1].toLowerCase();
      updateLatestFetchedPeriod(monthSlug, String(y));

      setMessage(
        `Fetched ${countryUsed}: ${y}-${two(mNum)} (fees primed, no download)`
      );

      if (onClose) onClose();
      router.push(`/country/MTD/${countryUsed}/${monthSlug}/${y}`);
    });


  const handleFetchRange = () =>
    wrap(async () => {
      const isLifetime = selectedPeriod === "lifetime";

      const months = isLifetime
        ? buildLifetimeRange()
        : buildMonthRange((selectedPeriod as number) || 0); // ends at current-1 month

      if (!months.length) {
        setMessage("No months available to fetch.");
        return;
      }

      if (!isLifetime && ![3, 6, 12].includes(selectedPeriod as number)) {
        setMessage("Please select 3, 6, 12, or Lifetime.");
        return;
      }

            


      const first = months[0];

      setProgressStep(1, "Priming fees (once)…", `First month: ${first.y}-${two(first.mNum)}`);
      await ensureFeesPrimedOnce({
        country: countryUsed,
        regionUsed,
        marketplaceId: marketplaceIdUsed,
        year: first.y,
        month: first.mNum,
      });

      startProgress(1 + months.length, "Preparing range fetch…", 
        isLifetime ? "Lifetime" : `${selectedPeriod} months`
      );

      let ok = 0;
      let fail = 0;

      let step = 1; // already used by priming
      for (const { y, mNum } of months) {
        step += 1;
        setProgressStep(
          step,
          "Fetching monthly transactions…",
          `Done: ${ok + fail}/${months.length} | Current: ${y}-${two(mNum)} | OK: ${ok} | Failed: ${fail}`
        );

        try {
          await fetchMonthlyTransactionsExcel({
            year: y,
            month: mNum,
            marketplace_id: marketplaceIdUsed,
            country: countryUsed,
            run_upload_pipeline: true,
            store_in_db: true,
          });
          ok++;
          bumpOk();
        } catch (e) {
          console.error("monthly_transactions excel failed for", y, mNum, e);
          fail++;
          bumpFail();
        }
      }

      const last = months[months.length - 1];
      const latestMonthSlug = fullMonthNames[last.mIdx].toLowerCase();
      updateLatestFetchedPeriod(latestMonthSlug, String(last.y));

      setMessage(
        `Fetch complete for ${countryUsed}: ${
          isLifetime ? "lifetime" : `requested ${selectedPeriod}`
        }, ok ${ok}, failed ${fail} (fees primed once, no downloads)`
      );

      if (onClose) onClose();
      router.push(`/country/MTD/${countryUsed}/${latestMonthSlug}/${last.y}`);
    });

  return (
    <div className="w-full">
      <div className="rounded-xl bg-white">
        {/* Header */}
        <div className="items-center mb-2 p-4">
          <div className="text-center">
            <PageBreadcrumb
              pageTitle="Select Data Fetch Period"
              textSize="2xl"
              variant="table"
            />
            <p className="text-charcoal-500 text-sm mt-1">
              Link your Amazon Seller Central to sync your sales data
            </p>
          </div>
        </div>

        <p className="text-charcoal-500 text-center font-bold text-md mt-1">
          Data Fetch Period
        </p>

        {/* Period Buttons */}
        <div
          className="
            mt-2
            grid grid-cols-5 gap-2
            sm:grid-cols-5 sm:gap-3
            max-w-xl mx-auto
          "
        >
          {[1, 3, 6, 12, "lifetime"].map((m) => {
            const isActive = selectedPeriod === m;

            return (
              <div key={String(m)} className="relative w-full">
                {m === 12 && (
                  <div
                    className={[
                      "absolute -top-2 left-1/2 -translate-x-1/2",
                      "text-[10px] px-2 py-0.5 rounded-full z-10",
                      selectedPeriod !== 12
                        ? "bg-green-500 text-yellow-200"
                        : "bg-gray-200 text-gray-700",
                    ].join(" ")}
                  >
                    Recommended
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedPeriod(m as any)}
                  className={[
                    `
                      w-full
                      rounded-lg border
                      p-2 sm:p-3
                      text-center transition
                    `,
                    isActive
                      ? "border-green-500 bg-green-500 text-yellow-200"
                      : "border-slate-200 bg-slate-50 hover:bg-white text-charcoal-500",
                  ].join(" ")}
                >
                  {/* value row: fixed visual slot so ∞ doesn't look narrower */}
                  <div className="w-full text-base sm:text-lg font-semibold flex items-center justify-center tabular-nums">
                    <span className="inline-flex w-[1.6em] justify-center">
                      {m === "lifetime" ? (
                        <ImInfinite className="text-xl sm:text-2xl" />
                      ) : (
                        m
                      )}
                    </span>
                  </div>

                  <div className="text-[10px] sm:text-xs uppercase tracking-wide mt-1">
                    {m === "lifetime"
                      ? "Lifetime"
                      : m === 1
                        ? "Month"
                        : "Months"}
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Note Section */}
        <div
          className="
            mt-4
            max-w-xl mx-auto
            rounded-lg
            bg-[#D9D9D9E5]
            p-2 text-[12px]
            sm:p-3 sm:text-sm
            border border-[#D9D9D9]
          "
          style={{ borderLeft: "6px solid #5EA68E" }}
        >
          Note:&nbsp; A longer time range gives better trend and forecast.
          However, it may take longer to complete the initial data fetch.
        </div>

                {/* Progress UI */}
        {busy && progress.active && progress.total > 0 && (
          <div className="mt-4 max-w-xl mx-auto">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-700">
                  {progress.label}
                </div>
                <div className="text-xs text-slate-500 tabular-nums">
                  {Math.min(100, Math.round((progress.current / progress.total) * 100))}%
                </div>
              </div>

              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-[#5EA68E] transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((progress.current / progress.total) * 100)
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div>
                  Step {progress.current}/{progress.total}
                </div>

                <div className="flex items-center gap-3">
                  <span>OK: {progress.ok || 0}</span>
                  <span>Failed: {progress.fail || 0}</span>
                </div>
              </div>

              {!!progress.detail && (
                <div className="mt-2 text-xs text-slate-500">
                  {progress.detail}
                </div>
              )}
            </div>
          </div>
        )}


        {/* 1 month controls */}
        {selectedPeriod === 1 && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3 justify-center">
              {/* Month */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Month</label>
                <select
                  value={selMonth}
                  onChange={(e) => setSelMonth(e.target.value)}
                  className="rounded-lg border-2 border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-[#5EA68E] focus:ring-4 focus:ring-[#5EA68E]/20"
                >
                  {[
                    ["01", "Jan"],
                    ["02", "Feb"],
                    ["03", "Mar"],
                    ["04", "Apr"],
                    ["05", "May"],
                    ["06", "Jun"],
                    ["07", "Jul"],
                    ["08", "Aug"],
                    ["09", "Sep"],
                    ["10", "Oct"],
                    ["11", "Nov"],
                    ["12", "Dec"],
                  ].map(([val, label]) => {
                    const isCurrentMonthAndYear =
                      val === currentMonth01 && selYear === String(currentYear);
                    const shouldDisable = isCurrentMonthAndYear && selMonth !== val;

                    return (
                      <option key={val} value={val} disabled={shouldDisable}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Year */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Year</label>
                <select
                  value={selYear}
                  onChange={(e) => {
                    const newYear = e.target.value;
                    setSelYear(newYear);

                    if (
                      newYear === String(currentYear) &&
                      selMonth === currentMonth01
                    ) {
                      const prevIdx = (currentMonthIdx0 - 1 + 12) % 12;
                      setSelMonth(two(prevIdx + 1));
                    }
                  }}
                  className="rounded-lg border-2 border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-[#5EA68E] focus:ring-4 focus:ring-[#5EA68E]/20"
                >
                  {Array.from(
                    { length: new Date().getFullYear() - 2024 + 1 },
                    (_, i) => 2024 + i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full flex justify-center gap-3 mt-4">
              <Button onClick={onClose} variant="outline" size="sm">
                Cancel
              </Button>
              <Button
                onClick={handleFetchByMonth}
                variant="primary"
                size="sm"
                disabled={busy}
              >
                {busy ? "Fetching..." : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* >1 month controls (includes Lifetime) */}
        {selectedPeriod &&
          (selectedPeriod === "lifetime" || selectedPeriod > 1) && (
            <div className="w-full flex justify-center gap-3 mt-4">
              <Button onClick={onClose} variant="outline" size="sm">
                Cancel
              </Button>

              <Button
                onClick={handleFetchRange}
                variant="primary"
                size="sm"
                disabled={busy}
              >
                {busy ? "Fetching..." : `Continue`}
              </Button>
            </div>
          )}
      </div>

      {/* Messages */}
      <div className="mt-4 space-y-4">
        {message && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-sm">
            <CheckCircle2 />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
            <AlertCircle />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AmazonFinancialDashboard;
