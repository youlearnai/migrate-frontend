import React, { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import {
  SearchResult,
  calculateHighlightRects,
  usePdf,
  usePdfJump,
  useSearch,
} from "@anaralabs/lector";

interface ResultItemProps {
  result: SearchResult;
  originalSearchText: string;
}

export const ResultItem = ({ result, originalSearchText }: ResultItemProps) => {
  const { jumpToHighlightRects } = usePdfJump();
  const getPdfPageProxy = usePdf((state) => state.getPdfPageProxy);

  const onClick = async () => {
    const pageProxy = getPdfPageProxy(result.pageNumber);
    const rects = await calculateHighlightRects(pageProxy, {
      pageNumber: result.pageNumber,
      text: result.text,
      matchIndex: result.matchIndex,
      searchText: originalSearchText, // Pass searchText for exact term highlighting
    });
    jumpToHighlightRects(rects, "pixels");
  };

  return (
    <div
      className="flex py-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 flex-col cursor-pointer p-2 font-sans"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900 dark:text-neutral-100">
          {result.text}
        </p>
      </div>
      <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
        <span className="ml-auto text-xs">Page {result.pageNumber}</span>
      </div>
    </div>
  );
};

export function SearchUI() {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText] = useDebounce(searchText, 500);
  const [limit, setLimit] = useState(5);
  const { searchResults: results, search } = useSearch();

  useEffect(() => {
    setLimit(5);
    search(debouncedSearchText, { limit: 5 });
  }, [debouncedSearchText, search]);

  const handleLoadMore = async () => {
    const newLimit = limit + 5;
    await search(debouncedSearchText, { limit: newLimit });
    setLimit(newLimit);
  };

  return (
    <div className="flex flex-col w-full h-full font-sans text-sm border-r">
      <div className="px-2 py-2 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search in document..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-primary dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100 text-sm placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        <div className="py-4">
          {!searchText ? null : !results.exactMatches.length &&
            !results.fuzzyMatches.length ? (
            <div className="text-center py-4 text-neutral-400 dark:text-neutral-500 text-sm">
              No results found
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {results.exactMatches.length > 0 && (
                <div className="space-y-2">
                  <h3 className="px-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Exact Matches
                  </h3>
                  <div className="dark:divide-neutral-700">
                    {results.exactMatches.map((result) => (
                      <ResultItem
                        key={`${result.pageNumber}-${result.matchIndex}`}
                        result={result}
                        originalSearchText={searchText}
                      />
                    ))}
                  </div>
                </div>
              )}

              {results.fuzzyMatches.length > 0 && (
                <div className="space-y-2">
                  <h3 className="px-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Similar Matches
                  </h3>
                  <div className="">
                    {results.fuzzyMatches.map((result) => (
                      <ResultItem
                        key={`${result.pageNumber}-${result.matchIndex}`}
                        result={result}
                        originalSearchText={searchText}
                      />
                    ))}
                  </div>
                </div>
              )}

              {results.hasMoreResults && (
                <button
                  onClick={handleLoadMore}
                  className="w-full py-2 px-4 text-sm text-neutral-900 dark:text-white bg-white/60 hover:bg-white dark:bg-secondary rounded-lg dark:hover:bg-primary/10 transition-colors"
                >
                  Show More
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
