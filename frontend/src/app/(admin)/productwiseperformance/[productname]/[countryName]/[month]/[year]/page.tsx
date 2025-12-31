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

const formatCountry = (c: string) => {
  if (c === "uk") return "UK";
  if (c === "us") return "US";
  if (c === "ca") return "Canada";
  if (c === "global") return "Global";
  return c.toUpperCase();
};

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const { productname, countryName, month, year } = params;

  const title = `${decodeURIComponent(productname)} | SKU-Wise Performance`;

  return {
    title: `${title} `,
    description: `Product-wise performance dashboard for ${decodeURIComponent(
      productname
    )} in ${formatCountry(countryName)} for ${month.toUpperCase()} ${year}.`,
    robots: {
      index: false, // analytics/dashboard page
      follow: false,
    },
  };
}

export default function Page() {
  return <ProductwisePerformance />;
}
