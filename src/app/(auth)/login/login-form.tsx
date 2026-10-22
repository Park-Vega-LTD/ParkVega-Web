"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { clientFetch } from "@/lib/api.client";
import { nextQuery, safeNextPath } from "@/lib/auth-redirect";
import type { User } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/**
 * The exact message the BFF login Route Handler returns on a 401.
 * `clientFetch` throws a generic Error carrying this message (it does not
 * expose the HTTP status), so we match on the message text to distinguish a
 * 401 (wrong credentials) from any other failure.
 * Requirements: 12.3, 12.8
 */
const INCORRECT_CREDENTIALS_MESSAGE = "Incorrect email or password.";
const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const {
    formState: { isSubmitting },
  } = form;

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);

    try {
      await clientFetch<{ user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });

      const next = searchParams.get("next");
      router.push(safeNextPath(next));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (message === INCORRECT_CREDENTIALS_MESSAGE) {
        // Preserve the email field value; only reset the password.
        form.resetField("password");
        setFormError(INCORRECT_CREDENTIALS_MESSAGE);
      } else {
        setFormError(GENERIC_ERROR_MESSAGE);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage your bookings and plan your day.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                    {...field}
                  />
                </FormControl>
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
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>

          {formError ? (
            <p
              role="alert"
              className="text-center text-sm font-medium text-destructive"
            >
              {formError}
            </p>
          ) : null}
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href={`/register${nextQuery(safeNextPath(searchParams.get("next")))}`} className="font-medium text-primary-ink underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

/**
 * `useSearchParams()` must be wrapped in a Suspense boundary in Next.js 15.
 */
export function LoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  );
}
