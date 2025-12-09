import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Profile | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Profile page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};


export default function Profile() {
  return (
    <div>
      <div className="rounded-2xl bg-white dark:bg-white/[0.03] ">

        <PageBreadcrumb pageTitle="Profile" align="left" textSize="2xl" />
        <div className="space-y-6 mt-4">
          {/* <UserMetaCard /> */}
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>
    </div>
  );
}
