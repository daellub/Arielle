// app/llm/features/services/feedback.ts
import { http } from "@/app/lib/http"

export type FeedbackRating = 'up' | 'down'

export async function sendFeedback(
    interactionId: number,
    rating: FeedbackRating,
    signal?: AbortSignal
) {
    return http.post(
        '/llm/feedback',
        {
            interaction_id: interactionId,
            rating,
            tone_score: rating === 'up' ? 1.0 : 0.0,
        },
        { signal }
    )
}
