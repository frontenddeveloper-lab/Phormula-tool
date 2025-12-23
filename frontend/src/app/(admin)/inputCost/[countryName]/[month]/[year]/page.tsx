'use client';

import React, { use, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import '@/app/(admin)/pnlforecast/[countryName]/[month]/[year]/Styles.css';
import Modalmsg from '@/components/ui/modal/Modalmsg';
import SkuMultiuseCountryUpload from '@/components/ui/modal/SkuMultiCountryUpload';
import { IoDownload } from "react-icons/io5";

/* ================= TYPES ================= */
interface Params {
  params: Promise<{
    countryName: string;
    month: string;
    year: string;
  }>;
}

interface SkuRow {
  s_no: number;
  product_name: string;
  sku_uk?: string;
  sku_us?: string;
  sku_canada?: string;
  asin?: string;
  product_barcode?: string;
  price?: number;
  currency?: string;
  [key: string]: any;
}

/* ================= UTILS ================= */
const getCurrencySymbol = (country: string | undefined): string => {
  switch (country) {
    case 'GBP': return '£';
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'CAD': return '$';
    case 'EUR': return '€';
    default: return '$';
  }
};

function getCurrencyForCountry(country: string): string {
  switch (country.toLowerCase()) {
    case 'uk': return 'GBP';
    case 'us': return 'USD';
    case 'canada': return 'CAD';
    case 'eu': return 'EUR';
    default: return 'USD';
  }
}

/* ================= COMPONENT ================= */
export default function InputCostPage({ params }: Params) {
  const { countryName: countryNameRaw, month: monthRaw, year: yearRaw } = use(params);
  const countryName = decodeURIComponent(countryNameRaw ?? '').toLowerCase();
  const monthParam = decodeURIComponent(monthRaw ?? '');
  const yearParam = decodeURIComponent(yearRaw ?? '');

  /* ===== EXISTING STATE ===== */
  const [skuData, setSkuData] = useState<SkuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({});
  const [aspData, setAspData] = useState<Record<string, number>>({});
  const [showMultiuseCountry, setShowMultiuseCountry] = useState(false);

  /* ===== NEW AGEING STATE ===== */
  const [ageingMap, setAgeingMap] = useState<Record<string, any>>({});
  const [showAgeBreakup, setShowAgeBreakup] = useState(false);

  /* ================= COLUMN LOGIC ================= */
  const isColumnEmpty = (data: SkuRow[], columnName: string) =>
    data.every(r => !r[columnName]);

  const getVisibleColumns = (data: SkuRow[]) => {
    const base = ['s_no', 'product_name'];
    const skuCol = `sku_${countryName}`;
    const cols = [...base];
    if (!isColumnEmpty(data, skuCol)) cols.push(skuCol);
    cols.push('asin', 'product_barcode', 'price', `gross_margin_${countryName}`);
    return cols;
  };

  const getColumnDisplayName = (col: string) => {
    if (col === 's_no') return 'Sno.';
    if (col === 'product_name') return 'Product Name';
    if (col === 'price') return 'Landing Cost';
    if (col.startsWith('sku_')) return `SKU (${col.replace('sku_', '').toUpperCase()})`;
    if (col.startsWith('gross_margin_')) return `Gross Margin (%)`;
    return col.toUpperCase();
  };

  /* ================= FINANCE LOGIC (UNCHANGED) ================= */
  const getCurrencyRate = (currency: string | undefined, country: string) =>
    currencyRates[`${currency}_${country}`] ?? 1;

  const getAspForProduct = (product: string) =>
    aspData[product] ?? null;

  const calculateGrossMargin = (
    price: number | undefined,
    currency: string | undefined,
    targetCountry: string,
    productName: string
  ) => {
    const asp = getAspForProduct(productName);
    if (!price || !asp) return 'N/A';
    const converted = price * getCurrencyRate(currency, targetCountry);
    return (((asp - converted) / asp) * 100).toFixed(2);
  };

  /* ================= DATA FETCHERS ================= */

  // SKU
  const fetchSkuData = async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const res = await fetch('http://127.0.0.1:5000/skuprice', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setSkuData(data);
    setVisibleColumns(getVisibleColumns(data));
  };

  // Currency
  const fetchCurrencyRates = async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const res = await fetch('http://127.0.0.1:5000/currency-rates', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const rates = await res.json();
    const map: Record<string, number> = {};
    rates.forEach((r: any) => map[`${r.user_currency}_${r.country}`] = r.conversion_rate);
    setCurrencyRates(map);
  };

  // ASP
  const fetchAspData = async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const res = await fetch(
      `http://127.0.0.1:5000/asp-data?country=${countryName}&month=${monthParam}&year=${yearParam}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    const map: Record<string, number> = {};
    data.forEach((d: any) => map[d.product_name] = d.asp);
    setAspData(map);
  };

  // 🔥 AGEING INVENTORY (NEW)
  const fetchAgeingInventory = async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const res = await fetch(
      'http://127.0.0.1:5000/amazon_api/inventory/aged',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const json = await res.json();
    const rows = json?.rows || json?.data || [];
    const map: Record<string, any> = {};
    rows.forEach((r: any) => r.asin && (map[r.asin] = r));
    setAgeingMap(map);
  };

  /* ================= EFFECT ================= */
  useEffect(() => {
    Promise.all([
      fetchSkuData(),
      fetchCurrencyRates(),
      fetchAspData(),
      fetchAgeingInventory(),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [countryName, monthParam, yearParam]);

   const saveChanges = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
    if (!token) {
      alert('Authorization token is missing');
      return;
    }
    if (Object.keys(editedPrices).length === 0) {
      alert('No changes to save.');
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:5000/updatePrices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prices: editedPrices }),
      });
      if (response.ok) {
        const result = await response.json();
        setModalMessage('Prices updated successfully');
        setShowModal(true);
        setIsEditing(false);
        setEditedPrices({});
        if (result.data) {
          const sortedData: SkuRow[] = result.data.sort((a: SkuRow, b: SkuRow) => (a.s_no ?? 0) - (b.s_no ?? 0));
          setSkuData(sortedData);
          const columns = getVisibleColumns(sortedData);
          setVisibleColumns(columns);
        } else {
          window.location.reload();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update prices');
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
      console.error('Update prices error:', e);
    }
  };

  const renderGrossMarginCell = (row: SkuRow, column: string) => {
    const targetCountry = column.replace('gross_margin_', '');
    const currentPrice =
      editedPrices[row.product_name] !== undefined ? editedPrices[row.product_name] : row.price;
    const currency = row.currency;
    const grossMargin = calculateGrossMargin(currentPrice, currency, targetCountry, row.product_name);

    if (grossMargin === 'N/A') return <span className="gross-margin-na">N/A</span>;
    const marginValue = parseFloat(grossMargin);
    const className = marginValue >= 0 ? 'gross-margin-positive' : 'gross-margin-negative';
    return <span className={className}>{grossMargin}%</span>;
  };


   const handleDownloadXLSX = () => {
    if (!skuData || skuData.length === 0) {
      alert('No data available to download.');
      return;
    }

    const dataToExport = skuData.map((row) => {
      const newRow = { ...row } as SkuRow;
      if (editedPrices[row.product_name] !== undefined) {
        newRow.price = editedPrices[row.product_name];
      }
      return newRow;
    });

    const exportData = dataToExport.map((row) => {
      const filtered: Record<string, any> = {};
      visibleColumns.forEach((col) => {
        if (col.startsWith('gross_margin_')) {
          const c = col.replace('gross_margin_', '');
          const gm = calculateGrossMargin(
            editedPrices[row.product_name] !== undefined ? editedPrices[row.product_name] : row.price,
            row.currency,
            c,
            row.product_name
          );
          filtered[String(getColumnDisplayName(col))] = gm !== 'N/A' ? `${gm}%` : 'N/A';
        } else if (col === 'price') {
          const priceValue =
            editedPrices[row.product_name] !== undefined ? editedPrices[row.product_name] : row.price;
          const symbol = getCurrencySymbol(row.currency);
          filtered[String(getColumnDisplayName(col))] = `${symbol}${priceValue}`;
        } else {
          filtered[String(getColumnDisplayName(col))] = (row as any)[col];
        }
      });
      return filtered;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SKU Price Data');

    const fileName = `SKU_Price_Data_${countryName?.toUpperCase() || 'EXPORT'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };


  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  /* ================= RENDER ================= */
  return (
    <div>
      <style>{`
        div { font-family: 'Lato', sans-serif; }
        .table-wrapper {
          width: 100%; max-width: 100%; max-height: 80vh; overflow-x: auto; overflow-y: auto; margin-top: 20px;
          scrollbar-width: thin; scrollbar-color: #5EA68E #f8edcf; -webkit-overflow-scrolling: touch;
        }
        .tablec { width: 100%; border-collapse: collapse; min-width: 900px; }
        .tablec td, .tablec th { border: 1px solid #414042; padding: 8px; text-align: center;  font-size: clamp(12px, 0.729vw, 16px) !important; }
       .theadc th {
background-color: #5EA68E;
color: #f8edcf;
font-weight: bold;
}
        .tablec tbody tr:nth-child(even) { background-color: #5EA68E33; }
        .tablec tbody tr:nth-child(odd) { background-color: #ffffff; }
        .left-align { text-align: left !important; width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gross-margin-positive { color: #28a745; font-weight: bold; }
        .gross-margin-negative { color: #dc3545; font-weight: bold; }
        .gross-margin-na { color: #6c757d; font-style: italic; }
        .serial-no-col { max-width: 38px; width: 38px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      `}</style>

      <h2 className='text-2xl text-[#414042] font-bold '>
        Uploaded SKU Price Data - <span style={{ color: '#60a68e' }}> {countryName?.toUpperCase()}</span>
      </h2>
<div className="table-wrapper">
      <table className="tablec">
        <thead className="theadc">
          <tr>
           {visibleColumns.map(col => (
  <th
    key={col}
    className={col === 'product_name' ? 'left-align' : ''}
  >
    {getColumnDisplayName(col)}
  </th>
))}
            <th>Available</th>
            <th
              onClick={() => setShowAgeBreakup(p => !p)}
              style={{ cursor: 'pointer' }}
            >
              271–365 {showAgeBreakup ? '▲' : '▼'}
            </th>
             {showAgeBreakup && (
              <>
                <th>0–90</th>
                <th>91–180</th>
                <th>181–270</th>
              </>
            )}
            <th>Est. Storage</th>
           
          </tr>
        </thead>

        <tbody>
          {skuData.map((row, i) => {
            const ageing = ageingMap[row.asin ?? ''] || {};
            return (
              <tr key={i}>
                {visibleColumns.map(col => (
  <td
    key={col}
    className={col === 'product_name' ? 'left-align' : ''}
  >
    {col === 'price'
      ? `${getCurrencySymbol(row.currency)} ${row.price}`
      : col.startsWith('gross_margin_')
      ? `${calculateGrossMargin(
          row.price,
          row.currency,
          countryName,
          row.product_name
        )}%`
      : row[col]
    }
  </td>
))}

                <td>{ageing.available ?? '-'}</td>
                <td>{ageing['inv-age-271-to-365-days'] ?? '-'}</td>
                 {showAgeBreakup && (
                  <>
                    <td>{ageing['inv-age-0-to-90-days'] ?? '-'}</td>
                    <td>{ageing['inv-age-91-to-180-days'] ?? '-'}</td>
                    <td>{ageing['inv-age-181-to-270-days'] ?? '-'}</td>
                  </>
                )}
                <td>{ageing['estimated-storage-cost-next-month'] ?? '-'}</td>
               
              </tr>
            );
          })}
        </tbody>
      </table>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="styled-button" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Discard Changes' : 'Edit'}
          </button>
          &nbsp;
          {isEditing && (
            <>
              <button className="styled-button" onClick={saveChanges}>Save Changes</button>
              &nbsp;
            </>
          )}
          <button className="styled-button" onClick={() => setShowMultiuseCountry(true)}>
            Re-Upload file
          </button>
        </div>

        <div>
           <button
                    onClick={handleDownloadXLSX}
                  className="bg-white border border-[#8B8585] px-1 rounded-sm py-1"
                                              style={{
                                   boxShadow: "0px 4px 4px 0px #00000040",  
                                 }}
                                           >
                                           <IoDownload size={27} />
                  </button>
        </div>
      </div>

      {showMultiuseCountry && (
        <div
          onClick={() => setShowMultiuseCountry(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              width: '30vw',
              height: '30vh',
              overflowY: 'auto',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => setShowMultiuseCountry(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                border: 'none',
                background: 'transparent',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
            >
              &times;
            </button>

           <div
  style={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 3000, // 🔥 high z-index
  }}
>
              <SkuMultiuseCountryUpload onClose={function (): void {
                              throw new Error('Function not implemented.');
                          } } onComplete={function (): void {
                              throw new Error('Function not implemented.');
                          } } />
            </div>
          </div>
        </div>
      )}

      <Modalmsg
        show={showModal}
        message={modalMessage}
        onClose={() => setShowModal(false)}
        onCancel={() => setShowModal(false)}
      />
    </div>
    </div>
    
  );
}
