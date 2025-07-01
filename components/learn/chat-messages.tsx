import { ChatMessagesProps } from "@/lib/types";
import { cn, isImageExtension } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import Message from "./message";
import { CornerDownRight, FileText } from "lucide-react";
import Image from "next/image";
import { useModalStore } from "@/hooks/use-modal-store";
import GenUI from "./gen-ui";
import { useTabStore } from "@/hooks/use-tab";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import FileWithRemove from "../global/file-with-remove";

export const ChatMessages = ({
  chats,
  isStreaming,
  className,
  welcomeMessage,
  chatContextContents,
}: ChatMessagesProps) => {
  const { t } = useTranslation();
  const { onOpen } = useModalStore();
  const { currentTab } = useTabStore();
  const params = useParams();

  return (
    <div>
      {chats?.map((chat) => (
        <div key={`chat-${chat._id}`} className="space-y-2 mb-8">
          {!params.examId &&
            currentTab === "chat" &&
            chat.question_id &&
            chat.message && (
              <div className="flex justify-end text-primary/50 pr-2 rounded-t-sm rounded">
                <div className="gap-2 pt-2 cursor-pointer hover:text-primary/70 duration-300 transition-colors flex max-w-xs w-full justify-end">
                  <CornerDownRight className="flex-shrink-0 h-4 w-4" />
                  <span className="text-sm overflow-hidden overflow-ellipsis line-clamp-3">
                    <span key={`takeMeTo-${chat._id}`}>{t("takeMeTo")}</span>{" "}
                  </span>
                </div>
              </div>
            )}
          {chat.chat_quote?.text && (
            <div className="flex justify-end text-primary/50 pr-2 rounded-t-sm rounded">
              <div className="gap-2 flex max-w-xs w-full justify-end">
                <CornerDownRight className="flex-shrink-0 h-4 w-4" />
                <span className="text-sm overflow-hidden overflow-ellipsis line-clamp-3">
                  {chat.chat_quote.text}
                </span>
              </div>
            </div>
          )}
          {chat?.image_urls && chat?.image_urls?.length > 0 && (
            <div className="flex justify-end text-primary/50 rounded-t-sm rounded">
              <div className="flex gap-2 justify-end flex-wrap">
                {chat?.image_urls.map((image, index) => {
                  return (
                    <Image
                      key={`file-${index}`}
                      onClick={() => onOpen("image", { src: image })}
                      alt="Chat image"
                      src={image}
                      className="w-16 h-16 cursor-pointer rounded-md"
                      height={100}
                      width={100}
                      unoptimized
                    />
                  );
                })}
              </div>
            </div>
          )}
          {chat?.context_contents && chat?.context_contents?.length > 0 && (
            <div className="flex justify-end text-primary/50 rounded-t-sm rounded">
              <div className="flex gap-2 justify-end flex-wrap">
                {chat?.context_contents.map((file, index) => {
                  return (
                    <div
                      key={`file-${index}`}
                      className="cursor-pointer"
                      onClick={() =>
                        onOpen("contentPreview", {
                          src: file.content_url,
                          contentId: file.id,
                          title: file.title,
                          contentType: file.type,
                        })
                      }
                    >
                      <FileWithRemove
                        key={`file-${index}`}
                        fileName={file.title}
                        type={file.type}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {chat.message && (
            <Message
              key={`message-${chat._id}`}
              id={chat._id}
              type="user"
              text={chat.message}
              is_voice={chat.is_voice}
              chatContextContents={chatContextContents}
            />
          )}
          {chat.response && (
            <Message
              key={`response-${chat._id}`}
              id={chat._id}
              type="ai"
              text={chat.response}
            />
          )}
          <div className="overflow-x-auto">
            <GenUI chunks={chat.response_chunks} chatMessageId={chat._id} />
          </div>
        </div>
      ))}
      {isStreaming && (
        <div className="flex items-center mb-4">
          <div className="w-2 h-2 bg-primary/80 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default ChatMessages;
