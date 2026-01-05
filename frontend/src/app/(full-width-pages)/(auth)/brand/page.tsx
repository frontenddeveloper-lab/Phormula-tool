import type { Metadata } from "next";
import BrandForm from "@/components/auth/BrandForm";

export const metadata: Metadata = {
  title: "Company & Brand Details",
  description:
    "Provide your company and brand details to personalize your Phormula experience during onboarding.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BrandPage() {
  return <BrandForm />;
}
