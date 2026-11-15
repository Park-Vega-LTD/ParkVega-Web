"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";

import { clientFetch } from "@/lib/api.client";
import { nextQuery, safeNextPath } from "@/lib/auth-redirect";
import { normalizeNgPhone } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/**
 * Password rules, kept identical to the API's RegisterDto (8 to 72
 * characters with a lowercase letter, an uppercase letter and a digit) so a
 * password the form accepts is never rejected by the server.
 */
const PASSWORD_RULES = [
  { label: "8+ characters", test: (value: string) => value.length >= 8 },
  { label: "Uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "Number", test: (value: string) => /\d/.test(value) },
];

const registerSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or fewer"),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or fewer"),
  email: z.string().trim().email("Enter a valid email address"),
  phone_number: z
    .string()
    .refine((value) => normalizeNgPhone(value) !== null, "Enter a valid Nigerian phone number, e.g. 0802 444 0445"),
  password: z
    .string()
    .max(72, "Password must be 72 characters or fewer")
    .refine(
      (value) => PASSWORD_RULES.every((rule) => rule.test(value)),
      "Use at least 8 characters with an uppercase letter, a lowercase letter and a number",
    ),
});

type RegisterValues = z.infer<typeof registerSchema>;

const fieldClass = "h-12 rounded-xl bg-background px-4 md:text-base";

export function RegisterForm() {
  const router = useRouter();
  // Where to return after sign-up, e.g. the food order or a booking form.
  const next = safeNextPath(useSearchParams().get("next"));
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      password: "",
    },
  });

  const {
    formState: { isSubmitting },
  } = form;
  const password = useWatch({ control: form.control, name: "password" });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);

    // Step 1: register the account.
    try {
      await clientFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ ...values, phone_number: normalizeNgPhone(values.phone_number) }),
      });
    } catch (error) {
      // The BFF passes the API's message through, e.g. when the email or
      // phone number is already registered (409). Other fields are kept.
      const message = error instanceof Error ? error.message : "";
      setFormError(message || "Registration failed. Please try again.");
      return;
    }

    // Step 2: registration succeeded — attempt automatic login with the same credentials.
    try {
      await clientFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: values.email, password: values.password }),
      });
    } catch {
      // Account was created but auto-login failed: send the user to log in manually.
      toast.info(
        "Your account was created. Please log in to continue."
      );
      router.push(`/login${nextQuery(next)}&reason=registered`);
      return;
    }

    // Step 3: both succeeded — go back to where the visitor started.
    router.push(next);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-wider text-primary-ink">
          Join Park Vega
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground">
          Sign up to book tickets and manage your visits.
        </p>
      </div>

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="given-name"
                      placeholder="Jane"
                      className={fieldClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="family-name"
                      placeholder="Doe"
                      className={fieldClass}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={fieldClass}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number (WhatsApp)</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0802 444 0445"
                    className={fieldClass}
                    {...field}
                  />
                </FormControl>
                <FormDescription>We send your tickets and booking updates here.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Create a password"
                      className={cn(fieldClass, "pr-12")}
                      {...field}
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" aria-hidden="true" />
                    ) : (
                      <Eye className="size-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-sm">
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(password);
                    return (
                      <li
                        key={rule.label}
                        className={cn(
                          "flex items-center gap-2",
                          met ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded-full border",
                            met
                              ? "border-secondary bg-secondary text-secondary-foreground"
                              : "border-border",
                          )}
                          aria-hidden="true"
                        >
                          {met ? <Check className="size-3" strokeWidth={3} /> : null}
                        </span>
                        {rule.label}
                        <span className="sr-only">{met ? "(met)" : "(not met yet)"}</span>
                      </li>
                    );
                  })}
                </ul>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </Form>

      <p className="border-t border-border pt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={`/login${nextQuery(next)}`} className="font-bold text-primary-ink underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
