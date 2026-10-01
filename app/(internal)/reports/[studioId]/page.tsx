export default async function ReportPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Response Time Report
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        Coming in Phase 1 (studio: {studioId}). Will render the printable
        per-studio report with response times vs. the Charleston median and
        the estimated revenue leak from lib/revenue-leak.ts.
      </p>
    </div>
  );
}
