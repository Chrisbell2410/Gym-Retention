"use client";

import { useMemo, useState } from "react";
import { Copy } from "lucide-react";

export function WidgetPreviewClient({
  studios,
}: {
  studios: { id: string; name: string }[];
}) {
  const [studioConfigId, setStudioConfigId] = useState("");
  const [copied, setCopied] = useState(false);

  const embedSnippet = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `<script src="${origin}/widget.js" data-studio-config-id="${studioConfigId || "YOUR_STUDIO_CONFIG_ID"}"></script>`;
  }, [studioConfigId]);

  const frameSrcDoc = useMemo(() => {
    if (!studioConfigId) return "";
    return `<!doctype html><html><head><meta charset="utf-8" /><style>body{font-family:-apple-system,sans-serif;margin:0;padding:40px;color:#444;background:#fff;}</style></head><body><h2>A studio's website</h2><p>This page stands in for a real studio site. The chat bubble in the bottom-right corner is the live widget, loaded exactly the way it will be on an actual site.</p>${embedSnippet}</body></html>`;
  }, [studioConfigId, embedSnippet]);

  function copySnippet() {
    navigator.clipboard.writeText(embedSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">
          Chat Widget Preview
        </h1>
        <p className="text-sm text-ink-400">
          See the real, public-facing embeddable widget running inside a
          stand-in page — this is what a lead sees on a studio&apos;s actual
          website, not another internal test console.
        </p>
      </div>

      <div className="rounded-lg border border-surface-border bg-white p-4">
        <label className="mb-1.5 block text-xs font-semibold text-ink-500 uppercase">
          Studio
        </label>
        <select
          value={studioConfigId}
          onChange={(e) => setStudioConfigId(e.target.value)}
          className="w-full rounded-md border border-ink-200 px-2.5 py-2 text-sm text-ink-700 focus:border-spark-500 focus:ring-1 focus:ring-spark-500 focus:outline-none"
        >
          <option value="">Choose a configured studio…</option>
          {studios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {studios.length === 0 && (
        <p className="rounded-md bg-ink-50 p-3 text-sm text-ink-500">
          No studios have an AI configuration yet — set one up first (open a
          studio on Prospects or Pipeline → &quot;AI Configuration&quot;).
        </p>
      )}

      {studioConfigId && (
        <>
          <div className="rounded-lg border border-surface-border bg-white p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-500 uppercase">
                Embed snippet — paste this on the studio&apos;s actual site
              </label>
              <button
                onClick={copySnippet}
                className="flex items-center gap-1 text-xs font-medium text-spark-600 hover:text-spark-700"
              >
                <Copy size={13} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <code className="block overflow-x-auto rounded-md bg-ink-900 p-3 text-xs text-ink-100">
              {embedSnippet}
            </code>
          </div>

          <div className="overflow-hidden rounded-lg border border-surface-border bg-white">
            <iframe
              key={studioConfigId}
              srcDoc={frameSrcDoc}
              title="Widget preview"
              className="h-[560px] w-full"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </>
      )}
    </div>
  );
}
