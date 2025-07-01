import { useCallback } from "react";
import { Virtualizer } from "@tanstack/react-virtual";
import { ScrollToElementOptions } from "@/lib/types";

export const useScrollToElement = <
  TElement extends Element,
  TData extends Element,
>(
  virtualizer: Virtualizer<TElement, TData>,
) => {
  const scrollToElement = useCallback(
    async (elementId: string, options: ScrollToElementOptions = {}) => {
      const { behavior = "auto", offset = -20, onScrollEnd } = options;

      const waitForElement = () => {
        return new Promise<HTMLElement>((resolve) => {
          const element = document.getElementById(elementId);
          if (element) {
            resolve(element);
            return;
          }

          const observer = new MutationObserver(() => {
            const element = document.getElementById(elementId);
            if (element) {
              observer.disconnect();
              resolve(element);
            }
          });

          observer.observe(document.body, {
            childList: true,
            subtree: true,
          });
        });
      };

      await virtualizer.measure();
      const element = await waitForElement();

      if (element) {
        const container = element.closest(".overflow-y-auto");
        if (container instanceof HTMLElement) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const relativeTop = elementRect.top - containerRect.top;

          container.scrollTo({
            top: container.scrollTop + relativeTop + offset,
            behavior,
          });

          if (onScrollEnd) {
            container.addEventListener("scrollend", onScrollEnd, {
              once: true,
            });
          }
        }
      }
    },
    [virtualizer],
  );

  return scrollToElement;
};
