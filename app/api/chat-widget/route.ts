import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { processIncomingMessage } from "@/lib/agent-runtime";

/**
 * Public, unauthenticated endpoint the embeddable chat widget calls from
 * a studio's own website — a different origin, so CORS is wired open on
 * purpose (no cookies/credentials are used, nothing here trusts the
 * request beyond the studioConfigId + visitorId it's given, same posture
 * as /unsubscribe in Phase 1). Uses the admin client since a website
 * visitor has no Supabase session — see lib/agent-runtime.ts and
 * lib/providers/booking/mock.ts for how owner_id gets set explicitly on
 * every insert to satisfy the NOT NULL column without an auth.uid().
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MAX_MESSAGE_LENGTH = 2000;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  let body: {
    studioConfigId?: string;
    conversationId?: string;
    message?: string;
    visitorId?: string;
    visitorName?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const { studioConfigId, visitorId, visitorName } = body;
  const message = body.message?.trim();
  let conversationId = body.conversationId;

  if (!studioConfigId || !visitorId || !message) {
    return NextResponse.json(
      { error: "studioConfigId, visitorId, and message are required" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: "Message is too long" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const admin = createAdminClient();

  if (!conversationId) {
    const { data: config } = await admin
      .from("studio_configs")
      .select("id, owner_id")
      .eq("id", studioConfigId)
      .single();

    if (!config) {
      return NextResponse.json(
        { error: "Unknown studio" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    const { data: conversation, error } = await admin
      .from("conversations")
      .insert({
        owner_id: config.owner_id,
        studio_config_id: studioConfigId,
        channel: "chat_widget",
        contact_name: visitorName?.trim() || null,
        contact_identifier: visitorId,
        consent_given: true,
        consent_source: "chat_widget",
        consent_timestamp: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !conversation) {
      return NextResponse.json(
        { error: "Could not start conversation" },
        { status: 500, headers: CORS_HEADERS },
      );
    }
    conversationId = conversation.id;
  }

  const result = await processIncomingMessage(admin, conversationId, message);

  return NextResponse.json(
    { ...result, conversationId },
    { status: result.error ? 500 : 200, headers: CORS_HEADERS },
  );
}
