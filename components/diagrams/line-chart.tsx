import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { LineChartData } from "@/lib/diagrams/types";
import { generateColors, formatNumber } from "@/lib/diagrams/utils";
import { BaseDiagram } from "./base-diagram";
import { useTheme } from "next-themes";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

type LineChartProps = {
  data: LineChartData;
  className?: string;
};

export const LineChart: React.FC<LineChartProps> = ({ data, className }) => {
  const { theme } = useTheme();
  const colors = generateColors(data.datasets.length);
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get unique labels from the first dataset
  const labels = data.datasets[0]?.data.map((point) => point.label) || [];

  // Transform data for Chart.js format
  const chartData = {
    labels,
    datasets: data.datasets.map((dataset, index) => ({
      label: dataset.name,
      data: dataset.data.map((point) => point.value),
      borderColor: colors[index],
      backgroundColor: colors[index],
      borderWidth: 3,
      pointRadius: 5,
      pointBorderColor: theme === "dark" ? "white" : "black",
      pointBorderWidth: 3,
      pointHoverRadius: 7,
      pointHoverBorderColor: theme === "dark" ? "white" : "black",
      pointHoverBorderWidth: 3,
      tension: 0, // No curve for "monotone" equivalent
    })),
  };

  const getOptions = (_isExpanded: boolean): ChartOptions<"line"> => ({
    // Preserve aspect ratio in all modes to avoid stretching when expanded
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
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    plugins: {
      legend: {
        display: data.datasets.length > 1,
        labels: {
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
            return `${context.dataset.label}: ${formatNumber(context.parsed.y)}`;
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

  const renderLineChartContent = (isExpanded: boolean) => (
    <div
      className={cn(
        "w-full",
        isExpanded ? "h-auto max-w-[80vw] mx-auto" : "h-auto",
      )}
      ref={!isExpanded ? containerRef : null}
    >
      <Line
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
      renderDiagram={() => renderLineChartContent(true)}
    >
      {renderLineChartContent(false)}
    </BaseDiagram>
  );
};
