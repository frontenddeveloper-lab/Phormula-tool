// // src/lib/api/feePreviewApi.ts
// import { baseApi } from "./baseApi";

// /* ================== Types ================== */
// export type CountriesResponse = {
//   countries: string[];
// };

// export type CountryProfileRes = {
//   exists: boolean;
//   transit_time?: number;
//   stock_unit?: number;
// };

// export type ConfirmationTextRes = {
//   message?: string;
// };

// export type FeePreviewUploadReq = {
//   country: string;                 // e.g., "us"
//   marketplace: string;             // e.g., "Amazon"
//   file: File;                      // filtered .xlsx file
//   transit_time: number | string;   // months
//   stock_unit: number | string;     // months
// };

// export type FeePreviewUploadRes = {
//   profile_id: string;
//   country: string;
//   transit_time: number;
//   stock_unit: number;
//   message?: string;
// };

// /* ================== API ================== */
// export const feePreviewApi = baseApi.injectEndpoints({
//   endpoints: (build) => ({

//     getCountries: build.query<CountriesResponse, void>({
//       query: () => ({ url: "/passcountry", method: "GET" }),
//       providesTags: ["Profile"],
//     }),

//     getProfileCountries: build.query<CountriesResponse, void>({
//       query: () => ({ url: "/passcountryfromprofiles", method: "GET" }),
//       providesTags: ["Profile"],
//     }),

//     getCountryProfile: build.query<CountryProfileRes, string>({
//       query: (country: string) => ({
//         url: `/check_country_profile/profile-check/${country}`,
//         method: "GET",
//       }),
//       providesTags: (
//         _res: CountryProfileRes | undefined,
//         _err: unknown,
//         country: string
//       ) => [{ type: "Profile" as const, id: `country-${country}` }],
//     }),

//     getFeePreviewConfirmationText: build.query<ConfirmationTextRes, void>({
//       query: () => ({ url: "/ConfirmationFeepreview", method: "GET" }),
//     }),

//     uploadFeePreview: build.mutation<FeePreviewUploadRes, FeePreviewUploadReq>({
//       query: (args: FeePreviewUploadReq) => {
//         const { country, marketplace, file, transit_time, stock_unit } = args;
//         const fd = new FormData();
//         fd.append("country", country);
//         fd.append("marketplace", marketplace);
//         fd.append("file", file);
//         fd.append("transit_time", String(transit_time));
//         fd.append("stock_unit", String(stock_unit));

//         return {
//           url: "/feepreviewupload",
//           method: "POST",
//           body: fd,
//         };
//       },
//       invalidatesTags: (
//         _res: FeePreviewUploadRes | undefined,
//         _err: unknown,
//         arg: FeePreviewUploadReq
//       ) => [
//         "Uploads",
//         { type: "Profile" as const, id: `country-${arg.country}` },
//       ],
//       transformResponse: (res: FeePreviewUploadRes): FeePreviewUploadRes => ({
//         ...res,
//         transit_time: Number(res.transit_time),
//         stock_unit: Number(res.stock_unit),
//       }),
//     }),
//   }),
// });

// export const {
//   useGetCountriesQuery,
//   useGetProfileCountriesQuery,
//   useGetCountryProfileQuery,
//   useGetFeePreviewConfirmationTextQuery,
//   useUploadFeePreviewMutation,
// } = feePreviewApi;











// // src/lib/api/feePreviewApi.ts
// import { baseApi } from "./baseApi";

// /* ================== Types ================== */
// export type CountriesResponse = {
//   countries: string[];
// };

// export type CountryProfileRes = {
//   exists: boolean;
//   transit_time?: number;
//   stock_unit?: number;
// };

// export type ConfirmationTextRes = {
//   message?: string;
// };

// export type FeePreviewUploadReq = {
//   country: string;                 // e.g., "us"
//   marketplace: string;             // e.g., "Amazon"
//   file: File;                      // filtered .xlsx file
//   transit_time: number | string;   // months
//   stock_unit: number | string;     // months
// };

// export type FeePreviewUploadRes = {
//   profile_id: string;
//   country: string;
//   transit_time: number;
//   stock_unit: number;
//   message?: string;
// };

// /** ---------- Upload History ---------- **/
// export type UploadItem = {
//   id: string | number;
//   country: string;        // "us" | "uk" | "canada" | "global" ...
//   month: string;          // "january" | "february" | ...
//   year: number;           // e.g. 2025
//   file_name?: string;
// };

// export type UploadHistoryResponse = {
//   uploads: UploadItem[];
// };

// /* ================== API ================== */
// export const feePreviewApi = baseApi.injectEndpoints({
//   endpoints: (build) => ({

//     getCountries: build.query<CountriesResponse, void>({
//       query: () => ({ url: "/passcountry", method: "GET" }),
//       providesTags: ["Profile"],
//     }),

//     getProfileCountries: build.query<CountriesResponse, void>({
//       query: () => ({ url: "/passcountryfromprofiles", method: "GET" }),
//       providesTags: ["Profile"],
//     }),

//     getCountryProfile: build.query<CountryProfileRes, string>({
//       query: (country: string) => ({
//         url: `/check_country_profile/profile-check/${country}`,
//         method: "GET",
//       }),
//       providesTags: (_res, _err, country) => [
//         { type: "Profile" as const, id: `country-${country}` },
//       ],
//     }),

//     getFeePreviewConfirmationText: build.query<ConfirmationTextRes, void>({
//       query: () => ({ url: "/ConfirmationFeepreview", method: "GET" }),
//     }),

//     /** ---------- NEW: Upload history ---------- **/
//     getUploadHistory: build.query<UploadHistoryResponse, void>({
//       query: () => ({ url: "/upload_history", method: "GET" }),
//       providesTags: ["Uploads"],
//       // If your API casing varies, you can normalize here:
//       // transformResponse: (res: UploadHistoryResponse): UploadHistoryResponse => ({
//       //   uploads: (res.uploads ?? []).map(u => ({
//       //     ...u,
//       //     country: String(u.country ?? "").toLowerCase(),
//       //     month: String(u.month ?? "").toLowerCase(),
//       //   })),
//       // }),
//     }),

//     uploadFeePreview: build.mutation<FeePreviewUploadRes, FeePreviewUploadReq>({
//       query: ({ country, marketplace, file, transit_time, stock_unit }) => {
//         const fd = new FormData();
//         fd.append("country", country);
//         fd.append("marketplace", marketplace);
//         fd.append("file", file);
//         fd.append("transit_time", String(transit_time));
//         fd.append("stock_unit", String(stock_unit));
//         return {
//           url: "/feepreviewupload",
//           method: "POST",
//           body: fd,
//         };
//       },
//       invalidatesTags: (_res, _err, arg) => [
//         "Uploads",
//         { type: "Profile" as const, id: `country-${arg.country}` },
//       ],
//       transformResponse: (res: FeePreviewUploadRes): FeePreviewUploadRes => ({
//         ...res,
//         transit_time: Number(res.transit_time),
//         stock_unit: Number(res.stock_unit),
//       }),
//     }),

//   }),
// });

// export const {
//   useGetCountriesQuery,
//   useGetProfileCountriesQuery,
//   useGetCountryProfileQuery,
//   useGetFeePreviewConfirmationTextQuery,
//   useGetUploadHistoryQuery,      
//   useUploadFeePreviewMutation,
// } = feePreviewApi;













// src/lib/api/feePreviewApi.ts
import { baseApi } from "./baseApi";

/* ================== Types ================== */
export type CountriesResponse = {
  countries: string[];
};

export type CountryProfileRes = {
  exists: boolean;
  transit_time?: number;
  stock_unit?: number;
};

export type ConfirmationTextRes = {
  message?: string;
};

/**
 * When `file` is present, we send multipart/form-data.
 * When `file` is absent, we send JSON with the 4 fields only.
 */
export type FeePreviewUploadReq = {
  country: string;                 // e.g., "us"
  marketplace: string;             // e.g., "Amazon"
  transit_time: number | string;   // months
  stock_unit: number | string;     // months
  file?: File;                     // optional now
};

export type FeePreviewUploadRes = {
  profile_id: string;
  country: string;
  transit_time: number;
  stock_unit: number;
  message?: string;
};

/** ---------- Upload History ---------- **/
export type UploadItem = {
  id: string | number;
  country: string;        // "us" | "uk" | "canada" | "global" ...
  month: string;          // "january" | "february" | ...
  year: number;           // e.g. 2025
  file_name?: string;
};

export type UploadHistoryResponse = {
  uploads: UploadItem[];
};

/* ================== API ================== */
export const feePreviewApi = baseApi.injectEndpoints({
  endpoints: (build) => ({

    getCountries: build.query<CountriesResponse, void>({
      query: () => ({ url: "/passcountry", method: "GET" }),
      providesTags: ["Profile"],
    }),

    getProfileCountries: build.query<CountriesResponse, void>({
      query: () => ({ url: "/passcountryfromprofiles", method: "GET" }),
      providesTags: ["Profile"],
    }),

    getCountryProfile: build.query<CountryProfileRes, string>({
      query: (country: string) => ({
        url: `/check_country_profile/profile-check/${country}`,
        method: "GET",
      }),
      providesTags: (_res, _err, country) => [
        { type: "Profile" as const, id: `country-${country}` },
      ],
    }),

    getFeePreviewConfirmationText: build.query<ConfirmationTextRes, void>({
      query: () => ({ url: "/ConfirmationFeepreview", method: "GET" }),
    }),

    /** ---------- Upload history ---------- **/
    getUploadHistory: build.query<UploadHistoryResponse, void>({
      query: () => ({ url: "/upload_history", method: "GET" }),
      providesTags: ["Uploads"],
    }),

    /**
     * Single mutation that supports BOTH modes:
     * - With file: multipart/form-data (legacy behavior)
     * - Without file: JSON body (new behavior)
     */
    uploadFeePreview: build.mutation<FeePreviewUploadRes, FeePreviewUploadReq>({
      query: ({ country, marketplace, file, transit_time, stock_unit }) => {
        // normalize numbers
        const t = Number(transit_time);
        const s = Number(stock_unit);

        if (file) {
          // ---- multipart/form-data path (old) ----
          const fd = new FormData();
          fd.append("country", country);
          fd.append("marketplace", marketplace);
          fd.append("file", file);
          fd.append("transit_time", String(t));
          fd.append("stock_unit", String(s));

          return {
            url: "/feepreviewupload",
            method: "POST",
            body: fd,
          };
        }

        // ---- JSON path (new, no file) ----
        return {
          url: "/feepreviewupload",
          method: "POST",
          body: {
            country,
            marketplace,
            transit_time: t,
            stock_unit: s,
          },
        };
      },
      invalidatesTags: (_res, _err, arg) => [
        "Uploads",
        { type: "Profile" as const, id: `country-${arg.country}` },
      ],
      transformResponse: (res: FeePreviewUploadRes): FeePreviewUploadRes => ({
        ...res,
        transit_time: Number(res.transit_time),
        stock_unit: Number(res.stock_unit),
      }),
    }),

    fileUploadStatus: build.query<{ file_uploaded: boolean }, void>({
      query: () => ({ url: "/file-upload-status", method: "GET" }),
    }),

  }),
});

export const {
  useGetCountriesQuery,
  useGetProfileCountriesQuery,
  useGetCountryProfileQuery,
  useGetFeePreviewConfirmationTextQuery,
  useGetUploadHistoryQuery,
  useUploadFeePreviewMutation,
  useFileUploadStatusQuery,
} = feePreviewApi;
