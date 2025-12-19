// "use client";

// import AuthGuard from "@/components/auth/AuthGuard";
// import { useSidebar } from "@/context/SidebarContext";
// import AppHeader from "@/layout/AppHeader";
// import AppSidebar from "@/layout/AppSidebar";
// import Backdrop from "@/layout/Backdrop";
// import React from "react";
// import { useParams, useRouter } from "next/navigation";
// import ChatbotWidget from "@/components/chatbot/ChatbotWidget";


// export default function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const { isExpanded, isHovered, isMobileOpen } = useSidebar();

//   const router = useRouter();
//   const currentParams = useParams() as {
//     ranged?: string;
//     countryName?: string;
//     month?: string;
//     year?: string;
//   };

//   const chatbotUrl = `/chatbot/${currentParams.ranged || "NA"
//     }/${currentParams.countryName || "NA"}/${currentParams.month || "NA"}/${currentParams.year || "NA"
//     }`;

//   // Dynamic class for main content margin based on sidebar state
//   const mainContentMargin = isMobileOpen
//     ? "ml-0"
//     : isExpanded || isHovered
//       ? "lg:ml-[290px]"
//       : "lg:ml-[90px]";

//   return (
//     <AuthGuard>
//       <div className="min-h-screen xl:flex">
//         {/* Sidebar and Backdrop */}
//         <AppSidebar />
//         <Backdrop />
//         {/* Main Content Area */}
//         <div
//           className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
//         >
//           {/* Header */}
//           <AppHeader />
//           {/* Page Content */}
//           <div className="p-4 md:p-6 border-l border-t border-gray-200 ">{children}</div>
//         </div>

//         {/* Floating Chatbot Button */}
//         {/* <button
//           className="
//     fixed bottom-4 right-3 z-[9999]
//     w-16 h-16                  
//     rounded-full
//     bg-transparent  transition
//     flex items-center justify-center
    
//   "
//           onClick={() => router.push(chatbotUrl)}
//         >
//           <img
//             src="/Chatbot.png"
//             alt="Chatbot"
//             className="
//       w-16 h-16                  
//       object-contain            
//       pointer-events-none
//     "
//           />
//         </button> */}

// <ChatbotWidget />
//       </div>
//     </AuthGuard>
//   );
// }























"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const router = useRouter();

  const currentParams = useParams() as {
    ranged?: string;
    countryName?: string;
    month?: string;
    year?: string;
  };

  const chatbotUrl = `/chatbot/${currentParams.ranged || "NA"}/${
    currentParams.countryName || "NA"
  }/${currentParams.month || "NA"}/${currentParams.year || "NA"}`;

  const showExpanded = isExpanded || isHovered;

  // ✅ Match AppSidebar widths:
  // Expanded: w-[clamp(190px,18vw,280px)]
  // Collapsed: w-[64px] sm:w-[72px]
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : showExpanded
    ? "lg:ml-[clamp(190px,18vw,280px)]"
    : "lg:ml-[64px] lg:sm:ml-[72px]"; // NOTE: tailwind doesn't support lg:sm:... reliably

  // Tailwind doesn't combine lg:sm: well in practice, so do it explicitly:
  const collapsedMargin = "lg:ml-[64px] sm:lg:ml-[72px]";

  return (
    <AuthGuard>
      <div className="min-h-screen xl:flex">
        <AppSidebar />
        <Backdrop />

        <div
          className={`flex-1 overflow-x-hidden transition-all duration-300 ease-in-out ${
            isMobileOpen ? "ml-0" : showExpanded ? "lg:ml-[clamp(190px,18vw,280px)]" : collapsedMargin
          }`}
        >
          <AppHeader />

          <div className="p-3 sm:p-4 md:p-5 border-l border-t border-gray-200">
            {children}
          </div>
        </div>

        <ChatbotWidget />
      </div>
    </AuthGuard>
  );
}
