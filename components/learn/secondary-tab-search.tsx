import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchHighlightStore } from "@/hooks/use-search-highlight-store";
import { useTranslation } from "react-i18next";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";

const SecondaryTabSearch = () => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    totalMatches,
    activeMatchIndex,
    debouncedSetSearchQuery,
    resetSearch,
    nextMatch,
    previousMatch,
    isSearching,
  } = useSearchHighlightStore();

  useEffect(() => {
    inputValue.trim()
      ? debouncedSetSearchQuery(inputValue.trim())
      : resetSearch();
  }, [inputValue, debouncedSetSearchQuery, resetSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && totalMatches > 0) {
        e.preventDefault();
        e.shiftKey ? previousMatch() : nextMatch();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setInputValue("");
        resetSearch();
        inputRef.current?.blur();
      }
    },
    [totalMatches, nextMatch, previousMatch, resetSearch],
  );

  const clearSearch = useCallback(() => {
    setInputValue("");
    resetSearch();
  }, [resetSearch]);

  return (
    <div
      className={`flex w-full items-center gap-2 relative bg-primary/5 dark:bg-primary/10 rounded-lg transition-all duration-200 h-10 md:hidden px-4 sm:px-0`}
    >
      <div className="relative flex items-center w-full">
        <Search className="absolute left-2 h-4 w-4 text-muted-foreground/80" />
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("search2.findInText")}
          className=" text-sm font-medium pl-8 h-9 w-full rounded-sm bg-transparent outline-none focus:outline-none focus:ring-none focus:ring-offset-0 focus-visible:outline-none transition-all duration-200 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground/80"
        />
      </div>

      {isSearching && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearSearch}
          className="h-6 w-6 mr-1 text-primary/80"
        >
          <X className="h-3 w-3 text-primary/80" />
        </Button>
      )}

      {isSearching && (
        <div className="flex items-center">
          <div className="text-sm mx-1 text-muted-foreground whitespace-nowrap">
            {totalMatches > 0 ? (
              `${activeMatchIndex + 1} / ${totalMatches}`
            ) : (
              <span>{t("noResults")}</span>
            )}
          </div>

          <div className="flex">
            <Button
              variant="ghost"
              className="h-fit px-0 w-6 text-primary/80"
              size="icon"
              onClick={previousMatch}
              disabled={totalMatches === 0}
              title={t("search.previousMatch") + " (Shift+Enter)"}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="h-fit mr-2 w-6 text-primary/80"
              size="icon"
              onClick={nextMatch}
              disabled={totalMatches === 0}
              title={t("search.nextMatch") + " (Enter)"}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecondaryTabSearch;
