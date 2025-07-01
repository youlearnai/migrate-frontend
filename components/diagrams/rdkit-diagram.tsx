import { RDKitDiagramResponseChunk } from "@/lib/types";
import Image from "next/image";
import React from "react";
import { BaseDiagram } from "./base-diagram";

const RdkitDiagramChunk = ({ chunk }: { chunk: RDKitDiagramResponseChunk }) => {
  if (!chunk.output || !chunk.success) {
    return null;
  }

  // Process the SVG to remove white background
  const processedSvg = chunk.output
    .replace(/fill\s*=\s*["']white["']/gi, 'fill="none"')
    .replace(/fill\s*=\s*["']#fff(fff)?["']/gi, 'fill="none"')
    .replace(
      /style\s*=\s*["'][^"']*background-color\s*:\s*white[^"']*["']/gi,
      "",
    )
    .replace(
      /style\s*=\s*["'][^"']*background-color\s*:\s*#fff(fff)?[^"']*["']/gi,
      "",
    )
    .replace(
      /<rect[^>]*fill\s*=\s*["']white["'][^>]*width\s*=\s*["']100%["'][^>]*height\s*=\s*["']100%["'][^>]*\/>/gi,
      "",
    );

  const svgDataUrl = `data:image/svg+xml;base64,${btoa(processedSvg)}`;

  const renderRDKitContent = () => (
    <div className="flex justify-center items-center w-full">
      <Image
        unoptimized
        src={svgDataUrl}
        alt="Molecular structure diagram"
        className="max-w-full h-auto brightness-[98%] contrast-[100%] dark:invert dark:brightness-[91%] dark:contrast-100"
        width={500}
        height={500}
      />
    </div>
  );

  return (
    <BaseDiagram
      title={chunk.title || "Molecular Structure"}
      renderDiagram={renderRDKitContent}
    >
      {renderRDKitContent()}
    </BaseDiagram>
  );
};

export default RdkitDiagramChunk;
