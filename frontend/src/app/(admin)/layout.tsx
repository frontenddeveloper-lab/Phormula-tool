"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { useParams, useRouter } from "next/navigation";


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

  const chatbotUrl = `/chatbot/${currentParams.ranged || "NA"
    }/${currentParams.countryName || "NA"}/${currentParams.month || "NA"}/${currentParams.year || "NA"
    }`;

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <AuthGuard>
      <div className="min-h-screen xl:flex">
        {/* Sidebar and Backdrop */}
        <AppSidebar />
        <Backdrop />
        {/* Main Content Area */}
        <div
          className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
        >
          {/* Header */}
          <AppHeader />
          {/* Page Content */}
          <div className="p-4 md:p-6 border-l border-t border-gray-200 ">{children}</div>
        </div>

        {/* Floating Chatbot Button */}
        <button
          className="
    fixed bottom-4 right-3 z-[9999]
    w-16 h-16                  
    rounded-full
    bg-transparent  transition
    flex items-center justify-center
    
  "
          onClick={() => router.push(chatbotUrl)}
        >
          <img
            src="/Chatbot.png"
            alt="Chatbot"
            className="
      w-16 h-16                  /* Keep image smaller than button */
      object-contain            /* Prevent cropping */
      pointer-events-none
    "
          />
        </button>


      </div>
    </AuthGuard>
  );
}
