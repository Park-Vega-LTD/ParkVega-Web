import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in | Park Vega",
  description:
    "Sign in to your Park Vega account to view bookings, manage your profile, and plan your visit.",
};

export default function LoginPage() {
  return <LoginForm />;
}
