// import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
// import { Metadata } from "next";

// export const metadata: Metadata = {
//   title: "Reset Password",
//   description: "Set a new password for your account.",
// };

// export default function ResetPasswordPage() {
//   return <ResetPasswordForm />;
// }










"use client";

import { useParams } from "next/navigation";
import { Metadata } from "next";
import SignInForm from "@/components/auth/SignInForm";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();

  return (
    <>
      {/* Right side content (under AuthLayout) */}
      <SignInForm />

      {/* Modal overlay */}
      {typeof token === "string" && <ResetPasswordForm token={token} />}
    </>
  );
}
