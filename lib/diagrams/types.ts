// Types for diagram data structures

export type DiagramType =
  | "mindmap"
  | "venn"
  | "barchart"
  | "linechart"
  | "timeline"
  | "flowchart"
  | "piechart";

// Mind Map Types
export type MindMapSubtopic = {
  position: number;
  label: string;
  subtopics?: MindMapSubtopic[];
};

export type MindMapData = {
  title: string;
  central: {
    topic: string;
    subtopics: MindMapSubtopic[];
  };
};

// Venn Diagram Types
export type VennCircle = {
  position: number;
  label: string;
  items: string[];
};

export type VennIntersection = {
  circles: string;
  items: string[];
};

export type VennDiagramData = {
  title: string;
  circles: VennCircle[];
  intersections: VennIntersection[];
};

// Chart Types
export type ChartDataPoint = {
  label: string;
  value: number;
  category?: string;
};

export type BarChartData = {
  title: string;
  data: ChartDataPoint[];
  axes: {
    x: string;
    y: string;
  };
};

export type LineChartData = {
  title: string;
  datasets: Array<{
    name: string;
    data: ChartDataPoint[];
  }>;
  axes: {
    x: string;
    y: string;
  };
};

export type PieChartData = {
  title: string;
  data: ChartDataPoint[];
};

// Timeline Types
export type TimelineEvent = {
  position: number;
  date: string;
  title: string;
  description?: string;
};

export type TimelineData = {
  title: string;
  events: TimelineEvent[];
};

// Flowchart Types
export type FlowchartData = {
  title: string;
  mermaidCode: string; // We'll use the raw Mermaid.js code from XML
};

// Union type for all diagram data
export type DiagramData =
  | MindMapData
  | VennDiagramData
  | BarChartData
  | LineChartData
  | PieChartData
  | TimelineData
  | FlowchartData;
