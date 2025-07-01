import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocalStorage } from "usehooks-ts";
import { ChevronDown } from "lucide-react";

export const LearnSuggestionsSkeleton = () => {
  const [isOpen] = useLocalStorage("learn-suggestions-open", true);

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={isOpen ? "learn-suggestions" : ""}
      className="w-full"
    >
      <AccordionItem value="learn-suggestions" className="border-none">
        <AccordionTrigger showChevron={false} className="py-2 px-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-primary">
              <Skeleton className="h-6 w-36" />
            </h2>
            <ChevronDown
              size={16}
              className="transition-transform duration-200 shrink-0 data-[state=open]:rotate-180"
              data-state={isOpen ? "open" : "closed"}
            />
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-x-2 gap-y-1 pt-2">
            {Array(3)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="pb-1">
                  <div className="flex items-center justify-between px-2 rounded-2xl bg-neutral-100/20 dark:bg-neutral-900/80 border border-primary/10 cursor-pointer gap-2 min-h-14 group">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border-muted text-primary/80 flex items-center justify-center">
                        <Skeleton className="w-4 h-4" />
                      </div>

                      <div className="text-primary/80">
                        <Skeleton className="h-4 w-48 md:w-64" />
                      </div>
                    </div>

                    <div className="w-fit px-1.5 h-7 gap-1 rounded-md border flex items-center justify-center text-muted-foreground text-xs border-primary/10">
                      <Skeleton className="w-7 h-3" />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default LearnSuggestionsSkeleton;
