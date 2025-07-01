import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Content, DropdownItem, SortableTableRowProps } from "@/lib/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Mic,
  Play,
  Text,
  Check,
  Music,
  AudioLines,
  MessageSquareText,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Options from "./options-dropdown";
import { Checkbox } from "../ui/checkbox";

function SortableTableRow({
  item,
  index,
  dropdownItems,
  isDragging,
  isTestMode,
  isSelected,
  onContentClick,
}: SortableTableRowProps & {
  isTestMode?: boolean;
  isSelected?: boolean;
  onContentClick?: (
    e: React.MouseEvent<HTMLElement>,
    contentId: string,
  ) => void;
}) {
  const params = useParams();
  const router = useRouter();
  const [isTouching, setIsTouching] = useState(false);
  const touchTimeout = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.content_id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : isTestMode ? "pointer" : "pointer",
  };

  const handleTitleClick = (
    e: React.MouseEvent<HTMLTableCellElement, MouseEvent>,
  ) => {
    if (isTestMode && onContentClick) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      onContentClick(e, item.content_id);
      return;
    }

    // Only handle mouse clicks, not touch events
    if (
      (e.nativeEvent as PointerEvent).pointerType !== "touch" &&
      !isDragging
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      router.push(
        `/learn/space/${params.spaceId as string}/content/${item.content_id}`,
      );
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // If in test mode, prevent default behavior
    if (isTestMode) return;

    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    hasMoved.current = false;

    touchTimeout.current = setTimeout(() => {
      if (!hasMoved.current) {
        setIsTouching(true);
      }
    }, 150);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isTestMode || !touchStartPos.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    // If moved more than 10px, consider it a move
    if (deltaX > 10 || deltaY > 10) {
      hasMoved.current = true;
      if (touchTimeout.current) {
        clearTimeout(touchTimeout.current);
      }
      setIsTouching(false);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isTestMode) {
      if (onContentClick) {
        onContentClick(
          e as unknown as React.MouseEvent<HTMLElement>,
          item.content_id,
        );
      }
      return;
    }

    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
    }

    // If it was a tap (no movement), navigate
    if (!hasMoved.current && !isDragging) {
      router.push(
        `/learn/space/${params.spaceId as string}/content/${item.content_id}`,
      );
    }

    touchStartPos.current = null;
    setIsTouching(false);
  };

  useEffect(() => {
    return () => {
      if (touchTimeout.current) {
        clearTimeout(touchTimeout.current);
      }
    };
  }, []);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`transition-colors duration-200 relative ${
        isDragging ? "bg-primary/5" : ""
      } ${isTouching ? "bg-primary/10" : ""} ${isSelected ? "bg-muted/70" : ""} hover:bg-primary/5`}
      {...attributes}
      {...listeners}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        if (touchTimeout.current) {
          clearTimeout(touchTimeout.current);
        }
        setIsTouching(false);
      }}
    >
      <TableCell onClick={handleTitleClick} className="font-medium select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {isTestMode && (
              <span className="text-primary w-4 h-4 mr-2 flex-shrink-0">
                <Checkbox checked={isSelected} />
              </span>
            )}
            <span>{getTypeIcon(item.type)}</span>
            <span className="truncate max-w-[200px] sm:max-w-[400px] md:max-w-[320px] xl:max-w-[460px] 2xl:max-w-[800px] block">
              {item.title}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell select-none">
        {new Date(item.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell className="hidden md:table-cell capitalize select-none">
        {item.visibility}
      </TableCell>
      <TableCell className="text-right w-[50px]">
        {dropdownItems?.length > 0 && (
          <Options
            aria-label="options menu"
            contentUrl={item.content_url}
            contentId={item.content_id}
            contentTitle={item.title}
            spaceId={params.spaceId as string}
            dropdownItems={dropdownItems}
            visibility={item.visibility}
            className="xl:opacity-100 cursor-pointer h-8 w-8 p-2 hover:bg-primary/5 rounded-full ml-auto md:mul-0 dark:text-white"
          />
        )}
      </TableCell>
    </TableRow>
  );
}

const getTypeIcon = (type: Content["type"]) => {
  switch (type) {
    case "youtube":
    case "video":
      return <Play className="w-4 h-4 flex-shrink-0" />;
    case "stt":
      return <Mic className="w-4 h-4 flex-shrink-0" />;
    case "audio":
      return <AudioLines className="w-4 h-4 flex-shrink-0" />;
    case "conversation":
      return <MessageSquareText className="w-4 h-4 flex-shrink-0" />;
    default:
      return <Text className="w-4 h-4 flex-shrink-0" />;
  }
};

export function ContentTable({
  items,
  dropdownItems,
  activeId,
  isTestMode,
  selectedContents = [],
  onContentClick,
}: {
  items: Content[];
  dropdownItems: DropdownItem[];
  activeId: string | null;
  isTestMode?: boolean;
  selectedContents?: Content[];
  onContentClick?: (
    e: React.MouseEvent<HTMLElement>,
    contentId: string,
  ) => void;
}) {
  const { t } = useTranslation();

  const isSelected = (contentId: string) => {
    return (
      isTestMode && selectedContents.some((c) => c.content_id === contentId)
    );
  };

  return (
    <Table>
      <TableCaption></TableCaption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>{t("contentTable.title")}</TableHead>
          <TableHead className="hidden md:table-cell whitespace-nowrap">
            {t("contentTable.addedOn")}
          </TableHead>
          <TableHead className="hidden md:table-cell">
            {t("contentTable.visibility")}
          </TableHead>
          <TableHead className="text-right text-muted-foreground w-[50px] whitespace-nowrap">
            {t("contentTable.itemCount", {
              count: items.length,
              item:
                items.length === 1
                  ? t("contentTable.item")
                  : t("contentTable.items"),
            })}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <SortableTableRow
            key={item.content_id}
            item={item}
            index={index}
            dropdownItems={dropdownItems}
            isDragging={activeId === item.content_id}
            isTestMode={isTestMode}
            isSelected={isSelected(item.content_id)}
            onContentClick={onContentClick}
          />
        ))}
      </TableBody>
    </Table>
  );
}
