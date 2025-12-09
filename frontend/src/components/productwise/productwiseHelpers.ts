// components/productwise/productwiseHelpers.ts
export type CountryKey = "uk" | "us" | "global" | string;
export type Range = "monthly" | "quarterly" | "yearly";

export type MonthDatum = {
  month: string;
  net_sales: number;
  quantity: number;
  profit: number;
};

export type APIResponse = {
  success: boolean;
  message?: string;
  data: Record<CountryKey, MonthDatum[]>;
};

export const monthOrder = [
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

export const GBP_TO_USD_RATE = 1.27;

export const formatCountryLabel = (country: string) => {
  const lower = country.toLowerCase();
  if (lower === "global") return "Global";
  return country.toUpperCase();
};

export const getCurrencyByCountry = (country: string, value: number) => {
  const lower = country.toLowerCase();

  if (lower === "uk") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatCurrencyByCountry = (country: string, value: number) =>
  getCurrencyByCountry(country, value);

export const getCountryColor = (country: CountryKey) => {
  const colors: Record<string, string> = {
    uk: "#AB64B5",
    us: "#87AD12",
    global: "#F47A00",
  };
  return colors[country] || "#ff7c7c";
};

export const formatMonthYear = (monthName: string, year: number | string) => {
  const MONTH_ABBRS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (!monthName) return "";

  const fullNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const idx = fullNames.findIndex(
    (full) =>
      monthName.toLowerCase().startsWith(full.slice(0, 3)) ||
      monthName.toLowerCase() === full
  );

  const abbr = idx >= 0 ? MONTH_ABBRS[idx] : monthName.slice(0, 3) || monthName;
  const y = String(year);
  const shortYear = y.slice(-2);
  return `${abbr}'${shortYear}`;
};
