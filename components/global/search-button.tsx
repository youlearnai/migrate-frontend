import { Button } from "@/components/ui/button";
import { useCommandStore } from "@/hooks/use-command-store";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

const SearchButton = () => {
  const { onOpen } = useCommandStore();
  const { t } = useTranslation();

  const handleOpenSearch = () => {
    onOpen("search");
  };

  return (
    <Button
      variant="secondary"
      className="flex items-center px-3 h-full w-full border rounded-3xl shadow-[0_4px_10px_rgba(0,0,0,0.02)] dark:hover:dark:border-neutral-700/40 transition duration-200 dark:border-secondary bg-white hover:bg-neutral-50 dark:bg-neutral-800/50 max-w-[68px]"
      onClick={handleOpenSearch}
      title={t("search")}
      aria-label={t("search")}
    >
      <Search className="h-4 w-4 text-muted-foreground/80 items-center justify-center" />
      <kbd className="hidden sm:inline-flex items-center font-mono px-1 rounded text-muted-foreground/80 gap-x-0.5">
        <span className="command-symbol text-base">⌘</span>
        <span className="key-cha text-sm">K</span>
      </kbd>
    </Button>
  );
};

export default SearchButton;
