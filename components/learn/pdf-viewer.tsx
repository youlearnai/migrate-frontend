"use client";
import "@ungap/with-resolvers";
import { GlobalWorkerOptions } from "pdfjs-dist";
import {
  Root,
  Pages,
  Page,
  CanvasLayer,
  TextLayer,
  AnnotationLayer,
  HighlightLayer,
  TotalPages,
  Thumbnail,
  Thumbnails,
  usePdfJump,
  usePdf,
  SelectionTooltip,
  useSelectionDimensions,
  Search,
} from "@anaralabs/lector";
import "pdfjs-dist/web/pdf_viewer.css";
import { base64ToFile, cn, MAX_FILES_FOR_CHAT } from "@/lib/utils";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Loading from "@/app/[locale]/loading";
import {
  Download,
  Maximize,
  RotateCwSquare,
  PanelRight,
  PanelLeft,
  Search as SearchIcon,
  Minimize,
  Sun,
  Moon,
} from "lucide-react";
import { useSourceStore } from "@/hooks/use-source-store";
import { useCurrentSourceStore } from "@/hooks/use-current-source-store";
import { AdvancedPopover } from "../global/popovers";
import { SearchUI } from "./pdf-search";
import PDFZoomDropdown from "./pdf-zoom-dropdown";
import dynamic from "next/dynamic";
import { useCapture } from "@/hooks/use-capture";
import { useUploadChatImage } from "@/query-hooks/upload";
import { useS3Upload } from "@/hooks/use-upload-s3";
import { useTranslation } from "react-i18next";
import { useScreenshotStore } from "@/hooks/use-screenshot-store";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useLocalStorage } from "usehooks-ts";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.mjs",
  import.meta.url,
).toString();

const CaptureOverlay = dynamic(() => import("./capture-overlay"), {
  ssr: false,
});

export const CustomSelect = ({ text }: { text: string }) => {
  const zoom = usePdf((state) => state.zoom);

  return (
    <SelectionTooltip>
      <div
        className="dark:invert-[92.5%] dark:hue-rotate-180"
        style={{
          transform: `scale(${1 / zoom})`,
          transformOrigin: "top left",
          position: "relative",
          top: "-10px",
          left: "60px",
          pointerEvents: "auto",
        }}
      >
        <AdvancedPopover text={text} />
      </div>
    </SelectionTooltip>
  );
};

const CustomPageInput = ({ className }: { className: string }) => {
  const currentPage = usePdf((state) => state.currentPage);
  const pdfDocumentProxy = usePdf((state) => state.pdfDocumentProxy);
  const totalPages = pdfDocumentProxy?.numPages || 1;
  const { jumpToPage } = usePdfJump();

  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    if (currentPage) {
      setInputValue(currentPage.toString());
    }
  }, [currentPage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    const pageNum = parseInt(inputValue, 10);
    if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
      jumpToPage(pageNum);
    } else {
      setInputValue(currentPage?.toString() || "1");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      style={{
        width: `${Math.max(2, totalPages.toString().length + 0.5)}em`,
        textAlign: "center",
      }}
    />
  );
};

const PDFViewer = React.memo(({ fileUrl }: { fileUrl: string }) => {
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { theme } = useTheme();
  const [pdfTheme, setPdfTheme] = useLocalStorage<"light" | "dark">(
    "pdf-theme",
    theme as "light" | "dark",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const { onScreenshot, screenshot } = useScreenshotStore();
  const { mutate: uploadChatImage } = useUploadChatImage();
  const { uploadFileToS3 } = useS3Upload();
  const { t } = useTranslation();
  const {
    screenshotRef,
    isCapturing,
    isDragging,
    startPoint,
    endPoint,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useCapture({
    onScreenshot: (files) => {
      processFiles(files);
    },
  });

  const processFiles = useCallback(
    async (screenshots: string[]) => {
      const totalScreenshots = (screenshot?.length || 0) + screenshots.length;

      if (totalScreenshots > MAX_FILES_FOR_CHAT) {
        toast.error(
          t("chatInput.maxScreenshotsExceeded", { limit: MAX_FILES_FOR_CHAT }),
        );
        return;
      }

      const uploadedScreenshots: string[] = [...(screenshot || [])];

      for (const screenshot of screenshots) {
        const file = base64ToFile(screenshot, "screenshot.png", "image/png");
        try {
          await new Promise<void>((resolve, reject) => {
            uploadChatImage(
              { mimeType: file.type },
              {
                onSuccess: async (data) => {
                  const url = await uploadFileToS3(file, data);
                  if (url) {
                    uploadedScreenshots.push(url);
                  }
                  resolve();
                },
                onError: reject,
              },
            );
          });
        } catch (error) {
          console.error("Failed to upload screenshot:", error);
        }
      }

      onScreenshot(uploadedScreenshots);
    },
    [screenshot, uploadChatImage, uploadFileToS3, onScreenshot, t],
  );

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message}`,
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleDownload = () => {
    if (fileUrl) {
      fetch(fileUrl)
        .then((response) => response.blob())
        .then((blob) => {
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = fileUrl.split("/").pop() || "document.pdf";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        })
        .catch((error) => {
          console.error("Error downloading PDF:", error);
        });
    }
  };

  const handleRotate = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360);
  };

  const togglePdfTheme = () => {
    setPdfTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div
      className="h-full w-full overflow-hidden"
      ref={screenshotRef}
      key="pdf-viewer-container"
    >
      {isCapturing && (
        <CaptureOverlay
          key="capture-overlay"
          isDragging={isDragging}
          startPoint={startPoint}
          endPoint={endPoint}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      )}
      <div
        className="h-full border rounded-lg bg-neutral-100 selection:text-transparent dark:bg-neutral-800/50"
        ref={containerRef}
      >
        <Root
          source={fileUrl}
          className="w-full h-full flex flex-col"
          loader={<Loading />}
          onError={(error) => console.error("PDF load error:", error)}
          isZoomFitWidth={true}
          zoomOptions={{
            minZoom: 0.25,
            maxZoom: 5,
          }}
        >
          <div className="bg-neutral-100 dark:bg-neutral-800/50 border-b p-2 py-[4.5px] flex items-center text-sm text-neutral-600 dark:text-neutral-300 gap-2 rounded-t-lg">
            <button
              onClick={() => setShowThumbnails((show) => !show)}
              className="px-2 hover:bg-neutral-300 dark:hover:bg-neutral-700 hover:text-neutral-800/50 dark:hover:text-neutral-100 py-1 rounded-full"
              title="Toggle Thumbnails"
            >
              {showThumbnails ? (
                <PanelRight className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setShowSearch((show) => !show)}
              className="px-2 hover:bg-neutral-300 dark:hover:bg-neutral-700 hover:text-neutral-800/50 dark:hover:text-neutral-100 py-1 rounded-full ml-[-8]"
              title="Toggle Search"
            >
              <SearchIcon className="w-4 h-4" />
            </button>
            <button
              onClick={togglePdfTheme}
              className="px-2 hover:bg-neutral-300 dark:hover:bg-neutral-700 hover:text-neutral-800/50 dark:hover:text-neutral-100 py-1 rounded-full ml-[-8]"
              title={`Switch PDF to ${pdfTheme === "light" ? "dark" : "light"} theme`}
            >
              {pdfTheme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
            <span className="flex-grow" />
            <div className="flex items-center gap-1">
              <CustomPageInput className="bg-white dark:bg-neutral-800 rounded-lg px-0 py-1 border dark:border-neutral-700 text-center" />
              {" / "}
              <TotalPages />
            </div>
            <div className="h-6 w-[1px] bg-neutral-300 dark:bg-neutral-700 ml-1.5" />
            <div className="flex items-center gap-1">
              <PDFZoomDropdown />
            </div>
            <span className="flex-grow" />
            <div className="flex items-center gap-2">
              <button
                onClick={handleRotate}
                className="p-1 hover:bg-neutral-300 dark:hover:bg-neutral-700 hover:text-neutral-800/50 dark:hover:text-neutral-100 rounded-full"
                title="Rotate 90° Clockwise"
              >
                <RotateCwSquare className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="p-1 hover:bg-neutral-300 dark:hover:bg-neutral-700 hover:text-neutral-800/50 dark:hover:text-neutral-100 rounded-full"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFullScreen}
                className="p-1 hover:bg-neutral-300 dark:hover:bg-neutral-700 hover:text-neutral-800/50 dark:hover:text-neutral-100 rounded-full"
                title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
              >
                {isFullScreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <PDFPagesWrapper
            showThumbnails={showThumbnails}
            showSearch={showSearch}
            rotation={rotation}
            pdfTheme={pdfTheme}
          />
        </Root>
      </div>
    </div>
  );
});

PDFViewer.displayName = "PDFViewer";

export default PDFViewer;

const PDFPagesWrapper = React.memo(
  ({
    showThumbnails,
    showSearch,
    rotation,
    pdfTheme,
  }: {
    showThumbnails: boolean;
    showSearch: boolean;
    rotation: number;
    pdfTheme: "light" | "dark";
  }) => {
    const {
      source,
      data: sourceData,
      lastUpdated,
      resetSource,
      scrollType,
    } = useSourceStore();
    const setHighlights = usePdf((state) => state.setHighlight);
    const { jumpToPage } = usePdfJump();
    const currentPage = usePdf((state) => state.currentPage);
    const zoom = usePdf((state) => state.zoom);
    const { setCurrentSource } = useCurrentSourceStore();
    const pdfReady = usePdf((state) => Boolean(state.pdfDocumentProxy));
    const virtualizerReady = usePdf((state) => Boolean(state.virtualizer));
    const selectionDimensions = useSelectionDimensions();
    const [selectedText, setSelectedText] = useState<string>("");
    const [pageOffset, setPageOffset] = useState<number>(0);
    const mountedRef = useRef(false);
    const initialSourceRef = useRef<{
      source: number | null;
      data: any;
      lastUpdated: number;
    } | null>(null);

    useEffect(() => {
      setCurrentSource(currentPage as number);
    }, [currentPage]);

    useEffect(() => {
      if (pdfReady && virtualizerReady) {
        mountedRef.current = true;

        if (
          initialSourceRef.current &&
          initialSourceRef.current.source !== null
        ) {
          const savedSource = initialSourceRef.current;
          initialSourceRef.current = null;

          const pageIndex = Math.max(0, Number(savedSource.source) - 1);

          if (savedSource.data) {
            const LEFT_X = savedSource.data?.left as number;
            const TOP_Y = savedSource.data?.top as number;
            const WIDTH = savedSource.data?.width as number;
            const HEIGHT = savedSource.data?.height as number;

            setHighlights([
              {
                pageNumber: Number(savedSource.source),
                top: TOP_Y,
                left: LEFT_X,
                width: WIDTH - LEFT_X,
                height: HEIGHT - TOP_Y,
              },
            ]);
          }

          const estimatedPageHeight = 1000;
          const estimatedOffset = pageIndex * (estimatedPageHeight + 20);
          setPageOffset(estimatedOffset);
          jumpToPage(pageIndex + 1, { behavior: "auto", align: "start" });
        }
      }
    }, [pdfReady, virtualizerReady, jumpToPage, setHighlights]);

    useEffect(() => {
      if (source === null) return;

      if (!pdfReady || !virtualizerReady) {
        initialSourceRef.current = { source, data: sourceData, lastUpdated };
        return;
      }

      const pageIndex = Math.max(0, Number(source) - 1);

      let behavior: "auto" | "smooth" = mountedRef.current ? "smooth" : "auto";

      if (scrollType === "auto") {
        behavior = "auto";
      }

      if (sourceData) {
        const LEFT_X = sourceData?.left as number;
        const TOP_Y = sourceData?.top as number;
        const WIDTH = sourceData?.width as number;
        const HEIGHT = sourceData?.height as number;

        setHighlights([
          {
            pageNumber: Number(source),
            top: TOP_Y,
            left: LEFT_X,
            width: WIDTH - LEFT_X,
            height: HEIGHT - TOP_Y,
          },
        ]);
      }

      const estimatedPageHeight = 1000;
      const estimatedOffset = pageIndex * (estimatedPageHeight + 20);
      setPageOffset(estimatedOffset);

      jumpToPage(pageIndex + 1, { behavior, align: "start" });

      resetSource();
    }, [
      pdfReady,
      virtualizerReady,
      source,
      sourceData,
      lastUpdated,
      jumpToPage,
      resetSource,
      setHighlights,
    ]);

    useEffect(() => {
      const handleSelectionChange = () => {
        if (!selectionDimensions) return;

        const selection = selectionDimensions.getSelection();

        if (selection && !selection.isCollapsed) {
          setSelectedText(selection.text);
        } else {
          setSelectedText("");
        }
      };

      document.addEventListener("selectionchange", handleSelectionChange);

      return () => {
        document.removeEventListener("selectionchange", handleSelectionChange);
      };
    }, [selectionDimensions]);

    return (
      <div
        className={cn(
          "flex-grow min-h-0 relative grid",
          "transition-all duration-300",
          pdfTheme === "dark" ? "bg-neutral-800/50" : "bg-white",
          showThumbnails && showSearch
            ? "grid-cols-[16rem,16em,1fr]"
            : showThumbnails
              ? "grid-cols-[16rem,0,1fr]"
              : showSearch
                ? "grid-cols-[0,16rem,1fr]"
                : "grid-cols-[0,0,1fr]",
        )}
      >
        <div
          className={cn(
            "overflow-y-auto overflow-x-hidden",
            showThumbnails ? "border-r" : "",
          )}
        >
          <div className="overflow-x-hidden">
            <Thumbnails className="flex flex-col gap-4 items-center py-4 dark:border-neutral-700">
              <Thumbnail
                className="transition-all w-48 hover:shadow-lg hover:outline hover:outline-neutral-300 dark:hover:outline-neutral-600"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            </Thumbnails>
          </div>
        </div>

        <div className="overflow-y-auto overflow-x-hidden dark:border-neutral-700">
          {showSearch && (
            <Search>
              <SearchUI />
            </Search>
          )}
        </div>

        <Pages
          className={cn(
            pdfTheme === "dark"
              ? "invert-[92.5%] hue-rotate-180 brightness-[80%] contrast-[228%]"
              : "",
          )}
          style={{ position: "relative" }}
          gap={20}
          virtualizerOptions={{
            overscan: 5,
          }}
          initialOffset={pageOffset}
          onOffsetChange={(offset) => {
            setPageOffset(offset);
          }}
        >
          <Page
            style={{
              transform: `rotate(${rotation}deg)`,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                zIndex: 100,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              <SelectionTooltip>
                <div
                  style={{
                    transform: `scale(${1 / zoom})`,
                    transformOrigin: "top left",
                    position: "relative",
                    top: "-10px",
                    left: "60px",
                    pointerEvents: "auto",
                  }}
                >
                  <AdvancedPopover text={selectedText} />
                </div>
              </SelectionTooltip>
            </div>
            <CanvasLayer background="transparent" style={{ zIndex: 1 }} />
            <TextLayer style={{ zIndex: 2 }} />
            <AnnotationLayer style={{ zIndex: 3 }} />
            <HighlightLayer
              className="bg-green-500/20 dark:bg-green-500/30 rounded-[2px]"
              style={{ zIndex: 4 }}
            />
          </Page>
        </Pages>
      </div>
    );
  },
);

PDFPagesWrapper.displayName = "PDFPagesWrapper";
