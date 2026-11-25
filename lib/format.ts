// (407) 310-6558 style for US numbers; anything else stays as typed
export function prettyPhone(v: string | null | undefined): string {
  if (!v) return "";
  const d = v.replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  if (ten.length === 10) return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return v;
}
