"use client";

import Link from "next/link";
import { ArrowUp, MessageCircleQuestion, RotateCcw, Sparkles, X } from "lucide-react";
import { Fragment, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { WhatsAppIcon } from "@/components/parkvega/whatsapp-icon";
import { whatsappUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "pv-chat";
const MAX_CHARS = 1000;

const SUGGESTIONS = [
  "How much are tickets?",
  "Are you open today?",
  "Directions from Benin City",
  "What should we wear?",
];

const GREETING =
  "Hi! I'm Vega, Park Vega's assistant. Ask me about tickets, opening hours, directions or what to bring.";

function loadMessages(): Message[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((m) => m && typeof m.content === "string") : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
  } catch {
    // Storage blocked: the chat still works for this page view.
  }
}

/** Links the assistant may write: site paths, WhatsApp and Google Maps. */
function safeHref(href: string) {
  if (/^\/(?!\/)[^\s]*$/.test(href)) return href;
  if (/^https:\/\/(wa\.me|www\.google\.com\/maps)\//.test(href)) return href;
  return null;
}

/** Renders the assistant's light Markdown: [links](/path), **bold** and line breaks. */
function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    parts.push(text.slice(last, index));
    if (match[3]) {
      parts.push(<strong key={index}>{match[3]}</strong>);
    } else {
      const href = safeHref(match[2]);
      const className = "font-semibold text-primary-ink underline underline-offset-2";
      parts.push(
        !href ? (
          match[1]
        ) : href.startsWith("/") ? (
          <Link key={index} href={href} className={className}>
            {match[1]}
          </Link>
        ) : (
          <a key={index} href={href} target="_blank" rel="noopener noreferrer" className={className}>
            {match[1]}
          </a>
        ),
      );
    }
    last = index + match[0].length;
  }
  parts.push(text.slice(last));
  return (
    <>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <Fragment key={`t${i}`}>
            {part.split("\n").map((line, j) => (
              <Fragment key={j}>
                {j > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </Fragment>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * "Ask Vega": a floating chat assistant that answers questions about the park
 * from the FAQs, prices, opening hours and directions (POST /api/chat).
 * Anything it can't answer is handed to WhatsApp.
 */
export function ParkChat({ revealed }: { revealed: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const titleId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Restore this tab's conversation after the first render (sessionStorage isn't there on the server).
  useEffect(() => {
    const saved = loadMessages();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from browser storage
    if (saved.length > 0) setMessages(saved);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, problem, open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const close = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  async function send(text: string) {
    const content = text.trim().slice(0, MAX_CHARS);
    if (!content || busy) return;
    const history: Message[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setProblem(null);
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let reply = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.filter((m) => m.content) }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Sorry, I can't answer right now.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: reply }]);
      }
      if (!reply.trim()) throw new Error("Sorry, I didn't catch that. Please try again.");
      saveMessages([...history, { role: "assistant", content: reply }]);
    } catch (err) {
      if (controller.signal.aborted) return;
      setMessages(history);
      saveMessages(history);
      setProblem(err instanceof Error ? err.message : "Sorry, I can't answer right now.");
    } finally {
      setBusy(false);
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  const restart = () => {
    abortRef.current?.abort();
    setMessages([]);
    setProblem(null);
    setBusy(false);
    saveMessages([]);
    inputRef.current?.focus();
  };

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        inert={!revealed && !open ? true : undefined}
        className={cn(
          "fixed bottom-40 right-4 z-50 flex h-14 items-center gap-2 rounded-full bg-primary px-4 font-display font-semibold text-primary-foreground shadow-2xl transition-all duration-300 hover:scale-105 md:bottom-24 md:right-6",
          !revealed && !open && "pointer-events-none translate-y-6 opacity-0",
          open && "max-md:hidden",
        )}
      >
        {open ? <X className="size-6" aria-hidden="true" /> : <MessageCircleQuestion className="size-6" aria-hidden="true" />}
        <span className="sr-only md:not-sr-only">{open ? "Close chat" : "Ask Vega"}</span>
      </button>

      {open ? (
        <section
          id={titleId}
          role="dialog"
          aria-label="Ask Vega, Park Vega's chat assistant"
          onKeyDown={(event) => event.key === "Escape" && close()}
          className="fixed inset-x-3 bottom-3 top-16 z-[60] flex flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl md:inset-x-auto md:bottom-44 md:right-6 md:top-auto md:h-[min(36rem,calc(100dvh-16rem))] md:w-[24rem]"
        >
          <header className="relative flex items-center gap-3 overflow-hidden bg-deep px-4 py-3 text-hero-foreground">
            <span aria-hidden="true" className="absolute -right-6 -top-8 size-24 rounded-full bg-primary/40" />
            <span aria-hidden="true" className="absolute right-16 -bottom-6 size-12 rounded-full bg-secondary/30" />
            <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-deep">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div className="relative min-w-0 flex-1">
              <h2 className="font-display text-lg font-semibold leading-tight">Ask Vega</h2>
              <p className="text-xs text-hero-foreground/80">Park Vega&apos;s assistant · answers in seconds</p>
            </div>
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={restart}
                aria-label="Start a new chat"
                className="relative grid size-9 place-items-center rounded-full hover:bg-hero-foreground/15"
              >
                <RotateCcw className="size-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={close}
              aria-label="Close chat"
              className="relative grid size-9 place-items-center rounded-full hover:bg-hero-foreground/15"
            >
              <X className="size-5" />
            </button>
          </header>

          <div ref={logRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-ocean-soft/40 p-4">
            <Bubble role="assistant">{GREETING}</Bubble>
            {messages.length === 0 ? (
              <ul className="flex flex-wrap gap-2 pt-1" aria-label="Suggested questions">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="rounded-full border border-primary/40 bg-background px-3 py-1.5 text-sm font-semibold text-primary-ink hover:border-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {messages.map((message, i) => (
              <Bubble key={i} role={message.role}>
                {message.content ? (
                  message.role === "assistant" ? <RichText text={message.content} /> : message.content
                ) : (
                  <TypingDots />
                )}
              </Bubble>
            ))}
            {problem ? (
              <div className="rounded-2xl border border-coral/40 bg-background p-3 text-sm">
                <p>{problem}</p>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 font-semibold text-whatsapp"
                >
                  <WhatsAppIcon className="size-4" /> Message us on WhatsApp
                </a>
              </div>
            ) : null}
          </div>

          <form onSubmit={submit} className="border-t border-border bg-background p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-input bg-background p-1.5 pl-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
              <label htmlFor={`${titleId}-input`} className="sr-only">
                Your question
              </label>
              <textarea
                id={`${titleId}-input`}
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={MAX_CHARS}
                placeholder="Ask about tickets, hours, directions…"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send(input);
                  }
                }}
                className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
            <p className="mt-2 px-1 text-[0.7rem] leading-snug text-muted-foreground">
              Vega can make mistakes. For bookings and anything urgent,{" "}
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                WhatsApp us
              </a>
              .
            </p>
          </form>
        </section>
      ) : null}
    </>
  );
}

function Bubble({ role, children }: { role: Message["role"]; children: ReactNode }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          role === "user"
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border bg-background shadow-sm",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1 py-1" aria-label="Vega is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 animate-bounce rounded-full bg-primary/60 motion-reduce:animate-none"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}
