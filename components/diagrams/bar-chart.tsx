import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { BarChartData } from "@/lib/diagrams/types";
import { generateColors, formatNumber } from "@/lib/diagrams/utils";
import { BaseDiagram } from "./base-diagram";
import { useTheme } from "next-themes";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

type BarChartProps = {
  data: BarChartData;
  className?: string;
};

export const BarChart: React.FC<BarChartProps> = ({ data, className }) => {
  const { theme } = useTheme();
  const colors = generateColors(1);
  const barColor = colors[0];
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform data for Chart.js format
  const chartData = {
    labels: data.data.map((item) => item.label),
    datasets: [
      {
        label: data.title,
        data: data.data.map((item) => item.value),
        backgroundColor: barColor,
        borderColor: theme === "dark" ? "white" : "black",
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const getOptions = (_isExpanded: boolean): ChartOptions<"bar"> => ({
    maintainAspectRatio: true,
    responsive: true,
    aspectRatio: 2,
    resizeDelay: 0,
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: data.axes.y,
          font: {
            family:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            size: 14,
          },
          color: theme === "dark" ? "#f3f4f6" : "#111827",
        },
        grid: {
          color:
            theme === "dark"
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.05)",
          display: true,
          drawOnChartArea: true,
          drawTicks: true,
          lineWidth: 1,
        },
        ticks: {
          font: {
            family:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            size: 12,
          },
          color: theme === "dark" ? "#d1d5db" : "#374151",
        },
      },
      x: {
        title: {
          display: true,
          text: data.axes.x,
          font: {
            family:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            size: 14,
          },
          color: theme === "dark" ? "#f3f4f6" : "#111827",
        },
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            size: 12,
          },
          color: theme === "dark" ? "#d1d5db" : "#374151",
        },
      },
    },
    plugins: {
      legend: {
        display: false,
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
            return formatNumber(context.parsed.y);
          },
        },
      },
    },
  });

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (chartRef.current) {
          chartRef.current.resize();
        }
      });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const renderBarChartContent = (isExpanded: boolean) => (
    <div
      className={cn(
        "w-full",
        isExpanded ? "h-auto max-w-[80vw] mx-auto" : "h-auto",
      )}
      ref={!isExpanded ? containerRef : null}
    >
      <Bar
        data={chartData}
        options={getOptions(isExpanded)}
        ref={!isExpanded ? chartRef : null}
      />
    </div>
  );

  return (
    <BaseDiagram
      title={data.title}
      className={className}
      renderDiagram={() => renderBarChartContent(true)}
    >
      {renderBarChartContent(false)}
    </BaseDiagram>
  );
};
