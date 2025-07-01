import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { ArrowRight, ArrowLeft, CircleX, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCreateSpaceExam, useGetSpace } from "@/query-hooks/space";
import MagicIcons from "../home/magic-icons";
import { Input } from "../ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import useSpaceExamStore from "@/hooks/use-space-exam-store";
import { useUploadExamReference } from "@/query-hooks/upload";
import { useS3Upload } from "@/hooks/use-upload-s3";
import { QuestionType } from "@/lib/types";
import { toast } from "sonner";
import FullScreener from "../global/full-screener";
import ExamProcess from "./exam-process";
import { CustomError } from "../../lib/custom-fetch";
import { useRightSidebar } from "@/hooks/use-right-sidebar";

const SIZE_LIMIT = 10 * 1024 * 1024;
const MAX_EXAM_REFERENCE_FILES = 5;

const TinyCircularProgress = ({ value }: { value: number }) => {
  const radius = 8;
  const strokeWidth = 2;
  const circumference = 2 * Math.PI * radius;
  // Ensure value is between 0 and 100, defaulting to 0
  const safeValue = Math.max(0, Math.min(100, value || 0));
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="relative w-5 h-5 flex items-center justify-center">
      <svg
        className="absolute top-0 left-0 w-full h-full -rotate-90"
        viewBox="0 0 20 20"
      >
        <circle
          className="text-muted stroke-current"
          strokeWidth={strokeWidth}
          cx="10"
          cy="10"
          r={radius}
          fill="transparent"
        />
        <circle
          className="text-primary stroke-current"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          cx="10"
          cy="10"
          r={radius}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            opacity: safeValue > 0 ? 1 : 0.3,
            transition:
              "stroke-dashoffset 0.3s ease-out, opacity 0.3s ease-out",
          }}
        />
      </svg>
    </div>
  );
};

const ExamConfig = () => {
  const params = useParams();
  const spaceId = params.spaceId as string;
  const {
    step,
    setStep,
    selectedContents,
    toggleSelectAll,
    setIsSpaceExamOpen,
  } = useSpaceExamStore();
  const { data: space } = useGetSpace(spaceId);
  const router = useRouter();
  const {
    uploadFileToS3,
    isUploading: isUploadingFile,
    progress,
  } = useS3Upload();
  const [uploadedExamReference, setUploadedExamReference] = useState<
    { url: string; fileName: string }[]
  >([]);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(
    new Map(),
  );
  const [currentUploadingFile, setCurrentUploadingFile] = useState<
    string | null
  >(null);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [fileNameMap, setFileNameMap] = useState<Map<string, string>>(
    new Map(),
  );
  const { mutate: createSpaceExam, isPending: isCreatingSpaceExam } =
    useCreateSpaceExam();
  const { mutate: uploadExamReference, isPending: isUploadingExamReference } =
    useUploadExamReference();
  const { t } = useTranslation();
  const { setIsOpen: setRightSidebarOpen } = useRightSidebar();

  // Define the schema inside the component to access t
  const getExamFormSchema = (t: (key: string) => string) =>
    z.object({
      examLength: z.coerce
        .number()
        .min(1, t("validation.examLengthMin"))
        .max(180, t("validation.examLengthMax"))
        .optional(),
      questionCount: z.coerce
        .number()
        .min(5, t("validation.questionCountMin"))
        .max(100, t("validation.questionCountMax"))
        .default(25),
      questionTypes: z
        .string()
        .min(1, { message: t("validation.questionTypesRequired") }),
    });

  // Get the schema instance
  const examFormSchema = getExamFormSchema(t);

  // Define type alias inside the component scope
  type ExamFormValues = z.infer<typeof examFormSchema>;

  // Update questionTypeOptions to use t()
  const questionTypeOptions = [
    {
      value: "multiple_choice",
      label: (
        <span key="translation-multipleChoice">
          {t("questionTypes.multipleChoice")}
        </span>
      ),
    },
    {
      value: "free_response",
      label: (
        <span key="translation-freeResponse">
          {t("questionTypes.freeResponse")}
        </span>
      ),
    },
    {
      value: "both",
      label: <span key="translation-both">{t("questionTypes.both")}</span>,
    },
  ];

  const totalSteps = 3;

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema), // Use the schema instance
    defaultValues: {
      examLength: undefined,
      questionCount: 25,
      questionTypes: "both",
    },
  });

  const onSubmit = (data: ExamFormValues) => {
    if (selectedContents.length === 0) {
      setStep(0);
      toast.error(t("toast.selectContents"));
      return;
    }
    const questionTypes =
      data.questionTypes === "both"
        ? ["multiple_choice", "free_response"]
        : [data.questionTypes as QuestionType];

    // Close the right sidebar (Space Chat)
    setRightSidebarOpen(false);

    createSpaceExam(
      {
        spaceId,
        contentIds: selectedContents.map(
          (content) => content.id! || content._id!,
        ),
        pastPaperUrls:
          uploadedExamReference.length > 0
            ? uploadedExamReference.map((ref) => ref.url)
            : undefined,
        questionTypes: questionTypes as QuestionType[],
        numQuestions: data.questionCount!,
        examDuration: data.examLength!,
      },
      {
        onSuccess: (data) => {
          // Make sure Space Chat is closed before navigating
          setRightSidebarOpen(false);
          router.push(`/exam/${data._id}/space/${spaceId}`);
          setIsSpaceExamOpen(false);
        },
        onError: (error) => {
          if (error instanceof CustomError && error.status === 402) {
            toast.error(t("toastExam.upgradeRequired"));
          }
        },
      },
    );
  };

  const handleSelectAll = () => {
    if (space?.contents) {
      toggleSelectAll(space.contents);
    }
  };

  const isAllSelected =
    space?.contents && selectedContents.length === space.contents.length;

  const processUploadQueue = async () => {
    if (isProcessingQueue || uploadQueue.length === 0) return;

    setIsProcessingQueue(true);
    const file = uploadQueue[0];

    try {
      await handleUploadExamReference(file);
      setUploadQueue((prev) => prev.slice(1));
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadQueue((prev) => prev.slice(1));
    } finally {
      setIsProcessingQueue(false);
    }
  };

  React.useEffect(() => {
    processUploadQueue();
  }, [uploadQueue, isProcessingQueue]);

  const handleUploadExamReference = async (file: File) => {
    if (
      uploadedExamReference.length + uploadingFiles.size >=
      MAX_EXAM_REFERENCE_FILES
    ) {
      toast.error(
        t("toast.maxExamReferenceFiles", {
          max: MAX_EXAM_REFERENCE_FILES,
          defaultValue: `Maximum ${MAX_EXAM_REFERENCE_FILES} reference files allowed`,
        }),
      );
      return;
    }

    if (file.size > SIZE_LIMIT) {
      toast.error(
        t("toast.fileSizeError", {
          size: SIZE_LIMIT / 1024 / 1024,
        }),
      );
      return;
    }

    const fileName = file.name;
    setCurrentUploadingFile(fileName);
    setUploadingFiles((prev) => new Map(prev).set(fileName, 0));

    try {
      const uploadData = await new Promise<any>((resolve, reject) => {
        uploadExamReference(
          { mimeType: file.type },
          {
            onSuccess: (data) => resolve(data),
            onError: (error) => reject(error),
          },
        );
      });

      const url = await uploadFileToS3(file, uploadData);
      if (url) {
        await handleAddExamReference(url, fileName);
      }

      setUploadingFiles((prev) => {
        const newMap = new Map(prev);
        newMap.delete(fileName);
        return newMap;
      });
      setCurrentUploadingFile(null);
    } catch (error) {
      toast.error(t("toast.examReferenceUploadError"));
      setUploadingFiles((prev) => {
        const newMap = new Map(prev);
        newMap.delete(fileName);
        return newMap;
      });
      setCurrentUploadingFile(null);
    }
  };

  const handleMultipleFileUpload = (files: File[]) => {
    // Filter out files that are already uploaded, uploading, or in queue
    const existingFileNames = new Set([
      ...uploadedExamReference.map((ref) => ref.fileName),
      ...Array.from(uploadingFiles.keys()),
      ...uploadQueue.map((f) => f.name),
    ]);

    const validFiles = files.filter((file) => {
      if (existingFileNames.has(file.name)) {
        return false;
      }
      if (
        uploadedExamReference.length +
          uploadingFiles.size +
          uploadQueue.length >=
        MAX_EXAM_REFERENCE_FILES
      ) {
        return false;
      }
      if (file.size > SIZE_LIMIT) {
        return false;
      }
      return true;
    });

    if (validFiles.length < files.length) {
      toast.error(
        t("toast.someFilesSkipped", {
          defaultValue:
            "Some files were skipped due to size or limit restrictions",
        }),
      );
    }

    if (validFiles.length > 0) {
      setUploadQueue((prev) => [...prev, ...validFiles]);
    }
  };

  const handleAddExamReference = (
    url: string,
    fileName?: string,
  ): Promise<void> => {
    return new Promise((resolve) => {
      const name =
        fileName ||
        url.split("/").pop() ||
        `Reference file ${uploadedExamReference.length + 1}`;
      setUploadedExamReference((prev) => [...prev, { url, fileName: name }]);
      toast.success(t("toast.examReferenceUploadSuccess"));
      resolve();
    });
  };

  const handleRemoveExamReference = (index?: number) => {
    if (index !== undefined) {
      setUploadedExamReference((prev) => prev.filter((_, i) => i !== index));
    } else {
      setUploadedExamReference([]);
    }
  };

  // Update progress for current file
  React.useEffect(() => {
    if (currentUploadingFile && progress >= 0) {
      setUploadingFiles((prev) => {
        const newMap = new Map(prev);
        newMap.set(currentUploadingFile, progress);
        return newMap;
      });
    }
  }, [progress, currentUploadingFile]);

  const renderSteps = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-4">
            <h2 className="text-center font-normal sm:text-2xl 2xl:text-3xl text-xl leading-relaxed mt-6 sm:mt-10">
              <span key="translation-step0-title">
                {t("examConfig.step0.title")}
              </span>
            </h2>
            <p className="text-center text-muted-foreground text-base sm:text-base 2xl:text-lg mb-12 sm:mb-4">
              <span key="translation-step0-description">
                {t("examConfig.step0.description")}
              </span>
            </p>
            <div className="flex justify-center flex-row gap-5">
              <div className="flex flex-row cursor-pointer items-center gap-2">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  id="contentsSelection"
                  className="h-5 w-5 border-1.5 border-primary/60 rounded-[6] data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary bg-primary-foreground text-primary"
                />
                <label htmlFor="contentsSelection">
                  <span key="translation-selectAll">
                    {t("examConfig.step0.selectAll")}
                  </span>{" "}
                  <span className="pl-0.5 text-sm text-muted-foreground">
                    ({selectedContents.length}/{space?.contents?.length})
                  </span>
                </label>
              </div>
              <Button className="gap-1" onClick={() => setStep(step + 1)}>
                <span key="translation-continue1">{t("common2.continue")}</span>
                <ArrowRight strokeWidth={2.5} className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col items-center gap-4 mt-6 sm:mt-0">
            <h2 className="text-center font-normal sm:text-2xl 2xl:text-3xl text-lg leading-relaxed">
              <span key="translation-pasteText">
                {t("examConfig.pasteText")}
              </span>
            </h2>
            <p className="text-center text-muted-foreground text-sm sm:text-base mb-2 2xl:text-lg">
              <span key="translation-step1-description">
                {t("examConfig.step1.description")}
              </span>
            </p>
            <div className="flex flex-col w-full sm:w-3/4 justify-center items-center">
              <MagicIcons
                icons={["upload", "paste"]}
                uploadAction={(file) => handleMultipleFileUpload([file])}
                magicBarAction={handleAddExamReference}
                isDisabledExternal={
                  uploadedExamReference.length + uploadingFiles.size >=
                    MAX_EXAM_REFERENCE_FILES || isProcessingQueue
                }
              />
            </div>

            {/* Display uploaded files and files being uploaded */}
            {(uploadedExamReference.length > 0 ||
              uploadingFiles.size > 0 ||
              uploadQueue.length > 0) && (
              <div className="w-full sm:w-3/4 mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span key="translation-uploadedFiles">
                    {t("examConfig.uploadedFiles", {
                      count:
                        uploadedExamReference.length +
                        uploadingFiles.size +
                        uploadQueue.filter((f) => !uploadingFiles.has(f.name))
                          .length,
                      max: MAX_EXAM_REFERENCE_FILES,
                      defaultValue: `Files (${uploadedExamReference.length + uploadingFiles.size + uploadQueue.filter((f) => !uploadingFiles.has(f.name)).length}/${MAX_EXAM_REFERENCE_FILES})`,
                    })}
                  </span>
                </p>
                <div className="space-y-1">
                  {/* Show uploaded files */}
                  {uploadedExamReference.map((ref, index) => (
                    <div
                      key={`uploaded-${ref.fileName}-${index}`}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                    >
                      <span className="text-sm truncate flex-1">
                        {ref.fileName}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveExamReference(index)}
                        className="ml-2"
                        disabled={
                          uploadingFiles.size > 0 || uploadQueue.length > 0
                        }
                      >
                        <CircleX className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Show files currently being uploaded */}
                  {Array.from(uploadingFiles.entries()).map(
                    ([fileName, uploadProgress]) => (
                      <div
                        key={`uploading-${fileName}`}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md opacity-70"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <TinyCircularProgress
                            value={
                              fileName === currentUploadingFile
                                ? progress || 0
                                : uploadProgress || 0
                            }
                          />
                          <span className="text-sm truncate">{fileName}</span>
                        </div>
                      </div>
                    ),
                  )}

                  {/* Show files in queue - only show files that are not currently uploading */}
                  {uploadQueue
                    .filter((file) => !uploadingFiles.has(file.name))
                    .map((file, index) => (
                      <div
                        key={`queue-${file.name}-${index}`}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded-md opacity-50"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-5 h-5 flex items-center justify-center">
                            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full" />
                          </div>
                          <span className="text-sm truncate text-muted-foreground">
                            {file.name}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex flex-row gap-3 mt-4 mb-6">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={uploadingFiles.size > 0 || uploadQueue.length > 0}
              >
                <ArrowLeft strokeWidth={2.5} className="w-4 h-4" />
              </Button>
              {uploadedExamReference.length === 0 ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-1"
                    onClick={() => setStep(step + 1)}
                    disabled={uploadingFiles.size > 0 || uploadQueue.length > 0}
                  >
                    <span key="translation-skip1">{t("common2.skip")}</span>
                  </Button>
                  <Button
                    className="gap-1"
                    onClick={() => setStep(step + 1)}
                    disabled={uploadingFiles.size > 0 || uploadQueue.length > 0}
                  >
                    <span key="translation-continue2">
                      {t("common2.continue")}
                    </span>
                    <ArrowRight strokeWidth={2.5} className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    className="sm:gap-1"
                    onClick={() => handleRemoveExamReference()}
                    disabled={uploadingFiles.size > 0 || uploadQueue.length > 0}
                  >
                    <CircleX strokeWidth={2.5} className="w-4 h-4" />
                    <span
                      className="hidden sm:inline"
                      key="translation-removeAll"
                    >
                      {t("examConfig.removeAll", {
                        defaultValue: "Remove all",
                      })}
                    </span>
                  </Button>
                  <Button
                    className="gap-1"
                    onClick={() => setStep(step + 1)}
                    disabled={uploadingFiles.size > 0 || uploadQueue.length > 0}
                  >
                    {uploadingFiles.size > 0 || uploadQueue.length > 0 ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span key="translation-uploading">
                          {t("common2.uploading")}
                        </span>
                      </>
                    ) : (
                      <>
                        <span key="translation-uploaded">
                          {t("uploaded")} ({uploadedExamReference.length})
                        </span>
                        <ArrowRight strokeWidth={2.5} className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className=" flex flex-col items-center w-full max-w-md mx-auto"
            >
              <h2 className="mt-[-6] text-center font-normal sm:text-2xl 2xl:text-2xl text-lg leading-relaxed sm:mb-6 mb-4">
                <span key="translation-step2-title">
                  {t("examConfig.step2.title")}
                </span>
              </h2>
              <div className="flex flex-col gap-4 w-full justify-center items-center text-primary/80">
                <div className="flex flex-col sm:flex-row w-full gap-3 sm:gap-6 items-center justify-center">
                  <FormField
                    control={form.control}
                    name="questionCount"
                    render={({ field }) => (
                      <FormItem className="w-full sm:w-[200px]">
                        <FormLabel>
                          <span key="translation-questionCountLabel">
                            {t("examConfig.step2.questionCountLabel")}
                          </span>
                          <span className="ml-0.5 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="5"
                            max="100"
                            placeholder={t(
                              "examConfig.step2.questionCountPlaceholder",
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="questionTypes"
                    render={({ field }) => (
                      <FormItem className="w-full sm:w-[200px]">
                        <FormLabel>
                          <span key="translation-questionTypesLabel">
                            {t("examConfig.step2.questionTypesLabel")}
                          </span>
                          <span className="ml-0.5 text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue
                                placeholder={t(
                                  "examConfig.step2.questionTypesPlaceholder",
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {questionTypeOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="py-3"
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col sm:flex-row w-full gap-3 sm:gap-6 items-center justify-center">
                  <FormField
                    control={form.control}
                    name="examLength"
                    render={({ field }) => (
                      <FormItem className="w-full sm:w-[200px]">
                        <FormLabel>
                          <span key="translation-examLengthLabel">
                            {t("examConfig.step2.examLengthLabel")}
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="180"
                            placeholder={t(
                              "examConfig.step2.examLengthPlaceholder",
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-center mt-3 mb-6 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                  >
                    <ArrowLeft strokeWidth={2.5} className="w-4 h-4" />
                  </Button>
                  {/* Make skip button type="button" to prevent form submission */}
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-1"
                    onClick={form.handleSubmit(onSubmit)}
                  >
                    <span key="translation-skip2">{t("common2.skip")}</span>
                  </Button>
                  <Button
                    type="submit"
                    className="gap-1"
                    disabled={isCreatingSpaceExam}
                  >
                    <span key="translation-continue3">
                      {t("common2.start")}
                    </span>
                    <ArrowRight strokeWidth={2.5} className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        );
      default:
        return null;
    }
  };

  if (isCreatingSpaceExam) {
    return (
      <FullScreener key={isCreatingSpaceExam.toString()}>
        <ExamProcess key={isCreatingSpaceExam.toString()} autoProgress={true} />
      </FullScreener>
    );
  }

  return (
    <div className="flex justify-center items-center w-full">
      <div className="w-full max-w-3xl">
        <div className="mb-10 flex justify-center">
          <div className="flex gap-2 w-1/4 max-w-md ">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className="flex-1 bg-muted rounded-full h-1.5">
                <div
                  key={`inner-${index}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index <= step
                      ? "bg-green-500"
                      : "bg-neutral-200 dark:bg-neutral-800"
                  }`}
                  style={{ width: "100%" }}
                ></div>
              </div>
            ))}
          </div>
        </div>
        {renderSteps()}
      </div>
    </div>
  );
};

export default ExamConfig;
