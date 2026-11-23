import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Copy,
  Loader2,
  Sparkles,
  RefreshCcw,
  Check,
  Share2,
  Lightbulb,
  AlertCircle,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Send,
  X,
  FileText,
  SlidersHorizontal,
  Hash,
  Smile,
  Users,
  Pencil,
  RotateCcw,
  History,
  Layers,
  Wand2,
  Download,
  Calendar,
  Bookmark,
  UserCheck,
  LayoutTemplate,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronDown,
  User,
  LogIn,
  LogOut,
  Cloud,
  CloudOff,
  CloudUpload,
  KeyRound,
  ShieldCheck,
  Search,
} from "lucide-react";
import {
  useGeneratePost,
  useRewritePost,
  PostVariation,
  useAuthMe,
  useLogin,
  useSignup,
  useLogout,
  useForgotPassword,
  useResetPassword,
  useSyncedDrafts,
  useCreateSyncedDraft,
  useUpdateSyncedDraft,
  useDeleteSyncedDraft,
  useImportLocalDrafts,
  SyncedDraft,
} from "@workspace/api-client-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

import { POST_TEMPLATES, PostTemplate } from "@/lib/templates";
import { VoiceProfile, loadVoiceProfile, saveVoiceProfile } from "@/lib/voice-profile";
import {
  SavedDraft,
  loadDraftHistory,
  saveDraftToHistory,
  deleteDraftFromHistory,
  renameDraftInHistory,
  clearAllDraftHistory,
} from "@/lib/draft-history";
import {
  exportDraftAsFile,
  formatMarkdownExport,
  generateCalendarScheduleLink,
} from "@/lib/export";

const formSchema = z.object({
  topic: z
    .string()
    .min(2, "Topic must be at least 2 characters")
    .max(500, "Topic must be 500 characters or less"),
  tone: z.enum([
    "professional",
    "inspirational",
    "storytelling",
    "humorous",
    "bold",
    "educational",
  ]),
  length: z.enum(["short", "medium", "long"]),
  format: z.enum([
    "lesson_learned",
    "practical_list",
    "opinion",
    "personal_story",
    "announcement",
    "question_led",
  ]).default("lesson_learned"),
  audience: z.string().max(200, "Audience must be 200 characters or less").optional(),
  includeHashtags: z.boolean().default(true),
  includeEmojis: z.boolean().default(false),
  applyVoiceProfile: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const TOPIC_SUGGESTIONS = [
  "Lessons from launching my first product",
  "Why I stopped using to-do lists and started time-blocking",
  "The biggest misconception about remote work",
  "How to hire your first engineer",
  "A mistake that cost me 3 months of progress",
];

const TONE_OPTIONS = [
  { value: "professional", label: "Professional", desc: "Polished, credible & authoritative" },
  { value: "inspirational", label: "Inspirational", desc: "Warm, motivating & sincere" },
  { value: "storytelling", label: "Storytelling", desc: "Narrative-driven with a hard-won lesson" },
  { value: "humorous", label: "Humorous", desc: "Witty, relatable & self-aware" },
  { value: "bold", label: "Bold", desc: "Contrarian, pointed & debate-provoking" },
  { value: "educational", label: "Educational", desc: "Actionable frameworks & clear takeaways" },
] as const;

const LENGTH_OPTIONS = [
  { value: "short", label: "Short", words: "~80 words", desc: "Direct & punchy" },
  { value: "medium", label: "Medium", words: "~180 words", desc: "Hook, body & takeaway" },
  { value: "long", label: "Long", words: "~280 words", desc: "Layered story & insights" },
] as const;

const FORMAT_OPTIONS = [
  { value: "lesson_learned", label: "Lesson Learned", desc: "A hard-won lesson from an obstacle or turning point" },
  { value: "practical_list", label: "Practical List", desc: "Numbered tactical steps or operational rules" },
  { value: "opinion", label: "Contrarian Opinion", desc: "Thought-provoking take challenging an industry norm" },
  { value: "personal_story", label: "Personal Story", desc: "Authentic narrative from the trenches" },
  { value: "announcement", label: "Announcement", desc: "Milestone or launch focused on user value" },
  { value: "question_led", label: "Question-Led", desc: "Curiosity-driven prompt sparking comments" },
] as const;

export default function Home() {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Feature 1 & 2: Variations and Editing State
  const [variations, setVariations] = useState<PostVariation[]>([]);
  const [activeVariationId, setActiveVariationId] = useState<string>("var-1");
  const [variationDrafts, setVariationDrafts] = useState<Record<string, { current: string; original: string }>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editBuffer, setEditBuffer] = useState<string>("");
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Feature 5: Targeted Rewrites State
  const [previousPostBeforeRewrite, setPreviousPostBeforeRewrite] = useState<string | null>(null);

  // Feature 6: Voice Profile State
  const [voiceProfile, setVoiceProfileState] = useState<VoiceProfile>(loadVoiceProfile);
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState<boolean>(false);
  const [voiceDescInput, setVoiceDescInput] = useState<string>("");
  const [voiceSampleInput, setVoiceSampleInput] = useState<string>("");

  // Feature 3: Draft History State
  const [draftHistory, setDraftHistory] = useState<SavedDraft[]>([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState<boolean>(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingDraftTitle, setEditingDraftTitle] = useState<string>("");

  // Feature 4: Accounts & Cloud Synced Drafts State
  const { data: authData, isLoading: isAuthLoading } = useAuthMe();
  const currentUser = authData?.user || null;
  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const logoutMutation = useLogout();
  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();

  const { data: syncedDraftsData, isLoading: isSyncedDraftsLoading } = useSyncedDrafts(Boolean(currentUser));
  const syncedDrafts = syncedDraftsData?.drafts || [];
  const createSyncedDraft = useCreateSyncedDraft();
  const updateSyncedDraft = useUpdateSyncedDraft();
  const deleteSyncedDraft = useDeleteSyncedDraft();
  const importDraftsMutation = useImportLocalDrafts();

  // Auth Dialog State
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<"login" | "signup" | "forgot" | "reset">("login");
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [signupName, setSignupName] = useState<string>("");
  const [signupEmail, setSignupEmail] = useState<string>("");
  const [signupPassword, setSignupPassword] = useState<string>("");
  const [signupError, setSignupError] = useState<string | null>(null);

  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [generatedResetToken, setGeneratedResetToken] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const [resetTokenInput, setResetTokenInput] = useState<string>("");
  const [resetNewPassword, setResetNewPassword] = useState<string>("");
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Explicit Local Draft Import Consent Dialog State
  const [isImportPromptOpen, setIsImportPromptOpen] = useState<boolean>(false);

  // Synced Drafts in History Modal
  const [historyTab, setHistoryTab] = useState<"cloud" | "local">("cloud");
  const [historySearch, setHistorySearch] = useState<string>("");
  const [editingSyncedDraftId, setEditingSyncedDraftId] = useState<string | null>(null);
  const [editingSyncedDraftTitle, setEditingSyncedDraftTitle] = useState<string>("");

  // Feature 7: Templates Library State
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState<boolean>(false);
  const [templateSearch, setTemplateSearch] = useState<string>("");

  // Feature 8: Share & Export State
  const [isShareDialogOpen, setIsShareDialogOpen] = useState<boolean>(false);

  // Feature 9: Scheduling State
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState<boolean>(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 30, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [activeScheduledTime, setActiveScheduledTime] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      tone: "professional",
      length: "medium",
      format: "lesson_learned",
      audience: "",
      includeHashtags: true,
      includeEmojis: false,
      applyVoiceProfile: false,
    },
  });

  const generatePost = useGeneratePost();
  const rewritePostMutation = useRewritePost();

  const currentTopic = form.watch("topic") || "";
  const includeHashtags = form.watch("includeHashtags");
  const selectedTone = form.watch("tone");
  const selectedLength = form.watch("length");
  const selectedFormat = form.watch("format");
  const applyVoice = form.watch("applyVoiceProfile");

  // Load history on mount
  useEffect(() => {
    setDraftHistory(loadDraftHistory());
    const vp = loadVoiceProfile();
    setVoiceProfileState(vp);
    setVoiceDescInput(vp.description);
    setVoiceSampleInput(vp.samplePost);
    if (vp.enabled) {
      form.setValue("applyVoiceProfile", true);
    }
  }, []);

  // Sync variations and drafts when generation finishes
  useEffect(() => {
    if (generatePost.data?.post) {
      const vars = generatePost.data.variations && generatePost.data.variations.length > 0
        ? generatePost.data.variations
        : [
            {
              id: "var-1",
              title: "Angle 1",
              post: generatePost.data.post,
              hashtags: generatePost.data.hashtags,
            },
          ];

      setVariations(vars);
      setActiveVariationId(vars[0].id);

      const draftsMap: Record<string, { current: string; original: string }> = {};
      vars.forEach((v) => {
        draftsMap[v.id] = { current: v.post, original: v.post };
      });
      setVariationDrafts(draftsMap);
      setIsEditing(false);
      setEditBuffer("");
      setPreviousPostBeforeRewrite(null);

      // Auto-save to draft history (Feature 3)
      const updatedHistory = saveDraftToHistory({
        title: form.getValues().topic.slice(0, 48),
        topic: form.getValues().topic,
        post: vars[0].post,
        hashtags: generatePost.data.hashtags || [],
        tone: form.getValues().tone,
        length: form.getValues().length,
        format: form.getValues().format,
        audience: form.getValues().audience,
      });
      setDraftHistory(updatedHistory);

      // Auto-save to cloud if signed in (Accounts & synced drafts)
      if (currentUser) {
        createSyncedDraft.mutate({
          data: {
            title: form.getValues().topic.slice(0, 48),
            topic: form.getValues().topic,
            post: vars[0].post,
            hashtags: generatePost.data.hashtags || [],
            tone: form.getValues().tone,
            length: form.getValues().length,
            format: form.getValues().format,
            audience: form.getValues().audience,
          },
        });
      }
    }
  }, [generatePost.data]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      const len = editTextareaRef.current.value.length;
      editTextareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  // Get active post text for current selected variation
  const currentVarData = variationDrafts[activeVariationId] || {
    current: generatePost.data?.post || "",
    original: generatePost.data?.post || "",
  };
  const activePostText = isEditing ? editBuffer : currentVarData.current;

  const onSubmit = async (data: FormValues) => {
    setLastError(null);
    try {
      const payload = {
        ...data,
        generateVariations: true,
        voiceProfile: data.applyVoiceProfile ? voiceProfile.description : undefined,
      };

      await generatePost.mutateAsync({ data: payload });
      toast({
        title: "Draft generated",
        description: "3 angles generated. Preview, revise, or copy your draft.",
      });
      setHasCopied(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate draft. Please try again.";
      setLastError(message);
      toast({
        title: "Generation failed",
        description: "Unable to generate draft. Your topic and settings were kept intact.",
        variant: "destructive",
      });
    }
  };

  const cleanHashtags = (tags?: string[]): string[] => {
    if (!tags || !Array.isArray(tags)) return [];
    return tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).filter((t) => t.length > 1);
  };

  const handleCopy = () => {
    const textToUse = activePostText.trim();
    if (!textToUse) return;

    let textToCopy = textToUse;
    const currentVar = variations.find((v) => v.id === activeVariationId);
    const tags = cleanHashtags(currentVar?.hashtags || generatePost.data?.hashtags);
    if (includeHashtags && tags.length > 0) {
      textToCopy += "\n\n" + tags.join(" ");
    }

    navigator.clipboard.writeText(textToCopy);
    setHasCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Ready to paste directly into LinkedIn.",
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleRegenerate = () => {
    if (generatePost.isPending) return;
    setIsEditing(false);
    form.handleSubmit(onSubmit)();
  };

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue("topic", suggestion, { shouldValidate: true, shouldDirty: true });
    setLastError(null);
  };

  const handleClearTopic = () => {
    form.setValue("topic", "", { shouldValidate: true, shouldDirty: true });
  };

  // Feature 1: Edit & Save/Cancel handlers
  const handleStartEdit = () => {
    setEditBuffer(currentVarData.current);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editBuffer.trim()) {
      toast({
        title: "Post cannot be empty",
        description: "Please enter some content before saving.",
        variant: "destructive",
      });
      return;
    }

    setVariationDrafts((prev) => ({
      ...prev,
      [activeVariationId]: {
        ...prev[activeVariationId],
        current: editBuffer.trim(),
      },
    }));
    setIsEditing(false);
    toast({
      title: "Draft updated",
      description: "Your revisions have been saved.",
    });

    // Update history
    saveDraftToHistory({
      title: form.getValues().topic.slice(0, 48),
      topic: form.getValues().topic,
      post: editBuffer.trim(),
      hashtags: generatePost.data?.hashtags || [],
      tone: form.getValues().tone,
      length: form.getValues().length,
      format: form.getValues().format,
      audience: form.getValues().audience,
    });
    setDraftHistory(loadDraftHistory());

    // Save to cloud if signed in
    if (currentUser) {
      createSyncedDraft.mutate({
        data: {
          title: form.getValues().topic.slice(0, 48),
          topic: form.getValues().topic,
          post: editBuffer.trim(),
          hashtags: generatePost.data?.hashtags || [],
          tone: form.getValues().tone,
          length: form.getValues().length,
          format: form.getValues().format,
          audience: form.getValues().audience,
        },
      });
    }
  };

  const handleCancelEdit = () => {
    // Restores original generated draft for this angle
    setEditBuffer(currentVarData.original);
    setVariationDrafts((prev) => ({
      ...prev,
      [activeVariationId]: {
        ...prev[activeVariationId],
        current: prev[activeVariationId].original,
      },
    }));
    setIsEditing(false);
    toast({
      title: "Edits cancelled",
      description: "Restored the original generated draft for this angle.",
    });
  };

  // Feature 2: Switch variation tabs
  const handleSelectVariation = (id: string) => {
    if (isEditing) {
      // Save current edit buffer before switching
      setVariationDrafts((prev) => ({
        ...prev,
        [activeVariationId]: {
          ...prev[activeVariationId],
          current: editBuffer.trim() || prev[activeVariationId].current,
        },
      }));
      setIsEditing(false);
    }
    setActiveVariationId(id);
    setPreviousPostBeforeRewrite(null);
  };

  // Feature 5: Targeted Rewrites Handler
  const handleApplyRewrite = async (action: "strengthen_hook" | "make_clearer" | "make_shorter" | "make_warmer" | "stronger_closing") => {
    const postToRewrite = activePostText.trim();
    if (!postToRewrite) return;

    try {
      const res = await rewritePostMutation.mutateAsync({
        data: {
          post: postToRewrite,
          action,
          tone: selectedTone,
        },
      });

      if (res?.post) {
        setPreviousPostBeforeRewrite(postToRewrite);
        setVariationDrafts((prev) => ({
          ...prev,
          [activeVariationId]: {
            ...prev[activeVariationId],
            current: res.post,
          },
        }));
        if (isEditing) {
          setEditBuffer(res.post);
        }
        toast({
          title: "Rewrite applied",
          description: `Applied ${action.replace("_", " ")}. Click 'Undo' if you want to revert.`,
        });
      }
    } catch (err) {
      toast({
        title: "Rewrite failed",
        description: "Could not apply rewrite right now. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUndoRewrite = () => {
    if (!previousPostBeforeRewrite) return;
    setVariationDrafts((prev) => ({
      ...prev,
      [activeVariationId]: {
        ...prev[activeVariationId],
        current: previousPostBeforeRewrite,
      },
    }));
    if (isEditing) {
      setEditBuffer(previousPostBeforeRewrite);
    }
    setPreviousPostBeforeRewrite(null);
    toast({
      title: "Rewrite undone",
      description: "Restored previous draft text.",
    });
  };

  // Feature 6: Voice Profile save
  const handleSaveVoiceProfile = () => {
    const updated: VoiceProfile = {
      ...voiceProfile,
      description: voiceDescInput.trim(),
      samplePost: voiceSampleInput.trim(),
      enabled: true,
      updatedAt: Date.now(),
    };
    saveVoiceProfile(updated);
    setVoiceProfileState(updated);
    form.setValue("applyVoiceProfile", true);
    setIsVoiceDialogOpen(false);
    toast({
      title: "Voice profile saved",
      description: "Your voice preferences will guide upcoming post generations.",
    });
  };

  // Feature 7: Load Template into Composer
  const handleLoadTemplate = (template: PostTemplate) => {
    form.setValue("topic", template.topicPrompt, { shouldValidate: true });
    form.setValue("tone", template.recommendedTone);
    form.setValue("length", template.recommendedLength);
    form.setValue("format", template.recommendedFormat);
    if (template.targetAudience) {
      form.setValue("audience", template.targetAudience);
    }
    setIsTemplateDialogOpen(false);
    toast({
      title: `Template loaded: ${template.title}`,
      description: "Composer controls and topic have been populated.",
    });
  };

  // Feature 3: History actions
  const handleLoadDraftFromHistory = (draft: SavedDraft) => {
    form.setValue("topic", draft.topic, { shouldValidate: true });
    form.setValue("tone", draft.tone as any);
    form.setValue("length", draft.length as any);
    if (draft.format) form.setValue("format", draft.format as any);
    if (draft.audience) form.setValue("audience", draft.audience);

    const varId = "var-1";
    setVariations([
      {
        id: varId,
        title: "Loaded Draft",
        post: draft.post,
        hashtags: draft.hashtags,
      },
    ]);
    setActiveVariationId(varId);
    setVariationDrafts({
      [varId]: { current: draft.post, original: draft.post },
    });
    setIsEditing(false);
    setIsHistoryDialogOpen(false);
    toast({
      title: "Draft reopened",
      description: `Loaded "${draft.title}" into the workspace.`,
    });
  };

  const handleDeleteDraft = (id: string) => {
    const updated = deleteDraftFromHistory(id);
    setDraftHistory(updated);
    toast({ title: "Draft deleted" });
  };

  const handleStartRename = (draft: SavedDraft) => {
    setEditingDraftId(draft.id);
    setEditingDraftTitle(draft.title);
  };

  const handleSaveRename = (id: string) => {
    if (!editingDraftTitle.trim()) return;
    const updated = renameDraftInHistory(id, editingDraftTitle);
    setDraftHistory(updated);
    setEditingDraftId(null);
    toast({ title: "Draft renamed" });
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to remove all saved drafts from this browser?")) {
      clearAllDraftHistory();
      setDraftHistory([]);
      toast({ title: "Draft history cleared" });
    }
  };

  // Feature 4: Auth Handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }
    try {
      await loginMutation.mutateAsync({
        data: { email: loginEmail.trim(), password: loginPassword },
      });
      setIsAuthDialogOpen(false);
      setLoginPassword("");
      toast({
        title: "Signed in successfully",
        description: `Welcome back, ${loginEmail}!`,
      });
      const locals = loadDraftHistory();
      if (locals.length > 0) {
        setIsImportPromptOpen(true);
      }
    } catch (err: any) {
      setLoginError(err?.message || "Failed to log in. Please check your credentials.");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    if (!signupEmail.trim() || !signupPassword) {
      setSignupError("Please provide an email and password.");
      return;
    }
    if (signupPassword.length < 8) {
      setSignupError("Password must be at least 8 characters.");
      return;
    }
    try {
      await signupMutation.mutateAsync({
        data: {
          email: signupEmail.trim(),
          password: signupPassword,
          name: signupName.trim() || undefined,
        },
      });
      setIsAuthDialogOpen(false);
      setSignupPassword("");
      toast({
        title: "Account created!",
        description: `Welcome to PostForge! Your drafts will now sync across devices.`,
      });
      const locals = loadDraftHistory();
      if (locals.length > 0) {
        setIsImportPromptOpen(true);
      }
    } catch (err: any) {
      setSignupError(err?.message || "Failed to create account. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Signed out",
        description: "You are now using local browser storage.",
      });
      setHistoryTab("local");
    } catch (err: any) {
      toast({
        title: "Sign out issue",
        description: err?.message || "Could not log out completely",
        variant: "destructive",
      });
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMsg(null);
    setGeneratedResetToken(null);
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your account email address.");
      return;
    }
    try {
      const res = await forgotPasswordMutation.mutateAsync({
        data: { email: forgotEmail.trim() },
      });
      setForgotSuccessMsg(res.message);
      if (res.resetToken) {
        setGeneratedResetToken(res.resetToken);
        setResetTokenInput(res.resetToken);
      }
    } catch (err: any) {
      setForgotError(err?.message || "Could not process password reset request.");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccessMsg(null);
    if (!resetTokenInput.trim() || !resetNewPassword) {
      setResetError("Please provide both the reset token and your new password.");
      return;
    }
    if (resetNewPassword.length < 8) {
      setResetError("New password must be at least 8 characters.");
      return;
    }
    try {
      const res = await resetPasswordMutation.mutateAsync({
        data: { token: resetTokenInput.trim(), newPassword: resetNewPassword },
      });
      setResetSuccessMsg(res.message || "Password reset successful! You can now log in.");
      setResetNewPassword("");
      setTimeout(() => {
        setAuthTab("login");
        setResetSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setResetError(err?.message || "Failed to reset password. Token may be invalid or expired.");
    }
  };

  // Synced Drafts Handlers
  const handleLoadSyncedDraft = (draft: SyncedDraft) => {
    form.setValue("topic", draft.topic, { shouldValidate: true });
    if (draft.tone) form.setValue("tone", draft.tone as any);
    if (draft.length) form.setValue("length", draft.length as any);
    if (draft.format) form.setValue("format", draft.format as any);
    if (draft.audience) form.setValue("audience", draft.audience);

    const varId = "var-1";
    setVariations([
      {
        id: varId,
        title: draft.title || "Cloud Draft",
        post: draft.post,
        hashtags: draft.hashtags,
      },
    ]);
    setActiveVariationId(varId);
    setVariationDrafts({
      [varId]: { current: draft.post, original: draft.post },
    });
    setIsEditing(false);
    setIsHistoryDialogOpen(false);
    toast({
      title: "Cloud draft opened",
      description: `Loaded "${draft.title}" into the workspace.`,
    });
  };

  const handleDeleteSyncedDraft = async (id: string) => {
    try {
      await deleteSyncedDraft.mutateAsync({ id });
      toast({ title: "Draft deleted from cloud" });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message || "Could not delete synced draft",
        variant: "destructive",
      });
    }
  };

  const handleStartSyncedRename = (draft: SyncedDraft) => {
    setEditingSyncedDraftId(draft.id);
    setEditingSyncedDraftTitle(draft.title);
  };

  const handleSaveSyncedRename = async (id: string) => {
    if (!editingSyncedDraftTitle.trim()) return;
    try {
      await updateSyncedDraft.mutateAsync({
        id,
        data: { title: editingSyncedDraftTitle.trim() },
      });
      setEditingSyncedDraftId(null);
      toast({ title: "Draft renamed" });
    } catch (err: any) {
      toast({
        title: "Rename failed",
        description: err?.message || "Could not rename synced draft",
        variant: "destructive",
      });
    }
  };

  const handleImportLocalDraftsConfirm = async () => {
    const locals = loadDraftHistory();
    if (locals.length === 0) {
      setIsImportPromptOpen(false);
      return;
    }

    try {
      const res = await importDraftsMutation.mutateAsync({
        drafts: locals.map((d) => ({
          title: d.title,
          topic: d.topic,
          post: d.post,
          hashtags: d.hashtags,
          tone: d.tone,
          length: d.length,
          format: d.format,
          audience: d.audience,
        })),
      });

      setIsImportPromptOpen(false);
      toast({
        title: "Drafts imported successfully",
        description: `${res.importedCount} draft(s) have been synced to your account.`,
      });
    } catch (err: any) {
      toast({
        title: "Import failed",
        description: err?.message || "Could not import local drafts.",
        variant: "destructive",
      });
    }
  };

  // Feature 8: Export actions
  const handleExportText = () => {
    const currentVar = variations.find((v) => v.id === activeVariationId);
    const tags = includeHashtags ? cleanHashtags(currentVar?.hashtags || generatePost.data?.hashtags) : [];
    const text = activePostText.trim() + (tags.length > 0 ? `\n\n${tags.join(" ")}` : "");
    const safeTopic = (form.getValues().topic.slice(0, 24) || "linkedin-post").replace(/[^a-zA-Z0-9_-]/g, "_");
    exportDraftAsFile(`postforge_${safeTopic}`, text, "txt");
    toast({ title: "Exported as plain text (.txt)" });
  };

  const handleExportMarkdown = () => {
    const currentVar = variations.find((v) => v.id === activeVariationId);
    const tags = includeHashtags ? cleanHashtags(currentVar?.hashtags || generatePost.data?.hashtags) : [];
    const md = formatMarkdownExport(activePostText, form.getValues().topic || "LinkedIn Post", tags, {
      tone: form.getValues().tone,
      length: form.getValues().length,
      format: form.getValues().format,
    });
    const safeTopic = (form.getValues().topic.slice(0, 24) || "linkedin-post").replace(/[^a-zA-Z0-9_-]/g, "_");
    exportDraftAsFile(`postforge_${safeTopic}`, md, "md");
    toast({ title: "Exported as Markdown (.md)" });
  };

  // Feature 9: Scheduling planner
  const handleConfirmSchedule = () => {
    setActiveScheduledTime(scheduledDateTime);
    setIsScheduleDialogOpen(false);
    toast({
      title: "Publishing planned",
      description: `Targeting publish on ${new Date(scheduledDateTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}.`,
    });
  };

  const hasDraft = Boolean(generatePost.data?.post || currentVarData.current);
  const wordCount = activePostText ? activePostText.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = activePostText ? activePostText.length : 0;
  const readingTime = Math.max(1, Math.round(wordCount / 180));
  const isDraftModified = currentVarData.current !== currentVarData.original && Boolean(currentVarData.original);
  const motionTransition = shouldReduceMotion ? { duration: 0 } : { duration: 0.25 };

  const filteredTemplates = POST_TEMPLATES.filter(
    (t) =>
      t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(templateSearch.toLowerCase())
  );

  const filteredSyncedDrafts = syncedDrafts.filter(
    (d) =>
      d.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      d.topic.toLowerCase().includes(historySearch.toLowerCase()) ||
      d.post.toLowerCase().includes(historySearch.toLowerCase())
  );

  const filteredLocalDrafts = draftHistory.filter(
    (d) =>
      d.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      d.topic.toLowerCase().includes(historySearch.toLowerCase()) ||
      d.post.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-[#FAF9F5] text-slate-900 flex flex-col selection:bg-[#0A66C2]/15">
      {/* Editorial Header */}
      <header className="w-full border-b border-stone-200/80 bg-white/95 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-slate-900 tracking-tight leading-none">
                  PostForge
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                  LinkedIn Studio
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Focused writing workspace with multi-angle drafts, rewrites & templates
              </p>
            </div>
          </div>

          {/* Quick Header Navigation & Tools */}
          <div className="flex items-center gap-2">
            {/* Template Library Trigger */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTemplateDialogOpen(true)}
              className="h-8 text-xs bg-white border-stone-200 text-slate-700 hover:text-slate-900 hover:bg-stone-50"
            >
              <LayoutTemplate className="w-3.5 h-3.5 mr-1 text-[#0A66C2]" />
              <span className="hidden sm:inline">Templates</span>
            </Button>

            {/* Voice Profile Trigger */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsVoiceDialogOpen(true)}
              className="h-8 text-xs bg-white border-stone-200 text-slate-700 hover:text-slate-900 hover:bg-stone-50"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1 text-[#0A66C2]" />
              <span className="hidden sm:inline">Voice Profile</span>
            </Button>

            {/* Draft History Trigger - Only visible when signed in */}
            {currentUser && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryDialogOpen(true)}
                className="h-8 text-xs bg-white border-stone-200 text-slate-700 hover:text-slate-900 hover:bg-stone-50 relative"
              >
                <History className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <span>History</span>
                {syncedDrafts.length > 0 && (
                  <span className="ml-1 bg-stone-100 text-slate-700 font-semibold px-1.5 py-0.2 rounded-full text-[10px] border border-stone-200">
                    {syncedDrafts.length}
                  </span>
                )}
              </Button>
            )}

            {/* Feature 4: Account / Authentication Trigger */}
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-white border-stone-200 text-slate-800 hover:bg-stone-50 gap-1.5 px-2"
                  >
                    <Avatar className="h-5 w-5 text-[10px] bg-[#0A66C2] text-white">
                      <AvatarFallback className="bg-[#0A66C2] text-white text-[10px]">
                        {(currentUser.name || currentUser.email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[100px] truncate hidden md:inline">
                      {currentUser.name || currentUser.email.split("@")[0]}
                    </span>
                    <Cloud className="w-3 h-3 text-emerald-600" />
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border-stone-200">
                  <DropdownMenuLabel className="font-normal text-xs text-slate-500 pb-1">
                    Signed in as
                    <p className="font-semibold text-slate-900 truncate mt-0.5">{currentUser.email}</p>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 mt-1">
                      <Cloud className="w-3 h-3 text-emerald-600" />
                      <span>Drafts synced to cloud</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {draftHistory.length > 0 && (
                    <DropdownMenuItem
                      onClick={() => setIsImportPromptOpen(true)}
                      className="text-xs text-[#0A66C2]"
                    >
                      <CloudUpload className="w-3.5 h-3.5 mr-2 text-[#0A66C2]" />
                      <span>Sync {draftHistory.length} local draft{draftHistory.length > 1 ? "s" : ""}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      setHistoryTab("cloud");
                      setIsHistoryDialogOpen(true);
                    }}
                    className="text-xs text-slate-700"
                  >
                    <History className="w-3.5 h-3.5 mr-2 text-slate-500" />
                    <span>Manage Synced Drafts</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-xs text-red-600 focus:text-red-700 focus:bg-red-50"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setAuthTab("login");
                  setIsAuthDialogOpen(true);
                }}
                className="h-8 text-xs bg-[#0A66C2] hover:bg-[#004182] text-white shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5 mr-1" />
                <span>Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Composer Form */}
          <section
            aria-label="Post Composer"
            className="lg:col-span-6 xl:col-span-6 flex flex-col gap-6"
          >
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-slate-900">
                Compose your post
              </h1>
              <p className="text-sm text-slate-600">
                Start with your core idea, tune the structure and voice, then generate multi-angle drafts.
              </p>
            </div>

            {/* Error Banner */}
            {lastError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50/70 text-red-900">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-sm font-semibold">Unable to generate post</AlertTitle>
                <AlertDescription className="text-xs mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span>{lastError}. Your input has been preserved so you can retry.</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.handleSubmit(onSubmit)()}
                    className="h-7 text-xs border-red-300 hover:bg-red-100 text-red-800 self-start sm:self-auto"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <Card className="border border-stone-200/90 shadow-xs bg-white rounded-xl">
              <CardContent className="p-5 sm:p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    {/* Primary Step: Topic Field */}
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <div className="flex items-center justify-between">
                            <FormLabel
                              htmlFor="post-topic"
                              className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"
                            >
                              <span>1. Post idea or topic</span>
                              <span className="text-red-500" aria-hidden="true">*</span>
                            </FormLabel>
                            <span
                              className={`text-xs ${
                                field.value.length > 450 ? "text-amber-600 font-medium" : "text-slate-400"
                              }`}
                              aria-live="polite"
                            >
                              {field.value.length}/500
                            </span>
                          </div>
                          
                          <div className="relative">
                            <FormControl>
                              <Textarea
                                id="post-topic"
                                placeholder="e.g., Lessons from scaling our engineering team from 5 to 50 without losing culture..."
                                className="min-h-[110px] resize-none text-[15px] leading-relaxed bg-[#FCFBFA] border-stone-200 focus:bg-white transition-colors p-3.5 pr-8 rounded-lg"
                                aria-describedby="topic-hint"
                                {...field}
                              />
                            </FormControl>
                            {field.value.length > 0 && (
                              <button
                                type="button"
                                onClick={handleClearTopic}
                                aria-label="Clear topic input"
                                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <FormMessage />

                          {/* Topic Suggestions (Accessible Prompt Chips) */}
                          {!field.value && (
                            <div className="pt-2 space-y-2" id="topic-hint">
                              <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                <span>Need inspiration? Click a prompt to start:</span>
                              </p>
                              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested topics">
                                {TOPIC_SUGGESTIONS.map((suggestion, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    aria-label={`Use suggestion: ${suggestion}`}
                                    className="text-xs bg-stone-100/90 hover:bg-stone-200/90 text-slate-700 px-2.5 py-1.5 rounded-md border border-stone-200/70 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2]"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    {/* Step 2: Writing Controls (Tone, Length, Format) */}
                    <div className="pt-1 border-t border-stone-100 space-y-4">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Writing Controls
                        </h2>
                      </div>

                      {/* Feature 4: Post Format Selector */}
                      <FormField
                        control={form.control}
                        name="format"
                        render={({ field }) => {
                          const currentFmt = FORMAT_OPTIONS.find((f) => f.value === field.value);
                          return (
                            <FormItem className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <FormLabel htmlFor="format-select" className="text-sm font-medium text-slate-800">
                                  Post structure & format
                                </FormLabel>
                                {currentFmt && (
                                  <span className="text-xs text-slate-500 italic hidden sm:inline">
                                    {currentFmt.desc}
                                  </span>
                                )}
                              </div>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger
                                    id="format-select"
                                    className="h-10 bg-white border-stone-200 text-slate-800 focus:ring-[#0A66C2]"
                                  >
                                    <SelectValue placeholder="Choose post structure" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white border-stone-200">
                                  {FORMAT_OPTIONS.map((fmt) => (
                                    <SelectItem key={fmt.value} value={fmt.value} className="py-2">
                                      <div className="flex flex-col text-left">
                                        <span className="font-medium text-slate-900">{fmt.label}</span>
                                        <span className="text-xs text-slate-500">{fmt.desc}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      {/* Tone Selector */}
                      <FormField
                        control={form.control}
                        name="tone"
                        render={({ field }) => {
                          const currentOption = TONE_OPTIONS.find((t) => t.value === field.value);
                          return (
                            <FormItem className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <FormLabel htmlFor="tone-select" className="text-sm font-medium text-slate-800">
                                  Tone of voice
                                </FormLabel>
                                {currentOption && (
                                  <span className="text-xs text-slate-500 italic hidden sm:inline">
                                    {currentOption.desc}
                                  </span>
                                )}
                              </div>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger
                                    id="tone-select"
                                    className="h-10 bg-white border-stone-200 text-slate-800 focus:ring-[#0A66C2]"
                                  >
                                    <SelectValue placeholder="Choose a tone" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white border-stone-200">
                                  {TONE_OPTIONS.map((tone) => (
                                    <SelectItem key={tone.value} value={tone.value} className="py-2">
                                      <div className="flex flex-col text-left">
                                        <span className="font-medium text-slate-900">{tone.label}</span>
                                        <span className="text-xs text-slate-500">{tone.desc}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      {/* Length Segmented Control */}
                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-medium text-slate-800">
                                Post length
                              </FormLabel>
                              <span className="text-xs text-slate-500">
                                {LENGTH_OPTIONS.find((l) => l.value === field.value)?.desc}
                              </span>
                            </div>
                            <div
                              className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100/80 rounded-lg border border-stone-200/60"
                              role="radiogroup"
                              aria-label="Post length options"
                            >
                              {LENGTH_OPTIONS.map((len) => {
                                const isSelected = field.value === len.value;
                                return (
                                  <button
                                    key={len.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    onClick={() => field.onChange(len.value)}
                                    className={`py-2 px-2 text-center rounded-md text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] ${
                                      isSelected
                                        ? "bg-white text-slate-900 font-semibold shadow-xs border border-stone-200/80"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-stone-200/60"
                                    }`}
                                  >
                                    <div className="leading-tight">{len.label}</div>
                                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                      {len.words}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Optional Target Audience */}
                      <FormField
                        control={form.control}
                        name="audience"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <FormLabel htmlFor="post-audience" className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>Target audience</span>
                              </FormLabel>
                              <span className="text-xs text-slate-400">Optional</span>
                            </div>
                            <FormControl>
                              <Input
                                id="post-audience"
                                placeholder="e.g., Early-stage founders, Design leads, Junior devs..."
                                className="h-10 bg-white border-stone-200 text-slate-800 focus:ring-[#0A66C2]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-slate-500">
                              Tailors vocabulary, context, and takeaways to your specific readers.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Step 3: Formatting & Preferences Group */}
                    <div className="pt-1 border-t border-stone-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Preferences & Style
                          </h2>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="includeHashtags"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between gap-3 p-3 rounded-lg border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition-colors">
                              <div className="space-y-0.5">
                                <FormLabel
                                  htmlFor="switch-hashtags"
                                  className="text-xs font-semibold text-slate-800 cursor-pointer flex items-center gap-1.5"
                                >
                                  <Hash className="w-3.5 h-3.5 text-[#0A66C2]" />
                                  <span>Include Hashtags</span>
                                </FormLabel>
                                <p className="text-[11px] text-slate-500 leading-tight">
                                  3–5 relevant tags at the bottom
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  id="switch-hashtags"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-[#0A66C2]"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="includeEmojis"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between gap-3 p-3 rounded-lg border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition-colors">
                              <div className="space-y-0.5">
                                <FormLabel
                                  htmlFor="switch-emojis"
                                  className="text-xs font-semibold text-slate-800 cursor-pointer flex items-center gap-1.5"
                                >
                                  <Smile className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Include Emojis</span>
                                </FormLabel>
                                <p className="text-[11px] text-slate-500 leading-tight">
                                  Tasteful accents on key points
                                </p>
                              </div>
                              <FormControl>
                                <Switch
                                  id="switch-emojis"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-[#0A66C2]"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Feature 6: Apply Voice Profile Toggle */}
                      <FormField
                        control={form.control}
                        name="applyVoiceProfile"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between gap-3 p-3 rounded-lg border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition-colors">
                            <div className="space-y-0.5">
                              <FormLabel
                                htmlFor="switch-voice"
                                className="text-xs font-semibold text-slate-800 cursor-pointer flex items-center gap-1.5"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-[#0A66C2]" />
                                <span>Apply Voice Profile</span>
                              </FormLabel>
                              <p className="text-[11px] text-slate-500 leading-tight">
                                {voiceProfile.description ? voiceProfile.description.slice(0, 50) + "..." : "Infuse your signature cadence"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsVoiceDialogOpen(true)}
                                className="h-7 text-[11px] text-[#0A66C2] hover:bg-sky-50 px-2"
                              >
                                Edit
                              </Button>
                              <FormControl>
                                <Switch
                                  id="switch-voice"
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-[#0A66C2]"
                                />
                              </FormControl>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Primary Submit Action */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={generatePost.isPending}
                        className="w-full h-11 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-sm shadow-xs transition-colors rounded-lg flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-2"
                      >
                        {generatePost.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Crafting 3 draft angles...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-white" />
                            <span>Generate 3 LinkedIn Drafts</span>
                          </>
                        )}
                      </Button>
                      <p className="text-center text-[11px] text-slate-400 mt-2">
                        Generates 3 distinct angles. You can revise, rewrite, schedule, or copy any draft.
                      </p>
                    </div>

                  </form>
                </Form>
              </CardContent>
            </Card>
          </section>

          {/* Right Column: LinkedIn Post Preview with Feature Extensions */}
          <section
            aria-label="Generated Post Preview"
            className="lg:col-span-6 xl:col-span-6 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <span>Post Preview</span>
                {hasDraft && (
                  <Badge variant="outline" className="text-[10px] font-normal border-emerald-300 bg-emerald-50 text-emerald-800">
                    Draft Ready
                  </Badge>
                )}
                {activeScheduledTime && (
                  <Badge variant="outline" className="text-[10px] font-normal border-purple-300 bg-purple-50 text-purple-800 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Planned</span>
                  </Badge>
                )}
              </h2>
              {hasDraft && (
                <span className="text-xs text-slate-500 transition-colors">
                  {charCount} characters • {wordCount} words
                </span>
              )}
            </div>

            {/* Feature 2: Variations Tab Selector */}
            {variations.length > 1 && !generatePost.isPending && (
              <div
                className="flex items-center gap-1.5 p-1 bg-stone-100/90 rounded-lg border border-stone-200/80 overflow-x-auto"
                role="tablist"
                aria-label="Post variation angles"
              >
                {variations.map((v, idx) => {
                  const isSelected = v.id === activeVariationId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => handleSelectVariation(v.id)}
                      className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-md text-xs font-medium text-center transition-all truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] ${
                        isSelected
                          ? "bg-white text-slate-900 shadow-xs border border-stone-200/80 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-stone-200/60"
                      }`}
                    >
                      {v.title || `Angle ${idx + 1}`}
                    </button>
                  );
                })}
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* State 1: Initial Empty State */}
              {!hasDraft && !generatePost.isPending && (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={motionTransition}
                  className="w-full"
                >
                  <Card className="border border-dashed border-stone-300/80 bg-white/70 rounded-xl overflow-hidden p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
                    <div className="w-14 h-14 rounded-full bg-stone-100 border border-stone-200/80 flex items-center justify-center mb-4 text-slate-400">
                      <FileText className="w-6 h-6 stroke-[1.75]" />
                    </div>
                    <h3 className="font-display font-semibold text-base text-slate-800 mb-1.5">
                      Your drafted post will appear here
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-6">
                      Enter your topic and preferences in the composer, or choose a template above. We'll generate 3 high-impact angles ready to edit and publish.
                    </p>
                    <div className="w-full max-w-xs border border-stone-200/60 rounded-lg p-3 bg-stone-50/60 text-left space-y-2 opacity-60">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-stone-200"></div>
                        <div className="space-y-1 flex-1">
                          <div className="w-20 h-2 bg-stone-200 rounded"></div>
                          <div className="w-14 h-1.5 bg-stone-200 rounded"></div>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-stone-200 rounded"></div>
                      <div className="w-4/5 h-2 bg-stone-200 rounded"></div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* State 2: Active Composing / Loading State */}
              {generatePost.isPending && (
                <motion.div
                  key="loading-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={motionTransition}
                  className="w-full"
                >
                  <Card className="border border-stone-200/90 bg-white rounded-xl overflow-hidden p-6 min-h-[460px] flex flex-col justify-between">
                    <div>
                      {/* LinkedIn Header Skeleton */}
                      <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
                        <div className="w-12 h-12 rounded-full bg-stone-200 animate-pulse"></div>
                        <div className="space-y-2 flex-1">
                          <div className="w-28 h-3.5 bg-stone-200 rounded animate-pulse"></div>
                          <div className="w-40 h-2.5 bg-stone-100 rounded animate-pulse"></div>
                        </div>
                      </div>

                      {/* Content Skeleton */}
                      <div className="py-6 space-y-3" aria-live="polite">
                        <div className="w-3/4 h-3.5 bg-stone-200 rounded animate-pulse"></div>
                        <div className="w-full h-3 bg-stone-100 rounded animate-pulse"></div>
                        <div className="w-5/6 h-3 bg-stone-100 rounded animate-pulse"></div>
                        <div className="w-2/3 h-3 bg-stone-100 rounded animate-pulse pt-2"></div>
                        <div className="w-full h-3 bg-stone-100 rounded animate-pulse"></div>
                        <div className="w-4/5 h-3 bg-stone-100 rounded animate-pulse"></div>
                      </div>
                    </div>

                    <div className="py-4 px-3 bg-stone-50 rounded-lg border border-stone-200/70 flex items-center justify-center gap-2.5 text-xs text-slate-600">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0A66C2]" />
                      <span>Writing 3 distinct angles in {selectedTone} tone ({selectedFormat.replace("_", " ")} format)...</span>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* State 3: Successful Result State with Inline Edit, Rewrites & Actions */}
              {hasDraft && !generatePost.isPending && (
                <motion.div
                  key="result-state"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={motionTransition}
                  className="w-full"
                >
                  <Card className="border border-stone-200/90 shadow-sm bg-white rounded-xl overflow-hidden">
                    
                    {/* LinkedIn Post Content Container */}
                    <div className="p-5 sm:p-6">
                      
                      {/* Post Author Card Header */}
                      <div className="flex items-start justify-between mb-4 pb-3 border-b border-stone-100">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 border border-stone-200">
                            <AvatarFallback className="bg-[#0A66C2]/10 text-[#0A66C2] font-semibold text-sm">
                              YOU
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-slate-900 text-sm leading-snug">
                                Your Profile
                              </h3>
                              <span className="text-[11px] text-slate-400 font-normal">• 1st</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-snug">
                              Founder & Professional • LinkedIn Creator
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <span>Just now</span>
                              <span>•</span>
                              <span>🌐</span>
                              {activeScheduledTime && (
                                <span className="text-purple-600 font-medium ml-1">
                                  • Scheduled for {new Date(activeScheduledTime).toLocaleDateString([], { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-1.5">
                          {isEditing ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-amber-50 text-amber-800 border-amber-200 font-medium"
                            >
                              Editing Draft
                            </Badge>
                          ) : isDraftModified ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-sky-50 text-sky-800 border-sky-200 font-normal"
                            >
                              Draft (Edited)
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-stone-100 text-slate-600 border-stone-200 font-normal"
                            >
                              Draft
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* LinkedIn Post Body: Display Mode vs Edit Mode */}
                      {isEditing ? (
                        <div className="space-y-2 py-1">
                          <Textarea
                            ref={editTextareaRef}
                            id="edit-post-textarea"
                            aria-label="Edit post content"
                            aria-describedby="edit-instructions"
                            value={editBuffer}
                            onChange={(e) => setEditBuffer(e.target.value)}
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                e.preventDefault();
                                handleSaveEdit();
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                handleCancelEdit();
                              }
                            }}
                            className="min-h-[220px] resize-y text-[15px] sm:text-base leading-relaxed bg-[#FCFBFA] border-stone-300 focus:bg-white focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] transition-colors p-3.5 rounded-lg w-full font-sans"
                            placeholder="Write or refine your post content..."
                          />
                          <div
                            id="edit-instructions"
                            className="flex items-center justify-between text-[11px] text-slate-500 px-1"
                          >
                            <span>
                              Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px] font-mono">Ctrl+Enter</kbd> to save, <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px] font-mono">Esc</kbd> to cancel
                            </span>
                            <span className="text-slate-400">
                              {editBuffer.length} characters
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          tabIndex={0}
                          aria-label="Generated post content"
                          className="text-slate-900 whitespace-pre-wrap text-[15px] sm:text-base leading-relaxed tracking-normal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0A66C2] rounded-sm py-1"
                        >
                          {currentVarData.current}
                        </div>
                      )}

                      {/* Hashtags Section */}
                      {includeHashtags && (
                        <div className="mt-4 pt-3 border-t border-stone-100">
                          <div className="flex flex-wrap gap-1.5" aria-label="Post hashtags">
                            {cleanHashtags(variations.find((v) => v.id === activeVariationId)?.hashtags || generatePost.data?.hashtags).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs font-semibold text-[#0A66C2] bg-sky-50/80 px-2 py-0.5 rounded hover:bg-sky-100 transition-colors"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Simulated LinkedIn Reaction Preview */}
                      <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-slate-400 select-none">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#0A66C2] text-white text-[9px]">
                            👍
                          </span>
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[9px]">
                            💡
                          </span>
                          <span className="text-[11px] text-slate-500 ml-1">Feed Preview</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ~{readingTime} min read
                        </div>
                      </div>

                      {/* Simulated LinkedIn Engagement Bar */}
                      <div className="mt-2 pt-2 border-t border-stone-100 grid grid-cols-4 gap-1 text-center text-slate-500 select-none">
                        <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs hover:bg-stone-50 rounded">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Like</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs hover:bg-stone-50 rounded">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Comment</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs hover:bg-stone-50 rounded">
                          <Repeat2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Repost</span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs hover:bg-stone-50 rounded">
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Send</span>
                        </div>
                      </div>

                    </div>

                    {/* Action Bar Footer with Editing, Targeted Rewrites, Export, and Scheduling */}
                    <div className="border-t border-stone-200 bg-stone-50/70 p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <span>{charCount} characters</span>
                          <span>•</span>
                          <span>{wordCount} words</span>
                        </div>

                        {/* Feature 5: Undo Rewrite Button */}
                        {previousPostBeforeRewrite && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleUndoRewrite}
                            className="h-7 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100/60 flex items-center gap-1 px-2"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Undo Rewrite</span>
                          </Button>
                        )}
                      </div>

                      {/* Controls Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="flex-1 sm:flex-initial h-9 bg-white border-stone-200 text-slate-700 hover:text-slate-900 hover:bg-stone-100"
                            >
                              <X className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                              <span>Cancel</span>
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              onClick={handleSaveEdit}
                              className="flex-1 sm:flex-initial h-9 font-medium text-xs bg-[#0A66C2] hover:bg-[#004182] text-white"
                            >
                              <Check className="w-3.5 h-3.5 mr-1.5" />
                              <span>Save Changes</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleStartEdit}
                              className="h-9 bg-white border-stone-200 text-slate-700 hover:text-slate-900 hover:bg-stone-50"
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                              <span>Edit</span>
                            </Button>

                            {/* Feature 5: Targeted Rewrite Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={rewritePostMutation.isPending}
                                  className="h-9 bg-white border-stone-200 text-slate-700 hover:text-slate-900 hover:bg-stone-50"
                                >
                                  {rewritePostMutation.isPending ? (
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-[#0A66C2]" />
                                  ) : (
                                    <Wand2 className="w-3.5 h-3.5 mr-1.5 text-[#0A66C2]" />
                                  )}
                                  <span>Rewrite</span>
                                  <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-56 bg-white border-stone-200">
                                <DropdownMenuLabel className="text-xs text-slate-500">
                                  Refine this draft
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleApplyRewrite("strengthen_hook")}>
                                  ⚡ Strengthen Opening Hook
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleApplyRewrite("make_clearer")}>
                                  🔍 Make Clearer & Simpler
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleApplyRewrite("make_shorter")}>
                                  ✂️ Make 25% Shorter
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleApplyRewrite("make_warmer")}>
                                  ☕ Make Warmer & Sincere
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleApplyRewrite("stronger_closing")}>
                                  💬 Stronger Closing Question
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleRegenerate}
                              disabled={generatePost.isPending}
                              className="h-9 bg-white border-stone-200 text-slate-700 hover:text-slate-900 hover:bg-stone-50"
                            >
                              <RefreshCcw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                              <span>Regenerate</span>
                            </Button>
                          </div>
                        )}

                        {/* Right side tools: Export, Schedule, and Copy */}
                        {!isEditing && (
                          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                            {/* Feature 8: Export Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-9 bg-white border-stone-200 text-slate-700 hover:text-slate-900 hover:bg-stone-50"
                                >
                                  <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                                  <span>Export</span>
                                  <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52 bg-white border-stone-200">
                                <DropdownMenuItem onClick={handleExportMarkdown}>
                                  Download Markdown (.md)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportText}>
                                  Download Plain Text (.txt)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setIsShareDialogOpen(true)}>
                                  Shareable Preview Card
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Feature 9: Plan Schedule */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsScheduleDialogOpen(true)}
                              className="h-9 bg-white border-stone-200 text-slate-700 hover:text-slate-900 hover:bg-stone-50"
                            >
                              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                              <span>Schedule</span>
                            </Button>

                            {/* Primary Copy Action */}
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleCopy}
                              className={`h-9 font-medium text-xs transition-all ${
                                hasCopied
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "bg-[#0A66C2] hover:bg-[#004182] text-white"
                              }`}
                            >
                              {hasCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 mr-1.5" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                                  <span>Copy Post</span>
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </div>
      </main>

      {/* Feature 7: Template Library Modal */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-[#0A66C2]" />
              <span>Prompt & Format Template Library</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select an editorial template to load proven LinkedIn structures and starting prompts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <Input
              placeholder="Search templates (e.g. launch, career, retro)..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className="h-9 text-xs border-stone-200"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-3.5 rounded-lg border border-stone-200/90 bg-stone-50/50 hover:bg-stone-50 hover:border-stone-300 transition-all flex flex-col justify-between gap-3 text-left"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-[#0A66C2] uppercase tracking-wider">
                        {template.category}
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-stone-200 text-slate-500">
                        {template.recommendedFormat.replace("_", " ")}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-sm text-slate-900 leading-snug">
                      {template.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {template.description}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleLoadTemplate(template)}
                    className="w-full h-8 text-xs bg-white hover:bg-stone-100 border-stone-200 text-slate-800"
                  >
                    Load into Composer
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature 6: Reusable Voice Profile Modal */}
      <Dialog open={isVoiceDialogOpen} onOpenChange={setIsVoiceDialogOpen}>
        <DialogContent className="max-w-lg bg-white border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#0A66C2]" />
              <span>Personal Voice Profile</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Save your signature style preferences locally so PostForge can match your authentic voice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="voice-desc" className="text-xs font-semibold text-slate-800">
                Voice & Style Description
              </label>
              <Textarea
                id="voice-desc"
                rows={3}
                placeholder="e.g., Direct, operator-first perspective. Short sentences, concrete examples, no corporate jargon, warm and self-aware."
                value={voiceDescInput}
                onChange={(e) => setVoiceDescInput(e.target.value)}
                className="text-xs border-stone-200 bg-[#FCFBFA]"
              />
              <p className="text-[11px] text-slate-400">
                Summarize how you naturally write and what phrases or cliches you avoid.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="voice-sample" className="text-xs font-semibold text-slate-800">
                Writing Sample Excerpt (Optional)
              </label>
              <Textarea
                id="voice-sample"
                rows={4}
                placeholder="Paste an excerpt of a past LinkedIn post that captured your voice well..."
                value={voiceSampleInput}
                onChange={(e) => setVoiceSampleInput(e.target.value)}
                className="text-xs border-stone-200 bg-[#FCFBFA]"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between w-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setVoiceDescInput("");
                setVoiceSampleInput("");
                setVoiceProfileState((prev) => ({ ...prev, enabled: false, description: "", samplePost: "" }));
                form.setValue("applyVoiceProfile", false);
                setIsVoiceDialogOpen(false);
                toast({ title: "Voice profile reset" });
              }}
              className="text-xs text-red-600 hover:bg-red-50"
            >
              Reset Profile
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsVoiceDialogOpen(false)}
                className="h-8 text-xs border-stone-200"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveVoiceProfile}
                className="h-8 text-xs bg-[#0A66C2] hover:bg-[#004182] text-white"
              >
                Save Profile
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature 3 & 4: Draft History & Cloud Sync Modal */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white border-stone-200">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-700" />
                <span>Draft History</span>
                {currentUser && (
                  <Badge variant="outline" className="text-[11px] font-normal border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center gap-1 ml-1">
                    <Cloud className="w-3 h-3 text-emerald-600" />
                    <span>Cloud Synced</span>
                  </Badge>
                )}
              </DialogTitle>
              {draftHistory.length > 0 && (!currentUser || historyTab === "local") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearHistory}
                  className="h-7 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Local</span>
                </Button>
              )}
            </div>
            <DialogDescription className="text-xs text-slate-500">
              {currentUser
                ? "Your drafts synced across devices. Reopen, edit, or manage your saved posts anytime."
                : "Recent drafts saved locally in this browser. Sign in anytime to sync them across your devices."}
            </DialogDescription>
          </DialogHeader>

          {/* Search bar - Only visible when signed in */}
          {currentUser && (
            <div className="relative pt-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              <Input
                placeholder="Search drafts by title, topic, or content..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="h-8 pl-8 text-xs border-stone-200 bg-[#FCFBFA]"
              />
            </div>
          )}

          {currentUser ? (
            <Tabs value={historyTab} onValueChange={(val) => setHistoryTab(val as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8 bg-stone-100 p-0.5">
                <TabsTrigger value="cloud" className="text-xs py-1 data-[state=active]:bg-white data-[state=active]:text-slate-900">
                  <Cloud className="w-3 h-3 mr-1.5 text-emerald-600" />
                  <span>Cloud Drafts ({syncedDrafts.length})</span>
                </TabsTrigger>
                <TabsTrigger value="local" className="text-xs py-1 data-[state=active]:bg-white data-[state=active]:text-slate-900">
                  <Bookmark className="w-3 h-3 mr-1.5 text-slate-500" />
                  <span>Local Browser ({draftHistory.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* Cloud Drafts Tab */}
              <TabsContent value="cloud" className="space-y-3 pt-2">
                {isSyncedDraftsLoading ? (
                  <div className="text-center py-8 text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0A66C2]" />
                    <span className="text-xs">Loading synced drafts...</span>
                  </div>
                ) : filteredSyncedDrafts.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Cloud className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-600" />
                    <p className="text-sm font-medium text-slate-600">No cloud drafts found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {historySearch ? "No drafts match your search query." : "Drafts you generate and edit are automatically synced to your account."}
                    </p>
                    {draftHistory.length > 0 && !historySearch && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsImportPromptOpen(true)}
                        className="mt-3 h-7 text-xs border-[#0A66C2] text-[#0A66C2] hover:bg-sky-50"
                      >
                        <CloudUpload className="w-3 h-3 mr-1" />
                        <span>Import {draftHistory.length} local draft{draftHistory.length > 1 ? "s" : ""} to cloud</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredSyncedDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="p-3.5 rounded-lg border border-stone-200/90 bg-stone-50/50 hover:bg-stone-50 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 flex-1">
                          {editingSyncedDraftId === draft.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingSyncedDraftTitle}
                                onChange={(e) => setEditingSyncedDraftTitle(e.target.value)}
                                className="h-7 text-xs bg-white"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveSyncedRename(draft.id)}
                                className="h-7 px-2 text-xs bg-[#0A66C2] text-white"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingSyncedDraftId(null)}
                                className="h-7 px-2 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-slate-900 leading-tight">
                                {draft.title}
                              </h4>
                              <button
                                type="button"
                                onClick={() => handleStartSyncedRename(draft)}
                                className="text-slate-400 hover:text-slate-600"
                                aria-label="Rename draft"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <Badge variant="outline" className="text-[9px] py-0 px-1 border-emerald-300 bg-emerald-50 text-emerald-700">
                                Cloud
                              </Badge>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-400">
                            {new Date(draft.updatedAt || draft.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                            {draft.tone && ` • ${draft.tone}`}
                            {draft.format && ` • ${draft.format.replace("_", " ")}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoadSyncedDraft(draft)}
                            className="h-7 text-xs bg-white border-stone-200 text-[#0A66C2] hover:bg-sky-50"
                          >
                            Reopen
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSyncedDraft(draft.id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                            aria-label="Delete draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-white p-2 rounded border border-stone-200/60 font-sans">
                        {draft.post}
                      </p>
                    </div>
                  ))
                )}
              </TabsContent>

              {/* Local Browser Drafts Tab */}
              <TabsContent value="local" className="space-y-3 pt-2">
                {draftHistory.length > 0 && (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-between text-xs text-sky-900">
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-[#0A66C2] shrink-0" />
                      <span>{draftHistory.length} draft(s) stored in this browser.</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsImportPromptOpen(true)}
                      className="h-7 text-xs bg-[#0A66C2] text-white hover:bg-[#004182]"
                    >
                      <CloudUpload className="w-3 h-3 mr-1" />
                      <span>Sync to Account</span>
                    </Button>
                  </div>
                )}

                {filteredLocalDrafts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-xs">No local drafts found.</p>
                  </div>
                ) : (
                  filteredLocalDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="p-3.5 rounded-lg border border-stone-200/90 bg-stone-50/50 hover:bg-stone-50 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 flex-1">
                          {editingDraftId === draft.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingDraftTitle}
                                onChange={(e) => setEditingDraftTitle(e.target.value)}
                                className="h-7 text-xs bg-white"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveRename(draft.id)}
                                className="h-7 px-2 text-xs bg-[#0A66C2] text-white"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingDraftId(null)}
                                className="h-7 px-2 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-slate-900 leading-tight">
                                {draft.title}
                              </h4>
                              <button
                                type="button"
                                onClick={() => handleStartRename(draft)}
                                className="text-slate-400 hover:text-slate-600"
                                aria-label="Rename draft"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-400">
                            {new Date(draft.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                            {draft.tone && ` • ${draft.tone}`}
                            {draft.format && ` • ${draft.format.replace("_", " ")}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoadDraftFromHistory(draft)}
                            className="h-7 text-xs bg-white border-stone-200 text-[#0A66C2] hover:bg-sky-50"
                          >
                            Reopen
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDraft(draft.id)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                            aria-label="Delete draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-white p-2 rounded border border-stone-200/60 font-sans">
                        {draft.post}
                      </p>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12 px-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-stone-100 text-[#0A66C2] flex items-center justify-center mx-auto">
                <History className="w-6 h-6 text-[#0A66C2]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-semibold text-base text-slate-900">
                  Sign In Required to View History
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Draft history is available exclusively after signing in. Sign in or create an account to view, restore, and sync your drafts across devices.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setIsHistoryDialogOpen(false);
                  setAuthTab("login");
                  setIsAuthDialogOpen(true);
                }}
                className="h-9 text-xs bg-[#0A66C2] hover:bg-[#004182] text-white"
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                <span>Sign In to Access History</span>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feature 4: Account & Auth Modal */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="max-w-md bg-white border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0A66C2]" />
              <span>PostForge Account</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Sign in to automatically sync your generated posts and customized drafts across all devices.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={authTab} onValueChange={(val) => setAuthTab(val as any)} className="w-full pt-1">
            <TabsList className="grid w-full grid-cols-3 h-8 bg-stone-100 p-0.5">
              <TabsTrigger value="login" className="text-xs">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs">Create Account</TabsTrigger>
              <TabsTrigger value="forgot" className="text-xs">Reset</TabsTrigger>
            </TabsList>

            {/* Tab: Sign In */}
            <TabsContent value="login" className="space-y-4 pt-3">
              {loginError && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <Input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setAuthTab("forgot")}
                      className="text-[11px] text-[#0A66C2] hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full h-9 text-xs bg-[#0A66C2] hover:bg-[#004182] text-white font-medium"
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>Sign In</span>
                </Button>
              </form>

              <div className="text-center text-xs text-slate-500 pt-1">
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => setAuthTab("signup")}
                  className="text-[#0A66C2] font-semibold hover:underline"
                >
                  Create one now
                </button>
              </div>
            </TabsContent>

            {/* Tab: Create Account */}
            <TabsContent value="signup" className="space-y-4 pt-3">
              {signupError && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <AlertDescription>{signupError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Full Name (Optional)</label>
                  <Input
                    type="text"
                    placeholder="Jane Doe"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Email Address</label>
                  <Input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Password (8+ chars)</label>
                  <Input
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-slate-400">Must be at least 8 characters long</p>
                </div>

                <Button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="w-full h-9 text-xs bg-[#0A66C2] hover:bg-[#004182] text-white font-medium"
                >
                  {signupMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>Create Account & Sync</span>
                </Button>
              </form>

              <div className="text-center text-xs text-slate-500 pt-1">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => setAuthTab("login")}
                  className="text-[#0A66C2] font-semibold hover:underline"
                >
                  Sign in here
                </button>
              </div>
            </TabsContent>

            {/* Tab: Forgot Password */}
            <TabsContent value="forgot" className="space-y-4 pt-3">
              {forgotError && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <AlertDescription>{forgotError}</AlertDescription>
                </Alert>
              )}

              {forgotSuccessMsg && (
                <Alert className="py-2 text-xs border-emerald-300 bg-emerald-50 text-emerald-900 space-y-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <AlertTitle className="text-xs font-semibold">Reset Request Processed</AlertTitle>
                  <AlertDescription className="text-xs">{forgotSuccessMsg}</AlertDescription>
                  {generatedResetToken && (
                    <div className="mt-2 p-2 bg-white rounded border border-emerald-200">
                      <p className="text-[11px] font-medium text-slate-600 mb-1">
                        Token for local testing:
                      </p>
                      <code className="block p-1 bg-stone-100 rounded text-[11px] font-mono break-all text-slate-800">
                        {generatedResetToken}
                      </code>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setResetTokenInput(generatedResetToken);
                          setAuthTab("reset");
                        }}
                        className="mt-2 h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                      >
                        Proceed to Reset Password
                      </Button>
                    </div>
                  )}
                </Alert>
              )}

              {!generatedResetToken && (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Registered Email</label>
                    <Input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <p className="text-[11px] text-slate-400">
                      Enter the email you signed up with to generate a password reset token.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={forgotPasswordMutation.isPending}
                    className="w-full h-9 text-xs bg-[#0A66C2] hover:bg-[#004182] text-white font-medium"
                  >
                    {forgotPasswordMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    <span>Request Reset Token</span>
                  </Button>
                </form>
              )}

              <div className="text-center text-xs text-slate-500 pt-1">
                Have a token already?{" "}
                <button
                  type="button"
                  onClick={() => setAuthTab("reset")}
                  className="text-[#0A66C2] font-semibold hover:underline"
                >
                  Enter token here
                </button>
              </div>
            </TabsContent>

            {/* Tab: Reset Password */}
            <TabsContent value="reset" className="space-y-4 pt-3">
              {resetError && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <AlertDescription>{resetError}</AlertDescription>
                </Alert>
              )}

              {resetSuccessMsg && (
                <Alert className="py-2 text-xs border-emerald-300 bg-emerald-50 text-emerald-900">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <AlertDescription>{resetSuccessMsg}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Reset Token</label>
                  <Input
                    type="text"
                    required
                    placeholder="Paste your reset token..."
                    value={resetTokenInput}
                    onChange={(e) => setResetTokenInput(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">New Password (8+ chars)</label>
                  <Input
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="w-full h-9 text-xs bg-[#0A66C2] hover:bg-[#004182] text-white font-medium"
                >
                  {resetPasswordMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>Set New Password</span>
                </Button>
              </form>

              <div className="text-center text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => setAuthTab("login")}
                  className="text-slate-600 hover:text-slate-900 underline"
                >
                  Back to Sign In
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Feature 4: Explicit Local Draft Import Consent Dialog */}
      <Dialog open={isImportPromptOpen} onOpenChange={setIsImportPromptOpen}>
        <DialogContent className="max-w-md bg-white border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <CloudUpload className="w-5 h-5 text-[#0A66C2]" />
              <span>Import Local Drafts to Account?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              You have existing drafts saved locally in this browser.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs text-slate-600">
            <p>
              We found <strong className="text-slate-900">{draftHistory.length} draft(s)</strong> stored on this device. Would you like to import them into your account (<strong className="text-slate-900">{currentUser?.email}</strong>)?
            </p>
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
              <p className="font-semibold text-slate-800">What happens when you import?</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                <li>All {draftHistory.length} local drafts are copied to your secure cloud account.</li>
                <li>They become immediately accessible across all devices you sign into.</li>
                <li>Your local drafts remain safe on this browser as well.</li>
              </ul>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Notice: We never import local drafts without your explicit confirmation.
            </p>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImportPromptOpen(false)}
              className="text-xs border-stone-200"
            >
              Keep Separate
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={importDraftsMutation.isPending}
              onClick={handleImportLocalDraftsConfirm}
              className="text-xs bg-[#0A66C2] hover:bg-[#004182] text-white"
            >
              {importDraftsMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 mr-1.5" />
              )}
              <span>Import {draftHistory.length} Draft{draftHistory.length > 1 ? "s" : ""}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature 8: Shareable Preview Card Modal */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-lg bg-white border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#0A66C2]" />
              <span>Shareable Draft Preview</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Formatted overview ready to share with your team or review before publishing.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-stone-200">
              <span className="font-semibold text-slate-700">Topic: {form.getValues().topic || "LinkedIn Draft"}</span>
              <span>{charCount} chars • {wordCount} words</span>
            </div>

            <div className="text-slate-900 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto p-2 bg-white rounded border border-stone-200">
              {activePostText}
              {includeHashtags && (
                <div className="mt-2 text-[#0A66C2] font-medium">
                  {cleanHashtags(variations.find((v) => v.id === activeVariationId)?.hashtags || generatePost.data?.hashtags).join(" ")}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportText}
              className="text-xs border-stone-200"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>Download .txt</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              className="text-xs bg-[#0A66C2] hover:bg-[#004182] text-white"
            >
              <Copy className="w-3.5 h-3.5 mr-1" />
              <span>Copy Formatted Post</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature 9: Scheduling & Publishing Planner Modal */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-md bg-white border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <span>Publishing Schedule Planner</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Plan your publishing window and add a calendar reminder with your post copy pre-filled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-lg text-xs text-purple-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <span>💡 Best times for LinkedIn engagement:</span>
              </p>
              <p className="text-[11px] text-purple-800">
                Tuesday – Thursday between 8:00 AM – 10:00 AM local time yields 40% higher reach.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="schedule-time" className="text-xs font-semibold text-slate-800">
                Planned Date & Time
              </label>
              <Input
                id="schedule-time"
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="h-10 text-xs border-stone-200 bg-[#FCFBFA]"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
            <a
              href={generateCalendarScheduleLink(activePostText, new Date(scheduledDateTime))}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0A66C2] hover:underline flex items-center gap-1 order-2 sm:order-1"
            >
              <span>Add to Google Calendar</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleDialogOpen(false)}
                className="flex-1 sm:flex-initial h-8 text-xs border-stone-200"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmSchedule}
                className="flex-1 sm:flex-initial h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white"
              >
                Set Plan
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editorial Footer */}
      <footer className="w-full border-t border-stone-200/80 bg-white/60 py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            PostForge &bull; Professional LinkedIn Drafting Studio
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>3 Angle Variations</span>
            <span>&bull;</span>
            <span>Targeted Rewrites</span>
            <span>&bull;</span>
            <span>Voice Profile</span>
            <span>&bull;</span>
            <span>Local Draft History</span>
            <span>&bull;</span>
            <span>Export & Scheduling</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
