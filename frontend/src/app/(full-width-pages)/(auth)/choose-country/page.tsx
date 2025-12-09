import ChooseCountryForm from "@/components/auth/ChooseCountryForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose Country | TailAdmin - Next.js Dashboard Template",
  description: "Select countries to get started",
};

export default function ChooseCountryPage() {
  return <ChooseCountryForm />;
}
