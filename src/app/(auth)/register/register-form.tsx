"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { clientFetch } from "@/lib/api.client";
import { nextQuery, safeNextPath } from "@/lib/auth-redirect";
import { normalizeNgPhone } from "@/lib/site";
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
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  // Where to return after sign-up, e.g. the food order or a booking form.
  const next = safeNextPath(useSearchParams().get("next"));
  const [formError, setFormError] = useState<string | null>(null);

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
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up to book tickets and manage your visits.
        </p>
      </div>

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
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
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
        Already have an account?{" "}
        <Link href={`/login${nextQuery(next)}`} className="font-medium text-primary-ink hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
