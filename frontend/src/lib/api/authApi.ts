import { baseApi } from "./baseApi";

export type LoginReq = { email: string; password: string };
export type LoginRes = { token: string; message?: string };

// --- Register types ---
export type RegisterReq = {
  email: string;
  password: string;
  phone_number: string;     // formatted, e.g. "+1 5551234567"
  phone_number_raw: string; // raw input
};
export type RegisterRes = {
  success: boolean;
  message?: string;
};

// --- Reset Password types ---
export type ResetPasswordReq = {
  token: string;
  password: string;
};
export type ResetPasswordRes = {
  success: boolean;
  message?: string;
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // 🔹 LOGIN
    login: build.mutation<LoginRes, LoginReq>({
      query: (body) => ({
        url: "/login",
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.token) {
            console.log("🟢 Auth Token (Login):", data.token);
          }
        } catch (error) {
          console.error("Login failed:", error);
        }
      },
      invalidatesTags: ["User"],
    }),

    // 🔹 REGISTER
    register: build.mutation<RegisterRes, RegisterReq>({
      query: (body) => ({
        url: "/register",
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      }),
      invalidatesTags: ["User"],
    }),

    // 🔹 RESET PASSWORD
    resetPassword: build.mutation<ResetPasswordRes, ResetPasswordReq>({
  query: ({ token, password }) => ({
    url: `/reset_password/${encodeURIComponent(token)}`, // 👈 important
    method: "POST",
    body: { password },
    headers: { "Content-Type": "application/json" },
  }),
}),

  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useResetPasswordMutation,
} = authApi;
