import { SidebarNav } from "@/components/ui/sidebar-nav";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface md:flex-row print:bg-white">
      <SidebarNav />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8 print:p-0">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
