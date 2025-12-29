'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import Productinfoinpopup from '@/components/businessInsight/Productinfoinpopup';
import dynamic from 'next/dynamic';
import { IoDownload } from "react-icons/io5";
import { BsStars } from "react-icons/bs";
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { FaCalendarAlt } from "react-icons/fa";
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';



const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// =========================
// Types/Interfaces
// =========================

interface GrowthCategory {
  category: string;
  value: number;
}

interface SkuItem {
  product_name: string;
  sku?: string;
  'Sales Mix (Month2)'?: number;
  quantity?: number;
  asp?: number;
  net_sales?: number;
  sales_mix?: number;
  unit_wise_profitability?: number;
  profit?: number;

  // raw fields for Excel (may be null with live API)
  quantity_prev?: number;
  quantity_curr?: number;
  asp_prev?: number;
  asp_curr?: number;
  net_sales_prev?: number;
  net_sales_curr?: number;
  sales_mix_prev?: number;
  sales_mix_curr?: number;
  unit_wise_profitability_prev?: number;
  unit_wise_profitability_curr?: number;
  profit_prev?: number;
  profit_curr?: number;

  // mapped fields for Excel export
  quantity_month1?: number;
  quantity_month2?: number;
  asp_month1?: number;
  asp_month2?: number;
  net_sales_month1?: number;
  net_sales_month2?: number;
  sales_mix_month1?: number;
  sales_mix_month2?: number;
  unit_wise_profitability_month1?: number;
  unit_wise_profitability_month2?: number;
  profit_month1?: number;
  profit_month2?: number;

  [key: string]: any;
}

interface CategorizedGrowth {
  top_80_skus: SkuItem[];
  new_or_reviving_skus: SkuItem[];
  other_skus: SkuItem[];
  top_80_total?: SkuItem | null;
  new_or_reviving_total?: SkuItem | null;
  other_total?: SkuItem | null;
  all_skus_total?: SkuItem | null;
}

interface SkuInsight {
  product_name: string;
  insight: string;
  [key: string]: any;
}

interface DailyPoint {
  date: string;      // "YYYY-MM-DD"
  quantity?: number; // summed quantity
  net_sales?: number; // summed net sales
}

interface DailySeries {
  previous: DailyPoint[];
  current_mtd: DailyPoint[];
}

interface PeriodInfo {
  label: string;
  start_date: string;
  end_date: string;
}

interface ApiResponse {
  message?: string;
  periods?: {
    previous?: PeriodInfo;
    current_mtd?: PeriodInfo;
  };
  categorized_growth?: CategorizedGrowth;
  insights?: Record<string, SkuInsight>;
  ai_insights?: Record<string, SkuInsight>;
  daily_series?: DailySeries;
  overall_summary?: string[];
  overall_actions?: string[];
}

// =========================
// Config
// =========================
const API_BASE = 'http://127.0.0.1:5000';

const STORAGE_KEY = 'live_bi_insight_data';
const INSIGHTS_KEY = 'live_bi_sku_insights';

type ChartMetric = 'net_sales' | 'quantity';

// Axios instance with JWT
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  const t = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// =========================
// Small helpers
// =========================

const getShortPeriodLabel = (label?: string) =>
  label ? (label.split(' ')[0] || label) : '';


const getTodayKey = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`; // e.g. "2025-11-29"
};

// =========================
// Line Chart Component
// =========================

const LiveLineChart: React.FC<{
  dataPrev: DailyPoint[];
  dataCurr: DailyPoint[];
  metric: ChartMetric;
  prevLabel?: string;
  currLabel?: string;
  selectedStartDay?: number | null;
  selectedEndDay?: number | null;
}> = ({
  dataPrev,
  dataCurr,
  metric,
  prevLabel,
  currLabel,
  selectedStartDay,
  selectedEndDay,
}) => {
    const getDay = (dateStr: string) => {
      if (!dateStr) return NaN;
      const parts = dateStr.split('-');
      return Number(parts[2]);
    };

    const allDates = [...dataPrev, ...dataCurr]
      .map((d) => d.date)
      .filter(Boolean);

    if (!allDates.length) {
      return <p className="text-xs text-gray-500">No daily data available yet.</p>;
    }

    const baseDate = new Date(allDates[0]);
    if (Number.isNaN(baseDate.getTime())) {
      return <p className="text-xs text-gray-500">No daily data available yet.</p>;
    }

    const year = baseDate.getFullYear();
    const monthIndex = baseDate.getMonth();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    let allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // 👉 Date-range filter: agar user ne 4–14 select kiya, to sirf unhi days ka data
    if (selectedStartDay && selectedEndDay) {
      const start = Math.min(selectedStartDay, selectedEndDay);
      const end = Math.max(selectedStartDay, selectedEndDay);
      allDays = allDays.filter((d) => d >= start && d <= end);
    }

    const prevSeries = allDays.map((day) => {
      const pt = dataPrev.find((d) => getDay(d.date) === day);
      if (!pt) return null;
      const val = metric === 'quantity' ? pt.quantity ?? null : pt.net_sales ?? null;
      return val;
    });

    const currSeries = allDays.map((day) => {
      const pt = dataCurr.find((d) => getDay(d.date) === day);
      if (!pt) return null;
      const val = metric === 'quantity' ? pt.quantity ?? null : pt.net_sales ?? null;
      return val;
    });

    const option = {
      color: ['#CECBC7', '#F47A00'],
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          if (!params || !params.length) return '';
          const day = params[0].axisValue;
          const lines = params.map((p) => {
            const label = p.seriesName;
            const v = p.data;
            if (v == null) return `${label}: N/A`;
            if (metric === 'net_sales') {
              return `${label}: ${Number(v).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
            }
            return `${label}: ${Number(v).toLocaleString()}`;
          });
          return `Day ${day}<br/>` + lines.join(`<br/>`);
        },
      },
      grid: {
        left: 40,
        right: 16,
        top: 24,
        bottom: 40,
      },
      legend: {
        show: false,
      },
      xAxis: {
        type: 'category',
        data: allDays.map((d) => d.toString()),
        boundaryGap: false,
        axisLine: {
          lineStyle: { color: '#000000' },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          fontSize: 10,
          color: '#000000',
        },
        name: 'Days',
        nameLocation: 'middle',
        nameGap: 25,
      },
      yAxis: {
        type: 'value',
        name: metric === 'net_sales' ? 'Sales (£)' : 'Units',
        nameLocation: 'middle',
        nameGap: 40,
        axisLine: {
          show: true,
          lineStyle: { color: '#000000' },
        },
        axisTick: { show: false },
        splitLine: {
          lineStyle: { color: '#eeeeee' },
        },
        axisLabel: {
          fontSize: 10,
          color: '#555555',
          formatter: (value: number) => {
            if (metric === 'net_sales') {
              return Number(value).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              });
            }
            return Number(value).toLocaleString();
          },
        },
      },
      series: [
        {
          name: prevLabel || 'Previous',
          type: 'line',
          data: prevSeries,
          smooth: true,
          showSymbol: false,
          symbol: 'circle',
          lineStyle: {
            width: 2,
          },
        },
        {
          name: currLabel || 'Current MTD',
          type: 'line',
          data: currSeries,
          smooth: true,
          showSymbol: false,
          symbol: 'circle',
          lineStyle: {
            width: 2,
          },
        },
      ],
    };

    return (
      <ReactECharts
        option={option}
        notMerge={true}
        lazyUpdate={true}
        style={{ width: '100%', height: 260 }}
      />
    );
  };


// =========================
// Main Component
// =========================

const MonthsforBI: React.FC = () => {
  const params = useParams();
  const countryName = params?.countryName as string | undefined;

  const [categorizedGrowth, setCategorizedGrowth] = useState<CategorizedGrowth>({
    top_80_skus: [],
    new_or_reviving_skus: [],
    other_skus: [],
  });
  const [activeTab, setActiveTab] = useState<
    'top_80_skus' | 'new_or_reviving_skus' | 'other_skus' | 'all_skus'
  >('top_80_skus');


  const [periods, setPeriods] = useState<ApiResponse['periods'] | null>(null);
  const [dailySeries, setDailySeries] = useState<DailySeries | null>(null);
  const [month2Label, setMonth2Label] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // overall bullets from backend
  const [overallSummary, setOverallSummary] = useState<string[]>([]);
  const [overallActions, setOverallActions] = useState<string[]>([]);  // 🔹 NEW
  const [insightDate, setInsightDate] = useState<string | null>(null);


  // chart metric toggle
  const [chartMetric, setChartMetric] = useState<ChartMetric>('net_sales');

  // Insights + modal
  const [loadingInsight, setLoadingInsight] = useState<boolean>(false);
  const [skuInsights, setSkuInsights] = useState<Record<string, SkuInsight>>({});
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Feedback
  const [fbType, setFbType] = useState<'like' | 'dislike' | null>(null);
  const [fbText, setFbText] = useState<string>('');
  const [fbSubmitting, setFbSubmitting] = useState<boolean>(false);
  const [fbSuccess, setFbSuccess] = useState<boolean>(false);
  const [selectedStartDay, setSelectedStartDay] = useState<number | null>(null);
  const [selectedEndDay, setSelectedEndDay] = useState<number | null>(null);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [calendarRange, setCalendarRange] = useState<any>([
    {
      startDate: null,
      endDate: null,
      key: 'selection',
    },
  ]);
  const [pendingStartDay, setPendingStartDay] = useState<number | null>(null);
  const [pendingEndDay, setPendingEndDay] = useState<number | null>(null);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const [showAllSkus, setShowAllSkus] = useState(false);

  const [calendarBounds, setCalendarBounds] = useState<{ start: Date; max: Date } | null>(null);


  const currYear =
    periods?.current_mtd?.start_date
      ? new Date(periods.current_mtd.start_date).getFullYear()
      : new Date().getFullYear();

  const getCurrentMonthBounds = () => {
    return calendarBounds;
  };

  useEffect(() => {
    if (activeTab === 'all_skus') setShowAllSkus(false);
  }, [activeTab]);




  const handleCalendarChange = (ranges: any) => {
    const range = ranges.selection;
    setCalendarRange([range]);

    if (range.startDate && range.endDate) {
      const startDay = range.startDate.getDate();
      const endDay = range.endDate.getDate();

      // 👉 sirf pending (calendar ke andar wali) state update
      setPendingStartDay(startDay);
      setPendingEndDay(endDay);
    } else {
      setPendingStartDay(null);
      setPendingEndDay(null);
    }
  };





  const clearCalendarRange = () => {
    // Calendar component ke selected range ko reset karo
    setCalendarRange([
      {
        startDate: null,
        endDate: null,
        key: 'selection',
      },
    ]);

    // Calendar ke andar wali temporary days clear karo
    setPendingStartDay(null);
    setPendingEndDay(null);

    // ⛔ IMPORTANT: yahan selectedStartDay/selectedEndDay ko mat chhoona
    // ⛔ IMPORTANT: yahan fetchLiveBi() bhi mat call karna
    // ⛔ IMPORTANT: calendar band bhi mat karna
  };

  const closeCalendarAndReset = () => {
    // Calendar UI ko reset karo
    setCalendarRange([
      {
        startDate: null,
        endDate: null,
        key: 'selection',
      },
    ]);

    // Calendar ke andar wali aur applied dono ranges hatao
    setPendingStartDay(null);
    setPendingEndDay(null);
    setSelectedStartDay(null);
    setSelectedEndDay(null);

    // 🔥 backend se full data mangwao (start_day / end_day null)
    fetchLiveBi(false, null, null);

    // Calendar band kar do
    setShowCalendar(false);
  };





  const applyCalendarRange = () => {
    // pending ko applied bana do
    setSelectedStartDay(pendingStartDay);
    setSelectedEndDay(pendingEndDay);

    // backend ko isi range ke saath call karo
    fetchLiveBi(false, pendingStartDay, pendingEndDay);

    // calendar band
    setShowCalendar(false);
  };

  const isGlobalData = () => (countryName || '').toLowerCase() === 'global';
  type TabKey = 'top_80_skus' | 'new_or_reviving_skus' | 'other_skus' | 'all_skus';

  const getTabLabel = (key: TabKey): string =>
    key === 'top_80_skus'
      ? 'Top 80% SKUs'
      : key === 'new_or_reviving_skus'
        ? 'New/Reviving SKUs'
        : key === 'other_skus'
          ? 'Other SKUs'
          : 'All SKUs';
  const getTabNumberForFeedback = (key: TabKey): number =>
    key === 'top_80_skus' ? 1 : key === 'new_or_reviving_skus' ? 2 : key === 'other_skus' ? 3 : 4;


  // =========================
  // Persistence helpers
  // =========================

  const saveCompareToStorage = (payload: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save BI compare state:', e);
    }
  };



  const loadCompareFromStorage = (): any => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Failed to load BI compare state:', e);
      return null;
    }
  };

  const saveInsightsToStorage = (insights: Record<string, SkuInsight>) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(INSIGHTS_KEY, JSON.stringify(insights || {}));
    } catch (e) {
      console.warn('Failed to save insights:', e);
    }
  };

  const loadInsightsFromStorage = (): Record<string, SkuInsight> => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(INSIGHTS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('Failed to load insights:', e);
      return {};
    }
  };

  // Normalize backend growth field names -> existing frontend keys
  const normalizeCategorizedGrowth = (raw?: any): CategorizedGrowth => {
    const mapRow = (row: any): SkuItem => {
      const clone: any = { ...row };

      // Sales mix key mapping
      if (row['Sales Mix (Current)'] != null) {
        clone['Sales Mix (Month2)'] = row['Sales Mix (Current)'];
      }

      // Map growth objects: "<metric> (%)" -> "<metric>"
      const fieldMap: Record<string, string> = {
        'Unit Growth (%)': 'Unit Growth',
        'ASP Growth (%)': 'ASP Growth',
        'Sales Growth (%)': 'Sales Growth',
        'Sales Mix Change (%)': 'Sales Mix Change',
        'Profit Per Unit (%)': 'Profit Per Unit',
        'CM1 Profit Impact (%)': 'CM1 Profit Impact',
      };
      Object.entries(fieldMap).forEach(([backendKey, frontKey]) => {
        if (row[backendKey] != null) {
          clone[frontKey] = row[backendKey];
        }
      });

      // raw prev/curr values from backend → month1/month2
      clone.quantity_month1 = row.quantity_prev ?? null;
      clone.quantity_month2 = row.quantity_curr ?? null;

      clone.asp_month1 = row.asp_prev ?? null;
      clone.asp_month2 = row.asp_curr ?? null;

      clone.net_sales_month1 = row.net_sales_prev ?? null;
      clone.net_sales_month2 = row.net_sales_curr ?? null;

      clone.sales_mix_month1 = row.sales_mix_prev ?? null;
      clone.sales_mix_month2 =
        row.sales_mix_curr ?? row['Sales Mix (Current)'] ?? null;

      clone.unit_wise_profitability_month1 =
        row.unit_wise_profitability_prev ?? null;
      clone.unit_wise_profitability_month2 =
        row.unit_wise_profitability_curr ?? null;

      clone.profit_month1 = row.profit_prev ?? null;
      clone.profit_month2 = row.profit_curr ?? null;

      return clone;
    };

    const empty: CategorizedGrowth = {
      top_80_skus: [],
      new_or_reviving_skus: [],
      other_skus: [],
      top_80_total: null,
      new_or_reviving_total: null,
      other_total: null,
    };

    if (!raw) return empty;

    return {
      top_80_skus: (raw.top_80_skus || []).map(mapRow),
      new_or_reviving_skus: (raw.new_or_reviving_skus || []).map(mapRow),
      other_skus: (raw.other_skus || []).map(mapRow),

      // 🔹 yaha totals ko bhi map kar diya
      top_80_total: raw.top_80_total ? mapRow(raw.top_80_total) : null,
      new_or_reviving_total: raw.new_or_reviving_total
        ? mapRow(raw.new_or_reviving_total)
        : null,
      other_total: raw.other_total ? mapRow(raw.other_total) : null,
      all_skus_total: raw.all_skus_total ? mapRow(raw.all_skus_total) : null,
    };
  };




  // =========================
  // Initial load (cached + live)
  // =========================

  useEffect(() => {
    const saved = loadCompareFromStorage();
    const todayKey = getTodayKey();

    if (saved) {
      if (saved.categorizedGrowth) setCategorizedGrowth(saved.categorizedGrowth);
      if (saved.periods) setPeriods(saved.periods);
      if (saved.month2Label) setMonth2Label(saved.month2Label);
      if (saved.dailySeries) setDailySeries(saved.dailySeries);
      if (saved.activeTab) setActiveTab(saved.activeTab);
      if (saved.chartMetric) setChartMetric(saved.chartMetric as ChartMetric);

      // 👇 Business + AI recommendations sirf tab hi restore karo
      // jab woh aaj ke din ke stored hon
      if (saved.insightDate === todayKey) {
        if (saved.overallSummary) setOverallSummary(saved.overallSummary);
        if (saved.overallActions) setOverallActions(saved.overallActions);
        setInsightDate(todayKey);
      }
    }

    const cachedInsights = loadInsightsFromStorage();
    if (cachedInsights && Object.keys(cachedInsights).length) {
      setSkuInsights(cachedInsights);
    }
  }, []);


  useEffect(() => {
    const saved = loadCompareFromStorage();
    if (saved) {
      saveCompareToStorage({ ...saved, activeTab, chartMetric });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, chartMetric]);

  // =========================
  // Fetch live BI (current MTD vs previous)
  // =========================

  const fetchLiveBi = async (
    generateInsights: boolean = false,
    startDay?: number | null,
    endDay?: number | null
  ) => {
    setError(null);

    // 🔹 Sirf normal data fetch / range change / initial load par:
    //    - purane AI SKU insights clear
    //    - modal close
    //    - full-page loader ON
    if (!generateInsights) {
      setSkuInsights({});
      saveInsightsToStorage({});
      setSelectedSku(null);
      setModalOpen(false);
      setPageLoading(true);
    }

    try {
      const res = await api.get<ApiResponse>('/live_mtd_bi', {
        params: {
          countryName,
          generate_ai_insights: generateInsights ? 'true' : 'false',
          start_day: startDay ?? undefined,
          end_day: endDay ?? undefined,
        },
      });

      console.log("[DEBUG] full response data:", res.data);
      console.log("[DEBUG] categorized_growth keys:", Object.keys(res.data?.categorized_growth || {}));
      console.log("[DEBUG] raw all_skus_total:", res.data?.categorized_growth?.all_skus_total);

      const newPeriods = res.data.periods || null;
      const rawCat = res.data.categorized_growth || {
        top_80_skus: [],
        new_or_reviving_skus: [],
        other_skus: [],
      };
      const normalized = normalizeCategorizedGrowth(rawCat);
      console.log("[DEBUG] all_skus_total normalized:", normalized?.all_skus_total);

      setPeriods(newPeriods);
      setCategorizedGrowth(normalized);
      setDailySeries(res.data.daily_series || null);

      // Calendar bounds (same as before)
      if (!startDay && !endDay && newPeriods?.current_mtd) {
        const iso =
          newPeriods.current_mtd.start_date || newPeriods.current_mtd.end_date;
        if (iso) {
          const d = new Date(iso);
          if (!Number.isNaN(d.getTime())) {
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const max = newPeriods.current_mtd.end_date
              ? new Date(newPeriods.current_mtd.end_date)
              : new Date(d.getFullYear(), d.getMonth() + 1, 0);

            setCalendarBounds({ start, max });
          }
        }
      }



      const currentLabel = newPeriods?.current_mtd?.label || '';
      setMonth2Label(currentLabel);

      // 🔹 Backend se aaya fresh summary/actions
      const summaryFromApi = res.data.overall_summary || [];
      const actionsFromApi = res.data.overall_actions || [];

      // 🔹 Ye final values hongi jo UI + localStorage me jayengi
      let finalSummary = overallSummary;
      let finalActions = overallActions;

      const todayKey = getTodayKey();

      // ✅ Sirf normal data fetch pe (range change / first load),
      //    ek din me ek hi baar snapshot lock karo
      if (!generateInsights) {
        const isNewDay = insightDate !== todayKey;
        const hasNoExisting =
          overallSummary.length === 0 && overallActions.length === 0;

        if (isNewDay || hasNoExisting) {
          finalSummary = summaryFromApi;
          finalActions = actionsFromApi;

          setOverallSummary(summaryFromApi);
          setOverallActions(actionsFromApi);
          setInsightDate(todayKey);
        }
      }

      // 🔹 AI insights (per-SKU) – ye alag hai, isko din-wise lock nahi kar rahe
      const liveInsights = res.data.ai_insights || {};
      if (generateInsights && Object.keys(liveInsights).length) {
        setSkuInsights(liveInsights);
        saveInsightsToStorage(liveInsights);
      }

      // 🔹 Persist state (including aaj ka insightDate + locked recos)
      saveCompareToStorage({
        categorizedGrowth: normalized,
        periods: newPeriods,
        month2Label: currentLabel,
        activeTab,
        dailySeries: res.data.daily_series || null,
        countryName,
        overallSummary: finalSummary,
        overallActions: finalActions,
        insightDate: todayKey,
        chartMetric,
      });
    } catch (err: any) {
      console.error('live_mtd_bi error:', err?.response?.data || err.message);
      setError(
        err?.response?.data?.error ||
        'An error occurred while fetching live BI data.'
      );
    } finally {
      if (!generateInsights) {
        setPageLoading(false);
      }
    }
  };







  useEffect(() => {
    if (!countryName) return;
    // initial load – no AI SKU insights
    fetchLiveBi(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryName]);

  // =========================
  // AI insights generate (button)
  // =========================

  const analyzeSkus = async () => {
    setLoadingInsight(true);
    try {
      await fetchLiveBi(true, selectedStartDay, selectedEndDay);
    } catch (err: any) {
      console.error(
        'generate insights via live_mtd_bi error:',
        err?.response?.data || err.message
      );
    } finally {
      setLoadingInsight(false);
    }
  };

  // =========================
  // Insight helpers
  // =========================

  const getInsightByProductName = (productName: string): [string, SkuInsight] | null => {
    if (!productName) return null;
    const needle = productName.toLowerCase().trim();

    let entry = Object.entries(skuInsights).find(
      ([, d]) => d.product_name?.toLowerCase().trim() === needle
    );
    if (!entry && isGlobalData()) {
      entry = Object.entries(skuInsights).find(([, d]) => {
        const n = d.product_name?.toLowerCase().trim();
        return n && (n.includes(needle) || needle.includes(n));
      });
    }
    return entry ? (entry as [string, SkuInsight]) : null;
  };

  const getInsightForItem = (item: SkuItem): [string, SkuInsight] | null => {
    if (isGlobalData()) return getInsightByProductName(item.product_name);
    if (item.sku && skuInsights[item.sku]) return [item.sku, skuInsights[item.sku]];
    return getInsightByProductName(item.product_name);
  };

  // =========================
  // Export to Excel
  // =========================

  const exportToExcel = (
    rows: SkuItem[],
    m1Abbr: string,
    m2Abbr: string,
    filename = 'export.xlsx'
  ) => {
    const formatted = rows.map((row) => {
      const unitGrowth = row['Unit Growth'] as GrowthCategory | undefined;
      const aspGrowth = row['ASP Growth'] as GrowthCategory | undefined;
      const salesGrowth = row['Sales Growth'] as GrowthCategory | undefined;
      const mixGrowth = row['Sales Mix Change'] as GrowthCategory | undefined;
      const unitProfitGrowth = row['Profit Per Unit'] as GrowthCategory | undefined;
      const profitGrowth = row['CM1 Profit Impact'] as GrowthCategory | undefined;

      const round2 = (v: any) =>
        v == null || Number.isNaN(Number(v))
          ? null
          : Number(v).toFixed
            ? Number(Number(v).toFixed(2))
            : v;

      return {
        SKU: row.sku || '',
        Product: row.product_name || '',

        [`Qty ${m1Abbr}`]: round2(row.quantity_month1),
        [`Qty ${m2Abbr}`]: round2(row.quantity_month2),
        'Qty %': unitGrowth?.value ?? null,

        [`ASP ${m1Abbr}`]: round2(row.asp_month1),
        [`ASP ${m2Abbr}`]: round2(row.asp_month2),
        'ASP %': aspGrowth?.value ?? null,

        [`Net Sales ${m1Abbr}`]: round2(row.net_sales_month1),
        [`Net Sales ${m2Abbr}`]: round2(row.net_sales_month2),
        'Net Sales %': salesGrowth?.value ?? null,

        [`Sales Mix ${m1Abbr}`]: round2(row.sales_mix_month1),
        [`Sales Mix ${m2Abbr}`]:
          round2(row.sales_mix_month2 ?? row['Sales Mix (Month2)']),
        'Sales Mix %': mixGrowth?.value ?? null,

        [`Unit Profit ${m1Abbr}`]: round2(row.unit_wise_profitability_month1),
        [`Unit Profit ${m2Abbr}`]: round2(row.unit_wise_profitability_month2),
        'Unit Profit %': unitProfitGrowth?.value ?? null,

        [`Profit ${m1Abbr}`]: round2(row.profit_month1),
        [`Profit ${m2Abbr}`]: round2(row.profit_month2),
        'Profit %': profitGrowth?.value ?? null,
      };
    });

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Growth Comparison');
    XLSX.writeFile(wb, filename);
  };

  const submitSummaryFeedback = async () => {
    try {
      if (!selectedSku) return;
      if (!fbType) {
        setError('Please choose 👍 or 👎 before submitting.');
        return;
      }

      setFbSubmitting(true);
      setError(null);

      const insightData =
        skuInsights[selectedSku as keyof typeof skuInsights] ||
        getInsightByProductName(selectedSku as string)?.[1];
      const productName = insightData?.product_name || selectedSku;
      const fullInsightText = insightData?.insight || '';

      const currentRows = categorizedGrowth[activeTab] || [];
      const rowIndex = Math.max(
        currentRows.findIndex(
          (r) =>
            (r.sku && r.sku === selectedSku) ||
            (r.product_name &&
              r.product_name.toLowerCase().trim() ===
              String(productName).toLowerCase().trim())
        ),
        -1
      );

      const payload = {
        country: countryName,
        rowIndex: rowIndex === -1 ? 0 : rowIndex,
        tab: getTabNumberForFeedback(activeTab),
        type: fbType,
        text: fbText || '',
        productData: {
          product_name: productName,
          combined_text: fullInsightText,
          raw_ai_response: fullInsightText,
        },
      };

      await api.post('/row-feedback', payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      setFbSuccess(true);
      setTimeout(() => setFbSuccess(false), 2500);
      setFbText('');
      setFbType(null);
    } catch (err: any) {
      console.error('row-feedback error:', err?.response?.data || err.message);
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to submit feedback. Please try again.'
      );
    } finally {
      setFbSubmitting(false);
    }
  };



  // 🔹 Highlight helper: profit/increase green, loss/decrease red
  const highlightInsightText = (text: string) => {
    const greenWords = [
      'profit',
      'profits',
      'increase',
      'growth',
      'improvement',
      'gain',
      'gains',
      'up',
      'higher',
    ];

    const redWords = [
      'loss',
      'losses',
      'decrease',
      'decline',
      'drop',
      'down',
      'lower',
    ];

    const regex = new RegExp(
      `\\b(${[...greenWords, ...redWords].join('|')})\\b`,
      'gi'
    );

    const parts = text.split(regex);

    return parts.map((part, idx) => {
      const lower = part.toLowerCase();

      if (greenWords.includes(lower)) {
        return (
          <span key={idx} style={{ color: '#16a34a', fontWeight: 600 }}>
            {part}
          </span>
        );
      }

      if (redWords.includes(lower)) {
        return (
          <span key={idx} style={{ color: '#dc2626', fontWeight: 600 }}>
            {part}
          </span>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };




  const renderFormattedInsight = (raw: string) => {
    if (!raw) return null;

    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const SECTION_ORDER = [
      'Details',
      'Observations',
      'Improvements',
      'Unit Growth',
      'ASP',
      'Sales',
      'Profit',
      'Unit Profitability',
      'Summary',
    ];

    const LIST_SECTIONS = new Set([
      'Observations',
      'Improvements',
      'Unit Growth',
      'ASP',
      'Sales',
      'Profit',
      'Unit Profitability',
    ]);

    const headingOf = (line: string): string | null => {
      const m =
        line.match(/^details\s+for/i) ? ['Details'] :
          line.match(/^(observations)\s*:?\s*$/i) ? ['Observations'] :
            line.match(/^(improvements)\s*:?\s*$/i) ? ['Improvements'] :
              line.match(/^(unit\s+growth)\s*:?\s*$/i) ? ['Unit Growth'] :
                line.match(/^(asp)\s*:?\s*$/i) ? ['ASP'] :
                  line.match(/^(sales)\s*:?\s*$/i) ? ['Sales'] :
                    line.match(/^(profit)\s*:?\s*$/i) ? ['Profit'] :
                      line.match(/^(unit\s+profitability)\s*:?\s*$/i) ? ['Unit Profitability'] :
                        line.match(/^(summary)\s*:?\s*$/i) ? ['Summary'] :
                          null;
      return m ? m[0] : null;
    };

    const sections: Record<string, string[]> = {};
    let current: string | null = null;

    for (const line of lines) {
      const hd = headingOf(line);
      if (hd) {
        current = hd;
        if (!sections[current]) sections[current] = [];
        if (current === 'Details') sections[current].push(line);
        continue;
      }
      if (!current) current = 'Details';
      if (!sections[current]) sections[current] = [];
      const isLabel = !!line.match(
        /^(observations|improvements|unit\s+growth|asp|sales|profit|unit\s+profitability|summary)\s*:?\s*$/i
      );
      if (isLabel) continue;
      sections[current].push(line);
    }

    const clean = (s: string) =>
      s.replace(/^[•\-\u2013\u2014]\s+/, '').replace(/^\d+\.\s+/, '');

    return SECTION_ORDER.filter((sec) => sections[sec]?.length).map(
      (sec, idx) => {
        const content = sections[sec];
        const isList = LIST_SECTIONS.has(sec);

        return (
          <div
            key={idx}
            className="insight-section"
            style={{ marginBottom: 12 }}
          >
            {(isList || sec === 'Summary') && (
              <strong
                className="insight-section-title"
                style={{ display: 'block', marginBottom: 6 }}
              >
                {sec}
              </strong>
            )}

            {isList ? (
              <ul className="insight-list list-disc">
                {content.map((line, i) => {
                  const trimmed = clean(line);

                  // 🔹 Detect ANY subheading
                  const isSubHeading =
                    /^[A-Za-z][A-Za-z\s\/]+:?$/i.test(trimmed) &&  // text only
                    !trimmed.match(/\d|%|,/) &&                    // no numbers/percent
                    trimmed.split(/\s+/).length <= 5;              // short phrase

                  if (isSubHeading) {
                    const label = trimmed.replace(/:$/, '').trim();
                    return (
                      <li
                        key={i}
                        style={{
                          listStyle: 'none',
                          marginTop: 10,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: '#374151',
                            borderLeft: '3px solid #60a68e',
                            paddingLeft: 8,
                          }}
                        >
                          {label}
                        </span>
                      </li>
                    );
                  }

                  // 🔹 Normal bullet points
                  return (
                    <li
                      key={i}
                      className="insight-list-item"
                      style={{
                        marginBottom: 4,
                        lineHeight: 1.6,
                        fontSize: 13,
                      }}
                    >
                      {highlightInsightText(trimmed)}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="insight-paragraphs list-disc">
                {content.map((line, i) => (
                  <p
                    key={i}
                    className="insight-paragraph"
                    style={{
                      margin: '4px 0',
                      lineHeight: 1.6,
                      fontSize: 13,
                    }}
                  >
                    {highlightInsightText(line)}
                  </p>
                ))}
              </div>
            )}


            {sec === 'Summary' && (
              <div className="feedback-container" style={{ marginTop: 10 }}>
                <div
                  className="feedback-buttons"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 12,
                  }}
                >
                  <button
                    type="button"
                    className="feedback-button"
                    onClick={() => setFbType('like')}
                    title="Like"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: fbType === 'like' ? 1 : 0.6,
                    }}
                  >
                    <FaThumbsUp size={18} />
                  </button>
                  <button
                    type="button"
                    className="feedback-button"
                    onClick={() => setFbType('dislike')}
                    title="Dislike"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: fbType === 'dislike' ? 1 : 0.6,
                    }}
                  >
                    <FaThumbsDown size={18} />
                  </button>
                </div>

                <div
                  className="comment-box"
                  style={{
                    marginTop: 10,
                    backgroundColor: '#f1f1f1',
                    padding: '10px 12px',
                    borderRadius: 8,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Add a Comment......"
                    className="comment-input"
                    value={fbText}
                    onChange={(e) => setFbText(e.target.value)}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                    }}
                  />
                  <button
                    type="button"
                    onClick={submitSummaryFeedback}
                    disabled={fbSubmitting}
                    className="styled-button"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {fbSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>

                {fbSuccess && (
                  <div
                    style={{
                      color: '#2e7d32',
                      fontWeight: 600,
                      marginTop: 6,
                    }}
                  >
                    Feedback submitted!
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
    );
  };




  const getAllSkusForExport = (): SkuItem[] => [
    ...(categorizedGrowth.top_80_skus || []),
    ...(categorizedGrowth.new_or_reviving_skus || []),
    ...(categorizedGrowth.other_skus || []),
  ];


  const currentTabData: SkuItem[] =
    activeTab === 'all_skus'
      ? getAllSkusForExport()
      : (categorizedGrowth[activeTab as Exclude<TabKey, 'all_skus'>] || []);

  const allSkuRows =
    categorizedGrowth
      ? [
        ...(categorizedGrowth.top_80_skus || []),
        ...(categorizedGrowth.new_or_reviving_skus || []),
        ...(categorizedGrowth.other_skus || []),
      ]
      : [];

  const displayedAllSkuRows = showAllSkus ? allSkuRows : allSkuRows.slice(0, 5);

  const rowsToRender =
    activeTab === "all_skus"
      ? (showAllSkus ? allSkuRows : allSkuRows.slice(0, 5))
      : currentTabData;

  const hasAnySkus =
    categorizedGrowth.top_80_skus.length > 0 ||
    categorizedGrowth.new_or_reviving_skus.length > 0 ||
    categorizedGrowth.other_skus.length > 0;


  // 🔹 backend se aaya segment total row (growth % wali)
  const segmentTotalsMap: Record<
    'top_80_skus' | 'new_or_reviving_skus' | 'other_skus',
    SkuItem | null | undefined
  > = {
    top_80_skus: categorizedGrowth.top_80_total,
    new_or_reviving_skus: categorizedGrowth.new_or_reviving_total,
    other_skus: categorizedGrowth.other_total,
  };

  const segmentTotal =
    activeTab === "all_skus"
      ? categorizedGrowth.all_skus_total
      : activeTab === "top_80_skus"
        ? categorizedGrowth.top_80_total
        : activeTab === "new_or_reviving_skus"
          ? categorizedGrowth.new_or_reviving_total
          : categorizedGrowth.other_total;


  const manualTotalsForAll = (() => {
    if (activeTab !== 'all_skus' || !currentTabData.length) {
      return {
        salesMix: 0,
        quantity: 0,
        asp: 0,
        net_sales: 0,
        unit_wise_profitability: 0,
        profit: 0,
      };
    }

    let quantity = 0;
    let net_sales = 0;
    let profit = 0;
    let salesMix = 0;

    // fallback weighted sums (only used if net_sales/profit missing)
    let aspWeighted = 0;
    let unitProfitWeighted = 0;

    currentTabData.forEach((r) => {
      const q =
        Number((r as any).quantity_month2 ?? (r as any).quantity_curr ?? r.quantity ?? 0) || 0;

      const ns =
        Number((r as any).net_sales_month2 ?? (r as any).net_sales_curr ?? r.net_sales ?? 0) || 0;

      const p =
        Number((r as any).profit_month2 ?? (r as any).profit_curr ?? r.profit ?? 0) || 0;

      const mix =
        Number(
          (r as any).sales_mix_month2 ??
          (r as any).sales_mix_curr ??
          (r as any)['Sales Mix (Month2)'] ??
          (r as any).sales_mix ??
          0
        ) || 0;

      quantity += q;
      net_sales += ns;
      profit += p;
      salesMix += mix;

      const aspVal = Number((r as any).asp_month2 ?? (r as any).asp_curr ?? r.asp ?? 0) || 0;
      const upVal =
        Number(
          (r as any).unit_wise_profitability_month2 ??
          (r as any).unit_wise_profitability_curr ??
          r.unit_wise_profitability ??
          0
        ) || 0;

      aspWeighted += aspVal * q;
      unitProfitWeighted += upVal * q;
    });

    // Prefer robust portfolio-level formulas if possible:
    const asp = quantity > 0 ? (net_sales !== 0 ? net_sales / quantity : aspWeighted / quantity) : 0;
    const unit_wise_profitability =
      quantity > 0 ? (profit !== 0 ? profit / quantity : unitProfitWeighted / quantity) : 0;

    return {
      salesMix,
      quantity,
      asp,
      net_sales,
      unit_wise_profitability,
      profit,
    };
  })();

  const displayedTabData =
    activeTab === 'all_skus' && !showAllSkus
      ? currentTabData.slice(0, 5)
      : currentTabData;



  // 🔹 sirf new_or_reviving_skus ke liye raw totals chahiye
  const manualTotalsForNewRev = (() => {
    if (activeTab !== 'new_or_reviving_skus' || !currentTabData.length) {
      return {
        salesMix: 0,
        quantity: 0,
        asp: 0,
        net_sales: 0,
        unit_wise_profitability: 0,
        profit: 0,
      };
    }

    let quantity = 0;
    let net_sales = 0;
    let profit = 0;
    let aspWeighted = 0;
    let unitProfitWeighted = 0;
    let salesMix = 0;

    currentTabData.forEach((r) => {
      const q = Number(r.quantity ?? 0);
      const ns = Number(r.net_sales ?? 0);
      const p = Number(r.profit ?? 0);
      const aspVal = Number(r.asp ?? 0);
      const upVal = Number(r.unit_wise_profitability ?? 0);
      const mixVal = Number(r['Sales Mix (Month2)'] ?? 0);

      quantity += q;
      net_sales += ns;
      profit += p;
      salesMix += mixVal;

      aspWeighted += aspVal * q;
      unitProfitWeighted += upVal * q;
    });

    const asp = quantity > 0 ? aspWeighted / quantity : 0;
    const unit_wise_profitability =
      quantity > 0 ? unitProfitWeighted / quantity : 0;

    return {
      salesMix,
      quantity,
      asp,
      net_sales,
      unit_wise_profitability,
      profit,
    };
  })();

  const prevShort = getShortPeriodLabel(periods?.previous?.label);
  const currShort = getShortPeriodLabel(periods?.current_mtd?.label);

  console.log(segmentTotalsMap)



  return (
    <>
      <style>{`
  div{ font-family: 'Lato', sans-serif; }
  select{ outline: none; }

  .total-row td{ background-color:#ccc; font-weight:bold; }
  .styled-button, .compare-button{
    padding:8px 16px; font-size:.9rem; border:none; border-radius:6px; cursor:pointer;
    transition:background-color .2s ease; box-shadow:0 3px 6px rgba(0,0,0,.15);
    background-color:#2c3e50; color:#f8edcf; font-weight:bold;
  }
  .styled-button:hover, .compare-button:hover{ background-color:#1f2a36; }

  .line-chart-container{
    max-width:100%;
    border:1px solid #000000;
    padding:12px 12px 8px;
    background:#fff;
    border-radius:8px;
  }

  .line-chart-legend{
    display:flex;
    gap:12px;
    font-size:11px;
    margin-top:4px;
    flex-wrap:wrap;
  }

  .legend-item{
    display:flex;
    align-items:center;
    gap:6px;
  }
  .legend-prev{ background:#CECBC7; } 
  .legend-curr{ background:#F47A00; } 

  .legend-box{
    width:14px;
    height:14px;
    
  }

  .compare-button-container{ margin-top:10px; text-align:right; }

  .theadc{ background:#5EA68E; color:#f8edcf; }
  .tablec{ width:100%; border-collapse:collapse; }
  .tablec td, .tablec th{ border:1px solid #414042; padding:10px 8px; text-align:center; }
  .insight-section-title{ font-size:15px; color:#414042; }
  .insight-list{ margin: 6px 0 10px 20px; padding:0; }
  .insight-list-item{ line-height:1.6; }
  .insight-paragraphs p{ margin:4px 0; line-height:1.6; }
`}</style>

      {pageLoading ? (
        // 🔹 FULL PAGE LOADER
        <div className="flex items-center justify-center min-h-[60vh]">
          <video
            src="/infinity2.webm"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: 150,
              height: 'auto',
              backgroundColor: 'transparent',
              pointerEvents: 'none',
            }}
          />
        </div>
      ) : (
        <div className='flex flex-col gap-12'>
          <div>
            <h2 className="text-2xl font-bold text-[#414042] mb-6 ">
              Live Business Insights - AI Analyst&nbsp;
              <span className="text-[#5EA68E]">
                {prevShort && currShort ? `(${currShort} vs ${prevShort})` : ''}
              </span>
            </h2>

            {/* Line chart with toggle */}
            {dailySeries && (
              <div className="line-chart-container ">
                <div className="flex justify-between items-center  gap-2">
                  <div>
                    <h2 className='text-[#414042] text-xl font-semibold'>Month-over-Month Performance Comparison</h2>
                    <h3 className="text-sm font-medium text-[#414042]">
                      {chartMetric === 'net_sales' ? 'Net Sales Trend' : 'Units Trend'}
                    </h3>
                  </div>


                  <div className="flex items-center gap-2">
                    {/* Metric toggle */}
                    <div
                      style={{
                        border: '1px solid #D9D9D9E5',
                        borderRadius: 8,
                        display: 'inline-flex',
                        overflow: 'hidden',
                      }}
                      className="p-1 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setChartMetric('net_sales')}
                        style={{
                          padding: '3px 12px',
                          border: 'none',
                          backgroundColor:
                            chartMetric === 'net_sales' ? '#5EA68E80' : '#ffffff',
                          fontWeight: chartMetric === 'net_sales' ? 600 : 400,
                          color: '#414042',
                          borderRadius: 5,
                          cursor: 'pointer',
                        }}
                      >
                        Net Sales
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartMetric('quantity')}
                        style={{
                          padding: '3px 12px',
                          border: 'none',
                          backgroundColor:
                            chartMetric === 'quantity' ? '#5EA68E80' : '#ffffff',
                          fontWeight: chartMetric === 'quantity' ? 600 : 400,
                          color: '#414042',
                          borderRadius: 5,
                          cursor: 'pointer',
                        }}
                      >
                        Units
                      </button>
                    </div>

                    {/* Calendar range selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCalendar((s) => !s)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid #D9D9D9E5',
                          backgroundColor: '#ffffff',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                        className='flex gap-2 items-center'
                      >
                        <FaCalendarAlt size={15} />{' '}
                        {selectedStartDay && selectedEndDay
                          ? `Day ${selectedStartDay} – ${selectedEndDay}`
                          : 'Select Date Range'}
                      </button>

                      {showCalendar && (() => {
                        const bounds = getCurrentMonthBounds();
                        if (!bounds) return null;
                        return (
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: '110%',
                              zIndex: 50,
                              backgroundColor: '#ffffff',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              padding: 8,
                              borderRadius: 8,
                            }}
                          >
                            <DateRange
                              key={calendarKey}      // 👈 IMPORTANT — forces remount
                              ranges={calendarRange}
                              onChange={handleCalendarChange}
                              moveRangeOnFirstSelection={false}
                              showMonthAndYearPickers={false}
                              minDate={bounds.start}
                              maxDate={bounds.max}
                              shownDate={bounds.start}
                              rangeColors={['#5EA68E']}
                            />

                            <div className="flex justify-between mt-2 gap-2">
                              <button
                                type="button"
                                onClick={clearCalendarRange}
                                style={{
                                  fontSize: 11,
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  border: '1px solid #ccc',
                                  background: '#f9f9f9',
                                  cursor: 'pointer',
                                }}
                              >
                                Clear
                              </button>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={applyCalendarRange}
                                  disabled={pendingStartDay == null || pendingEndDay == null}
                                  style={{
                                    fontSize: 11,
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: '#2c3e50',
                                    color: '#fff',
                                    cursor:
                                      pendingStartDay == null || pendingEndDay == null
                                        ? 'not-allowed'
                                        : 'pointer',
                                    opacity:
                                      pendingStartDay == null || pendingEndDay == null
                                        ? 0.6
                                        : 1,
                                  }}
                                >
                                  Submit
                                </button>

                                <button
                                  type="button"
                                  onClick={closeCalendarAndReset}

                                  style={{
                                    fontSize: 11,
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    border: 'none',
                                    background: '#5EA68E',
                                    color: '#fff',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Close
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })()}
                    </div>
                  </div>


                </div>

                <div className="line-chart-legend">
                  <div className="legend-item">
                    <span className="legend-box legend-curr" />
                    <span>{periods?.current_mtd?.label || 'Current month MTD'}</span>

                  </div>
                  <div className="legend-item">

                    <span className="legend-box legend-prev" />
                    <span>
                      {periods?.previous?.label || 'Previous month same period'}
                    </span>
                  </div>
                </div>

                <LiveLineChart
                  dataPrev={dailySeries.previous || []}
                  dataCurr={dailySeries.current_mtd || []}
                  metric={chartMetric}
                  prevLabel={periods?.previous?.label}
                  currLabel={periods?.current_mtd?.label}
                  selectedStartDay={selectedStartDay}
                  selectedEndDay={selectedEndDay}
                />
              </div>
            )}
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          {(overallSummary.length > 0 || overallActions.length > 0) && (
            <div className="flex gap-16  flex-col md:flex-row">
              {/* LEFT CARD – SUMMARY */}
              {overallSummary.length > 0 && (
                <div className="bg-[#5EA68E33] border border-[#5EA68E] rounded-md p-3 text-sm text-[#414042] border-l-[#5EA68E] border-l-4 w-full">
                  <h2 className="text-xl font-bold">Business Insight Summary</h2>
                  <ul className="list-disc pl-5 space-y-1 pt-2">
                    {overallSummary.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* RIGHT CARD – ACTIONS */}
              {overallActions.length > 0 && (
                <div className="bg-[#5EA68E33] border border-[#5EA68E] rounded-md p-3 text-sm text-[#414042] border-l-[#5EA68E] border-l-4 w-full">
                  <h2 className="text-xl font-bold">AI-Powered Recommendations</h2>
                  <ul className="list-disc pl-5 space-y-1 pt-2">
                    {overallActions.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Table + actions */}

          <div>
            <div className='border border-[#414042] p-3 rounded-lg'>
              <div className="flex md:flex-row flex-col justify-between items-center  ">
                <h2 className="text-2xl font-bold text-[#414042] ">
                  Performance-based SKU split
                </h2>
                <div className='flex justify-center gap-3 '>
                  <div
                    style={{

                      border: '1px solid #D9D9D9E5',
                      borderRadius: 8,
                      display: 'inline-flex',
                      overflow: 'hidden',
                    }}
                    className="p-1"
                  >
                    {(['top_80_skus', 'new_or_reviving_skus', 'other_skus', 'all_skus'] as TabKey[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className="text-sm font-normal"
                        style={{
                          padding: '3px 12px',
                          backgroundColor:
                            activeTab === key ? '#5EA68E80' : '#ffffff',
                          color: '#414042',
                          border: 'none',
                          borderRadius: 5,
                          fontWeight: activeTab === key ? 600 : 400,
                        }}
                      >
                        {getTabLabel(key as keyof CategorizedGrowth)}
                      </button>
                    ))}
                  </div>
                  <div
                    className="flex gap-3"
                  >
                    <button
                      onClick={analyzeSkus}
                      disabled={
                        !(
                          categorizedGrowth.top_80_skus.length > 0 ||
                          categorizedGrowth.new_or_reviving_skus.length > 0 ||
                          categorizedGrowth.other_skus.length > 0
                        )
                      }
                      className="bg-custom-effect text-[#F8EDCE] rounded-sm px-4 flex items-center justify-end  disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        boxShadow: "0px 4px 4px 0px #00000040",
                      }}
                    >
                      <BsStars
                        style={{
                          fontSize: "12px",
                          color: "#F8EDCE"
                        }}
                      />
                      {loadingInsight ? "Generating..." : "AI Insights"}
                    </button>


                    <button
                      onClick={() => {
                        const prevShortName = prevShort || 'Prev';
                        const currShortName = currShort || 'Curr';
                        const file = `AllSKUs-${prevShortName}vs${currShortName}.xlsx`;
                        const allRows = getAllSkusForExport();
                        exportToExcel(allRows, prevShortName, currShortName, file);
                      }}
                      className="bg-white border border-[#8B8585] px-1 rounded-sm"
                      style={{
                        boxShadow: "0px 4px 4px 0px #00000040",
                      }}
                    >
                      <IoDownload size={27} />
                    </button>
                  </div>
                </div>

              </div>
              {hasAnySkus ? (
                <div className="overflow-x-auto pt-6">
                  <table className="tablec w-full border-collapse md:text-sm text-xs">
                    <thead className="theadc">
                      <tr>
                        <th>S.No.</th>
                        <th className="text-left">Product Name</th>
                        <th>Sales Mix ({month2Label || 'Current'})</th>
                        <th>
                          {activeTab === 'new_or_reviving_skus'
                            ? `Units (${month2Label || 'Current'})`
                            : 'Unit Growth (%)'}
                        </th>
                        <th>
                          {activeTab === 'new_or_reviving_skus'
                            ? `ASP (${month2Label || 'Current'})`
                            : 'ASP Growth (%)'}
                        </th>
                        <th>
                          {activeTab === 'new_or_reviving_skus'
                            ? `Sales (${month2Label || 'Current'})`
                            : 'Sales Growth (%)'}
                        </th>
                        {activeTab !== 'new_or_reviving_skus' && (
                          <th>Sales Mix Change (%)</th>
                        )}
                        <th>
                          {activeTab === 'new_or_reviving_skus'
                            ? `Unit Profit (${month2Label || 'Current'})`
                            : 'Profit Per Unit (%)'}
                        </th>
                        <th>
                          {activeTab === 'new_or_reviving_skus'
                            ? `Profit (${month2Label || 'Current'})`
                            : 'CM1 Profit Impact (%)'}
                        </th>
                        {Object.keys(skuInsights).length > 0 && <th>AI Insight</th>}
                      </tr>
                    </thead>

                    <tbody>
                      {rowsToRender.map((item, idx) => (
                        <tr key={idx} className="">
                          <td className="border border-[#414042] px-2 py-2.5 text-center">
                            {idx + 1}
                          </td>
                          <td className="border border-[#414042] px-2 py-2.5 text-left">
                            {item.product_name || item.sku || 'N/A'}
                          </td>
                          <td className="border border-[#414042] px-2 py-2.5 text-center">
                            {item['Sales Mix (Month2)'] != null
                              ? `${Number(
                                item['Sales Mix (Month2)']
                              ).toFixed(2)}%`
                              : 'N/A'}
                          </td>

                          {[
                            { field: 'Unit Growth', raw: 'quantity' },
                            { field: 'ASP Growth', raw: 'asp' },
                            { field: 'Sales Growth', raw: 'net_sales' },
                            ...(activeTab !== 'new_or_reviving_skus'
                              ? [{ field: 'Sales Mix Change', raw: 'sales_mix' }]
                              : []),
                            { field: 'Profit Per Unit', raw: 'unit_wise_profitability' },
                            { field: 'CM1 Profit Impact', raw: 'profit' },
                          ].map(({ field, raw }) => {
                            const growth = item[field];

                            if (activeTab === 'new_or_reviving_skus') {
                              const v = item[raw];
                              return (
                                <td
                                  key={field}
                                  className="border border-[#414042] px-2 py-2.5 text-center"
                                >
                                  {v != null ? Number(v).toFixed(2) : 'N/A'}
                                </td>
                              );
                            }

                            if (
                              !growth ||
                              (growth as GrowthCategory).value == null
                            ) {
                              return (
                                <td
                                  key={field}
                                  className="border border-[#414042] px-2 py-2.5 text-center"
                                >
                                  N/A
                                </td>
                              );
                            }

                            let color = '#414042';
                            if ((growth as GrowthCategory).category === 'High Growth')
                              color = '#5EA68E';
                            else if (
                              (growth as GrowthCategory).category === 'Negative Growth'
                            )
                              color = '#FF5C5C';
                            const sign =
                              (growth as GrowthCategory).value >= 0 ? '+' : '';
                            return (
                              <td
                                key={field}
                                className="border border-[#414042] px-2 py-2.5 text-center"
                                style={{ color, fontWeight: 600 }}
                              >
                                {(growth as GrowthCategory).category} (
                                {sign}
                                {Number(
                                  (growth as GrowthCategory).value
                                ).toFixed(2)}
                                %)
                              </td>
                            );
                          })}

                          {Object.keys(skuInsights).length > 0 && (
                            <td className="border border-[#414042] px-2 text-nowrap py-2.5 text-center">
                              {(() => {
                                const entry = getInsightForItem(item);
                                if (entry) {
                                  return (
                                    <button
                                      className="font-semibold underline"
                                      style={{ margin: 0 }}
                                      onClick={() => {
                                        setSelectedSku(entry[0]);
                                        setModalOpen(true);
                                        setFbType(null);
                                        setFbText('');
                                        setFbSuccess(false);
                                      }}
                                    >
                                      View Insights
                                    </button>
                                  );
                                }
                                return (
                                  <em style={{ color: '#888' }}>
                                    Not analyzed
                                    <br />
                                    <small style={{ fontSize: 10 }}>
                                      ({isGlobalData()
                                        ? 'Global/Product Name'
                                        : 'SKU'}
                                      : {item.product_name || item.sku || 'N/A'})
                                    </small>
                                  </em>
                                );
                              })()}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>

                    {/* <tfoot>
                      <tr className="bg-[#D9D9D9E5] ">
                        <td className="border px-2 py-2.5 text-center"></td>
                        <td className="border px-2 py-2.5 font-bold text-left">
                          Total
                        </td>

                      
                        <td className="border px-2 py-2.5 font-bold text-center">
                          {activeTab === 'all_skus'
                            ? `${manualTotalsForAll.salesMix.toFixed(2)}%`
                            : segmentTotal && (segmentTotal as any)['Sales Mix (Month2)'] != null
                              ? `${Number((segmentTotal as any)['Sales Mix (Month2)']).toFixed(2)}%`
                              : activeTab === 'new_or_reviving_skus'
                                ? `${manualTotalsForNewRev.salesMix.toFixed(2)}%`
                                : 'N/A'}

                        </td>


                        {[
                          { field: 'Unit Growth', key: 'quantity' },
                          { field: 'ASP Growth', key: 'asp' },
                          { field: 'Sales Growth', key: 'net_sales' },
                          ...(activeTab !== 'new_or_reviving_skus'
                            ? [{ field: 'Sales Mix Change', key: null }]
                            : []),
                          { field: 'Profit Per Unit', key: 'unit_wise_profitability' },
                          { field: 'CM1 Profit Impact', key: 'profit' },
                        ].map(({ field, key }, idx) => {
                          // 🔸 NEW / REVIVING: yaha % nahi, raw totals dikhane hain
                          if (activeTab === 'all_skus' && key) {
                            return (
                              <td key={idx} className="border px-2 py-2.5 font-bold text-center">
                                {Number((manualTotalsForAll as any)[key] ?? 0).toFixed(2)}
                              </td>
                            );
                          }


                          // 🔸 Baaki tabs (top_80 / other): backend segmentTotal se % growth dikhana
                          if (activeTab !== 'new_or_reviving_skus') {
                            const growth = segmentTotal
                              ? (segmentTotal[field] as GrowthCategory | undefined)
                              : undefined;

                            if (!growth || growth.value == null) {
                              return (
                                <td
                                  key={idx}
                                  className="border px-2 py-2.5 text-center"
                                >
                                  N/A
                                </td>
                              );
                            }

                            let color = '#414042';
                            if (growth.category === 'High Growth') color = '#5EA68E';
                            else if (growth.category === 'Negative Growth')
                              color = '#FF5C5C';

                            const sign = growth.value >= 0 ? '+' : '';

                            return (
                              <td
                                key={idx}
                                className="border px-2 py-2.5 text-center"
                                style={{ color, fontWeight: 600 }}
                              >
                                {growth.category} ({sign}
                                {Number(growth.value).toFixed(2)}%)
                              </td>
                            );
                          }

                          // new_or_reviving_skus + koi % column (jaise Sales Mix Change) -> blank
                          return (
                            <td
                              key={idx}
                              className="border px-2 py-2.5 text-center"
                            ></td>
                          );
                        })}

                        {Object.keys(skuInsights).length > 0 && (
                          <td className="border px-2 py-2.5 text-center"></td>
                        )}
                      </tr>
                    </tfoot> */}
                    <tfoot>
                      <tr>
                        <td className="border px-2 py-2.5 text-center bg-[#D9D9D9E5]"></td>

                        <td className="border px-2 py-2.5 font-bold text-left bg-[#D9D9D9E5]">
                          Total
                        </td>

                        <td className="border px-2 py-2.5 font-bold text-center bg-[#D9D9D9E5]">
                          {activeTab === 'all_skus'
                            ? `${manualTotalsForAll.salesMix.toFixed(2)}%`
                            : segmentTotal && (segmentTotal as any)['Sales Mix (Month2)'] != null
                              ? `${Number((segmentTotal as any)['Sales Mix (Month2)']).toFixed(2)}%`
                              : activeTab === 'new_or_reviving_skus'
                                ? `${manualTotalsForNewRev.salesMix.toFixed(2)}%`
                                : 'N/A'}
                        </td>

                        {[
                          { field: 'Unit Growth', key: 'quantity' },
                          { field: 'ASP Growth', key: 'asp' },
                          { field: 'Sales Growth', key: 'net_sales' },
                          ...(activeTab !== 'new_or_reviving_skus'
                            ? [{ field: 'Sales Mix Change', key: null }]
                            : []),
                          { field: 'Profit Per Unit', key: 'unit_wise_profitability' },
                          { field: 'CM1 Profit Impact', key: 'profit' },
                        ].map(({ field, key }, idx) => {
                          // keep your existing logic, just ensure td has bg
                          if (activeTab === 'all_skus' && key) {
                            return (
                              <td key={idx} className="border px-2 py-2.5 font-bold text-center bg-[#D9D9D9E5]">
                                {Number((manualTotalsForAll as any)[key] ?? 0).toFixed(2)}
                              </td>
                            );
                          }

                          if (activeTab !== 'new_or_reviving_skus') {
                            const growth = segmentTotal
                              ? (segmentTotal[field] as GrowthCategory | undefined)
                              : undefined;

                            if (!growth || growth.value == null) {
                              return (
                                <td key={idx} className="border px-2 py-2.5 text-center bg-[#D9D9D9E5]">
                                  N/A
                                </td>
                              );
                            }

                            const cat = growth.category;
                            const val = Number(growth.value);
                            const absVal = Number.isFinite(val) ? Math.abs(val) : val;

                            const isHigh = cat === 'High Growth';
                            const isNeg = cat === 'Negative Growth';

                            return (
                              <td
                                key={idx}
                                className="border px-2 py-2.5 text-center bg-[#D9D9D9E5]"
                                style={{
                                  fontWeight: 600,
                                  color: isHigh ? '#16a34a' : isNeg ? '#dc2626' : '#000000',
                                }}
                              >
                                {isHigh ? '↑ ' : isNeg ? '↓ ' : ''}
                                {cat} ({val >= 0 ? '+' : '-'}
                                {Number(absVal).toFixed(2)}%)
                              </td>
                            );
                          }

                          return (
                            <td key={idx} className="border px-2 py-2.5 text-center bg-[#D9D9D9E5]"></td>
                          );
                        })}

                        {Object.keys(skuInsights).length > 0 && (
                          <td className="border px-2 py-2.5 text-center bg-[#D9D9D9E5]"></td>
                        )}
                      </tr>
                    </tfoot>


                  </table>
                </div>
              ) : (
                <div className="pt-6 text-sm text-gray-500">
                  No SKUs found for this period / country.
                  Try changing the date range or checking if orders exist.
                </div>
              )}
            </div>
            {activeTab === "all_skus" && allSkuRows.length > 5 && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  className="styled-button"
                  onClick={() => setShowAllSkus((s) => !s)}
                >
                  {showAllSkus ? "Show Less" : `Others (${allSkuRows.length - 5})`}
                </button>
              </div>
            )}

          </div>




        </div>
      )}


      {(() => {
        if (!modalOpen || !selectedSku) return null;

        const insightData =
          skuInsights[selectedSku as keyof typeof skuInsights] ||
          getInsightByProductName(selectedSku as string)?.[1];

        if (!insightData) return null;

        return (
          <Drawer
            anchor="right"
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            PaperProps={{
              sx: {
                width: { xs: '100vw', sm: '80vw', md: '60vw', lg: '50vw' },
                maxWidth: 900,
                padding: 2,
              },
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                height: '100%',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 18 }}>
                  AI Insight for{' '}
                  <span style={{ color: '#60a68e' }}>
                    {insightData.product_name || selectedSku}
                  </span>
                </h2>

                <IconButton
                  size="small"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close"
                >
                  x
                </IconButton>
              </div>

              {/* Chart */}
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                <Productinfoinpopup productname={insightData.product_name} />
              </div>

              {/* Insights text with bullets & colors */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  marginTop: 8,
                  paddingRight: 4,
                }}
              >
                {renderFormattedInsight(insightData.insight)}
              </div>
            </div>
          </Drawer>
        );
      })()}

    </>
  );
};

export default MonthsforBI;
