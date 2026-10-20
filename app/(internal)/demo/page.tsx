import { createClient } from "@/lib/supabase/server";
import { DemoSetupClient } from "@/components/demo/demo-setup-client";

async function lookupExisting(supabase: Awaited<ReturnType<typeof createClient>>, name: string) {
  const { data: studio } = await supabase
    .from("studios")
    .select("id, studio_configs(id)")
    .eq("name", name)
    .maybeSingle();

  return studio
    ? { studioId: studio.id, studioConfigId: studio.studio_configs?.[0]?.id ?? null }
    : null;
}

export default async function DemoPage() {
  const supabase = await createClient();

  const [generic, btone] = await Promise.all([
    lookupExisting(supabase, "Lowcountry Pilates & Yoga"),
    lookupExisting(supabase, "btone FITNESS – James Island"),
  ]);

  return <DemoSetupClient existingGeneric={generic} existingBtone={btone} />;
}
