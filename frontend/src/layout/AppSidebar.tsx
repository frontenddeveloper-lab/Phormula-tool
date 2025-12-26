// "use client";

// import React, { useState, useEffect, useCallback } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { useParams, usePathname, useRouter } from "next/navigation";
// import { useSidebar } from "../context/SidebarContext";
// import { FaChevronDown, FaTimes } from "react-icons/fa";
// import RegionSelect, { RegionOption } from "@/components/sidebar/RegionSelect";
// import { LuLayoutDashboard } from "react-icons/lu";
// import {
//   useGetProfileCountriesQuery,
//   useGetUploadHistoryQuery,
// } from "@/lib/api/feePreviewApi";

// import {
//   buildPlatformOptions,
//   platformToCountryName,
//   PlatformId,
// } from "@/lib/utils/platforms";

// import { useConnectedPlatforms } from "@/lib/utils/useConnectedPlatforms";
// import { useShopifyStore } from "@/lib/utils/useShopifyStore";
// import { usePlatform } from "@/components/context/PlatformContext";

// type NavSubItem = {
//   name: string;
//   path:
//   | string
//   | ((params: {
//     ranged: string;
//     countryName: string;
//     month: string;
//     year: string;
//   }) => string);
//   onClick?: () => void;
// };

// type NavSection = {
//   key: string;
//   name: string;
//   icon: React.ReactNode;
//   subItems: NavSubItem[];
// };

// const AppSidebar: React.FC = () => {
//   const {
//     isExpanded,
//     isMobileOpen,
//     isHovered,
//     setIsHovered,
//     setIsMobileOpen,
//     toggleSidebar,
//     toggleMobileSidebar,
//   } = useSidebar();
//   const pathname = usePathname();
//   const router = useRouter();
//   const routeParams = useParams();
//   const { setPlatform } = usePlatform();

//   useEffect(() => {
//     setIsMobileOpen(false);
//   }, [pathname, setIsMobileOpen]);

//   useEffect(() => {
//     if (typeof document === "undefined") return;

//     const originalOverflow = document.body.style.overflow;

//     if (isMobileOpen) {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = originalOverflow || "";
//     }

//     return () => {
//       document.body.style.overflow = originalOverflow || "";
//     };
//   }, [isMobileOpen]);

//   const { shopifyStore } = useShopifyStore();

//   const handleToggle = () => {
//     if (typeof window !== "undefined" && window.innerWidth >= 1024) {
//       toggleSidebar();
//     } else {
//       toggleMobileSidebar();
//     }
//   };

//   // ===== Data from RTK Query =====
//   useGetProfileCountriesQuery();
//   const { data: uploadsData } = useGetUploadHistoryQuery();
//   const uploadHistory = uploadsData?.uploads ?? [];

//   // ===== Platform data =====
//   const connectedPlatforms = useConnectedPlatforms();
//   const regionOptions: RegionOption[] = buildPlatformOptions(connectedPlatforms);

//   // ===== Selected platform =====
//   const [selectedPlatform, setSelectedPlatform] = useState<string>(() => {
//     if (typeof window !== "undefined") {
//       const saved = localStorage.getItem("selectedPlatform");
//       if (saved) return saved;
//     }
//     return "global";
//   });

//   // Keep in sync when options change
//   useEffect(() => {
//     if (!regionOptions.length) return;
//     if (
//       !selectedPlatform ||
//       !regionOptions.find((o) => o.value === selectedPlatform)
//     ) {
//       setSelectedPlatform(regionOptions[0].value);
//     }
//   }, [regionOptions, selectedPlatform]);

//   // ===== Latest fetched period (month/year) as default =====
//   const monthNames = [
//     "january",
//     "february",
//     "march",
//     "april",
//     "may",
//     "june",
//     "july",
//     "august",
//     "september",
//     "october",
//     "november",
//     "december",
//   ];

//   const [initialPeriod] = useState(() => {
//     // default: QTD + current month/year
//     const today = new Date();
//     let ranged = "QTD";
//     let month = monthNames[today.getMonth()]; // "december"
//     let year = String(today.getFullYear());

//     if (typeof window !== "undefined") {
//       try {
//         const raw = localStorage.getItem("latestFetchedPeriod");
//         if (raw) {
//           const parsed = JSON.parse(raw) as { month?: string; year?: string };
//           if (parsed.month && parsed.year) {
//             month = String(parsed.month).toLowerCase(); // e.g. "november"
//             year = String(parsed.year);                 // e.g. "2025"
//           }
//         }
//       } catch {
//         // ignore parse errors, keep defaults
//       }
//     }

//     return { ranged, month, year };
//   });

//   const currentPlatform =
//     (routeParams?.platform as string) || selectedPlatform || "global";
//   const currentCountryName = platformToCountryName(
//     currentPlatform as PlatformId
//   );

//   const tokenOrFail = () => {
//     const token =
//       typeof window !== "undefined"
//         ? localStorage.getItem("jwtToken")
//         : null;
//     if (!token) throw new Error("No auth token found");
//     return token;
//   };

//   // 🔑 THIS is what all your URLs use
//   const currentParams = {
//     ranged: (routeParams?.ranged as string) || initialPeriod.ranged,
//     countryName: currentCountryName,
//     month: (routeParams?.month as string) || initialPeriod.month,
//     year: (routeParams?.year as string) || initialPeriod.year,
//   };

//   // ===== Handle platform change from RegionSelect =====
//   const onRegionChange = (val: string) => {
//     const platform = val as PlatformId;

//     if (val === "add_more_countries") {
//       router.push("/settings/countries");
//       return;
//     }

//     setSelectedPlatform(val);
//     setPlatform(platform);

//     // 2) Shopify special redirect
//     if (platform === "shopify") {
//       console.log("Shopify selected, store:", shopifyStore);

//       if (shopifyStore?.shop && shopifyStore?.token && shopifyStore?.email) {
//         const params = new URLSearchParams({
//           shop: shopifyStore.shop,
//           token: shopifyStore.token,
//           email: shopifyStore.email,
//         });

//         router.push(`/orders?${params.toString()}`);
//       } else {
//         console.warn(
//           "Shopify store details missing, falling back to /orders",
//           shopifyStore
//         );
//         router.push("/orders");
//       }
//       return;
//     }

//     // 3) Non-Shopify platforms – update global selection
//     setSelectedPlatform(val);
//     if (typeof window !== "undefined") {
//       localStorage.setItem("selectedPlatform", val);
//       localStorage.removeItem("chatHistory");
//     }

//     // 4) If current route has country in the URL, swap it out
//     const newCountryName = platformToCountryName(platform); // e.g. "uk", "global", "us"
//     const segments = pathname.split("/").filter(Boolean);
//     const params: any = routeParams;

//     let newPath: string | null = null;

//     const ranged = (params.ranged as string) || currentParams.ranged;
//     const month = (params.month as string) || currentParams.month;
//     const year = (params.year as string) || currentParams.year;

//     // Routes that have ranged + country + month + year
//     if ((params as any).countryName || segments[0] === "country") {
//       switch (segments[0]) {
//         case "country":
//           newPath = `/country/${ranged}/${newCountryName}/${month}/${year}`;
//           break;
//         case "live-business-insight":
//           newPath = `/live-business-insight/${ranged}/${newCountryName}/${month}/${year}`;
//           break;
//         case "improvements":
//           newPath = `/improvements/${ranged}/${newCountryName}/${month}/${year}`;
//           break;
//         case "chatbot":
//           newPath = `/chatbot/${ranged}/${newCountryName}/${month}/${year}`;
//           break;
//       }
//     }

//     // Routes that only have country + month + year
//     if (!newPath) {
//       switch (segments[0]) {
//         case "inventoryChoice":
//           newPath = `/inventoryChoice/${newCountryName}/${month}/${year}`;
//           break;
//         case "pnlforecast":
//           newPath = `/pnlforecast/${newCountryName}/${month}/${year}`;
//           break;
//         case "inputCost":
//           newPath = `/inputCost/${newCountryName}/${month}/${year}`;
//           break;
//         case "currentInventory":
//           newPath = `/currentInventory/${newCountryName}/${month}/${year}`;
//           break;
//         case "dispatch":
//           newPath = `/dispatch/${newCountryName}/${month}/${year}`;
//           break;
//         case "purchase-order":
//           newPath = `/purchase-order/${newCountryName}/${month}/${year}`;
//           break;
//         case "cashflow":
//           newPath = `/cashflow/${newCountryName}/${month}/${year}`;
//           break;
//         case "referral-fees":
//           newPath = `/referral-fees/${newCountryName}/${month}/${year}`;
//           break;
//         case "fba":
//           newPath = `/fba/${newCountryName}/${month}/${year}`;
//           break;
//         case "productwiseperformance": {
//           const productname = segments[1] ?? "Classic";
//           newPath = `/productwiseperformance/${productname}/${newCountryName}/${month}/${year}`;
//           break;
//         }
//       }
//     }

//     if (newPath && newPath !== pathname) {
//       router.push(newPath);
//     }
//   };

//   const handleFetchCurrentInventory = async () => {
//     try {
//       const token = tokenOrFail();
//       const res = await fetch("http://localhost:5000/amazon_api/inventory", {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (!res.ok) {
//         throw new Error(`API Error: ${res.status}`);
//       }

//       const data = await res.json();
//       console.log("Inventory API Response:", data);
//     } catch (err) {
//       console.error("Inventory Fetch Error:", err);
//     }
//   };

//   // ===== Navigation sections =====
//   const sections: NavSection[] = [
//     {
//       key: "Live Analytics",
//       name: "LIVE ANALYTICS",
//       icon: (
//         <Image
//           src="/images/brand/business.png"
//           alt="Logo"
//           width={20}
//           height={20}
//         />
//       ),
//       subItems: [
//         {
//           name: "Real-Time Dashboard",
//           path: `/`,
//           onClick: handleFetchCurrentInventory,
//         },
//         // {
//         //   name: "Live AI Insights",
//         //   path: `/live-business-insight/${currentParams.ranged}/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
//         // },
//       ],
//     },
//     {
//       key: "dashboard",
//       name: "HISTORICAL DASHBOARD",
//       icon: <LuLayoutDashboard className="h-6 w-6" />,
//       subItems: [
//         {
//           name: "Profits",
//           path: ({ ranged, countryName, month, year }) =>
//             `/country/${ranged}/${countryName}/${month}/${year}`,
//         },
//         {
//           name: "SKU-Wise Profit",
//           path: (params: {
//             productname?: string;
//             countryName: string;
//             month: string;
//             year: string;
//           }) =>
//             `/productwiseperformance/${params.productname ?? "Classic"
//             }/${params.countryName}/${params.month}/${params.year}`,
//         },
//         {
//           name: "Cash Flow",
//           path: ({
//             countryName,
//             month,
//             year,
//           }: {
//             countryName: string;
//             month: string;
//             year: string;
//           }) =>
//             `/cashflow/${encodeURIComponent(
//               countryName
//             )}/${encodeURIComponent(month)}/${encodeURIComponent(year)}`,
//         },
//       ],
//     },
//     {
//       key: "business-intelligence",
//       name: "BUSINESS INTELLIGENCE",
//       icon: (
//         <Image
//           src="/images/brand/business.png"
//           alt="Logo"
//           width={20}
//           height={20}
//         />
//       ),
//       subItems: [
//         {
//           name: "Business Insights",
//           path: `/improvements/${currentParams.ranged}/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
//         },
//         {
//           name: "Chatbot",
//           path: `/chatbot/${currentParams.ranged}/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
//         },
//         {
//           name: "Inventory Forecast",
//           path: `/inventoryChoice/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
//         },
//         {
//           name: "P/L Forecast",
//           path: `/pnlforecast/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
//         },
//       ],
//     },
//     {
//       key: "inventory",
//       name: "INVENTORY",
//       icon: (
//         <Image
//           src="/images/brand/inventory.png"
//           alt="Logo"
//           width={20}
//           height={20}
//         />
//       ),
//       subItems: [
//         {
//           name: "Input Cost",
//           path: `/inputCost/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
//         },
//         {
//           name: "Month-Wise Inventory",
//           path: `/currentInventory/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
//         },
//         {
//           name: "Dispatches",
//           path: `/dispatch/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
//         },
//         {
//           name: "PO",
//           path: `/purchase-order/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
//         },
//       ],
//     },
//     {
//       key: "recon",
//       name: "RECON",
//       icon: (
//         <Image
//           src="/images/brand/recon.png"
//           alt="Logo"
//           width={20}
//           height={20}
//         />
//       ),
//       subItems: [
//         {
//           name: "Referral Fees",
//           path: ({
//             countryName,
//             month,
//             year,
//           }: {
//             countryName: string;
//             month: string;
//             year: string;
//           }) =>
//             `/referral-fees/${encodeURIComponent(
//               countryName
//             )}/${encodeURIComponent(month)}/${encodeURIComponent(year)}`,
//         },
//         {
//           name: "FBA Fees",
//           path: `/fba/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
//         },
//       ],
//     },
//   ];

//   // ===== Section open/close state =====
//   const [openSections, setOpenSections] = useState<Record<string, boolean>>({
//     "Live Analytics": true,
//     dashboard: true,
//     "business-intelligence": true,
//     inventory: true,
//     recon: true,
//     integrations: false,
//   });

//   const toggleSection = useCallback((key: string) => {
//     setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
//   }, []);

//   const isActive = useCallback(
//     (path: string | ((params: typeof currentParams) => string)) => {
//       const resolvedPath =
//         typeof path === "function" ? path(currentParams) : path;
//       return pathname === resolvedPath;
//     },
//     [pathname, currentParams]
//   );

//   return (
//     <>
//       <aside
//   className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-4 left-0 bg-white text-gray-900 h-screen overflow-y-auto transition-all duration-300 ease-in-out z-[1100]
//     ${
//       isMobileOpen
//         ? "w-full"
//         : isExpanded || isHovered
//           ? "w-[clamp(200px,18vw,280px)]"
//           : "w-[72px]"
//     }
//     ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
//     lg:translate-x-0 font-lato
//   `}
//   onMouseEnter={() => !isExpanded && setIsHovered(true)}
//   onMouseLeave={() => setIsHovered(false)}
// >


//         {/* Logo + toggle */}
//         <div
//           className={`py-8 flex gap-2 items-center border-0 ${!isExpanded && !isHovered ? "lg:justify-between" : "justify-between"
//             }`}
//         >
//           <Link href="/" className="flex items-center gap-2">
//             {isExpanded || isHovered || isMobileOpen ? (
//               <>
//                 <Image
//                   className="dark:hidden hidden lg:block"
//                   src="/images/logo/Logo_Phormula.png"
//                   alt="Logo"
//                   width={150}
//                   height={40}
//                 />
//                 <Image
//                   className="hidden dark:block"
//                   src="/images/logo/logo-dark.svg"
//                   alt="Logo"
//                   width={150}
//                   height={40}
//                 />
//               </>
//             ) : (
//               <Image
//                 src="/images/logo/Logo_small.png"
//                 alt="Logo"
//                 width={50}
//                 height={50}
//               />
//             )}
//           </Link>

//           <button
//             type="button"
//             onClick={handleToggle}
//             className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-blue-700 text-white lg:w-9 lg:h-9"
//             aria-label={
//               isExpanded || isMobileOpen ? "Collapse sidebar" : "Expand sidebar"
//             }
//           >
//             {isExpanded || isMobileOpen ? (
//               <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
//                 <path
//                   d="M14.5 5L8.5 12L14.5 19"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//             ) : (
//               <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
//                 <path
//                   d="M9.5 5L15.5 12L9.5 19"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//             )}
//           </button>
//         </div>

//         {/* Platform Select */}
//         {(isExpanded || isHovered || isMobileOpen) &&
//           regionOptions.length > 0 && (
//             <RegionSelect
//               label="Platform"
//               selectedCountry={selectedPlatform}
//               options={regionOptions}
//               onChange={onRegionChange}
//               className="mb-2 px-2 py-1 rounded text-sm bg-transparent text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#5EA68E]"
//             />
//           )}

//         {/* Navigation Sections */}
//         <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar px-2">
//           <nav className="mb-6">
//             <div className="flex flex-col gap-1">
//               {sections.map((section) => {
//                 const resolvedSubPaths = section.subItems.map((sub) =>
//                   typeof sub.path === "function"
//                     ? sub.path(currentParams)
//                     : sub.path
//                 );
//                 const isSectionActive = resolvedSubPaths.some((path) =>
//                   isActive(path as any)
//                 );

//                 return (
//                   <div key={section.key} className="flex flex-col">
//                     {/* Section Header */}
//                     <button
//                       onClick={() => toggleSection(section.key)}
//                       className={`flex items-center justify-between w-full px-2 py-2 text-sm text-left text-[#5EA68E] font-semibold rounded hover:bg-[#5EA68E]/20 transition-colors cursor-pointer group ${isSectionActive ? "bg-[#5EA68E]/10" : ""
//                         }`}
//                     >
//                       <div className="flex items-center">
//                         {section.icon}
//                         {(isExpanded || isHovered || isMobileOpen) && (
//                           <span className="ml-2">{section.name}</span>
//                         )}
//                       </div>
//                       {(isExpanded || isHovered || isMobileOpen) && (
//                         <FaChevronDown
//                           className={`h-3 w-3 transition-transform duration-200 ${openSections[section.key]
//                             ? "rotate-0"
//                             : "rotate-90"
//                             }`}
//                         />
//                       )}
//                     </button>

//                     {/* Sub-items */}
//                     {openSections[section.key] &&
//                       (isExpanded || isHovered || isMobileOpen) && (
//                         <div className="ml-6 mt-1 space-y-1 overflow-hidden">
//                           {section.subItems.map((subItem, idx) => {
//                             const resolvedPath =
//                               typeof subItem.path === "function"
//                                 ? subItem.path(currentParams)
//                                 : subItem.path;
//                             return (
//                               <Link
//                                 key={idx}
//                                 href={resolvedPath}
//                                 onClick={() => {
//                                   if (subItem.onClick) subItem.onClick();
//                                 }}
//                                 className={`block px-2 py-1.5 text-sm text-gray-700 hover:bg-[#5EA68E]/20 rounded transition-colors ${isActive(subItem.path as any)
//                                   ? "bg-[#5EA68E]/20 text-[#5EA68E] font-medium"
//                                   : ""
//                                   }`}
//                               >
//                                 {subItem.name}
//                               </Link>
//                             );
//                           })}
//                         </div>
//                       )}
//                   </div>
//                 );
//               })}
//             </div>
//           </nav>
//         </div>

//         {/* Mobile Close Button */}
//         {isMobileOpen && (
//           <button
//             onClick={() => setIsMobileOpen(false)}
//             className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 md:hidden"
//           >
//             <FaTimes className="h-5 w-5" />
//           </button>
//         )}
//       </aside>
//     </>
//   );
// };

// export default AppSidebar;


















"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { FaChevronDown, FaTimes } from "react-icons/fa";
import RegionSelect, { RegionOption } from "@/components/sidebar/RegionSelect";
import { LuLayoutDashboard } from "react-icons/lu";
import {
  useGetProfileCountriesQuery,
  useGetUploadHistoryQuery,
} from "@/lib/api/feePreviewApi";

import {
  buildPlatformOptions,
  platformToCountryName,
  PlatformId,
} from "@/lib/utils/platforms";

import { useConnectedPlatforms } from "@/lib/utils/useConnectedPlatforms";
import { useShopifyStore } from "@/lib/utils/useShopifyStore";
import { usePlatform } from "@/components/context/PlatformContext";

type NavSubItem = {
  name: string;
  path:
    | string
    | ((params: {
        ranged: string;
        countryName: string;
        month: string;
        year: string;
      }) => string);
  onClick?: () => void;
};

type NavSection = {
  key: string;
  name: string;
  icon: React.ReactNode;
  subItems: NavSubItem[];
};

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    setIsMobileOpen,
    toggleSidebar,
    toggleMobileSidebar,
  } = useSidebar();

  const pathname = usePathname();
  const router = useRouter();
  const routeParams = useParams();
  const { setPlatform } = usePlatform();

  // ✅ Smaller / laptop friendly typography
  const textMain = "text-[11px] sm:text-[12px] lg:text-[12.5px] xl:text-[13px]";
  const textSection =
    "text-[10px] sm:text-[11px] lg:text-[11.5px] xl:text-[12px] tracking-wide";
  const padItem = "px-2 py-1 sm:py-1.5";
  const padHeader = "px-2 py-1.5 sm:py-2";
  const iconSize = "h-[18px] w-[18px] sm:h-5 sm:w-5 lg:h-[22px] lg:w-[22px]";

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = isMobileOpen ? "hidden" : originalOverflow || "";

    return () => {
      document.body.style.overflow = originalOverflow || "";
    };
  }, [isMobileOpen]);

  const { shopifyStore } = useShopifyStore();

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  // ===== Data from RTK Query =====
  useGetProfileCountriesQuery();
  useGetUploadHistoryQuery();

  // ===== Platform data =====
  const connectedPlatforms = useConnectedPlatforms();
  const regionOptions: RegionOption[] = buildPlatformOptions(connectedPlatforms);

  // ===== Selected platform =====
  const [selectedPlatform, setSelectedPlatform] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedPlatform");
      if (saved) return saved;
    }
    return "global";
  });

  useEffect(() => {
    if (!regionOptions.length) return;
    if (!selectedPlatform || !regionOptions.find((o) => o.value === selectedPlatform)) {
      setSelectedPlatform(regionOptions[0].value);
    }
  }, [regionOptions, selectedPlatform]);

  const monthNames = [
    "january","february","march","april","may","june",
    "july","august","september","october","november","december",
  ];

  const [initialPeriod] = useState(() => {
    const today = new Date();
    let ranged = "QTD";
    let month = monthNames[today.getMonth()];
    let year = String(today.getFullYear());

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("latestFetchedPeriod");
        if (raw) {
          const parsed = JSON.parse(raw) as { month?: string; year?: string };
          if (parsed.month && parsed.year) {
            month = String(parsed.month).toLowerCase();
            year = String(parsed.year);
          }
        }
      } catch {}
    }
    return { ranged, month, year };
  });

  const currentPlatform =
    (routeParams?.platform as string) || selectedPlatform || "global";
  const currentCountryName = platformToCountryName(currentPlatform as PlatformId);

  const currentParams = {
    ranged: (routeParams?.ranged as string) || initialPeriod.ranged,
    countryName: currentCountryName,
    month: (routeParams?.month as string) || initialPeriod.month,
    year: (routeParams?.year as string) || initialPeriod.year,
  };

  const { setPlatform: setPlatformCtx } = usePlatform();

  const onRegionChange = (val: string) => {
    const platform = val as PlatformId;

    if (val === "add_more_countries") {
      router.push("/settings/countries");
      return;
    }

    setSelectedPlatform(val);
    setPlatformCtx(platform);

    if (platform === "shopify") {
      if (shopifyStore?.shop && shopifyStore?.token && shopifyStore?.email) {
        const params = new URLSearchParams({
          shop: shopifyStore.shop,
          token: shopifyStore.token,
          email: shopifyStore.email,
        });
        router.push(`/orders?${params.toString()}`);
      } else {
        router.push("/orders");
      }
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("selectedPlatform", val);
      localStorage.removeItem("chatHistory");
    }

    const newCountryName = platformToCountryName(platform);
    const segments = pathname.split("/").filter(Boolean);
    const params: any = routeParams;

    let newPath: string | null = null;
    const ranged = (params.ranged as string) || currentParams.ranged;
    const month = (params.month as string) || currentParams.month;
    const year = (params.year as string) || currentParams.year;

    if ((params as any).countryName || segments[0] === "country") {
      switch (segments[0]) {
        case "country":
          newPath = `/country/${ranged}/${newCountryName}/${month}/${year}`;
          break;
        case "live-business-insight":
          newPath = `/live-business-insight/${ranged}/${newCountryName}/${month}/${year}`;
          break;
        case "improvements":
          newPath = `/improvements/${ranged}/${newCountryName}/${month}/${year}`;
          break;
        case "chatbot":
          newPath = `/chatbot/${ranged}/${newCountryName}/${month}/${year}`;
          break;
      }
    }

    if (!newPath) {
      switch (segments[0]) {
        case "inventoryChoice":
          newPath = `/inventoryChoice/${newCountryName}/${month}/${year}`;
          break;
        case "pnlforecast":
          newPath = `/pnlforecast/${newCountryName}/${month}/${year}`;
          break;
        case "inputCost":
          newPath = `/inputCost/${newCountryName}/${month}/${year}`;
          break;
        case "currentInventory":
          newPath = `/currentInventory/${newCountryName}/${month}/${year}`;
          break;
        case "dispatch":
          newPath = `/dispatch/${newCountryName}/${month}/${year}`;
          break;
        case "purchase-order":
          newPath = `/purchase-order/${newCountryName}/${month}/${year}`;
          break;
        case "cashflow":
          newPath = `/cashflow/${newCountryName}/${month}/${year}`;
          break;
        case "referral-fees":
          newPath = `/referral-fees/${newCountryName}/${month}/${year}`;
          break;
        case "fba":
          newPath = `/fba/${newCountryName}/${month}/${year}`;
          break;
        case "productwiseperformance": {
          const productname = segments[1] ?? "Classic";
          newPath = `/productwiseperformance/${productname}/${newCountryName}/${month}/${year}`;
          break;
        }
      }
    }

    if (newPath && newPath !== pathname) router.push(newPath);
  };

  const sections: NavSection[] = [
    {
      key: "Live Analytics",
      name: "LIVE ANALYTICS",
      icon: (
        <Image
          src="/images/brand/business.png"
          alt="Logo"
          width={18}
          height={18}
          className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] lg:w-[20px] lg:h-[20px]"
        />
      ),
      subItems: [{ name: "Real-Time Dashboard", path: `/` }],
    },
    {
      key: "dashboard",
      name: "HISTORICAL DASHBOARD",
      icon: <LuLayoutDashboard className={iconSize} />,
      subItems: [
        {
          name: "Profits",
          path: ({ ranged, countryName, month, year }) =>
            `/country/${ranged}/${countryName}/${month}/${year}`,
        },
        {
          name: "SKU-Wise Profit",
          path: (params: {
            productname?: string;
            countryName: string;
            month: string;
            year: string;
          }) =>
            `/productwiseperformance/${params.productname ?? "Classic"}/${params.countryName}/${params.month}/${params.year}`,
        },
        {
          name: "Cash Flow",
          path: ({ countryName, month, year }) =>
            `/cashflow/${encodeURIComponent(countryName)}/${encodeURIComponent(month)}/${encodeURIComponent(year)}`,
        },
      ],
    },
    {
      key: "business-intelligence",
      name: "BUSINESS INTELLIGENCE",
      icon: (
        <Image
          src="/images/brand/business.png"
          alt="Logo"
          width={18}
          height={18}
          className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] lg:w-[20px] lg:h-[20px]"
        />
      ),
      subItems: [
        {
          name: "Business Insights",
          path: `/improvements/${currentParams.ranged}/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
        },
        {
          name: "Chatbot",
          path: `/chatbot/${currentParams.ranged}/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
        },
        {
          name: "Inventory Forecast",
          path: `/inventoryChoice/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
        },
        {
          name: "P/L Forecast",
          path: `/pnlforecast/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
        },
      ],
    },
    {
      key: "inventory",
      name: "INVENTORY",
      icon: (
        <Image
          src="/images/brand/inventory.png"
          alt="Logo"
          width={18}
          height={18}
          className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] lg:w-[20px] lg:h-[20px]"
        />
      ),
      subItems: [
        {
          name: "Current Inventory",
          path: `/inputCost/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
        },
        // {
        //   name: "Month-Wise Inventory",
        //   path: `/currentInventory/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
        // },
        {
          name: "Dispatches",
          path: `/dispatch/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
        },
        {
          name: "PO",
          path: `/purchase-order/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
        },
      ],
    },
    {
      key: "recon",
      name: "RECON",
      icon: (
        <Image
          src="/images/brand/recon.png"
          alt="Logo"
          width={18}
          height={18}
          className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] lg:w-[20px] lg:h-[20px]"
        />
      ),
      subItems: [
        {
          name: "Referral Fees",
          path: ({ countryName, month, year }) =>
            `/referral-fees/${encodeURIComponent(countryName)}/${encodeURIComponent(month)}/${encodeURIComponent(year)}`,
        },
        {
          name: "FBA Fees",
          path: `/fba/${currentParams.countryName}/${currentParams.month}/${currentParams.year}`,
        },
      ],
    },
  ];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Live Analytics": true,
    dashboard: true,
    "business-intelligence": true,
    inventory: true,
    recon: true,
    integrations: false,
  });

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isActive = useCallback(
    (path: string | ((params: typeof currentParams) => string)) => {
      const resolvedPath = typeof path === "function" ? path(currentParams) : path;
      return pathname === resolvedPath;
    },
    [pathname, currentParams]
  );

  const showText = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 bg-white text-gray-900 h-screen overflow-y-auto transition-all duration-300 ease-in-out z-[1100]
        px-3 sm:px-4 lg:px-3 xl:px-4
        ${
          isMobileOpen
            ? "w-full"
            : showText
            ? "w-[clamp(190px,18vw,280px)]"
            : "w-[64px] sm:w-[72px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 font-lato
      `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo + toggle */}
      <div
        className={`py-4 sm:py-5 lg:py-6 flex gap-2 items-center border-0 ${
          !isExpanded && !isHovered ? "lg:justify-between" : "justify-between"
        }`}
      >
        <Link href="/" className="flex items-center gap-2">
          {showText ? (
            <Image
              className="dark:hidden hidden lg:block"
              src="/images/logo/Logo_Phormula.png"
              alt="Logo"
              width={132}
              height={36}
            />
          ) : (
            <Image
              src="/images/logo/Logo_small.png"
              alt="Logo"
              width={42}
              height={42}
              className="w-[36px] h-[36px] sm:w-[42px] sm:h-[42px]"
            />
          )}
        </Link>

        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center justify-center w-8 h-8 lg:w-9 lg:h-9 rounded-lg border border-gray-200 bg-blue-700 text-white"
          aria-label={showText ? "Collapse sidebar" : "Expand sidebar"}
        >
          {showText ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M14.5 5L8.5 12L14.5 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M9.5 5L15.5 12L9.5 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Platform Select */}
      {showText && regionOptions.length > 0 && (
        <RegionSelect
          label="Platform"
          selectedCountry={selectedPlatform}
          options={regionOptions}
          onChange={onRegionChange}
          className={`mb-2 rounded bg-transparent text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#5EA68E]
            px-2 py-1 ${textMain}`}
        />
      )}

      {/* Navigation Sections */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar px-2">
        <nav className="mb-6">
          <div className="flex flex-col gap-1">
            {sections.map((section) => {
              const resolvedSubPaths = section.subItems.map((sub) =>
                typeof sub.path === "function" ? sub.path(currentParams) : sub.path
              );
              const isSectionActive = resolvedSubPaths.some((p) =>
                isActive(p as any)
              );

              return (
                <div key={section.key} className="flex flex-col">
                  <button
                    onClick={() => toggleSection(section.key)}
                    className={`w-full rounded hover:bg-[#5EA68E]/15 transition-colors cursor-pointer group
                      ${padHeader} ${textSection} text-left text-[#5EA68E] font-semibold
                      flex items-center ${
                        showText ? "justify-between" : "justify-center"
                      }
                      ${isSectionActive ? "bg-[#5EA68E]/10" : ""}`}
                  >
                    <div className="flex items-center">
                      {section.icon}
                      {showText && <span className="ml-2">{section.name}</span>}
                    </div>

                    {showText && (
                      <FaChevronDown
                        className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-200 ${
                          openSections[section.key] ? "rotate-0" : "rotate-90"
                        }`}
                      />
                    )}
                  </button>

                  {openSections[section.key] && showText && (
                    <div className="ml-4 sm:ml-5 lg:ml-6 mt-1 space-y-1 overflow-hidden">
                      {section.subItems.map((subItem, idx) => {
                        const resolvedPath =
                          typeof subItem.path === "function"
                            ? (subItem.path as any)(currentParams)
                            : subItem.path;

                        return (
                          <Link
                            key={idx}
                            href={resolvedPath}
                            onClick={() => subItem.onClick?.()}
                            className={`block rounded transition-colors
                              ${padItem} ${textMain} text-gray-700 hover:bg-[#5EA68E]/15
                              ${
                                isActive(subItem.path as any)
                                  ? "bg-[#5EA68E]/20 text-[#5EA68E] font-medium"
                                  : ""
                              }`}
                          >
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </div>

      {isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 md:hidden"
        >
          <FaTimes className="h-5 w-5" />
        </button>
      )}
    </aside>
  );
};

export default AppSidebar;
