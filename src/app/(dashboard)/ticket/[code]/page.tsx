import { redirect } from "next/navigation";

/**
 * Legacy ticket URL. Tickets now live on the public confirmation page so
 * guests without an account can open them too; keep old links working.
 */
export default async function TicketPage({ params }: PageProps<"/ticket/[code]">) {
  const { code } = await params;
  redirect(`/booking/${encodeURIComponent(code)}`);
}
