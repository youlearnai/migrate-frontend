import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useModalStore } from "@/hooks/use-modal-store";
import { useSourceStore } from "@/hooks/use-source-store";
import {
  BoundingBoxData,
  Content,
  ContentType,
  SourceTooltipProps,
  SourceType,
} from "@/lib/types";
import {
  checkStringType,
  formatMilliseconds,
  getMentionItems,
} from "@/lib/utils";
import { useAddContent, useGetContent } from "@/query-hooks/content";
import "katex/dist/katex.min.css";
import { useParams, useRouter } from "next/navigation";
import React, { type FC, memo, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown, { type Options } from "react-markdown";
import ShikiHighlighter, { rehypeInlineCodeProperty } from "react-shiki";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import ContentCardSkeleton from "../skeleton/content-card-skeleton";
import { Badge } from "../ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import ContentCard from "./content-card";
import renderLatexInTextAsHTMLString from "@/lib/latex/renderLatex";
import { Button } from "../ui/button";
import { ArrowRight, Plus, Check, Copy } from "lucide-react";
import Spinner from "./spinner";
import { isAudioType, isVideoType } from "@/lib/utils";
import { useFeatureMentions } from "@/lib/constants";

const defaultMacros = { "\\f": "#1f(#2)" };

const defaultDelimiters = [
  { left: "$$", right: "$$", display: false },
  { left: "\\(", right: "\\)", display: false },
  { left: "\\[", right: "\\]", display: true },
  { left: "\\begin{equation}", right: "\\end{equation}", display: false },
  { left: "\\begin{align}", right: "\\end{align}", display: false },
  { left: "\\begin{align*}", right: "\\end{align*}", display: false },
  { left: "\\begin{cases}", right: "\\end{cases}", display: false },
  { left: "\\begin{matrix}", right: "\\end{matrix}", display: false },
  { left: "\\begin{bmatrix}", right: "\\end{bmatrix}", display: false },
  { left: "\\begin{pmatrix}", right: "\\end{pmatrix}", display: false },
  { left: "\\begin{array}", right: "\\end{array}", display: false },
  { left: "\\section*{", right: "}", display: false },
  { left: "\\section{", right: "}", display: false },
  { left: "\\subsection*{", right: "}", display: false },
  { left: "\\subsection{", right: "}", display: false },
  { left: "\\textbf{", right: "}", display: false },
  { left: "\\begin{enumerate}", right: "\\end{enumerate}", display: false },
  { left: "\\begin{itemize}", right: "\\end{itemize}", display: false },
  { left: "\\item", right: "", display: false },
  { left: "\\textit{", right: "}", display: false },
  { left: "\\textrm{", right: "}", display: false },
  { left: "\\text{", right: "}", display: false },
  { left: "\\begin{theorem}", right: "\\end{theorem}", display: false },
  { left: "\\begin{proof}", right: "\\end{proof}", display: false },
  { left: "\\begin{definition}", right: "\\end{definition}", display: false },
  { left: "\\begin{example}", right: "\\end{example}", display: false },
  { left: "\\begin{table}", right: "\\end{table}", display: false },
  { left: "\\begin{tabular}", right: "\\end{tabular}", display: false },
  { left: "\\frac{", right: "}", display: false },
  { left: "\\hat{", right: "}", display: false },
  { left: "\\vec{", right: "}", display: false },
  { left: "\\overline{", right: "}", display: false },
];

const parseBoundingBox = (
  bboxValue: string | undefined,
): BoundingBoxData | undefined => {
  if (!bboxValue) return undefined;

  try {
    const nums = bboxValue.split(",").map((num) => Number(num.trim()));
    if (nums.length === 4 && nums.every((n) => !isNaN(n))) {
      return {
        left: nums[0],
        top: nums[1],
        width: nums[2],
        height: nums[3],
      };
    }
    console.warn("Failed to parse bbox:", bboxValue);
    return undefined;
  } catch (e) {
    console.warn("Failed to parse bbox:", bboxValue);
    return undefined;
  }
};

const Markdown: FC<
  Options & { type?: SourceType; chatContextContents?: Content[] }
> = ({ type = "general", children, ...props }) => {
  const mentionTools = useFeatureMentions();
  const featureMentions = getMentionItems(
    mentionTools,
    props.chatContextContents,
  );
  const containsBlockElement = React.useCallback(
    (child: React.ReactNode): boolean => {
      if (!React.isValidElement(child)) return false;

      if (
        typeof child.type === "string" &&
        ["div", "h1", "h2", "h3", "h4", "h5", "h6", "article"].includes(
          child.type,
        )
      ) {
        return true;
      }

      if (typeof child.type === "function") {
        return true;
      }

      const childProps = child.props as {
        children?: React.ReactNode | React.ReactNode[];
      };
      if (childProps.children) {
        if (Array.isArray(childProps.children)) {
          return childProps.children.some(containsBlockElement);
        }
        return containsBlockElement(childProps.children);
      }

      return false;
    },
    [],
  );

  const processSources = React.useCallback(
    (children: React.ReactNode[]) => {
      return children.flatMap((child, index) => {
        if (typeof child === "string") {
          let sourcePattern: RegExp;
          if (type === "space") {
            sourcePattern =
              /【([^】]+?)(?:,\s*bbox:\s*(?:"([^"]+)"|([-\d.,\s]+)))?(?:,\s*source:\s*(?:"([^"]+)"|([^】]+)))?\s*】/g;
          } else {
            sourcePattern =
              /【([^,】]+)(?:,\s*bbox:\s*(?:"([^"]+)"|([-\d.,\s]+)))?(?:,\s*source:\s*(?:"([^"]+)"|([^】]+)))?\s*】/g;
          }

          let lastIndex = 0;
          let parts: React.ReactNode[] = [];
          let match;

          while ((match = sourcePattern.exec(child)) !== null) {
            if (match.index > lastIndex) {
              parts.push(child.slice(lastIndex, match.index));
            }

            const extractedSource = match[1].trim();
            const bboxValue = match[2] || match[3];
            let bbox: BoundingBoxData | undefined;
            if (bboxValue) {
              bbox = parseBoundingBox(bboxValue);
            }
            let tooltipSource;
            let sourceNumber;
            if (type === "space") {
              tooltipSource = extractedSource;
              sourceNumber = match[4] || match[5];
            } else {
              tooltipSource = match[4] || match[5] || extractedSource;
            }
            parts.push(
              <div
                key={`source-wrapper-${index}-${match.index}`}
                className="inline"
              >
                <SourceTooltip
                  key={`source-${index}-${extractedSource}`}
                  source={tooltipSource}
                  sourceNumber={sourceNumber}
                  type={type}
                  bbox={bbox}
                />
              </div>,
            );

            lastIndex = match.index + match[0].length;
          }

          if (lastIndex < child.length) {
            parts.push(child.slice(lastIndex));
          }

          return parts;
        }
        return child;
      });
    },
    [type],
  );

  const processMentions = React.useCallback(
    (children: React.ReactNode[]): React.ReactNode[] => {
      const escapedFeatureNamesByDisplay = featureMentions
        .map((f) => f.display.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");

      const escapedFeatureNamesByIds = featureMentions
        .map((f) => (f.id as string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");

      const escapedFeatureNames =
        escapedFeatureNamesByIds + "|" + escapedFeatureNamesByDisplay;

      if (!escapedFeatureNames) return children;

      const mentionRegex = new RegExp(`@\\[(${escapedFeatureNames})\\]`, "gi");

      return children.flatMap((child, index) => {
        if (typeof child === "string") {
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let match: RegExpExecArray | null;

          while ((match = mentionRegex.exec(child)) !== null) {
            if (match.index > lastIndex) {
              parts.push(child.slice(lastIndex, match.index));
            }

            const mentionById = featureMentions.find(
              (m) => m.id === match?.[1],
            );
            const mentionByDisplay = featureMentions.find(
              (m) => m.display === match?.[1],
            );

            const mentionRender =
              mentionById?.display || mentionByDisplay?.display;

            const mentionName = `@${mentionRender}`;

            parts.push(
              <div
                key={`source-wrapper-${index}-${match.index}`}
                className="inline"
              >
                <MentionRenderer mention={mentionName} />
              </div>,
            );

            lastIndex = match.index + match[0].length;
          }

          if (lastIndex < child.length) {
            parts.push(child.slice(lastIndex));
          }

          return parts;
        }

        return child;
      });
    },
    [featureMentions],
  );

  const processChildren = React.useCallback(
    (children: React.ReactNode[]): React.ReactNode[] => {
      let newChildren = children;
      newChildren = processSources(newChildren);
      newChildren = processMentions(newChildren);
      return newChildren;
    },
    [processSources, processMentions],
  );

  const paragraphRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);

      const hasBlockElement =
        React.Children.toArray(newChildren).some(containsBlockElement);

      if (hasBlockElement) {
        return <div key="block-container">{newChildren}</div>;
      }

      return <div {...props}>{newChildren}</div>;
    },
    [processChildren, containsBlockElement],
  );

  const listItemRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <li key="list-item" {...props}>
          {newChildren}
        </li>
      );
    },
    [processChildren],
  );

  const tableCellRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <td key="table-cell" className="border border-border p-2" {...props}>
          {newChildren}
        </td>
      );
    },
    [processChildren],
  );

  const tableHeaderRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <th
          key="table-header"
          className="border border-border p-2 bg-muted"
          {...props}
        >
          {newChildren}
        </th>
      );
    },
    [processChildren],
  );

  const searchRenderer = ({
    node,
    source_id,
    type,
    title,
    url,
    favicon,
    description,
    ...props
  }: {
    node: Node;
    source_id: string;
    type: ContentType;
    title: string;
    url: string;
    favicon?: string;
    description?: string;
    children: React.ReactNode;
  }) => {
    const { mutate: addToSpace, isPending } = useAddContent();
    const params = useParams();
    const spaceId = params.spaceId as string;
    const router = useRouter();
    const { t } = useTranslation();

    const handleAdd = (redirect: boolean = false) => {
      addToSpace(
        {
          contentURLs: [url],
          spaceId: spaceId,
          addToHistory: !spaceId,
        },
        {
          onSuccess: (data) => {
            if (redirect) {
              if (spaceId) {
                router.push(
                  `/learn/space/${spaceId}/content/${data[0].content_id}`,
                );
              } else {
                router.push(`/learn/content/${data[0].content_id}`);
              }
            }
          },
        },
      );
    };

    const goToSource = (href: string) => {
      window.open(href, "_blank");
    };

    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="font-normal max-w-[12rem] truncate text-foreground/60 text-xs mx-1 inline-block px-2.5 py-0.5 rounded-full cursor-pointer hover:bg-primary/5"
              onClick={() => goToSource(url)}
            >
              {props.children}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={5} className="w-56 p-2">
            <div className="flex items-center mb-1">
              <img
                src={favicon}
                alt={title}
                className="w-4 h-4 mr-1.5 flex-shrink-0"
              />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sm hover:underline truncate"
              >
                {title}
              </a>
            </div>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-3">
              {description}
            </p>
            <div className="flex flex-col gap-1.5">
              <Button
                onClick={() => handleAdd(false)}
                size="sm"
                disabled={isPending}
                variant="plain"
                className="bg-neutral-50 dark:bg-neutral-900 w-full flex border-2 border-dashed border-primary/10 justify-start items-center p-2 pr-3 text-primary/80 text-left hover:text-primary hover:bg-primary/5 hover:border-primary/10"
              >
                {isPending ? (
                  <Spinner className="h-4 w-4 mr-1.5" />
                ) : (
                  <Plus className="h-4 w-4 mr-1.5" />
                )}
                {isPending
                  ? t("examBoard.timer.loading")
                  : t("addContent.addContentButton")}
              </Button>
              <Button
                onClick={() => handleAdd(true)}
                size="sm"
                disabled={isPending}
                className="w-full flex border-2 border-primary/10 justify-start items-center p-2 pr-3 text-left"
              >
                {isPending ? (
                  <Spinner className="h-4 w-4 mr-1.5" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-1.5" />
                )}
                {isPending ? t("examBoard.timer.loading") : t("goToContent")}
              </Button>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const codeRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      if (typeof props.children === "string") {
        const processedText = processChildren([props.children]);
        return (
          <span
            key="markdown-code"
            className="p-1 my-1 rounded-md bg-background overflow-x-auto"
            {...props}
          >
            {processedText}
          </span>
        );
      }
      return (
        <span
          key="markdown-code"
          className="p-1 my-1 rounded-md bg-background overflow-x-auto"
          {...props}
        >
          {props.children}
        </span>
      );
    },
    [processChildren],
  );

  const sourcesRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <Collapsible className="inline">
          <CollapsibleTrigger asChild>
            <sup className="text-[10px]  mr-1 px-[3.5px] py-[1px] rounded-full bg-primary/10 dark:bg-primary/20 text-primary/80 hover:text-foreground cursor-pointer">
              ...
            </sup>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-wrap inline-block">
            <div className="flex space-x-1">{newChildren}</div>
          </CollapsibleContent>
        </Collapsible>
      );
    },
    [processChildren],
  );

  const h1Renderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <h1 key="markdown-h1" className="text-2xl mb-4 font-bold" {...props}>
          {newChildren}
        </h1>
      );
    },
    [processChildren],
  );

  const h2Renderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <h2 key="markdown-h2" className="text-xl mb-4 font-semibold" {...props}>
          {newChildren}
        </h2>
      );
    },
    [processChildren],
  );

  const h3Renderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <h3 key="markdown-h3" className="text-lg mb-2 font-semibold" {...props}>
          {newChildren}
        </h3>
      );
    },
    [processChildren],
  );

  const emRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <em key="markdown-em" className="text-primary/80 italic" {...props}>
          {newChildren}
        </em>
      );
    },
    [processChildren],
  );

  const strongRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <strong key="markdown-strong" className="font-semibold" {...props}>
          {newChildren}
        </strong>
      );
    },
    [processChildren],
  );

  const ulRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <ul
          key="markdown-ul"
          className="list-disc text-left pl-0.5 ml-4 mb-4"
          {...props}
        >
          {newChildren}
        </ul>
      );
    },
    [processChildren],
  );

  const olRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <ol
          key="markdown-ol"
          className="list-decimal text-left pl-0.5 ml-4 mb-4"
          {...props}
        >
          {newChildren}
        </ol>
      );
    },
    [processChildren],
  );

  const blockquoteRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <blockquote
          key="markdown-blockquote"
          className="pl-4 italic border-l-4 mb-4"
          {...props}
        >
          {newChildren}
        </blockquote>
      );
    },
    [processChildren],
  );

  const preRenderer = React.useCallback(
    ({
      node,
      children,
      ...props
    }: {
      node: Node;
      children?: React.ReactElement & {
        props: {
          className?: string;
          children?: string;
        };
      };
    }) => {
      const match = children?.props?.className?.match(/language-(\w+)/);
      const language = match ? match[1] : undefined;
      const code = children?.props?.children || "";
      const [isCopied, setIsCopied] = useState(false);

      const copyToClipboard = async () => {
        await navigator.clipboard.writeText(String(code.trim()));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      };

      return (
        <div className="w-full border-collapse">
          {code.trim() && (
            <div className="overflow-x-auto">
              <ShikiHighlighter
                key="markdown-code-block"
                language={language}
                className="code-block"
                theme="houston"
                addDefaultStyles={true}
                as="div"
                style={{
                  textAlign: "left",
                }}
              >
                {String(code.trim())}
              </ShikiHighlighter>
              <Button
                key="markdown-copy-button"
                variant="ghost"
                onClick={copyToClipboard}
                size="icon"
                className="absolute top-10 hover:bg-transparent h-4 w-4 p-2 right-2"
              >
                {isCopied ? (
                  <Check
                    key="markdown-check-icon"
                    className="h-4 w-4 dark:text-white dark:hover:text-white/80 text-primary-foreground hover:text-primary-foreground/80 flex-shrink-0"
                  />
                ) : (
                  <Copy
                    key="markdown-copy-icon"
                    className="h-4 w-4 dark:text-white dark:hover:text-white/80 text-primary-foreground hover:text-primary-foreground/80 flex-shrink-0"
                  />
                )}
              </Button>
            </div>
          )}
        </div>
      );
    },
    [],
  );

  const tableRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <table
          key="markdown-table"
          className="min-w-full border-collapse border border-border"
          {...props}
        >
          {newChildren}
        </table>
      );
    },
    [processChildren],
  );

  const hrRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => (
      <hr
        key="markdown-hr"
        className="border-t border-border my-6"
        {...props}
      />
    ),
    [],
  );

  const aRenderer = React.useCallback(
    ({ node, ...props }: { node: Node; children: React.ReactNode }) => {
      const children = React.Children.toArray(props.children);
      const newChildren = processChildren(children);
      return (
        <a
          key="markdown-a"
          className="text-blue-600 cursor-pointer dark:text-blue-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {newChildren}
        </a>
      );
    },
    [processChildren],
  );

  const components = React.useMemo(
    () => ({
      ...props.components,
      h1: h1Renderer,
      h2: h2Renderer,
      h3: h3Renderer,
      em: emRenderer,
      strong: strongRenderer,
      ul: ulRenderer,
      ol: olRenderer,
      blockquote: blockquoteRenderer,
      pre: preRenderer,
      table: tableRenderer,
      hr: hrRenderer,
      a: aRenderer,
      p: paragraphRenderer,
      li: listItemRenderer,
      td: tableCellRenderer,
      th: tableHeaderRenderer,
      code: codeRenderer,
      search: searchRenderer,
      sources: sourcesRenderer,
    }),
    [
      props.components,
      h1Renderer,
      h2Renderer,
      h3Renderer,
      emRenderer,
      strongRenderer,
      ulRenderer,
      olRenderer,
      blockquoteRenderer,
      preRenderer,
      tableRenderer,
      hrRenderer,
      aRenderer,
      paragraphRenderer,
      listItemRenderer,
      tableCellRenderer,
      tableHeaderRenderer,
      codeRenderer,
      searchRenderer,
      sourcesRenderer,
    ],
  );

  const processContent = React.useCallback((content: string) => {
    try {
      return renderLatexInTextAsHTMLString(
        content,
        defaultDelimiters,
        false,
        defaultMacros,
      );
    } catch (error) {
      console.error("Error rendering LaTeX:", error);
      return content;
    }
  }, []);

  return (
    <TooltipProvider>
      <MemoizedReactMarkdown
        {...props}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeInlineCodeProperty]}
        // @ts-ignore
        components={components}
        skipHtml={false}
      >
        {typeof children === "string" ? processContent(children) : children}
      </MemoizedReactMarkdown>
    </TooltipProvider>
  );
};

const SpaceTooltip: FC<
  SourceTooltipProps & { onHover: (open: boolean) => void }
> = ({ source, bbox, sourceNumber, onHover }) => {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { onSource } = useSourceStore();
  const { onClose } = useModalStore();
  const { data: fetchedContent, isLoading } = useGetContent(
    params.spaceId as string,
    source.trim(),
    { enabled: true },
    false,
  );

  const handleRoute = () => {
    if (fetchedContent) {
      if (sourceNumber) {
        const num = Number.parseFloat(sourceNumber);
        if (!isNaN(num)) {
          onSource(num, bbox);
        }
      }
      router.push(
        `/learn/space/${params.spaceId as string}/content/${fetchedContent.content_id}`,
      );
      onClose();
    }
  };

  return (
    <Tooltip delayDuration={100} onOpenChange={onHover}>
      <TooltipTrigger asChild>
        <sup
          onClick={handleRoute}
          className="text-[10px] px-[3.5px] py-[1px] rounded-full bg-primary/10 dark:bg-primary/20 text-primary/80 hover:text-foreground cursor-pointer"
        >
          s
        </sup>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={5} className="w-56">
        <div>
          {isLoading ? (
            <ContentCardSkeleton />
          ) : fetchedContent ? (
            <div onClick={handleRoute} className="cursor-pointer">
              <ContentCard
                dropdownItems={[]}
                showOptions={false}
                className="hover:shadow-none hover:drop-shadow-none pt-1.5 hover:scale-[1.01]"
                {...fetchedContent}
              />
              {sourceNumber && (
                <Badge
                  key={`source-badge-${sourceNumber}`}
                  variant="secondary"
                  className="cursor-pointer font-medium rounded-sm text-foreground/80 bg-foreground/5"
                >
                  {isVideoType(fetchedContent.type as ContentType) ||
                    isAudioType(fetchedContent.type as ContentType)
                    ? formatMilliseconds(
                      Number.parseFloat(sourceNumber as string),
                    )
                    : t("flashcards.page") +
                    " " +
                    parseInt(sourceNumber as string)}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Content not found</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

const GeneralTooltip: FC<
  SourceTooltipProps & { onHover: (open: boolean) => void }
> = ({ source, bbox, onHover }) => {
  const { onSource } = useSourceStore();

  const handleClick = () => {
    const numericContent = Number.parseFloat(source);
    if (!isNaN(numericContent)) {
      onSource(numericContent, bbox);
    }
  };

  return (
    <Tooltip delayDuration={100} onOpenChange={onHover}>
      <TooltipTrigger>
        <sup
          onClick={handleClick}
          className="text-[10px] px-[3.5px] py-[1px] rounded-full bg-primary/10 dark:bg-primary/20 text-primary/80 hover:text-foreground cursor-pointer"
        >
          s
        </sup>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={5}>
        <div>
          <p>
            {checkStringType(source) === "float"
              ? formatMilliseconds(Number.parseFloat(source))
              : source}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

const SourceTooltip: FC<SourceTooltipProps> = (props) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="inline">
      {props.type === "space" ? (
        <SpaceTooltip {...props} onHover={setIsHovered} />
      ) : (
        <GeneralTooltip {...props} onHover={setIsHovered} />
      )}
    </div>
  );
};

const MentionRenderer: FC<{ mention: string }> = ({ mention }) => {
  return (
    <span className="rounded-md bg-primary/10 px-1 py-px text-primary/80 dark:bg-primary/10 dark:text-primary">
      {mention}
    </span>
  );
};

export const MemoizedReactMarkdown: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className,
);

export default Markdown;
