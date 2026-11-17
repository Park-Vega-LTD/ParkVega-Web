import {
  Baby,
  Cake,
  Camera,
  Car,
  Clock,
  Droplets,
  Heart,
  LifeBuoy,
  MapPin,
  PartyPopper,
  School,
  ShieldCheck,
  Shirt,
  Star,
  Sun,
  Ticket,
  Umbrella,
  UsersRound,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from "lucide-react";

import type { BlockIconName } from "@/lib/page-blocks";

const ICONS: Record<BlockIconName, LucideIcon> = {
  clock: Clock,
  shirt: Shirt,
  users: UsersRound,
  "life-buoy": LifeBuoy,
  cake: Cake,
  school: School,
  ticket: Ticket,
  umbrella: Umbrella,
  utensils: UtensilsCrossed,
  waves: Waves,
  "shield-check": ShieldCheck,
  "map-pin": MapPin,
  sun: Sun,
  star: Star,
  heart: Heart,
  camera: Camera,
  baby: Baby,
  car: Car,
  droplets: Droplets,
  "party-popper": PartyPopper,
};

/** The drawing for an icon staff picked in the admin; unknown names fall back to a star. */
export function BlockIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name as BlockIconName] ?? Star;
  return <Icon className={className} aria-hidden="true" />;
}
