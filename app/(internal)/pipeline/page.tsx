import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/pipeline/kanban-board";

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data: studios, error } = await supabase
    .from("studios")
    .select("*")
    .eq("is_franchise", false)
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Couldn&apos;t load the pipeline: {error.message}
      </div>
    );
  }

  return <KanbanBoard studios={studios ?? []} />;
}
