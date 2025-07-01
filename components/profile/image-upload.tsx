import { Camera } from "lucide-react";
import Image from "next/image";

export const ImageUpload = ({
  image,
  onChange,
}: {
  image: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <label className="cursor-pointer rounded-full">
      <div className="relative w-[100px] h-[100px] flex items-center border justify-center overflow-hidden rounded-lg bg-transparent">
        {image && (
          <Image
            unoptimized
            draggable={false}
            src={image}
            alt="Upload"
            className="w-auto h-full duration-200 hover:opacity-50"
            layout="fill"
            objectFit="cover"
          />
        )}
        <span className="absolute inset-0 bg-secondary/90 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 p-1">
          <Camera className="w-8 h-8 text-primary" />
        </span>
      </div>
      <input
        type="file"
        onChange={onChange}
        accept="image/*"
        className="hidden"
      />
    </label>
  );
};
