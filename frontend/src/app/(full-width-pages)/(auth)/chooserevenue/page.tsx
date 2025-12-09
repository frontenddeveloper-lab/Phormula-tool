import RevenueForm from "@/components/auth/RevenueForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose Revenue",
  description: "Select your estimated revenue for next year",
};

export default function ChooseRevenuePage() {
  return <RevenueForm />;
}
