"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";

import { CustomerIdBadge, SignInPrompt } from "@/components/parkvega/account-gate";
import { WhatsAppIcon } from "@/components/parkvega/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fullName, useResetSession, useSession } from "@/hooks/use-session";
import { normalizeNgPhone, whatsappUrl } from "@/lib/site";

export type EnquiryField = {
  name: string;
  label: string;
  type?: "text" | "tel" | "email" | "date" | "number" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  options?: string[];
  hint?: string;
  min?: number;
};

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; reference: string | null }
  | { kind: "whatsapp"; message: string };

const fieldClass = "h-12 rounded-xl bg-background text-base md:text-base";

/**
 * Group booking enquiry form (birthdays, school trips).
 *
 * Group bookings need a Park Vega account: signed-out visitors see a
 * log-in / sign-up prompt that returns them to the form, and signed-in
 * customers get their name, WhatsApp number and email pre-filled.
 *
 * Posts to `POST /api/enquiries` (proxied to the REST API). If the backend
 * does not accept it yet, or is unreachable, the visitor is handed a
 * WhatsApp message pre-filled with everything they typed so the lead is
 * never lost.
 */
export function EnquiryForm({
  type,
  title,
  fields,
  submitLabel = "Send enquiry",
}: {
  type: "birthday" | "school";
  title: string;
  fields: EnquiryField[];
  submitLabel?: string;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const { user, isLoading } = useSession();
  const resetSession = useResetSession();
  const pathname = usePathname();
  // Account details pre-fill the matching form fields.
  const prefill: Record<string, string> = user
    ? { name: fullName(user), whatsapp: user.phone_number ?? "", email: user.email }
    : {};
  const [phoneError, setPhoneError] = useState<string>();
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;

    const phone = normalizeNgPhone(data.whatsapp ?? "");
    if (!phone) {
      setPhoneError("Enter a valid Nigerian WhatsApp number, e.g. 0802 444 0445");
      return;
    }
    setPhoneError(undefined);

    const lines = fields
      .filter((field) => data[field.name])
      .map((field) => `${field.label}: ${data[field.name]}`);
    const message = `Hi Park Vega! ${title}\n\n${lines.join("\n")}`;

    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...data, whatsapp: phone }),
      });
      if (res.status === 401) {
        // Session expired: show the sign-in prompt again.
        resetSession();
        setStatus({ kind: "idle" });
        return;
      }
      if (!res.ok) {
        setStatus({ kind: "whatsapp", message });
        return;
      }
      const body = await res.json().catch(() => ({}));
      const created = (body?.data ?? body) as { code?: string; id?: string };
      setStatus({ kind: "sent", reference: created.code ?? created.id ?? null });
    } catch {
      setStatus({ kind: "whatsapp", message });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto size-12 text-primary-ink" />
        <h3 className="mt-4 text-2xl font-semibold">Enquiry received!</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Our team will reach you on WhatsApp shortly to confirm the details.
        </p>
        {status.reference && (
          <p className="mt-4 text-sm">
            Reference <span className="font-mono font-bold">{status.reference}</span>
          </p>
        )}
        <CustomerIdBadge id={user?.customer_id} className="mt-4" />
      </div>
    );
  }

  if (status.kind === "whatsapp") {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center" role="status">
        <WhatsAppIcon className="mx-auto size-12 text-whatsapp" />
        <h3 className="mt-4 text-2xl font-semibold">One last step</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Tap below to send your details to our team on WhatsApp. Everything you
          entered is already filled in.
        </p>
        <Button asChild size="lg" className="mt-6 bg-whatsapp text-white hover:bg-whatsapp/90">
          <a href={whatsappUrl(status.message)} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="size-5" /> Send on WhatsApp
          </a>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-3xl border border-border bg-card p-10 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" /> Checking your account…
      </div>
    );
  }

  if (!user) {
    return (
      <SignInPrompt
        title="Sign in to send your booking"
        text="Group bookings are linked to your Park Vega account, so we can confirm details and keep your booking history in one place."
        next={`${pathname}#book`}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2 sm:p-8">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm sm:col-span-2">
        <span>
          Booking as <span className="font-semibold">{fullName(user)}</span>
        </span>
        <CustomerIdBadge id={user.customer_id} className="bg-card" />
      </div>
      {fields.map((field) => {
        const id = `${type}-${field.name}`;
        const wide = field.type === "textarea" || field.type === "select";
        return (
          <div key={field.name} className={wide ? "grid gap-2 sm:col-span-2" : "grid gap-2"}>
            <Label htmlFor={id}>
              {field.label}
              {!field.required && <span className="font-normal text-muted-foreground"> (optional)</span>}
            </Label>
            {field.type === "textarea" ? (
              <Textarea id={id} name={field.name} required={field.required} placeholder={field.placeholder} rows={4} className="rounded-xl bg-background text-base md:text-base" />
            ) : field.type === "select" ? (
              <select id={id} name={field.name} required={field.required} className={`${fieldClass} w-full border border-input px-3`} defaultValue="">
                <option value="" disabled>
                  Choose one…
                </option>
                {field.options?.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : (
              <Input
                id={id}
                name={field.name}
                type={field.type ?? "text"}
                required={field.required}
                placeholder={field.placeholder}
                defaultValue={prefill[field.name]}
                min={field.type === "date" ? today : field.min}
                inputMode={field.type === "tel" ? "tel" : field.type === "number" ? "numeric" : undefined}
                autoComplete={field.type === "tel" ? "tel" : field.type === "email" ? "email" : field.name === "name" ? "name" : undefined}
                aria-invalid={field.name === "whatsapp" && phoneError ? true : undefined}
                className={fieldClass}
              />
            )}
            {field.name === "whatsapp" && phoneError ? (
              <p className="text-xs font-semibold text-destructive">{phoneError}</p>
            ) : (
              field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>
            )}
          </div>
        );
      })}
      <div className="sm:col-span-2">
        <Button type="submit" variant="ticket" size="lg" className="w-full" disabled={status.kind === "sending"}>
          {status.kind === "sending" && <Loader2 className="size-5 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
