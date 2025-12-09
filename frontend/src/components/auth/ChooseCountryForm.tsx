// "use client";

// import Link from "next/link";
// import React, { useEffect, useMemo, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { ChevronLeftIcon } from "@/icons";

// const API_BASE = "http://127.0.0.1:5000";
// const OPTIONS = ["United States", "Canada", "United Kingdom"] as const;

// export default function ChooseCountryForm() {
//   const router = useRouter();
//   const search = useSearchParams();

//   // explicit onboarding flag; when present, we do NOT auto-skip
//   const forceOnboard = search.get("onboard") === "1";

//   const [selected, setSelected] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [guarding, setGuarding] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const countryMap = useMemo(
//     () => ({
//       "United States": "us",
//       "United Kingdom": "uk",
//       Canada: "canada",
//     }),
//     []
//   );

//   const toggle = (label: string) => {
//     setSelected((prev) =>
//       prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]
//     );
//   };

//   // ---- Guard: if onboarding, never auto-redirect; otherwise keep your smart skip ----
//   useEffect(() => {
//     let cancelled = false;

//     const ensureToken = async (): Promise<string | null> => {
//       // small poll to avoid race right after login
//       for (let i = 0; i < 6; i++) {
//         const t = localStorage.getItem("jwtToken");
//         if (t) return t;
//         await new Promise((r) => setTimeout(r, 100));
//       }
//       return localStorage.getItem("jwtToken");
//     };

//     (async () => {
//       const token = await ensureToken();
//       if (!token) {
//         if (!cancelled) router.replace(`/signin?redirect=/choose-country`);
//         return;
//       }

//      // If not forced onboarding, skip page when already done
//      if (!forceOnboard) {
//        const localDone = localStorage.getItem("onboardDone") === "true";
//        if (localDone) {
//          if (!cancelled) router.replace("/");
//          return;
//        }
//        try {
//          const headers = { Authorization: `Bearer ${token}` };
//          const userRes = await fetch(`${API_BASE}/get_user_data`, { headers });
//          const userData = await userRes.json();
//          const serverDone =
//            userData?.onboarding_complete === true ||
//            (typeof userData?.brand_name === "string" && userData.brand_name.trim().length > 0);
//          if (serverDone) {
//            if (!cancelled) router.replace("/");
//            return;
//          }
//        } catch {}
//      }



//       if (forceOnboard) {
//         if (!cancelled) setGuarding(false);
//         return; // <-- stay here during explicit onboarding
//       }

//       // Non-onboarding visits: allow auto-skip if user already configured
//       try {
//         const headers = { Authorization: `Bearer ${token}` };
//         const [uploadRes, userRes] = await Promise.all([
//           fetch(`${API_BASE}/upload_history`, { headers }),
//           fetch(`${API_BASE}/get_user_data`, { headers }),
//         ]);
//         const uploadData = await uploadRes.json();
//         const userData = await userRes.json();

//         const hasUploads =
//           Array.isArray(uploadData?.uploads) && uploadData.uploads.length > 0;
//         const hasBrand =
//           typeof userData?.brand_name === "string" &&
//           userData.brand_name.trim().length > 0;

//         if (hasUploads || hasBrand) {
//           // choose a safe place (dashboard) if user lands here outside onboarding
//           if (!cancelled) router.replace(`/`);
//           return;
//         }
//       } catch (e) {
//         // fail open
//         console.warn("ChooseCountry guard checks failed", e);
//       } finally {
//         if (!cancelled) setGuarding(false);
//       }
//     })();

//     return () => {
//       cancelled = true;
//     };
//   }, [forceOnboard, router]);

//   const submitSelectedCountries = async (codes: string[]) => {
//     const companyName = localStorage.getItem("companyName") || "";
//     const brandName = localStorage.getItem("brandName") || "";
//     const homeCurrency = localStorage.getItem("homeCurrency") || "";

//     try {
//       const res = await fetch(`${API_BASE}/selectform`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("jwtToken") || ""}`,
//         },
//         body: JSON.stringify({
//           country: codes.join(", "),
//           company_name: companyName,
//           brand_name: brandName,
//           homeCurrency,
//         }),
//       });
//       const data = await res.json();
//       if (!data?.success) {
//         console.error("selectform failed:", data?.message);
//       }
//     } catch (e) {
//       console.error("selectform error:", e);
//     }
//   };

//   const onNext = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (selected.length === 0) {
//       setError("Please select at least one country.");
//       return;
//     }
//     setError(null);
//     setLoading(true);

//     const mapped = selected.map(
//       (name) => countryMap[name as keyof typeof countryMap]
//     );
//     localStorage.setItem("selectedCountries", JSON.stringify(mapped));

//     // Save selection to backend
//     await submitSelectedCountries(mapped);

//     // ✅ Always go to Brand in onboarding (no feepreview + no NA)
//     router.push("/brand?onboard=1");

//     setLoading(false);
//   };

//   const onBack = () => {
//     if (typeof window !== "undefined" && window.history.length > 1) {
//       router.back();
//     } else {
//       router.push("/signup");
//     }
//   };

//   if (guarding) {
//     return (
//       <div className="flex min-h-[60vh] items-center justify-center">
//         <p className="text-gray-600 dark:text-gray-300">Loading…</p>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col flex-1 lg:w-1/2 w-full">
//       <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
//         <Link
//           href="/"
//           className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
//         >
//           <ChevronLeftIcon />
//           Back to dashboard
//         </Link>
//       </div>

//       <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
//         <div>
//           <div className="mb-5 sm:mb-8">
//             <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
//               Choose Country
//             </h1>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Select one or more countries you operate in.
//             </p>
//           </div>

//           <form onSubmit={onNext}>
//             <div className="space-y-4">
//               {OPTIONS.map((label) => {
//                 const checked = selected.includes(label);
//                 return (
//                   <label
//                     key={label}
//                     className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition ${
//                       checked
//                         ? "border-[#48A887] bg-[#f5faff]"
//                         : "border-gray-300 bg-white dark:bg-gray-900"
//                     }`}
//                   >
//                     <span className="text-base text-[#414042] dark:text-gray-200">
//                       {label}
//                     </span>
//                     <input
//                       type="checkbox"
//                       className="h-5 w-5 accent-[#48A887]"
//                       checked={checked}
//                       onChange={() => toggle(label)}
//                     />
//                   </label>
//                 );
//               })}
//             </div>

//             {error && (
//               <p className="mt-2 text-sm text-red-500" aria-live="polite">
//                 {error}
//               </p>
//             )}

//             <p className="mt-4 text-sm text-[#414042] dark:text-gray-300">
//               We are adding more integrations on our tool.
//             </p>

//             <div className="mt-6 flex items-center justify-end gap-3">
//               <button
//                 type="button"
//                 onClick={onBack}
//                 className="inline-flex justify-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
//               >
//                 Back
//               </button>
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="inline-flex justify-center rounded-lg bg-[#2c3854] px-4 py-2 text-sm font-semibold text-[#f8edcf] hover:opacity-95 disabled:opacity-60"
//               >
//                 {loading ? "Please wait…" : "Next"}
//               </button>
//             </div>
//           </form>

//           <div className="mt-5">
//             <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
//               Need to change something?{" "}
//               <Link
//                 href="/signup"
//                 className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
//               >
//                 Go back to Sign Up
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }








"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon } from "@/icons";
import { useLazyGetUserDataQuery } from "@/lib/api/profileApi";
import { useLazyGetUploadHistoryQuery } from "@/lib/api/uploadsApi";
import { useSubmitSelectFormMutation } from "@/lib/api/onboardingApi";
import Button from "../ui/button/Button";



const OPTIONS = ["United States", "Canada", "United Kingdom"] as const;

export default function ChooseCountryForm() {
  const router = useRouter();
  const search = useSearchParams();

  // explicit onboarding flag; when present, we do NOT auto-skip
  const forceOnboard = search.get("onboard") === "1";

  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [guarding, setGuarding] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // RTK Query hooks
  const [triggerUser] = useLazyGetUserDataQuery();
  const [triggerUploads] = useLazyGetUploadHistoryQuery();
  const [submitSelectForm] = useSubmitSelectFormMutation();

  const countryMap = useMemo(
    () => ({
      "United States": "us",
      "United Kingdom": "uk",
      Canada: "canada",
    }),
    []
  );

  const toggle = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]
    );
  };

  // ---- Guard: if onboarding, never auto-redirect; otherwise keep smart skip ----
  useEffect(() => {
    let cancelled = false;

    const ensureToken = async (): Promise<string | null> => {
      // small poll to avoid race right after login
      for (let i = 0; i < 6; i++) {
        const t = localStorage.getItem("jwtToken");
        if (t) return t;
        await new Promise((r) => setTimeout(r, 100));
      }
      return localStorage.getItem("jwtToken");
    };

    (async () => {
      const token = await ensureToken();
      if (!token) {
        if (!cancelled) router.replace(`/signin?redirect=/choose-country`);
        return;
      }

      // If not forced onboarding, skip page when already done
      if (!forceOnboard) {
        const localDone = localStorage.getItem("onboardDone") === "true";
        if (localDone) {
          if (!cancelled) router.replace("/");
          return;
        }

        try {
          // Use RTKQ instead of fetch
          const userResult = await triggerUser().unwrap();
          const serverDone =
            userResult?.onboarding_complete === true ||
            (typeof userResult?.brand_name === "string" && userResult.brand_name.trim().length > 0);

          if (serverDone) {
            if (!cancelled) router.replace("/");
            return;
          }
        } catch {
          // ignore and continue
        }
      }

      if (forceOnboard) {
        if (!cancelled) setGuarding(false);
        return; // stay here during explicit onboarding
      }

      // Non-onboarding visits: allow auto-skip if user already configured
      try {
        const [uploadsData, userData] = await Promise.all([
          triggerUploads().unwrap(),
          triggerUser().unwrap(),
        ]);

        const hasUploads = Array.isArray(uploadsData?.uploads) && uploadsData.uploads.length > 0;
        const hasBrand =
          typeof userData?.brand_name === "string" && userData.brand_name.trim().length > 0;

        if (hasUploads || hasBrand) {
          if (!cancelled) router.replace(`/`);
          return;
        }
      } catch (e) {
        // fail open
        console.warn("ChooseCountry guard checks failed", e);
      } finally {
        if (!cancelled) setGuarding(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [forceOnboard, router, triggerUploads, triggerUser]);

  // const onNext = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (selected.length === 0) {
  //     setError("Please select at least one country.");
  //     return;
  //   }
  //   setError(null);
  //   setLoading(true);

  //   const mapped = selected.map((name) => countryMap[name as keyof typeof countryMap]);
  //   localStorage.setItem("selectedCountries", JSON.stringify(mapped));

  //   // Grab optional profile bits from localStorage
  //   const companyName = localStorage.getItem("companyName") || "";
  //   const brandName = localStorage.getItem("brandName") || "";
  //   const homeCurrency = localStorage.getItem("homeCurrency") || "";

  //   // Save selection to backend via RTKQ
  //   try {
  //     await submitSelectForm({
  //       country: mapped.join(", "),
  //       company_name: companyName,
  //       brand_name: brandName,
  //       homeCurrency,
  //     }).unwrap();
  //   } catch (err) {
  //     console.error("selectform error:", err);
  //     // continue anyway to keep user moving through onboarding
  //   }

  //   // ✅ Always go to Brand in onboarding (no fee preview here)
  //   router.push("/brand?onboard=1");
  //   setLoading(false);
  // };

const onNext = async (e: React.FormEvent) => {
  e.preventDefault();

  if (selected.length === 0) {
    setError("Please select at least one country.");
    return;
  }

  setError(null);
  setLoading(true);

  const mapped = selected.map(
    (name) => countryMap[name as keyof typeof countryMap]
  );
  localStorage.setItem("selectedCountries", JSON.stringify(mapped));

  const companyName = localStorage.getItem("companyName") || "";
  const brandName = localStorage.getItem("brandName") || "";
  const homeCurrency = localStorage.getItem("homeCurrency") || "";

  // 🔥 Fire-and-forget: don't block navigation
  submitSelectForm({
    country: mapped.join(", "),
    company_name: companyName,
    brand_name: brandName,
    homeCurrency,
  })
    .unwrap()
    .catch((err) => {
      console.error("selectform error:", err);
      // optional: send to monitoring, but don't block user
    });

  // 🚀 Navigate immediately
  router.push("/brand?onboard=1");

  // ❌ Don't bother resetting loading — this component is about to unmount
  // setLoading(false);
};


  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/signup");
    }
  };

  if (guarding) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      

      <div className="flex flex-col justify-center flex-1 w-full max-w-lg mx-auto">
        <div className="flex flex-col gap-8">
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-charcoal-500 text-title-sm dark:text-white/90 sm:text-title-md">
              Which <span className="text-[#5EA68E]">Country</span> do <br />you want to start with?
            </h1>
          </div>

          <form onSubmit={onNext}>
            <div className="space-y-4">
              {OPTIONS.map((label) => {
                const checked = selected.includes(label);
                return (
                 <label
  key={label}
  className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition ${
    checked
      ? "border-[#48A887] bg-[#f5faff]"
      : "border-gray-300 bg-white dark:bg-gray-900"
  }`}
>
  <span className="text-base text-[#414042] dark:text-gray-200">
    {label}
  </span>

  {/* Hidden Input */}
  <input
    type="checkbox"
    checked={checked}
    onChange={() => toggle(label)}
    className="hidden peer"
  />

  {/* Custom Checkbox */}
  <span
    className="
      h-5 w-5 flex items-center justify-center rounded border border-gray-400
      peer-checked:bg-[#48A887]
      peer-checked:border-[#48A887]
    "
  >
    {/* Tick Icon */}
    {checked && (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f8edce"   // ⭐ CUSTOM TICK COLOR
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )}
  </span>
</label>

                );
              })}
            </div>

            {error && (
              <p className="mt-2 text-sm text-red-500" aria-live="polite">
                {error}
              </p>
            )}

            <p className="mt-4 text-sm text-[#414042] dark:text-gray-300">
              We are adding more integrations on our tool.
            </p>

            <div className="mt-10 flex items-center justify-end gap-3 ">
    <button
      type="button"
      onClick={onBack}
      className="inline-flex justify-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
    >
      Back
    </button>
    <button
      type="submit"
      disabled={loading}
      className="inline-flex justify-center rounded-lg bg-[#2c3854] px-4 py-2 text-sm font-semibold text-[#f8edcf] hover:opacity-95 disabled:opacity-60"
    >
      {loading ? "Please wait…" : "Next"}
    </button>
  </div>
          </form>

        </div>
      </div>
    </div>
  );
}
