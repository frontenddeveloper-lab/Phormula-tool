// // "use client";

// // import React, { useState } from "react";
// // import IntegrationsModal from "./IntegrationsModal";
// // import { GrIntegration } from "react-icons/gr";

// // const IntegrationToggleButton: React.FC = () => {
// //   const [open, setOpen] = useState(false);

// //   return (
// //     <>
// //       <button
// //         onClick={() => setOpen(true)}
// //         aria-label="Integrations"
// //         className="flex items-center justify-center rounded-full bg-[#5EA68E] p-2.5 shadow hover:bg-[#4F937D] active:scale-95 transition
// //                    dark:bg-[#5EA68E] dark:hover:bg-[#4F937D]"
// //       >
// //         {/* Integration Icon (two interlocking nodes) */}
// //         {/* <svg
// //           xmlns="http://www.w3.org/2000/svg"
// //           className="h-5 w-5 text-white"
// //           fill="currentColor"
// //           viewBox="0 0 24 24"
// //         >
// //           <path d="M17 3a4 4 0 0 0-3.465 6H10a4 4 0 0 0 0 8h3.535A4 4 0 1 0 17 3Zm-3.465 8A4 4 0 0 1 17 17a4 4 0 0 1-3.465-6H10a2 2 0 1 1 0-4h3.535Z" />
// //         </svg> */}
// //         <GrIntegration className="text-yellow-200"/>
// //       </button>

// //       <IntegrationsModal open={open} onClose={() => setOpen(false)} />
// //     </>
// //   );
// // };

// // export default IntegrationToggleButton;















// "use client";

// import React, { useState } from "react";
// import IntegrationsModal from "./IntegrationsModal";
// import { GrIntegration } from "react-icons/gr";

// import { Modal } from "@/components/ui/modal";
// import AmazonConnectLegacy from "@/features/integration/AmazonConnectLegacy";
// import ShopifyIntroModal from "@/features/integration/ShopifyIntroModal";
// import ConnectShopifyModal from "@/features/integration/ConnectShopifyModal";
// import { LS_KEYS } from "@/features/integration/useIntegrationProgress";
// import { useParams } from "next/navigation";

// const IntegrationToggleButton: React.FC = () => {
//   const [open, setOpen] = useState(false);
//   const [showAmazonLegacy, setShowAmazonLegacy] = useState(false);

//   // Header-only Shopify flow
//   const [shopifyStage, setShopifyStage] = useState<"none" | "intro" | "manual">(
//     "none"
//   );

//   const { countryName } = useParams<{ countryName: string }>();
//   const selectedCountry = (countryName || "").toLowerCase();

//   return (
//     <>
//       <button
//         onClick={() => setOpen(true)}
//         aria-label="Integrations"
//         className="flex items-center justify-center rounded-full bg-[#5EA68E] p-2.5 shadow hover:bg-[#4F937D] active:scale-95 transition
//                    dark:bg-[#5EA68E] dark:hover:bg-[#4F937D]"
//       >
//         <GrIntegration className="text-yellow-200" />
//       </button>

//       {/* Header integrations modal */}
//       <IntegrationsModal
//         open={open}
//         onClose={() => setOpen(false)}
//         onAmazonClick={() => {
//           setOpen(false);
//           setShowAmazonLegacy(true);
//         }}
//         onShopifyClick={() => {
//           setOpen(false);
//           setShopifyStage("intro"); // 🟢 always start at Intro for header
//         }}
//       />

//       {/* Amazon Legacy connect - header flow */}
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

//       {/* Shopify INTRO modal – HEADER ONLY */}
//       {shopifyStage === "intro" && (
//         <ShopifyIntroModal
//           onClose={() => setShopifyStage("none")}
//           onManual={() => {
//             // Go from intro -> manual connect
//             setShopifyStage("manual");
//           }}
//         />
//       )}

//       {/* Shopify CONNECT (manual store / auth) – HEADER ONLY */}
//       {shopifyStage === "manual" && (
//         <ConnectShopifyModal onClose={() => setShopifyStage("none")} />
//       )}
//     </>
//   );
// };

// export default IntegrationToggleButton;

































"use client";

import React, { useState } from "react";
import IntegrationsModal from "./IntegrationsModal";
import { GrIntegration } from "react-icons/gr";

const IntegrationToggleButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Integrations"
        className="flex items-center justify-center rounded-full bg-blue-700 p-2.5 shadow active:scale-95 transition
              "
      >
        <GrIntegration className="text-yellow-200" />
      </button>

      <IntegrationsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default IntegrationToggleButton;
