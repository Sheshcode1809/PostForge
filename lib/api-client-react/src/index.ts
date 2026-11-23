import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationResult,
  UseQueryResult,
} from "@tanstack/react-query";

export interface PostVariation {
  id: string;
  title: string;
  post: string;
  hashtags?: string[];
}

export interface GeneratePostBody {
  topic: string;
  tone: "professional" | "inspirational" | "storytelling" | "humorous" | "bold" | "educational";
  length: "short" | "medium" | "long";
  format?: "lesson_learned" | "practical_list" | "opinion" | "personal_story" | "announcement" | "question_led";
  audience?: string;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  generateVariations?: boolean;
  voiceProfile?: string;
}

export interface GeneratePostResponse {
  post: string;
  hashtags: string[];
  variations?: PostVariation[];
}

export interface GeneratePostMutationVariables {
  data: GeneratePostBody;
}

export async function generatePost(body: GeneratePostBody): Promise<GeneratePostResponse> {
  const response = await fetch("/api/posts/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.message) errorMsg = errJson.message;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export function useGeneratePost(): UseMutationResult<
  GeneratePostResponse,
  Error,
  GeneratePostMutationVariables
> {
  return useMutation<GeneratePostResponse, Error, GeneratePostMutationVariables>({
    mutationFn: async ({ data }) => {
      return generatePost(data);
    },
  });
}

export interface RewritePostBody {
  post: string;
  action: "strengthen_hook" | "make_clearer" | "make_shorter" | "make_warmer" | "stronger_closing";
  tone?: string;
}

export interface RewritePostResponse {
  post: string;
  action: string;
  previousPost: string;
}

export interface RewritePostMutationVariables {
  data: RewritePostBody;
}

export async function rewritePost(body: RewritePostBody): Promise<RewritePostResponse> {
  const response = await fetch("/api/posts/rewrite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMsg = `Rewrite request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.message) errorMsg = errJson.message;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export function useRewritePost(): UseMutationResult<
  RewritePostResponse,
  Error,
  RewritePostMutationVariables
> {
  return useMutation<RewritePostResponse, Error, RewritePostMutationVariables>({
    mutationFn: async ({ data }) => {
      return rewritePost(data);
    },
  });
}

// -------------------------------------------------------------
// Auth & User Types and Hooks
// -------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  createdAt?: number;
}

export interface SignupBody {
  email: string;
  password: string;
  name?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface ForgotPasswordBody {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  resetToken?: string;
}

export interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

export interface SimpleSuccessResponse {
  success: boolean;
  message?: string;
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // ignore
  }

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export function useAuthMe(): UseQueryResult<{ user: AuthUser | null }, Error> {
  return useQuery<{ user: AuthUser | null }, Error>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await requestJson<{ user: AuthUser | null }>("/api/auth/me");
      } catch {
        return { user: null };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

export function useSignup(): UseMutationResult<
  { user: AuthUser },
  Error,
  { data: SignupBody }
> {
  const queryClient = useQueryClient();
  return useMutation<{ user: AuthUser }, Error, { data: SignupBody }>({
    mutationFn: async ({ data }) => {
      return requestJson<{ user: AuthUser }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

export function useLogin(): UseMutationResult<
  { user: AuthUser },
  Error,
  { data: LoginBody }
> {
  const queryClient = useQueryClient();
  return useMutation<{ user: AuthUser }, Error, { data: LoginBody }>({
    mutationFn: async ({ data }) => {
      return requestJson<{ user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

export function useLogout(): UseMutationResult<
  SimpleSuccessResponse,
  Error,
  void
> {
  const queryClient = useQueryClient();
  return useMutation<SimpleSuccessResponse, Error, void>({
    mutationFn: async () => {
      return requestJson<SimpleSuccessResponse>("/api/auth/logout", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], { user: null });
      queryClient.setQueryData(["drafts"], { drafts: [] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useForgotPassword(): UseMutationResult<
  ForgotPasswordResponse,
  Error,
  { data: ForgotPasswordBody }
> {
  return useMutation<ForgotPasswordResponse, Error, { data: ForgotPasswordBody }>({
    mutationFn: async ({ data }) => {
      return requestJson<ForgotPasswordResponse>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  });
}

export function useResetPassword(): UseMutationResult<
  SimpleSuccessResponse,
  Error,
  { data: ResetPasswordBody }
> {
  return useMutation<SimpleSuccessResponse, Error, { data: ResetPasswordBody }>({
    mutationFn: async ({ data }) => {
      return requestJson<SimpleSuccessResponse>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  });
}

// -------------------------------------------------------------
// Synced Drafts Types and Hooks
// -------------------------------------------------------------

export interface SyncedDraft {
  id: string;
  userId: string;
  title: string;
  topic: string;
  post: string;
  hashtags: string[];
  tone?: string;
  length?: string;
  format?: string;
  audience?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateDraftBody {
  title?: string;
  topic: string;
  post: string;
  hashtags?: string[];
  tone?: string;
  length?: string;
  format?: string;
  audience?: string;
}

export interface UpdateDraftBody {
  title?: string;
  topic?: string;
  post?: string;
  hashtags?: string[];
  tone?: string;
  length?: string;
  format?: string;
  audience?: string;
}

export function useSyncedDrafts(enabled: boolean = true): UseQueryResult<{ drafts: SyncedDraft[] }, Error> {
  return useQuery<{ drafts: SyncedDraft[] }, Error>({
    queryKey: ["drafts"],
    queryFn: async () => {
      return requestJson<{ drafts: SyncedDraft[] }>("/api/drafts");
    },
    enabled,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCreateSyncedDraft(): UseMutationResult<
  { draft: SyncedDraft },
  Error,
  { data: CreateDraftBody }
> {
  const queryClient = useQueryClient();
  return useMutation<{ draft: SyncedDraft }, Error, { data: CreateDraftBody }>({
    mutationFn: async ({ data }) => {
      return requestJson<{ draft: SyncedDraft }>("/api/drafts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

export function useUpdateSyncedDraft(): UseMutationResult<
  { draft: SyncedDraft },
  Error,
  { id: string; data: UpdateDraftBody }
> {
  const queryClient = useQueryClient();
  return useMutation<{ draft: SyncedDraft }, Error, { id: string; data: UpdateDraftBody }>({
    mutationFn: async ({ id, data }) => {
      return requestJson<{ draft: SyncedDraft }>(`/api/drafts/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

export function useDeleteSyncedDraft(): UseMutationResult<
  SimpleSuccessResponse,
  Error,
  { id: string }
> {
  const queryClient = useQueryClient();
  return useMutation<SimpleSuccessResponse, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      return requestJson<SimpleSuccessResponse>(`/api/drafts/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}

export function useImportLocalDrafts(): UseMutationResult<
  { importedCount: number; drafts: SyncedDraft[] },
  Error,
  { drafts: CreateDraftBody[] }
> {
  const queryClient = useQueryClient();
  return useMutation<{ importedCount: number; drafts: SyncedDraft[] }, Error, { drafts: CreateDraftBody[] }>({
    mutationFn: async ({ drafts }) => {
      return requestJson<{ importedCount: number; drafts: SyncedDraft[] }>("/api/drafts/import", {
        method: "POST",
        body: JSON.stringify({ drafts }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
}
