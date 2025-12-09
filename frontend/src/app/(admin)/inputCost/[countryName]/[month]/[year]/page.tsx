'use client';

import React, { use, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import '@/app/(admin)/pnlforecast/[countryName]/[month]/[year]/Styles.css';
import Modalmsg from '@/components/ui/modal/Modalmsg';
import SkuMultiuseCountryUpload from '@/components/ui/modal/SkuMultiCountryUpload';
import { IoDownload } from "react-icons/io5";

// Types
interface Params {
  params: Promise<{
    countryName: string;
    month: string; // expected as slug (e.g., \"november\" or \"11\")
    year: string;  // e.g., \"2025\"
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
  currency?: string; // e.g., 'GBP', 'USD', ...
  [key: string]: any;
}

const getCurrencySymbol = (country: string | undefined): string => {
  switch (country) {
    case 'GBP':
      return '£';
    case 'INR':
      return '₹';
    case 'USD':
      return '$';
    case 'europe':
    case 'eu':
      return '€';
    case 'CAD':
    case 'global':
      return '$';
    default:
      return '$';
  }
};

function getCurrencyForCountry(country: string): string {
  switch (country.toLowerCase()) {
    case 'uk':
      return 'GBP';
    case 'us':
      return 'USD';
    case 'canada':
      return 'CAD';
    case 'eu':
    case 'europe':
      return 'EUR';
    default:
      return 'USD';
  }
}

export default function InputCostPage({ params }: Params) {
  const { countryName: countryNameRaw, month: monthRaw, year: yearRaw } = use(params);
  const countryName = decodeURIComponent(countryNameRaw ?? '').toLowerCase();
  const monthParam = decodeURIComponent(monthRaw ?? '');
  const yearParam = decodeURIComponent(yearRaw ?? '');

  // State
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

  // Utils
  const isColumnEmpty = (data: SkuRow[], columnName: string) => {
    return data.every((row) => {
      const value = row[columnName];
      return (
        value === null ||
        value === undefined ||
        value === '' ||
        (typeof value === 'string' && value.trim() === '')
      );
    });
  };

  const getVisibleColumns = (data: SkuRow[]) => {
    if (!data || data.length === 0) return [] as string[];

    const baseColumns: string[] = ['s_no', 'product_name'];
    let skuColumns: string[] = [];
    let grossMarginColumns: string[] = [];

    if (countryName === 'global') {
      const potentialSkuColumns = ['sku_uk', 'sku_us', 'sku_canada'];
      skuColumns = potentialSkuColumns.filter((col) => !isColumnEmpty(data, col));
      skuColumns.forEach((skuCol) => {
        const c = skuCol.replace('sku_', '');
        grossMarginColumns.push(`gross_margin_${c}`);
      });
    } else {
      const skuColumn = `sku_${countryName}`;
      if (!isColumnEmpty(data, skuColumn)) {
        skuColumns.push(skuColumn);
      }
      grossMarginColumns.push(`gross_margin_${countryName}`);
    }

    const otherColumns = ['asin', 'product_barcode', 'price'];
    const visibleOtherColumns = otherColumns.filter((col) => !isColumnEmpty(data, col));

    return [...baseColumns, ...skuColumns, ...visibleOtherColumns, ...grossMarginColumns];
  };

  const getColumnDisplayName = (column: string): React.ReactNode => {
    switch (column) {
      case 's_no':
        return 'Sno.';
      case 'product_name':
        return 'Product Name';
      case 'sku_uk':
        return 'SKU (UK)';
      case 'sku_us':
        return 'SKU (US)';
      case 'sku_canada':
        return 'SKU (CANADA)';
      case 'asin':
        return 'ASIN';
      case 'product_barcode':
        return 'Product Barcode';
      case 'price':
        return 'Landing Cost';
      default:
        if (column.startsWith('sku_')) {
          const c = column.replace('sku_', '').toUpperCase();
          return `SKU (${c})`;
        }
        if (column.startsWith('gross_margin_')) {
          const c = column.replace('gross_margin_', '').toUpperCase();
          return (
            <>
              {`Gross Margin (%) ${c} `}
              <span
                style={{ position: 'relative', cursor: 'pointer' }}
                title="*Gross Margin calculation is based on previous month’s ASP"
              >
                &nbsp;<i className="fa-solid fa-circle-info" style={{ color: '#f8edcf' }}></i>
              </span>
            </>
          );
        }
        return column.charAt(0).toUpperCase() + column.slice(1);
    }
  };

  const getCurrencyRate = (currency: string | undefined, country: string) => {
    if (!currency || !currencyRates || Object.keys(currencyRates).length === 0) return 1;
    const possibleKeys = [
      `${currency}_${country}`,
      `${currency.toLowerCase()}_${country.toLowerCase()}`,
      `${currency.toUpperCase()}_${country.toLowerCase()}`,
      currency,
      currency.toLowerCase(),
      currency.toUpperCase(),
    ];
    for (const key of possibleKeys) {
      if (currencyRates[key] !== undefined) return currencyRates[key];
    }
    return 1;
  };

  const getAspForProduct = (productName: string, targetCountry: string | null = null) => {
    if (!aspData || Object.keys(aspData).length === 0) return null;

    if (targetCountry && countryName === 'global') {
      const countrySpecificKey = `${productName}_${targetCountry}`;
      if (aspData[countrySpecificKey] !== undefined) return aspData[countrySpecificKey];
      for (const key in aspData) {
        if (key.includes(`_${targetCountry}`) && key.includes(productName)) return aspData[key];
      }
    }

    if (countryName === 'global') {
      if (aspData[productName] !== undefined) return aspData[productName];
      for (const key in aspData) {
        if (key.includes(productName) || productName.includes(key)) return aspData[key];
      }
    } else {
      return aspData[productName] ?? null;
    }

    return null;
  };

  const calculateGrossMargin = (
    price: number | undefined,
    sourceCurrency: string | undefined,
    targetCountry: string,
    productName: string
  ): string => {
    try {
      const asp = getAspForProduct(productName, targetCountry);
      if (!price || !asp || asp === 0) return 'N/A';

      let convertedPrice: number;
      if (countryName === 'global') {
        const targetCurrency = getCurrencyForCountry(targetCountry);
        if (sourceCurrency === targetCurrency) {
          convertedPrice = price;
        } else {
          const sourceToUsdRate = getCurrencyRate(sourceCurrency, 'global') || 1;
          const usdToTargetRate = getCurrencyRate(targetCurrency, targetCountry) || 1;
          convertedPrice = price * sourceToUsdRate * usdToTargetRate;
        }
      } else {
        const currencyRate = getCurrencyRate(sourceCurrency, targetCountry);
        convertedPrice = price * currencyRate;
      }

      const grossMargin = ((asp - convertedPrice) / asp) * 100;
      return grossMargin.toFixed(2);
    } catch (e) {
      return 'N/A';
    }
  };

  // Data fetchers
  const fetchCurrencyRates = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
    if (!token) return;

    try {
      const response = await fetch('http://127.0.0.1:5000/currency-rates', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const rates: Array<{ user_currency: string; country: string; conversion_rate: number }> =
          await response.json();
        const map: Record<string, number> = {};
        rates.forEach((rate) => {
          const keys = [
            `${rate.user_currency}_${rate.country}`,
            `${rate.user_currency.toLowerCase()}_${rate.country.toLowerCase()}`,
            `${rate.user_currency.toUpperCase()}_${rate.country.toLowerCase()}`,
            rate.user_currency,
            rate.user_currency.toLowerCase(),
            rate.user_currency.toUpperCase(),
          ];
          keys.forEach((k) => (map[k] = rate.conversion_rate));
        });
        setCurrencyRates(map);
      }
    } catch (e) {
      console.error('Error fetching currency rates', e);
    }
  };

  const fetchAspData = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
    if (!token) return;

    const monthNames = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ];

    const normalizedMonth = (() => {
      const m = monthParam.toLowerCase();
      if (/^\d+$/.test(m)) {
        const idx = Math.min(Math.max(parseInt(m, 10) - 1, 0), 11);
        return monthNames[idx];
      }
      return monthNames.includes(m) ? m : monthNames[new Date().getMonth()];
    })();

    const normalizedYear = (() => {
      const y = parseInt(yearParam, 10);
      if (!isNaN(y) && y > 2000 && y < 2100) return y;
      return new Date().getFullYear();
    })();

    try {
      // Try the requested month/year first, then fall back 11 months
      let currentMonthIndex = monthNames.indexOf(normalizedMonth);
      let currentYear = normalizedYear;

      for (let attempt = 0; attempt < 12; attempt++) {
        const monthName = monthNames[currentMonthIndex];
        try {
          const response = await fetch(
            `http://127.0.0.1:5000/asp-data?country=${countryName}&month=${monthName}&year=${currentYear}`,
            {
              method: 'GET',
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.ok) {
            const aspArray: Array<{ product_name: string; asp: number; source_country?: string }> =
              await response.json();
            const map: Record<string, number> = {};
            aspArray.forEach((item) => {
              map[item.product_name] = item.asp;
            });
            setAspData(map);
            return;
          }
        } catch (e) {
          // continue
        }
        currentMonthIndex--;
        if (currentMonthIndex < 0) {
          currentMonthIndex = 11;
          currentYear--;
        }
      }
      setAspData({});
    } catch (e) {
      console.error('Error in fetchAspData', e);
      setAspData({});
    }
  };

  // Effects
  useEffect(() => {
    const fetchSkuData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
      if (!token) {
        setError('Authorization token is missing');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('http://127.0.0.1:5000/skuprice', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch data');
        const data: SkuRow[] = await response.json();
        const sorted = [...data].sort((a, b) => (a.s_no ?? 0) - (b.s_no ?? 0));
        setSkuData(sorted);
        const columns = getVisibleColumns(sorted);
        setVisibleColumns(columns);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSkuData();
    fetchCurrencyRates();
    fetchAspData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryName, monthParam, yearParam]);

  // Handlers
  const handlePriceChange = (productName: string, value: string) => {
    setEditedPrices((prev) => ({ ...prev, [productName]: parseFloat(value) }));
  };

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

      {skuData.length > 0 ? (
        <div className="table-wrapper">
          <table className='tablec'>
            <thead className='theadc'>
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column}
                    style={column === 's_no' ? { width: '20px', textAlign: 'center' } : {}}
                    className={column === 'product_name' ? 'left-align' : ''}
                  >
                    {getColumnDisplayName(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skuData.map((row, index) => (
                <tr key={index}>
                  {visibleColumns.map((column) => (
                    <td key={column} className={column === 'product_name' ? 'left-align' : ''}>
                      {column === 'price' ? (
                        isEditing ? (
                          <>
                            {getCurrencySymbol(row.currency)}&nbsp;
                            <input
                              type="number"
                              value={
                                editedPrices[row.product_name] !== undefined
                                  ? editedPrices[row.product_name]
                                  : row.price ?? ''
                              }
                              onChange={(e) => handlePriceChange(row.product_name, e.target.value)}
                            />
                          </>
                        ) : (
                          <>
                            {getCurrencySymbol(row.currency)}&nbsp;&nbsp;{row.price}
                          </>
                        )
                      ) : column.startsWith('gross_margin_') ? (
                        renderGrossMarginCell(row, column)
                      ) : (
                        (row as any)[column]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No data available</p>
      )}

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
  );
}
