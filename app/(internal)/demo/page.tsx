import { createClient } from "@/lib/supabase/server";
import { DemoSetupClient } from "@/components/demo/demo-setup-client";

export default async function DemoPage() {
  const supabase = await createClient();
  const { data: studio } = await supabase
    .from("studios")
    .select("id, studio_configs(id)")
    .eq("name", "Lowcountry Pilates & Yoga")
    .maybeSingle();

  const existing = studio
    ? {
        studioId: studio.id,
        studioConfigId: studio.studio_configs?.[0]?.id ?? null,
      }
    : null;

  return <DemoSetupClient existing={existing} />;
}
