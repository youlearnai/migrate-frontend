import {
  getWhiteboardTypeFromXML,
  parseDiagramXML,
} from "@/lib/diagrams/parser";
import { DiagramType } from "@/lib/diagrams/types";
import React from "react";
import { VennDiagram } from "../diagrams/venn-diagram";
import { BarChart } from "../diagrams/bar-chart";
import { LineChart } from "../diagrams/line-chart";
import { PieChart } from "../diagrams/pie-chart";
import { Timeline } from "../diagrams/time-line";
import { Flowchart } from "../diagrams/flow-chart";
import { MindMap } from "../diagrams/mind-map";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { useTranslation } from "react-i18next";

const ErrorComponent = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl">{t("errorModal.errors.500.title")}</h1>
      <p className="text-sm text-gray-500">{t("errorMessages.errorMessage")}</p>
    </div>
  );
};

const WhiteBoardDiagram = ({ data }: { data: string }) => {
  const type = getWhiteboardTypeFromXML(data);
  if (!type) return null;
  const parsedData = parseDiagramXML(data, type);

  const DIAGRAM_COMPONENTS: Record<DiagramType, React.ComponentType<any>> = {
    mindmap: MindMap,
    venn: VennDiagram,
    barchart: BarChart,
    linechart: LineChart,
    piechart: PieChart,
    timeline: Timeline,
    flowchart: Flowchart,
  };

  const DiagramComponent = DIAGRAM_COMPONENTS[type];

  return (
    <ErrorBoundary errorComponent={ErrorComponent}>
      <DiagramComponent data={parsedData} />
    </ErrorBoundary>
  );
};

export default WhiteBoardDiagram;
