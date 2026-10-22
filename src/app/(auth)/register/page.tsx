import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create your Park Vega account",
  description:
    "Register for a Park Vega account to book tickets, manage your visits, and access your digital tickets.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
