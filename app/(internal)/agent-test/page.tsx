import { createClient } from "@/lib/supabase/server";
import { AgentTestClient } from "@/components/agent-test/agent-test-client";

export default async function AgentTestPage() {
  const supabase = await createClient();
  const { data: configs } = await supabase
    .from("studio_configs")
    .select("id, studios(name)")
    .order("created_at", { ascending: false });

  const studios = (configs ?? [])
    .filter((c) => c.studios)
    .map((c) => ({ id: c.id, name: c.studios!.name }));

  return <AgentTestClient studios={studios} />;
}
