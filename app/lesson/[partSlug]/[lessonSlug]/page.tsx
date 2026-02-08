import { redirect } from "next/navigation";

export default async function LegacyLessonRoute({
  params,
}: {
  params: Promise<{ partSlug: string; lessonSlug: string }>;
}) {
  const { partSlug, lessonSlug } = await params;
  redirect(`/parts/${partSlug}/lessons/${lessonSlug}`);
}
