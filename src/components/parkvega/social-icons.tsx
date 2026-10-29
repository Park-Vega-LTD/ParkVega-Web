/** Filled brand marks for the footer's social links, drawn in each network's own colours. */

export function YouTubeIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><rect x="1.5" y="4.5" width="21" height="15" rx="4.5" fill="#FF0000" /><path d="M10 8.8v6.4l5.6-3.2z" fill="#fff" /></svg>;
}

export function InstagramIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><rect x="2" y="2" width="20" height="20" rx="6" fill="#FF5A1F" /><circle cx="12" cy="12" r="4.4" fill="none" stroke="#fff" strokeWidth="2.2" /><circle cx="17.4" cy="6.6" r="1.3" fill="#fff" /></svg>;
}

export function FacebookIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><circle cx="12" cy="12" r="11" fill="#1877F2" /><path d="M13.4 23v-7.7h2.6l.4-3h-3V10.4c0-.9.3-1.5 1.5-1.5h1.6V6.2a21 21 0 0 0-2.3-.1c-2.3 0-3.9 1.4-3.9 4v2.2H7.7v3h2.6V23z" fill="#fff" /></svg>;
}

export function XLogoIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}><path d="M17.75 2.5h3.07l-6.71 7.67 7.9 10.33h-6.18l-4.84-6.33-5.54 6.33H2.38l7.18-8.2L2 2.5h6.34l4.37 5.78zm-1.08 16.18h1.7L7.4 4.23H5.58z" /></svg>;
}

export function MailIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><rect x="1.5" y="4" width="21" height="16" rx="2.5" fill="#fff" /><path d="M3 6.2 12 13l9-6.8" fill="none" stroke="#E53935" strokeWidth="2.2" strokeLinejoin="round" /></svg>;
}
