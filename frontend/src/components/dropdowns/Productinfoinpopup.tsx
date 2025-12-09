"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useRouter, usePathname } from "next/navigation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

type ProductInfoInPopupProps = {
  productname?: string; // default "Menthol"
  onClose: () => void;
  countryName: string;
  month: string;
  year: string | number;
};

type ApiResponse = {
  success?: boolean;
  data?: Record<
    string, // country key (e.g., "uk", "us", "global")
    { month: string; net_sales: number }[]
  >;
  message?: string;
};

const getCurrencySymbol = (country: string) => {
  switch (country.toLowerCase()) {
    case "uk":
      return "£";
    case "india":
      return "₹";
    case "us":
      return "$";
    case "europe":
    case "eu":
      return "€";
    case "global":
      return "$";
    default:
      return "¤";
  }
};

const Productinfoinpopup: React.FC<ProductInfoInPopupProps> = ({
  productname = "Menthol",
  onClose,
  countryName,
  month,
  year,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const isImprovementsPage = useMemo(
    () => pathname?.toLowerCase().includes("mprovements") ?? false,
    [pathname]
  );

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const authToken =
    typeof window !== "undefined" ? localStorage.getItem("jwtToken") : null;

  const currencySymbol = countryName ? getCurrencySymbol(countryName) : "¤";

  // Search (no visible UI here, retained for future use)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Filters
  const [timeRange, setTimeRange] = useState<"Yearly" | "Quarterly">("Yearly");
  const selectedYear =
    typeof year === "string" ? parseInt(year) || new Date().getFullYear() : year;
  const [selectedQuarter, setSelectedQuarter] = useState<"1" | "2" | "3" | "4">("1");
  const [selectedCountries, setSelectedCountries] = useState<{
    uk: boolean;
    us: boolean;
    global: boolean;
  }>({
    uk: true,
    us: true,
    global: true,
  });

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const quarters = [
    { value: "1", label: "Q1" },
    { value: "2", label: "Q2" },
    { value: "3", label: "Q3" },
    { value: "4", label: "Q4" },
  ];

  const handleCountryChange = (country: "uk" | "us" | "global") => {
    setSelectedCountries((prev) => ({ ...prev, [country]: !prev[country] }));
  };

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/Product_search?query=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const d = await response.json();
      setSearchResults(d.products || []);
      setShowSearchResults(true);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => searchProducts(searchQuery), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchProductData = async () => {
    setLoading(true);
    setError("");

    try {
      const countries = Object.keys(selectedCountries).filter(
        (c) => (selectedCountries as any)[c]
      );

      const payload = {
        product_name: productname,
        time_range: timeRange,
        year: selectedYear,
        quarter: timeRange === "Quarterly" ? selectedQuarter : null,
        countries,
      };

      const response = await fetch(`http://localhost:5000/ProductwisePerformance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP error! status: ${response.status}`);
      }

      const resp = (await response.json()) as ApiResponse;
      if (resp?.success) {
        setData(resp);
      } else {
        throw new Error(resp?.message || "API returned unsuccessful response");
      }
    } catch (err: any) {
      console.error("API Error:", err);
      setError(err?.message || "Failed to fetch data from server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productname, year]);

  const getCountryColor = (country: string) => {
    const colors: Record<string, string> = {
      uk: "#AB64B5",
      us: "#87AD12",
      global: "#F47A00",
    };
    return colors[country] || "#ff7c7c";
  };

  const prepareChartData = () => {
    if (!data || !data.data) return [] as any[];

    const allMonths = new Set<string>();
    Object.values(data.data).forEach((countryData) => {
      countryData.forEach((m) => allMonths.add(m.month));
    });

    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      const order = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return order.indexOf(a) - order.indexOf(b);
    });

    return sortedMonths.map((m) => {
      const point: Record<string, number | string> = { month: m };
      Object.entries(data.data!).forEach(([country, countryData]) => {
        const found = countryData.find((d) => d.month === m);
        point[country] = found ? found.net_sales : 0;
      });
      return point;
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const chartJSData = useMemo(() => {
    const raw = prepareChartData();
    if (!raw || raw.length === 0) return null;

    const labels = raw.map((r: any) => r.month);
    const datasets = Object.keys(selectedCountries)
      .filter((c) => (selectedCountries as any)[c])
      .map((country) => ({
        label: country.toUpperCase(),
        data: raw.map((r: any) => (r[country] as number) || 0),
        borderColor: getCountryColor(country),
        backgroundColor: getCountryColor(country),
        tension: 0.1,
        pointRadius: 3,
        fill: false,
      }));

    return { labels, datasets };
  }, [data, selectedCountries]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.parsed.y;
            return `${ctx.dataset.label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: { title: { display: true, text: "Month" } },
      y: {
        title: { display: true, text: `Amount (${currencySymbol})` },
        min: 0,
        ticks: { padding: 0 },
      },
    },
  } as const;

  const titleSuffix =
    timeRange === "Yearly" ? `YTD ${selectedYear}` : `Q${selectedQuarter}'${selectedYear}`;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-4 sm:p-5 md:p-6 w-[95vw] max-w-[1000px] max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading */}
        {loading && (
          <div className="py-12 text-center">
            <video
              src="/infinity2.webm"
              autoPlay
              loop
              muted
              playsInline
              className="w-[150px] h-auto mx-auto"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-center">
              <div className="text-red-600 text-xl mr-3">❌</div>
              <p className="text-red-700 font-medium m-0">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="flex flex-col gap-6">
            {/* Header & toggles */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 className="text-[18px] font-bold text-[#414042]">
                  Net Sales Trend –{" "}
                  <span className="text-[#5EA68E] font-extrabold">
                    {productname} ({titleSuffix})
                  </span>
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  {Object.entries(selectedCountries).map(([country, isSelected]) => {
                    const color = getCountryColor(country);
                    return (
                      <label
                        key={country}
                        className={[
                          "cursor-pointer select-none inline-flex items-center gap-2",
                          "rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors",
                          isSelected ? "text-white" : "text-gray-700",
                        ].join(" ")}
                        style={{
                          backgroundColor: isSelected ? color : "transparent",
                          borderColor: color,
                        }}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isSelected}
                          onChange={() => handleCountryChange(country as "uk" | "us" | "global")}
                        />
                        <span>{country.toUpperCase()}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="w-full flex items-center justify-center">
              <div className="w-full h-[48vh] sm:h-[50vh] md:h-[52vh]">
                {chartJSData ? (
                  <Line data={chartJSData} options={chartOptions} />
                ) : (
                  <p className="text-center text-sm text-gray-500">No chart data available</p>
                )}
              </div>
            </div>

            {/* CTA */}
            {!isImprovementsPage && (
              <div className="flex justify-end">
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2 font-semibold text-amber-100 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  onClick={() =>
                    router.push(
                      `/productwiseperformance/${encodeURIComponent(
                        productname
                      )}/${encodeURIComponent(countryName)}/${encodeURIComponent(
                        month
                      )}/${encodeURIComponent(String(year))}`
                    )
                  }
                >
                  Check Full Performance
                  <i className="fa-solid fa-arrow-up-right-from-square" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Productinfoinpopup;
