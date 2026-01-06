// import PageBreadcrumb from "@/components/common/PageBreadCrumb";
// import UserAddressCard from "@/components/user-profile/UserAddressCard";
// import UserInfoCard from "@/components/user-profile/UserInfoCard";
// import UserMetaCard from "@/components/user-profile/UserMetaCard";
// import { Metadata } from "next";
// import React from "react";

// export const metadata: Metadata = {
//   title: "Next.js Profile | TailAdmin - Next.js Dashboard Template",
//   description:
//     "This is Next.js Profile page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
// };


// export default function Profile() {
//   return (
//     <div>
//       <div className="rounded-2xl bg-white ">
//         <div className="space-y-6 mt-4">
//           <UserInfoCard />
//           <UserAddressCard />
//         </div>
//       </div>
//     </div>
//   );
// }












import type { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import React from "react";

export const metadata: Metadata = {
  title: "User Profile",
  description:
    "Manage your Phormula account profile. View and update personal information, address details, and account metadata securely.",
  robots: {
    index: false, // 🔒 user account page
    follow: false,
  },
  openGraph: {
    title: "User Profile",
    description:
      "Access and manage your personal profile, address, and account settings in Phormula.",
    type: "website",
  },
};

export default function Profile() {
  return (
    <div>
      <div className="rounded-2xl bg-white">
        <div className="space-y-6 mt-4">
          <UserInfoCard />
          <UserAddressCard />
        </div>
      </div>
    </div>
  );
}
