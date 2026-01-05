export type ProfitChartExportApi = {
  getChartBase64: () => string | null;
  title: string;         
  currencySymbol: string;
};



export type SkuExportPayload = {
  brandName?: string;
  companyName?: string;
  currencySymbol: string;
  title: string;
  periodLabel: string;
  range: string;
  tableData: any[];
  totals: any;
  countryName?: string; 
};
