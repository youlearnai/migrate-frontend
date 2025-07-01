import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getAppBaseUrl } from "@/lib/domains";

const EmbedWatermark = () => {
  const params = useParams();
  const contentId = params.contentId;
  const spaceId = params.spaceId;

  const link = () => {
    const base = getAppBaseUrl();
    if (spaceId) {
      return `${base}/learn/space/${spaceId}/content/${contentId}`;
    }
    return `${base}/learn/content/${contentId}`;
  };

  return (
    <Link
      href={link()}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white hover:text-gray-800 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow group"
    >
      <Image
        src="/youlearn.png"
        alt="YouLearn"
        width={16}
        height={16}
        className="opacity-80 group-hover:opacity-100"
      />
      <span>Powered by YouLearn</span>
      <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
    </Link>
  );
};

export default EmbedWatermark;
