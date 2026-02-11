import { redirect } from "next/navigation";

/**
 * /training/review — Redirects to the existing flashcard review page.
 * The flashcards system is already fully implemented at /flashcards.
 */
export default function TrainingReviewPage() {
  redirect("/flashcards");
}
