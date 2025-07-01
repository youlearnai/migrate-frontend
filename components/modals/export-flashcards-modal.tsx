"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModalStore } from "@/hooks/use-modal-store";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";

export default function ExportFlashcardsModal() {
  const { t } = useTranslation();
  const { isOpen, onClose, type, data } = useModalStore();
  const isModalOpen = isOpen && type === "exportFlashcards";
  const [_, copy] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);
  const { flashcards, keyConcepts } = data;
  const params = useParams();

  const addToPosthog = (exportType: "text" | "csv") => {
    posthog.capture("export_flashcards", {
      export_type: exportType,
      contentId: params.contentId,
    });
  };

  const exportPreview = useMemo(() => {
    if (!flashcards || flashcards.length === 0) {
      return "";
    }
    return flashcards
      .map((fc) => {
        const hint = fc.hint ? `${t("flashcards.hint")}: ${fc.hint}` : "";
        const explanation = fc.explanation
          ? `${t("flashcards.form.explanation")}: ${fc.explanation}`
          : "";
        const source = fc.source
          ? `${t("flashcards.form.source")}: ${fc.source}`
          : "";
        const keyConceptName = keyConcepts?.find(
          (kc) => kc._id === fc.key_concept?.id,
        )?.concept;
        const keyConcept = keyConceptName
          ? `${t("flashcards.form.keyConcept")}: ${keyConceptName}`
          : "";

        const additionalFields = [hint, explanation, source, keyConcept]
          .filter(Boolean)
          .join(" | ");
        const additionalInfo = additionalFields ? `\n${additionalFields}` : "";

        return `${t("flashcards.question")}: ${fc.question}\n${t("flashcards.answer")}: ${fc.answer}${additionalInfo}`;
      })
      .join("\n\n");
  }, [flashcards, keyConcepts, t]);

  const handleCopyText = () => {
    try {
      copy(exportPreview);
      addToPosthog("text");
      setCopied(true);
      toast.success(t("flashcards.copied"));
      setTimeout(() => setCopied(false), 1000);
    } catch (error) {
      toast.error(t("errorModal.defaultTitle"));
    }
  };

  const handleDownloadCSV = React.useCallback(() => {
    if (!flashcards || flashcards.length === 0) {
      return;
    }
    const headers = [
      t("flashcards.question"),
      t("flashcards.answer"),
      t("flashcards.hint"),
      t("flashcards.form.explanation"),
      t("flashcards.form.keyConcept"),
      t("flashcards.form.source"),
      t("flashcards.starred"),
    ];
    const csvRows = [headers.join(",")];
    flashcards.forEach((fc) => {
      const escapeCSV = (text: string) => {
        if (!text) return "";
        const escaped = text.replace(/"/g, '""');
        return escaped.includes(",") ||
          escaped.includes("\n") ||
          escaped.includes('"')
          ? `"${escaped}"`
          : escaped;
      };

      const keyConceptName =
        keyConcepts?.find((kc) => kc._id === fc.key_concept?.id)?.concept || "";

      const row = [
        escapeCSV(fc.question ?? ""),
        escapeCSV(fc.answer ?? ""),
        escapeCSV(fc.hint ?? ""),
        escapeCSV(fc.explanation ?? ""),
        escapeCSV(keyConceptName),
        fc.source ? fc.source.toString() : "",
        fc.is_starred ? "Yes" : "No",
      ].join(",");
      csvRows.push(row);
    });

    const csvBlob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "flashcards-export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToPosthog("csv");
    onClose();
  }, [flashcards, keyConcepts, t, addToPosthog, onClose]);

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("flashcards.exportTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-center sm:text-left text-sm text-muted-foreground">
              {t("flashcards.exportPreview")}
            </p>
            <p className="text-center sm:text-left text-sm text-muted-foreground">
              {flashcards?.length} {t("learnTabs.flashcardsTab")}
            </p>
          </div>
          <div className="rounded-lg border">
            <div className="max-h-[40vh] overflow-auto rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="hover:bg-background">
                    <TableHead className="w-1/4 bg-background">
                      {t("flashcards.question")}
                    </TableHead>
                    <TableHead className="w-1/4 bg-background">
                      {t("flashcards.answer")}
                    </TableHead>
                    <TableHead className="w-1/6 bg-background">
                      {t("flashcards.hint")}
                    </TableHead>
                    <TableHead className="w-1/4 bg-background">
                      {t("flashcards.form.explanation")}
                    </TableHead>
                    <TableHead className="w-1/6 bg-background">
                      {t("flashcards.form.keyConcept")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flashcards?.map((fc, index) => (
                    <TableRow key={index}>
                      <TableCell className="align-top border-l-0 border-r-0">
                        {fc.question}
                      </TableCell>
                      <TableCell className="align-top border-l-0 border-r-0">
                        {fc.answer}
                      </TableCell>
                      <TableCell className="align-top border-l-0 border-r-0 text-muted-foreground text-sm">
                        {fc.hint || "-"}
                      </TableCell>
                      <TableCell className="align-top border-l-0 border-r-0 text-muted-foreground text-sm">
                        {fc.explanation || "-"}
                      </TableCell>
                      <TableCell className="align-top border-l-0 border-r-0 text-muted-foreground text-sm">
                        {keyConcepts?.find(
                          (kc) => kc._id === fc.key_concept?.id,
                        )?.concept || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCopyText}>
            {copied ? t("flashcards.copied") : t("flashcards.copyText")}
          </Button>
          <Button onClick={handleDownloadCSV}>
            {t("flashcards.exportCSV")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
