"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { clientFetch } from "@/lib/api.client";
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

const accountSchema = z.object({
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
  phone_number: z
    .string()
    .trim()
    .max(20, "Phone number must be 20 characters or fewer")
    .optional()
    .or(z.literal("")),
});

type AccountFormValues = z.infer<typeof accountSchema>;

/**
 * Profile edit form.
 *
 * Pre-populated from the server-fetched `User` (Requirement 10.2). On submit it
 * runs a TanStack Query mutation that PATCHes `/users/me` through the BFF data
 * proxy (`/api/users/me`); on success it invalidates `['user', 'me']` and shows
 * a success toast (Requirements 10.3, 15.2, 15.3, 15.5); on failure it shows the
 * REST API error message below the submit button (Requirement 10.4).
 */
export function AccountForm({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      phone_number: user.phone_number ?? "",
    },
  });

  const mutation = useMutation<User, Error, AccountFormValues>({
    mutationFn: (values) =>
      clientFetch<User>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: values.first_name,
          last_name: values.last_name,
          // Normalise an empty string back to null for the API.
          phone_number: values.phone_number ? values.phone_number : null,
        }),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      form.reset({
        first_name: updated.first_name ?? "",
        last_name: updated.last_name ?? "",
        phone_number: updated.phone_number ?? "",
      });
      toast.success("Profile updated.");
    },
  });

  async function onSubmit(values: AccountFormValues) {
    setFormError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  const { isSubmitting } = form.formState;
  const isBusy = isSubmitting || mutation.isPending;

  return (
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
                  <Input autoComplete="given-name" {...field} />
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
                  <Input autoComplete="family-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  autoComplete="tel"
                  placeholder="e.g. +234 800 000 0000"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Button type="submit" disabled={isBusy}>
            {isBusy ? "Saving\u2026" : "Save changes"}
          </Button>

          {formError ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
        </div>
      </form>
    </Form>
  );
}
