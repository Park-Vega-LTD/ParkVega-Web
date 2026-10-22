import type { Metadata } from "next";

import { BookingConfirmation } from "@/components/parkvega/booking-confirmation";

// Personal booking pages must never be indexed or shared in search results.
export const metadata: Metadata = {
  title: "Your Booking | Park Vega Waterpark",
  robots: { index: false, follow: false },
};

export default async function BookingPage({ params }: PageProps<"/booking/[code]">) {
  const { code } = await params;
  return <BookingConfirmation code={code} />;
}
