"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { MindMapData, MindMapSubtopic } from "@/lib/diagrams/types";
import { BaseDiagram } from "./base-diagram";
import { cn } from "@/lib/utils";

type MindMapProps = {
  data: MindMapData;
  className?: string;
};

type NodePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TransformedNode = {
  id: string;
  text: string;
  level: number;
  parentId?: string;
  children: TransformedNode[];
};

// Color configuration for different levels
const levelColors = {
  0: { bg: "#673AB7", text: "#ffffff", border: "rgba(255, 255, 255, 0.9)" },
  1: {
    bg: "rgba(33, 150, 243, 0.95)",
    text: "#ffffff",
    border: "rgba(255, 255, 255, 0.8)",
  },
  2: {
    bg: "rgba(0, 150, 136, 0.9)",
    text: "#ffffff",
    border: "rgba(255, 255, 255, 0.7)",
  },
  3: {
    bg: "rgba(76, 175, 80, 0.85)",
    text: "#ffffff",
    border: "rgba(255, 255, 255, 0.6)",
  },
  4: {
    bg: "rgba(77, 208, 225, 0.8)",
    text: "#333333",
    border: "rgba(51, 51, 51, 0.6)",
  },
};

// Connector gradient colors
const connectorGradients = {
  1: { start: "rgba(103, 58, 183, 0.9)", end: "rgba(33, 150, 243, 0.9)" },
  2: { start: "rgba(33, 150, 243, 0.9)", end: "rgba(0, 150, 136, 0.9)" },
  3: { start: "rgba(0, 150, 136, 0.9)", end: "rgba(76, 175, 80, 0.85)" },
  4: { start: "rgba(76, 175, 80, 0.85)", end: "rgba(77, 208, 225, 0.8)" },
};

// Individual node component
const MindMapNode: React.FC<{
  node: TransformedNode;
  isExpanded: boolean;
  onToggle: () => void;
  onPositionUpdate: (id: string, elem: HTMLDivElement) => void;
}> = ({ node, isExpanded, onToggle, onPositionUpdate }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const hasChildren = node.children.length > 0;
  const colors =
    levelColors[Math.min(node.level, 4) as keyof typeof levelColors];

  useEffect(() => {
    if (nodeRef.current) {
      onPositionUpdate(node.id, nodeRef.current);
    }
  }, [node.id, onPositionUpdate]);

  return (
    <div
      ref={nodeRef}
      className={cn(
        "node-content inline-flex items-center justify-center",
        "px-5 py-2.5 rounded-full cursor-pointer whitespace-nowrap",
        "min-w-[150px] h-[38px] relative z-10 text-center text-sm font-medium",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        hasChildren && "pr-9",
        node.level === 0 && "font-semibold",
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        boxShadow:
          node.level === 0
            ? "0 6px 18px rgba(103, 58, 183, 0.2), 0 2px 4px rgba(103, 58, 183, 0.1)"
            : `0 ${4 - Math.min(node.level, 3)}px ${12 - Math.min(node.level, 3) * 2}px ${colors.bg.replace(/[\d.]+\)$/, "0.15)")}`,
      }}
      onClick={hasChildren ? onToggle : undefined}
    >
      {node.text}
      {hasChildren && (
        <span
          className={cn(
            "absolute right-3.5 top-1/2 w-2 h-2 border-r-2 border-b-2",
            "transition-transform duration-300 origin-center",
            isExpanded
              ? "rotate-[135deg] -translate-y-1/2"
              : "-rotate-45 -translate-y-1/2",
          )}
          style={{ borderColor: colors.border }}
        />
      )}
    </div>
  );
};

// Node tree component
const NodeTree: React.FC<{
  node: TransformedNode;
  expandedNodes: Set<string>;
  onToggle: (nodeId: string) => void;
  onPositionUpdate: (id: string, elem: HTMLDivElement) => void;
  isDiagramExpanded: boolean;
}> = ({
  node,
  expandedNodes,
  onToggle,
  onPositionUpdate,
  isDiagramExpanded,
}) => {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <li className={cn("flex items-center relative", node.level > 0 && "mt-3")}>
      <MindMapNode
        node={node}
        isExpanded={isExpanded}
        onToggle={() => onToggle(node.id)}
        onPositionUpdate={onPositionUpdate}
      />
      {hasChildren && (
        <div
          className={cn(
            "children-container overflow-hidden transition-all duration-[400ms]",
            isExpanded
              ? "ml-6 max-w-[3000px] opacity-100"
              : "max-w-0 opacity-0",
          )}
        >
          {isExpanded && (
            <ul className="list-none p-0 m-0 pl-9">
              {node.children.map((child) => (
                <NodeTree
                  key={child.id}
                  node={child}
                  expandedNodes={expandedNodes}
                  onToggle={onToggle}
                  onPositionUpdate={onPositionUpdate}
                  isDiagramExpanded={isDiagramExpanded}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
};

export const MindMap: React.FC<MindMapProps> = ({ data, className }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(["root"]),
  );
  const [nodeElements, setNodeElements] = useState<Map<string, HTMLDivElement>>(
    new Map(),
  );
  const [expandedNodeElements, setExpandedNodeElements] = useState<
    Map<string, HTMLDivElement>
  >(new Map());
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const expandedContainerRef = useRef<HTMLDivElement>(null);
  const expandedContentRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<any>(null);

  // Transform the data into a tree structure
  const transformedData = useMemo(() => {
    const transformSubtopics = (
      subtopics: MindMapSubtopic[],
      parentId: string,
      level: number,
    ): TransformedNode[] => {
      return subtopics.map((subtopic, index) => ({
        id: `${parentId}-${index}`,
        text: subtopic.label,
        level,
        parentId,
        children: subtopic.subtopics
          ? transformSubtopics(
              subtopic.subtopics,
              `${parentId}-${index}`,
              level + 1,
            )
          : [],
      }));
    };

    const root: TransformedNode = {
      id: "root",
      text: data.central.topic,
      level: 0,
      children: transformSubtopics(data.central.subtopics, "root", 1),
    };

    return [root];
  }, [data]);

  const handleToggle = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleNodeUpdate = useCallback(
    (id: string, elem: HTMLDivElement, isExpanded: boolean) => {
      if (isExpanded) {
        setExpandedNodeElements((prev) => {
          const newMap = new Map(prev);
          newMap.set(id, elem);
          return newMap;
        });
      } else {
        setNodeElements((prev) => {
          const newMap = new Map(prev);
          newMap.set(id, elem);
          return newMap;
        });
      }
    },
    [],
  );

  // Create memoized handlers for each view
  const handleNodeUpdateNormal = useCallback(
    (id: string, elem: HTMLDivElement) => handleNodeUpdate(id, elem, false),
    [handleNodeUpdate],
  );

  const handleNodeUpdateExpanded = useCallback(
    (id: string, elem: HTMLDivElement) => handleNodeUpdate(id, elem, true),
    [handleNodeUpdate],
  );

  // Trigger connector updates when nodes expand/collapse
  useEffect(() => {
    // Single update after nodes expand/collapse
    setUpdateTrigger((prev) => prev + 1);

    // One delayed update to catch any layout shifts
    const timer = setTimeout(() => {
      setUpdateTrigger((prev) => prev + 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [expandedNodes]);

  // Helper function to get cumulative offset position
  const getCumulativeOffset = (
    element: HTMLElement,
    container: HTMLElement,
  ) => {
    let left = 0;
    let top = 0;
    let el: HTMLElement | null = element;

    while (el && el !== container && container.contains(el)) {
      left += el.offsetLeft;
      top += el.offsetTop;
      el = el.offsetParent as HTMLElement;
    }

    return { left, top };
  };

  // Calculate connector paths
  const getConnectorPaths = (isExpanded: boolean) => {
    const paths: Array<{
      id: string;
      path: string;
      gradient: { start: string; end: string };
    }> = [];

    const currentContentRef = isExpanded ? expandedContentRef : contentRef;
    const currentNodeElements = isExpanded
      ? expandedNodeElements
      : nodeElements;

    if (!currentContentRef.current) return paths;

    const processNode = (node: TransformedNode) => {
      if (!expandedNodes.has(node.id) || node.children.length === 0) return;

      const parentElem = currentNodeElements.get(node.id);
      if (!parentElem) return;

      node.children.forEach((child) => {
        const childElem = currentNodeElements.get(child.id);
        if (!childElem) return;

        // Get cumulative positions relative to the content container
        const parentPos = getCumulativeOffset(
          parentElem,
          currentContentRef.current!,
        );
        const childPos = getCumulativeOffset(
          childElem,
          currentContentRef.current!,
        );

        const parentWidth = parentElem.offsetWidth;
        const parentHeight = parentElem.offsetHeight;
        const childHeight = childElem.offsetHeight;

        // Calculate connector points
        const startX = parentPos.left + parentWidth;
        const startY = parentPos.top + parentHeight / 2;
        const endX = childPos.left;
        const endY = childPos.top + childHeight / 2;

        const horizontalDistance = endX - startX;
        const path =
          horizontalDistance < 5
            ? `M ${startX} ${startY} L ${endX} ${endY}`
            : `M ${startX} ${startY} C ${startX + horizontalDistance * 0.6} ${startY}, ${endX - horizontalDistance * 0.4} ${endY}, ${endX} ${endY}`;

        const gradientKey = Math.min(
          child.level,
          4,
        ) as keyof typeof connectorGradients;
        paths.push({
          id: `${node.id}-${child.id}`,
          path,
          gradient: connectorGradients[gradientKey] || connectorGradients[4],
        });

        // Recursively process children if they're expanded
        if (expandedNodes.has(child.id)) {
          processNode(child);
        }
      });
    };

    transformedData.forEach(processNode);
    return paths;
  };

  // Memoize connector paths for each view
  const normalConnectorPaths = useMemo(
    () => getConnectorPaths(false),
    [transformedData, nodeElements, expandedNodes, updateTrigger],
  );

  const expandedConnectorPaths = useMemo(
    () => getConnectorPaths(true),
    [transformedData, expandedNodeElements, expandedNodes, updateTrigger],
  );

  const renderMindMapContent = (isExpanded: boolean) => {
    const connectorPaths = isExpanded
      ? expandedConnectorPaths
      : normalConnectorPaths;

    return (
      <div
        ref={isExpanded ? expandedContainerRef : containerRef}
        className={cn(
          "relative w-full overflow-hidden rounded-lg",
          isExpanded ? "h-full" : "h-[600px]",
        )}
      >
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={3}
          wheel={{ step: 0.1 }}
          panning={{
            disabled: false,
            velocityDisabled: false,
          }}
          doubleClick={{ disabled: true }}
          pinch={{ disabled: false }}
          limitToBounds={true}
          onTransformed={(ref) => {
            transformRef.current = ref;
          }}
        >
          {/* Mind Map Container */}
          <TransformComponent
            wrapperClass="!w-full !h-full"
            contentClass="flex items-center justify-center p-12"
          >
            <div
              ref={isExpanded ? expandedContentRef : contentRef}
              className="relative inline-block"
            >
              {/* SVG Connectors */}
              <svg
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  overflow: "visible",
                }}
              >
                <defs>
                  {connectorPaths.map(({ id, gradient }) => (
                    <linearGradient
                      key={id}
                      id={`gradient-${id}`}
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor={gradient.start} />
                      <stop offset="100%" stopColor={gradient.end} />
                    </linearGradient>
                  ))}
                </defs>
                {connectorPaths.map(({ id, path, gradient }) => (
                  <g key={id}>
                    <path
                      d={path}
                      stroke={gradient.start.replace(/[\d.]+\)$/, "0.2)")}
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d={path}
                      stroke={`url(#gradient-${id})`}
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                ))}
              </svg>

              {/* Mind Map Nodes */}
              <ul className="mindmap list-none p-0 m-0 relative z-10">
                {transformedData.map((node) => (
                  <NodeTree
                    key={node.id}
                    node={node}
                    expandedNodes={expandedNodes}
                    onToggle={handleToggle}
                    onPositionUpdate={
                      isExpanded
                        ? handleNodeUpdateExpanded
                        : handleNodeUpdateNormal
                    }
                    isDiagramExpanded={isExpanded}
                  />
                ))}
              </ul>
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
    );
  };

  return (
    <BaseDiagram
      title={data.title}
      className={className}
      renderDiagram={() => renderMindMapContent(true)}
    >
      {renderMindMapContent(false)}
    </BaseDiagram>
  );
};
