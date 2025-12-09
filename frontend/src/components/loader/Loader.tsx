// /* eslint-disable @next/next/no-img-element */
// // app/components/Loader.tsx
// "use client";

// import React, { useEffect, useState } from "react";

// type LoaderProps = {
//   src?: string;                          // e.g. "/images/loader/infinity.gif" from /public
//   size?: number;
//   label?: string;
//   roundedClass?: string;
//   backgroundClass?: string;
//   transparent?: boolean;
//   className?: string;
//   forceFallback?: boolean;
//   fullscreen?: boolean;
//   zIndex?: number;
//   /** Show spinner instead of GIF when user prefers reduced motion */
//   respectReducedMotion?: boolean;        // <- new
// };

// export default function Loader({
//   src = "/images/loader/infinity.gif",
//   size = 80,
//   label = "Loading…",
//   roundedClass = "rounded-2xl",
//   backgroundClass = "bg-neutral-100 dark:bg-neutral-900/70 backdrop-blur",
//   transparent = false,
//   className = "",
//   forceFallback = false,
//   fullscreen = false,
//   zIndex = 9999,
//   respectReducedMotion = false,          // default: show the GIF anyway
// }: LoaderProps) {
//   const [shouldReduce, setShouldReduce] = useState(false);
//   const [loadFailed, setLoadFailed] = useState(false);

//   // Detect reduced motion on the client (avoid hydration mismatch)
//   useEffect(() => {
//     if (typeof window !== "undefined" && "matchMedia" in window) {
//       const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
//       const apply = () => setShouldReduce(mq.matches);
//       apply();
//       mq.addEventListener?.("change", apply);
//       return () => mq.removeEventListener?.("change", apply);
//     }
//   }, []);

//   const showFallback =
//     !src ||
//     forceFallback ||
//     loadFailed ||
//     (respectReducedMotion && shouldReduce);

//   const Container: React.FC<React.PropsWithChildren> = ({ children }) => (
//     <div
//       role="status"
//       aria-live="polite"
//       aria-label={label}
//       className={[
//         "inline-flex items-center justify-center",
//         transparent ? "" : backgroundClass,
//         roundedClass,
//         "shadow-sm border border-black/5 dark:border-white/5",
//         className,
//       ].join(" ")}
//       style={
//         fullscreen
//           ? {
//               position: "fixed",
//               inset: 0,
//               width: "100vw",
//               height: "100vh",
//               minWidth: 0,
//               minHeight: 0,
//               zIndex,
//               background: transparent ? "transparent" : "rgba(0,0,0,0.35)",
//             }
//           : {
//               width: size,
//               height: size,
//               minWidth: size,
//               minHeight: size,
//             }
//       }
//     >
//       {children}
//     </div>
//   );

//   return (
//     <Container>
//       {showFallback ? (
//         <div
//           className="relative"
//           style={{ width: size * 0.55, height: size * 0.55 }}
//           aria-hidden
//         >
//           <div className="box-border w-full h-full rounded-full border-[3px] border-neutral-300 dark:border-neutral-700" />
//           {/* no spin if shouldReduce */}
//           {!shouldReduce && !forceFallback && (
//             <div className="box-border w-full h-full rounded-full border-[3px] border-transparent border-t-neutral-500 dark:border-t-neutral-200 animate-spin" />
//           )}
//         </div>
//       ) : (
//         <img
//           src={src}
//           width={size}
//           height={size}
//           alt=""
//           draggable={false}
//           aria-hidden
//           className={`${roundedClass} object-contain select-none pointer-events-none`}
//           style={{ width: size * 0.82, height: size * 0.82 }}
//           onError={() => setLoadFailed(true)}  // if GIF fails, show spinner
//         />
//       )}
//     </Container>
//   );
// }












/* eslint-disable @next/next/no-img-element */
// app/components/loader/Loader.tsx
"use client";

import React, { useEffect, useState } from "react";

type LoaderProps = {
  src?: string;                          // e.g. "/infinity-unscreen.gif" from /public
  size?: number;
  label?: string;
  roundedClass?: string;
  backgroundClass?: string;
  transparent?: boolean;
  className?: string;
  forceFallback?: boolean;
  fullscreen?: boolean;
  zIndex?: number;
  /** Show spinner instead of GIF/video when user prefers reduced motion */
  respectReducedMotion?: boolean;
};

export default function Loader({
  src = "/infinity-unscreen.gif",        // 👈 your GIF as default
  size = 80,
  label = "Loading…",
  roundedClass = "rounded-2xl",
  backgroundClass = "bg-neutral-100 dark:bg-neutral-900/70 backdrop-blur",
  transparent = false,
  className = "",
  forceFallback = false,
  fullscreen = false,
  zIndex = 9999,
  respectReducedMotion = false,
}: LoaderProps) {
  const [shouldReduce, setShouldReduce] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  // Detect reduced motion on the client (avoid hydration mismatch)
  useEffect(() => {
    if (typeof window !== "undefined" && "matchMedia" in window) {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const apply = () => setShouldReduce(mq.matches);
      apply();
      mq.addEventListener?.("change", apply);
      return () => mq.removeEventListener?.("change", apply);
    }
  }, []);

  const isVideo =
    typeof src === "string" &&
    (src.endsWith(".mp4") || src.endsWith(".webm") || src.endsWith(".ogg"));

  const showFallback =
    !src ||
    forceFallback ||
    loadFailed ||
    (respectReducedMotion && shouldReduce);

  const Container: React.FC<React.PropsWithChildren> = ({ children }) => (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={[
        "inline-flex items-center justify-center",
        transparent ? "" : backgroundClass,
        roundedClass,
        // "shadow-sm border border-black/5 dark:border-white/5",
        className,
      ].join(" ")}
      style={
        fullscreen
          ? {
              position: "fixed",
              inset: 0,
              width: "100vw",
              height: "100vh",
              minWidth: 0,
              minHeight: 0,
              zIndex,
              background: transparent ? "transparent" : "rgba(0,0,0,0.35)",
            }
          : {
              width: size,
              height: size,
              minWidth: size,
              minHeight: size,
            }
      }
    >
      {children}
    </div>
  );

  return (
    <Container>
      {showFallback ? (
        <div
          className="relative"
          style={{ width: size * 0.55, height: size * 0.55 }}
          aria-hidden
        >
          <div className="box-border w-full h-full rounded-full border-[3px] border-neutral-300 dark:border-neutral-700" />
          {/* no spin if shouldReduce */}
          {!shouldReduce && !forceFallback && (
            <div className="box-border w-full h-full rounded-full border-[3px] border-transparent border-t-neutral-500 dark:border-t-neutral-200 animate-spin" />
          )}
        </div>
      ) : isVideo ? (
        <video
          src={src}
          width={size}
          height={size}
          muted
          loop
          autoPlay
          playsInline
          aria-hidden
          className={`${roundedClass} object-contain select-none pointer-events-none`}
          style={{ width: size * 0.82, height: size * 0.82 }}
          onError={() => setLoadFailed(true)}
        />
      ) : (
        <img
          src={src}
          width={size}
          height={size}
          alt=""
          draggable={false}
          aria-hidden
          className={`${roundedClass} object-contain select-none pointer-events-none`}
          style={{ width: size * 0.82, height: size * 0.82 }}
          onError={() => setLoadFailed(true)} // if GIF fails, show spinner
        />
      )}
    </Container>
  );
}
