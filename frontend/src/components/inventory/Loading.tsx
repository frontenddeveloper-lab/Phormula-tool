'use client';

import { FaCogs, FaChartLine, FaCalculator } from 'react-icons/fa';
import Loader from './Loader';

export default function Loading() {
  const openExploreTab = () => {
    window.open('/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#f8f9fa]">
      <div className="bg-white rounded-2xl shadow-[0px_8px_24px_rgba(0,0,0,0.10)] p-6 w-full max-w-md text-center font-[Lato]">

        {/* Animated Logo */}
        <Loader
  src="/loader/infinity-unscreen.gif"
  size={100}
  label="Loading animation"
  transparent
/>

        {/* Animated Dots */}
        <div className="flex justify-center my-3">
  <span className="w-2 h-2 mx-1 rounded-full bg-[#5EA68E] animate-dot delay-[0ms]"></span>
  <span className="w-2 h-2 mx-1 rounded-full bg-[#5EA68E] animate-dot delay-[200ms]"></span>
  <span className="w-2 h-2 mx-1 rounded-full bg-[#5EA68E] animate-dot delay-[400ms]"></span>
  <span className="w-2 h-2 mx-1 rounded-full bg-[#5EA68E] animate-dot delay-[600ms]"></span>
  <span className="w-2 h-2 mx-1 rounded-full bg-[#5EA68E] animate-dot delay-[800ms]"></span>
</div>

        <h2 className="text-[#414042] text-2xl mt-2">Processing your data</h2>
        <p className="text-[#414042] text-sm mb-3">Analyzing financial information securely</p>

        <div className="bg-[#F47A0026] rounded-md p-3 flex items-center justify-center text-[#414042] border border-[#F47A00] text-sm my-2">
          <FaCogs className="mr-2" /> Optimizing results for accuracy
        </div>

        <div className="bg-[#87AD1226] rounded-md p-3 flex items-center justify-center text-[#414042]  border border-[#F47A00] text-sm my-2">
          <FaChartLine className="mr-2" /> Processing market data and trends
        </div>

        <div className="bg-[#FFBE2526] rounded-md p-3 flex items-center justify-center text-[#414042]  border border-[#FFBE25] text-sm my-2">
          <FaCalculator className="mr-2" /> Running calculations and data analysis
        </div>

        <p className="text-[#414042] text-sm mt-4">Results will be available shortly.</p>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-5">
          <button
            onClick={() => alert('You will be notified.')}
            className="bg-[#37455F] text-[#f8edcf] px-4 py-2 rounded-md text-sm font-semibold hover:bg-[#34495e] shadow-[0px_4px_4px_0px_#00000040]
"
          >
            Notify me
          </button>
          <button
            onClick={openExploreTab}
            className="bg-[#37455F] text-[#f8edcf] px-4 py-2 rounded-md text-sm font-semibold hover:bg-[#34495e] shadow-[0px_4px_4px_0px_#00000040]"
          >
            Till then explore tab
          </button>
        </div>
      </div>
    </div>
  );
}
