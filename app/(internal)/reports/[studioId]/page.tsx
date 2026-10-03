import { createClient } from "@/lib/supabase/server";
import { getResolvedAssumptions } from "@/lib/revenue-leak-data";
import { ResponseTimeReport } from "@/components/reports/response-time-report";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  const supabase = await createClient();

  const [{ data: studio, error: studioError }, { data: studioLogs }, { data: allLogs }, resolved] =
    await Promise.all([
      supabase.from("studios").select("*").eq("id", studioId).single(),
      supabase
        .from("secret_shop_logs")
        .select("*")
        .eq("studio_id", studioId)
        .order("sent_at", { ascending: false }),
      supabase
        .from("secret_shop_logs")
        .select("channel, sent_at, first_reply_at"),
      getResolvedAssumptions(studioId),
    ]);

  if (studioError || !studio) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Couldn&apos;t find that studio
        {studioError ? `: ${studioError.message}` : "."}
      </div>
    );
  }

  return (
    <ResponseTimeReport
      studio={studio}
      studioLogs={studioLogs ?? []}
      allLogs={allLogs ?? []}
      initialAssumptions={resolved.assumptions}
      assumptionsSource={resolved.source}
    />
  );
}
