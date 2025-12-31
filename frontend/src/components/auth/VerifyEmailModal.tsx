"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useResendVerificationMutation } from "@/lib/api/userApi";
import { toast } from "sonner";

type VerifyEmailModalProps = {
  status: string; // "success" | "failed" | invalid
  email?: string;
  onClose: () => void;
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
    if (isFailed) {
      return "Email verification failed. Please try again.";
    }
    return "The verification link seems invalid or has expired.";
  }, [isFailed]);

  /* =====================================================
     ✅ SUCCESS → TOAST ONLY (NO MODAL)
  ===================================================== */
  useEffect(() => {
    if (isSuccess) {
      toast.success("Email verified successfully ✅", {
        duration: 4500,
      });

      const timer = setTimeout(() => {
        onClose();
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  /* =====================================================
     🔁 RESEND HANDLER
  ===================================================== */
  const handleResend = async () => {
    if (!email) {
      setFlash("Email not found in the link.");
      return;
    }

    try {
      const res = await resendVerification({ email }).unwrap();
      if (res?.success !== false) {
        setFlash(
          res?.message || "Verification email has been resent successfully."
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

  /* =====================================================
     ❌ DON'T RENDER MODAL FOR SUCCESS
  ===================================================== */
  if (isSuccess) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md sm:max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* FAILED / INVALID VIEW */}
        <div className="flex flex-col items-center text-center space-y-5">
          {/* Icon */}
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

          {/* Heading */}
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
            Email Verification
          </h1>

          {/* Message */}
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-md">
            {message}
          </p>

          {/* Email */}
          {email && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Email: {email}
            </p>
          )}

          {/* Actions */}
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

          {/* Flash Message */}
          {flash && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {flash}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
