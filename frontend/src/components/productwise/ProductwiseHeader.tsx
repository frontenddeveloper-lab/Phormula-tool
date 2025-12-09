// components/productwise/ProductwiseHeader.tsx
"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { formatCountryLabel } from "./productwiseHelpers";

interface ProductwiseHeaderProps {
  canShowResults: boolean;
  countryName?: string;
  productname?: string;
  headingPeriod: string;
}

const ProductwiseHeader: React.FC<ProductwiseHeaderProps> = ({
  canShowResults,
  countryName,
  productname,
  headingPeriod,
}) => (
  <div className="mb-4">
    <h2
      className="
        flex flex-wrap items-baseline gap-x-1 gap-y-1
        text-[15px] sm:text-lg md:text-xl lg:text-2xl
        font-semibold text-[#414042]
      "
    >
      <PageBreadcrumb
        pageTitle="SKU Performance Analysis"
        variant="page"
        align="left"
        textSize="2xl"
      />

      {/* {canShowResults && (
        <>
          <span className="text-gray-400">-</span>
          <span
            className="
              text-lg sm:text-2xl md:text-2xl
              font-bold text-green-500
            "
          >
            {countryName && formatCountryLabel(countryName)}
            {productname && `: ${productname}`}{" "}
            {headingPeriod && `(${headingPeriod})`}
          </span>
        </>
      )} */}
    </h2>
  </div>
);

export default ProductwiseHeader;
