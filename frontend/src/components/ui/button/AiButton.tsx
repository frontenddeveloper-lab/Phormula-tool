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
      style={{ boxShadow: "0px 4px 4px 0px #00000040" }}
      className={[
        "relative overflow-hidden",
        "rounded-sm xl:px-4 px-3",
        "text-nowrap flex items-center gap-1 justify-end",
        "text-[#F8EDCE]",

        // ✅ moving gradient (Tailwind v4, no config)
        // Use underscores in arbitrary values
        "bg-[linear-gradient(90deg,_#7c3aed_0%,_#6366f1_25%,_#06b6d4_50%,_#6366f1_75%,_#7c3aed_100%)]",
        "bg-[length:400%_100%]",
        "[animation:gradientLR_2.5s_linear_infinite]",
        "[@keyframes_gradientLR]{0%{background-position:0%_50%}100%{background-position:100%_50%}}",

        // interactions
        "transition-all duration-200 ease-out",
        "hover:-translate-y-[2px] hover:shadow-lg",
        "active:translate-y-0 active:shadow-md",

        // disabled
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "disabled:transform-none disabled:shadow-none",
        "disabled:[animation:none]",

        className,
      ].join(" ")}
    >
      <BsStars className="text-[12px] text-[#F8EDCE]" />
      {loading ? "Generating..." : children}
    </button>
  );
};
