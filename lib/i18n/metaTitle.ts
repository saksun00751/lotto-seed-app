import th from "./locales/th.json";
import en from "./locales/en.json";
import kh from "./locales/kh.json";
import la from "./locales/la.json";
import { getSiteMeta } from "@/lib/api/site";

const locales = { th, en, kh, la } as const;
type Lang = keyof typeof locales;
type Locale = typeof th;

export type MetaTitleKey =
  | "login"
  | "register"
  | "dashboard"
  | "bet"
  | "history"
  | "checkResult"
  | "profile"
  | "deposit"
  | "withdraw"
  | "transactions"
  | "promotion"
  | "contact"
  | "contactPublic"
  | "results"
  | "referral"
  | "coupon"
  | "spin"
  | "spinHistory"
  | "bonus"
  | "changePassword"
  | "reward";

const DEFAULT_TITLE_SUFFIX = "huayinter88.com";

function resolveLang(locale: string | undefined): Lang {
  if (!locale) return "th";
  return locale in locales ? (locale as Lang) : "th";
}

function getLabel(dict: Locale, key: MetaTitleKey): string {
  switch (key) {
    case "login":
      return dict.login.submitLogin;
    case "register":
      return dict.register.heading;
    case "dashboard":
      return dict.navbar.home;
    case "bet":
      return dict.bet.title;
    case "history":
      return dict.history.title;
    case "checkResult":
      return dict.checkResult.title;
    case "profile":
      return dict.navbar.profile;
    case "deposit":
      return dict.dashboard.deposit;
    case "withdraw":
      return dict.navbar.withdraw;
    case "transactions":
      return dict.transactions.title;
    case "promotion":
      return dict.navbar.promotion;
    case "contact":
    case "contactPublic":
      return dict.contact.title;
    case "results":
      return dict.navbar.results;
    case "referral":
      return dict.navbar.referral;
    case "coupon":
      return dict.coupon.title;
    case "spin":
      return dict.spin.title;
    case "spinHistory":
      return `${dict.spin.title} ${dict.navbar.history}`;
    case "bonus":
      return dict.bonus.title;
    case "changePassword":
      return dict.changePassword.title;
    case "reward":
      return dict.reward.title;
    default:
      return DEFAULT_TITLE_SUFFIX;
  }
}

async function getTitleSuffix(): Promise<string> {
  const siteMeta = await getSiteMeta();
  const siteName = siteMeta?.name?.trim();
  return siteName || DEFAULT_TITLE_SUFFIX;
}

export async function withTitleSuffix(title: string): Promise<string> {
  return `${title} — ${await getTitleSuffix()}`;
}

export async function getPageMetaTitle(locale: string | undefined, key: MetaTitleKey): Promise<string> {
  const dict = locales[resolveLang(locale)];
  return withTitleSuffix(getLabel(dict, key));
}
