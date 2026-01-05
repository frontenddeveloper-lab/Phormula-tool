// // app/country/[ranged]/[countryName]/[month]/[year]/page.tsx
// "use client";

// import Dropdowns from "@/components/dropdowns/Dropdowns";
// import React from "react";

// export default function Page({
//   params,
// }: {
//   params: Promise <{ ranged: string; countryName: string; month: string; year: string }>;
// }) {
//   const { ranged, countryName, month, year } = React.use(params) ;

//   return (
//     <Dropdowns
//       key={`${ranged}-${countryName}-${month}-${year}`}
//       initialRanged={ranged}
//       initialCountryName={countryName}
//       initialMonth={month}
//       initialYear={year}
//     />
//   );
// }







import type { Metadata } from "next";
import CountryClient from "./CountryClient";

type Params = {
  ranged: string;
  countryName: string;
  month: string;
  year: string;
};

export function generateMetadata({ params }: { params: Params }): Metadata {
  const title = `${params.countryName.toUpperCase()}`;

  return {
    title: `${title} Profit Dashboard`,
    description: `Sales dashboard for ${params.countryName.toUpperCase()} (${params.ranged.toUpperCase()}) in ${params.month.toUpperCase()} ${params.year}.`,
    robots: { index: false, follow: false },
  };
}

export default function Page({ params }: { params: Params }) {
  return (
    <CountryClient
      ranged={params.ranged}
      countryName={params.countryName}
      month={params.month}
      year={params.year}
    />
  );
}
