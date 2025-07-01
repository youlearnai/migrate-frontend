import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const BoardPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (num: number) => void;
}) => {
  const { t } = useTranslation();

  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const getPageNumbers = () => {
    const pageNumbers = [];

    if (safeTotalPages <= 5) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);

      if (safeCurrentPage > 3) {
        pageNumbers.push(t("..."));
      }

      if (safeCurrentPage > 2) {
        pageNumbers.push(safeCurrentPage - 1);
      }

      if (safeCurrentPage !== 1 && safeCurrentPage !== safeTotalPages) {
        pageNumbers.push(safeCurrentPage);
      }

      if (safeCurrentPage < safeTotalPages - 1) {
        pageNumbers.push(safeCurrentPage + 1);
      }

      if (safeCurrentPage < safeTotalPages - 2) {
        pageNumbers.push("...");
      }

      pageNumbers.push(safeTotalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="flex justify-center space-x-2">
      <Button
        variant="outline"
        onClick={() => onPageChange(safeCurrentPage - 1)}
        disabled={safeCurrentPage === 1}
      >
        {t("boardPagination.previous")}
      </Button>
      {getPageNumbers().map((page, index) => (
        <div className="hidden md:block" key={index}>
          {page === t("...") ? (
            <span className="px-3 py-2">{t("...")}</span>
          ) : (
            <Button
              variant={safeCurrentPage === page ? "default" : "outline"}
              onClick={() => onPageChange(page as number)}
            >
              {page}
            </Button>
          )}
        </div>
      ))}
      <Button
        variant="outline"
        onClick={() => onPageChange(safeCurrentPage + 1)}
        disabled={safeCurrentPage === safeTotalPages}
      >
        {t("boardPagination.next")}
      </Button>
    </div>
  );
};

export default BoardPagination;
