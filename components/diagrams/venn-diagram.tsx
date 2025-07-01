import React, { useEffect, useRef, useCallback } from "react";
import { VennDiagramData } from "@/lib/diagrams/types";

// Chart.js + plugin imports
import { Chart, Tooltip, Legend, Colors } from "chart.js";
import {
  VennDiagramController,
  ArcSlice,
  extractSets as extractSetsChart,
} from "chartjs-chart-venn";

import { generateColors } from "@/lib/diagrams/utils";
import { BaseDiagram } from "./base-diagram";
import { cn } from "@/lib/utils";

// Register the venn controller and helpers once
Chart.register(VennDiagramController, ArcSlice, Tooltip, Legend, Colors);

type VennDiagramProps = {
  data: VennDiagramData;
  /** Optional width for the compact view (non-expanded). Default: 700 */
  width?: number;
  /** Optional height for the compact view (non-expanded). Default: 580 */
  height?: number;
  /** Optional className to style the diagram container */
  className?: string;
};

export const VennDiagram: React.FC<VennDiagramProps> = ({
  data,
  width = 700,
  height = 580,
  className,
}) => {
  const compactCanvasRef = useRef<HTMLCanvasElement>(null);
  const compactChartRef = useRef<Chart | null>(null);
  const expandedChartRef = useRef<Chart | null>(null);

  // Callback ref for expanded canvas that initializes chart when mounted
  const expandedCanvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (canvas) {
        // Canvas is mounted, initialize chart
        if (expandedChartRef.current) {
          expandedChartRef.current.destroy();
        }
        expandedChartRef.current = new Chart(canvas, createConfig(true));
      } else {
        // Canvas is unmounting, clean up chart
        if (expandedChartRef.current) {
          expandedChartRef.current.destroy();
          expandedChartRef.current = null;
        }
      }
    },
    [data],
  );

  // helper: build Chart.js dataset using extractSets
  function buildChartData() {
    // Build sets array expected by extractSetsChart
    const setsInput: Array<{ label: string; values: string[] }> =
      data.circles.map((c) => ({ label: c.label, values: [] }));

    // map label -> index
    const labelToIndex = new Map<string, number>();
    setsInput.forEach((s, idx) => labelToIndex.set(s.label, idx));

    // Add items unique to circles
    data.circles.forEach((circle) => {
      const idx = labelToIndex.get(circle.label)!;
      setsInput[idx].values.push(...circle.items);
    });

    // Add items for intersections to each involved set
    data.intersections.forEach((intersection) => {
      const labels = intersection.circles.split(",").map((s) => s.trim());
      intersection.items.forEach((item) => {
        labels.forEach((lbl) => {
          const idx = labelToIndex.get(lbl);
          if (idx !== undefined) {
            setsInput[idx].values.push(item);
          }
        });
      });
    });

    const chartData = {
      ...extractSetsChart(setsInput),
    } as any;

    // Assign colors
    const colors = generateColors(setsInput.length, 1);
    chartData.datasets[0].backgroundColor = colors;
    // Set black borders for all circles
    chartData.datasets[0].borderColor = Array(setsInput.length).fill(
      "rgba(0, 0, 0, 1)",
    );
    chartData.datasets[0].borderWidth = 2;

    return chartData;
  }

  // Helper to create a Chart.js config with shared options
  const createConfig = (isResponsive: boolean) => {
    const padding = 10; // add padding to prevent label cutoff while allowing larger circles

    // Calculate dynamic padding based on label lengths
    // Estimate ~8px per character for label width
    const charWidth = 8;
    const labels = data.circles.map((c) => c.label);
    const maxLabelLength = Math.max(...labels.map((l) => l.length));
    const estimatedLabelWidth = maxLabelLength * charWidth;

    // Add extra padding for safety margin and circle overlap
    const horizontalPadding = Math.max(30, estimatedLabelWidth + 10);
    const verticalPadding = 15;

    return {
      type: "venn" as const,
      data: buildChartData(),
      options: {
        responsive: isResponsive,
        aspectRatio: 1.2,
        layout: {
          padding: {
            left: horizontalPadding,
            right: horizontalPadding,
            top: verticalPadding,
            bottom: verticalPadding,
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
      },
    } as const;
  };

  // Initialize / update compact chart
  useEffect(() => {
    if (!compactCanvasRef.current) return;

    if (compactChartRef.current) {
      compactChartRef.current.destroy();
    }

    compactChartRef.current = new Chart(
      compactCanvasRef.current,
      createConfig(false),
    );

    return () => {
      compactChartRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Don't initialize expanded chart on mount - it will be created when needed

  // Renders the Venn diagram; the Chart.js instance is only attached to the
  // non-expanded view to avoid redundant instances when the modal is open.
  const renderVennDiagramContent = (isExpanded: boolean) => {
    const size = Math.min(width, height);

    return (
      <div
        className={cn(
          "flex items-center justify-center w-full",
          isExpanded ? "h-full min-h-[600px]" : "h-auto",
        )}
      >
        <div
          className={cn(
            "relative",
            isExpanded ? "w-full h-full max-w-4xl max-h-[80vh]" : "",
          )}
        >
          <canvas
            ref={isExpanded ? expandedCanvasRef : compactCanvasRef}
            // Fixed intrinsic resolution for the compact view; the parent flex
            // container ensures the canvas is centered horizontally.
            {...(!isExpanded && { width: size, height: size })}
          />
        </div>
      </div>
    );
  };

  return (
    <BaseDiagram
      title={data.title}
      className={className}
      renderDiagram={() => renderVennDiagramContent(true)}
    >
      {renderVennDiagramContent(false)}
    </BaseDiagram>
  );
};
