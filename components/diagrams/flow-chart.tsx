import React, { useEffect, useState, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { FlowchartData } from "@/lib/diagrams/types";
import { BaseDiagram } from "./base-diagram";
import { generateUniqueId } from "@/lib/diagrams/utils";

type FlowchartProps = {
  data: FlowchartData;
  className?: string;
};

// We'll use dynamic import to avoid SSR issues
let mermaidAPI: any = null;

export const Flowchart: React.FC<FlowchartProps> = ({ data, className }) => {
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMermaid = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamic import of mermaid
        if (!mermaidAPI) {
          const mermaid = await import("mermaid");
          mermaidAPI = mermaid.default;

          // Initialize mermaid with simpler configuration
          mermaidAPI.initialize({
            startOnLoad: false,
            theme: "default",
            flowchart: {
              useMaxWidth: false,
              htmlLabels: true,
              curve: "linear",
              nodeSpacing: 100,
              rankSpacing: 80,
              padding: 20,
            },
            securityLevel: "strict",
          });
        }

        if (!data.mermaidCode) {
          setError("No diagram code provided");
          return;
        }

        // Clean the mermaid code
        let cleanCode = data.mermaidCode
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&#39;/g, "'")
          .trim();

        // Generate unique ID
        const id = generateUniqueId("mermaid");

        try {
          // First, validate the syntax
          await mermaidAPI.parse(cleanCode);

          // If validation passes, render
          const { svg } = await mermaidAPI.render(id, cleanCode);

          // Process the SVG to ensure proper sizing
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svg, "image/svg+xml");
          const svgElement = svgDoc.querySelector("svg");

          if (svgElement) {
            // Set minimum size but allow it to grow
            svgElement.setAttribute(
              "style",
              "min-width: 800px; min-height: 400px; width: auto; height: auto; max-width: none;",
            );
          }

          setSvgContent(new XMLSerializer().serializeToString(svgDoc));
          setIsLoading(false);
        } catch (parseError: any) {
          console.error("Mermaid parse error:", parseError);

          // Try a fallback rendering with a simple wrapper
          try {
            if (
              !cleanCode.startsWith("graph") &&
              !cleanCode.startsWith("flowchart")
            ) {
              cleanCode = `graph TD\n${cleanCode}`;
            }

            const { svg } = await mermaidAPI.render(id + "-retry", cleanCode);

            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svg, "image/svg+xml");
            const svgElement = svgDoc.querySelector("svg");

            if (svgElement) {
              svgElement.setAttribute(
                "style",
                "min-width: 800px; min-height: 400px; width: auto; height: auto; max-width: none;",
              );
            }

            setSvgContent(new XMLSerializer().serializeToString(svgDoc));
            setIsLoading(false);
          } catch (retryError) {
            throw parseError;
          }
        }
      } catch (err: any) {
        console.error("Failed to render Mermaid diagram:", err);
        setError(err?.message || "Failed to render flowchart");
        setIsLoading(false);
      }
    };

    renderMermaid();
  }, [data.mermaidCode]);

  // Ensure SVG elements don't capture pointer events
  useEffect(() => {
    if (svgRef.current && svgContent) {
      const svg = svgRef.current.querySelector("svg");
      if (svg) {
        // Make sure the SVG and its children don't block pointer events
        svg.style.pointerEvents = "auto";
        // But allow links to be clickable
        const links = svg.querySelectorAll("a");
        links.forEach((link) => {
          link.style.pointerEvents = "auto";
        });
      }
    }
  }, [svgContent]);

  const renderFlowchartContent = () => (
    <div className="relative w-full h-[800px] overflow-hidden rounded-lg">
      <TransformWrapper
        initialScale={1}
        minScale={0.25}
        maxScale={4}
        wheel={{
          step: 0.1,
          touchPadDisabled: false, // Explicitly enable touchpad support
        }}
        panning={{
          disabled: false,
          velocityDisabled: false,
        }}
        doubleClick={{ disabled: true }}
        pinch={{ disabled: false }}
        limitToBounds={true} // Restrict dragging to keep content visible
      >
        <TransformComponent
          wrapperClass="!w-full !h-full"
          contentClass="w-full h-full flex items-center justify-center"
        >
          <div
            ref={svgRef}
            className="mermaid-container p-8 inline-block"
            dangerouslySetInnerHTML={
              svgContent ? { __html: svgContent } : undefined
            }
            style={{
              pointerEvents: "auto",
            }}
          />
        </TransformComponent>
      </TransformWrapper>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-sm text-neutral-500">Loading flowchart...</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center p-4 max-w-lg">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <details className="text-left">
              <summary className="cursor-pointer text-xs text-neutral-600">
                Show diagram code
              </summary>
              <pre className="mt-2 text-xs bg-neutral-100 dark:bg-neutral-800 p-3 rounded overflow-auto whitespace-pre-wrap">
                {data.mermaidCode}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <BaseDiagram
      title={data.title}
      className={className}
      renderDiagram={renderFlowchartContent}
    >
      {renderFlowchartContent()}
    </BaseDiagram>
  );
};
