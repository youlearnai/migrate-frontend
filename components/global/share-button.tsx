import { useModalStore } from "@/hooks/use-modal-store";
import useUserPermission from "@/hooks/use-user-permission";
import { useGetContent } from "@/query-hooks/content";
import { useGetSpace } from "@/query-hooks/space";
import { Share } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { useCurrentSourceStore } from "@/hooks/use-current-source-store";

const ShareButton = () => {
  const params = useParams();
  const { t } = useTranslation();
  const isSpace = !!params.spaceId && !params.contentId;
  const { onOpen } = useModalStore();
  const { data: contentData, isLoading: contentLoading } = useGetContent(
    params.spaceId as string,
    params.contentId as string,
    { enabled: !isSpace },
    false,
  );
  const { data: spaceData, isLoading: spaceLoading } = useGetSpace(
    params.spaceId as string,
    { enabled: isSpace },
  );
  const { userPermission, loading: userPermissionLoading } = useUserPermission(
    spaceData?.access_control!,
  );
  const [_, copy] = useCopyToClipboard();
  const { currentSource } = useCurrentSourceStore();
  const role = userPermission?.role;

  const handleShareSpace = () => {
    if (role === "owner") {
      onOpen("shareSpace", { spaceId: params.spaceId as string });
    } else {
      const text = `/space/${params.spaceId as string}`;
      let domainName;
      if (typeof window !== "undefined") {
        domainName = window.location.origin;
      }
      try {
        copy(domainName + text);
        toast.success(t("shareSpace.copiedToastMessage"));
      } catch (error) {
        toast.error(t("errorModal.defaultTitle"));
      }
    }
  };

  const handleShare = () => {
    if (isSpace) {
      handleShareSpace();
    } else {
      onOpen("shareContent", {
        contentId: params.contentId as string,
        visibility: contentData?.visibility,
        currentSource: currentSource,
        contentType: contentData?.type,
      });
    }
  };

  if (contentLoading || spaceLoading || userPermissionLoading)
    return <Skeleton className="h-10 w-24" />;

  return (
    <Button
      variant="ghost"
      className={`flex px-1 rounded-full text-primary`}
      onClick={handleShare}
    >
      <Share className="h-5 w-5" />
    </Button>
  );
};

export default ShareButton;
