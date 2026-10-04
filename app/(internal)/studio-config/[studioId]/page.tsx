import { createClient } from "@/lib/supabase/server";
import { StudioConfigForm } from "@/components/studio-config/studio-config-form";

export default async function StudioConfigPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  const supabase = await createClient();

  const [{ data: studio, error: studioError }, { data: config }] =
    await Promise.all([
      supabase.from("studios").select("id, name").eq("id", studioId).single(),
      supabase
        .from("studio_configs")
        .select("*")
        .eq("studio_id", studioId)
        .limit(1)
        .then((r) => ({ data: r.data?.[0] ?? null })),
    ]);

  if (studioError || !studio) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Couldn&apos;t find that studio{studioError ? `: ${studioError.message}` : "."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <StudioConfigForm studioId={studio.id} studioName={studio.name} config={config} />
    </div>
  );
}
