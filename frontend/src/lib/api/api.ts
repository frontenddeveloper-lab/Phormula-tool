// lib/api.ts
"use client";

export const API = {
  history: "http://127.0.0.1:5000/upload_history2",
  tableOverview: "http://127.0.0.1:5000/upload_table",
  tableSku: "http://127.0.0.1:5000/upload_table_sku",
  charts: {
    line: "http://127.0.0.1:5000/charts/line",
    cm2: "http://127.0.0.1:5000/charts/cm2",
    bar: "http://127.0.0.1:5000/charts/bar",
    pie: "http://127.0.0.1:5000/charts/pie",
  },
};

export const rangeToApi = (range: string) =>
  range === "monthly" ? "MTD" : range === "quarterly" ? "QTD" : "YTD";

export const titleCase = (s?: string) => {
  const str = s ?? "";
  return str.length ? str[0].toUpperCase() + str.slice(1).toLowerCase() : "";
};

export function buildUrl(endpoint: string, params: Record<string, any>) {
  const url = new URL(endpoint);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== "") {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
}

export async function authedFetchJson<T = any>(url: string): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res.json();
}
