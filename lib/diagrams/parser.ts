import {
  DiagramType,
  DiagramData,
  MindMapData,
  MindMapSubtopic,
  VennDiagramData,
  BarChartData,
  LineChartData,
  PieChartData,
  TimelineData,
  FlowchartData,
} from "./types";

export class DiagramParseError extends Error {
  constructor(
    message: string,
    public diagramType: DiagramType,
  ) {
    super(message);
    this.name = "DiagramParseError";
  }
}

// Main parser function
export function parseDiagramXML(
  xmlString: string,
  diagramType: DiagramType,
): DiagramData {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "text/xml");

    // Check for parsing errors
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      throw new DiagramParseError(
        `XML parsing failed: ${parserError.textContent}`,
        diagramType,
      );
    }

    switch (diagramType) {
      case "mindmap":
        return parseMindMap(doc);
      case "venn":
        return parseVennDiagram(doc);
      case "barchart":
        return parseBarChart(doc);
      case "linechart":
        return parseLineChart(doc);
      case "piechart":
        return parsePieChart(doc);
      case "timeline":
        return parseTimeline(doc);
      case "flowchart":
        return parseFlowchart(doc);
      default:
        throw new DiagramParseError(
          `Unsupported diagram type: ${diagramType}`,
          diagramType,
        );
    }
  } catch (error) {
    if (error instanceof DiagramParseError) {
      throw error;
    }
    throw new DiagramParseError(
      `Failed to parse ${diagramType}: ${error}`,
      diagramType,
    );
  }
}

// Mind Map Parser
function parseMindMap(doc: Document): MindMapData {
  const whiteboard = doc.querySelector("whiteboard");
  if (!whiteboard || whiteboard.getAttribute("type") !== "mindmap") {
    throw new Error("Invalid mindmap XML structure");
  }

  const title = whiteboard.getAttribute("title") || "Mind Map";
  const central = whiteboard.querySelector("central");

  if (!central) {
    throw new Error("Missing central element in mindmap");
  }

  const centralTopic = central.getAttribute("topic") || "";
  const subtopics = parseSubtopics(central);

  return {
    title,
    central: {
      topic: centralTopic,
      subtopics,
    },
  };
}

function parseSubtopics(parent: Element): MindMapSubtopic[] {
  const subtopics: MindMapSubtopic[] = [];
  const subtopicElements = parent.querySelectorAll(":scope > subtopic");

  subtopicElements.forEach((element) => {
    const position = parseInt(element.getAttribute("position") || "0", 10);
    const label = element.getAttribute("label") || "";
    const childSubtopics = parseSubtopics(element);

    subtopics.push({
      position,
      label,
      ...(childSubtopics.length > 0 && { subtopics: childSubtopics }),
    });
  });

  return subtopics.sort((a, b) => a.position - b.position);
}

// Venn Diagram Parser
function parseVennDiagram(doc: Document): VennDiagramData {
  const whiteboard = doc.querySelector("whiteboard");
  if (!whiteboard || whiteboard.getAttribute("type") !== "venn") {
    throw new Error("Invalid venn diagram XML structure");
  }

  const title = whiteboard.getAttribute("title") || "Venn Diagram";
  const circles: VennDiagramData["circles"] = [];
  const intersections: VennDiagramData["intersections"] = [];

  // Map circle id -> label (helps translate intersection references)
  const idToLabel = new Map<string, string>();

  // Parse circles
  whiteboard.querySelectorAll("circle").forEach((circle, index) => {
    const position = parseInt(
      circle.getAttribute("position") || String(index),
      10,
    );

    // The XML spec expects an "id" attribute used by intersections; fall back to label if missing
    const idAttr = circle.getAttribute("id")?.trim();
    const labelAttr = circle.getAttribute("label")?.trim();

    // Prefer explicit label, otherwise default to the id or a generated one
    const label = labelAttr || idAttr || `Circle ${index + 1}`;

    // Register mapping so that intersections referencing the id can be translated to the label
    if (idAttr) {
      idToLabel.set(idAttr, label);
    }

    const items: string[] = [];
    circle.querySelectorAll("item").forEach((item) => {
      const text = item.textContent?.trim();
      if (text) items.push(text);
    });

    circles.push({ position, label, items });
  });

  // Parse intersections
  whiteboard.querySelectorAll("intersection").forEach((intersection) => {
    const circlesAttrRaw = intersection.getAttribute("circles") || "";

    // Convert comma-separated ids/labels into their corresponding labels using the map
    const convertedLabels: string[] = circlesAttrRaw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((identifier) => idToLabel.get(identifier) || identifier);

    if (convertedLabels.length === 0) {
      // Skip invalid intersection definitions
      return;
    }

    const circlesAttr = convertedLabels.join(",");

    const label = intersection.getAttribute("label")?.trim() || "";
    const items: string[] = [];

    // Include provided label as an item (acts as description/count placeholder)
    if (label) {
      items.push(label);
    }

    // Also support explicit <item> children for backward compatibility
    intersection.querySelectorAll("item").forEach((item) => {
      const text = item.textContent?.trim();
      if (text) items.push(text);
    });

    intersections.push({ circles: circlesAttr, items });
  });

  return { title, circles, intersections };
}

// Bar Chart Parser
function parseBarChart(doc: Document): BarChartData {
  const whiteboard = doc.querySelector("whiteboard");
  if (!whiteboard || whiteboard.getAttribute("type") !== "barchart") {
    throw new Error("Invalid barchart XML structure");
  }

  const title = whiteboard.getAttribute("title") || "Bar Chart";
  const data: BarChartData["data"] = [];

  // Parse labels
  const labels: string[] = [];
  whiteboard.querySelectorAll("labels > label").forEach((label) => {
    labels.push(label.textContent || "");
  });

  // Parse dataset
  const dataset = whiteboard.querySelector("dataset");
  const datasetLabel = dataset?.getAttribute("label") || "Data";
  const dataString = dataset?.querySelector("data")?.textContent || "";
  const values = dataString.split(",").map((v) => parseFloat(v.trim()));

  // Combine labels and values
  labels.forEach((label, index) => {
    data.push({
      label,
      value: values[index] || 0,
    });
  });

  // Try to parse axes if provided, otherwise use defaults
  const xAxis = whiteboard.querySelector("x-axis");
  const yAxis = whiteboard.querySelector("y-axis");
  const axes = {
    x: xAxis?.getAttribute("label") || "X Axis",
    y: yAxis?.getAttribute("label") || datasetLabel,
  };

  return { title, data, axes };
}

// Line Chart Parser
function parseLineChart(doc: Document): LineChartData {
  const whiteboard = doc.querySelector("whiteboard");
  if (!whiteboard || whiteboard.getAttribute("type") !== "linechart") {
    throw new Error("Invalid linechart XML structure");
  }

  const title = whiteboard.getAttribute("title") || "Line Chart";
  const datasets: LineChartData["datasets"] = [];

  // Parse labels
  const labels: string[] = [];
  whiteboard.querySelectorAll("labels > label").forEach((label) => {
    labels.push(label.textContent || "");
  });

  // Parse datasets
  whiteboard.querySelectorAll("dataset").forEach((dataset) => {
    const name = dataset.getAttribute("label") || "";
    const dataString = dataset.querySelector("data")?.textContent || "";
    const values = dataString.split(",").map((v) => parseFloat(v.trim()));

    const data: LineChartData["datasets"][0]["data"] = [];
    labels.forEach((label, index) => {
      data.push({
        label,
        value: values[index] || 0,
      });
    });

    datasets.push({ name, data });
  });

  // Try to parse axes if provided, otherwise use defaults
  const xAxis = whiteboard.querySelector("x-axis");
  const yAxis = whiteboard.querySelector("y-axis");
  const axes = {
    x: xAxis?.getAttribute("label") || "X Axis",
    y: yAxis?.getAttribute("label") || "Y Axis",
  };

  return { title, datasets, axes };
}

// Pie Chart Parser
function parsePieChart(doc: Document): PieChartData {
  const whiteboard = doc.querySelector("whiteboard");
  if (!whiteboard || whiteboard.getAttribute("type") !== "piechart") {
    throw new Error("Invalid piechart XML structure");
  }

  const title = whiteboard.getAttribute("title") || "Pie Chart";
  const data: PieChartData["data"] = [];

  // Parse labels
  const labels: string[] = [];
  whiteboard.querySelectorAll("labels > label").forEach((label) => {
    labels.push(label.textContent || "");
  });

  // Parse dataset
  const dataset = whiteboard.querySelector("dataset");
  const dataString = dataset?.querySelector("data")?.textContent || "";
  const values = dataString.split(",").map((v) => parseFloat(v.trim()));

  // Combine labels and values
  labels.forEach((label, index) => {
    data.push({
      label,
      value: values[index] || 0,
    });
  });

  return { title, data };
}

// Timeline Parser
function parseTimeline(doc: Document): TimelineData {
  const whiteboard = doc.querySelector("whiteboard");
  if (!whiteboard || whiteboard.getAttribute("type") !== "timeline") {
    throw new Error("Invalid timeline XML structure");
  }

  const title = whiteboard.getAttribute("title") || "Timeline";
  const events: TimelineData["events"] = [];

  // Parse events
  whiteboard.querySelectorAll("event").forEach((event, index) => {
    // Position can be from attribute or just use index
    const position = parseInt(
      event.getAttribute("position") || String(index),
      10,
    );

    // Date is an attribute
    const date = event.getAttribute("date") || "";

    // Title and description are nested elements
    const titleElement = event.querySelector("title");
    const eventTitle = titleElement?.textContent || "";

    const descriptionElement = event.querySelector("description");
    const description = descriptionElement?.textContent || undefined;

    events.push({
      position,
      date,
      title: eventTitle,
      ...(description && { description }),
    });
  });

  return { title, events: events.sort((a, b) => a.position - b.position) };
}

// Flowchart Parser
function parseFlowchart(doc: Document): FlowchartData {
  const whiteboard = doc.querySelector("whiteboard");
  if (!whiteboard || whiteboard.getAttribute("type") !== "flowchart") {
    throw new Error("Invalid flowchart XML structure");
  }

  const title = whiteboard.getAttribute("title") || "Flowchart";
  const mermaid = whiteboard.querySelector("mermaid");

  if (!mermaid) {
    throw new Error("Missing mermaid element in flowchart");
  }

  const mermaidCode = mermaid.textContent || "";

  return { title, mermaidCode };
}

export function getWhiteboardTypeFromXML(
  xmlString: string,
): DiagramType | null {
  if (!xmlString) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "text/xml");
    const whiteboard = doc.querySelector("whiteboard");
    return whiteboard?.getAttribute("type") as DiagramType | null;
  } catch {
    return null;
  }
}
