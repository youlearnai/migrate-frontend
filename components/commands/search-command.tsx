import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useCommandStore } from "@/hooks/use-command-store";
import { useTranslation } from "react-i18next";
import { useGetHistory } from "@/query-hooks/user";
import { usePathname, useRouter } from "next/navigation";
import {
  Video,
  Text,
  Box,
  Mic,
  Play,
  AudioLines,
  MessageSquareText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import useAuth from "@/hooks/use-auth";
import { useUserSpaces } from "@/query-hooks/user";
import { isVideoType } from "@/lib/utils";

const SearchCommand = () => {
  const { user, loading: authLoading } = useAuth();
  const { isOpen, onClose, type, data, onOpen } = useCommandStore();
  const { data: history, isLoading: historyLoading } = useGetHistory(1, 20);
  const { data: spaces, isLoading: spacesLoading } = useUserSpaces();
  const isModalOpen = isOpen && type === "search";
  const { t } = useTranslation();
  const router = useRouter();

  // Open and close the magic bar command when the user cmd+k
  React.useEffect(() => {
    // Only add keyboard shortcuts if user is authenticated
    if (!user) return;

    const down = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "k" &&
        (e.metaKey || e.ctrlKey) &&
        !e.shiftKey
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (isModalOpen) {
          onClose();
        } else {
          onOpen("search");
        }
      }
    };

    document.addEventListener("keydown", down, { capture: true });
    return () =>
      document.removeEventListener("keydown", down, { capture: true });
  }, [isModalOpen, user, onClose, onOpen]);

  if (authLoading) return null;

  return (
    <CommandDialog open={isModalOpen} onOpenChange={onClose}>
      <CommandInput placeholder={t("search")} />
      <CommandList>
        <CommandEmpty>{t("noResults")}</CommandEmpty>
        {!user ? (
          <CommandGroup heading={t("authentication_required")}>
            <CommandItem disabled>
              {t("please_sign_in_to_view_history")}
            </CommandItem>
          </CommandGroup>
        ) : (
          <>
            <CommandGroup heading={t("sidebar_recents")}>
              {historyLoading || !history ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <CommandItem
                    key={index}
                    disabled
                    className="flex items-center gap-2 opacity-50"
                  >
                    <div className="h-3 w-3/4 animate-pulse rounded-md bg-secondary"></div>
                  </CommandItem>
                ))
              ) : history.content_history &&
                history.content_history.length > 0 ? (
                history.content_history.map((item, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => {
                      onClose();
                      if (item.space) {
                        router.push(
                          `/learn/space/${item.space.id}/content/${item.content.content_id}`,
                        );
                      } else {
                        router.push(
                          `/learn/content/${item.content.content_id}`,
                        );
                      }
                    }}
                    className="cursor-pointer justify-between flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isVideoType(item.content.type) ? (
                        <Play className="w-4 h-4 flex-shrink-0" />
                      ) : item.content.type === "stt" ? (
                        <Mic className="w-4 h-4 flex-shrink-0" />
                      ) : item.content.type === "audio" ? (
                        <AudioLines className="w-4 h-4 flex-shrink-0" />
                      ) : item.content.type === "conversation" ? (
                        <MessageSquareText className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <Text className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="truncate">
                        {item.content.title}
                        <p className="hidden">{index}</p>
                      </span>
                    </div>
                    <div>
                      {item.space && (
                        <Badge
                          variant="outline"
                          className="flex hover:bg-primary/50 transition-all duration-300 items-center gap-2"
                        >
                          <Box className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.space.name}</span>
                          <p className="hidden">{index}</p>
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))
              ) : (
                <CommandItem disabled>
                  {t("historyDashboard.loadingDetailed")}
                </CommandItem>
              )}
            </CommandGroup>
            <CommandGroup heading={t("sidebar.spaces")}>
              {spacesLoading || !spaces ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <CommandItem
                    key={index}
                    disabled
                    className="flex items-center gap-2 opacity-50"
                  >
                    <div className="h-3 w-3/4 animate-pulse rounded-md bg-secondary"></div>
                  </CommandItem>
                ))
              ) : spaces.length > 0 ? (
                spaces.map((space, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => {
                      onClose();
                      router.push(`/space/${space.space._id}`);
                    }}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Box className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{space.space.name}</span>
                  </CommandItem>
                ))
              ) : (
                <CommandItem disabled>
                  {t("addToSpace.noSpaceFound")}
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default SearchCommand;
