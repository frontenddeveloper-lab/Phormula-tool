import type { Metadata } from "next";
import VerifyEmailClient from "./VerifyEmailClient";

export const metadata: Metadata = {
  title: "Verify Email",
  description:
    "Verify your email address to activate your Phormula account and complete sign-up.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <VerifyEmailClient />;
}
