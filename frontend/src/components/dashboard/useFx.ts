// lib/dashboard/useFx.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import { getISTYearMonth } from "@/lib/dashboard/date";
import { fmtGBP, fmtUSD, fmtNum, toNumberSafe } from "@/lib/dashboard/format";

export type HomeCurrency = "USD" | "GBP";

/* ===================== ENV & ENDPOINTS ===================== */

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

// Flask route path for FX
const FX_ENDPOINT = `${baseURL}/currency-rate`;

/** FX defaults (used until backend answers) */
const GBP_TO_USD_ENV = Number(
  process.env.NEXT_PUBLIC_GBP_TO_USD || ""
);
const INR_TO_USD_ENV = Number(
  process.env.NEXT_PUBLIC_INR_TO_USD || "0.01128"
);

type FromCurrency = "USD" | "GBP" | "INR";

export function useFx() {
  const [homeCurrency, setHomeCurrency] = useState<HomeCurrency>("USD");

  // FX rates: GBP→USD (Amazon UK) and INR→USD (Shopify India)
  const [gbpToUsd, setGbpToUsd] = useState(GBP_TO_USD_ENV);
  const [inrToUsd, setInrToUsd] = useState(INR_TO_USD_ENV);
  const [fxLoading, setFxLoading] = useState(false);

  /* ----- converters ----- */

  const convertToHomeCurrency = useCallback(
    (value: number | null | undefined, from: FromCurrency) => {
      const n = toNumberSafe(value ?? 0);
      if (!n) return 0;

      // Home currency = USD
      if (homeCurrency === "USD") {
        switch (from) {
          case "USD":
            return n;
          case "GBP":
            return n * gbpToUsd; // GBP → USD
          case "INR":
            return n * inrToUsd; // INR → USD
          default:
            return n;
        }
      }

      // Home currency = GBP
      if (homeCurrency === "GBP") {
        switch (from) {
          case "GBP":
            return n;
          case "USD":
            return gbpToUsd ? n / gbpToUsd : n; // USD → GBP
          case "INR": {
            const usd = n * inrToUsd;            // INR → USD
            return gbpToUsd ? usd / gbpToUsd : usd; // USD → GBP
          }
          default:
            return n;
        }
      }

      return n;
    },
    [homeCurrency, gbpToUsd, inrToUsd]
  );

  const formatHomeAmount = useCallback(
    (value: number | null | undefined) => {
      const n = toNumberSafe(value ?? 0);
      switch (homeCurrency) {
        case "USD":
          return fmtUSD(n);
        case "GBP":
          return fmtGBP(n);
        default:
          return fmtNum(n);
      }
    },
    [homeCurrency]
  );

  /* ----- FX API call (same logic as Dashboard) ----- */

  const fetchFxRates = useCallback(async () => {
    try {
      setFxLoading(true);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("jwtToken")
          : null;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) {
        (headers as any).Authorization = `Bearer ${token}`;
      }

      const { monthName, year } = getISTYearMonth();
      const month = monthName.toLowerCase();

      const commonBody = {
        month,
        year,
        fetch_if_missing: true,
      };

      const [ukRes, inrRes] = await Promise.all([
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
      ]);

      if (ukRes.ok) {
        const json = await ukRes.json();
        const rate = json?.record?.conversion_rate;
        if (json?.success && rate != null) {
          setGbpToUsd(Number(rate));
        }
      } else {
        console.warn("UK FX fetch failed:", ukRes.status);
      }

      if (inrRes.ok) {
        const json = await inrRes.json();
        const rate = json?.record?.conversion_rate;
        if (json?.success && rate != null) {
          setInrToUsd(Number(rate));
        }
      } else {
        console.warn("INR FX fetch failed:", inrRes.status);
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

  return {
    homeCurrency,
    setHomeCurrency,
    gbpToUsd,
    inrToUsd,
    fxLoading,
    convertToHomeCurrency,
    formatHomeAmount,
  };
}
