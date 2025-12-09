'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation'; // Next.js uses next/navigation for app router
import * as XLSX from 'xlsx';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import Productinfoinpopup from '@/components/businessInsight/Productinfoinpopup';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { IoDownload } from "react-icons/io5";
import { BsStars } from "react-icons/bs";
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import DownloadIconButton from '@/components/ui/button/DownloadIconButton';


// =========================
// Types/Interfaces
// =========================
interface MonthOption {
  value: string;
  label: string;
}

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

  // ✅ new raw fields from backend for Excel:
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

  [key: string]: any; // For growth fields like 'Unit Growth'
}

interface CategorizedGrowth {
  top_80_skus: SkuItem[];
  new_or_reviving_skus: SkuItem[];
  other_skus: SkuItem[];
}

interface SkuInsight {
  product_name: string;
  insight: string;
  [key: string]: any;
}

interface ApiResponse {
  comparison_range?: {
    month2_label: string;
  };
  categorized_growth?: CategorizedGrowth;
  insights?: Record<string, SkuInsight>;
}

// =========================
// Config
// =========================
const API_BASE = 'http://127.0.0.1:5000';

// Persist keys
const STORAGE_KEY = 'bi_insight_data';        // compare inputs + results
const INSIGHTS_KEY = 'bi_sku_insights';       // AI insights (optional persist)

// Axios instance with JWT
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  const t = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const MonthsforBI: React.FC = () => {
  const params = useParams();
  const countryName = params?.countryName as string | undefined;

  // Month/year form
  const [month1, setMonth1] = useState<string>('');
  const [year1, setYear1] = useState<string>('');
  const [month2, setMonth2] = useState<string>('');
  const [year2, setYear2] = useState<string>('');

  // Data + UI state
  const [categorizedGrowth, setCategorizedGrowth] = useState<CategorizedGrowth>({
    top_80_skus: [],
    new_or_reviving_skus: [],
    other_skus: [],
  });
  const [activeTab, setActiveTab] = useState<'top_80_skus' | 'new_or_reviving_skus' | 'other_skus'>('top_80_skus');
  const [month2Label, setMonth2Label] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Insights + modal
  const [loadingInsight, setLoadingInsight] = useState<boolean>(false);
  const [skuInsights, setSkuInsights] = useState<Record<string, SkuInsight>>({});
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // Feedback (Summary)
  const [fbType, setFbType] = useState<'like' | 'dislike' | null>(null);
  const [fbText, setFbText] = useState<string>('');
  const [fbSubmitting, setFbSubmitting] = useState<boolean>(false);
  const [fbSuccess, setFbSuccess] = useState<boolean>(false);

  // ✅ NEW: available periods from backend (['YYYY-MM'])
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);

  // Helpers
  const months: MonthOption[] = [
    { value: '01', label: 'January' },   { value: '02', label: 'February' },
    { value: '03', label: 'March' },     { value: '04', label: 'April' },
    { value: '05', label: 'May' },       { value: '06', label: 'June' },
    { value: '07', label: 'July' },      { value: '08', label: 'August' },
    { value: '09', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' },  { value: '12', label: 'December' },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 2 }, (_, i) => String(currentYear - i));
  const pad2 = (m: string | number) => String(m).padStart(2, '0');
  const getAbbr = (m: string | number) => months.find(x => x.value === pad2(m))?.label.slice(0, 3) || '';
  const y1 = String(year1 || '');
  const y2 = String(year2 || '');

  const isGlobalData = () => (countryName || '').toLowerCase() === 'global';
  const getTabLabel = (key: keyof CategorizedGrowth): string =>
    key === 'top_80_skus' ? 'Top 80% SKUs' :
    key === 'new_or_reviving_skus' ? 'New/Reviving SKUs' : 'Other SKUs';
  const getTabNumberForFeedback = (key: keyof CategorizedGrowth): number =>
    key === 'top_80_skus' ? 1 : key === 'new_or_reviving_skus' ? 2 : 3;

  // ✅ NEW helper: check if (year, month) allowed by backend
  const isPeriodAvailable = (year: string, month: string) => {
    if (!year || !month) return false;
    if (!availablePeriods.length) return true; // if API failed, don't block UI
    const key = `${year}-${month}`;
    return availablePeriods.includes(key);
  };

  // =========================
  // Persistence: helpers
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

  // =========================
  // Load persisted state on mount
  // =========================
  useEffect(() => {
    const saved = loadCompareFromStorage();
    if (saved) {
      setMonth1(saved.month1 || '');
      setYear1(saved.year1 || '');
      setMonth2(saved.month2 || '');
      setYear2(saved.year2 || '');
      setCategorizedGrowth(saved.categorizedGrowth || { top_80_skus: [], new_or_reviving_skus: [], other_skus: [] });
      setMonth2Label(saved.month2Label || '');
      if (saved.activeTab) setActiveTab(saved.activeTab);
    }
    const cachedInsights = loadInsightsFromStorage();
    if (cachedInsights && Object.keys(cachedInsights).length) {
      setSkuInsights(cachedInsights);
    }
  }, []);

  // Also persist activeTab changes (lightweight)
  useEffect(() => {
    const saved = loadCompareFromStorage();
    if (saved) {
      saveCompareToStorage({ ...saved, activeTab });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ✅ NEW: fetch available periods from backend
  useEffect(() => {
    if (!countryName) return;
    const fetchAvailable = async () => {
      try {
        const res = await api.get<{ periods: string[] }>('/MonthsforBI/available-periods', {
          params: { countryName },
        });
        setAvailablePeriods(res.data?.periods || []);
      } catch (err: any) {
        console.error('Failed to load available periods:', err?.response?.data || err.message);
      }
    };
    fetchAvailable();
  }, [countryName]);

  // ✅ NEW: if year change ke baad combination invalid ho jaye to month reset
  useEffect(() => {
    if (year1 && month1 && !isPeriodAvailable(year1, month1)) {
      setMonth1('');
    }
  }, [year1, availablePeriods]);

  useEffect(() => {
    if (year2 && month2 && !isPeriodAvailable(year2, month2)) {
      setMonth2('');
    }
  }, [year2, availablePeriods]);

  // =====================
  // Fetch compare result
  // =====================
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    setError(null);
    setCategorizedGrowth({ top_80_skus: [], new_or_reviving_skus: [], other_skus: [] });
    setMonth2Label('');
    setSkuInsights({});
    setModalOpen(false);
    // Clear previous persisted insights if any (fresh compare)
    saveInsightsToStorage({});

    // ✅ NEW: basic + availability validation
    if (!month1 || !year1 || !month2 || !year2) {
      setError('Please select both months and years.');
      return;
    }
    if (!isPeriodAvailable(year1, month1) || !isPeriodAvailable(year2, month2)) {
      setError('Selected month ka data available nahi hai. Sirf highlighted months select karein.');
      return;
    }

    try {
      const res = await api.get<ApiResponse>('/MonthsforBI', {
        params: { month1, year1, month2, year2, countryName },
      });
      const newMonth2Label = res.data?.comparison_range?.month2_label || '';
      const newCategorized: CategorizedGrowth = res.data?.categorized_growth || { top_80_skus: [], new_or_reviving_skus: [], other_skus: [] };

      setMonth2Label(newMonth2Label);
      setCategorizedGrowth(newCategorized);

      // Save to localStorage (persist compare)
      saveCompareToStorage({
        month1, year1, month2, year2,
        categorizedGrowth: newCategorized,
        month2Label: newMonth2Label,
        activeTab,
        countryName
      });
    } catch (err: any) {
      console.error('MonthsforBI error:', err?.response?.data || err.message);
      setError(err?.response?.data?.error || 'An error occurred');
    }
  };

  // =====================
  // AI insights generate
  // =====================
  const analyzeSkus = async () => {
    setLoadingInsight(true);
    try {
      const allSkus: SkuItem[] = [
        ...categorizedGrowth.top_80_skus,
        ...categorizedGrowth.new_or_reviving_skus,
        ...categorizedGrowth.other_skus,
      ];
      const res = await api.post<{ insights: Record<string, SkuInsight> }>('/analyze_skus', {
        month1, year1, month2, year2,
        country: countryName,
        skus: allSkus,
      });
      const insights = res.data?.insights || {};
      setSkuInsights(insights);

      // persist insights so returning to route still shows "View Insights" etc.
      saveInsightsToStorage(insights);
    } catch (err: any) {
      console.error('analyze_skus error:', err?.response?.data || err.message);
    } finally {
      setLoadingInsight(false);
    }
  };

  // =====================
  // Insight lookups
  // =====================
  const getInsightByProductName = (productName: string): [string, SkuInsight] | null => {
    if (!productName) return null;
    const needle = productName.toLowerCase().trim();

    // Prefer exact match
    let entry = Object.entries(skuInsights).find(
      ([, d]) => d.product_name?.toLowerCase().trim() === needle
    );
    // For GLOBAL, allow partial fallback
    if (!entry && isGlobalData()) {
      entry = Object.entries(skuInsights).find(([, d]) => {
        const n = d.product_name?.toLowerCase().trim();
        return n && (n.includes(needle) || needle.includes(n));
      });
    }
    return entry ? entry as [string, SkuInsight] : null; // [key, value]
  };

  const getInsightForItem = (item: SkuItem): [string, SkuInsight] | null => {
    if (isGlobalData()) return getInsightByProductName(item.product_name);
    if (item.sku && skuInsights[item.sku]) return [item.sku, skuInsights[item.sku]];
    return getInsightByProductName(item.product_name);
  };

  // =====================
  // Export to Excel
  // =====================
const exportToExcel = (rows: SkuItem[], filename = 'export.xlsx') => {
  // Month labels for header, like Sep / Oct
  const m1Abbr = getAbbr(month1); // e.g. "Sep"
  const m2Abbr = getAbbr(month2); // e.g. "Oct"

  const formatted = rows.map((row) => {
    const unitGrowth = row['Unit Growth'] as GrowthCategory | undefined;
    const aspGrowth = row['ASP Growth'] as GrowthCategory | undefined;
    const salesGrowth = row['Sales Growth'] as GrowthCategory | undefined;
    const mixGrowth = row['Sales Mix Change'] as GrowthCategory | undefined;
    const unitProfitGrowth = row['Profit Per Unit'] as GrowthCategory | undefined;
    const profitGrowth = row['CM1 Profit Impact'] as GrowthCategory | undefined;

    return {
      // Basic identifiers
      SKU: row.sku || '',
      Product: row.product_name || '',

      // Qty
      [`Qty ${m1Abbr}`]: row.quantity_month1 ?? null,
      [`Qty ${m2Abbr}`]: row.quantity_month2 ?? null,
      'Qty %': unitGrowth?.value ?? null,

      // ASP
      [`ASP ${m1Abbr}`]: row.asp_month1 ?? null,
      [`ASP ${m2Abbr}`]: row.asp_month2 ?? null,
      'ASP %': aspGrowth?.value ?? null,

      // Net Sales
      [`Net Sales ${m1Abbr}`]: row.net_sales_month1 ?? null,
      [`Net Sales ${m2Abbr}`]: row.net_sales_month2 ?? null,
      'Net Sales %': salesGrowth?.value ?? null,

      // Sales Mix
      [`Sales Mix ${m1Abbr}`]: row.sales_mix_month1 ?? null,
      [`Sales Mix ${m2Abbr}`]: row.sales_mix_month2 ?? row['Sales Mix (Month2)'] ?? null,
      'Sales Mix %': mixGrowth?.value ?? null,

      // Unit Profit (Unit-wise profitability)
      [`Unit Profit ${m1Abbr}`]: row.unit_wise_profitability_month1 ?? null,
      [`Unit Profit ${m2Abbr}`]: row.unit_wise_profitability_month2 ?? null,
      'Unit Profit %': unitProfitGrowth?.value ?? null,

      // Profit
      [`Profit ${m1Abbr}`]: row.profit_month1 ?? null,
      [`Profit ${m2Abbr}`]: row.profit_month2 ?? null,
      'Profit %': profitGrowth?.value ?? null,
    };
  });

  const ws = XLSX.utils.json_to_sheet(formatted);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Growth Comparison');
  XLSX.writeFile(wb, filename);
};

  // =====================
  // Save feedback (Summary)
  // =====================
  const submitSummaryFeedback = async () => {
    try {
      if (!selectedSku) return;
      if (!fbType) {
        setError('Please choose 👍 or 👎 before submitting.');
        return;
      }

      setFbSubmitting(true);
      setError(null);

      // Current insight
      const insightData = skuInsights[selectedSku as keyof typeof skuInsights] || getInsightByProductName(selectedSku as string)?.[1];
      const productName = insightData?.product_name || selectedSku;

      // ⬇️ send FULL text; no front-end truncation
      const fullInsightText = (insightData?.insight || '');

      // Find row index for active tab (optional)
      const currentRows = categorizedGrowth[activeTab] || [];
      const rowIndex = Math.max(
        currentRows.findIndex((r) =>
          (r.sku && r.sku === selectedSku) ||
          (r.product_name &&
            r.product_name.toLowerCase().trim() === String(productName).toLowerCase().trim())
        ),
        -1
      );

      const payload = {
        country: countryName,
        rowIndex: rowIndex === -1 ? 0 : rowIndex,
        tab: getTabNumberForFeedback(activeTab),
        type: fbType,             // 'like' | 'dislike'
        text: fbText || '',
        productData: {
          product_name: productName,
          // backend prefers combined_text; also send raw as fallback
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

  // =====================
  // Insight renderer (headings + bullets)
  // =====================
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

  const getAllSkusForExport = (): SkuItem[] => {
  return [
    ...(categorizedGrowth.top_80_skus || []),
    ...(categorizedGrowth.new_or_reviving_skus || []),
    ...(categorizedGrowth.other_skus || []),
  ];
};

  const currentTabData = categorizedGrowth[activeTab] || [];

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
  .month-form{ max-width:100%; margin:15px 0; border:1px solid #000000; padding:10px; background:#fff; }
  .month-tag{ font-size:12px; font-weight:bold; color:#414042; position:absolute; top:-25px; }
  .highlight{ color:#60a68e; }
  .subtitle{ margin-top:0; color:#414042; font-size:14px; }

  .month-row{
    display:flex;
    align-items:center;
    margin-top:20px;
    gap:10px;
  }
  .year-dropdown{
    margin-right:10px;
    padding:6px;
    font-size:14px;
    border-radius:4px;
    border:1px solid #ccc;
  }
  .month-slider{
    margin-top:30px;
    display:flex;
    flex-grow:1;
    justify-content:space-between;
    padding:0 10px;
    position:relative;
    border-top:2px solid #ccc;
  }
  .month-dot{
    display:flex;
    flex-direction:column;
    align-items:center;
    cursor:pointer;
    position:relative;
    top:-6px;
  }
  .month-dot .dot{
    width:12px;
    height:12px;
    background:#ccc;
    border-radius:50%;
    margin-bottom:4px;
  }
  .month-dot.selected .dot{ background:#5EA68E; }

  /* ✅ NEW: disabled months styling */
  .month-dot.disabled{
    opacity:0.3;
    cursor:not-allowed;
  }
  .month-dot.disabled .dot{
    background:#eee;
  }

  .month-label{
    font-size:12px;
    color:#414042;
    white-space:nowrap;
  }
  .month-label-short{ display:none; }   /* default: desktop pe short hidden */
  .month-label-full{ display:inline; }

  /* ======= Responsive changes (under lg) ======= */
  @media (max-width: 1023.98px){
    .month-row{
      flex-direction:column;
      align-items:stretch;
    }
    .year-dropdown{
      width:100%;
      margin-right:0;
    }
    .month-slider{
      margin-top:20px;
      padding:0 4px;
    }
    .month-label{
      font-size:10px;
    }
    .month-label-full{ display:none; }   /* mobile: sirf 3 letter show */
    .month-label-short{ display:inline; }

    .month-tag{
      top:-20px;
      font-size:11px;
    }
  }

  .compare-button-container{ margin-top:20px; text-align:right; }
  .theadc{ background:#5EA68E; color:#f8edcf; }
  .tablec{ width:100%; border-collapse:collapse; }
  .tablec td, .tablec th{ border:1px solid #414042; padding:10px 8px; text-align:center; }
  .insight-section-title{ font-size:15px; color:#414042; }
  .insight-list{ margin: 6px 0 10px 20px; padding:0; }
  .insight-list-item{ line-height:1.6; }
  .insight-paragraphs p{ margin:4px 0; line-height:1.6; }
`}</style>

      {/* Month selectors */}
      <h2 className="text-2xl font-bold text-[#414042] mb-2">
          Business Insights - AI Analyst&nbsp;
          <span className="text-[#5EA68E]">
            {month1 && year1 && month2 && year2
              ? `(${getAbbr(month1)}'${y1.slice(2)} vs ${getAbbr(month2)}'${y2.slice(2)})`
              : ''}
          </span>
        </h2>
        <p><i className="">Choose any two months to performance trends.</i></p>
      <form onSubmit={handleSubmit} className="month-form ">
        {/* Row 1 */}
        <div className="month-row">
          <select value={year1} onChange={(e)=>setYear1(e.target.value)} className="year-dropdown">
            <option value="">Year 1</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="month-slider">
            {months.map(m => {
             const disabled = !year1 || !isPeriodAvailable(year1, m.value);
              const selected = month1 === m.value;
              return (
                <div
                  key={m.value}
                  className={`month-dot ${selected ? 'selected':''} ${disabled ? 'disabled' : ''}`}
                  onClick={() => {
                    if (disabled) return;
                    setMonth1(m.value);
                  }}
                >
                  {selected && !disabled && <div className="month-tag text-nowrap">Month 1</div>}
                  <span className="dot"></span>
                  <div className="month-label">
                    <span className="month-label-full">{m.label}</span>
                    <span className="month-label-short">{m.label.slice(0, 3)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Row 2 */}
        <div className="month-row">
          <select value={year2} onChange={(e)=>setYear2(e.target.value)} className="year-dropdown">
            <option value="">Year 2</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="month-slider">
            {months.map(m => {
             const disabled = !year2 || !isPeriodAvailable(year2, m.value);
              const selected = month2 === m.value;
              return (
                <div
                  key={m.value}
                  className={`month-dot ${selected ? 'selected':''} ${disabled ? 'disabled' : ''}`}
                  onClick={() => {
                    if (disabled) return;
                    setMonth2(m.value);
                  }}
                >
                  {selected && !disabled && <div className="month-tag text-nowrap">Month 2</div>}
                  <span className="dot"></span>
                  <div className="month-label">
                    <span className="month-label-full">{m.label}</span>
                    <span className="month-label-short">{m.label.slice(0, 3)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>
       

      <div className="compare-button-container">
        <button type="submit" onClick={handleSubmit} className="compare-button">Compare</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Table + actions */}
      {Object.values(categorizedGrowth).some(arr => arr.length > 0) && (
        <div>
          <div className='flex md:flex-row flex-col justify-between items-center mt-10'>
            <div className='flex md:flex-row flex-col justify-between items-center w-full'>
<h2 className="text-2xl font-bold text-[#414042] mb-4">Performance-based SKU split</h2>
            <div className='flex justify-center gap-3'>
  <div
              style={{
               
                border: '1px solid #D9D9D9E5',
                borderRadius: 8,
                display: 'inline-flex',
                overflow: 'hidden'
              }}
              className='p-1'
            >
              {['top_80_skus','new_or_reviving_skus','other_skus'].map(key => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as keyof CategorizedGrowth)}
                  className="text-sm font-normal"
                  style={{
                    padding: '3px 12px',
                    backgroundColor: activeTab === key ? '#5EA68E80' : '#ffffff',
                    color: '#414042',
                    border: 'none',
                    borderRadius: 5,
                    fontWeight: activeTab === key ? 600 : 400
                  }}
                >
                  {getTabLabel(key as keyof CategorizedGrowth)}
                </button>
              ))}
            </div>
            <div className='flex gap-3'>
 <button
              onClick={analyzeSkus}
              disabled={!Object.values(categorizedGrowth).some(a => a.length > 0)}
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
                const file = `AllSKUs-${getAbbr(month1)}'${String(year1).slice(2)}vs${getAbbr(month2)}'${String(year2).slice(2)}.xlsx`;
const allRows = getAllSkusForExport();
exportToExcel(allRows, file);
              }}
             className="bg-white border border-[#8B8585] px-1 rounded-sm"
                            style={{
                 boxShadow: "0px 4px 4px 0px #00000040",  
               }}
                         >
                         <IoDownload size={27} color='[#414042]' />
            </button>

            </div>
           
            </div>
            </div>
            
          
          </div>

          <div className="overflow-x-auto pt-4">
            <table className="tablec w-full border-collapse md:text-sm text-xs">
              <thead className="theadc">
                <tr>
                  <th>S.No.</th>
                  <th className="text-left">Product Name</th>
                  <th>Sales Mix ({month2Label || 'Month 2'})</th>
                  <th>{activeTab==='new_or_reviving_skus' ? `Units (${month2Label})` : 'Unit Growth (%)'}</th>
                  <th>{activeTab==='new_or_reviving_skus' ? `ASP (${month2Label})`   : 'ASP Growth (%)'}</th>
                  <th>{activeTab==='new_or_reviving_skus' ? `Sales (${month2Label})` : 'Sales Growth (%)'}</th>
                  {activeTab!=='new_or_reviving_skus' && <th>Sales Mix Change (%)</th>}
                  <th>{activeTab==='new_or_reviving_skus' ? `Unit Profit (${month2Label})` : 'Profit Per Unit (%)'}</th>
                  <th>{activeTab==='new_or_reviving_skus' ? `Profit (${month2Label})`      : 'CM1 Profit Impact (%)'}</th>
                  {Object.keys(skuInsights).length > 0 && <th>AI Insight</th>}
                </tr>
              </thead>

              <tbody>
                {categorizedGrowth[activeTab]?.map((item, idx) => (
                  <tr key={idx} className="">
                    <td className="border border-[#414042] px-2 py-2.5 text-center">{idx + 1}</td>
                    <td className="border border-[#414042] px-2 py-2.5 text-left">{item.product_name}</td>
                    <td className="border border-[#414042] px-2 py-2.5 text-center">
                      {item['Sales Mix (Month2)'] != null
                        ? `${Number(item['Sales Mix (Month2)']).toFixed(2)}%` : 'N/A'}
                    </td>

                    {[
                      { field:'Unit Growth', raw:'quantity' },
                      { field:'ASP Growth',  raw:'asp' },
                      { field:'Sales Growth',raw:'net_sales' },
                      ...(activeTab !== 'new_or_reviving_skus' ? [{ field:'Sales Mix Change', raw:'sales_mix' }] : []),
                      { field:'Profit Per Unit', raw:'unit_wise_profitability' },
                      { field:'CM1 Profit Impact', raw:'profit' },
                    ].map(({ field, raw }) => {
                      const growth = item[field];

                      if (activeTab === 'new_or_reviving_skus') {
                        const v = item[raw];
                        return <td key={field} className="border border-[#414042] px-2 py-2.5 text-center">{v != null ? Number(v).toFixed(2) : 'N/A'}</td>;
                      }

                     if (!growth || (growth as GrowthCategory).value == null)
  return <td key={field} className="border border-[#414042] px-2 py-2.5 text-center">N/A</td>;

const g = growth as GrowthCategory;
const val = Number(g.value);
const sign = val >= 0 ? '+' : '';
const text = `${sign}${val.toFixed(2)}%`;

// High Growth: green up arrow + number
if (g.category === 'High Growth') {
  return (
    <td key={field} className="border border-[#414042] px-2 py-2.5 text-center" style={{ fontWeight: 600 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#5EA68E' }}>
        <FaArrowUp size={12} />
        {text}
      </span>
    </td>
  );
}

// Negative Growth: red down arrow + number
if (g.category === 'Negative Growth') {
  return (
    <td key={field} className="border border-[#414042] px-2 py-2.5 text-center" style={{ fontWeight: 600 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#FF5C5C' }}>
        <FaArrowDown size={12} />
        {text}
      </span>
    </td>
  );
}

// Low Growth: ONLY number (no icon). Keep sign (+/-). Neutral color.
return (
  <td
    key={field}
    className="border border-[#414042] px-2 py-2.5 text-center"
    style={{ fontWeight: 600, color: '#414042' }}
  >
    {text}
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
                                className="font-semibold underline text-[#414042]"
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
                            <em style={{ color:'#888' }}>
                              Not analyzed
                              <br />
                              <small style={{ fontSize: 10 }}>
                                ({isGlobalData() ? 'Global/Product Name' : 'SKU'}: {item.product_name || item.sku || 'N/A'})
                              </small>
                            </em>
                          );
                        })()}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="bg-[#D9D9D9E5]">
                  <td className="border border-[#414042] px-2 py-2.5 text-center"></td>
                  <td className="border border-[#414042] px-2 py-2.5 text-left font-bold"><strong>Total</strong></td>
                  <td className="border border-[#414042] px-2 py-2.5 text-center font-bold">
                    {categorizedGrowth[activeTab]
                      ?.filter(r => r['Sales Mix (Month2)'] != null)
                      ?.reduce((s, r) => s + Number(r['Sales Mix (Month2)'] || 0), 0)
                      ?.toFixed(2)}%
                  </td>
                  {['Unit Growth','ASP Growth','Sales Growth',
                    ...(activeTab!=='new_or_reviving_skus' ? ['Sales Mix Change'] : []),
                    'Profit Per Unit','CM1 Profit Impact'].map((_, i) => <td key={i} className="border border-[#414042] px-2 py-2.5 text-center"></td>)}
                  {Object.keys(skuInsights).length > 0 && <td className="border border-[#414042] px-2 py-2.5 text-center"></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Insight Modal */}
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
