"use client";

import React, { useEffect, useState } from "react";

interface Product {
    product_name: string;
}

interface ProductSearchDropdownProps {
    authToken?: string | null;
    onProductSelect: (productName: string) => void;
}

const ProductSearchDropdown: React.FC<ProductSearchDropdownProps> = ({
    authToken,
    onProductSelect,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [allLoading, setAllLoading] = useState(false);
    const [hasLoadedAll, setHasLoadedAll] = useState(false);

    const hasSearch = searchQuery.trim().length > 0;

    const displayedProducts = hasSearch ? searchResults : allProducts;

    // -------- Fetch ALL products (for dropdown) --------
    const fetchAllProducts = async () => {
        if (hasLoadedAll) return;
        try {
            setAllLoading(true);
            // TODO: change this endpoint to whatever returns ALL products
            const res = await fetch("http://localhost:5000/Product_list", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${authToken ?? ""}`,
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const json = await res.json();
            setAllProducts(json.products || []);
            setHasLoadedAll(true);
        } catch (err) {
            console.error("Error fetching all products:", err);
            setAllProducts([]);
        } finally {
            setAllLoading(false);
        }
    };

    // -------- Debounced SEARCH behaviour --------
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }
            setSearchLoading(true);
            try {
                const res = await fetch(
                    `http://localhost:5000/Product_search?query=${encodeURIComponent(
                        searchQuery
                    )}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${authToken ?? ""}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const json = await res.json();
                setSearchResults(json.products || []);
            } catch (e) {
                console.error("Search error:", e);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, authToken]);

    const handleToggleDropdown = async () => {
        const next = !showDropdown;
        setShowDropdown(next);
        if (next && !hasLoadedAll) {
            await fetchAllProducts();
        }
    };

    const handleSelect = (p: Product) => {
        onProductSelect(p.product_name);
        setShowDropdown(false);
        setSearchQuery("");
    };

    return (
        <div className="relative min-w-[280px] w-full max-w-[320px]">
            <div className="relative flex items-center">
                <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full rounded-lg border border-[#414042]/90 bg-white px-3 py-2 pl-7 pr-8 text-base outline-none transition-colors focus:border-[#414042]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() =>
                        setTimeout(() => setShowDropdown(false), 200)
                    }
                />

                {/* Search icon */}
                <svg
                    className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#414042]/50"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>

                {/* Dropdown toggle */}
                <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-xs text-gray-600"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleToggleDropdown}
                    aria-label="Toggle products dropdown"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`h-3 w-3 transition-transform ${
                            showDropdown ? "rotate-180" : ""
                        }`}
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>

                {(searchLoading || allLoading) && (
                    <span className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
                )}
            </div>

            {/* Dropdown panel (search results OR all products) */}
            {showDropdown && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-md">
                    {displayedProducts.length > 0 ? (
                        displayedProducts.map((p, i) => (
                            <button
                                key={`${p.product_name}-${i}`}
                                className="w-full cursor-pointer px-4 py-3 text-left hover:bg-gray-50"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelect(p)}
                            >
                                <div className="font-semibold text-gray-800">
                                    {p.product_name}
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            {hasSearch
                                ? `No products found for "${searchQuery}"`
                                : hasLoadedAll
                                ? "No products available"
                                : "Loading products..."}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductSearchDropdown;
