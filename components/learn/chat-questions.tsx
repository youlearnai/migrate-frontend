import useAuth from "@/hooks/use-auth";
import { Chat } from "@/lib/types";
import { useGenerateQuestions } from "@/query-hooks/generation";
import { CornerDownRight } from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";

const ChatQuestions = ({
  chats,
  handleSubmit: submit,
}: {
  chats: Chat[];
  handleSubmit: (text: string) => void;
}) => {
  const params = useParams();
  const { user, loading } = useAuth();
  const { data: questions, isLoading } = useGenerateQuestions(
    params.contentId as string,
    chats,
  );

  const handleClick = (e: React.MouseEvent, question: string) => {
    e.preventDefault();
    submit(question);
  };

  if ((!loading && !user) || chats?.length === 0)
    return (
      <div className="flex flex-row gap-4 mt-2">
        {!isLoading &&
          questions!?.length > 0 &&
          questions?.map((question, index) => (
            <div key={index} className="w-full">
              <div
                className={`items-center cursor-pointer hover:bg-primary/10 flex transition-all duration-500 h-full leading-relaxed border p-2 rounded-2xl text-sm`}
                onClick={(e) => handleClick(e, question)}
              >
                <CornerDownRight className="flex-shrink-0 w-6 ml-1 h-6" />
                <span className="ml-3 line-clamp-2">{question}</span>
              </div>
            </div>
          ))}
      </div>
    );
};

export default ChatQuestions;
