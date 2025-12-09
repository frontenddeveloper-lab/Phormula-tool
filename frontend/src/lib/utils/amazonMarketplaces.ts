// // src/lib/utils/amazonMarketplaces.ts
// import type { PlatformId, ConnectedPlatforms } from "@/lib/utils/platforms";
// import { useSelector } from "react-redux";
// import type { RootState } from "@/lib/store"; 

// /**
//  * Map Amazon SP-API marketplace IDs -> your PlatformIds.
//  */
// export const AMAZON_MARKETPLACE_ID_TO_PLATFORM: Record<string, PlatformId> = {
//   // UK
//   "A1F83G8C2ARO7P": "amazon-uk",
//   // US
//   "ATVPDKIKX0DER": "amazon-us",
//   // CA (you mapped ap-southeast-1 to Canada label)
//   "A1VC38T7YXB528": "amazon-ca",
// };

// export function marketplaceIdToPlatform(id: string): PlatformId | null {
//   return AMAZON_MARKETPLACE_ID_TO_PLATFORM[id] ?? null;
// }

// /**
//  * From an array of marketplace IDs, derive which Amazon platforms are connected.
//  */
// export function deriveAmazonConnectedFromMarketplaceIds(
//   ids: string[]
// ): Pick<ConnectedPlatforms, "amazonUk" | "amazonUs" | "amazonCa"> {
//   let amazonUk = false;
//   let amazonUs = false;
//   let amazonCa = false;

//   ids.forEach((id) => {
//     const platform = marketplaceIdToPlatform(id);
//     if (platform === "amazon-uk") amazonUk = true;
//     if (platform === "amazon-us") amazonUs = true;
//     if (platform === "amazon-ca") amazonCa = true;
//   });

//   return { amazonUk, amazonUs, amazonCa };
// }

// const STORAGE_KEY = "connectedAmazonMarketplaces";

// /**
//  * Add a connected marketplace ID (keeps an array so you can have UK + US + CA).
//  */
// export function addConnectedAmazonMarketplaceId(id: string) {
//   if (typeof window === "undefined") return;

//   try {
//     const raw = window.localStorage.getItem(STORAGE_KEY);
//     const existing: string[] = raw ? JSON.parse(raw) : [];

//     if (!existing.includes(id)) {
//       const updated = [...existing, id];
//       window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
//     }
//   } catch (err) {
//     console.error("Failed to save Amazon marketplace in localStorage", err);
//   }
// }

// export function getConnectedAmazonMarketplaceIds(): string[] {
//   if (typeof window === "undefined") return [];
//   try {
//     const raw = window.localStorage.getItem(STORAGE_KEY);
//     if (!raw) return [];
//     const ids: string[] = JSON.parse(raw);
//     return Array.isArray(ids) ? ids : [];
//   } catch {
//     return [];
//   }
// }

// /* -----------------------------------------------------------------------
//  * API helpers using /amazon_api/login
//  * -------------------------------------------------------------------- */

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

// const getAuthToken = () =>
//   typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

// type AmazonLoginRawResponse = any;

// /**
//  * Call your backend /amazon_api/login route for a given region + marketplaceId.
//  * This does NOT change your backend; it just wraps the existing route.
//  *
//  * It will:
//  *   - attach the JWT from localStorage as Authorization header
//  *   - call GET {API_BASE}/amazon_api/login?region=...&marketplace_id=...
//  *   - log the full raw response (so you can see region, marketplace_id, etc.)
//  */
// export async function callAmazonLoginApi(params: {
//   region: string;
//   marketplaceId: string;
// }): Promise<AmazonLoginRawResponse> {
//   const { region, marketplaceId } = params;

//   const reduxToken = useSelector(
//       (state: RootState) => state.auth.token 
//     );
  

//   const token = reduxToken;
//   if (!token) {
//     console.warn("callAmazonLoginApi: no jwtToken found in localStorage");
//   }

//   const qs = new URLSearchParams({
//     region:"eu-west-1",
//     marketplace_id: "A1F83G8C2ARO7P",
//   }).toString();

//   const res = await fetch(`${API_BASE}/amazon_api/login?${qs}`, {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     },
//   });

//   const data: AmazonLoginRawResponse = await res.json().catch(() => ({}));

//   console.log("🔍 /amazon_api/login raw response:", data);

//   if (!res.ok) {
//     throw new Error(
//       (data as any)?.error ||
//         (data as any)?.message ||
//         `HTTP ${res.status} from /amazon_api/login`
//     );
//   }

//   return data;
// }

// /**
//  * Convenience function:
//  * - calls /amazon_api/login
//  * - tries to extract any marketplace_id(s) from the response
//  * - maps them to { amazonUk, amazonUs, amazonCa } using deriveAmazonConnectedFromMarketplaceIds
//  *
//  * You can call this from a hook or component if you want to drive RegionSelect
//  * directly from the API instead of localStorage.
//  */
// export async function fetchConnectedPlatformsViaLogin(params: {
//   region: string;
//   marketplaceId: string;
// }): Promise<
//   Pick<ConnectedPlatforms, "amazonUk" | "amazonUs" | "amazonCa">
// > {
//   const data = await callAmazonLoginApi(params);

//   // collect marketplace IDs from whatever your backend returns
//   const ids: string[] = [];

//   // if your backend adds marketplace_id to the response directly
//   if ((data as any)?.marketplace_id) {
//     ids.push((data as any).marketplace_id);
//   }

//   // or if it ever returns an array like { marketplaces: [{ marketplace_id }] }
//   if (Array.isArray((data as any)?.marketplaces)) {
//     (data as any).marketplaces.forEach((m: any) => {
//       if (m?.marketplace_id) ids.push(m.marketplace_id);
//     });
//   }

//   console.log("👉 marketplace_ids derived from /amazon_api/login:", ids);

//   const derived = deriveAmazonConnectedFromMarketplaceIds(ids);
//   console.log("✅ derived Amazon connected platforms from /login:", derived);

//   return derived;
// }
















// src/lib/utils/amazonMarketplaces.ts
import type { PlatformId } from "./platforms";

export type AmazonMarketplaceConfig = {
  region: string;
  marketplaceId: string;
};

// Map platform → Amazon API region + marketplace_id
export const AMAZON_MARKETPLACE_CONFIG: Partial<
  Record<PlatformId, AmazonMarketplaceConfig>
> = {
  "amazon-uk": {
    region: "eu-west-1",
    marketplaceId: "A1F83G8C2ARO7P", // UK, from your DB row
  },
  "amazon-us": {
    region: "na-east-1",             // TODO: adjust if your backend expects different
    marketplaceId: "ATVPDKIKX0DER",  // Standard US marketplace id
  },
  "amazon-ca": {
    region: "na-west-1",             // TODO: adjust if your backend expects different
    marketplaceId: "A2EUQ1WTGCTBG2", // Standard CA marketplace id
  },
};

export const getAmazonConfigForPlatform = (
  platform: PlatformId
): AmazonMarketplaceConfig | null => {
  return (AMAZON_MARKETPLACE_CONFIG[platform] as AmazonMarketplaceConfig) ?? null;
};
