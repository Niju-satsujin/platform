import { redirect } from "next/navigation";

export default async function LegacyQuestRoute({
  params,
}: {
  params: Promise<{ partSlug: string }>;
}) {
  const { partSlug } = await params;
  redirect(`/parts/${partSlug}/quest`);
}
