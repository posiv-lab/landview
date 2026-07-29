import { z } from "zod";

export const reviewInputSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(100).nullable().optional(),
  content: z
    .string()
    .trim()
    .min(20, "후기는 20자 이상 입력해주세요.")
    .max(2000, "후기는 2,000자 이하여야 합니다."),
});

export const reviewIdSchema = z.string().uuid();
