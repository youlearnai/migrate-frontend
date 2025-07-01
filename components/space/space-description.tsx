import { Space } from "@/lib/types";
import { useUpdateSpace } from "@/query-hooks/space";
import { Pencil } from "lucide-react";
import { useParams } from "next/navigation";
import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next"; // Import i18n

const SpaceDescription = ({ ...props }: Space) => {
  const { t } = useTranslation(); // Destructure t for translation
  const description = props.description!;
  const params = useParams();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [editSpaceDescription, setEditSpaceDescription] = useState(false);
  const [spaceDescriptionInput, setSpaceDescriptionInput] =
    useState(description);
  const [maxLength, setMaxLength] = useState(230);

  const { mutate: updateSpace } = useUpdateSpace();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMaxLength(window.innerWidth <= 600 ? 60 : 230);
    }
  }, []);

  const isOverMaxLength = description?.length > maxLength;

  const displayText = description
    ? showFullDescription
      ? description
      : `${description?.slice(0, maxLength)}`
    : t("spaceDescription.noDescription"); // Replace hardcoded string

  const handleToggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSpaceDescriptionInput(e.target.value);
  };

  const handleIconClick = () => {
    setSpaceDescriptionInput(description);
    setEditSpaceDescription(true);
  };

  const handleInputBlur = async () => {
    setEditSpaceDescription(false);
    if (description !== spaceDescriptionInput) {
      updateSpace({
        spaceId: params.spaceId as string,
        spaceName: props.name!,
        description: spaceDescriptionInput,
        visibility: props?.visibility!,
      });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleInputBlur();
    }
  };

  return (
    <div className="flex flex-col w-full" key="space-description-root">
      <div
        key="description-container"
        className={`sm:text-base text-sm line-clamp-2 w-full text-neutral-500 dark:text-neutral-400 flex break-words ${
          isOverMaxLength && "cursor-pointer"
        }`}
        onClick={isOverMaxLength ? handleToggleDescription : undefined}
      >
        <div className="group w-full flex flex-row" key="description-content">
          {!editSpaceDescription ? (
            <span key="display-text">{displayText}</span>
          ) : (
            <input
              key="description-input"
              maxLength={300}
              className="outline-none flex text-neutral-400 w-full bg-transparent"
              type="text"
              value={spaceDescriptionInput}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              placeholder={t("spaceDescription.editDescriptionPlaceholder")}
            />
          )}
          {!editSpaceDescription && (
            <Pencil
              key="edit-description-icon"
              size={14}
              className="opacity-50 ml-3 mt-1 cursor-pointer xl:opacity-0 group-hover:opacity-50 text-lg"
              onClick={handleIconClick}
            />
          )}
        </div>
      </div>
      {isOverMaxLength && (
        <button
          key="toggle-description-button"
          onClick={handleToggleDescription}
          className="text-neutral-500 text-left"
        >
          {showFullDescription
            ? t("spaceDescription.seeLess")
            : t("spaceDescription.seeMore")}{" "}
        </button>
      )}
    </div>
  );
};

export default SpaceDescription;
