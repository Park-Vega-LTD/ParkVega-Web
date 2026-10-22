import type { ReactNode } from "react";

import { WhatsAppIcon } from "@/components/parkvega/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Click-to-chat button with an optional pre-filled message. */
export function WhatsAppButton({
  message,
  children,
  variant = "solid",
  size,
  className,
}: {
  message?: string;
  children: ReactNode;
  variant?: "solid" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  return (
    <Button
      asChild
      size={size}
      className={cn(
        variant === "solid"
          ? "bg-whatsapp text-white hover:bg-whatsapp/90"
          : "border border-whatsapp bg-transparent text-whatsapp hover:bg-whatsapp/10",
        className,
      )}
    >
      <a href={whatsappUrl(message)} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon className="size-5" /> {children}
      </a>
    </Button>
  );
}
