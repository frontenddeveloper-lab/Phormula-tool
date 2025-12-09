'use client';

import React, { use, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import FileUploadForm from '@/app/(admin)/(ui-elements)/modals/FileUploadForm';
import '@/app/(admin)/pnlforecast/[countryName]/[month]/[year]/Styles.css';
import { IoDownload } from "react-icons/io5";
import MonthYearPickerTable from '@/components/filters/MonthYearPickerTable';

// Types
interface PageParams {
  params: Promise<{
    countryName: string;
    month?: string; // optional in URL
    year?: string; // optional in URL
  }>;
}

type Row = Record<string, string | number>;

function capitalize(str: string | undefined) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export default function CurrentInventoryPage({ params }: PageParams) {
  const { countryName: countryNameRaw, month: routeMonthRaw, year: routeYearRaw } = use(params);
  const countryName = decodeURIComponent(countryNameRaw ?? '').toLowerCase();
  const routeMonth = routeMonthRaw ? decodeURIComponent(routeMonthRaw) : '';
  const routeYear = routeYearRaw ? decodeURIComponent(routeYearRaw) : '';

  const router = useRouter();

  // State
  const [month, setMonth] = useState<string>(routeMonth || '');
  const [year, setYear] = useState<string>(routeYear || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [skuData, setSkuData] = useState<Row[]>([]);
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [showUpload, setShowUpload] = useState<boolean>(false);

  const months = [
    'January',
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
    'December',
  ];
  const years = Array.from({ length: 2 }, (_, i) => new Date().getFullYear() - i);

  const currentMonthCol = `Current Month Units Sold (${capitalize(month) || 'Month'})`;

  const displayedColumns: string[] = [
    'Sno.',
    ...(countryName !== 'global' ? ['SKU'] : []),
    'Product Name',
    'Inventory at the beginning of the month',
    currentMonthCol,
    'Inventory Inwarded',
    'Others',
    'Inventory at the end of the month',
  ];

  const fetchDispatchFile = async () => {
    if (!month || !year) {
      setError('Please select both month and year.');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
    if (!token) {
      setError('Authorization token is missing');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const endpoint =
        countryName.toLowerCase() === 'global'
          ? `http://127.0.0.1:5000/current_inventory_global`
          : `http://127.0.0.1:5000/current_inventory`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: month,
          year: year,
          country: countryName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch CurrentInventory data');
      }

      const responseData = await response.json();
      const fileData: string | undefined = responseData?.data;
      if (responseData?.message) {
        if (!fileData) {
          setError(responseData.message);
          return;
        } else {
          setInfoMessage(responseData.message);
        }
      }
      if (!fileData) {
        throw new Error('Empty file received from server');
      }

      // Convert base64 -> ArrayBuffer
   const byteCharacters = atob(fileData);
const buffers: ArrayBuffer[] = [];

for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
  const slice = byteCharacters.slice(offset, offset + 1024);
  const byteNumbers = new Array(slice.length);

  for (let i = 0; i < slice.length; i++) {
    byteNumbers[i] = slice.charCodeAt(i);
  }

  const uint8 = new Uint8Array(byteNumbers);
  buffers.push(uint8.buffer as ArrayBuffer); 
}

const blob = new Blob(buffers, {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Row>(sheet, { defval: '' });

        const processedData = jsonData.map((row) => {
          const newRow: Row = {};
          for (const key in row) {
            const isAlphabetical = key.toLowerCase().includes('product') || key.toLowerCase().includes('sku');
            const value = row[key];
            newRow[key] =
              value === null || value === undefined || value === ''
                ? isAlphabetical
                  ? ''
                  : 0
                : value;
          }
          return newRow;
        });

        setSkuData(processedData);
      };
      reader.readAsArrayBuffer(blob);
    } catch (err: any) {
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fetch when month/year change
    if (month && year) fetchDispatchFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const exportToExcel = (data: Row[], countryName: string, month: string, year: string) => {
    const fileName = `CurrentInventory-${countryName}${month}${year}.xlsx`;
    if (!data || data.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <>
      <style>{`
        .tablec tbody tr:last-child {
  background-color: #ccc !important;
  color: #414042;
  text-align: center;
  font-weight: bold;
}
        .tablec td:first-child, .tablec th:first-child { text-align: center; width: 19px; }
        .tablec thead th {
  background-color: #5EA68E !important;
  color: #f8edcf !important;
  font-weight: bold !important;
  text-align: center !important;
  font-size: clamp(12px, 0.729vw, 16px) !important;
}
  .tablec tbody tr:nth-child(even) { background-color: #5EA68E33; }
        .tablec tbody tr:nth-child(odd) { background-color: #ffffff; }
        .filter-wrapper { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .filter-container { display: flex; background: white; border: 1px solid #414042; box-shadow: 0 2px 5px rgba(0,0,0,0.1); overflow: hidden; flex-wrap: wrap; }
        .inline-dropdowns { display: flex; flex-wrap: nowrap; gap: 0.5vw; align-items: center; justify-content: flex-start; margin-bottom: 3vh; }
        @media (max-width: 600px) { .inline-dropdowns { flex-direction: column; gap: 3vh; } .dropdown-table, .uploads-table { width: 90vw; } .styled-button2 { display: block; } .uploads-cell { padding: 1px; } }
        .dropdown-table, .uploads-table { border-collapse: collapse; border-radius: 0.5vw; width: auto; min-width: 80px; max-width: 100px; font-family: 'Lato', sans-serif; }
        .dropdown-header, .uploads-header { background-color: #fff; color:#5EA68E; border: 0.05vw solid #414042; }
        .dropdown-cell, .uploads-cell { padding: 1vh 0.9vw; border: 0.05vw solid #414042; text-align: center; font-size: clamp(12px, 0.729vw, 16px); }
        .dropdown-select{ font-size: clamp(12px, 0.729vw, 16px); text-align: center; width: auto; min-width: 60px; }
        .dropdown-table select, .dropdown-table option { font-size: clamp(12px, 0.729vw, 16px); border: none; font-family: 'Lato', sans-serif; }
        .dropdown-select:focus { outline: none; box-shadow: none; }
        .fetch-button { padding: 9px 16px; font-size: 0.9rem; border: none; border-radius: 6px; cursor: pointer; transition: background-color 0.2s ease; box-shadow: 0 3px 6px rgba(0,0,0,0.15); white-space: nowrap; font-family: 'Lato', sans-serif; background-color: #2c3e50; color: #f8edcf; font-weight: bold; }
        .fetch-button:hover:not(:disabled) { background-color: #1f2a36; }
        .fetch-button:disabled { background-color: #6b7280; cursor: not-allowed; opacity: 0.8; }
        .styled-button { font-family: 'Lato', sans-serif; font-size: clamp(12px, 0.729vw, 16px) !important; background-color: #2c3e50; color: #f8edcf; font-weight: bold; border: none; border-radius: 5px; cursor: pointer; text-align: center; padding: 10px 18px; margin-left: auto; }
        .alert-container { display: flex; align-items: center; background-color: #f2f2f2; border-top: 4px solid #ff5c5c; padding: 12px 16px; border-radius: 6px; font-family: 'Lato', sans-serif; width: 30%; justify-content: space-between; box-sizing: border-box; margin-top: 20px; }
        .alert-message { display: flex; align-items: center; color: #414042; font-size: 14px; }
        .alert-icon { color: #ff5c5c; font-size: 18px; margin-right: 10px; }
        .alert-button { background: none; border: none; color: #414042; font-weight: 600; cursor: pointer; font-size: 14px; text-decoration: underline; display: inline-flex; align-items: center; gap: 5px; padding: 0; white-space: nowrap; }
      `}</style>

      <h2 style={{ color: '#414042' }} className='text-2xl font-bold text-[#414042] mb-6'>
        Current Inventory Report for <span style={{ color: '#60a68e' }}>{countryName.toUpperCase()}</span>
      </h2>

      {/* <div className="inline-dropdowns">
        <table className="dropdown-table">
          <thead>
            <tr className="dropdown-header">
              <th className="dropdown-cell">Month</th>
              <th className="dropdown-cell">Year</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="dropdown-cell">
                <select className="dropdown-select" value={month} onChange={(e) => setMonth(e.target.value)}>
                  <option value="">Select</option>
                  {months.map((m) => (
                    <option key={m} value={m.toLowerCase()}>
                      {m}
                    </option>
                  ))}
                </select>
              </td>
              <td className="dropdown-cell">
                <select className="dropdown-select" value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Select</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="button-wrapper">
          <button className="fetch-button" onClick={fetchDispatchFile}>
            Get Report
          </button>
        </div>
      </div> */}
<div className='flex gap-5 items-center '>
 <MonthYearPickerTable
                month={month}
                year={year}
                yearOptions={[
                  new Date().getFullYear(),
                  new Date().getFullYear() - 1,
                ]}
                onMonthChange={(v) => setMonth(v)}
                onYearChange={(v) => setYear(v)}
                valueMode="lower"
              />
               <div className="button-wrapper">
          <button className="fetch-button" onClick={fetchDispatchFile}>
            Get Report
          </button>
        </div>

</div>
     
      {loading ? (
  <div style={{ padding: '48px', textAlign: 'center' }}>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
) : error ? (
  <>
    <div className="alert-container">
      <div className="alert-message">
        <i className="fa-solid fa-circle-exclamation alert-icon"></i>
        <span>{error}</span>
      </div>
      <button className="alert-button" onClick={() => setShowUpload(true)}>
        Upload Now <i className="fa-solid fa-chevron-right"></i>
      </button>
    </div>

    <Modal
      isOpen={showUpload}
      onClose={() => setShowUpload(false)}
      showCloseButton
      className="max-w-4xl w-full mx-auto p-0"
    >
      <FileUploadForm />
    </Modal>
  </>
) : (
  <>
    {skuData.length > 0 ? (
      <>
      <div className="overflow-x-auto pt-10">
<table className="tablec">
          <thead className="bg-[#5EA68E] !text-[#f8edcf]">
            <tr>
              {displayedColumns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {skuData.map((row, index) => (
              <tr key={index}>
                {displayedColumns.map((col) => (
                  <td key={col}>
                    {col === 'Sno.'
                      ? index === skuData.length - 1
                        ? ''
                        : index + 1
                      : typeof row[col] === 'number'
                      ? (row[col] as number).toLocaleString()
                      : (row[col] as string)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

      </div>
      <div className='flex justify-end'>
 <button
                             onClick={() => exportToExcel(skuData, countryName, month, year)}
                          className="bg-white border border-[#8B8585] px-1 rounded-sm py-1 mt-2"
                                                      style={{
                                           boxShadow: "0px 4px 4px 0px #00000040",  
                                         }}
                                                   >
                                                   <IoDownload size={27} />
                          </button>
      </div>
        
        
      </>
    ) : (
      <p>Select Month and Year to see CurrentInventory!</p>
    )}
  </>
)}
    </>
  );
}
