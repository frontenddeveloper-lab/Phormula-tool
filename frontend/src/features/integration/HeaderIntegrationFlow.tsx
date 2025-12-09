// "use client";

// import React, { useEffect, useState } from "react";
// import { Modal } from "@/components/ui/modal";
// import AmazonConnectLegacy from "./AmazonConnectLegacy";
// import { LS_KEYS } from "./useIntegrationProgress";
// import { useParams } from "next/navigation";
// import IntegrationsModal from "./IntegrationsModal";

// // Keep types in sync with your existing code
// type Provider = "amazon" | "shopify";
// type Origin = "header" | "page";

// export default function HeaderIntegrationFlow() {
//   const [openIntegrationModal, setOpenIntegrationModal] = useState(false);
//   const [showAmazonLegacy, setShowAmazonLegacy] = useState(false);

//   // if you need country in AmazonConnectLegacy logic
//   const { countryName } = useParams<{ countryName: string }>();
//   const selectedCountry = (countryName || "").toLowerCase();

//   useEffect(() => {
//     const handler = (e: Event) => {
//       const custom = e as CustomEvent<{ provider: Provider; origin?: Origin }>;
//       const { provider, origin } = custom.detail || {};
//       if (!provider) return;

//       // 🟢 Only handle header-origin events here
//       if (origin !== "header") return;

//       if (provider === "amazon") {
//         // Directly open AmazonConnectLegacy
//         setShowAmazonLegacy(true);
//       }

//       // You can also handle Shopify header flow here if needed later
//       // if (provider === "shopify") { ... }
//     };

//     window.addEventListener("integration:choose", handler as EventListener);
//     return () => {
//       window.removeEventListener("integration:choose", handler as EventListener);
//     };
//   }, []);

//   return (
//     <>
//       {/* This button is just an example – use whatever triggers your header modal */}
//       {/* You might already have a button in your Header – wrap this there */}
//       <button
//         type="button"
//         onClick={() => setOpenIntegrationModal(true)}
//         className="flex items-center gap-2"
//       >
//         Integrations
//       </button>

//       {/* Header Integration Modal (your existing one) */}
//       <IntegrationsModal
//         open={openIntegrationModal}
//         onClose={() => setOpenIntegrationModal(false)}
//       />

//       {/* Amazon Legacy modal for header flow */}
//       {showAmazonLegacy && (
//         <Modal
//           isOpen
//           onClose={() => setShowAmazonLegacy(false)}
//           className="m-4 max-w-xl"
//           showCloseButton
//         >
//           <AmazonConnectLegacy
//             onClose={() => setShowAmazonLegacy(false)}
//             onConnected={(refreshToken?: string) => {
//               if (typeof window !== "undefined") {
//                 localStorage.setItem(
//                   LS_KEYS.amazonRefreshToken(selectedCountry),
//                   String(refreshToken ?? "")
//                 );
//               }
//               setShowAmazonLegacy(false);
//             }}
//           />
//         </Modal>
//       )}
//     </>
//   );
// }










// features/integration/HeaderIntegrationFlow.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import AmazonConnectLegacy from "./AmazonConnectLegacy";
import { LS_KEYS } from "./useIntegrationProgress";
import { useParams } from "next/navigation";
import IntegrationsModal from "./IntegrationsModal";

type Provider = "amazon" | "shopify";
type Origin = "header" | "page";

export default function HeaderIntegrationFlow() {
  const [openIntegrationModal, setOpenIntegrationModal] = useState(false);
  const [showAmazonLegacy, setShowAmazonLegacy] = useState(false);

  const { countryName } = useParams<{ countryName: string }>();
  const selectedCountry = (countryName || "").toLowerCase();

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ provider: Provider; origin?: Origin }>;
      const { provider, origin } = custom.detail || {};
      if (!provider) return;

      // 🟢 Only handle header-origin events here
      if (origin !== "header") return;

      if (provider === "amazon") {
        // Directly open AmazonConnectLegacy
        setShowAmazonLegacy(true);
      }
    };

    window.addEventListener("integration:choose", handler as EventListener);
    return () => {
      window.removeEventListener("integration:choose", handler as EventListener);
    };
  }, []);

  return (
    <>
      {/* This button is just an example – use whatever triggers your header modal */}
      {/* You might already have a button in your Header – wrap this there */}
      <button
        type="button"
        onClick={() => setOpenIntegrationModal(true)}
        className="flex items-center gap-2"
      >
        Integrations
      </button>

      {/* Header Integration Modal (your existing one) */}
      <IntegrationsModal
        open={openIntegrationModal}
        onClose={() => setOpenIntegrationModal(false)}
      />

      {/* Amazon Legacy modal for header flow */}
      {showAmazonLegacy && (
        <Modal
          isOpen
          onClose={() => setShowAmazonLegacy(false)}
          className="m-4 max-w-xl"
          showCloseButton
        >
          <AmazonConnectLegacy
            onClose={() => setShowAmazonLegacy(false)}
            onConnected={(refreshToken?: string) => {
              if (typeof window !== "undefined") {
                localStorage.setItem(
                  LS_KEYS.amazonRefreshToken(selectedCountry),
                  String(refreshToken ?? "")
                );
              }
              setShowAmazonLegacy(false);
            }}
          />
        </Modal>
      )}
    </>
  );
}















