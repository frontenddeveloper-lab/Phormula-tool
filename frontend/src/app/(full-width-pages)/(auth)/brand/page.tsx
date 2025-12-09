// app/(full-width-pages)/(auth)/brand/page.tsx
import BrandForm from "@/components/auth/BrandForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company & Brand | Auth",
  description: "Collect company & brand details during onboarding.",
};

export default function BrandPage() {
  return <BrandForm />;
}
