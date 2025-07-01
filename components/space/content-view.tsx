import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContentViewStore } from "@/hooks/use-content-view-store";
import { ContentViewType } from "@/lib/types";
import { LayoutGrid, MenuIcon } from "lucide-react";

export default function ContentView() {
  const { contentView, setContentView } = useContentViewStore();
  return (
    <Tabs
      defaultValue={contentView}
      onValueChange={(value) => setContentView(value as ContentViewType)}
    >
      <TabsList className="rounded-full px-2">
        <TabsTrigger value="grid">
          <LayoutGrid className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="list">
          <MenuIcon className="h-4 w-4" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
