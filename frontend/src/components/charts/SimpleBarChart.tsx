"use client";

import React, { useEffect, useRef } from "react";
import "@/lib/chartSetup";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title as ChartTitle,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartTitle);

type SimpleBarChartProps = {
  labels: string[];
  values: number[];
  colors?: string[];
  xTitle?: string;
  yTitle?: string;
};

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  labels,
  values,
  colors = [],
  xTitle,
  yTitle,
}) => {
  const chartRef = useRef<any>(null);

  const data = {
    labels,
    datasets: [
      {
        label: xTitle || "",
        data: values,
        backgroundColor: colors.length ? colors : "#2CA9E0",
        borderRadius: 4,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const v = context.raw ?? 0;
            return `${yTitle || "Value"}: ${v.toLocaleString()}`;
          },
        },
      },
      title: {
        display: false,
      },
    },

    scales: {
      x: {
        title: {
          display: Boolean(xTitle),
          text: xTitle,
        },
        ticks: {
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: Boolean(yTitle),
          text: yTitle,
        },
      },
    },
  };

  return (
    <div className="relative w-full h-full">
      <Bar ref={chartRef} data={data} options={options} />
    </div>
  );
};

export default SimpleBarChart;
