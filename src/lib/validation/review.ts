import { z } from "zod";

export const reviewInputSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(100).nullable().optional(),
  content: z
    .string()
    .trim()
    .min(5, "후기는 5자 이상 입력해주세요.")
    .max(999, "후기는 1,000자 미만으로 입력해주세요."),
});

export const reviewIdSchema = z.string().uuid();
