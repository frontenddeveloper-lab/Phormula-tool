import type { Metadata } from "next";
import CashFlowClient from "./CashFlowClient";

type Params = {
  countryName: string;
  month: string;
  year: string;
};

const formatCountry = (c: string) => {
  const v = (c || "").toLowerCase();
  if (v === "uk") return "UK";
  if (v === "us") return "US";
  if (v === "india") return "India";
  if (v === "ca") return "Canada";
  if (v === "global") return "Global";
  return v.toUpperCase();
};

export function generateMetadata({ params }: { params: Params }): Metadata {
  const country = formatCountry(params.countryName);
  const month = decodeURIComponent(params.month || "").toUpperCase();
  const year = String(params.year || "");

  const title = `Cash Flow`;

  return {
    title: `${title} `,
    description: `Cash flow dashboard for ${country} for ${month} ${year}. View sales, fees, advertising, tax & credits, reimbursements, and cash generated.`,
    robots: { index: false, follow: false },
  };
}

export default function Page() {
  return <CashFlowClient />;
}
