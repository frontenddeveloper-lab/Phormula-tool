"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useResendVerificationMutation } from "@/lib/api/userApi";
import { FaCircleCheck } from "react-icons/fa6";
import Button from "../ui/button/Button";

type VerifyEmailModalProps = {
  status: string; // "success" | "failed" | ...
  email?: string;
  onClose: () => void; // parent decides where to go (e.g. /signin or /dashboard)
};

export default function VerifyEmailModal({
  status,
  email = "",
  onClose,
}: VerifyEmailModalProps) {
  const [flash, setFlash] = useState("");
  const [resendVerification, { isLoading: resendLoading }] =
    useResendVerificationMutation();

  const isSuccess = status === "success";
  const isFailed = status === "failed";
  const isInvalid = !isSuccess && !isFailed;

  const message = useMemo(() => {
    if (isSuccess) {
      return "Your email address has been successfully verified. You now have access to the platform.";
    }
    if (isFailed) {
      return "Email verification failed. Please try again.";
    }
    return "The verification link seems invalid or has expired.";
  }, [isSuccess, isFailed]);

  const handleResend = async () => {
    if (!email) {
      setFlash("Email not found in the link.");
      return;
    }

    try {
      const res = await resendVerification({ email }).unwrap();
      if (res?.success !== false) {
        setFlash(
          res?.message || "Verification email has been successfully resent!"
        );
      } else {
        setFlash(res?.message || "Failed to resend the verification email.");
      }
    } catch (e: any) {
      setFlash(
        e?.data?.message ||
          "An error occurred while resending the email. Please try again."
      );
    }
  };

  
useEffect(() => {
  const timer = setTimeout(() => {
    onClose();     // 🔥 close modal instead of redirecting
  }, 4000);       // adjust delay (4 seconds here)

  return () => clearTimeout(timer);
}, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose} // close on backdrop click
    >
      <div
        className="w-full max-w-md sm:max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()} // don't close when clicking inside
      >
        {/* SUCCESS VIEW – matches your screenshot */}
        {isSuccess && (
          <div className="flex flex-col items-center text-center space-y-5">
            {/* Green circle with check */}
            {/* <FaCircleCheck size={40}/>

            
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              Email Verified!
            </h1> */}

            <div className="flex flex-col items-center gap-2 text-[#5EA68E] text-3xl">
                         <FaCircleCheck size={40}/>
                          <span className="font-semibold text-2xl">Email Verified!</span>
                        </div>

            {/* Message */}
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-md">
              {message}
            </p>

            {/* Primary CTA */}
            <Button
              type="button"
              variant="primary"
              onClick={onClose}
              size='sm'
            >
              Explore the Tool
            </Button>
          </div>
        )}

        {/* FAILED / INVALID VIEW – similar card, with resend option */}
        {(isFailed || isInvalid) && (
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-red-100">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-8 w-8 text-red-500"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 8v4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="15.5" r="1" fill="currentColor" />
              </svg>
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              Email Verification
            </h1>

            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-md">
              {message}
            </p>

            {email && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Email: {email}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="inline-flex justify-center rounded-md bg-[#2c3854] px-4 py-2 text-sm font-semibold text-[#f8edcf] hover:opacity-95 disabled:opacity-60 transition-colors"
              >
                {resendLoading ? "Resending…" : "Resend Verification Email"}
              </button>

              <Link
                href="/signin"
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                Back to Sign In
              </Link>
            </div>

            {flash && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {flash}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
