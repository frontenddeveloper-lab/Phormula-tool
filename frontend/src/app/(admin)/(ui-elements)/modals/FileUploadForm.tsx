// // "use client";

// // import React, { useState, useEffect, useMemo } from "react";
// // import { useParams, useRouter } from "next/navigation";
// // import { Modal } from "@/components/ui/modal"; 

// // type ProfileLike = {
// //   id?: string | number;
// //   transitTime?: string | number;
// //   stockUnit?: string | number;
// //   country?: string;
// //   category?: string;
// //   subcategory?: string;
// //   months?: string[];
// // };

// // type Props = {
// //   initialCountry?: string;
// //   profile?: ProfileLike;
// //   onComplete?: () => void;
// //   onClose: () => void;
// // };

// // const FileUploadForm: React.FC<Props> = ({ initialCountry, profile: profileProp, onComplete, onClose  }) => {
// //   const router = useRouter();
// //   const params = useParams<{ ranged?: string; countryName?: string; month?: string; year?: string }>();
// //   const urlCountry = params?.countryName ?? "";

// //   const profileLS: ProfileLike | null = (() => {
// //     try {
// //       const raw = typeof window !== "undefined" ? localStorage.getItem("profile") : null;
// //       return raw ? (JSON.parse(raw) as ProfileLike) : null;
// //     } catch {
// //       return null;
// //     }
// //   })();

// //   const profile: ProfileLike = profileProp ?? profileLS ?? {};
// //   const [isUploading, setIsUploading] = useState(false);
// //   const [error, setError] = useState("");

// //   const currentYear = new Date().getFullYear();
// //   const years = Array.from({ length: 2 }, (_, i) => currentYear - 1 + i);

// //   const [file1, setFile1] = useState<File | null>(null);
// //   const [file2, setFile2] = useState<File | null>(null);

// //   const [transitTime] = useState(String(profile.transitTime ?? ""));
// //   const [stockUnit] = useState(String(profile.stockUnit ?? ""));

// //   const [country] = useState(String(initialCountry ?? profile.country ?? urlCountry ?? ""));

// //   const [category, setCategory] = useState(String(profile.category ?? ""));
// //   const [subcategory, setSubcategory] = useState(String(profile.subcategory ?? ""));
// //   const [categories, setCategories] = useState<string[]>([]);
// //   const [subcategories, setSubcategories] = useState<string[]>([]);
// //   const [year, setYear] = useState<string>("");
// //   const [month, setMonth] = useState<string>("");
// //   const [, setUploadedMonths] = useState<string[]>(Array.isArray(profile.months) ? profile.months : []);

// //   // 🔁 Inline confirm modal state (replaces Modalmsg)
// //   const [confirmOpen, setConfirmOpen] = useState(false);
// //   const [confirmContent, setConfirmContent] = useState<React.ReactNode>("");
// //   const [confirmResolver, setConfirmResolver] = useState<((ok: boolean) => void) | null>(null);

// //   const effectiveCountry = useMemo(() => (country || urlCountry || "").toLowerCase(), [country, urlCountry]);

// //   useEffect(() => {
// //     updateCategories();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [effectiveCountry]);

// //   useEffect(() => {
// //     updateSubcategories();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [category]);

// //   const capitalizeFirstLetter = (str: unknown) =>
// //     typeof str === "string" && str.length ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

// //   const [file1Month, setFile1Month] = useState("");
// //   const [file2Month, setFile2Month] = useState("");
// //   const [file1Year, setFile1Year] = useState("");
// //   const [file2Year, setFile2Year] = useState("");

// //   const monthMap: Record<string, string> = {
// //     Jan: "january",
// //     Feb: "february",
// //     Mar: "march",
// //     Apr: "april",
// //     May: "may",
// //     Jun: "june",
// //     Jul: "july",
// //     Aug: "august",
// //     Sep: "september",
// //     Oct: "october",
// //     Nov: "november",
// //     Dec: "december",
// //   };

// //   const getAvailableMonths = () => [
// //     "january",
// //     "february",
// //     "march",
// //     "april",
// //     "may",
// //     "june",
// //     "july",
// //     "august",
// //     "september",
// //     "october",
// //     "november",
// //     "december",
// //   ];

// //   const safeMonthIndexValue = (m: string) => {
// //     if (!m) return "";
// //     const idx = getAvailableMonths().findIndex((mon) => mon.toLowerCase() === String(m).toLowerCase());
// //     return idx >= 0 ? String(idx + 1) : "";
// //   };

// //   const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const file = e.target.files?.[0] ?? null;
// //     setFile1(file);

// //     if (file?.type === "text/csv") {
// //       const reader = new FileReader();
// //       reader.onload = (event) => {
// //         try {
// //           const content = event.target?.result;
// //           if (typeof content !== "string") throw new Error("Invalid file content");

// //           const rows = content.split("\n").map((row) => row.trim()).filter((row) => row !== "");

// //           if (rows.length <= 8) {
// //             window.alert("CSV file doesn't have enough data. Please check your file.");
// //             return;
// //           }

// //           const firstDataRow = rows[105];
// //           if (!firstDataRow) throw new Error("Expected data row not found at index 105.");

// //           const columns = firstDataRow.split(",").map((col) => col.replace(/"/g, "").trim());

// //           let monthName: string | undefined;
// //           let parsedYear: number | undefined;

// //           if (effectiveCountry === "uk") {
// //             const dateParts = columns[0]?.split(" ") || [];
// //             if (dateParts.length < 3) {
// //               window.alert("UK date format not recognized. You might've uploaded the wrong file.");
// //               return;
// //             }
// //             monthName = dateParts[1];
// //             parsedYear = parseInt(dateParts[2], 10);
// //           } else if (effectiveCountry === "us") {
// //             const dateValue = `${columns[0] ?? ""} ${columns[1] ?? ""}`;
// //             const dateRegex = /^([A-Za-z]+) (\d{1,2}),? (\d{4})/;
// //             const match = dateValue.match(dateRegex);
// //             if (!match) {
// //               window.alert("US date format not recognized. Please check the file.");
// //               return;
// //             }
// //             monthName = match[1];
// //             parsedYear = parseInt(match[3], 10);
// //           } else {
// //             window.alert("Unsupported country format.");
// //             return;
// //           }

// //           const monthFullName = monthMap[monthName!];
// //           if (!monthFullName) {
// //             window.alert("Month name not recognized. Please check if the file is correct.");
// //             return;
// //           }

// //           setYear(String(parsedYear));
// //           setMonth(monthFullName);
// //           setFile1Month(monthFullName);
// //           setFile1Year(String(parsedYear));
// //         } catch (err) {
// //           console.error("Error while parsing file:", err);
// //           window.alert("⚠️ You might have mistakenly uploaded an **Inventory** file in the **MTD Sales** section. Please upload the correct file.");
// //         }
// //       };
// //       reader.readAsText(file);
// //     }
// //   };

// //   const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     const file = e.target.files?.[0] ?? null;

// //     const allowedTypes = [
// //       "application/vnd.ms-excel",
// //       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
// //       "text/csv",
// //     ];
// //     if (file && !allowedTypes.includes(file.type)) {
// //       window.alert("Please upload a valid Excel or CSV file.");
// //       return;
// //     }

// //     setFile2(file);

// //     if (file?.type === "text/csv") {
// //       const reader = new FileReader();
// //       reader.onload = (event) => {
// //         const content = event.target?.result;
// //         if (typeof content !== "string") return;

// //         const rows = content.split("\n").map((row) => row.trim()).filter((row) => row !== "");
// //         const firstRow = rows[1] || "";
// //         const columns = firstRow.split(",");

// //         const dateValue = columns[0];
// //         if (dateValue) {
// //           const date = new Date(dateValue);
// //           if (!isNaN(date.getTime())) {
// //             const parsedMonth = date.toLocaleString("en-US", { month: "long" }).toLowerCase();
// //             const parsedYear = String(date.getFullYear());
// //             setYear(parsedYear);
// //             setMonth(parsedMonth);
// //             setFile2Month(parsedMonth);
// //             setFile2Year(parsedYear);
// //           }
// //         }
// //       };
// //       reader.readAsText(file);
// //     }
// //   };

// //   // Mismatch warning
// //   useEffect(() => {
// //     const bothMonthsLoaded = !!file1Month && !!file2Month;
// //     const bothYearsLoaded = !!file1Year && !!file2Year;

// //     if (bothMonthsLoaded || bothYearsLoaded) {
// //       const monthMismatch = file1Month !== file2Month;
// //       const yearMismatch = file1Year !== file2Year;

// //       if (monthMismatch || yearMismatch) {
// //         const alertParts: string[] = [];
// //         if (monthMismatch)
// //           alertParts.push(`🚫 You are uploading MTD file of '${file1Month}' but Inventory file of '${file2Month}'.`);
// //         if (yearMismatch)
// //           alertParts.push(`🚫 The year in MTD file is '${file1Year}' but in Inventory file it's '${file2Year}'.`);

// //         const confirmed = window.confirm(`${alertParts.join("\n")}\nAre you sure you want to proceed with the upload?`);

// //         if (!confirmed) {
// //           window.alert(`We prefer not to proceed this way!`);
// //         } else {
// //           console.log("User confirmed, proceeding...");
// //         }
// //         window.location.reload();
// //       }
// //     }
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [file1Month, file2Month, file1Year, file2Year]);

// //   const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
// //     const numeric = Number(e.target.value);
// //     if (!numeric) {
// //       setMonth("");
// //       return;
// //     }
// //     const idx = numeric - 1;
// //     const months = getAvailableMonths();
// //     setMonth(months[idx]);
// //   };

// //   const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
// //     const selectedYear = e.target.value;
// //     setYear(selectedYear);
// //     if (selectedYear === String(currentYear)) {
// //       setMonth("");
// //     }
// //   };

// //   const updateCategories = () => {
// //     let options: string[] = [];
// //     if ((effectiveCountry || "").toUpperCase() === "INDIA") {
// //       options = ["Health", "Beauty"];
// //     } else {
// //       options = ["Select Category"];
// //     }
// //     setCategories(options);
// //     setCategory(options.includes(category) ? category : "");
// //   };

// //   const updateSubcategories = () => {
// //     let options: string[] = [];
// //     if (category === "Health") {
// //       options = ["Lubricants", "Intimate Hygiene"];
// //     } else if (category === "Beauty") {
// //       options = ["Shampoo", "Soap"];
// //     } else {
// //       options = ["Select Subcategory"];
// //     }
// //     setSubcategories(options);
// //     setSubcategory(options.includes(subcategory) ? subcategory : "");
// //   };

// //   /** ========= Modal helpers (replaces Modalmsg) ========= */
// //   const confirmWithModal = (message: React.ReactNode) =>
// //     new Promise<boolean>((resolve) => {
// //       setConfirmContent(message);
// //       setConfirmResolver(() => resolve);
// //       setConfirmOpen(true);
// //     });

// //   const closeConfirm = (result: boolean) => {
// //     setConfirmOpen(false);
// //     const fn = confirmResolver;
// //     setConfirmResolver(null);
// //     if (fn) fn(result);
// //   };
// //   /** ===================================================== */

// //   const submitForm = async () => {
// //     const formData = new FormData();
// //     if (file1) formData.append("file1", file1);
// //     if (file2) formData.append("file2", file2);
// //     formData.append("transit_time", String(transitTime));
// //     formData.append("stock_unit", String(stockUnit));
// //     formData.append("country", effectiveCountry);
// //     formData.append("category", category);
// //     formData.append("subcategory", subcategory);
// //     formData.append("year", year);
// //     formData.append("month", month);
// //     if (profile?.id != null) formData.append("profile_id", String(profile.id));

// //     const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

// //     const response = await fetch("http://127.0.0.1:5000/upload", {
// //       method: "POST",
// //       headers: token ? { Authorization: `Bearer ${token}` } : undefined,
// //       body: formData,
// //     });

// //     const contentType = response.headers.get("Content-Type");
// //     if (!contentType || !contentType.includes("application/json")) {
// //       throw new Error("Unexpected response from server");
// //     }

// //     const responseData = await response.json();

// //     localStorage.setItem("excelFileData", responseData.excel_file ?? "");
// //     localStorage.setItem("pnlReport", responseData.pnl_report ?? "");
// //     localStorage.setItem("totalSales", responseData.total_sales ?? "");
// //     localStorage.setItem("totalProfit", responseData.total_profit ?? "");
// //     localStorage.setItem("totalFbaFees", responseData.total_fba_fees ?? "");
// //     localStorage.setItem("totalExpense", responseData.total_expense ?? "");
// //     localStorage.setItem("platformfee", responseData.platform_fee ?? responseData.otherwplatform ?? "");
// //     localStorage.setItem("expenseChart", responseData.expense_chart_img ?? "");
// //     localStorage.setItem("salesChart", responseData.sales_chart_img ?? "");

// //     if (urlCountry) {
// //       localStorage.removeItem(`forecast-${urlCountry}`);
// //       localStorage.removeItem(`forecast-time-${urlCountry}`);
// //     }
// //     localStorage.removeItem("mergedInventoryData");

// //     return responseData;
// //   };

// //   const handleCombinedSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     setError("");

// //     if (!file1 || !file2) {
// //       setError("Please upload both files.");
// //       return;
// //     }
// //     if (!effectiveCountry) {
// //       setError("Country is missing. Please open this page with a country selected.");
// //       return;
// //     }

// //     const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

// //     try {
// //       const historyResponse = await fetch("http://127.0.0.1:5000/upload_history", {
// //         method: "GET",
// //         headers: token ? { Authorization: `Bearer ${token}` } : undefined,
// //       });

// //       const historyData = await historyResponse.json();

// //       const existingUpload = Array.isArray(historyData?.uploads)
// //         ? historyData.uploads.find(
// //             (upload: any) =>
// //               String(upload?.year) === String(year) &&
// //               String(upload?.month ?? "").toLowerCase() === String(month).toLowerCase() &&
// //               String(upload?.country ?? "").toLowerCase() === effectiveCountry
// //           )
// //         : null;

// //       if (existingUpload) {
// //         const confirmed = await confirmWithModal(
// //           <>
// //             You have already uploaded data for <b>{capitalizeFirstLetter(month)}/{year}</b> in{" "}
// //             <b>{effectiveCountry.toUpperCase()}</b>.
// //             <br />
// //             Do you want to replace the previous file?
// //           </>
// //         );
// //         if (!confirmed) {
// //           window.location.reload();
// //           return;
// //         }
// //       }

// //       setIsUploading(true);
// //       await submitForm();

// //       const ranged = "MTD";
// //       router.push(`/country/${ranged}/${effectiveCountry}/${month}/${year}`);

// //       onComplete?.();
// //     } catch (err) {
// //       console.error("There was a problem with the file upload:", err);
// //       setError("Upload failed. Please try again.");
// //     } finally {
// //       setIsUploading(false);
// //     }
// //   };

// //   return (
// //     <>
// //       <div className="w-full h-full overflow-y-auto flex flex-col items-center">
// //         <div className="w-full flex justify-center px-3 md:px-5 lg:px-8">
// //           <div className="w-full max-w-[830px] border-2 border-emerald-500 shadow-md shadow-emerald-500/40 rounded-xl bg-white mt-2 md:mt-4 p-4 md:p-5 lg:p-6 text-[13px] md:text-[14px]">
// //             <h2 className="text-center text-2xl md:text-3xl font-semibold text-[#5EA68E] my-3 md:my-4">
// //               Upload File <i className="fa-solid fa-cloud-arrow-up" />
// //             </h2>

// //             <form onSubmit={handleCombinedSubmit} encType="multipart/form-data" className="space-y-5 md:space-y-6">
// //               {/* File inputs */}
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
// //                 {/* File 1 */}
// //                 <div className="space-y-1.5">
// //                   <label className="block text-xs font-medium">Month to Date Amazon Report:</label>

// //                   <div
// //                     className={`relative h-[160px] md:h-[170px] w-full border border-neutral-700 rounded-xl bg-white flex items-center justify-center overflow-hidden ${
// //                       file1 ? "ring-2 ring-emerald-500" : ""
// //                     }`}
// //                   >
// //                     <input
// //                       type="file"
// //                       id="file1"
// //                       name="file1"
// //                       onChange={handleFileChange1}
// //                       accept=".xls,.xlsx,.csv"
// //                       required
// //                       className="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-20"
// //                     />
// //                     <img
// //                       src="/uploadbox.png"
// //                       alt="file-icon"
// //                       className="pointer-events-none w-[36vw] max-w-[180px] min-w-[90px] opacity-70"
// //                     />
// //                     {file1 && (
// //                       <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[90%] text-center px-2 text-neutral-800 font-medium break-words text-xs md:text-sm">
// //                         {file1.name}
// //                       </p>
// //                     )}
// //                   </div>

// //                   <p className="text-emerald-600 font-semibold text-[11px] md:text-xs m-0">
// //                     Amazon → Seller Central → Payments → Reports Repository → Report Type Transactions → Select Month
// //                   </p>
// //                 </div>

// //                 {/* File 2 */}
// //                 <div className="space-y-1.5">
// //                   <label className="block text-xs font-medium">Monthly End Inventory File:</label>

// //                   <div
// //                     className={`relative h-[160px] md:h-[170px] w-full border border-neutral-700 rounded-xl bg-white flex items-center justify-center overflow-hidden ${
// //                       file2 ? "ring-2 ring-emerald-500" : ""
// //                     }`}
// //                   >
// //                     <input
// //                       type="file"
// //                       id="file2"
// //                       name="file2"
// //                       onChange={handleFileChange2}
// //                       accept=".xls,.xlsx,.csv"
// //                       required
// //                       className="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-20"
// //                     />
// //                     <img
// //                       src="/uploadbox.png"
// //                       alt="file-icon"
// //                       className="pointer-events-none w-[36vw] max-w-[180px] min-w-[90px] opacity-70"
// //                     />
// //                     {file2 && (
// //                       <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[90%] text-center px-2 text-neutral-800 font-medium break-words text-xs md:text-sm">
// //                         {file2.name}
// //                       </p>
// //                     )}
// //                   </div>

// //                   <p className="text-emerald-600 font-semibold text-[11px] md:text-xs m-0">
// //                     Amazon → Seller Central → Reports → Fulfilment by amazon → Inventory Ledger → Download
// //                   </p>
// //                   <p className="italic text-neutral-600 text-[11px] md:text-xs m-0">
// //                     *Summary View - Aggregate report by Country. Select last day of the previous month and download in .csv format
// //                   </p>
// //                 </div>
// //               </div>

// //               {error && <p className="text-red-600 text-xs">{error}</p>}

// //               {/* Country (read-only) */}
// //               <div className="relative">
// //                 <img src="/cntryIcon.png" aria-hidden className="h-5 md:h-6 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
// //                 <input
// //                   type="text"
// //                   name="country"
// //                   id="country"
// //                   value={(effectiveCountry || "").toUpperCase()}
// //                   readOnly
// //                   className="mt-2 w-full rounded-xl border border-neutral-700 pl-11 pr-3 py-2.5 text-sm md:text-[15px] focus:outline-none"
// //                 />
// //               </div>

// //               {/* Year + Month */}
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4">
// //                 <div className="relative">
// //                   <img src="/timeIcon.png" aria-hidden className="h-5 md:h-6 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
// //                   <select
// //                     id="year"
// //                     name="year"
// //                     value={year}
// //                     onChange={handleYearChange}
// //                     required
// //                     className="mt-2 w-full rounded-xl border border-neutral-700 pl-11 pr-3 py-2.5 text-sm md:text-[15px] focus:outline-none"
// //                   >
// //                     <option value="">Select Year</option>
// //                     {years.map((yy) => (
// //                       <option key={yy} value={yy}>
// //                         {yy}
// //                       </option>
// //                     ))}
// //                   </select>
// //                 </div>

// //                 <div className="relative">
// //                   <img src="/timeIcon.png" aria-hidden className="h-5 md:h-6 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
// //                   <select
// //                     id="month"
// //                     name="month"
// //                     value={safeMonthIndexValue(month)}
// //                     onChange={handleMonthChange}
// //                     required
// //                     className="mt-2 w-full rounded-xl border border-neutral-700 pl-11 pr-3 py-2.5 text-sm md:text-[15px] focus:outline-none"
// //                   >
// //                     <option value="">Select Month</option>
// //                     {getAvailableMonths().map((m, index) => (
// //                       <option key={m} value={index + 1}>
// //                         {capitalizeFirstLetter(m)}
// //                       </option>
// //                     ))}
// //                   </select>
// //                 </div>
// //               </div>

// //               <button
// //                 type="submit"
// //                 className="w-full rounded-md bg-slate-700 text-[#f8edcf] shadow-md py-2.5 md:py-3 text-sm md:text-[15px] font-medium hover:bg-slate-800 transition disabled:opacity-60"
// //                 disabled={isUploading}
// //               >
// //                 Upload
// //               </button>

// //               {isUploading && (
// //                 <div className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-md bg-black/30">
// //                   <div className="w-[120px] md:w-[140px] h-auto flex items-center justify-center overflow-hidden">
// //                     <video src="/infinity2.webm" autoPlay muted loop playsInline className="w-full h-auto" />
// //                   </div>
// //                   <div className="mt-4 text-white text-sm md:text-base">Uploading...</div>
// //                 </div>
// //               )}
// //             </form>
// //           </div>
// //         </div>
// //       </div>

// //       {/* ✅ Inline confirm modal using your Modal component */}
//     //   <Modal
//     //     isOpen={confirmOpen}
//     //     onClose={() => closeConfirm(false)}
//     //     className="max-w-md mx-auto p-5"
//     //     showCloseButton
//     //   >
//     //     <div className="p-2">
//     //       <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">Replace previous upload?</h3>
//     //       <div className="text-sm text-gray-600 dark:text-gray-300">{confirmContent}</div>

//     //       <div className="mt-5 flex items-center justify-end gap-2">
//     //         <button
//     //           type="button"
//     //           onClick={() => closeConfirm(false)}
//     //           className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
//     //         >
//     //           Cancel
//     //         </button>
//     //         <button
//     //           type="button"
//     //           onClick={() => closeConfirm(true)}
//     //           className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
//     //         >
//     //           Replace
//     //         </button>
//     //       </div>
//     //     </div>
//     //   </Modal>
// //     </>
// //   );
// // };

// // export default FileUploadForm;






























// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Modalmsg from "@/components/ui/modal/Modalmsg";

// const FileUploadForm: React.FC = () => {
//   // ---------------- Next.js routing ----------------
//   const router = useRouter();
//   const params = useParams<{ countryName?: string }>();
//   const countryName = params?.countryName ?? "";

//   // ---------------- profile: localStorage fallback ----------------
//   const profile = React.useMemo(() => {
//     try {
//       if (typeof window === "undefined") return {};
//       // if you previously stashed the profile when navigating, retrieve it here
//       const raw = localStorage.getItem("profile");
//       return raw ? JSON.parse(raw) : {};
//     } catch {
//       return {};
//     }
//   }, []);

//   // ---------------- UI / state ----------------
//   const [isUploading, setIsUploading] = useState(false);
//   const [error, setError] = useState("");

//   const currentYear = new Date().getFullYear();
//   const years = Array.from({ length: 2 }, (_, i) => currentYear - 1 + i);

//   const [file1, setFile1] = useState<File | null>(null);
//   const [file2, setFile2] = useState<File | null>(null);
//   const [transitTime] = useState<string>(profile.transitTime || "");
//   const [stockUnit] = useState<string>(profile.stockUnit || "");
//   const [country] = useState<string>(profile.country || "");
//   const [category, setCategory] = useState<string>(profile.category || "");
//   const [subcategory, setSubcategory] = useState<string>(profile.subcategory || "");
//   const [categories, setCategories] = useState<string[]>([]);
//   const [subcategories, setSubcategories] = useState<string[]>([]);
//   const [year, setYear] = useState<string>("");
//   const [month, setMonth] = useState<string>("");
//   const [, setUploadedMonths] = useState<string[]>(profile.months || []);

//   const [modalMessage, setModalMessage] = useState<React.ReactNode>("");
//   const [showModal, setShowModal] = useState(false);
//   const [modalPromise, setModalPromise] = useState<null | ((value: boolean) => void)>(null);

//   // 🔑 One source of truth for country: from profile -> URL param
//   const effectiveCountry = useMemo(
//     () => (country || countryName || "").toLowerCase(),
//     [country, countryName]
//   );

//   useEffect(() => {
//     updateCategories();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [effectiveCountry]);

//   useEffect(() => {
//     updateSubcategories();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [category]);

//   const capitalizeFirstLetter = (str: unknown) =>
//     typeof str === "string"
//       ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
//       : "";

//   // ---------------- CSV heuristics ----------------
//   const [file1Month, setFile1Month] = useState("");
//   const [file2Month, setFile2Month] = useState("");
//   const [file1Year, setFile1Year] = useState("");
//   const [file2Year, setFile2Year] = useState("");

//   const monthMap: Record<string, string> = {
//     Jan: "january",
//     Feb: "february",
//     Mar: "march",
//     Apr: "april",
//     May: "may",
//     Jun: "june",
//     Jul: "july",
//     Aug: "august",
//     Sep: "september",
//     Oct: "october",
//     Nov: "november",
//     Dec: "december",
//   };

//   const getAvailableMonths = () => ([
//     "january","february","march","april","may","june",
//     "july","august","september","october","november","december",
//   ]);

//   const safeMonthIndexValue = (m: string) => {
//     if (!m) return "";
//     const idx = getAvailableMonths().findIndex(
//       (mon) => mon.toLowerCase() === m.toLowerCase()
//     );
//     return idx >= 0 ? String(idx + 1) : "";
//   };

//   // ---------------- File handlers ----------------
//   const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     setFile1(file || null);

//     if (file?.type === "text/csv") {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         try {
//           const content = event.target?.result;
//           if (typeof content !== "string") throw new Error("Invalid file content");

//           const rows = content
//             .split("\n")
//             .map((row) => row.trim())
//             .filter((row) => row !== "");

//           if (rows.length <= 8) {
//             alert("CSV file doesn't have enough data. Please check your file.");
//             return;
//           }

//           const firstDataRow = rows[105];
//           if (!firstDataRow) throw new Error("Expected data row not found at index 105.");

//           const columns = firstDataRow
//             .split(",")
//             .map((col) => col.replace(/"/g, "").trim());

//           let monthName: string | undefined;
//           let parsedYear: number | undefined;

//           if (effectiveCountry === "uk") {
//             const dateParts = columns[0]?.split(" ") || [];
//             if (dateParts.length < 3) {
//               alert("UK date format not recognized. You might've uploaded the wrong file.");
//               return;
//             }
//             monthName = dateParts[1];
//             parsedYear = parseInt(dateParts[2], 10);
//           } else if (effectiveCountry === "us") {
//             const dateValue = `${columns[0] ?? ""} ${columns[1] ?? ""}`;
//             const dateRegex = /^([A-Za-z]+) (\d{1,2}),? (\d{4})/;
//             const match = dateValue.match(dateRegex);
//             if (!match) {
//               alert("US date format not recognized. Please check the file.");
//               return;
//             }
//             monthName = match[1];
//             parsedYear = parseInt(match[3], 10);
//           } else {
//             alert("Unsupported country format.");
//             return;
//           }

//           const monthFullName = monthMap[monthName!];
//           if (!monthFullName) {
//             alert("Month name not recognized. Please check if the file is correct.");
//             return;
//           }

//           setYear(String(parsedYear));
//           setMonth(monthFullName);
//           setFile1Month(monthFullName);
//           setFile1Year(String(parsedYear));
//         } catch (err) {
//           console.error("Error while parsing file:", err);
//           alert(
//             "⚠️ You might have mistakenly uploaded an **Inventory** file in the **MTD Sales** section. Please upload the correct file."
//           );
//         }
//       };
//       reader.readAsText(file);
//     }
//   };

//   const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];

//     const allowedTypes = [
//       "application/vnd.ms-excel",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       "text/csv",
//     ];
//     if (file && !allowedTypes.includes(file.type)) {
//       alert("Please upload a valid Excel or CSV file.");
//       return;
//     }

//     setFile2(file || null);

//     if (file?.type === "text/csv") {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         const content = event.target?.result;
//         if (typeof content !== "string") return;

//         const rows = content
//           .split("\n")
//           .map((row) => row.trim())
//           .filter((row) => row !== "");
//         const firstRow = rows[1] || "";
//         const columns = firstRow.split(",");

//         const dateValue = columns[0];
//         if (dateValue) {
//           const date = new Date(dateValue);
//           if (!isNaN(date.getTime())) {
//             const parsedMonth = date
//               .toLocaleString("en-US", { month: "long" })
//               .toLowerCase();
//             const parsedYear = String(date.getFullYear());
//             setYear(parsedYear);
//             setMonth(parsedMonth);
//             setFile2Month(parsedMonth);
//             setFile2Year(parsedYear);
//           }
//         }
//       };
//       reader.readAsText(file);
//     }
//   };

//   // ---------------- mismatch warning ----------------
//   useEffect(() => {
//     const bothMonthsLoaded = !!file1Month && !!file2Month;
//     const bothYearsLoaded = !!file1Year && !!file2Year;

//     if (bothMonthsLoaded || bothYearsLoaded) {
//       const monthMismatch = file1Month !== file2Month;
//       const yearMismatch = file1Year !== file2Year;

//       if (monthMismatch || yearMismatch) {
//         const alertParts: string[] = [];
//         if (monthMismatch)
//           alertParts.push(
//             `🚫 You are uploading MTD file of '${file1Month}' but Inventory file of '${file2Month}'.`
//           );
//         if (yearMismatch)
//           alertParts.push(
//             `🚫 The year in MTD file is '${file1Year}' but in Inventory file it's '${file2Year}'.`
//           );

//         const confirmed = window.confirm(
//           `${alertParts.join("\n")}\nAre you sure you want to proceed with the upload?`
//         );

//         if (!confirmed) {
//           alert(`We prefer not to proceed this way!`);
//         } else {
//           console.log("User confirmed, proceeding...");
//         }
//         window.location.reload();
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [file1Month, file2Month, file1Year, file2Year]);

//   // ---------------- selects ----------------
//   const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const numeric = Number(e.target.value); // "1".."12"
//     if (!numeric) {
//       setMonth("");
//       return;
//     }
//     const idx = numeric - 1;
//     const months = getAvailableMonths();
//     setMonth(months[idx]);
//   };

//   const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedYear = e.target.value;
//     setYear(selectedYear);
//     if (selectedYear === String(currentYear)) {
//       setMonth("");
//     }
//   };

//   const updateCategories = () => {
//     let options: string[] = [];
//     if ((effectiveCountry || "").toUpperCase() === "INDIA") {
//       options = ["Health", "Beauty"];
//     } else {
//       options = ["Select Category"];
//     }
//     setCategories(options);
//     setCategory(options.includes(category) ? category : "");
//   };

//   const updateSubcategories = () => {
//     let options: string[] = [];
//     if (category === "Health") {
//       options = ["Lubricants", "Intimate Hygiene"];
//     } else if (category === "Beauty") {
//       options = ["Shampoo", "Soap"];
//     } else {
//       options = ["Select Subcategory"];
//     }
//     setSubcategories(options);
//     setSubcategory(options.includes(subcategory) ? subcategory : "");
//   };

//   // ---------------- modal helpers ----------------
//   const confirmWithModal = (message: React.ReactNode) =>
//     new Promise<boolean>((resolve) => {
//       setModalMessage(message);
//       setShowModal(true);
//       setModalPromise(() => resolve);
//     });

//   // ---------------- submit ----------------
//   const handleCombinedSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     if (!file1 || !file2) {
//       setError("Please upload both files.");
//       return;
//     }
//     if (!effectiveCountry) {
//       setError("Country is missing. Please open this page with a country selected.");
//       return;
//     }

//     const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

//     try {
//       const historyResponse = await fetch("http://127.0.0.1:5000/upload_history", {
//         method: "GET",
//         headers: token ? { Authorization: `Bearer ${token}` } : {},
//       });

//       const historyData = await historyResponse.json();

//       const existingUpload = Array.isArray(historyData?.uploads)
//         ? historyData.uploads.find(
//             (upload: any) =>
//               String(upload?.year) === String(year) &&
//               String(upload?.month || "").toLowerCase() === String(month || "").toLowerCase() &&
//               String(upload?.country || "").toLowerCase() === effectiveCountry
//           )
//         : null;

//       if (existingUpload) {
//         const confirmed = await confirmWithModal(
//           <>
//             You have already uploaded data for {capitalizeFirstLetter(month)}/{year} in{" "}
//             {effectiveCountry.toUpperCase()}.
//             <br />
//             Do you want to replace the previous file?
//           </>
//         );

//         if (!confirmed) {
//           window.location.reload();
//           return;
//         }
//       }

//       setIsUploading(true);
//       const responseData = await submitForm();

//       // In Next.js we can’t push route state; use localStorage (same pattern as your other Next code)
//       if (typeof window !== "undefined") {
//         localStorage.setItem("salesChart", responseData.sales_chart_img ?? "");
//         localStorage.setItem("expenseChart", responseData.expense_chart_img ?? "");
//         localStorage.setItem("pnlReport", responseData.pnl_report ?? "");
//         localStorage.setItem("totalSales", responseData.total_sales ?? "");
//         localStorage.setItem("totalProfit", responseData.total_profit ?? "");
//         localStorage.setItem("totalFbaFees", responseData.total_fba_fees ?? "");
//         localStorage.setItem(
//           "platformfee",
//           responseData.platform_fee ?? responseData.otherwplatform ?? ""
//         );
//         localStorage.setItem("excelFileData", responseData.excel_file ?? "");
//         localStorage.setItem("mergedInventoryData", JSON.stringify(responseData.merged_inventory ?? null));
//       }

//       const ranged = "MTD";
//       router.push(`/country/${ranged}/${effectiveCountry}/${month}/${year}`);
//     } catch (err) {
//       console.error("There was a problem with the file upload:", err);
//       setError("Upload failed. Please try again.");
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const submitForm = async () => {
//     const formData = new FormData();
//     if (file1) formData.append("file1", file1);
//     if (file2) formData.append("file2", file2);
//     formData.append("transit_time", String(transitTime));
//     formData.append("stock_unit", String(stockUnit));
//     formData.append("country", effectiveCountry);
//     formData.append("category", category);
//     formData.append("subcategory", subcategory);
//     formData.append("year", year);
//     formData.append("month", month);
//     if ((profile as any)?.id != null) formData.append("profile_id", String((profile as any).id));

//     const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

//     const response = await fetch("http://127.0.0.1:5000/upload", {
//       method: "POST",
//       headers: token ? { Authorization: `Bearer ${token}` } : {},
//       body: formData, // let the browser set Content-Type with boundary
//     });

//     const contentType = response.headers.get("Content-Type") || "";
//     if (!response.ok) {
//       // surface server JSON error if present
//       if (contentType.includes("application/json")) {
//         const data = await response.json();
//         throw new Error(data?.message || "Server error");
//       }
//       throw new Error(`HTTP ${response.status}`);
//     }

//     if (contentType.includes("application/json")) {
//       const responseData = await response.json();

//       // Clear stale forecast keys keyed by URL country
//       if (countryName) {
//         localStorage.removeItem(`forecast-${countryName}`);
//         localStorage.removeItem(`forecast-time-${countryName}`);
//       }
//       localStorage.removeItem("mergedInventoryData");

//       return responseData;
//     }
//     throw new Error("Unexpected response from server");
//   };

//   // ---------------- Render ----------------
//   return (
//     <>
//       <div className="w-full h-full overflow-y-auto flex flex-col items-center">
//         <div className="w-full flex justify-center px-3 md:px-5 lg:px-8">
//           <div className="w-full max-w-[830px] border-2 border-emerald-500 shadow-md shadow-emerald-500/40 rounded-xl bg-white mt-2 md:mt-4 p-4 md:p-5 lg:p-6 text-[13px] md:text-[14px]">
//             <h2 className="text-center text-2xl md:text-3xl font-semibold text-[#5EA68E] my-3 md:my-4">
//               Upload File <i className="fa-solid fa-cloud-arrow-up" />
//             </h2>

//             <form onSubmit={handleCombinedSubmit} encType="multipart/form-data" className="space-y-5 md:space-y-6">
//               {/* File inputs */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
//                 {/* File 1 */}
//                 <div className="space-y-1.5">
//                   <label className="block text-xs font-medium">Month to Date Amazon Report:</label>

//                   <div
//                     className={`relative h-[160px] md:h-[170px] w-full border border-neutral-700 rounded-xl bg-white flex items-center justify-center overflow-hidden ${
//                       file1 ? "ring-2 ring-emerald-500" : ""
//                     }`}
//                   >
//                     <input
//                       type="file"
//                       id="file1"
//                       name="file1"
//                       onChange={handleFileChange1}
//                       accept=".xls,.xlsx,.csv"
//                       required
//                       className="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-20"
//                     />
//                     <img
//                       src="/uploadbox.png"
//                       alt="file-icon"
//                       className="pointer-events-none w-[36vw] max-w-[180px] min-w-[90px] opacity-70"
//                     />
//                     {file1 && (
//                       <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[90%] text-center px-2 text-neutral-800 font-medium break-words text-xs md:text-sm">
//                         {file1.name}
//                       </p>
//                     )}
//                   </div>

//                   <p className="text-emerald-600 font-semibold text-[11px] md:text-xs m-0">
//                     Amazon → Seller Central → Payments → Reports Repository → Report Type Transactions → Select Month
//                   </p>
//                 </div>

//                 {/* File 2 */}
//                 <div className="space-y-1.5">
//                   <label className="block text-xs font-medium">Monthly End Inventory File:</label>

//                   <div
//                     className={`relative h-[160px] md:h-[170px] w-full border border-neutral-700 rounded-xl bg-white flex items-center justify-center overflow-hidden ${
//                       file2 ? "ring-2 ring-emerald-500" : ""
//                     }`}
//                   >
//                     <input
//                       type="file"
//                       id="file2"
//                       name="file2"
//                       onChange={handleFileChange2}
//                       accept=".xls,.xlsx,.csv"
//                       required
//                       className="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-20"
//                     />
//                     <img
//                       src="/uploadbox.png"
//                       alt="file-icon"
//                       className="pointer-events-none w-[36vw] max-w-[180px] min-w-[90px] opacity-70"
//                     />
//                     {file2 && (
//                       <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[90%] text-center px-2 text-neutral-800 font-medium break-words text-xs md:text-sm">
//                         {file2.name}
//                       </p>
//                     )}
//                   </div>

//                   <p className="text-emerald-600 font-semibold text-[11px] md:text-xs m-0">
//                     Amazon → Seller Central → Reports → Fulfilment by amazon → Inventory Ledger → Download
//                   </p>
//                   <p className="italic text-neutral-600 text-[11px] md:text-xs m-0">
//                     *Summary View - Aggregate report by Country. Select last day of the previous month and download in .csv format
//                   </p>
//                 </div>
//               </div>

//               {error && <p className="text-red-600 text-xs">{error}</p>}

//               {/* Country (read-only) */}
//               <div className="relative">
//                 <img
//                   src="/cntryIcon.png"
//                   aria-hidden
//                   className="h-5 md:h-6 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
//                 />
//                 <input
//                   type="text"
//                   name="country"
//                   id="country"
//                   value={(effectiveCountry || "").toUpperCase()}
//                   readOnly
//                   className="mt-2 w-full rounded-xl border border-neutral-700 pl-11 pr-3 py-2.5 text-sm md:text-[15px] focus:outline-none"
//                 />
//               </div>

//               {/* Year + Month */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4">
//                 <div className="relative">
//                   <img
//                     src="/timeIcon.png"
//                     aria-hidden
//                     className="h-5 md:h-6 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
//                   />
//                   <select
//                     id="year"
//                     name="year"
//                     value={year}
//                     onChange={handleYearChange}
//                     required
//                     className="mt-2 w-full rounded-xl border border-neutral-700 pl-11 pr-3 py-2.5 text-sm md:text-[15px] focus:outline-none"
//                   >
//                     <option value="">Select Year</option>
//                     {years.map((yy) => (
//                       <option key={yy} value={yy}>
//                         {yy}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="relative">
//                   <img
//                     src="/timeIcon.png"
//                     aria-hidden
//                     className="h-5 md:h-6 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
//                   />
//                   <select
//                     id="month"
//                     name="month"
//                     value={safeMonthIndexValue(month)}
//                     onChange={handleMonthChange}
//                     required
//                     className="mt-2 w-full rounded-xl border border-neutral-700 pl-11 pr-3 py-2.5 text-sm md:text-[15px] focus:outline-none"
//                   >
//                     <option value="">Select Month</option>
//                     {getAvailableMonths().map((m, index) => (
//                       <option key={m} value={index + 1}>
//                         {capitalizeFirstLetter(m)}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <button
//                 type="submit"
//                 className="w-full rounded-md bg-slate-700 text-[#f8edcf] shadow-md py-2.5 md:py-3 text-sm md:text-[15px] font-medium hover:bg-slate-800 transition disabled:opacity-60"
//                 disabled={isUploading}
//               >
//                 Upload
//               </button>

//               {isUploading && (
//                 <div className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-md bg-black/30">
//                   <div className="w-[120px] md:w-[140px] h-auto flex items-center justify-center overflow-hidden">
//                     <video
//                       src="/infinity2.webm"
//                       autoPlay
//                       muted
//                       loop
//                       playsInline
//                       className="w-full h-auto"
//                     />
//                   </div>
//                   <div className="mt-4 text-white text-sm md:text-base">Uploading...</div>
//                 </div>
//               )}
//             </form>
//           </div>
//         </div>

//         {/* Modal Component */}
//         <Modalmsg
//           show={showModal}
//           message={modalMessage}
//           onClose={() => {
//             setShowModal(false);
//             if (modalPromise) modalPromise(true);
//           }}
//           onCancel={() => {
//             setShowModal(false);
//             if (modalPromise) modalPromise(false);
//           }}
//         />
//       </div>
//     </>
//   );
// };

// export default FileUploadForm;







// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { useParams, useRouter } from "next/navigation";

// // Types for optional profile state we previously received via react-router
// type Profile = {
//   id?: number | string;
//   transitTime?: string;
//   stockUnit?: string;
//   country?: string;
//   category?: string;
//   subcategory?: string;
//   months?: string[];
// };

// const FileUploadForm: React.FC = () => {
//   // ------- Next.js routing -------
//   const router = useRouter();
//   const params = useParams<{ countryName?: string }>();
//   const countryName = params?.countryName ?? "";

//   // In Next.js App Router there is no location.state; mimic prior behavior using localStorage
//   // If you previously stashed the profile when navigating, retrieve it here
//   const profile: Profile = useMemo(() => {
//     try {
//       if (typeof window === "undefined") return {};
//       const raw = localStorage.getItem("profile");
//       return raw ? (JSON.parse(raw) as Profile) : {};
//     } catch {
//       return {};
//     }
//   }, []);

//   // ------- UI / state -------
//   const [isUploading, setIsUploading] = useState<boolean>(false);
//   const [error, setError] = useState<string>("");

//   const currentYear = new Date().getFullYear();
//   const years = Array.from({ length: 2 }, (_, i) => currentYear - 1 + i);

//   const [file1, setFile1] = useState<File | null>(null);
//   const [file2, setFile2] = useState<File | null>(null);
//   const [transitTime] = useState<string>(profile.transitTime || "");
//   const [stockUnit] = useState<string>(profile.stockUnit || "");
//   const [country] = useState<string>(profile.country || "");
//   const [category, setCategory] = useState<string>(profile.category || "");
//   const [subcategory, setSubcategory] = useState<string>(profile.subcategory || "");
//   const [categories, setCategories] = useState<string[]>([]);
//   const [subcategories, setSubcategories] = useState<string[]>([]);
//   const [year, setYear] = useState<string>("");
//   const [month, setMonth] = useState<string>("");
//   // keeping for parity with old code
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const [, setUploadedMonths] = useState<string[]>(profile.months || []);

//   const [modalMessage, setModalMessage] = useState<React.ReactNode>("");
//   const [showModal, setShowModal] = useState<boolean>(false);
//   const [modalPromise, setModalPromise] = useState<null | ((value: boolean) => void)>(null);

//   // 🔑 One source of truth for country: from profile -> URL param
//   const effectiveCountry = useMemo(
//     () => (country || countryName || "").toLowerCase(),
//     [country, countryName]
//   );

//   useEffect(() => {
//     updateCategories();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [effectiveCountry]);

//   useEffect(() => {
//     updateSubcategories();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [category]);

//   const capitalizeFirstLetter = (str: unknown) =>
//     typeof str === "string"
//       ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
//       : "";

//   // ------- CSV heuristics -------
//   const [file1Month, setFile1Month] = useState<string>("");
//   const [file2Month, setFile2Month] = useState<string>("");
//   const [file1Year, setFile1Year] = useState<string>("");
//   const [file2Year, setFile2Year] = useState<string>("");

//   const monthMap: Record<string, string> = {
//     Jan: "january",
//     Feb: "february",
//     Mar: "march",
//     Apr: "april",
//     May: "may",
//     Jun: "june",
//     Jul: "july",
//     Aug: "august",
//     Sep: "september",
//     Oct: "october",
//     Nov: "november",
//     Dec: "december",
//   };

//   const getAvailableMonths = () => [
//     "january",
//     "february",
//     "march",
//     "april",
//     "may",
//     "june",
//     "july",
//     "august",
//     "september",
//     "october",
//     "november",
//     "december",
//   ];

//   const safeMonthIndexValue = (m: string) => {
//     if (!m) return "";
//     const idx = getAvailableMonths().findIndex(
//       (mon) => mon.toLowerCase() === m.toLowerCase()
//     );
//     return idx >= 0 ? String(idx + 1) : "";
//   };

//   // ------- File handlers -------
//   const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0] || null;
//     setFile1(file);

//     if (file?.type === "text/csv") {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         try {
//           const content = event.target?.result;
//           if (typeof content !== "string") throw new Error("Invalid file content");

//           const rows = content
//             .split("\n")
//             .map((row) => row.trim())
//             .filter((row) => row !== "");

//           if (rows.length <= 8) {
//             alert("CSV file doesn't have enough data. Please check your file.");
//             return;
//           }

//           const firstDataRow = rows[105];
//           if (!firstDataRow) throw new Error("Expected data row not found at index 105.");

//           const columns = firstDataRow
//             .split(",")
//             .map((col) => col.replace(/"/g, "").trim());

//           let monthName: string | undefined;
//           let parsedYear: number | undefined;

//           if (effectiveCountry === "uk") {
//             const dateParts = columns[0]?.split(" ") || [];
//             if (dateParts.length < 3) {
//               alert("UK date format not recognized. You might've uploaded the wrong file.");
//               return;
//             }
//             monthName = dateParts[1];
//             parsedYear = parseInt(dateParts[2], 10);
//           } else if (effectiveCountry === "us") {
//             const dateValue = `${columns[0] ?? ""} ${columns[1] ?? ""}`;
//             const dateRegex = /^([A-Za-z]+) (\d{1,2}),? (\d{4})/;
//             const match = dateValue.match(dateRegex);
//             if (!match) {
//               alert("US date format not recognized. Please check the file.");
//               return;
//             }
//             monthName = match[1];
//             parsedYear = parseInt(match[3], 10);
//           } else {
//             alert("Unsupported country format.");
//             return;
//           }

//           const monthFullName = monthMap[monthName!];
//           if (!monthFullName) {
//             alert("Month name not recognized. Please check if the file is correct.");
//             return;
//           }

//           setYear(String(parsedYear));
//           setMonth(monthFullName);
//           setFile1Month(monthFullName);
//           setFile1Year(String(parsedYear));
//         } catch (err) {
//           console.error("Error while parsing file:", err);
//           alert(
//             "⚠️ You might have mistakenly uploaded an **Inventory** file in the **MTD Sales** section. Please upload the correct file."
//           );
//         }
//       };
//       reader.readAsText(file);
//     }
//   };

//   const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0] || null;

//     const allowedTypes = [
//       "application/vnd.ms-excel",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       "text/csv",
//     ];
//     if (file && !allowedTypes.includes(file.type)) {
//       alert("Please upload a valid Excel or CSV file.");
//       return;
//     }

//     setFile2(file);

//     if (file?.type === "text/csv") {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         const content = event.target?.result;
//         if (typeof content !== "string") return;

//         const rows = content
//           .split("\n")
//           .map((row) => row.trim())
//           .filter((row) => row !== "");
//         const firstRow = rows[1] || "";
//         const columns = firstRow.split(",");

//         const dateValue = columns[0];
//         if (dateValue) {
//           const date = new Date(dateValue);
//           if (!isNaN(date.getTime())) {
//             const parsedMonth = date
//               .toLocaleString("en-US", { month: "long" })
//               .toLowerCase();
//             const parsedYear = String(date.getFullYear());
//             setYear(parsedYear);
//             setMonth(parsedMonth);
//             setFile2Month(parsedMonth);
//             setFile2Year(parsedYear);
//           }
//         }
//       };
//       reader.readAsText(file);
//     }
//   };

//   // ------- mismatch warning -------
//   useEffect(() => {
//     const bothMonthsLoaded = !!file1Month && !!file2Month;
//     const bothYearsLoaded = !!file1Year && !!file2Year;

//     if (bothMonthsLoaded || bothYearsLoaded) {
//       const monthMismatch = file1Month !== file2Month;
//       const yearMismatch = file1Year !== file2Year;

//       if (monthMismatch || yearMismatch) {
//         const alertParts: string[] = [];
//         if (monthMismatch)
//           alertParts.push(
//             `🚫 You are uploading MTD file of '${file1Month}' but Inventory file of '${file2Month}'.`
//           );
//         if (yearMismatch)
//           alertParts.push(
//             `🚫 The year in MTD file is '${file1Year}' but in Inventory file it's '${file2Year}'.`
//           );

//         const confirmed = window.confirm(
//           `${alertParts.join("\n")}\nAre you sure you want to proceed with the upload?`
//         );

//         if (!confirmed) {
//           alert("We prefer not to proceed this way!");
//           window.location.reload();
//         } else {
//           // proceed without reloading
//           console.log("User confirmed, proceeding...");
//         }
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [file1Month, file2Month, file1Year, file2Year]);

//   // ------- selects -------
//   const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const numeric = Number(e.target.value); // "1".."12"
//     if (!numeric) {
//       setMonth("");
//       return;
//     }
//     const idx = numeric - 1;
//     const months = getAvailableMonths();
//     setMonth(months[idx]);
//   };

//   const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedYear = e.target.value;
//     setYear(selectedYear);
//     if (selectedYear === String(currentYear)) {
//       setMonth("");
//     }
//   };

//   const updateCategories = () => {
//     let options: string[] = [];
//     if ((effectiveCountry || "").toUpperCase() === "INDIA") {
//       options = ["Health", "Beauty"];
//     } else {
//       options = ["Select Category"];
//     }
//     setCategories(options);
//     setCategory(options.includes(category) ? category : "");
//   };

//   const updateSubcategories = () => {
//     let options: string[] = [];
//     if (category === "Health") {
//       options = ["Lubricants", "Intimate Hygiene"];
//     } else if (category === "Beauty") {
//       options = ["Shampoo", "Soap"];
//     } else {
//       options = ["Select Subcategory"];
//     }
//     setSubcategories(options);
//     setSubcategory(options.includes(subcategory) ? subcategory : "");
//   };

//   // ------- modal helpers -------
//   const confirmWithModal = (message: React.ReactNode) =>
//     new Promise<boolean>((resolve) => {
//       setModalMessage(message);
//       setShowModal(true);
//       setModalPromise(() => resolve);
//     });

//   // ------- submit -------
//   const handleCombinedSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     if (!file1 || !file2) {
//       setError("Please upload both files.");
//       return;
//     }
//     if (!effectiveCountry) {
//       setError("Country is missing. Please open this page with a country selected.");
//       return;
//     }

//     const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

//     try {
//       const historyResponse = await fetch("http://127.0.0.1:5000/upload_history", {
//         method: "GET",
//         headers: token ? { Authorization: `Bearer ${token}` } : {},
//       });

//       const historyData = await historyResponse.json();

//       const existingUpload = Array.isArray(historyData?.uploads)
//         ? historyData.uploads.find(
//             (upload: any) =>
//               String(upload?.year) === String(year) &&
//               String(upload?.month || "").toLowerCase() === String(month || "").toLowerCase() &&
//               String(upload?.country || "").toLowerCase() === effectiveCountry
//           )
//         : null;

//       if (existingUpload) {
//         const confirmed = await confirmWithModal(
//           <>
//             You have already uploaded data for {capitalizeFirstLetter(month)}/{year} in {effectiveCountry.toUpperCase()}.
//             <br />
//             Do you want to replace the previous file?
//           </>
//         );

//         if (!confirmed) {
//           window.location.reload();
//           return;
//         }
//       }

//       setIsUploading(true);
//       const responseData = await submitForm();

//       // Persist like the old code (since Next.js can't push route state)
//       if (typeof window !== "undefined") {
//         localStorage.setItem("excelFileData", responseData.excel_file ?? "");
//         localStorage.setItem("pnlReport", responseData.pnl_report ?? "");
//         localStorage.setItem("totalSales", responseData.total_sales ?? "");
//         localStorage.setItem("totalProfit", responseData.total_profit ?? "");
//         localStorage.setItem("totalFbaFees", responseData.total_fba_fees ?? "");
//         localStorage.setItem("totalExpense", responseData.total_expense ?? "");
//         localStorage.setItem(
//           "platformfee",
//           responseData.platform_fee ?? responseData.otherwplatform ?? ""
//         );
//         localStorage.setItem("expenseChart", responseData.expense_chart_img ?? "");
//         localStorage.setItem("salesChart", responseData.sales_chart_img ?? "");
//         localStorage.setItem("mergedInventoryData", JSON.stringify(responseData.merged_inventory ?? null));
//       }

//       const ranged = "MTD";
//       router.push(`/country/${ranged}/${effectiveCountry}/${month}/${year}`);
//     } catch (err) {
//       console.error("There was a problem with the file upload:", err);
//       setError("Upload failed. Please try again.");
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const submitForm = async () => {
//     // Parity with your previous working JS submit: build FormData, send Authorization header,
//     // expect JSON back, stash keys to localStorage, clear stale items, return JSON.
//     if (!file1 || !file2) throw new Error("Both files are required");

//     // Your API expects profile_id — ensure it is always sent as a string
//     if (profile?.id === undefined || profile?.id === null) {
//       throw new Error("Missing profile.id — cannot call /upload without it");
//     }

//     const formData = new FormData();
//     formData.append("file1", file1);
//     formData.append("file2", file2);
//     formData.append("transit_time", String(transitTime));
//     formData.append("stock_unit", String(stockUnit));
//     formData.append("country", effectiveCountry); // ✅ ensure backend gets the country
//     formData.append("category", category);
//     formData.append("subcategory", subcategory);
//     formData.append("year", year);
//     formData.append("month", month);
//     formData.append("profile_id", String(profile.id));

//     const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

//     try {
//       const response = await fetch("http://127.0.0.1:5000/upload", {
//         method: "POST",
//         headers: token ? { Authorization: `Bearer ${token}` } : {},
//         body: formData,
//       });

//       const contentType = response.headers.get("Content-Type") || "";

//       if (contentType.includes("application/json")) {
//         const responseData = await response.json();

//         // Save only keys your backend returns (parity with previous code)
//         localStorage.setItem("excelFileData", responseData.excel_file ?? "");
//         localStorage.setItem("pnlReport", responseData.pnl_report ?? "");
//         localStorage.setItem("totalSales", responseData.total_sales ?? "");
//         localStorage.setItem("totalProfit", responseData.total_profit ?? "");
//         localStorage.setItem("totalFbaFees", responseData.total_fba_fees ?? "");
//         localStorage.setItem("totalExpense", responseData.total_expense ?? "");
//         localStorage.setItem(
//           "platformfee",
//           responseData.platform_fee ?? responseData.otherwplatform ?? ""
//         );
//         localStorage.setItem("expenseChart", responseData.expense_chart_img ?? "");
//         localStorage.setItem("salesChart", responseData.sales_chart_img ?? "");

//         // Clear stale items
//         if (countryName) {
//           localStorage.removeItem(`forecast-${countryName}`);
//           localStorage.removeItem(`forecast-time-${countryName}`);
//         }
//         localStorage.removeItem("mergedInventoryData");

//         return responseData;
//       }

//       // If server didn't return JSON, try to surface the body to help debugging
//       const text = await response.text();
//       throw new Error(text || "Unexpected response from server");
//     } catch (err) {
//       console.error("There was a problem with the file upload:", err);
//       throw err;
//     }
//   };

//   // Minimal render while the full JSX remains in the file above; return null so the component is valid.
//   return null;
// };

// export default FileUploadForm;











"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";

interface FileUploadFormProps {
  initialCountry: string;
  onClose: () => void;
  onComplete: () => void;
}

const FileUploadForm = ({ initialCountry, onClose, onComplete }: FileUploadFormProps) => {
  // ---------------- Routing ----------------
  const router = useRouter();
  const params = useParams<{ countryName?: string }>();
  const countryName = params?.countryName ?? "";

  // ---------------- Profile from localStorage ----------------
  const profile = useMemo(() => {
    try {
      if (typeof window === "undefined") return {};
      const raw = localStorage.getItem("profile");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  // ---------------- UI State ----------------
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [modalMessage, setModalMessage] = useState<React.ReactNode>("");
  const [showModal, setShowModal] = useState(false);
  const [modalPromise, setModalPromise] = useState<null | ((value: boolean) => void)>(null);
  const [file1Month, setFile1Month] = useState("");
  const [file2Month, setFile2Month] = useState("");
  const [file1Year, setFile1Year] = useState("");
  const [file2Year, setFile2Year] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 2 }, (_, i) => currentYear - 1 + i);

  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [transitTime] = useState<string>((profile as any).transitTime || "");
  const [stockUnit] = useState<string>((profile as any).stockUnit || "");
  const [country] = useState<string>((profile as any).country || "");
  const [category, setCategory] = useState<string>((profile as any).category || "");
  const [subcategory, setSubcategory] = useState<string>((profile as any).subcategory || "");
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");

  // ---------------- Derived ----------------
  const effectiveCountry = useMemo(
    () => (country || countryName || "").toLowerCase(),
    [country, countryName]
  );

  // ---------------- Helpers ----------------
  const capitalizeFirstLetter = (str: unknown) =>
    typeof str === "string"
      ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
      : "";

  const getAvailableMonths = () => [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const safeMonthIndexValue = (m: string) => {
    if (!m) return "";
    const idx = getAvailableMonths().findIndex(
      (mon) => mon.toLowerCase() === m.toLowerCase()
    );
    return idx >= 0 ? String(idx + 1) : "";
  };

  // ---------------- File Inputs ----------------
  const handleFileChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFile1(file || null);
  };

  const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFile2(file || null);
  };

  // ---------------- Selects ----------------
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const numeric = Number(e.target.value);
    if (!numeric) {
      setMonth("");
      return;
    }
    const idx = numeric - 1;
    const months = getAvailableMonths();
    setMonth(months[idx]);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedYear = e.target.value;
    setYear(selectedYear);
  };

  const updateCategories = () => {
    let options: string[] = [];
    if ((effectiveCountry || "").toUpperCase() === "INDIA") {
      options = ["Health", "Beauty"];
    } else {
      options = ["Select Category"];
    }
    setCategories(options);
    setCategory(options.includes(category) ? category : "");
  };

  const updateSubcategories = () => {
    let options: string[] = [];
    if (category === "Health") {
      options = ["Lubricants", "Intimate Hygiene"];
    } else if (category === "Beauty") {
      options = ["Shampoo", "Soap"];
    } else {
      options = ["Select Subcategory"];
    }
    setSubcategories(options);
    setSubcategory(options.includes(subcategory) ? subcategory : "");
  };

  useEffect(() => {
    updateCategories();
  }, [effectiveCountry]);

  useEffect(() => {
    updateSubcategories();
  }, [category]);

  useEffect(() => {
  if (isUploading) {
    // Disable scroll
    document.body.style.overflow = "hidden";
  } else {
    // Restore scroll
    document.body.style.overflow = "";
  }

  // Cleanup on unmount
  return () => {
    document.body.style.overflow = "";
  };
}, [isUploading]);


  // ---------------- Modal ----------------
  const confirmWithModal = (message: React.ReactNode) =>
    new Promise<boolean>((resolve) => {
      setModalMessage(message);
      setShowModal(true);
      setModalPromise(() => resolve);
    });

  const handleCombinedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1) Basic file/country guards
    if (!file1 || !file2) {
      setError("Please upload both files.");
      return;
    }
    if (!effectiveCountry) {
      setError("Country is missing. Please open this page with a country selected.");
      return;
    }

    // 2) Ensure month/year (fallback to parsed CSV hints if user didn't choose)
    let finalMonth = month?.toLowerCase() || "";
    let finalYear = (year || "").toString();

    if (!finalMonth) {
      finalMonth = (file1Month || file2Month || "").toLowerCase();
    }
    if (!finalYear) {
      finalYear = (file1Year || file2Year || "").toString();
    }

    if (!finalMonth || !finalYear) {
      setError("Please select a Month and Year (or upload files that contain them).");
      return;
    }

    // 3) Optional: normalize month spelling just in case
    const allowedMonths = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december"
    ];
    if (!allowedMonths.includes(finalMonth)) {
      setError(`Invalid month: ${finalMonth}. Please re-select.`);
      return;
    }

    // 4) Token guard (your API requires it)
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setError("You are not logged in. Please log in and try again.");
      return;
    }

    try {
      // 5) Check if the period already exists (only if we have M/Y)
      let existingUpload: any = null;
      try {
        const historyResponse = await fetch("http://127.0.0.1:5000/upload_history", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        // tolerate non-200 here; we'll just skip the replace-confirm
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          existingUpload = Array.isArray(historyData?.uploads)
            ? historyData.uploads.find(
              (u: any) =>
                String(u?.year) === String(finalYear) &&
                String(u?.month || "").toLowerCase() === finalMonth &&
                String(u?.country || "").toLowerCase() === effectiveCountry
            )
            : null;
        }
      } catch {
        // ignore history errors; continue with upload
      }

      if (existingUpload) {
        const confirmed = await confirmWithModal(
          <>
            You have already uploaded data for {capitalizeFirstLetter(finalMonth)}/{finalYear} in{" "}
            {effectiveCountry.toUpperCase()}.
            <br />
            Do you want to replace the previous file?
          </>
        );
        if (!confirmed) {
          // User cancelled — keep the page as is
          return;
        }
      }

      // 6) Call your existing upload
      setIsUploading(true);
      // Make sure your submitForm uses the component's current state (month/year)
      // If submitForm reads from state, sync it before calling:
      if (finalMonth !== month) setMonth(finalMonth);
      if (finalYear !== year) setYear(finalYear);

      const responseData = await submitForm(); // <-- your working upload function

      // 7) Redirect to the stats page
      const ranged = "MTD"; // or "QTD" if that's the active tab in your UI
      await router.push(`/pnl-dashboard/${ranged}/${effectiveCountry}/${finalMonth}/${finalYear}`);
    } catch (err) {
      console.error("There was a problem with the file upload:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };


  // ---------------- SubmitForm ----------------
  const submitForm = async () => {
    if (!file1 || !file2) throw new Error("Both files are required");

    // --- Find a profile_id robustly ---
    const safeGetJwtPayload = () => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) return null;
        const [, payloadB64] = token.split(".");
        if (!payloadB64) return null;
        const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(json);
      } catch {
        return null;
      }
    };

    const jwtPayload = safeGetJwtPayload();
    const profileIdFromProfile = (profile as any)?.id;
    const profileIdFromJwt =
      (jwtPayload && (jwtPayload.profile_id ?? jwtPayload.user_id)) || null;

    // Final fallback so backend never KeyErrors
    const finalProfileId = String(
      profileIdFromProfile ?? profileIdFromJwt ?? "0"
    );

    const formData = new FormData();
    formData.append("file1", file1);
    formData.append("file2", file2);
    formData.append("transit_time", String(transitTime));
    formData.append("stock_unit", String(stockUnit));
    formData.append("country", effectiveCountry);
    formData.append("category", category);
    formData.append("subcategory", subcategory);
    formData.append("year", year);
    formData.append("month", month);
    formData.append("profile_id", finalProfileId);

    const token = typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const responseData = await response.json();

        localStorage.setItem("excelFileData", responseData.excel_file ?? "");
        localStorage.setItem("pnlReport", responseData.pnl_report ?? "");
        localStorage.setItem("totalSales", responseData.total_sales ?? "");
        localStorage.setItem("totalProfit", responseData.total_profit ?? "");
        localStorage.setItem("totalFbaFees", responseData.total_fba_fees ?? "");
        localStorage.setItem("totalExpense", responseData.total_expense ?? "");
        localStorage.setItem(
          "platformfee",
          responseData.platform_fee ?? responseData.otherwplatform ?? ""
        );
        localStorage.setItem("expenseChart", responseData.expense_chart_img ?? "");
        localStorage.setItem("salesChart", responseData.sales_chart_img ?? "");

        if (countryName) {
          localStorage.removeItem(`forecast-${countryName}`);
          localStorage.removeItem(`forecast-time-${countryName}`);
        }
        localStorage.removeItem("mergedInventoryData");

        return responseData;
      }

      const text = await response.text();
      throw new Error(text || "Unexpected response from server");
    } catch (err) {
      console.error("There was a problem with the file upload:", err);
      throw err;
    }
  };


  // ---------------- Render ----------------
  return (
    <>
      <div className="w-full h-full overflow-y-auto flex flex-col items-center shadow-[6px_6px_7px_0px_#00000026] ">
        <div className="w-full flex justify-center ">
          <div className="w-full   rounded-xl bg-white  p-4 md:p-5 lg:p-6 text-[13px] md:text-[14px] border border-[#D9D9D9]">
            <h2 className="text-center text-2xl md:text-3xl font-semibold text-[#5EA68E] my-3 md:my-4">
              Upload File <i className="fa-solid fa-cloud-arrow-up" />
            </h2>

            <form onSubmit={handleCombinedSubmit} encType="multipart/form-data" className="space-y-5 md:space-y-6">
              {/* File inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium">Month to Date Amazon Report:</label>
                  <div
                    className={`relative h-[160px] md:h-[170px] w-full border border-neutral-700 rounded-xl bg-white flex items-center justify-center overflow-hidden ${file1 ? "ring-2 ring-emerald-500" : ""
                      }`}
                  >
                    <input
                      type="file"
                      id="file1"
                      name="file1"
                      onChange={handleFileChange1}
                      accept=".xls,.xlsx,.csv"
                      required
                      className="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-20"
                    />
                    <img
                      src="/uploadbox.png"
                      alt="file-icon"
                      className="pointer-events-none w-[36vw] max-w-[180px] min-w-[90px] opacity-70"
                    />
                    {file1 && (
                      <p className="pointer-events-none absolute text-center px-2 text-neutral-800 font-medium text-xs md:text-sm break-words">
                        {file1?.name || "Choose File"}
                      </p>
                    )}
                  </div>
                  <p className="text-[#5EA68E] font-semibold text-[11px] md:text-xs m-0">
                    Amazon → Seller Central → Payments → Reports Repository → Report Type Transactions → Select Month
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium">Monthly End Inventory File:</label>
                  <div
                    className={`relative h-[160px] md:h-[170px] w-full border border-neutral-700 rounded-xl bg-white flex items-center justify-center overflow-hidden ${file2 ? "ring-2 ring-emerald-500" : ""
                      }`}
                  >
                    <input
                      type="file"
                      id="file2"
                      name="file2"
                      onChange={handleFileChange2}
                      accept=".xls,.xlsx,.csv"
                      required
                      className="absolute inset-0 h-full w-full opacity-0 cursor-pointer z-20"
                    />
                    <img
                      src="/uploadbox.png"
                      alt="file-icon"
                      className="pointer-events-none w-[36vw] max-w-[180px] min-w-[90px] opacity-70"
                    />
                    {file2 && (
                      <p className="pointer-events-none absolute text-center px-2 text-neutral-800 font-medium text-xs md:text-sm break-words">
                        {file2?.name || 'Choose File'}
                      </p>
                    )}
                  </div>
                  <p className="text-[#5EA68E] font-semibold text-[11px] md:text-xs m-0">
                    Amazon → Seller Central → Reports → Fulfilment by amazon → Inventory Ledger → Download
                  </p>
                  <p className="italic text-neutral-600 text-[11px] md:text-xs m-0">
                    *Summary View - Aggregate report by Country. Select last day of the previous month and download in .csv format
                  </p>
                </div>
              </div>

              {error && <p className="text-red-600 text-xs">{error}</p>}

              <div className="relative">
                <input
                  type="text"
                  name="country"
                  id="country"
                  value={(effectiveCountry || "").toUpperCase()}
                  readOnly
                  className="mt-2 w-full rounded-xl border border-neutral-700 px-3 py-2.5 text-sm md:text-[15px] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4">
                <select
                  id="year"
                  name="year"
                  value={year}
                  onChange={handleYearChange}
                  required
                  className="w-full rounded-xl border border-neutral-700 py-2.5 text-sm md:text-[15px] focus:outline-none"
                >
                  <option value="">Select Year</option>
                  {years.map((yy) => (
                    <option key={yy} value={yy}>
                      {yy}
                    </option>
                  ))}
                </select>

                <select
                  id="month"
                  name="month"
                  value={safeMonthIndexValue(month)}
                  onChange={handleMonthChange}
                  required
                  className="w-full rounded-xl border border-neutral-700 py-2.5 text-sm md:text-[15px] focus:outline-none"
                >
                  <option value="">Select Month</option>
                  {getAvailableMonths().map((m, index) => (
                    <option key={m} value={index + 1}>
                      {capitalizeFirstLetter(m)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-slate-700 text-[#f8edcf] shadow-md py-2.5 md:py-3 text-sm md:text-[15px] font-medium hover:bg-slate-800 transition disabled:opacity-60"
                disabled={isUploading}
              >
                Upload
              </button>

              {/* {isUploading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-md bg-black/30">
                  <video
                    src="/infinity2.webm"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-[120px] md:w-[140px]"
                  />
                  <div className="mt-4 text-white text-sm md:text-base">Uploading...</div>
                </div>
              )} */}
              {isUploading && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
                  <video
                    src="/infinity2.webm"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-[120px] md:w-[140px]"
                  />
                  <div className="mt-4 text-white text-sm md:text-base">
                    Uploading...
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>

        {/* Modal Component */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            // closing the modal by clicking backdrop / close icon should be treated as cancel
            setShowModal(false);
            if (modalPromise) modalPromise(false);
          }}
          className="max-w-md mx-auto p-5"
          showCloseButton
        >
          <div className="p-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">Replace previous upload?</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300">{modalMessage}</div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  if (modalPromise) modalPromise(false);
                }}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  if (modalPromise) modalPromise(true);
                }}
                className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Replace
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default FileUploadForm;
