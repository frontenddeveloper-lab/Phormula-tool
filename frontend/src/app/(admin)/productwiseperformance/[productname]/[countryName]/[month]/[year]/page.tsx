// // app/productwiseperformance/[productname]/[countryName]/[month]/[year]/page.tsx

// import ProductwisePerformance from "@/features/productwiseperformance/ProductwisePerformance";

// export default function Page() {
//   return <ProductwisePerformance />;
// }





import type { Metadata } from "next";
import ProductwisePerformance from "@/features/productwiseperformance/ProductwisePerformance";

type Params = {
  productname: string;
  countryName: string;
  month: string;
  year: string;
};

const monthName = (m: string) => {
  const v = String(m).toLowerCase();
  const map: Record<string, string> = {
    "01": "January", "1": "January", "jan": "January",
    "02": "February", "2": "February", "feb": "February",
    "03": "March", "3": "March", "mar": "March",
    "04": "April", "4": "April", "apr": "April",
    "05": "May", "5": "May",
    "06": "June", "6": "June", "jun": "June",
    "07": "July", "7": "July", "jul": "July",
    "08": "August", "8": "August", "aug": "August",
    "09": "September", "9": "September", "sep": "September",
    "10": "October", "oct": "October",
    "11": "November", "nov": "November",
    "12": "December", "dec": "December",
  };
  return map[v] ?? m;
};

const formatCountry = (c: string) => {
  const v = (c || "").toLowerCase();
  if (v === "uk") return "UK";
  if (v === "us") return "US";
  if (v === "ca") return "Canada";
  if (v === "global") return "Global";
  return v.toUpperCase();
};

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const product = decodeURIComponent(params.productname);
  const country = formatCountry(params.countryName);
  const monthFormatted = monthName(params.month);
  const year = params.year;

  const title = `SKU wise Profit`;

  return {
    title,
    description: `SKU wise profit dashboard for ${product} in ${country} for ${monthFormatted} ${year}. Analyze sales, profit, margins, advertising impact, and trends at SKU level.`,
    robots: { index: false, follow: false },
  };
}

export default function Page() {
  return <ProductwisePerformance />;
}
