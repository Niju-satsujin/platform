import { redirect } from "next/navigation";
import { getCurrentUser, getSessionToken } from "@/lib/auth";
import { getUserBySessionToken } from "@/lib/auth";
import PrivateChatPage from "@/app/components/private-chat";

export const metadata = {
  title: "Messages | Trust Systems",
  description: "Private messages with other learners",
};

export default async function MessagesPage() {
  let user = await getCurrentUser();
  if (!user) {
    const token = await getSessionToken();
    if (token) user = await getUserBySessionToken(token);
  }
  if (!user) redirect("/login");

  return <PrivateChatPage />;
}
