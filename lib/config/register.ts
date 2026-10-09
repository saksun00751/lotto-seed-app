export type RegisterClientVariant = "register" | "registerWithUsername";

const DEFAULT_REGISTER_CLIENT: RegisterClientVariant = "register";

function normalizeRegisterClient(value: string | undefined | null): RegisterClientVariant {
  if (value === "registerWithUsername") return "registerWithUsername";
  if (value === "register") return "register";
  return DEFAULT_REGISTER_CLIENT;
}

export function getRegisterClientVariant(): RegisterClientVariant {
  return normalizeRegisterClient(
    process.env.NEXT_PUBLIC_REGISTER_CLIENT
      ?? process.env.REGISTER_CLIENT
      ?? process.env.NEXT_PUBLIC_REGISTER_PAGE
      ?? process.env.REGISTER_PAGE,
  );
}

export function getRegisterPageSegment(): RegisterClientVariant {
  return getRegisterClientVariant();
}

export function getRegisterPagePath(locale: string): string {
  return `/${locale}/register`;
}

// NEXT_PUBLIC_REGISTER_ENABLED=false (or 0/off/no) disables registration. Unset = enabled.
export function isRegisterEnabled(): boolean {
  const v = (process.env.NEXT_PUBLIC_REGISTER_ENABLED ?? "").trim().toLowerCase();
  return !["false", "0", "off", "no"].includes(v);
}
