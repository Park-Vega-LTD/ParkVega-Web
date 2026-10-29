/**
 * The API accepts Nigerian mobiles only in E.164 form, /^\+234[789][01]\d{8}$/.
 * Normalise whatever the visitor typed ("0802 444 0445", "2348024440445",
 * "+234 802-444-0445") before sending. Returns null when it can't be one.
 */
export function normalizeNgPhone(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('234')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);

  const e164 = `+234${digits}`;
  return /^\+234[789][01]\d{8}$/.test(e164) ? e164 : null;
}
