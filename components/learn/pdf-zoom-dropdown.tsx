"use client";

import React from "react";
import { usePdf } from "@anaralabs/lector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

const PDFZoomDropdown = () => {
  const { t } = useTranslation();
  const zoom = usePdf((state) => state.zoom);
  const updateZoom = usePdf((state) => state.updateZoom);
  const zoomFitWidth = usePdf((state) => state.zoomFitWidth);
  const isZoomFitWidth = usePdf((state) => state.isZoomFitWidth);

  const zoomLevels = [
    { label: "50%", value: 0.5 },
    { label: "75%", value: 0.75 },
    { label: "100%", value: 1 },
    { label: "125%", value: 1.25 },
    { label: "150%", value: 1.5 },
    { label: "200%", value: 2 },
    { label: "300%", value: 3 },
  ];

  const currentZoom = Math.round(zoom * 100);

  const zoomOut = () =>
    updateZoom((prev: number) => Math.max(prev - 0.1, 0.25));
  const zoomIn = () => updateZoom((prev: number) => Math.min(prev + 0.1, 5));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 text-sm bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700">
        {isZoomFitWidth ? "Page fit" : `${currentZoom}%`}
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="focus:bg-transparent rounded-sm cursor-default !p-0"
        >
          <div className="flex items-center w-full px-2 py-1">
            <span className="text-sm mr-auto">{currentZoom}%</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                zoomOut();
              }}
              className="p-0.5 mx-0.5 border rounded-sm hover:bg-primary/20"
              aria-label={t("zoomOut")}
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                zoomIn();
              }}
              className="p-0.5 mx-0.5 border rounded-sm hover:bg-primary/20"
              aria-label={t("zoomIn")}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={zoomFitWidth}
          className={isZoomFitWidth ? "bg-accent" : ""}
        >
          {t("fitToWidth")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {zoomLevels.map((level) => (
          <DropdownMenuItem
            key={level.value}
            onClick={() => updateZoom(level.value)}
            className={
              !isZoomFitWidth && zoom === level.value ? "bg-accent" : ""
            }
          >
            {level.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PDFZoomDropdown;
