import { getSession } from "@/lib/session";
import SettingsPageClient from "./SettingsPageClient";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;

  return (
    <SettingsPageClient
      username={session.username}
      avatarUrl={session.avatarUrl}
      maxUploadMb={process.env.MAX_UPLOAD_SIZE_MB || "50"}
    />
  );
}
