import { PersonalizedFormSchemaType } from "@/components/global/personalized-form";
import { WavRecorder, WavStreamPlayer } from "@/lib/wavtools/index.js";
import { DefaultBlockSchema, PartialBlock } from "@blocknote/core";
import { RealtimeClient } from "@openai/realtime-api-beta";
import { ItemType } from "@openai/realtime-api-beta/dist/lib/client.js";
import { QueryClient } from "@tanstack/react-query";
import { TranscriptionSegment } from "livekit-client";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";
import { SuggestionDataItem } from "react-mentions";
import { FieldNamesMarkedBoolean } from "react-hook-form";
import * as z from "zod";

export type LogoProps = {
  size?: "sm" | "lg";
  height?: number;
  width?: number;
  clickable?: boolean;
};

export type FlashcardChangeHandler = (
  id: string,
  field: keyof Flashcard,
  value: string | number | { id: string; collection: string },
) => void;

export type ExtendedSortableFlashcardProps = {
  flashcard: Flashcard;
  index: number;
  type: ContentType;
  onDelete: (id: string) => void;
  onAddBelow: (id: string) => void;
  onChange: (
    id: string,
    field: keyof Flashcard,
    value: string | number | boolean | { id: string; collection: string },
  ) => void;
  form: UseFormReturn<FlashcardFormData>;
  isDeleted: boolean;
  onRestore: (id: string) => void;
  hasErrors: boolean;
  expandedCardId?: string;
  onToggleExpand: (id: string) => void;
  nextReviewDate?: Date;
};

export type WaveControlsProps = {
  isRecording: boolean;
  isPaused: boolean;
  isPending: boolean;
  audioLevels: number[];
  mockAudioLevels: number[];
  handleStartRecording: () => void;
  resumeRecording: () => void;
  pauseRecording: () => void;
  endRecording: (event: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
  isBrowserTabAudio?: boolean;
};

export type ModalType =
  | "spaceDelete"
  | "shareContent"
  | "newFeature"
  | "contentDelete"
  | "accountDelete"
  | "spaceChatModal"
  | "keyboard"
  | "shareSpace"
  | "onboarding"
  | "quickGuide"
  | "feedback"
  | "clearChat"
  | "schedule"
  | "voiceLimit"
  | "flashcardFeedback"
  | "exportFlashcards"
  | "magicBar"
  | "examChatModal"
  | "cancelSubscriptionModal"
  | "image"
  | "shareExamModal"
  | "teamPricingFormModal"
  | "summaryOptions"
  | "pauseSubscription"
  | "pauseSubscriptionPrompt"
  | "recordingOptions"
  | "recording-instructions"
  | "flashcardActiveRecallSettings"
  | "flashcardFilter"
  | "contentPreview";

export type SourceType = "space" | "general";

export type ModalData = {
  spaceId?: string;
  spaceName?: string;
  contentId?: string;
  contentTitle?: string;
  src?: string;
  spaceDetails?: Partial<SpaceDetails>;
  visibility?: "public" | "private";
  calLink?: string;
  scheduleDescription?: string;
  html?: string;
  title?: string;
  flashcards?: Flashcard[];
  handleAddContent?: (url: string) => Promise<void>;
  isAddingContent?: boolean;
  examId?: string;
  showUpgradeModal?: boolean;
  onMicrophoneSelect?: () => void;
  onBrowserTabSelect?: () => void;
  onSubmit?: (data: FlashcardSettingsFormData) => void;
  allCards?: Flashcard[];
  keyConcepts?: KeyConcept[];
  progress?: FlashcardProgress;
  learningSteps?: number[];
  invert?: boolean;
  feature?: NewFeature;
  allFeatures?: NewFeature[];
  handleDismiss?: (featureId: string) => void;
  currentSource?: number;
  contentType?: ContentType;
};

export type ModalProps = {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
};

export type CommandType = "search";

export type CommandData = {
  contentId?: string;
  spaceId?: string;
};

export type CommandStore = {
  type: CommandType | null;
  data: CommandData;
  isOpen: boolean;
  onOpen: (type: CommandType, data?: CommandData) => void;
  onClose: () => void;
};

export type ChatLimitBannerStore = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export type ContentCardProps = Content & {
  priority?: boolean;
  showOptions?: boolean;
  className?: string;
  spaceId?: string;
  dropdownItems?: DropdownItem[];
  indicator?: ReactNode;
  view?: ContentViewType;
  onTitleEditStart?: () => void;
  onTitleEditEnd?: () => void;
};

export type ContentViewType = "grid" | "list";

export type SidebarToggleProps = {
  isOpen: boolean | undefined;
  setIsOpen?: () => void;
};

export type OptionsProps = {
  contentType?: ContentType;
  contentId?: string;
  contentTitle?: string;
  contentUrl?: string;
  spaceId?: string;
  spaceName?: string;
  dropdownItems?: DropdownItem[];
  visibility?: "public" | "private";
  className?: string;
  handleEdit?: (contentId?: string, title?: string, spaceId?: string) => void;
};

export type Features = {
  icon: React.ReactNode;
  label: string;
  tooltip?: string;
};

export type PriceCardProps = {
  plan: string;
  price: number;
  currency: string;
  subTitle: string;
  planBenefits: Features[];
  buttonStyle?: string;
  buttonText: string | React.ReactNode;
  handleClick?: () => void;
  bordered?: boolean;
  highlight?: boolean;
  billingPeriod: "none" | "year" | "month" | "quarter";
  savePercentage?: number;
  isLoading?: boolean;
  isProcessing?: boolean;
  freeTrialDays?: number;
  bgColor?: string;
  textColor?: string;
  skeletonColor?: string;
  borderColor?: string;
  isPopular?: string;
};

export type TabNames =
  | "chat"
  | "flashcards"
  | "summary"
  | "voice"
  | "chapters"
  | "study-guide";

export type ErrorModalData = {
  source?: string;
};

export type ErrorStore = {
  isOpen: boolean;
  error: CustomErrorType | null;
  data: ErrorModalData;
  override: boolean;
  openModal: (
    error: CustomErrorType,
    data?: ErrorModalData,
    override?: boolean,
  ) => void;
  closeModal: () => void;
};

export type BoundingBoxData = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type SourceOrigin = {
  type: "exam" | "examProgress";
  origin: string;
};

export type SourceStore = {
  source: number | null;
  data?: BoundingBoxData | null;
  sourceOrigin: SourceOrigin | null;
  lastUpdated: number;
  scrollType: "auto" | "smooth";
  onSource: (
    source: number,
    data?: BoundingBoxData | null,
    sourceOrigin?: SourceOrigin,
    scrollType?: "auto" | "smooth",
  ) => void;
  resetSource: () => void;
};

export type CaptureStore = {
  isCapturing: boolean;
  setIsCapturing: (isCapturing: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
};

export type HighlightSore = {
  highlight: string | null;
  data?: any;
  onHighlight: (highlight: string | null, data?: any) => void;
};

export type LearnStore = {
  minimized: boolean;
  setMinimized: (minimized: boolean) => void;
  isLearnMode: boolean;
  setIsLearnMode: (isLearnMode: boolean) => void;
  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;
  isMuted: boolean;
  setIsMuted: (isMuted: boolean) => void;
  toggleMute: () => Promise<void>;
  items: ItemType[];
  setItems: (items: ItemType[]) => void;
  concepts: STSKeyConcept[] | null;
  whiteboard: string | null;
  isLoading: boolean;
  connectConversation: (
    userId: string,
    contentId: string,
    spaceId: string,
    chatbotType: string,
    queryClient: QueryClient,
  ) => Promise<void>;
  disconnectConversation: () => Promise<void>;
  handleStop: () => Promise<void>;
  clientRef: { current: RealtimeClient | null };
  wavRecorderRef: { current: WavRecorder | null };
  wavStreamPlayerRef: { current: WavStreamPlayer | null };
};

export type AgenticModeData = {
  contentId: string | null;
};

export type AgenticModeStore = {
  isAgentic: boolean;
  data: AgenticModeData;
  setIsAgentic: (isAgentic: boolean, data: AgenticModeData) => void;
};

export type WebSearchData = {
  contentId: string | null;
  spaceId: string | null;
};

export type WebSearchStore = {
  isWebSearch: boolean;
  data?: WebSearchData;
  onWebSearch: (isWebSearch: boolean, data?: WebSearchData) => void;
};

export type AiModelStore = {
  defaultModel: string;
  contentModels: Record<string, string>;
  getModel: (contentId?: string) => string;
  setModel: (model: string, contentId?: string) => void;
};

export type ScreenshotStore = {
  screenshot: string[] | null;
  data?: any;
  onScreenshot: (screenshot: string[] | null, data?: any) => void;
};

export type MicStore = {
  mic: boolean;
  onMic: (mic: boolean) => void;
};

export type ErrorCodeDetails = {
  title: string;
  description: string;
  actionText: string;
  actionLink: () => void;
  secondaryText?: string;
  secondaryAction?: () => void;
  showFeedback?: boolean;
};

export type Tier = "pro" | "core" | "free" | "plus" | "unlimited" | "team";

export type ErrorCodes = {
  [key: number]: ErrorCodeDetails;
};

export type TabProps = {
  currentTab: TabNames;
  setCurrentTab: (currentTab: TabNames) => void;
};

export type MagicBarProps = {
  landing?: boolean;
  setLoading: (bool: boolean) => void;
  spaceId?: string;
};

export type FlashcardCardProps = {
  flashcard: Flashcard & {
    isVisible?: boolean;
  };
  isFlipped: boolean;
  showHint: boolean;
  showExplanation: boolean;
  showAnswer: boolean;
  onFlip: (e: React.MouseEvent) => void;
  onToggleHint: (e: React.MouseEvent) => void;
  onToggleExplanation: (e: React.MouseEvent) => void;
  onSource: (
    source: number,
    e: React.MouseEvent,
    bbox?: BoundingBoxData,
  ) => void;
};

export type SignUpStepProps = {
  handleNext?: () => void;
  handlePrev?: () => void;
  handleSubmit?: () => void;
};

export type FirebaseErrorMap = {
  [key: string]: string;
};

export type PersonalizedFormProps = {
  handleSubmit: (data: PersonalizedFormSchemaType) => void;
  isNewUser: boolean;
};

export type AiModelDropdownProps = {
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  showUpgradeButton?: boolean;
  onModelSelect?: (value: string) => void;
  value?: string;
  disabled?: boolean;
};

export type UserSignUpProps = {
  user_id: string;
  email: string;
  full_name: string;
  photo_url: string;
  education_level: string | null;
  username: string;
  language: string;
  interests: string[];
  referral_code?: string;
};

export type MessageProps = {
  id: string;
  text: string;
  type: "ai" | "user";
  is_voice?: boolean;
  className?: string;
  chatContextContents?: Content[];
};

export type ChatOptionsProps = {
  content: string;
  messageId?: string;
  className?: string;
  handleThumbsUp?: () => void;
  handleThumbsDown?: () => void;
  renderNavigateButton?: () => React.ReactNode;
};

export type Space = {
  _id?: string;
  id?: string;
  created_at: string;
  name: string;
  description: string;
  visibility: "private" | "public";
};

export type Keyword = {
  keyword: string;
  weight: number;
};

export type FileTypeConfig = {
  accept: Record<string, string>;
  description: string;
  extensions: string[];
};

export type Generation = {
  summary: string | null;
  chat_prompts: string | null;
  chapters: Chapter | null;
};

export type ContentType =
  | "youtube"
  | "pdf"
  | "arxiv"
  | "stt"
  | "pptx"
  | "docx"
  | "webpage"
  | "text"
  | "audio"
  | "video"
  | "conversation";

export type Metadata = {
  type: ContentType;
  title: string;
  author: string;
  publish_date: string;
  content_id: string;
  content_url: string;
  iframe_url: string;
  thumbnail_url: string;
};

export type TranscriptMap = {
  [key: string | number]: string;
};

export type Content = {
  _id?: string;
  id?: string;
  created_at: string;
  type: ContentType;
  title: string;
  thumbnail_url: string;
  content_id: string;
  searches: number;
  content_url: string;
  generations: Generation;
  keywords: Keyword[];
  author: string;
  visibility: "public" | "private";
  metadata: Metadata;
  content_title?: string;
  length: number;
};

export type History = {
  created_at: string;
  content: Content;
  space?: Space;
};

export type Role = "owner" | "editor" | "viewer";

export type AccessControl = {
  _id: string;
  created_at: string;
  space: Collection;
  user: Collection;
  role: Role;
};

export type SpaceDetails = {
  space: Space;
  contents: Content[];
  access_control: AccessControl[];
};

export type User = {
  _id: string;
  created_at: string;
  email: string;
};

export type SummaryPreference = "short" | "detailed" | "custom";

export type UserProfile = {
  _id: string;
  created_at: string;
  user: Collection;
  username: string;
  full_name: string;
  education_level: string | null;
  photo_url: string | null;
  language: string;
  interests: string[];
  last_login: string;
  streak: number;
  active_days: number;
  first_name: string;
  chat_model_id: string;
  summary_preference: SummaryPreference;
  user_summary_prompt?: {
    collection: string;
    id: string;
  };
  purpose?: string;
  purpose_detail?: string;
  referral_source?: string;
  other_referral_source?: string;
};

export type UserDashboard = {
  add_content_count: number;
};

export type CompleteUserProfile = {
  user_profile: UserProfile;
  user_dashboard: UserDashboard;
};

export type Subscription = {
  id: string | null;
  status: string | null;
  created_at: string | null;
  tier: string;
  is_paused?: boolean;
  resumes_at?: string;
};

export type Customer = {
  _id: string;
  created_at: string;
  user: Collection;
  subscription: Subscription;
  metadata: Record<string, unknown>;
};

export type UserGroup = {
  _id: string;
  created_at: string;
  user: Collection;
  group: string;
};

export type UserData = {
  user: User;
  user_profile: UserProfile;
  customer: Customer;
  is_power: boolean;
  user_group?: UserGroup;
};

export type ChatQuote = {
  text: string;
  ref_id: string;
};

export type Chat = {
  type?: string;
  _id: string;
  created_at: string;
  chatbot_type: string;
  user?: Collection;
  message: string;
  response: string;
  response_chunks: ResponseChunk[];
  content?: Collection;
  space?: Collection;
  metadata?: any;
  chat_quote?: ChatQuote;
  image_urls?: string[];
  agent?: boolean;
  is_voice?: boolean;
  question_id?: string;
  context_contents?: Content[];
};

export type MarkdownElementProps = {
  children?: ReactNode;
};

export type Chapter = {
  heading: string;
  summary: string;
  source: number;
  bbox?: string;
};

export type Flashcard = {
  _id: string;
  question: string;
  answer: string;
  hint: string;
  explanation: string;
  source: number;
  key_concept?: Collection;
  is_starred: boolean;
  idx: number;
  metadata: any;
  created_at: Date;
  bbox?: string;
};

export type UpdateFlashcard = {
  id: string;
  idx?: number;
  question?: string;
  answer?: string;
  source?: number;
  hint?: string;
  explanation?: string;
  key_concept?: string;
  is_starred?: boolean;
  is_new?: boolean;
  bbox?: BoundingBoxData;
};

export type SortableFlashcardProps = {
  flashcard: Flashcard;
  index: number;
  onDelete: (id: string) => void;
  onAddBelow: (index: number) => void;
  onChange: (
    id: string,
    field: keyof Flashcard,
    value: string | number,
  ) => void;
};

export type MicState = {
  isRecording: boolean;
  isPaused: boolean;
  isPending: boolean;
  transcript: Transcript | null;
  selectedDevice: MediaDeviceInfo | null;
  hasPermission: boolean | null;
  audioDevices: MediaDeviceInfo[];
  isSystemAudio: boolean;
  setIsRecording: (value: boolean) => void;
  setIsPaused: (value: boolean) => void;
  setTranscript: (value: Transcript | null) => void;
  setIsPending: (value: boolean) => void;
  setSelectedDevice: (device: MediaDeviceInfo | null) => void;
  setHasPermission: (value: boolean | null) => void;
  setAudioDevices: (devices: MediaDeviceInfo[]) => void;
  setIsSystemAudio: (value: boolean) => void;
  requestMicrophoneAccess: () => Promise<void>;
  getAudioDevices: () => Promise<void>;
};

export type BackendError = {
  message: string;
};

export type Transcript = {
  _id: string;
  created_at: string;
  content: Collection;
  page_content: string;
  source: number;
  metadata: object;
};

export type UploadFile = {
  url: string;
  fields: {
    key: string;
    "x-amz-algorithm": string;
    "x-amz-credential": string;
    "x-amz-date": string;
    policy: string;
    "x-amz-signature": string;
    "Content-Type": string;
  };
};

export type SidebarSettings = { disabled: boolean; isHoverOpen: boolean };

export type LeftSidebarStore = {
  isOpen: boolean;
  isHover: boolean;
  settings: SidebarSettings;
  toggleOpen: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setIsHover: (isHover: boolean) => void;
  getOpenState: () => boolean;
  setSettings: (settings: Partial<SidebarSettings>) => void;
};

export type RightSidebarStore = {
  isOpen: boolean;
  isHover: boolean;
  settings: SidebarSettings;
  isFullWidth: boolean;
  toggleOpen: () => void;
  setIsOpen: (isOpen: boolean, data?: any) => void;
  setIsHover: (isHover: boolean) => void;
  getOpenState: () => boolean;
  setSettings: (settings: Partial<SidebarSettings>) => void;
  setIsFullWidth: (isFullWidth: boolean) => void;
  data: any;
};

export type DropdownItem = {
  type: "move" | "delete" | "share" | "separator" | "edit";
};

export type Collection = {
  id?: string;
  _id?: string;
  collection: string;
};

export type STSKeyConcept = {
  concept: string;
  source: number;
  bbox?: string;
};

export type KeyConcept = {
  id: string;
  _id: string;
  concept: string;
  content: Collection;
  start_document: Collection & {
    source: number;
    bbox?: string;
  };
  end_document: Collection & {
    source: number;
    bbox?: string;
  };
};

export type FlashcardData = {
  contentId?: string;
  flashcardId?: string;
};

export type FlashcardModifiers = {
  isShuffled: boolean;
  showOnlyStarred: boolean;
  selectedKeyConcepts?: string[];
};

export type FlashcardMode = "fastReview" | "activeRecall";
export type FlashcardView = "display" | "manage" | "menu" | "activeRecallIntro";

export type FlashcardStore = {
  mode: FlashcardMode;
  view: FlashcardView;
  viewMap: Record<FlashcardMode, FlashcardView>;

  currentIndex: number;
  displayModifiers: {
    isShuffled: boolean;
    showOnlyStarred: boolean;
    selectedKeyConcepts?: string[];
  };

  currentIndexMap: Record<FlashcardMode, number>;
  displayModifiersMap: Record<
    FlashcardMode,
    {
      isShuffled: boolean;
      showOnlyStarred: boolean;
      selectedKeyConcepts?: string[];
    }
  >;

  data: FlashcardData;

  editSession: {
    deletedCardIds: string[];
    editedCards: Record<string, Partial<Flashcard>>;
  };

  setMode: (mode: FlashcardMode) => void;
  setView: (view: FlashcardView, data: FlashcardData) => void;
  setData: (data: FlashcardData) => void;
  setCurrentIndex: (index: number, mode?: FlashcardMode) => void;
  setDisplayModifiers: (
    modifiers: Partial<FlashcardModifiers>,
    mode?: FlashcardMode,
  ) => void;

  updateCard: (cardId: string, changes: Partial<Flashcard>) => void;
  markCardDeleted: (cardId: string) => void;
  restoreCard: (cardId: string) => void;
  clearEditSession: () => void;

  introSeenActiveRecall: Record<string, boolean>;
  setIntroSeen: (contentId: string) => void;

  showIntroActiveRecall: (contentId: string) => void;
};

export type FlashcardFormData = {
  flashcards: Array<{
    _id: string;
    question: string;
    answer: string;
    hint: string;
    explanation: string;
    source: number;
    key_concept?: {
      id?: string;
      collection: string;
    };
    is_starred: boolean;
    idx: number;
    metadata: any;
    created_at: Date;
    bbox?: string;
  }>;
};

export type ScrollToElementOptions = {
  align?: "start" | "center" | "end";
  behavior?: ScrollBehavior;
  offset?: number;
  onScrollEnd?: () => void;
};

export type Tab = {
  label: string;
  media: string;
  mediaType: string;
};

export type Step = {
  title: string;
  description: string | ReactNode;
  tabs?: Tab[];
  media?: string;
  mediaType?: "video" | "image";
};

export type Product = {
  name: string;
  monthly: {
    price: number;
    stripe_price_id: string;
    formatted_price: string;
    interval: string;
    interval_count: number;
    billing_scheme: string;
    metadata: {
      original_price_id: string;
      description: string;
      trial_period_days: number | null;
    };
  };
  quarterly?: {
    price: number;
    stripe_price_id: string;
    formatted_price: string;
    interval: string;
    interval_count: number;
    billing_scheme: string;
    metadata: {
      original_price_id: string;
      description: string;
      trial_period_days: number | null;
    };
  };
  yearly: {
    price: number;
    stripe_price_id: string;
    formatted_price: string;
    interval: string;
    interval_count: number;
    billing_scheme: string;
    metadata: {
      original_price_id: string;
      description: string;
      trial_period_days: number | null;
    };
  };
};

export type PriceData = {
  currency: string;
  products: Product[];
  name: string;
};

export type OfferData = {
  customer_id: string;
  offer_id: string;
  workspace_id: string;
  valid_until: string;
  experiment_id: string;
  currency: string;
};

export type Limit = {
  current_usage: number;
  limit: number;
  interval: LimitInterval;
};

export type SummaryLimit = {
  detailed_summary: Limit;
  detailed_summary_interval: number;
  custom_summary: Limit;
  custom_summary_interval: number;
};

export type LimitInterval = "day" | "week" | "month";

export type TierLimits = {
  // User Services
  get_spaces: number;
  get_content_history: number;
  get_profile: number;
  update_profile: number;

  // Space Services
  add_space: number;
  clone_space: number;
  delete_space: number;
  update_space: number;
  get_space: number;
  add_users_to_space: number;
  update_space_users: number;
  edit_space_content: number;

  // Content Services
  add_content_in_space: number;
  add_content_in_space_interval: number;
  add_content_no_space: number;
  add_content_no_space_interval: number;
  pdf_page_count: number;
  start_stt: number;
  start_stt_interval: number;
  delete_content: number;
  get_content: number;
  get_content_flashcards: number;
  content_flashcards_preview: number;

  // AI Services
  generate_content_summary: number;
  generate_content_summary_v2: number;
  generate_content_detailed_summary: number;
  generate_content_detailed_summary_interval: number;
  generate_content_custom_summary: number;
  generate_content_custom_summary_interval: number;
  generate_summary_range: number;
  generate_summary_range_interval: number;
  generate_content_para_summary: number;
  generate_space_summary: number;
  generate_content_chat_prompts: number;
  generate_space_chat_prompts: number;
  generate_content_flashcards: number;
  generate_content_article: number;
  generate_question_answer: number;
  generate_question_answer_interval: number;
  regenerate_questions: number;

  // Exam
  create_exam: number;
  create_exam_interval: number;
  retry_exam: number;

  // Chat Services
  get_chat_history: number;
  chat: number;
  chat_interval: number;
  chat_agentic: number;
  chat_agentic_interval: number;
  chat_voice: number;
  chat_voice_interval: number;

  // Upload Services
  upload_content: number;
  upload_content_size: number;
  upload_chat_image: number;
};

export type PricingLimit = {
  free: TierLimits;
  core: TierLimits;
  pro: TierLimits;
  plus: TierLimits;
  unlimited: TierLimits;
};

export type ResizeState = {
  isFullTab: boolean;
  panelSize: number;
  setIsFullTab: (newFullTab: boolean) => void;
  setPanelSize: (newSize: number) => void;
  isSecondaryPanelOpen: boolean;
  setIsSecondaryPanelOpen: (newIsSecondaryPanelOpen: boolean) => void;
};

export type CaptureOverlayProps = {
  isDragging: boolean;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
};

export type WebsocketEvent = {
  type: string;
  function: string;
  output: any;
};

export type Seo = {
  title: string;
  description: string | null;
  image: string | null;
};

export type ContentViewStore = {
  contentView: ContentViewType;
  setContentView: (contentView: ContentViewType) => void;
};

export type SpaceContent = {
  content_id: string;
  content_title?: string;
  idx?: number;
};

export type SortableContentCardProps = {
  content: Content;
  priority: boolean;
  spaceId: string;
  dropdownItems: DropdownItem[];
  className?: string;
};

export type SortableTableRowProps = {
  item: Content;
  index: number;
  dropdownItems: DropdownItem[];
  isDragging?: boolean;
  isTestMode?: boolean;
  isSelected?: boolean;
  onContentClick?: (
    e: React.MouseEvent<HTMLElement>,
    contentId: string,
  ) => void;
};

export type ChunkType =
  | "thought"
  | "web_search_thought"
  | "flashcards_thought"
  | "learn_thought"
  | "quiz_thought"
  | "whiteboard_thought"
  | "summary_thought"
  | "calculation_thought"
  | "response"
  | "source"
  | "space_source"
  | "whiteboard"
  | "web_search_source"
  | "quiz"
  | "navigate"
  | "error"
  | "flashcards"
  | "rdkit_diagram"
  | "rdkit_diagram_thought";

export type WhiteboardType =
  | "text/html"
  | "text/markdown"
  | "xml"
  | "application/react";

export type BaseResponseChunk = {
  content: string;
  type: ChunkType;
  done?: boolean;
};

export type FlashcardsResponseChunk = BaseResponseChunk & {
  type: "flashcards";
  flashcards: Flashcard[];
};

export type FlashcardsThoughtResponseChunk = BaseResponseChunk & {
  type: "flashcards_thought";
  title?: string;
};

export type WebSearchContent = {
  source_id: string;
  type: ContentType;
  title: string;
  url: string;
  favicon?: string;
  description?: string;
};

export type WebSearchSourceChunk = BaseResponseChunk & {
  type: "web_search_source";
  content_dict: WebSearchContent;
};

export type ErrorResponseChunk = BaseResponseChunk & {
  type: "error";
  status: number;
  service: keyof TierLimits;
};

export type ThoughtResponseChunk = BaseResponseChunk & {
  type: "thought";
  title?: string;
  delta?: string;
};

export type WebSearchThoughtResponseChunk = BaseResponseChunk & {
  type: "web_search_thought";
  title?: string;
};

export type LearnThoughtResponseChunk = BaseResponseChunk & {
  type: "learn_thought";
  title?: string;
};

export type QuizThoughtResponseChunk = BaseResponseChunk & {
  type: "quiz_thought";
  title?: string;
};

export type WhiteboardThoughtResponseChunk = BaseResponseChunk & {
  type: "whiteboard_thought";
  title?: string;
};

export type SummaryThoughtResponseChunk = BaseResponseChunk & {
  type: "summary_thought";
  title?: string;
};

export type CalculationThoughtResponseChunk = BaseResponseChunk & {
  type: "calculation_thought";
  title?: string;
};

export type ResponseResponseChunk = BaseResponseChunk & {
  type: "response";
};

export type SourceResponseChunk = BaseResponseChunk & {
  type: "source";
  bbox?: string;
};

export type SpaceSourceResponseChunk = BaseResponseChunk & {
  type: "space_source";
  bbox?: string;
  source?: string;
};

export type WhiteboardResponseChunk = BaseResponseChunk & {
  type: "whiteboard";
  /**
   * @deprecated
   * switched to content for newer diagrams
   */
  pre_delta?: string;
  identifier: string;
  title: string;
  wtype: WhiteboardType;
};

export type NavigationResponseChunk = BaseResponseChunk & {
  title: string;
  type: "navigate";
  source: number;
  bbox?: string;
};

export type RDKitDiagramResponseChunk = BaseResponseChunk & {
  type: "rdkit_diagram";
  title: string;
  success: boolean;
  output?: string;
};

export type RDKitDiagramThoughtResponseChunk = BaseResponseChunk & {
  type: "rdkit_diagram_thought";
  title: string;
};

export type GenUIBaseQuestion = {
  idx: number;
  question: string;
  question_type: QuestionType;
  source: number;
  explanation: string;
  bbox?: string;
};

export type GenUIMCQQuestion = GenUIBaseQuestion & {
  question_type: "multiple_choice";
  options: string[];
  correct_option_idx: number;
};

export type GenUIFRQQuestion = GenUIBaseQuestion & {
  question_type: "free_response";
  answer?: string;
};

export type GenUITFQuestion = GenUIBaseQuestion & {
  question_type: "true_false";
  answer?: boolean;
};

export type GenUIFIBQuestion = GenUIBaseQuestion & {
  question_type: "fill_in_blanks";
  answer?: string;
};

export type QuizResponseChunk = BaseStreamChatChunk & {
  quiz_id?: string;
  focus: string;
  content: string;
  type: "quiz";
  questions: GenUiQuizQuestion[];
  answers: GenUiQuizQuestionAnswerDict;
};

export type ResponseChunk =
  | ErrorResponseChunk
  | ThoughtResponseChunk
  | WebSearchThoughtResponseChunk
  | LearnThoughtResponseChunk
  | QuizThoughtResponseChunk
  | WhiteboardThoughtResponseChunk
  | SummaryThoughtResponseChunk
  | CalculationThoughtResponseChunk
  | ResponseResponseChunk
  | SourceResponseChunk
  | SpaceSourceResponseChunk
  | WhiteboardResponseChunk
  | QuizResponseChunk
  | WebSearchSourceChunk
  | NavigationResponseChunk
  | FlashcardsResponseChunk
  | FlashcardsThoughtResponseChunk
  | RDKitDiagramResponseChunk
  | RDKitDiagramThoughtResponseChunk;

export type BaseStreamChatChunk = {
  delta: string;
  type: ChunkType;
  done?: boolean;
};

export type StreamFlashcardsChunk = BaseStreamChatChunk & {
  type: "flashcards";
  flashcards: Flashcard[];
};

export type StreamErrorChunk = BaseStreamChatChunk & {
  type: "error";
  status: number;
  service: keyof TierLimits;
};

export type StreamThoughtChunk = BaseStreamChatChunk & {
  type: "thought";
  title?: string;
};

export type StreamWebSearchThoughtChunk = BaseStreamChatChunk & {
  type: "web_search_thought";
  title?: string;
};

export type StreamLearnThoughtChunk = BaseStreamChatChunk & {
  type: "learn_thought";
  title?: string;
};

export type StreamQuizThoughtChunk = BaseStreamChatChunk & {
  type: "quiz_thought";
  title?: string;
};

export type StreamWhiteboardThoughtChunk = BaseStreamChatChunk & {
  type: "whiteboard_thought";
  title?: string;
};

export type StreamSummaryThoughtChunk = BaseStreamChatChunk & {
  type: "summary_thought";
  title?: string;
};

export type StreamCalculationThoughtChunk = BaseStreamChatChunk & {
  type: "calculation_thought";
  title?: string;
};

export type StreamResponseChunk = BaseStreamChatChunk & {
  type: "response";
};

export type StreamSourceChunk = BaseStreamChatChunk & {
  type: "source";
  bbox?: string;
};

export type StreamSpaceSourceChunk = BaseStreamChatChunk & {
  type: "space_source";
  bbox?: string;
  source?: string;
};

export type StreamWhiteboardChunk = BaseStreamChatChunk & {
  type: "whiteboard";
  pre_delta: string;
  identifier: string;
  title: string;
  wtype: WhiteboardType;
};

export type StreamWebSearchSourceChunk = BaseStreamChatChunk & {
  type: "web_search_source";
  content_dict: WebSearchContent;
};

export type StreamQuizChunk = BaseStreamChatChunk & {
  type: "quiz";
  questions: GenUiQuizQuestion[];
  answers: GenUiQuizQuestionAnswerDict;
  focus: string;
  delta: string;
};

export type StreamNavigationChunk = BaseStreamChatChunk & {
  type: "navigate";
  title: string;
  source: number;
  bbox?: string;
};

export type StreamFlashcardsThoughtChunk = BaseStreamChatChunk & {
  type: "flashcards_thought";
  title?: string;
};

export type StreamRDKitDiagramChunk = BaseStreamChatChunk & {
  type: "rdkit_diagram";
};

export type StreamRDKitDiagramThoughtChunk = BaseStreamChatChunk & {
  type: "rdkit_diagram_thought";
  title: string;
};

export type StreamChatChunk =
  | StreamErrorChunk
  | StreamThoughtChunk
  | StreamWebSearchThoughtChunk
  | StreamLearnThoughtChunk
  | StreamQuizThoughtChunk
  | StreamWhiteboardThoughtChunk
  | StreamSummaryThoughtChunk
  | StreamCalculationThoughtChunk
  | StreamResponseChunk
  | StreamSourceChunk
  | StreamSpaceSourceChunk
  | StreamWhiteboardChunk
  | StreamWebSearchSourceChunk
  | StreamQuizChunk
  | StreamNavigationChunk
  | StreamFlashcardsChunk
  | StreamFlashcardsThoughtChunk
  | StreamRDKitDiagramChunk
  | StreamRDKitDiagramThoughtChunk;

export type ConcatChunk =
  | ResponseResponseChunk
  | SourceResponseChunk
  | SpaceSourceResponseChunk
  | WebSearchSourceChunk;

export type AdvancedMessageProps = {
  children: React.ReactNode;
  type: "ai" | "user";
  id?: string;
  is_voice?: boolean;
  className?: string;
};

export type SourceTooltipProps = {
  source: string;
  type: SourceType;
  bbox?: BoundingBoxData;
  sourceNumber?: string;
};

export type NoteResponse = {
  _id: string;
  created_at: string;
  user: Collection;
  content: Collection;
  note: PartialBlock<DefaultBlockSchema>[];
  metadata: Record<string, unknown>;
};

export type ScrollState = {
  scrollPosition: number;
  contentId: string | null;
  setScrollData: (position: number, contentId: string) => void;
  resetScroll: () => void;
};

export type MobileTabsProps = {
  type: ContentType;
  showContent: boolean;
  setShowContent: (value: boolean) => void;
};

export type Location = {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  isp: string;
  lat: number;
  lon: number;
  org: string;
  query: string;
};

export type SummaryResponse = {
  summary: ResponseChunk[];
  summary_type: SummaryPreference;
  user_prompt?: UserSummaryPrompt;
  summary_range?: number[];
};

export type UserSummaryPrompt = {
  _id: string;
  user: User;
  name: string;
  prompt: string;
  metadata: Record<string, unknown>;
};

export type GetUserSummaryPromptsResponse = {
  prompts: UserSummaryPrompt[];
  default_prompt_id?: string;
};

export type StudyGuideAnswer = {
  _id: string;
  created_at: string;
  user: Collection;
  question: Collection;
  answer?: string;
  score: number;
  feedback: string;
  is_completed: boolean;
};

export type ChatMessagesProps = {
  chats?: Chat[];
  isStreaming?: boolean;
  className?: string;
  welcomeMessage?: string;
  handleQuestion?: (question: string) => void;
  chatContextContents?: Content[];
};

export type StudyGuideData = {
  contentId?: string;
  questionId?: string;
  groupedKeyConceptIds?: string[];
};

export type StudyGuideStore = {
  currentIndex: number;
  view: "display" | "edit" | "result";
  data: StudyGuideData | null;
  navigatedGroupId: string | null;

  setCurrentIndex: (index: number) => void;
  setView: (view: "display" | "edit" | "result") => void;
  setData: (data: StudyGuideData) => void;
  setNavigatedGroupId: (groupId: string | null) => void;
};

export type ChatStore = {
  message: string;
  messageMap: Record<string, string>;
  setMessage: (message: string) => void;
  getMessageForContent: (contentId: string) => string;
  setMessageForContent: (contentId: string, message: string) => void;
  clearMessageForContent: (contentId: string) => void;
};

export type StudyGuideConceptGroup = {
  group_id: string;
  title: string;
  progress: number;
  question_types: QuestionType[];
  difficulties: QuizDifficulty[];
};

export type StudyGuideConceptProgress = {
  groups: StudyGuideConceptGroup[];
};

export type QuestionType =
  | "multiple_choice"
  | "free_response"
  | "true_false"
  | "fill_in_blanks";

export type QuizDifficulty = "easy" | "medium" | "hard";

export type BaseQuestion = {
  _id: string;
  idx: number;
  question: string;
  question_type: QuestionType;
  content: Collection;
  created_at: string;
  key_concept: Collection;
  is_starred: boolean;
  language: string;
  user: Collection;
  bbox?: string;
  source: number;
  explanation?: string;
};

export type MCQQuestion = BaseQuestion & {
  question_type: "multiple_choice";
  options: string[];
  correct_option_idx: number;
};

export type FRQQuestion = BaseQuestion & {
  question_type: "free_response";
  answer?: string;
};

export type TFQuestion = BaseQuestion & {
  question_type: "true_false";
  answer?: boolean;
};

export type FIBQuestion = BaseQuestion & {
  question_type: "fill_in_blanks";
  answer: string[];
};

export type Question = MCQQuestion | FRQQuestion | TFQuestion | FIBQuestion;

export type FillInBlankQuestionProps = {
  question: FIBQuestion;
  answer: string;
  onAnswerChange: (answer: string) => void;
  answerStatus: AnswerStatus;
  isDisabled?: boolean;
};

export type Segment = {
  type: "text" | "blank";
  content: string;
  index?: number;
};

export type StudyGuideQuestionCardProps = {
  question: Question;
  submitAnswer: (answer: string | undefined) => void;
  frqAnswer: string;
  setFrqAnswer: (answer: string) => void;
  answer?: StudyGuideAnswer;
  answerStatus: AnswerStatus;
  isAnswerSubmitting: boolean;
  tryAgainLabel: boolean;
  recordingState: RecordingState;
  startRecording: () => void;
  stopAndTranscribe: () => void;
  cancelRecording: () => void;
};

export type AnswerStatus =
  | "correct"
  | "incorrect"
  | "dontKnow"
  | "markedComplete"
  | "unattempted";

export type MagicCardProps = {
  name: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  onTouchStart?: () => void;
  isPopular?: string;
  className?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  tooltip?: string;
  progress?: number;
};

export type Delimiter = {
  left: string;
  right: string;
  display: boolean;
};

export type KatexData = {
  type: "text" | "math";
  data: string;
  rawData?: string;
  display?: boolean;
};

export type AuthRequiredProps = {
  message?: string;
  loadingMessage?: string;
};

export type SpaceExamData = {
  space_id: string;
};

export type SpaceExamStore = {
  step: number;
  setStep: (step: number) => void;
  data: SpaceExamData | null;
  setData: (data: SpaceExamData) => void;
  isSpaceExamOpen: boolean;
  setIsSpaceExamOpen: (isSpaceExamOpen: boolean) => void;
  selectedContents: Content[];
  setSelectedContents: (selectedContents: Content[]) => void;
  toggleContent: (content: Content) => void;
  toggleSelectAll: (allContents: Content[]) => void;
  reset: () => void;
};

export type UserExam = {
  _id: string;
  created_at: string;
  user: Collection;
  contents: Collection[];
  space: Collection;
  exam_date: Date;
  exam_duration: number;
  past_paper_url: string;
  question_types: QuestionType[];
  total_questions: number;
};

export type ExamQuestion = Question & {
  exam: Collection;
  content: Content;
  key_concept: KeyConcept;
};

export type Exam = {
  questions: ExamQuestion[];
  user_exam: UserExam;
  submitted_at: string;
};

export type ExamAnswer = {
  _id: string;
  created_at: string;
  user: Collection;
  exam: Collection;
  question: Collection;
  answer: string;
  submitted_at: string;
  is_skipped: boolean;
  score: number;
  feedback: string;
};

export type SpaceExamAnswer = {
  answers: ExamAnswer[];
};

export type SpaceExamContent = {
  content: Content;
  progress: number;
  concepts: SpaceExamConcept[];
};

export type SpaceExamConcept = {
  concept_id: string;
  concept_name: string;
  progress: number;
  question_count: number;
  start_source: number;
  end_source: number;
  end_bbox?: string;
};

export type SpaceExamProgress = {
  overall_progress: number;
  contents: SpaceExamContent[];
  num_skipped: number;
};

export type UserContentSummaryRange = {
  summary_ranges: SummaryRange[];
};

export type SummaryRange = {
  id: string;
  range?: number[][];
  key_concepts?: string[];
  created_at: Date;
};

export type ReferralCode = {
  code: string;
  redemptions: ReferralRedemption[];
};

export type ReferralRedemption = {
  _id: string;
  code: Collection;
  user: Collection;
  created_at: Date;
  redeemed_at: Date;
  metadata: Record<string, unknown>;
};

export type SearchHighlightStore = {
  searchQuery: string;
  activeMatchIndex: number;
  totalMatches: number;
  isSearching: boolean;
  componentMatches: Record<string, number>;

  // Actions
  setSearchQuery: (query: string) => void;
  reportComponentMatches: (componentId: string, count: number) => void;
  clearComponentMatches: () => void;
  nextMatch: () => void;
  previousMatch: () => void;
  resetSearch: () => void;
  debouncedSetSearchQuery: (query: string) => void;
};

export type GenUiQuizCardProps = {
  question: GenUiQuizQuestion;
  answer: GenUiQuizQuestionAnswer;
  frqAnswer: string;
  setFrqAnswer: (answer: string) => void;
  onSubmitAnswer: (answer: string | undefined, isCompleted?: boolean) => void;
  answerStatus: AnswerStatus;
  isAnswerSubmitting: boolean;
  recordingState?: RecordingState;
  startRecording?: () => void;
  stopAndTranscribe?: () => void;
  cancelRecording?: () => void;
};

export type GenUiQuizQuestion = GenUIMCQQuestion | GenUIFRQQuestion;

export type GenUiQuizQuestionAnswerDict = {
  [key: string]: GenUiQuizQuestionAnswer;
};

export type GenUiQuizQuestionAnswer = {
  is_completed: boolean;
  feedback: string;
  answer?: string;
  score: number;
};

export type GenUiQuizData = {
  view: "display" | "practice";
  currentIndex: number;
};

export type CurrentSourceStore = {
  currentSource: number;
  setCurrentSource: (source: number) => void;
};

export type LearnSuggestionType = "check" | "deepen" | "explore";

export type LearnSuggestion = {
  prompt: string;
  category: LearnSuggestionType;
};

export type ChatLoadingStore = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  streaming: boolean;
  setStreaming: (streaming: boolean) => void;
};

export type SpaceExamQuestionIdStore = {
  questionId: string | null;
  setQuestionId: (questionId: string | null) => void;
  title: string | null;
  setTitle: (title: string | null) => void;
};

export type CustomErrorType = {
  status: number;
  statusText: string;
  service?: keyof TierLimits;
  message?: string;
  title?: string;
};

export type GenUiFlashcardData = {
  view: "display" | "practice";
  currentIndex: number;
};

export type GenUiFlashcardCardProps = {
  flashcard: Flashcard;
  cardState: GenUiFlashcardCardState;
  setCardState: (cardState: GenUiFlashcardCardState) => void;
  contentType?: ContentType;
};

export type GenUiFlashcardCardState = {
  isFlipped: boolean;
  showHint: boolean;
  showExplanation: boolean;
  showAnswer: boolean;
};

export type GenUiFlashcardControlsProps = {
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  isLastCard: boolean;
  onFinish: () => void;
  currentIndex: number;
  totalCards: number;
};

export type InitMultipartUploadFile = {
  upload_id: string;
  key: string;
  part_urls: { url: string; key: string }[];
  chunk_size: number;
};

export type CompleteMultipartUploadFile = {
  url: string;
};

export type PartETag = {
  PartNumber: number;
  ETag: string;
};

export type TierLimitUpgradeModalContentProps = {
  service: keyof TierLimits | undefined;
  showFeedbackForm: boolean;
  setShowFeedbackForm: (showFeedbackForm: boolean) => void;
  closeModal: () => void;
};

export type LivekitConnectionResponse = {
  token: string;
  room: string;
  metadata: string;
};

export type VoiceCompletionOptions = {
  onCompletion?: () => void;
};

export type AddFlashcardFromChatRequest = {
  question: string;
  answer: string;
  hint: string;
  explanation: string;
  source: number;
  key_concept: string;
  bbox: string;
};

export type ReceivedTranscriptionSegment = TranscriptionSegment & {
  receivedAtMediaTimestamp: number;
  receivedAt: number;
};

export type CustomChatLoadingState = {
  isLoading: boolean;
  type: CustomChatLoadingType;
  setIsLoading: (isLoading: boolean) => void;
  setType: (type: CustomChatLoadingType) => void;
};

export type CustomChatLoadingType = "message" | null;

export type PasteItem = {
  id: string;
  type: string;
  value: string;
};

export type PasteChatInputStore = {
  inputs: PasteItem[] | null;
  appendInput: (input: Omit<PasteItem, "id">) => void;
  removeInput: (id: string) => void;
  removeAllInputs: () => void;
};

export type InputType = "youtube" | "link" | "web";

export type FeatureMentionItem = SuggestionDataItem & {
  logo: React.ElementType;
  description: string;
  display: string;
  color: string;
};

export type MentionItemType = "header" | "tool" | "content";

export type EnhancedFeatureMentionItem = FeatureMentionItem & {
  itemType: MentionItemType;
  isFirstInSection?: boolean;
  sectionCssClass?: string;
};

export type FlashcardStateCounts = {
  Learning: number;
  Relearning: number;
  Review: number;
};

export type RatingCounts = {
  again: number;
  hard: number;
  good: number;
  easy: number;
};

export type PendingReviewStats = {
  new: number; // New/Learning cards pending review today, within daily limit
  review: number; // Review cards pending review today, within daily limit
};

export type OverallStats = {
  new: number; // Total cards currently in New or Learning state (state 0 or 1)
  review: number; // Total cards currently in Review state (state 2) and completed cards
};

export type FlashcardProgress = {
  daily_new_limit: number | null; // User's daily NEW-card limit. Null means unlimited
  new_quota_remaining: number | null; // Remaining quota of NEW cards that can still be introduced today
  completed_today: PendingReviewStats; // Distinct cards reviewed today broken down by new/review
  pending_for_today: PendingReviewStats; // Cards still due today (new is capped by remaining quota)
  overall_progress: OverallStats; // Counts of all cards in the deck broken down by new/review
  todays_rating_counts: RatingCounts; // Counts of each rating given by the user today
  next_review_date: string | null; // Earliest future due date of any card in this deck (null if none)
};

export type FlashcardsDailyReviewLimit = {
  user_id: string;
  flashcards_daily_review_limit: number;
};

export type FlashcardsLearningSteps = {
  learning_steps: number[];
};

export type FlashcardSettingsFormData = {
  dailyLimit: number;
  starredOnly: boolean;
  selectedKeyConcepts: string[];
  learningSteps: number[]; // Array of seconds
  dirtyFields?: Record<string, any>; // Flexible type that works with any form structure
};

export type FlashcardSettingsDropdownProps = {
  enabled: boolean;
  contentId: string;
  className?: string;
  onSubmit: (data: FlashcardSettingsFormData) => void;
};

export type ActiveRecallFlashcard = Flashcard & {
  rating_previews: Record<1 | 2 | 3 | 4, Date>;
};

export type FlashcardActiveReviewLog = {
  flashcard_id: string;
  srs_id: string;
  most_recent_rating: number;
};

export type FlashcardActiveReviewLogResponse = {
  flashcards_review_logs: FlashcardActiveReviewLog[];
};

export type FlashcardActiveRecallAllResponse = {
  flashcards: {
    flashcard_id: string;
    next_review_date: Date;
  }[];
};

export type UserUpgradeLimitFirstReachedTime = {
  upgrade_limit_first_reached_at: Date | null;
};

export type ContentProcessingStatus =
  | "extraction_complete"
  | "key_concepts_created"
  | "completed"
  | "failed"
  | "connected";

export type BaseContentProcessingEvent = {
  status: ContentProcessingStatus;
  message: string;
  content_id: string;
};

export type ExtractionCompleteEvent = BaseContentProcessingEvent & {
  status: "extraction_complete";
  document_count: number;
  content: Content;
};

export type KeyConceptsCreatedEvent = BaseContentProcessingEvent & {
  status: "key_concepts_created";
  key_concept_count: number;
  content: Content;
};

export type ProcessingCompletedEvent = BaseContentProcessingEvent & {
  status: "completed";
  content: Content;
};

export type ProcessingFailedEvent = BaseContentProcessingEvent & {
  status: "failed";
  error: string;
  status_code: number;
  service?: keyof TierLimits;
};

export type ContentConnectedEvent = BaseContentProcessingEvent & {
  status: "connected";
  contentId?: string;
  userId?: string;
  timestamp?: number;
};

export type ContentProcessingEvent =
  | ExtractionCompleteEvent
  | KeyConceptsCreatedEvent
  | ProcessingCompletedEvent
  | ProcessingFailedEvent
  | ContentConnectedEvent;

export type ChatContentContextStore = {
  contextContents: Content[];
  addContextContent: (content: Content) => void;
  removeContextContent: (content: Content) => void;
  updateContextContent: (content: Content) => void;
  resetContextContents: () => void;
};

export type PlaylistItem = {
  snippet: {
    resourceId: {
      videoId: string;
    };
    title: string;
    position: number;
  };
};

export type YouTubePlaylistResponse = {
  items: PlaylistItem[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
};

export type VideoUrl = {
  videoId: string;
  title: string;
  url: string;
  position: number;
};

export type RecordingState = "idle" | "recording" | "processing";

export type NewFeature = {
  id: string;
  title: string;
  description: string;
  mediaSrc?: string;
  bgColor?: string;
};

export type NewFeatureStore = {
  dismissedFeatureIds: string[];
  dismissFeature: (id: string) => void;
  getActiveFeatures: () => NewFeature[];
  resetDismissed: () => void;
};

export type TTSCacheResponse = {
  hash: string;
  audio_url: string | null;
};

export type PlayerState = "idle" | "loading" | "playing" | "stopping";
