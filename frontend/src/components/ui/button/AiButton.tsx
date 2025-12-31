// // // import React from "react";
// // // import { BsStars } from "react-icons/bs";

// // // type AiButtonProps = {
// // //   onClick?: () => void;
// // //   disabled?: boolean;
// // //   loading?: boolean;
// // //   children?: React.ReactNode;
// // //   className?: string;
// // // };

// // // export const AiButton: React.FC<AiButtonProps> = ({
// // //   onClick,
// // //   disabled = false,
// // //   loading = false,
// // //   children = "AI Insights",
// // //   className = "",
// // // }) => {
// // //   return (
// // //     <button
// // //       type="button"
// // //       onClick={onClick}
// // //       disabled={disabled}
// // //       style={{ boxShadow: "0px 4px 4px 0px #00000040" }}
// // //       className={[
// // //         "relative overflow-hidden",
// // //         "rounded-sm xl:px-4 px-3",
// // //         "text-nowrap flex items-center gap-1 justify-end",
// // //         "text-[#F8EDCE]",

// // //         // ✅ moving gradient (Tailwind v4, no config)
// // //         // Use underscores in arbitrary values
// // //         "bg-[linear-gradient(90deg,_#7c3aed_0%,_#6366f1_25%,_#06b6d4_50%,_#6366f1_75%,_#7c3aed_100%)]",
// // //         "bg-[length:400%_100%]",
// // //         "[animation:gradientLR_2.5s_linear_infinite]",
// // //         "[@keyframes_gradientLR]{0%{background-position:0%_50%}100%{background-position:100%_50%}}",

// // //         // interactions
// // //         "transition-all duration-200 ease-out",
// // //         "hover:-translate-y-[2px] hover:shadow-lg",
// // //         "active:translate-y-0 active:shadow-md",

// // //         // disabled
// // //         "disabled:opacity-50 disabled:cursor-not-allowed",
// // //         "disabled:transform-none disabled:shadow-none",
// // //         "disabled:[animation:none]",

// // //         className,
// // //       ].join(" ")}
// // //     >
// // //       <BsStars className="text-[12px] text-[#F8EDCE]" />
// // //       {loading ? "Generating..." : children}
// // //     </button>
// // //   );
// // // };










// // import React from "react";
// // import { BsStars } from "react-icons/bs";

// // type AiButtonProps = {
// //   onClick?: () => void;
// //   disabled?: boolean;
// //   loading?: boolean;
// //   children?: React.ReactNode;
// //   className?: string;
// // };

// // export const AiButton: React.FC<AiButtonProps> = ({
// //   onClick,
// //   disabled = false,
// //   loading = false,
// //   children = "AI Insights",
// //   className = "",
// // }) => {
// //   return (
// //     <button
// //       type="button"
// //       onClick={onClick}
// //       disabled={disabled}
// //       style={{ boxShadow: "0px 4px 4px 0px #00000040" }}
// //       className={[
// //         "relative overflow-hidden",
// //         "rounded-sm xl:px-4 px-3",
// //         "flex items-center gap-1 text-nowrap",
// //         "text-[#F8EDCE]",

// //         // 🔥 Moving gradient LEFT → RIGHT
// //         "bg-[linear-gradient(90deg,_#7c3aed,_#6366f1,_#06b6d4,_#6366f1,_#7c3aed)]",
// //         "bg-[length:300%_100%]",
// //         "animate-ai-gradient",

// //         // interactions
// //         "transition-all duration-200 ease-out",
// //         "hover:-translate-y-[2px] hover:shadow-lg",
// //         "active:translate-y-0 active:shadow-md",

// //         // disabled
// //         "disabled:opacity-50 disabled:cursor-not-allowed",
// //         "disabled:[animation:none]",

// //         className,
// //       ].join(" ")}
// //     >
// //       <BsStars className="text-[12px]" />
// //       {loading ? "Generating..." : children}

// //       {/* Keyframes (Tailwind v4 inline) */}
// //       <style jsx>{`
// //         @keyframes ai-gradient {
// //           0% {
// //             background-position: 0% 50%;
// //           }
// //           100% {
// //             background-position: 100% 50%;
// //           }
// //         }
// //         .animate-ai-gradient {
// //           animation: ai-gradient 2.8s linear infinite;
// //         }
// //       `}</style>
// //     </button>
// //   );
// // };












// import React from "react";
// import { BsStars } from "react-icons/bs";

// type AiButtonProps = {
//   onClick?: () => void;
//   disabled?: boolean;
//   loading?: boolean;
//   children?: React.ReactNode;
//   className?: string;
// };

// export const AiButton: React.FC<AiButtonProps> = ({
//   onClick,
//   disabled = false,
//   loading = false,
//   children = "AI Insights",
//   className = "",
// }) => {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       disabled={disabled}
//       className={[
//         "relative overflow-hidden",
//         "bg-custom-effect",
//         "rounded-sm p-2",
//         "text-nowrap flex items-center gap-1 justify-end",
//         "text-[#F8EDCE]",

//         // interactions
//         "transition-all duration-200 ease-out",
//         "hover:-translate-y-[2px] hover:shadow-lg",
//         "active:translate-y-0 active:shadow-md",

//         // disabled
//         "disabled:opacity-50 disabled:cursor-not-allowed",
//         "disabled:transform-none disabled:shadow-none",

//         className,
//       ].join(" ")}
//       style={{ boxShadow: "0px 4px 4px 0px #00000040"}}
//     >
//       {/* Base brand gradient */}
//       <span className="ai-brand-bg" aria-hidden="true" />

//       {/* Animated AI gradient */}
//       <span className="ai-animated-bg" aria-hidden="true" />

//       {/* Shimmer overlay */}
//       <span className="ai-shimmer" aria-hidden="true" />

//       {/* Content */}
//       <span className="relative z-10 flex items-center gap-1">
//         <BsStars style={{ fontSize: "12px", color: "#F8EDCE" }} />
//         {loading ? "Generating..." : children}
//       </span>

//       <style jsx>{`
//         /* Brand gradient (your provided one) */
//         .ai-brand-bg {
//           position: absolute;
//           inset: 0;
//           background-image: linear-gradient(
//             99.81deg,
//            #5EA68E 0%,
//             #37455f 97.72%
//           );
//           z-index: 0;
//         }

//         /* Animated diagonal gradient (AI motion layer) */
//         .ai-animated-bg {
//           position: absolute;
//           inset: 0;
//           background-image: linear-gradient(
//             45deg,
//             rgba(124, 58, 237, 0.75),
//             rgba(99, 102, 241, 0.75),
//             rgba(6, 182, 212, 0.75),
//             rgba(99, 102, 241, 0.75),
//             rgba(124, 58, 237, 0.75)
//           );
//           background-size: 320% 320%;
//           animation: ai-gradient-diagonal 3s linear infinite;
//           z-index: 1;
//         }

//         /* Shimmer overlay */
//         .ai-shimmer {
//           position: absolute;
//           inset: -40%;
//           background: linear-gradient(
//             115deg,
//             transparent 42%,
//             rgba(248, 237, 206, 0.22) 50%,
//             transparent 58%
//           );
//           transform: translateX(-45%) rotate(12deg);
//           animation: ai-shimmer-sweep 2.4s ease-in-out infinite;
//           mix-blend-mode: overlay;
//           pointer-events: none;
//           z-index: 2;
//         }

//         /* Hover glow */
//         button:hover .ai-animated-bg {
//           filter: brightness(1.08) saturate(1.2);
//         }

//         /* Disable animations when disabled */
//         button:disabled .ai-animated-bg,
//         button:disabled .ai-shimmer {
//           animation: none;
//         }

//         @keyframes ai-gradient-diagonal {
//           0% {
//             background-position: 0% 100%;
//           }
//           100% {
//             background-position: 100% 0%;
//           }
//         }

//         @keyframes ai-shimmer-sweep {
//           0% {
//             transform: translateX(-55%) rotate(12deg);
//             opacity: 0.3;
//           }
//           50% {
//             opacity: 0.55;
//           }
//           100% {
//             transform: translateX(55%) rotate(12deg);
//             opacity: 0.3;
//           }
//         }
//       `}</style>
//     </button>
//   );
// };












import React from "react";
import { BsStars } from "react-icons/bs";

type AiButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export const AiButton: React.FC<AiButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  children = "AI Insights",
  className = "",
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "relative overflow-hidden",
        "bg-custom-effect", // ok to keep, but spans will handle bg anyway
        "rounded-sm p-2",
        "text-nowrap flex items-center gap-1 justify-end",
        "text-[#F8EDCE]",

        "transition-all duration-200 ease-out",
        "hover:-translate-y-[2px] hover:shadow-lg",
        "active:translate-y-0 active:shadow-md",

        "disabled:opacity-50 disabled:cursor-not-allowed",
        "disabled:transform-none disabled:shadow-none",

        className,
      ].join(" ")}
      style={{ boxShadow: "0px 4px 4px 0px #00000040" }}
    >
      {/* Base brand gradient */}
      <span className="ai-brand-bg" aria-hidden="true" />

      {/* Animated AI gradient (now BLENDED so green stays visible) */}
      <span className="ai-animated-bg" aria-hidden="true" />

      {/* Shimmer overlay */}
      <span className="ai-shimmer" aria-hidden="true" />

      {/* Content */}
      <span className="relative z-10 flex items-center gap-1">
        <BsStars style={{ fontSize: "12px", color: "#F8EDCE" }} />
        {loading ? "Generating..." : children}
      </span>

      <style jsx>{`
        /* ✅ Your green/blue brand gradient */
        .bg-custom-effect {
          background-image: linear-gradient(99.81deg, #5ea68e 0%, #37455f 97.72%);
        }

        .ai-brand-bg {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(99.81deg, #5ea68e 0%, #37455f 97.72%);
          z-index: 0;
        }

        /* ✅ Blend this layer instead of covering the brand bg */
        /* Animated brand gradient (same colors as left button) */
.ai-animated-bg {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;

  /* ✅ SAME palette as your left button, just stretched for motion */
  background-image: linear-gradient(
    45deg,
    #5ea68e 0%,
    #4f8f7b 22%,
    #37455f 55%,
    #4f8f7b 78%,
    #5ea68e 100%
  );

  background-size: 320% 320%;
  animation: ai-gradient-diagonal 3s linear infinite;

  /* ✅ no blending / no opacity tint */
  opacity: 1;
  mix-blend-mode: normal;
}




        .ai-shimmer {
          position: absolute;
          inset: -40%;
          background: linear-gradient(
            115deg,
            transparent 42%,
            rgba(248, 237, 206, 0.22) 50%,
            transparent 58%
          );
          transform: translateX(-45%) rotate(12deg);
          animation: ai-shimmer-sweep 1.5s ease-in-out infinite;
          mix-blend-mode: overlay;
          pointer-events: none;
          z-index: 2;
        }

        button:hover .ai-animated-bg {
          filter: brightness(1.08) saturate(1.2);
          opacity: 0.45;
        }

        button:disabled .ai-animated-bg,
        button:disabled .ai-shimmer {
          animation: none;
        }

        @keyframes ai-gradient-diagonal {
          0% {
            background-position: 0% 100%;
          }
          100% {
            background-position: 100% 0%;
          }
        }

        @keyframes ai-shimmer-sweep {
          0% {
            transform: translateX(-55%) rotate(12deg);
            opacity: 0.3;
          }
          50% {
            opacity: 0.55;
          }
          100% {
            transform: translateX(55%) rotate(12deg);
            opacity: 0.3;
          }
        }
      `}</style>
    </button>
  );
};
