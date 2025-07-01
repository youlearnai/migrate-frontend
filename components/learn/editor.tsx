import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUpdateNotes } from "@/query-hooks/content";
import { DefaultBlockSchema, PartialBlock } from "@blocknote/core";
import {
  SideMenu,
  SideMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { debounce } from "lodash";
import { Check, Copy } from "lucide-react";
import { Geist } from "next/font/google";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";

const geist = Geist({ subsets: ["latin"] });

export default function Editor({
  notes,
}: {
  notes: PartialBlock<DefaultBlockSchema>[];
}) {
  const params = useParams();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [, copyToClipboard] = useCopyToClipboard();
  const editor = useCreateBlockNote({
    initialContent: notes,
    placeholders: {
      default: t("learn.editor.placeholder"),
    },
    domAttributes: {
      editor: {
        class: geist.className,
      },
    },
  });
  const contentId = params.contentId as string;
  const { mutate: updateNotes, isPending } = useUpdateNotes();

  const handleUpdateNotes = useMemo(
    () =>
      debounce(() => {
        const newBlocks = editor.document;
        updateNotes({
          contentId: contentId,
          note: newBlocks,
        });
      }, 1000),
    [editor, contentId, updateNotes],
  );

  const handleCopyNotes = async () => {
    try {
      const markdown = await editor.blocksToMarkdownLossy();
      const success = await copyToClipboard(markdown);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      } else {
        throw new Error("Copy failed");
      }
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error(t("notes.copyFailed"));
    }
  };

  return (
    <div className="h-full md:h-[calc(100vh-150px)] overflow-y-auto md:mx-[-20] px-4 sm:px-0">
      <div className="flex justify-end items-center gap-2 md:mx-[20px]">
        {/* <Badge
          variant="outline"
          className="text-muted-foreground font-medium border-0 text-xs py-0 px-2"
        >
          {isPending ? "Saving..." : "Saved"}
        </Badge> */}
        <Button
          variant="outline"
          onClick={handleCopyNotes}
          className="text-xs py-1 px-2 h-auto text-muted-foreground border-none"
          title={t("notes.copyToClipboard")}
        >
          {copied ? (
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              {t("notes.copied")}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Copy className="h-3 w-3" />
              {t("notes.copyNotes")}
            </span>
          )}
        </Button>
      </div>
      <BlockNoteView
        editor={editor}
        className="bg-transparent [&_.bn-side-menu:hover_svg]:text-primary/40 [&_.bn-side-menu_svg]:h-5 [&_.bn-side-menu_svg]:w-5 [&_.bn-container]:font-medium [&_p]:font-medium [&_.bn-block-content>*]:w-full"
        theme="light"
        onChange={handleUpdateNotes}
        sideMenu={false}
      >
        <SideMenuController sideMenu={(props) => <SideMenu {...props} />} />
      </BlockNoteView>
    </div>
  );
}
