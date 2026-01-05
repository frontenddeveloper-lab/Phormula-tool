import type { Metadata } from "next";
import SignInForm from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Phormula account to access dashboards, analytics, forecasting, and reports.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignIn() {
  return <SignInForm />;
}
