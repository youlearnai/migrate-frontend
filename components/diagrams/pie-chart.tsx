import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { PieChartData } from "@/lib/diagrams/types";
import { generateColors, formatNumber } from "@/lib/diagrams/utils";
import { BaseDiagram } from "./base-diagram";
import { useTheme } from "next-themes";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

type PieChartProps = {
  data: PieChartData;
  className?: string;
};

export const PieChart: React.FC<PieChartProps> = ({ data, className }) => {
  const { theme } = useTheme();
  const colors = generateColors(data.data.length);

  // Transform data for Chart.js format
  const chartData = {
    labels: data.data.map((item) => item.label),
    datasets: [
      {
        data: data.data.map((item) => item.value),
        backgroundColor: colors,
        borderColor: theme === "dark" ? "white" : "black",
        borderWidth: 2,
      },
    ],
  };

  // Chart.js options
  const options: ChartOptions<"pie"> = {
    maintainAspectRatio: true,
    responsive: true,
    aspectRatio: 1,
    layout: {
      padding: 0,
    },
    plugins: {
      legend: {
        position: "bottom",
        align: "center",
        labels: {
          padding: 20,
          boxWidth: 15,
          font: {
            family:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            size: 13,
          },
          color: theme === "dark" ? "#d1d5db" : "#374151",
        },
      },
      tooltip: {
        backgroundColor:
          theme === "dark"
            ? "rgba(17, 24, 39, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
        titleColor: theme === "dark" ? "#f3f4f6" : "#111827",
        bodyColor: theme === "dark" ? "#d1d5db" : "#374151",
        borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
        borderWidth: 1,
        cornerRadius: 6,
        titleFont: {
          family:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          size: 13,
        },
        bodyFont: {
          family:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          size: 13,
        },
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed;
            const total = context.dataset.data.reduce(
              (sum, val) => sum + val,
              0,
            );
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formatNumber(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  const renderPieChartContent = () => (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <div className="relative w-full max-w-md mx-auto">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );

  return (
    <BaseDiagram
      title={data.title}
      className={className}
      renderDiagram={renderPieChartContent}
    >
      {renderPieChartContent()}
    </BaseDiagram>
  );
};
