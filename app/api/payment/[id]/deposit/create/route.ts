import { NextRequest, NextResponse } from "next/server";
import { getApiToken, getLangCookie } from "@/lib/session/cookies";

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? "";

function getRegistrableDomain(host: string): string {
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  return parts.slice(-2).join(".");
}

function isAllowedPaymentUrl(url: string): boolean {
  try {
    const target = new URL(url);
    if (target.protocol !== "https:" && target.protocol !== "http:") return false;
    if (!API_BASE) return false;
    const base = new URL(API_BASE);
    return getRegistrableDomain(target.hostname) === getRegistrableDomain(base.hostname);
  } catch {
    return false;
  }
}

function buildAuthHeaders(token: string, lang?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (lang) {
    headers["X-Language"] = lang;
    headers["language"]   = lang;
    headers["lang"]       = lang;
    headers["locale"]     = lang;
  }
  return headers;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getApiToken();
  if (!token) return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { id } = await params;
  const providerId = id.trim();
  if (!providerId || !ID_PATTERN.test(providerId)) {
    return NextResponse.json({ success: false, message: "provider id ไม่ถูกต้อง" }, { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ success: false, message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }
    payload = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const paymentUrl = typeof payload.payment_url === "string" ? payload.payment_url.trim() : "";
  if (!paymentUrl) {
    return NextResponse.json({ success: false, message: "ไม่พบ payment_url" }, { status: 400 });
  }
  if (!isAllowedPaymentUrl(paymentUrl)) {
    return NextResponse.json({ success: false, message: "payment_url ไม่ถูกต้อง" }, { status: 400 });
  }

  const lang = await getLangCookie();
  const { payment_url: _omit, ...forwardBody } = payload;

  try {
    const res = await fetch(paymentUrl, {
      method: "POST",
      headers: buildAuthHeaders(token, lang),
      body: JSON.stringify(forwardBody),
      cache: "no-store",
      redirect: "manual",
    });
    const text = await res.text();
    let data: unknown;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { success: false, message: text || `HTTP ${res.status}` }; }
    return NextResponse.json(data, { status: res.ok ? 200 : (res.status || 400) });
  } catch {
    return NextResponse.json({ success: false, message: "ไม่สามารถสร้างรายการฝากเงินได้" }, { status: 500 });
  }
}
