import { createAdminClient } from "@/lib/supabase/server";
import { PublicChatClient } from "@/components/public-chat/public-chat-client";

/**
 * Public, unauthenticated standalone chat page — same agent/API route as
 * the embeddable widget (public/widget.js), but reachable at its own URL
 * for studios without a usable website to embed a script on: an
 * Instagram bio link, a QR code on a flyer, a Google Business Profile
 * link. Uses the admin client since a visitor here has no session,
 * same posture as /unsubscribe — only ever reads the studio's display
 * name, nothing sensitive.
 */
export default async function PublicChatPage({
  params,
}: {
  params: Promise<{ studioConfigId: string }>;
}) {
  const { studioConfigId } = await params;
  const admin = createAdminClient();

  const { data: config } = await admin
    .from("studio_configs")
    .select("id, studios(name)")
    .eq("id", studioConfigId)
    .single();

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
        <p className="text-sm text-ink-300">This chat link isn&apos;t valid.</p>
      </div>
    );
  }

  return (
    <PublicChatClient
      studioConfigId={config.id}
      studioName={config.studios?.name ?? "the studio"}
    />
  );
}
