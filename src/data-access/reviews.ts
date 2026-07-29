import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireSupabaseServerClient } from "@/lib/supabase/server";

export type PublicReview = {
  id: string;
  rating: number;
  title: string;
  content: string;
  nickname: string;
  createdAt: string;
  editedAt: string | null;
};

export type HomeReviewData = {
  reviews: PublicReview[];
  reviewCount: number;
  averageRating: number;
  configured: boolean;
};

export type UserReview = {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  status: "published" | "hidden" | "deleted";
  createdAt: string;
  updatedAt: string;
};

const EMPTY_REVIEW_DATA: HomeReviewData = {
  reviews: [],
  reviewCount: 0,
  averageRating: 0,
  configured: false,
};

export async function getHomeReviewData(): Promise<HomeReviewData> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return EMPTY_REVIEW_DATA;
  }

  const [reviewsResult, summaryResult] = await Promise.all([
    supabase
      .from("review_public_feed")
      .select(
        "id,rating,title,content,nickname,created_at,edited_at",
      )
      .eq("target_type", "site")
      .eq("target_key", "landview")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("review_public_summary")
      .select("review_count,average_rating")
      .eq("target_type", "site")
      .eq("target_key", "landview")
      .maybeSingle(),
  ]);

  if (reviewsResult.error || summaryResult.error) {
    return {
      ...EMPTY_REVIEW_DATA,
      configured: true,
    };
  }

  const reviews: PublicReview[] = (reviewsResult.data ?? []).map((review) => ({
    id: String(review.id),
    rating: Number(review.rating),
    title: String(review.title),
    content: String(review.content),
    nickname: String(review.nickname),
    createdAt: String(review.created_at),
    editedAt: review.edited_at ? String(review.edited_at) : null,
  }));

  return {
    reviews,
    reviewCount: Number(summaryResult.data?.review_count ?? 0),
    averageRating: Number(summaryResult.data?.average_rating ?? 0),
    configured: true,
  };
}

export async function getPublicReviewPage(page = 1, pageSize = 12) {
  const supabase = getSupabaseServerClient();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(30, Math.max(1, pageSize));

  if (!supabase) {
    return {
      reviews: [] as PublicReview[],
      reviewCount: 0,
      averageRating: 0,
      page: safePage,
      pageSize: safePageSize,
    };
  }

  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const [reviewsResult, summaryResult] = await Promise.all([
    supabase
      .from("review_public_feed")
      .select("id,rating,title,content,nickname,created_at,edited_at")
      .eq("target_type", "site")
      .eq("target_key", "landview")
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("review_public_summary")
      .select("review_count,average_rating")
      .eq("target_type", "site")
      .eq("target_key", "landview")
      .maybeSingle(),
  ]);

  if (reviewsResult.error) {
    throw reviewsResult.error;
  }
  if (summaryResult.error) {
    throw summaryResult.error;
  }

  return {
    reviews: (reviewsResult.data ?? []).map((review) => ({
      id: String(review.id),
      rating: Number(review.rating),
      title: review.title ? String(review.title) : "LandView 사용 후기",
      content: String(review.content),
      nickname: String(review.nickname),
      createdAt: String(review.created_at),
      editedAt: review.edited_at ? String(review.edited_at) : null,
    })),
    reviewCount: Number(summaryResult.data?.review_count ?? 0),
    averageRating: Number(summaryResult.data?.average_rating ?? 0),
    page: safePage,
    pageSize: safePageSize,
  };
}

export async function getUserReview(userId: string): Promise<UserReview | null> {
  const { data, error } = await requireSupabaseServerClient()
    .from("reviews")
    .select("id,rating,title,content,status,created_at,updated_at")
    .eq("user_id", userId)
    .eq("target_type", "site")
    .eq("target_key", "landview")
    .neq("status", "deleted")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? {
        id: String(data.id),
        rating: Number(data.rating),
        title: data.title ? String(data.title) : null,
        content: String(data.content),
        status: data.status as UserReview["status"],
        createdAt: String(data.created_at),
        updatedAt: String(data.updated_at),
      }
    : null;
}

export async function createUserReview(
  userId: string,
  input: { rating: number; title?: string | null; content: string },
) {
  const { data, error } = await requireSupabaseServerClient()
    .from("reviews")
    .insert({
      user_id: userId,
      target_type: "site",
      target_key: "landview",
      rating: input.rating,
      title: input.title || null,
      content: input.content,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return { id: String(data.id) };
}

export async function updateUserReview(
  reviewId: string,
  userId: string,
  input: { rating: number; title?: string | null; content: string },
) {
  const now = new Date().toISOString();
  const { data, error } = await requireSupabaseServerClient()
    .from("reviews")
    .update({
      rating: input.rating,
      title: input.title || null,
      content: input.content,
      edited_at: now,
    })
    .eq("id", reviewId)
    .eq("user_id", userId)
    .neq("status", "deleted")
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function deleteUserReview(reviewId: string, userId: string) {
  const now = new Date().toISOString();
  const { data, error } = await requireSupabaseServerClient()
    .from("reviews")
    .update({
      status: "deleted",
      deleted_at: now,
    })
    .eq("id", reviewId)
    .eq("user_id", userId)
    .neq("status", "deleted")
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}
