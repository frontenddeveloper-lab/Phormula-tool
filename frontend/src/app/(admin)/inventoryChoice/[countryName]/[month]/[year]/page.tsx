'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { FaLock } from "react-icons/fa";
import { API_BASE } from "@/config/env";

export default function InventoryChoicePage() {
  const router = useRouter();
  const params = useParams() as { countryName?: string; month?: string; year?: string };

  const countryName = params?.countryName;
  const { month, year } = params;

  const today = new Date();
  const prevIdx = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
  const monthNames = [
    'january',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  const effectiveMonth = month || monthNames[prevIdx];
  const effectiveYear = year || String(today.getFullYear());

  // ---- Country Profile Popup State ----
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [country, setCountry] = useState<'uk' | 'us'>(() =>
    countryName?.toLowerCase() === 'us' ? 'us' : 'uk'
  );
  const [transitTime, setTransitTime] = useState('');
  const [stockUnit, setStockUnit] = useState('');
  const marketplace = 'amazon';

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryProfileKeyBase = countryName || 'global';

  // Check once if country profile is already completed for this country/user
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `countryProfileCompleted-${countryProfileKeyBase}`;
    const hasProfile = localStorage.getItem(key) === 'true';
    setProfileCompleted(hasProfile);
    setIsPopupOpen(!hasProfile);
  }, [countryProfileKeyBase]);

  // Only redirect to automation/manual if profile is completed
  useEffect(() => {
    if (!profileCompleted) return;
    if (typeof window === 'undefined') return;

    const method = localStorage.getItem(
      `forecastMethod-${countryName}-${effectiveMonth}-${effectiveYear}`
    );
    if (method === 'automation')
      router.push(`/inventoryForecast/${countryName}/${effectiveMonth}/${effectiveYear}`);
    else if (method === 'manual')
      router.push(`/manual/${countryName}/${effectiveMonth}/${effectiveYear}`);
  }, [profileCompleted, countryName, effectiveMonth, effectiveYear, router]);

  const handleAutomation = () => {
    if (!profileCompleted) {
      setIsPopupOpen(true);
      return;
    }
    localStorage.setItem(
      `forecastMethod-${countryName}-${effectiveMonth}-${effectiveYear}`,
      'automation'
    );
    router.push(`/inventoryForecast/${countryName}/${effectiveMonth}/${effectiveYear}`);
  };

  const handleManual = () => {
    if (!profileCompleted) {
      setIsPopupOpen(true);
      return;
    }
    localStorage.setItem(
      `forecastMethod-${countryName}-${effectiveMonth}-${effectiveYear}`,
      'manual'
    );
    router.push(`/manual/${countryName}/${effectiveMonth}/${effectiveYear}`);
  };

  // ---- Save Country Profile (Popup Submit) ----
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setErrors({});

    const validationErrors: { [key: string]: string } = {};

    if (!country) {
      validationErrors.country = 'Country is required';
    }

    if (!transitTime) {
      validationErrors.transit_time = 'Transit time is required';
    } else if (!Number.isInteger(Number(transitTime)) || Number(transitTime) <= 0) {
      validationErrors.transit_time = 'Transit time must be a positive integer';
    }

    if (stockUnit === '') {
      validationErrors.stock_unit = 'Stock unit is required';
    } else if (!Number.isInteger(Number(stockUnit)) || Number(stockUnit) < 0) {
      validationErrors.stock_unit = 'Stock unit must be a non-negative integer';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      if (typeof window === 'undefined') {
        setApiError('Window not available');
        return;
      }

      // ✅ yahan change kiya: jwtToken use ho raha hai
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setApiError('User not authenticated. Token missing.');
        return;
      }

      const res = await fetch(`${API_BASE}/country-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` // jwtToken yahan use ho raha
          // alternatively directly:
          // Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
        },
        body: JSON.stringify({
          country,
          marketplace,
          transit_time: Number(transitTime),
          stock_unit: Number(stockUnit)
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.errors) {
          setErrors((prev) => ({ ...prev, ...data.errors }));
          setApiError('Please fix the highlighted fields.');
        } else if (data?.error) {
          setApiError(data.error);
        } else {
          setApiError('Failed to save country profile.');
        }
        return;
      }

      // Success – never show popup again for this country/user
      const key = `countryProfileCompleted-${countryProfileKeyBase}`;
      localStorage.setItem(key, 'true');
      setProfileCompleted(true);
      setIsPopupOpen(false);
    } catch (err) {
      console.error(err);
      setApiError('Something went wrong while saving country profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center font-lato px-4 py-10 relative">
      {/* Country Profile Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-[#414042] mb-1 text-center">
              Country Profile
            </h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Please fill these details once to continue with inventory forecasting.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value as 'uk' | 'us')}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5EA68E]"
                >
                  <option value="UK">UK</option>
                  <option value="US">US</option>
                </select>
                {errors.country && (
                  <p className="text-xs text-red-500 mt-1">{errors.country}</p>
                )}
              </div>

              {/* Marketplace (fixed Amazon) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marketplace
                </label>
                <input
                  type="text"
                  value={marketplace}
                  disabled
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Marketplace is fixed to Amazon and cannot be changed.
                </p>
              </div>

              {/* Transit Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transit Time (months) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={transitTime}
                  onChange={(e) => setTransitTime(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5EA68E]"
                  placeholder="e.g. 7"
                />
                {errors.transit_time && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.transit_time}
                  </p>
                )}
              </div>

              {/* Stock Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Unit <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={stockUnit}
                  onChange={(e) => setStockUnit(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5EA68E]"
                  placeholder="e.g. 100"
                />
                {errors.stock_unit && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.stock_unit}
                  </p>
                )}
              </div>

              {apiError && (
                <p className="text-xs text-red-500 mt-1 text-center">{apiError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full bg-[#5EA68E] text-[#F8EDCE] py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow hover:bg-[#4e937b] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save & Continue'}
              </button>
            </form>

            <p className="text-[11px] text-gray-400 mt-3 text-center">
              This popup will only appear once after you save your country profile.
            </p>
          </div>
        </div>
      )}

      {/* Existing Inventory Choice UI */}
      <div className="bg-white rounded-2xl shadow-[6px_6px_7px_0px_#00000026] w-full max-w-lg md:p-8 p-4 border border-gray-200">
        <h1 className="md:text-2xl text-xl font-semibold text-center text-[#414042]">
          Inventory Forecast
        </h1>
        <p className="text-[#414042] text-center mt-1 md:mb-6 mb-4 md:text-base text-sm">
          Choose your forecasting method to sync your sales data
        </p>

        <div className="bg-[#F3F8F6] border border-[#5EA68E] rounded-xl md:p-6 p-4">
          <div className="flex justify-start items-center gap-2">
            <div className="bg-[#D9D9D9] p-2 rounded-lg">
              {/* link icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5EA68E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#414042]">Automation</h2>
              <p className="md:text-sm text-xs text-[#5EA68E]">Setup in 30 seconds</p>
            </div>
          </div>
          <ul className="space-y-2 text-gray-700 md:text-sm text-xs mt-3">
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-[#5EA68E]" />
              AI-powered prediction
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-[#5EA68E]" />
              Historical data analysis
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-[#5EA68E]" />
              Always up-to-date insights
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={16} className="text-[#5EA68E]" />
              No manual work required
            </li>
          </ul>
          <button
            onClick={handleAutomation}
            className="mt-6 w-full bg-[#5EA68E] text-[#F8EDCE] py-2.5 sm:text-base text-sm rounded-lg font-bold flex items-center justify-center gap-2 shadow hover:bg-[#4e937b] transition-all"
          >
            Enable Automation
          </button>
        </div>

        <div className="flex items-center md:my-6 my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-500 text-sm">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="text-center">
          <button
            onClick={handleManual}
            className="text-[#414042] font-medium hover:underline md:text-sm text-xs flex items-center justify-center gap-1 mx-auto"
          >
            Set up manual file uploads instead
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 17 5-5-5-5" />
              <path d="m13 17 5-5-5-5" />
            </svg>
          </button>
        </div>

        <div className="flex items-center md:my-6 my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <p className="text-gray-500 text-xs mt-8 text-center flex items-center justify-center gap-1">
          <FaLock size={14} />
          Your credentials are encrypted and stored securely
        </p>
      </div>
    </div>
  );
}
