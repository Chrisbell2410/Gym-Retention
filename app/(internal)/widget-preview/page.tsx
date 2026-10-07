import { createClient } from "@/lib/supabase/server";
import { WidgetPreviewClient } from "@/components/widget-preview/widget-preview-client";

export default async function WidgetPreviewPage() {
  const supabase = await createClient();
  const { data: configs } = await supabase
    .from("studio_configs")
    .select("id, studios(name)")
    .order("created_at", { ascending: false });

  const studios = (configs ?? [])
    .filter((c) => c.studios)
    .map((c) => ({ id: c.id, name: c.studios!.name }));

  return <WidgetPreviewClient studios={studios} />;
}
