import type { Metadata } from "next";
import RevenueForm from "@/components/auth/RevenueForm";

export const metadata: Metadata = {
  title: "Estimated Revenue",
  description:
    "Choose your estimated revenue for the next year to tailor insights, forecasts, and analytics in Phormula.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ChooseRevenuePage() {
  return <RevenueForm />;
}
