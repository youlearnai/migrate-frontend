"use client";

import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";
import { useGetLanding } from "@/query-hooks/user";
import ContentCard from "../global/content-card";
import HomeContentCardSkeleton from "../skeleton/home-content-card-skeleton";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { TbChevronCompactLeft, TbChevronCompactRight } from "react-icons/tb";
import { useLocalStorage } from "usehooks-ts";
import useAuth from "@/hooks/use-auth";

const Recents = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: recommendedContent, isLoading } = useGetLanding(20);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showExplore, setShowExplore] = useLocalStorage("showExplore", true);

  useEffect(() => {
    const checkScroll = () => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        setShowLeftButton(scrollLeft > 0);
        setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

    checkScroll();
    carouselRef.current?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      carouselRef.current?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [recommendedContent]);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth / 2;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!showExplore) {
    return null;
  }

  const contentElements = isLoading
    ? Array.from({ length: 5 }).map((_, index) => (
        <HomeContentCardSkeleton key={index} />
      ))
    : recommendedContent && recommendedContent.length > 0
      ? recommendedContent.map((content, index) => (
          <Link
            href={`/learn/content/${content.content_id}`}
            key={index}
            className="max-w-[16rem] 2xl:max-w-[18rem] flex flex-col justify-between col-span-1 shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:dark:border-neutral-700/40 bg-white dark:bg-neutral-800/50 cursor-pointer transition-all duration-200 rounded-2xl border group flex-shrink-0"
          >
            <ContentCard
              priority={index <= 3}
              dropdownItems={[{ type: "move" }]}
              {...content}
              className="hover:shadow-none w-full hover:dark:shadow-none drop-shadow-none"
            />
          </Link>
        ))
      : Array.from({ length: 3 }).map((_, index) => (
          <HomeContentCardSkeleton key={index} />
        ));

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="text-left w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-base lg:text-lg">{t("explore")}</span>
          </div>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs sm:text-sm hover:bg-transparent hover:text-primary/70"
              onClick={() => setShowExplore(false)}
            >
              <span>{t("closeAll")}</span>
            </Button>
          )}
        </div>
        <div
          className="relative"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {isHovering && showLeftButton && (
            <Button
              variant="outline"
              size="icon"
              className="bg-transparent border-none hover:bg-transparent absolute left-0 top-1/3 -translate-y-1/3 z-20 transition-opacity duration-300 ease-in-out"
              onClick={() => scroll("left")}
            >
              <TbChevronCompactLeft className="h-12 w-12" />
            </Button>
          )}
          <div className="relative overflow-hidden">
            <div
              ref={carouselRef}
              className="w-full flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth py-4"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {contentElements}
            </div>
            {showLeftButton && (
              <div className="absolute left-0 top-0 bottom-0 w-4 md:w-16 bg-gradient-to-r from-background to-transparent z-10 transition-opacity duration-300 ease-in-out opacity-100" />
            )}
            {showRightButton && (
              <div className="absolute right-0 top-0 bottom-0 w-4 md:w-16 bg-gradient-to-l from-background to-transparent z-10 transition-opacity duration-300 ease-in-out opacity-100" />
            )}
          </div>
          {isHovering && showRightButton && (
            <Button
              variant="outline"
              size="icon"
              className="bg-transparent border-none hover:bg-transparent absolute right-0 top-1/3 -translate-y-1/3 z-20 transition-opacity duration-300 ease-in-out"
              onClick={() => scroll("right")}
            >
              <TbChevronCompactRight className="h-12 w-12" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recents;
