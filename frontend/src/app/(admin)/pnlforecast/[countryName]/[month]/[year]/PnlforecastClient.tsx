'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useParams, useRouter } from 'next/navigation';
import './Styles.css';
import PnlForecastChart from '@/components/pnlforecast/PnlForecastChart';
import { ChevronLeft, ChevronRight } from "lucide-react";


type RowData = {
  sku?: string;
  product_name?: string;
  value?: number;
  [key: string]: any;
};

type ChartDataItem = {
  month: string;
  SALES?: number | null;
  COGS?: number | null;
  'AMAZON EXPENSE'?: number | null;
  'ADVERTISING COSTS'?: number | null;
  'CM1 PROFIT'?: number | null;
  'CM2 PROFIT'?: number | null;
  isForecast?: boolean;
  isHistorical?: boolean;
};

type SelectedGraphs = Record<string, boolean>;

const getCurrencySymbol = (country: string): string => {
  switch ((country || '').toLowerCase()) {
    case 'uk':
      return '£';
    case 'india':
      return '₹';
    case 'us':
      return '$';
    case 'europe':
    case 'eu':
      return '€';
    case 'global':
      return '$';
    default:
      return '¤';
  }
};

const formatNumber = (val: any): string => {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return 'N/A';
  return Math.abs(Number(val)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getPreviousMonthYear = (month: string, year: string) => {
  const date = new Date(`${month} 1, ${year}`);
  date.setMonth(date.getMonth() - 1);

  return {
    month: date.toLocaleString("default", { month: "long" }),
    year: date.getFullYear().toString(),
  };
};


const formatPercent = (val: any): string => {
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '';
  return `${Number(val).toFixed(2)}%`;
};

const formatCellValue = (key: string, value: any): string => {
  if (value === null || value === undefined || value === '') return '';

  const rawKeys = ['forecast_sum', 'forecast_1st', 'forecast_2nd', 'forecast_3rd'];
  if (rawKeys.includes(key)) return value;

  const percentKeys = [
    'profit_percentage_sum',
    'profit_percentage_1st',
    'profit_percentage_2nd',
    'profit_percentage_3rd',
  ];
  if (percentKeys.includes(key)) return formatPercent(value);

  const formattedKeys = [
    'Total_Sales_sum',
    'Total_Sales_1st',
    'Total_Sales_2nd',
    'Total_Sales_3rd',
    'profit_sum',
    'profit_1st',
    'profit_2nd',
    'profit_3rd',
  ];
  if (formattedKeys.includes(key)) return formatNumber(value);

  return typeof value === 'number' || !isNaN(Number(value)) ? formatNumber(value) : value;
};

const Pnlforecast: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const countryName = (params?.countryName as string) || '';
  const urlMonth = (params?.month as string) || '';
const urlYear = (params?.year as string) || '';
  const currencySymbol = getCurrencySymbol(countryName);
  const { month, year } = getPreviousMonthYear(urlMonth, urlYear);

  const [data, setData] = useState<RowData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [showTacosSection, setShowTacosSection] = useState<boolean>(false);
  const [showCm1, setshowCm1] = useState<boolean>(false);
  const [showamazonfee, setshowamazonfee] = useState<boolean>(false);
  const [LosSalesUnits, setLosSalesUnits] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const toggleTacosSection = () => setShowTacosSection((p) => !p);
  const handleshowCm1click = () => setshowCm1((p) => !p);
  const handleAmazonFeeClick = () => setshowamazonfee((p) => !p);
  const handleLosSalesUnitsclick = () => setLosSalesUnits((p) => !p);

  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => ([
    'sku',
    'product_name',
    LosSalesUnits && 'forecast_1st',
    'Total_Sales_1st',
    'profit_1st',
    showCm1 && 'profit_percentage_1st',
    LosSalesUnits && 'forecast_2nd',
    'Total_Sales_2nd',
    'profit_2nd',
    showCm1 && 'profit_percentage_2nd',
    LosSalesUnits && 'forecast_3rd',
    'Total_Sales_3rd',
    'profit_3rd',
    showCm1 && 'profit_percentage_3rd',
    LosSalesUnits && 'forecast_sum',
    'Total_Sales_sum',
    'profit_sum',
    showCm1 && 'profit_percentage_sum',
  ].filter(Boolean) as string[]));

  useEffect(() => {
    setSelectedColumns(([
      'sku',
      'product_name',
      LosSalesUnits && 'forecast_1st',
      'Total_Sales_1st',
      'profit_1st',
      showCm1 && 'profit_percentage_1st',
      LosSalesUnits && 'forecast_2nd',
      'Total_Sales_2nd',
      'profit_2nd',
      showCm1 && 'profit_percentage_2nd',
      LosSalesUnits && 'forecast_3rd',
      'Total_Sales_3rd',
      'profit_3rd',
      showCm1 && 'profit_percentage_3rd',
      LosSalesUnits && 'forecast_sum',
      'Total_Sales_sum',
      'profit_sum',
      showCm1 && 'profit_percentage_sum',
    ].filter(Boolean) as string[]));
  }, [LosSalesUnits, showCm1]);

  const [selectedGraphs, setSelectedGraphs] = useState<SelectedGraphs>({
    SALES: true,
    COGS: true,
    'AMAZON EXPENSE': true,
    'ADVERTISING COSTS': true,
    'CM1 PROFIT': true,
    'CM2 PROFIT': true,
  });
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSelectedGraphs((prev) => ({ ...prev, [name]: checked }));
  };

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  const nextMonthDate = new Date(currentDate);
  nextMonthDate.setDate(1);
  nextMonthDate.setMonth(currentDate.getMonth() + 1);
  const nextMonth = nextMonthDate.toLocaleString('default', { month: 'long' });
  const nextMonthYear = nextMonthDate.getFullYear();

  const nextToNextMonthDate = new Date(currentDate);
  nextToNextMonthDate.setDate(1);
  nextToNextMonthDate.setMonth(currentDate.getMonth() + 2);
  const nextToNextMonth = nextToNextMonthDate.toLocaleString('default', { month: 'long' });
  const nextToNextMonthYear = nextToNextMonthDate.getFullYear();

  const formatMonthYear = (monthName: string, yearVal: number) => {
    const date = new Date(`${monthName} 1, ${yearVal}`);
    return date.toLocaleString('en-US', { month: 'short' }) + `'` + String(yearVal).slice(-2);
  };

  const fetchPreviousMonthsData = async (): Promise<ChartDataItem[]> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
    if (!token) return [];
    try {
      const previousMonths: ChartDataItem[] = [];
      const now = new Date();
      let date = new Date(now.getFullYear(), now.getMonth(), 1);
      date.setMonth(date.getMonth() - 6);
      for (let i = 0; i < 6; i++) {
        const monthName = date.toLocaleString('default', { month: 'long' });
        const yearValue = date.getFullYear();
        try {
          const response = await fetch(
            `http://127.0.0.1:5000/api/Pnlforecast/previous_months?month=${monthName}&year=${yearValue}&country=${countryName}&period_type=monthly`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (response.ok) {
            const result = await response.json();
            if (result.data && result.totals) {
              previousMonths.push({
                month: `${monthName} ${yearValue}`,
                SALES: result.totals.net_sales_total || 0,
                COGS: result.totals.cost_of_unit_sold_total || 0,
                'AMAZON EXPENSE': result.totals.amazon_fee_total || 0,
                'CM1 PROFIT': result.totals.profit_total || 0,
                'ADVERTISING COSTS': result.totals.advertising_total || 0,
                'CM2 PROFIT': result.totals.cm2_profit_total || 0,
                isHistorical: true,
              });
            }
          }
        } catch {}
        date.setMonth(date.getMonth() + 1);
      }
      return previousMonths;
    } catch {
      return [];
    }
  };

  const prepareChartData = (forecastData: RowData[], previousData: ChartDataItem[] = []): ChartDataItem[] => {
    if (!forecastData || !Array.isArray(forecastData)) return previousData;
    const totalRow = forecastData.find((row) => row.sku === 'Total');
    if (!totalRow) return previousData;

    const cogs3 = (totalRow.Total_Sales_3rd || 0) - (totalRow.profit_3rd || 0);

    const getMetricValue = (sku: string, defaultValue: number = 0): number => {
      const row = forecastData.find((r) => r.sku === sku);
      return row ? (Number(row.value) || defaultValue) : defaultValue;
    };

    const forecastChartData: ChartDataItem[] = [
      {
        month: `${currentMonth} ${currentYear}`,
        SALES: totalRow.Total_Sales_1st || 0,
        'ADVERTISING COSTS': getMetricValue('advertising_total1'),
        'CM1 PROFIT': totalRow.profit_1st || 0,
        'CM2 PROFIT': getMetricValue('cm2profit1'),
        isForecast: false,
      },
      {
        month: `${nextMonth} ${nextMonthYear}`,
        SALES: totalRow.Total_Sales_2nd || 0,
        'ADVERTISING COSTS': getMetricValue('advertising_total2'),
        'CM1 PROFIT': totalRow.profit_2nd || 0,
        'CM2 PROFIT': getMetricValue('cm2profit2'),
        isForecast: true,
      },
      {
        month: `${nextToNextMonth} ${nextToNextMonthYear}`,
        SALES: totalRow.Total_Sales_3rd || 0,
        COGS: Math.abs(cogs3),
        'AMAZON EXPENSE': Math.abs(getMetricValue('Platform_Fees3')),
        'ADVERTISING COSTS': getMetricValue('advertising_total3'),
        'CM1 PROFIT': totalRow.profit_3rd || 0,
        'CM2 PROFIT': getMetricValue('cm2profit3'),
        isForecast: true,
      },
    ];
    return [...previousData, ...forecastChartData];
  };

  useEffect(() => {
    const fetchForecastData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
      if (!token) {
        setError('Authorization token is missing');
        setLoading(false);
        return;
      }
      try {
        const previousData = await fetchPreviousMonthsData();
        const endpoint =
          countryName.toLowerCase() === 'global'
            ? `http://127.0.0.1:5000/api/Pnlforecast/global?month=${month}&year=${year}`
            : `http://127.0.0.1:5000/api/Pnlforecast?country=${countryName}&month=${month}&year=${year}`;

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('You need to load Inventory forecast first to load PnL forecast');
          } else {
            setError(`Error fetching data: ${response.statusText}`);
          }
          setLoading(false);
          return;
        }

        const contentType = response.headers.get('Content-Type') || '';
        if (contentType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onload = async (e: ProgressEvent<FileReader>) => {
            if (!e.target) return;
            const arr = new Uint8Array(e.target.result as ArrayBuffer);
            const workbook = XLSX.read(arr, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<RowData>(sheet);
            if (jsonData.length === 0) {
              setError('Empty table found in the Excel file at the specified location');
            } else {
              setData(jsonData);
              setChartData(prepareChartData(jsonData, previousData));
            }
          };
          reader.readAsArrayBuffer(blob);
          return;
        }

        if (contentType.includes('application/json')) {
          const json = (await response.json()) as RowData[];
          if (json && Array.isArray(json)) {
            setData(json);
            setChartData(prepareChartData(json, previousData));

            // Auto-save JSON as Excel to backend
            try {
              const worksheet = XLSX.utils.json_to_sheet(json);
              const workbook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(workbook, worksheet, 'PNL Forecast');
              const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
              const excelBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
              const formData = new FormData();
              formData.append('file', excelBlob, 'PNL_Forecast.xlsx');
              await fetch('http://127.0.0.1:5000/api/save_pnl_forecast', {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
                body: formData,
              });
            } catch {}
          } else {
            throw new Error('Invalid JSON format');
          }
        } else {
          throw new Error('Expected JSON or Excel response');
        }
      } catch (err: any) {
        setError(err?.message || 'An error occurred while fetching the data');
      } finally {
        setLoading(false);
      }
    };

    fetchForecastData();
  }, [countryName, month, year]);

  useEffect(() => {
    if (data && data.length > 0) {
      uploadTableToBackend();
    }
  }, [data]);

  const formatValue = (sku: string): string => {
    const row = data?.find((r) => r.sku === sku);
    return formatNumber(row?.value || 0);
  };

  const getTotal = (platformFees: string, advertising: string): string => {
    const pfRow = data?.find((row) => row.sku === platformFees);
    const adRow = data?.find((row) => row.sku === advertising);
    const total = (pfRow?.value || 0) + (adRow?.value || 0);
    return formatNumber(total);
  };

  const uploadTableToBackend = async () => {
    const table = document.querySelector('.tablec') as HTMLTableElement | null;
    if (!table) return;
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.table_to_sheet(table, { raw: true });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'P&L Forecast');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const formData = new FormData();
    formData.append('file', excelBlob, 'PNL_Forecast.xlsx');
    formData.append('month', month);
    formData.append('year', year);
    formData.append('country', countryName);
    try {
      await fetch('http://127.0.0.1:5000/api/save_pnl_forecast', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
        body: formData,
      });
    } catch {}
  };

  const exportTableToExcel = () => {
    const table = document.querySelector('.tablec') as HTMLTableElement | null;
    if (!table) return;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.table_to_sheet(table, { raw: true });

    // Normalize numeric/percentage cells
    for (const cell in ws) {
      if (!Object.prototype.hasOwnProperty.call(ws, cell)) continue;
      if (cell[0] === '!') continue;
      // @ts-ignore
      let v = ws[cell].v;
      if (typeof v === 'string' && v.includes('%')) {
        const cleaned = parseFloat(v.replace(/,/g, '').replace('%', ''));
        if (!isNaN(cleaned)) {
          // @ts-ignore
          ws[cell].v = cleaned / 100;
          // @ts-ignore
          ws[cell].t = 'n';
          // @ts-ignore
          ws[cell].z = '0.00%';
        }
      } else if (typeof v === 'string') {
        const cleaned = v.replace(/,/g, '');
        if (!isNaN(parseFloat(cleaned)) && cleaned !== '') {
          // @ts-ignore
          ws[cell].v = parseFloat(cleaned);
          // @ts-ignore
          ws[cell].t = 'n';
          // @ts-ignore
          ws[cell].z = '0.00';
        }
      } else if (!isNaN(v) && v !== null && v !== '') {
        // @ts-ignore
        ws[cell].v = Number(v);
        // @ts-ignore
        ws[cell].t = 'n';
        // @ts-ignore
        ws[cell].z = '0.00';
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'P&L Forecast');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PNL_Forecast.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className='flex flex-col gap-8'>
      <h2 style={{ marginBottom: 10, color: '#414042' }} className='2xl:text-2xl text-lg text-[#414042] font-bold'>
        P &amp; L Forecast -{' '}
        <span style={{ color: '#60a68e' }}>
        {countryName.toUpperCase()}  ({formatMonthYear(currentMonth, currentYear)} to {formatMonthYear(nextToNextMonth, nextToNextMonthYear)} )
        </span>
      </h2>

      {loading && <div className="loading">Loading...</div>}
      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {data && chartData.length > 0 && (
        <div className='border border-[#414042] rounded-sm'>
          <PnlForecastChart
          chartData={chartData}
          currencySymbol={currencySymbol}
          selectedGraphs={selectedGraphs}
          handleCheckboxChange={handleCheckboxChange}
        />
        </div>
        
      )}
{data && (
  <div>
    <div className="overflow-x-auto rounded-sm">
      <table className="w-full border-collapse !2xl:text-sm text-xs  rounded-sm">
        <thead className="bg-[#5ea68e] text-[#f8edcf]  2xl:text-sm text-xs  !rounded-sm">
          {/* Top header row with spans (matches JS version) */}
          <tr className='!py-3 2xl:text-sm text-xs  h-10 rounded-sm'>
            <th className="border border-black " colSpan={showamazonfee ? 3 : 2}></th>
            <th className="border border-black" colSpan={showCm1 && LosSalesUnits ? 4 : showCm1 || LosSalesUnits ? 3 : 2}>
              P&amp;L Forecast for {formatMonthYear(currentMonth, currentYear)}
            </th>
            <th className="border border-black" colSpan={showCm1 && LosSalesUnits ? 4 : showCm1 || LosSalesUnits ? 3 : 2}>
              P&amp;L Forecast for {formatMonthYear(nextMonth, nextMonthYear)}
            </th>
            <th className="border border-black" colSpan={showCm1 && LosSalesUnits ? 4 : showCm1 || LosSalesUnits ? 3 : 2}>
              P&amp;L Forecast for {formatMonthYear(nextToNextMonth, nextToNextMonthYear)}
            </th>
            <th className="border border-black" colSpan={showCm1 && LosSalesUnits ? 4 : showCm1 || LosSalesUnits ? 3 : 2}>
              P&amp;L Forecast for 3 months
            </th>
          </tr>
          {/* Second header row that toggles columns same as JS */}
<tr className="2xl:text-sm text-xs ">
  {/* SNO */}
  <th
    colSpan={isExpanded ? (showamazonfee ? 1 : 1) : (showamazonfee ? 3 : 2)}
    className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs  "
  >
    Sno.
  </th>

  {/* EXPANDED AREA */}
  {isExpanded && (
    <>
      {/* SKU */}
      {showamazonfee && (
        <th
          onClick={handleAmazonFeeClick}
          className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
        >
          SKU
        </th>
      )}

      {/* PRODUCT NAME */}
      <th
        onClick={handleAmazonFeeClick}
        className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
      >
        <div className="flex items-center ">
          <ChevronLeft
            className={showamazonfee ? "text-[#414042]" : "text-[#414042]"}
            size={16}
          />
          Product Name
          <ChevronRight
            className={!showamazonfee ? "text-[#414042]" : "text-[#414042]"}
            size={16}
          />
        </div>
      </th>
    </>
  )}

  {/* 🔵 BLOCK 1 — PROJECTED SALES (UNITS) */}
  {LosSalesUnits && (
    <th
      className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
      onClick={handleLosSalesUnitsclick}
    >
      Projected Sales (Units)
    </th>
  )}

  {/* PROJECTED SALES (CURRENCY) */}
  <th
    className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
    onClick={handleLosSalesUnitsclick}
  >
    <div className="flex items-center ">
      <ChevronLeft
        className={LosSalesUnits ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
      Projected Sales ({currencySymbol})
      <ChevronRight
        className={!LosSalesUnits ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
    </div>
  </th>

  {/* CM1 */}
  <th
    className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
    onClick={handleshowCm1click}
  >
    <div className="flex items-center ">
      <ChevronLeft
        className={showCm1 ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
      CM1 Profit/Loss ({currencySymbol})
      <ChevronRight
        className={!showCm1 ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
    </div>
  </th>

  {/* CM1 % */}
  {showCm1 && (
    <th
      className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
      onClick={handleshowCm1click}
    >
      Projected CM1 Profit/Loss (%)
    </th>
  )}

  {/* 🔵 BLOCK 2 — PROJECTED SALES (UNITS) */}
  {LosSalesUnits && (
    <th
      className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
      onClick={handleLosSalesUnitsclick}
    >
      Projected Sales (Units)
    </th>
  )}

  {/* PROJECTED SALES (CURRENCY) */}
  <th
    className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
    onClick={handleLosSalesUnitsclick}
  >
    <div className="flex items-center ">
      <ChevronLeft
        className={LosSalesUnits ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
      Projected Sales ({currencySymbol})
      <ChevronRight
        className={!LosSalesUnits ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
    </div>
  </th>

  {/* CM1 */}
  <th
    className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
    onClick={handleshowCm1click}
  >
    <div className="flex items-center ">
      <ChevronLeft
        className={showCm1 ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
      CM1 Profit/Loss ({currencySymbol})
      <ChevronRight
        className={!showCm1 ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
    </div>
  </th>

  {showCm1 && (
    <th
      className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
      onClick={handleshowCm1click}
    >
      Projected CM1 Profit/Loss (%)
    </th>
  )}

  {/* 🔵 BLOCK 3 — PROJECTED SALES (UNITS) */}
  {LosSalesUnits && (
    <th
      className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
      onClick={handleLosSalesUnitsclick}
    >
      Projected Sales (Units)
    </th>
  )}

  {/* PROJECTED SALES (CURRENCY) */}
  <th
    className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
    onClick={handleLosSalesUnitsclick}
  >
    <div className="flex items-center ">
      <ChevronLeft
        className={LosSalesUnits ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
      Projected Sales ({currencySymbol})
      <ChevronRight
        className={!LosSalesUnits ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
    </div>
  </th>

  {/* CM1 */}
  <th
    className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
    onClick={handleshowCm1click}
  >
    <div className="flex items-center ">
      <ChevronLeft
        className={showCm1 ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
      CM1 Profit/Loss ({currencySymbol})
      <ChevronRight
        className={!showCm1 ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
    </div>
  </th>

  {showCm1 && (
    <th
      className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
      onClick={handleshowCm1click}
    >
      Projected CM1 Profit/Loss (%)
    </th>
  )}

  {LosSalesUnits && (
    <th
      className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
      onClick={handleLosSalesUnitsclick}
    >
      Projected Sales (Units)
    </th>
  )}
   <th
    className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
    onClick={handleLosSalesUnitsclick}
  >
    <div className="flex items-center ">
      <ChevronLeft
        className={LosSalesUnits ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
      Projected Sales ({currencySymbol})
      <ChevronRight
        className={!LosSalesUnits ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
    </div>
  </th>

  {/* CM1 */}
  <th
    className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
    onClick={handleshowCm1click}
  >
    <div className="flex items-center ">
      <ChevronLeft
        className={showCm1 ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
      CM1 Profit/Loss ({currencySymbol})
      <ChevronRight
        className={!showCm1 ? "text-[#414042]" : "text-[#414042]"}
        size={16}
      />
    </div>
  </th>

  {showCm1 && (
    <th
      className="border border-black bg-[#D9D9D9] text-black h-10 2xl:text-sm text-xs "
      onClick={handleshowCm1click}
    >
      Projected CM1 Profit/Loss (%)
    </th>
  )}
</tr>


        </thead>
        <tbody>
          {data
            ?.slice(0, data.findIndex((row) => row.sku === 'Total') + 1 || data.length)
            .map((row, index) => {
              const isTotalRow = row.sku === 'Total';
              if (!isExpanded && !isTotalRow) return null;
              return (
                <tr
                  key={index}
                  className={` ${isTotalRow ? 'bg-[#D9D9D9]/90 font-bold' : ''}`}
                >
                  <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
                    {isTotalRow ? (
                      <span
                        className="total-icon cursor-pointer"
                        onClick={() => setIsExpanded(!isExpanded)}
                      >
                        {isExpanded ? (
                          <i className="fa-solid fa-caret-up icon-beat animate-pulse"></i>
                        ) : (
                          <i className="fa-solid fa-caret-down icon-beat animate-pulse"></i>
                        )}
                      </span>
                    ) : (
                      index + 1
                    )}
                  </td>
                  {selectedColumns.map((key, idx) => {
                    if (key === 'sku' && !showamazonfee) return null;
                    const leftAlign = key === 'sku' || key === 'product_name';
                    return (
                      <td
                        key={idx}
                        className={`border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10 ${
                          leftAlign ? 'text-left' : ''
                        }`}
                      >
                        {formatCellValue(key, row[key])}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          {/* Additional rows below the listing (same as JS) */}
          <tr className="">
            <td
              colSpan={showamazonfee ? 3 : 2}
              className="border border-black p-3 text-left text-gray-700 2xl:text-sm text-xs  h-10"
            >
              Cost of Advertisement
            </td>
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatNumber(data?.find((r) => r.sku === 'advertising_total1')?.value)}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatNumber(data?.find((r) => r.sku === 'advertising_total2')?.value)}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatNumber(data?.find((r) => r.sku === 'advertising_total3')?.value)}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatNumber(data?.find((r) => r.sku === 'advertising_total')?.value)}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
          </tr>
          <tr className="">
            <td
              colSpan={showamazonfee ? 3 : 2}
              className="border border-black p-3 text-left text-gray-700 2xl:text-sm text-xs  h-10"
            >
              Platform Fees
            </td>
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatValue('Platform_Fees1')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatValue('Platform_Fees2')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatValue('Platform_Fees3')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatValue('platform_fees_total')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
          </tr>
          <tr className=" bg-[#D9D9D9]/90 font-bold">
            <td
              colSpan={showamazonfee ? 3 : 2}
              className="border border-black p-3 text-left text-gray-700 2xl:text-sm text-xs  h-10"
            >
              Other Expenses
            </td>
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {getTotal('Platform_Fees1', 'advertising_total1')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {getTotal('Platform_Fees2', 'advertising_total2')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {getTotal('Platform_Fees3', 'advertising_total3')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {getTotal('platform_fees_total', 'advertising_total')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
          </tr>
          <tr className="">
            <td
              onClick={toggleTacosSection}
              colSpan={showamazonfee ? 3 : 2}
              className="border border-black p-3 text-left text-gray-700 2xl:text-sm text-xs  h-10 cursor-pointer hover:bg-gray-100"
            >
              CM2 Profit/Loss{' '}
              <span>
                {showTacosSection ? (
                  <i className="fa-solid fa-caret-up icon-beat animate-pulse"></i>
                ) : (
                  <i className="fa-solid fa-caret-down icon-beat animate-pulse"></i>
                )}
              </span>
            </td>
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatValue('cm2profit1')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatValue('cm2profit2')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatValue('cm2profit3')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatValue('cm2profit_total')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
          </tr>
          {showTacosSection && (
            <>
              <tr className="">
                <td
                  colSpan={showamazonfee ? 3 : 2}
                  className="border border-black p-3 text-left text-gray-700 2xl:text-sm text-xs  h-10"
                >
                  CM2 Margins
                </td>
                {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
                <td className="border border-black p-3 h-10"></td>
                <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
                  {formatPercent(data?.find((r) => r.sku === 'cm2margin1')?.value)}
                </td>
                {showCm1 && <td className="border border-black p-3 h-10"></td>}
                {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
                <td className="border border-black p-3 h-10"></td>
                <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
                  {formatPercent(data?.find((r) => r.sku === 'cm2margin2')?.value)}
                </td>
                {showCm1 && <td className="border border-black p-3 h-10"></td>}
                {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
                <td className="border border-black p-3 h-10"></td>
                <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
                  {formatPercent(data?.find((r) => r.sku === 'cm2margin3')?.value)}
                </td>
                {showCm1 && <td className="border border-black p-3 h-10"></td>}
                {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
                <td className="border border-black p-3 h-10"></td>
                <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
                  {formatPercent(data?.find((r) => r.sku === 'cm2margin_total')?.value)}
                </td>
                {showCm1 && <td className="border border-black p-3 h-10"></td>}
              </tr>
              <tr className="">
                <td
                  colSpan={showamazonfee ? 3 : 2}
                  className="border border-black p-3 text-left text-gray-700 2xl:text-sm text-xs  h-10"
                >
                  TACoS (Total Advertising Cost of Sale)
                </td>
                {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
                <td className="border border-black p-3 h-10"></td>
                <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
                  {formatPercent(data?.find((r) => r.sku === 'acos1')?.value)}
                </td>
                {showCm1 && <td className="border border-black p-3 h-10"></td>}
                {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
                <td className="border border-black p-3 h-10"></td>
                <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
                  {formatPercent(data?.find((r) => r.sku === 'acos2')?.value)}
                </td>
                {showCm1 && <td className="border border-black p-3 h-10"></td>}
                {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
                <td className="border border-black p-3 h-10"></td>
                <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
                  {formatPercent(data?.find((r) => r.sku === 'acos3')?.value)}
                </td>
                {showCm1 && <td className="border border-black p-3 h-10"></td>}
                {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
                <td className="border border-black p-3 h-10"></td>
                <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
                  {formatPercent(data?.find((r) => r.sku === 'acos_total')?.value)}
                </td>
                {showCm1 && <td className="border border-black p-3 h-10"></td>}
              </tr>
            </>
          )}
          <tr className="">
            <td
              colSpan={showamazonfee ? 3 : 2}
              className="border border-black p-3 text-left text-gray-700 2xl:text-sm text-xs  h-10"
            >
              Net Reimbursement (Projected)
            </td>
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatValue('NetReimbursement1')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatValue('NetReimbursement2')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatValue('NetReimbursement3')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatValue('NetReimbursement_total')}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
          </tr>
          <tr className="">
            <td
              colSpan={showamazonfee ? 3 : 2}
              className="border border-black p-3 text-left text-gray-700 2xl:text-sm text-xs  h-10"
            >
              Reimbursement vs CM2 Margins
            </td>
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatPercent(data?.find((r) => r.sku === 'ReimbursementvsCM2Margins1')?.value)}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatPercent(data?.find((r) => r.sku === 'ReimbursementvsCM2Margins2')?.value)}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatPercent(data?.find((r) => r.sku === 'ReimbursementvsCM2Margins3')?.value)}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
            {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
            <td className="border border-black p-3 h-10"></td>
            <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
              {formatPercent(data?.find((r) => r.sku === 'ReimbursementvsCM2Margins_total')?.value)}
            </td>
            {showCm1 && <td className="border border-black p-3 h-10"></td>}
          </tr>
          {showTacosSection && (
            <tr className="">
              <td
                colSpan={showamazonfee ? 3 : 2}
                className="border border-black p-3 text-left text-gray-700 2xl:text-sm text-xs  h-10"
              >
                Reimbursement vs Sales
              </td>
              {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
              <td className="border border-black p-3 h-10"></td>
              <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
                {formatPercent(data?.find((r) => r.sku === 'Reimbursementvssales1')?.value)}
              </td>
              {showCm1 && <td className="border border-black p-3 h-10"></td>}
              {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
              <td className="border border-black p-3 h-10"></td>
              <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
                {formatPercent(data?.find((r) => r.sku === 'Reimbursementvssales2')?.value)}
              </td>
              {showCm1 && <td className="border border-black p-3 h-10"></td>}
              {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
              <td className="border border-black p-3 h-10"></td>
              <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
                {formatPercent(data?.find((r) => r.sku === 'Reimbursementvssales3')?.value)}
              </td>
              {showCm1 && <td className="border border-black p-3 h-10"></td>}
              {LosSalesUnits && <td className="border border-black p-3 h-10"></td>}
              <td className="border border-black p-3 h-10"></td>
              <td className="border border-black p-3 text-center text-gray-700 2xl:text-sm text-xs  h-10">
                {formatPercent(data?.find((r) => r.sku === 'Reimbursementvssales_total')?.value)}
              </td>
              {showCm1 && <td className="border border-black p-3 h-10"></td>}
            </tr>
          )}
        </tbody>
      </table>
    </div>
    <button
      style={{ display: 'flex' }}
      onClick={() => exportTableToExcel()}
      className="font-sans 2xl:text-sm text-xs  bg-[#2c3e50] text-[#f8edcf] font-bold border-none rounded cursor-pointer text-center py-2 px-4 mt-2 ml-auto hover:bg-[#34495e]"
    >
      Download as Excel (.xlsx)
    </button>
    <br />
  </div>
)}
    </div>
  );
};

export default Pnlforecast;
