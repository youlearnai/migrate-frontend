import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type {
  ConcatChunk,
  Content,
  ContentType,
  FlashcardsResponseChunk,
  NavigationResponseChunk,
  QuizResponseChunk,
  RDKitDiagramResponseChunk,
  ResponseChunk,
  ResponseResponseChunk,
  ThoughtResponseChunk,
  WebSearchContent,
  WebSearchSourceChunk,
  WhiteboardResponseChunk,
  WhiteboardType,
} from "@/lib/types";
import { cn, convertStringToBbox, formatMilliseconds } from "@/lib/utils";
import { ArrowRight, ChevronUp, Expand, Plus } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Markdown from "../global/markdown";
import { AdvancedMessage } from "./message";
import ChatOptions from "./chat-options";
import ReactPlayer from "react-player";
import { useAddContent, useGetContent } from "@/query-hooks/content";
import { useGetSpace } from "@/query-hooks/space";
import { useInView } from "react-intersection-observer";
import Spinner from "../global/spinner";
import GenUiQuiz from "./gen-ui-quiz";
import { useSourceStore } from "@/hooks/use-source-store";
import GenUiFlashcards from "./gen-ui-flashcards";
import { TextShimmer } from "../motion-primitives/text-shimmer";
import React from "react";
import { MIN_CONSECUTIVE_SOURCES_TO_COMBINE } from "@/lib/utils";
import WhiteBoardDiagram from "./white-board-diagram";
import RdkitDiagramChunk from "../diagrams/rdkit-diagram";

const ALLOWED_WEB_SEARCH_TYPES_FOR_CONCAT = [
  "webpage",
  "pdf",
  "pptx",
  "arxiv",
  "docx",
  "text",
] as const;

const canConcatenate = (chunk: ResponseChunk): chunk is ConcatChunk => {
  if (
    chunk.type === "response" ||
    chunk.type === "source" ||
    chunk.type === "space_source"
  ) {
    return true;
  }
  if (chunk.type === "web_search_source") {
    const webChunk = chunk as WebSearchSourceChunk;
    return ALLOWED_WEB_SEARCH_TYPES_FOR_CONCAT.includes(
      webChunk.content_dict
        .type as (typeof ALLOWED_WEB_SEARCH_TYPES_FOR_CONCAT)[number],
    );
  }
  return false;
};

// Check if a chunk is a source type (source, space_source, or allowed web_search_source)
const isSourceChunk = (chunk: ResponseChunk): boolean => {
  if (chunk.type === "source" || chunk.type === "space_source") {
    return true;
  }
  if (chunk.type === "web_search_source") {
    const webChunk = chunk as WebSearchSourceChunk;
    return ALLOWED_WEB_SEARCH_TYPES_FOR_CONCAT.includes(
      webChunk.content_dict
        .type as (typeof ALLOWED_WEB_SEARCH_TYPES_FOR_CONCAT)[number],
    );
  }
  return false;
};

const WHITEBOARD_RENDERERS: Record<
  WhiteboardType,
  React.FC<{ chunk: WhiteboardResponseChunk }>
> = {
  "text/markdown": ({ chunk }) => <Markdown>{chunk.content}</Markdown>,
  "text/html": ({ chunk }) => (
    <WhiteBoardDiagram data={chunk?.pre_delta as string} />
  ),
  xml: ({ chunk }) => <WhiteBoardDiagram data={chunk.content} />,
  "application/react": ({ chunk }) => <div>{chunk.content}</div>,
};

const QuizChunk: React.FC<{
  chunk: QuizResponseChunk;
  chatMessageId: string;
  content?: Content;
}> = ({ chunk, chatMessageId, content }) => {
  return (
    <GenUiQuiz chunk={chunk} chatMessageId={chatMessageId} content={content} />
  );
};

const NavigationChunk: React.FC<{
  chunk: NavigationResponseChunk;
  content: Content;
  handleNavigation: () => void;
}> = ({ chunk, content, handleNavigation }) => {
  const { t } = useTranslation();

  return (
    <Button
      onClick={handleNavigation}
      size="sm"
      variant="outline"
      className="w-fit gap-1 text-sm text-muted-foreground"
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sm:max-w-xs max-w-[10rem] truncate">
        <span>{t("jumpto")}</span> <span>"{chunk.title}"</span>
      </span>
    </Button>
  );
};

const ThoughtChunk: React.FC<{ chunk: ThoughtResponseChunk }> = ({ chunk }) => {
  const { t } = useTranslation();

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem className="border-none" value="thinking">
        <AccordionTrigger
          showChevron={false}
          className="group text-sm w-fit p-0 text-muted-foreground hover:no-underline"
        >
          <div className="flex items-center gap-2">
            {chunk.delta ? (
              <TextShimmer duration={1}>
                {chunk.title || t("thinking")}
              </TextShimmer>
            ) : (
              <span className={cn("text-muted-foreground")}>
                {chunk.title || t("thinking")}
              </span>
            )}
            <ChevronUp className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-0 mt-0.5">
          <Markdown className="text-sm text-muted-foreground whitespace-pre-wrap font-normal">
            {chunk.content}
          </Markdown>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const ResponseChunkComponent: React.FC<{
  chunk: ResponseResponseChunk;
  contentType?: ContentType;
}> = ({ chunk, contentType }) => {
  const pathname = usePathname();
  const isSpace = pathname.startsWith("/space/");
  const isExam = pathname.startsWith("/exam/");

  const type =
    contentType === "conversation" || isExam || isSpace ? "space" : "general";

  const sourcesRenderer = React.useMemo(
    () => ({
      sources: ({ children }: { children: React.ReactNode }) => {
        return <span className="inline">{children}</span>;
      },
    }),
    [],
  );

  return (
    <Markdown type={type} className="inline" components={sourcesRenderer}>
      {chunk.content}
    </Markdown>
  );
};

const WhiteboardChunk: React.FC<{ chunk: WhiteboardResponseChunk }> = ({
  chunk,
}) => {
  if (!chunk.wtype) return null;
  const Renderer = WHITEBOARD_RENDERERS[chunk.wtype as WhiteboardType];
  return Renderer ? <Renderer chunk={chunk} /> : null;
};

const WebSearchContent: React.FC<{ content: WebSearchContent }> = ({
  content,
}) => {
  const { t } = useTranslation();
  const { mutate: addToSpace, isPending } = useAddContent();
  const params = useParams();
  const spaceId = params.spaceId as string;
  const router = useRouter();
  const { data: space } = useGetSpace(spaceId, { enabled: !!spaceId });
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const isSpacePage = !!params.spaceId && !params.contentId;

  const checkSpaceContent = (contentUrl: string) => {
    if (space?.contents.some((c) => c.content_url === contentUrl)) {
      return true;
    }
    return false;
  };

  const handleAdd = (contentUrl: string, redirect: boolean = false) => {
    addToSpace(
      {
        contentURLs: [contentUrl],
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

  switch (content.type) {
    case "youtube":
      return (
        <div className="w-full h-full flex flex-col gap-2 gap-y-3 my-2">
          <div
            ref={ref}
            className={cn(
              "aspect-video bg-muted w-full rounded-md overflow-hidden",
              !isSpacePage && "md:w-[680px] xl:w-[526px]",
            )}
            style={{ minHeight: "200px" }}
          >
            {inView && (
              <ReactPlayer
                url={content.url}
                height="100%"
                width="100%"
                controls
                muted
              />
            )}
          </div>
          {(() => {
            const isInSpace = checkSpaceContent(content.url);
            let ButtonIcon: React.ElementType = Plus;
            let buttonText = t("addContent.addContentButton");

            if (isInSpace) {
              ButtonIcon = ArrowRight;
              buttonText = t("goToContent");
            } else if (isPending && checkSpaceContent(content.url)) {
              ButtonIcon = Spinner;
              buttonText = t("examBoard.timer.loading");
            } else if (isPending) {
              ButtonIcon = Spinner;
              buttonText = t("adding");
            }

            return (
              <Button
                onClick={() => handleAdd(content.url, isInSpace)}
                size="sm"
                variant="plain"
                className="bg-neutral-50 dark:bg-neutral-900 w-fit gap-1.5 flex border-2 border-dashed border-primary/10 justify-start items-center p-2 pr-3 h-fit truncate text-primary/80 hover:text-primary hover:bg-primary/5 hover:border-primary/10 underline-none text-left"
                disabled={isPending}
              >
                <ButtonIcon className="h-4 w-4" />
                <span key={`buttonText-${content.source_id}`}>
                  {buttonText}
                </span>
              </Button>
            );
          })()}
        </div>
      );
    default:
      return null;
  }
};

const WebSearchSourceChunk: React.FC<{ chunk: WebSearchSourceChunk }> = ({
  chunk,
}) => {
  return (
    <div className="w-full h-full">
      <WebSearchContent content={chunk.content_dict} />
    </div>
  );
};

const FlashcardsChunk: React.FC<{
  chunk: FlashcardsResponseChunk;
  content: Content;
  chatMessageId: string;
}> = ({ chunk, content, chatMessageId }) => {
  return (
    <div className={cn("w-full h-full")}>
      <GenUiFlashcards
        chunk={chunk}
        content={content}
        chatMessageId={chatMessageId}
      />
    </div>
  );
};

const ChunkRenderer: React.FC<{
  chunk: ResponseChunk;
  chatMessageId: string;
  content: Content;
}> = ({ chunk, chatMessageId, content }) => {
  switch (chunk.type) {
    case "thought":
    case "flashcards_thought":
    case "calculation_thought":
    case "web_search_thought":
    case "summary_thought":
    case "learn_thought":
    case "quiz_thought":
    case "whiteboard_thought":
    case "rdkit_diagram_thought":
      return <ThoughtChunk chunk={chunk as ThoughtResponseChunk} />;
    case "response":
      return (
        <ResponseChunkComponent
          contentType={content?.type}
          chunk={chunk as ResponseResponseChunk}
        />
      );
    case "whiteboard":
      return <WhiteboardChunk chunk={chunk as WhiteboardResponseChunk} />;
    case "quiz":
      return (
        <QuizChunk
          chunk={chunk as QuizResponseChunk}
          chatMessageId={chatMessageId}
          content={content}
        />
      );
    case "web_search_source":
      return <WebSearchSourceChunk chunk={chunk as WebSearchSourceChunk} />;
    case "flashcards":
      return (
        <FlashcardsChunk
          chunk={chunk as FlashcardsResponseChunk}
          content={content}
          chatMessageId={chatMessageId}
        />
      );
    case "rdkit_diagram":
      return <RdkitDiagramChunk chunk={chunk as RDKitDiagramResponseChunk} />;
    default:
      return null;
  }
};

const concatenateChunks = (
  lastChunk: ConcatChunk,
  newChunk: ConcatChunk,
): ConcatChunk => {
  if (newChunk.type === "web_search_source") {
    const cleanedContent = newChunk.content.replace("【", "").replace("】", "");
    return {
      ...lastChunk,
      content: `${lastChunk.content}${cleanedContent}`,
    };
  }

  let bboxString = "";
  if (
    (newChunk.type === "source" || newChunk.type === "space_source") &&
    newChunk.bbox
  ) {
    bboxString = `, bbox: ${newChunk.bbox}`;
  }

  let sourceString = "";
  if (newChunk.type === "space_source" && newChunk.source) {
    sourceString = `, source: ${newChunk.source}`;
  }

  return {
    ...lastChunk,
    content: `${lastChunk.content}${
      newChunk.content ? ` ${newChunk.content.slice(0, -1)}` : ""
    }${bboxString}${sourceString}${
      newChunk.content ? newChunk.content.slice(-1) : ""
    }`,
  };
};

const groupMessages = (chunks: ResponseChunk[]): ResponseChunk[][] => {
  const preprocessedChunks: ResponseChunk[] = [];
  let sourceBuffer: ResponseChunk[] = [];

  chunks.forEach((chunk, index) => {
    if (isSourceChunk(chunk)) {
      sourceBuffer.push(chunk);
    } else {
      if (sourceBuffer.length >= MIN_CONSECUTIVE_SOURCES_TO_COMBINE) {
        const sourcesContent = sourceBuffer
          .map((srcChunk) => {
            if (srcChunk.type === "web_search_source") {
              const cleanedContent = srcChunk.content.replace(/【|】/g, "");
              return cleanedContent;
            }
            let content = srcChunk.content;
            if (
              (srcChunk.type === "source" ||
                srcChunk.type === "space_source") &&
              srcChunk.bbox
            ) {
              const lastBracket = content.lastIndexOf("】");
              if (lastBracket !== -1) {
                content =
                  content.slice(0, lastBracket) + `, bbox: ${srcChunk.bbox}】`;
              }
            }
            if (srcChunk.type === "space_source" && srcChunk.source) {
              const lastBracket = content.lastIndexOf("】");
              if (lastBracket !== -1) {
                content =
                  content.slice(0, lastBracket) +
                  `, source: ${srcChunk.source}】`;
              }
            }
            return content;
          })
          .join("");

        preprocessedChunks.push({
          type: "response",
          content: `<sources>${sourcesContent}</sources>`,
        } as ResponseResponseChunk);
      } else {
        preprocessedChunks.push(...sourceBuffer);
      }
      sourceBuffer = [];
      preprocessedChunks.push(chunk);
    }
  });

  if (sourceBuffer.length >= MIN_CONSECUTIVE_SOURCES_TO_COMBINE) {
    const sourcesContent = sourceBuffer
      .map((srcChunk) => {
        if (srcChunk.type === "web_search_source") {
          const cleanedContent = srcChunk.content.replace(/【|】/g, "");
          return cleanedContent;
        }
        let content = srcChunk.content;
        if (
          (srcChunk.type === "source" || srcChunk.type === "space_source") &&
          srcChunk.bbox
        ) {
          const lastBracket = content.lastIndexOf("】");
          if (lastBracket !== -1) {
            content =
              content.slice(0, lastBracket) + `, bbox: ${srcChunk.bbox}】`;
          }
        }
        if (srcChunk.type === "space_source" && srcChunk.source) {
          const lastBracket = content.lastIndexOf("】");
          if (lastBracket !== -1) {
            content =
              content.slice(0, lastBracket) + `, source: ${srcChunk.source}】`;
          }
        }
        return content;
      })
      .join("");

    preprocessedChunks.push({
      type: "response",
      content: `<sources>${sourcesContent}</sources>`,
    } as ResponseResponseChunk);
  } else {
    preprocessedChunks.push(...sourceBuffer);
  }

  return preprocessedChunks.reduce<ResponseChunk[][]>((groups, chunk) => {
    const lastGroup = groups[groups.length - 1];
    const lastChunk = lastGroup?.[lastGroup.length - 1];

    const shouldConcatenate =
      lastGroup &&
      canConcatenate(chunk) &&
      lastChunk &&
      canConcatenate(lastChunk);

    if (shouldConcatenate) {
      lastGroup[lastGroup.length - 1] = concatenateChunks(
        lastChunk as ConcatChunk,
        chunk as ConcatChunk,
      );
    } else {
      groups.push([chunk]);
    }

    return groups;
  }, []);
};

const GenUI: React.FC<{
  chunks: ResponseChunk[];
  className?: string;
  chatMessageId: string;
}> = ({ chunks = [], className, chatMessageId }) => {
  const params = useParams();
  const { data: content, isLoading: isContentLoading } = useGetContent(
    params.spaceId as string,
    params.contentId as string,
    {
      enabled: !!params.contentId,
    },
  );
  const { onSource } = useSourceStore();

  const contentString = chunks
    ? chunks
        .map((chunk) => (chunk.type === "response" ? chunk.content : ""))
        .join(" ")
    : "";

  if (!chunks || isContentLoading) return null;

  const messageGroups = groupMessages(chunks);

  const handleNavigation = (source: number, bbox?: string) => {
    const bboxData = bbox ? convertStringToBbox(bbox) : null;
    onSource(source, bboxData);
  };

  return (
    <div className="flex flex-col w-full">
      {messageGroups.map((group, groupIndex) => (
        <div className="w-full" key={groupIndex}>
          {group.map((chunk, index) => (
            <AdvancedMessage
              className={cn(
                className,
                chunk.type === "thought" && "px-0 border-none",
                chunk.type === "web_search_thought" && "px-0 border-none",
                chunk.type === "learn_thought" && "px-0 border-none",
                chunk.type === "quiz_thought" && "px-0 border-none",
                chunk.type === "whiteboard_thought" && "px-0 border-none",
                chunk.type === "calculation_thought" && "px-0 border-none",
                chunk.type === "web_search_source" && "w-full",
                chunk.type === "quiz" && "w-full",
                chunk.type === "response" && "w-full",
                chunk.type === "flashcards" && "w-full",
                chunk.type === "whiteboard" && "w-full",
                chunk.type === "rdkit_diagram" && "w-full",
              )}
              type="ai"
              id={`${groupIndex}`}
              key={groupIndex}
            >
              <ChunkRenderer
                key={index}
                chunk={chunk}
                chatMessageId={chatMessageId}
                content={content as Content}
              />
            </AdvancedMessage>
          ))}
        </div>
      ))}
      {contentString && (
        <ChatOptions
          content={contentString}
          className="mt-1 mb-4"
          renderNavigateButton={() => {
            const navigateChunk = chunks.find(
              (chunk) => chunk.type === "navigate",
            ) as NavigationResponseChunk | undefined;
            if (!navigateChunk) return null;
            return (
              <NavigationChunk
                chunk={navigateChunk as NavigationResponseChunk}
                content={content as Content}
                handleNavigation={() =>
                  handleNavigation(navigateChunk.source, navigateChunk.bbox)
                }
              />
            );
          }}
        />
      )}
    </div>
  );
};

export default GenUI;
