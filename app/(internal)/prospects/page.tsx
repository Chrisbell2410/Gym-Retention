import { createClient } from "@/lib/supabase/server";
import { ProspectsTable } from "@/components/prospects/prospects-table";

export default async function ProspectsPage() {
  const supabase = await createClient();
  const { data: studios, error } = await supabase
    .from("studios")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Couldn&apos;t load studios: {error.message}
      </div>
    );
  }

  return <ProspectsTable studios={studios ?? []} />;
}
