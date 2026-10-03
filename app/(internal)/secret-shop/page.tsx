import { createClient } from "@/lib/supabase/server";
import { SecretShopClient } from "@/components/secret-shop/secret-shop-client";
import type { LogWithStudio } from "@/components/secret-shop/secret-shop-client";

export default async function SecretShopPage() {
  const supabase = await createClient();

  const [{ data: logs, error: logsError }, { data: studios }] =
    await Promise.all([
      supabase
        .from("secret_shop_logs")
        .select("*, studios(name)")
        .order("sent_at", { ascending: false }),
      supabase
        .from("studios")
        .select("id, name")
        .eq("is_franchise", false)
        .order("name", { ascending: true }),
    ]);

  if (logsError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Couldn&apos;t load secret-shop logs: {logsError.message}
      </div>
    );
  }

  return (
    <SecretShopClient
      logs={(logs ?? []) as LogWithStudio[]}
      studios={studios ?? []}
    />
  );
}
