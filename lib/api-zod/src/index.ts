import { z } from "zod";

export const HealthCheckResponse = z.object({
  status: z.string(),
});

export type HealthCheckResponseType = z.infer<typeof HealthCheckResponse>;

export const SimpleSuccessResponse = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type SimpleSuccessResponseType = z.infer<typeof SimpleSuccessResponse>;

export const User = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.number().optional(),
});

export type UserType = z.infer<typeof User>;

export const AuthUserResponse = z.object({
  user: User,
});

export type AuthUserResponseType = z.infer<typeof AuthUserResponse>;

export const AuthMeResponse = z.object({
  user: User.nullable(),
});

export type AuthMeResponseType = z.infer<typeof AuthMeResponse>;

export const SignupBody = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().max(100).optional(),
});

export type SignupBodyType = z.infer<typeof SignupBody>;

export const LoginBody = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginBodyType = z.infer<typeof LoginBody>;

export const ForgotPasswordBody = z.object({
  email: z.string().email("Please provide a valid email address"),
});

export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBody>;

export const ForgotPasswordResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  resetToken: z.string().optional(),
});

export type ForgotPasswordResponseType = z.infer<typeof ForgotPasswordResponse>;

export const ResetPasswordBody = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordBodyType = z.infer<typeof ResetPasswordBody>;

export const SyncedDraft = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  topic: z.string(),
  post: z.string(),
  hashtags: z.array(z.string()),
  tone: z.string().optional(),
  length: z.string().optional(),
  format: z.string().optional(),
  audience: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type SyncedDraftType = z.infer<typeof SyncedDraft>;

export const CreateDraftBody = z.object({
  title: z.string().optional(),
  topic: z.string(),
  post: z.string(),
  hashtags: z.array(z.string()).optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
  format: z.string().optional(),
  audience: z.string().optional(),
});

export type CreateDraftBodyType = z.infer<typeof CreateDraftBody>;

export const UpdateDraftBody = z.object({
  title: z.string().optional(),
  topic: z.string().optional(),
  post: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
  format: z.string().optional(),
  audience: z.string().optional(),
});

export type UpdateDraftBodyType = z.infer<typeof UpdateDraftBody>;

export const ImportDraftsBody = z.object({
  drafts: z.array(CreateDraftBody),
});

export type ImportDraftsBodyType = z.infer<typeof ImportDraftsBody>;

export const PostVariation = z.object({
  id: z.string(),
  title: z.string(),
  post: z.string(),
  hashtags: z.array(z.string()).optional(),
});

export type PostVariationType = z.infer<typeof PostVariation>;

export const GeneratePostBody = z.object({
  topic: z.string().min(2).max(500),
  tone: z.enum(["professional", "inspirational", "storytelling", "humorous", "bold", "educational"]),
  length: z.enum(["short", "medium", "long"]),
  format: z.enum(["lesson_learned", "practical_list", "opinion", "personal_story", "announcement", "question_led"]).optional(),
  audience: z.string().max(200).optional(),
  includeHashtags: z.boolean().default(true).optional(),
  includeEmojis: z.boolean().default(false).optional(),
  generateVariations: z.boolean().default(true).optional(),
  voiceProfile: z.string().optional(),
});

export type GeneratePostBodyType = z.infer<typeof GeneratePostBody>;

export const GeneratePostResponse = z.object({
  post: z.string(),
  hashtags: z.array(z.string()),
  variations: z.array(PostVariation).optional(),
});

export type GeneratePostResponseType = z.infer<typeof GeneratePostResponse>;

export const RewritePostBody = z.object({
  post: z.string().min(10),
  action: z.enum(["strengthen_hook", "make_clearer", "make_shorter", "make_warmer", "stronger_closing"]),
  tone: z.string().optional(),
});

export type RewritePostBodyType = z.infer<typeof RewritePostBody>;

export const RewritePostResponse = z.object({
  post: z.string(),
  action: z.string(),
  previousPost: z.string(),
});

export type RewritePostResponseType = z.infer<typeof RewritePostResponse>;
