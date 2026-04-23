"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AuthUser } from "@/lib/session/auth";

type WalletState = Pick<AuthUser, "balance" | "diamond">;

interface UserContextValue {
  user: AuthUser;
  refreshBalance: () => Promise<void>;
  setWallet: (next: Partial<WalletState>) => void;
}

interface RealtimeConfigResponse {
  success?: boolean;
  data?: {
    key?: string;
    wsHost?: string;
    ws_host?: string;
    wsPort?: number | string;
    ws_port?: number | string;
    wssPort?: number | string;
    wss_port?: number | string;
    wsPath?: string;
    ws_path?: string;
    forceTLS?: boolean;
    force_tls?: boolean;
    encrypted?: boolean;
    cluster?: string;
    enabledTransports?: string[];
    authEndpoint?: string;
    shared_member_channel?: string;
    sharedMemberChannel?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface RealtimeContextResponse {
  success?: boolean;
  data?: {
    member_code?: string | number;
    private_channel?: string;
    [key: string]: unknown;
  };
  member_code?: string | number;
  private_channel?: string;
  [key: string]: unknown;
}

const UserContext = createContext<UserContextValue | null>(null);

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeRealtimeConfig(payload: RealtimeConfigResponse): RealtimeConfigResponse["data"] | null {
  if (payload?.data && typeof payload.data === "object") return payload.data;
  if ((payload as Record<string, unknown>)?.realtime && typeof (payload as Record<string, unknown>).realtime === "object") {
    return (payload as Record<string, unknown>).realtime as RealtimeConfigResponse["data"];
  }
  if (payload && typeof payload === "object") return payload as RealtimeConfigResponse["data"];
  return null;
}

function normalizeRealtimeContext(payload: RealtimeContextResponse): { memberCode: string | null; privateChannel: string | null } {
  const data = payload?.data && typeof payload.data === "object" ? payload.data : payload;
  return {
    memberCode: data?.member_code != null ? String(data.member_code) : null,
    privateChannel: typeof data?.private_channel === "string" ? data.private_channel : null,
  };
}

function extractWalletPatch(payload: unknown): Partial<WalletState> {
  if (!payload || typeof payload !== "object") return {};

  const queue: Record<string, unknown>[] = [payload as Record<string, unknown>];
  const visited = new Set<Record<string, unknown>>();
  const patch: Partial<WalletState> = {};

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    if (patch.balance === undefined) {
      const balanceValue = current.balance ?? current.credit ?? current.amount_balance;
      const parsed = toNumber(balanceValue, Number.NaN);
      if (Number.isFinite(parsed)) patch.balance = parsed;
    }

    if (patch.diamond === undefined) {
      const diamondValue = current.diamond;
      const parsed = toNumber(diamondValue, Number.NaN);
      if (Number.isFinite(parsed)) patch.diamond = parsed;
    }

    for (const value of Object.values(current)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        queue.push(value as Record<string, unknown>);
      }
    }
  }

  return patch;
}

export function useUser(): AuthUser | null {
  return useContext(UserContext)?.user ?? null;
}

export function useUserRealtime() {
  return useContext(UserContext);
}

export default function UserProvider({
  user,
  apiToken,
  children,
}: {
  user: AuthUser;
  apiToken: string;
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<AuthUser>(user);
  const echoRef = useRef<Echo<"pusher"> | null>(null);
  const sharedChannelRef = useRef<string | null>(null);
  const privateChannelRef = useRef<string | null>(null);
  const reconcileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    let active = true;

    async function refreshBalance() {
      try {
        const res = await fetch("/api/balance", { cache: "no-store", credentials: "same-origin" });
        const json = await res.json();
        if (!active || json?.success === false) return;

        const profile = (json?.profile ?? json?.data ?? json) as Record<string, unknown>;
        setCurrentUser((prev) => ({
          ...prev,
          balance: toNumber(profile.balance, prev.balance),
          diamond: toNumber(profile.diamond, prev.diamond),
        }));
      } catch {}
    }

    function queueReconcile(delay = 500) {
      if (reconcileTimerRef.current) clearTimeout(reconcileTimerRef.current);
      reconcileTimerRef.current = setTimeout(() => {
        reconcileTimerRef.current = null;
        void refreshBalance();
      }, delay);
    }

    function setWallet(next: Partial<WalletState>) {
      setCurrentUser((prev) => ({
        ...prev,
        balance: next.balance ?? prev.balance,
        diamond: next.diamond ?? prev.diamond,
      }));
    }

    async function sendHeartbeat() {
      try {
        await fetch("/api/realtime/heartbeat", {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
        });
      } catch {}
    }

    async function setupRealtime() {
      try {
        const [configRes, contextRes] = await Promise.all([
          fetch("/api/realtime/config", { cache: "no-store", credentials: "same-origin" }),
          fetch("/api/realtime/context", { cache: "no-store", credentials: "same-origin" }),
        ]);
        if (!active || !configRes.ok || !contextRes.ok) return;

        const [configJson, contextJson] = await Promise.all([
          configRes.json() as Promise<RealtimeConfigResponse>,
          contextRes.json() as Promise<RealtimeContextResponse>,
        ]);

        const config = normalizeRealtimeConfig(configJson);
        const context = normalizeRealtimeContext(contextJson);
        const key = typeof config?.key === "string" ? config.key : "";
        const appName = process.env.NEXT_PUBLIC_APP_NAME;
        const memberCode = context.memberCode;
        const sharedMemberChannel = typeof config?.shared_member_channel === "string"
          ? config.shared_member_channel
          : typeof config?.sharedMemberChannel === "string"
          ? config.sharedMemberChannel
          : `${appName}_members`;
        const privateChannelName = context.privateChannel
          ?? (memberCode ? `${appName}_members.${memberCode}` : null);

        if (!config || !key || !privateChannelName) {
          return;
        }

        const wsHost = typeof config.ws_host === "string"
          ? config.ws_host
          : typeof config.wsHost === "string"
          ? config.wsHost
          : undefined;
        const wsPort = toNumber(config.ws_port ?? config.wsPort, 6001);
        const wssPort = toNumber(config.wss_port ?? config.wssPort ?? config.ws_port ?? config.wsPort, 443);
        const wsPath = typeof config.ws_path === "string"
          ? config.ws_path
          : typeof config.wsPath === "string"
          ? config.wsPath
          : "";
        const forceTLS = Boolean(config.force_tls ?? config.forceTLS ?? config.encrypted ?? true);
        const cluster = typeof config.cluster === "string" && config.cluster
          ? config.cluster
          : "mt1";
        const publicApiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
        const authEndpoint = publicApiBase.endsWith("/api/v1")
          ? `${publicApiBase}/realtime/auth`
          : `${publicApiBase}/api/v1/realtime/auth`;

        (globalThis as any).Pusher = Pusher;
        if (typeof window !== "undefined") {
          (window as any).Pusher = Pusher;
        }
        const echo = new Echo<"pusher">({
          broadcaster: "pusher",
          key,
          cluster,
          wsHost,
          wsPort,
          wssPort,
          wsPath,
          forceTLS,
          enabledTransports: ["ws", "wss"],
          authEndpoint,
          auth: {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              Accept: "application/json",
            },
          },
        });

        echoRef.current = echo;
        sharedChannelRef.current = sharedMemberChannel;
        privateChannelRef.current = privateChannelName;

        const reconcileWallet = (payload: unknown) => {
          const patch = extractWalletPatch(payload);
          if (patch.balance !== undefined || patch.diamond !== undefined) {
            setWallet(patch);
          }
          queueReconcile();
        };

        const formatAmount = (value: unknown) =>
          toNumber(value, 0).toLocaleString("th-TH");

        const handlePublicActivity = (payload: any) => {
          const eventName = typeof payload?.event === "string" ? payload.event : "";
          const message = typeof payload?.message === "string" ? payload.message : "";
          switch (eventName) {
            case "lotto.draw_closed":
              toast.info(message || "งวดหวยปิดรับแทงแล้ว");
              break;
            case "lotto.draw_resulted":
              toast.success(message || "ประกาศผลหวยแล้ว");
              break;
            case "lotto.draw_status_changed":
              toast.info(message || "สถานะงวดหวยมีการเปลี่ยนแปลง");
              break;
          }
        };

        const handleMemberActivity = (payload: any) => {
          const method = typeof payload?.method === "string" ? payload.method : "";
          const eventName = typeof payload?.event === "string" ? payload.event : "";
          const message = typeof payload?.message === "string" ? payload.message : "";
          const amount = formatAmount(payload?.data?.amount);

          switch (eventName) {
            case "wallet.deposit_approved":
              toast.success(message || `เติมเงินสำเร็จ +${amount} บาท`);
              break;
            case "wallet.withdraw_approved":
              toast.success(message || `ถอนเงินสำเร็จ -${amount} บาท`);
              break;
            case "wallet.withdraw_rejected":
              toast.error(message || "การถอนเงินถูกปฏิเสธ");
              break;
            case "wallet.rollback_applied":
              toast.info(message || "มีการปรับปรุงยอดเงิน");
              break;
            case "wallet.admin_adjusted":
              toast.info(message || "ยอดเงินถูกปรับโดยแอดมิน");
              break;
            case "lotto.ticket_won":
              toast.success(message || `ถูกรางวัลหวย +${amount} บาท`);
              break;
            case "lotto.ticket_refunded":
              toast.info(message || `คืนเงินค่าหวย +${amount} บาท`);
              break;
          }

          if (method === "deposit" || method === "withdraw" || method === "rollback" || method === "adjust") {
            reconcileWallet(payload);
          }
        };

        const sharedChannel = echo.private(sharedMemberChannel);
        sharedChannel
          .listen(".public.activity.updated", handlePublicActivity)
          .error((err: unknown) => {
            console.error("[echo:shared] subscription error", err);
          });

        const privateChannel = echo.private(privateChannelName);
        privateChannel
          .listen(".member.activity.updated", handleMemberActivity)
          .listen(".member.balance.updated", (payload: unknown) => {
            reconcileWallet(payload);
          })
          .error((err: unknown) => {
            console.error("[echo:private] subscription error", err);
          });

        await sendHeartbeat();
        heartbeatRef.current = setInterval(() => {
          void sendHeartbeat();
        }, 60_000);
      } catch {
        queueReconcile(0);
      }
    }

    void setupRealtime();

    return () => {
      active = false;
      if (reconcileTimerRef.current) clearTimeout(reconcileTimerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (echoRef.current) {
        if (sharedChannelRef.current) {
          echoRef.current.leave(sharedChannelRef.current);
          sharedChannelRef.current = null;
        }
        if (privateChannelRef.current) {
          echoRef.current.leave(privateChannelRef.current);
          privateChannelRef.current = null;
        }
        echoRef.current.disconnect();
        echoRef.current = null;
      }
    };
  }, [user.id]);

  async function refreshBalance() {
    try {
      const res = await fetch("/api/balance", { cache: "no-store", credentials: "same-origin" });
      const json = await res.json();
      if (json?.success === false) return;

      const profile = (json?.profile ?? json?.data ?? json) as Record<string, unknown>;
      setCurrentUser((prev) => ({
        ...prev,
        balance: toNumber(profile.balance, prev.balance),
        diamond: toNumber(profile.diamond, prev.diamond),
      }));
    } catch {}
  }

  function setWallet(next: Partial<WalletState>) {
    setCurrentUser((prev) => ({
      ...prev,
      balance: next.balance ?? prev.balance,
      diamond: next.diamond ?? prev.diamond,
    }));
  }

  return (
    <UserContext.Provider value={{ user: currentUser, refreshBalance, setWallet }}>
      {children}
    </UserContext.Provider>
  );
}
