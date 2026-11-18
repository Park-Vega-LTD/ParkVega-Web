import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildChatKnowledge, chatSystemPrompt } from "@/lib/chat-knowledge";

/**
 * POST /api/chat: the park chat assistant. The browser sends the
 * conversation so far; the reply streams back as plain text. The OpenAI key
 * stays on this server (OPENAI_API_KEY) and the assistant answers only from
 * the park facts in chat-knowledge.ts.
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const MAX_MESSAGES = 12;
const MAX_CHARS = 1000;

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(MAX_CHARS),
      }),
    )
    .min(1)
    .max(40)
    .refine((messages) => messages[messages.length - 1].role === "user", "The last message must be the guest's."),
});

/** Messages per visitor per window. Kept in memory: per server instance, which is enough to stop casual abuse. */
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string, now = Date.now()) {
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) if (times.every((time) => now - time >= RATE_WINDOW_MS)) hits.delete(key);
  }
  return recent.length > RATE_LIMIT;
}

function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

const error = (status: number, message: string) => NextResponse.json({ message }, { status });

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return error(503, "The chat assistant isn't set up yet. Please message us on WhatsApp.");

  if (rateLimited(clientIp(request))) {
    return error(429, "You've sent a lot of messages. Please wait a few minutes, or message us on WhatsApp.");
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error(400, "Please send a shorter message.");
  // Only the latest turns go to the model, to keep each request small.
  const messages = parsed.data.messages.slice(-MAX_MESSAGES);

  const knowledge = await buildChatKnowledge();
  const upstream = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      stream: true,
      max_completion_tokens: 500,
      messages: [{ role: "system", content: chatSystemPrompt(knowledge) }, ...messages],
    }),
    signal: request.signal,
  }).catch(() => null);

  if (!upstream?.ok || !upstream.body) {
    const detail = upstream ? await upstream.text().catch(() => "") : "network error";
    console.error("[chat] OpenAI request failed", upstream?.status, detail.slice(0, 500));
    return error(502, "Sorry, I can't answer right now. Please try again, or message us on WhatsApp.");
  }

  // OpenAI streams server-sent events; pass on only the text.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  const text = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const data = line.startsWith("data:") ? line.slice(5).trim() : "";
          if (!data || data === "[DONE]") continue;
          try {
            const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) controller.enqueue(encoder.encode(delta));
          } catch {
            // A partial or non-JSON line; skip it.
          }
        }
      },
    }),
  );

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
