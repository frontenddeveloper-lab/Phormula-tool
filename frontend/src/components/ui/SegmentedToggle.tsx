// "use client";

// import React from "react";

// type SegmentedValue = string | number;

// export interface SegmentedOption<T extends SegmentedValue = SegmentedValue> {
//   value: T;
//   label?: string; // if not provided, we’ll fallback to value.toString()
// }

// interface SegmentedToggleProps<T extends SegmentedValue = SegmentedValue> {
//   value: T;
//   options: SegmentedOption<T>[];
//   onChange: (val: T) => void;
//   className?: string;
//   /** Tailwind text size (e.g. 'text-xs', 'text-sm') */
//   textSizeClass?: string;
// }

// /**
//  * Reusable segmented toggle (pill tabs) with:
//  * - selected state bg: #5EA68E (green) + white text
//  * - hover state bg: #E4F3EC on unselected
//  */
// export function SegmentedToggle<T extends SegmentedValue = SegmentedValue>({
//   value,
//   options,
//   onChange,
//   className = "",
//   textSizeClass = "text-xs",
// }: SegmentedToggleProps<T>) {
//   return (
//     <div
//       className={`inline-flex gap-1 rounded-lg border bg-gray-50 p-1 ${textSizeClass} ${className}`}
//     >
//       {options.map((opt) => {
//         const active = opt.value === value;
//         const label = opt.label ?? String(opt.value);

//         return (
//           <button
//             key={String(opt.value)}
//             type="button"
//             onClick={() => onChange(opt.value)}
//             className={[
//               "min-w-[60px] rounded-lg px-3 py-1 text-center font-medium transition-colors duration-150",
//               active
//                 ? "bg-[#5EA68E] text-yellow-200 shadow-sm" // selected
//                 : "text-charcoal-500 hover:bg-[#5EA68E40]", // hover on unselected
//             ].join(" ")}
//           >
//             {label}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// export default SegmentedToggle;






















"use client";

import React from "react";

type SegmentedValue = string | number;

export interface SegmentedOption<T extends SegmentedValue = SegmentedValue> {
  value: T;
  label?: string;
}

interface SegmentedToggleProps<T extends SegmentedValue = SegmentedValue> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (val: T) => void;
  className?: string;
  textSizeClass?: string;
}

/**
 * Responsive segmented toggle:
 * - Mobile: full width, each segment equal width
 * - Desktop: auto width by default (unless parent forces width)
 */
export function SegmentedToggle<T extends SegmentedValue = SegmentedValue>({
  value,
  options,
  onChange,
  className = "",
  textSizeClass = "text-xs",
}: SegmentedToggleProps<T>) {
  return (
    <div
      className={[
        // ✅ full width by default, can be overridden by parent className
        "w-full sm:w-auto",
        "flex rounded-lg border bg-gray-50 p-1",
        "gap-1",
        textSizeClass,
        className,
      ].join(" ")}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const label = opt.label ?? String(opt.value);

        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              // ✅ equal width segments when container is w-full
              "flex-1",
              // ✅ keeps nice padding; remove min-width so it can shrink
              "rounded-lg px-3 py-1",
              "text-center font-medium transition-colors duration-150",
              "whitespace-nowrap",
              active
                ? "bg-[#5EA68E] text-yellow-200 shadow-sm"
                : "text-charcoal-500 hover:bg-[#5EA68E40]",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedToggle;
