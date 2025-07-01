import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";

const ImageWithRemove = ({
  imageSrc,
  onRemove,
  baseClassName,
  iconClassName,
}: {
  imageSrc: string;
  onRemove: () => void;
  baseClassName?: string;
  iconClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "relative w-14 h-14 inline-flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm",
        "bg-background",
        "transition-all duration-200 hover:shadow-md",
      )}
    >
      <Image
        src={imageSrc}
        alt="Uploaded"
        className="w-full rounded-lg p-0.5 h-full object-cover"
        fill
        unoptimized
      />
      <Button
        className={cn(
          "absolute -top-1 -right-1 rounded-full border-[1.5px] border-white w-4 h-4 p-0 flex items-center justify-center",
          "bg-foreground hover:bg-foreground/90",
          "shadow-sm",
        )}
        type="button"
        size="icon"
        onClick={onRemove}
      >
        <X className="w-3 h-3 text-background" />
      </Button>
    </div>
  );
};

export default ImageWithRemove;
