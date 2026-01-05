import type { Metadata } from "next";
import SignUpForm from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your Phormula account to start tracking sales, forecasting inventory, and analyzing performance.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUp() {
  return <SignUpForm />;
}
