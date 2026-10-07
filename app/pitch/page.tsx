import { createAdminClient } from "@/lib/supabase/server";
import { PitchPage } from "@/components/pitch/pitch-page";

// Looks up the demo studio on every request rather than baking its id into
// a statically-generated page at build time — otherwise a freshly-seeded
// (or re-seeded) demo studio wouldn't show up here until the next deploy.
export const dynamic = "force-dynamic";

/**
 * Public sales landing page (see proxy.ts) — what Chris pulls up on his
 * phone/laptop in a pitch meeting, or sends as a link. Looks up the Demo
 * Mode studio (lib/actions/demo.ts) via the admin client, same posture as
 * /unsubscribe and /chat — no session here, and nothing sensitive is read,
 * just the id needed to embed the live widget. If demo mode hasn't been
 * set up yet, the page still renders fine, just without the live-demo
 * section.
 */
export default async function PitchLandingPage() {
  const admin = createAdminClient();

  const { data: demoStudio } = await admin
    .from("studios")
    .select("id, studio_configs(id)")
    .eq("name", "Lowcountry Pilates & Yoga")
    .maybeSingle();

  const demoStudioConfigId = demoStudio?.studio_configs?.[0]?.id ?? null;

  return <PitchPage demoStudioConfigId={demoStudioConfigId} />;
}
