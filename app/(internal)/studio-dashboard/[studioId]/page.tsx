import { createClient } from "@/lib/supabase/server";
import { StudioDashboard } from "@/components/studio-dashboard/studio-dashboard";

export default async function StudioDashboardPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  const supabase = await createClient();

  const { data: studio, error: studioError } = await supabase
    .from("studios")
    .select("id, name")
    .eq("id", studioId)
    .single();

  if (studioError || !studio) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Couldn&apos;t find that studio{studioError ? `: ${studioError.message}` : "."}
      </div>
    );
  }

  const { data: config } = await supabase
    .from("studio_configs")
    .select("id")
    .eq("studio_id", studioId)
    .maybeSingle();

  if (!config) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-surface-border bg-white p-6 text-center">
        <h1 className="font-display text-xl font-bold text-ink-900">{studio.name}</h1>
        <p className="mt-2 text-sm text-ink-400">
          This studio doesn&apos;t have an AI configuration yet, so there&apos;s
          no chat/booking activity to show. Set one up first from the{" "}
          <a href={`/studio-config/${studio.id}`} className="font-medium text-spark-600 hover:text-spark-700">
            AI Configuration
          </a>{" "}
          page.
        </p>
      </div>
    );
  }

  const [{ data: conversations }, { data: bookings }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, contact_name, contact_identifier, status, created_at, messages(id, direction, sender, body, created_at)")
      .eq("studio_config_id", config.id)
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "messages", ascending: true }),
    supabase
      .from("bookings")
      .select("*")
      .eq("studio_config_id", config.id)
      .order("class_datetime", { ascending: true }),
  ]);

  return (
    <StudioDashboard
      studioName={studio.name}
      conversations={conversations ?? []}
      bookings={bookings ?? []}
    />
  );
}
