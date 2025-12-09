// // // app/country/[ranged]/[countryName]/[month]/[year]/page.tsx
// // "use client";

// // import React from "react";
// // import CountryDashboard from "@/components/dashboard/CountryDashboard";

// // type Props = {
// //   params: {
// //     ranged: string;        
// //     countryName: string;   
// //     month: string;         
// //     year: string;         
// //   };
// // };

// // export default function Page({ params }: Props) {
// //   const { ranged, countryName, month, year } = params;

// //   return (
// //     <CountryDashboard
// //       key={`${ranged}-${countryName}-${month}-${year}`} // ✅ ensures re-render when params change
// //       initialRanged={ranged}
// //       initialCountryName={countryName}
// //       initialMonth={month}
// //       initialYear={year}
// //     />
// //   );
// // }









// // app/country/[ranged]/[countryName]/[month]/[year]/page.tsx
// "use client";

// import React from "react";
// import CountryDashboard from "@/components/dashboard/CountryDashboard";

// export default function Page({
//   params,
// }: {
//   params: { ranged: string; countryName: string; month: string; year: string };
// }) {
//   const { ranged, countryName, month, year } = params;

//   return (
//     <CountryDashboard
//       key={`${ranged}-${countryName}-${month}-${year}`}
//       initialRanged={ranged}
//       initialCountryName={countryName}
//       initialMonth={month}
//       initialYear={year}
//     />
//   );
// }








// app/country/[ranged]/[countryName]/[month]/[year]/page.tsx
"use client";

import Dropdowns from "@/components/dropdowns/Dropdowns";
import React from "react";

export default function Page({
  params,
}: {
  params: Promise <{ ranged: string; countryName: string; month: string; year: string }>;
}) {
  const { ranged, countryName, month, year } = React.use(params) ;

  return (
    <Dropdowns
      key={`${ranged}-${countryName}-${month}-${year}`}
      initialRanged={ranged}
      initialCountryName={countryName}
      initialMonth={month}
      initialYear={year}
    />
  );
}
