"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/Toast";

interface LottoPackage {
  id:        number;
  group_id?: number;
  name:      string;
  image?:    string;
  is_active?: boolean;
}

// Resolve relative image paths like /storage/... to an absolute URL
const API_ORIGIN = (() => {
  const s = process.env.NEXT_PUBLIC_STORAGE_URL ?? "";
  try { return new URL(s).origin; } catch { return ""; }
})();

function resolveImage(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return API_ORIGIN ? `${API_ORIGIN}${path}` : path;
}

interface Props {
  groupId:             number;
  drawId:              number;
  roundId?:            number;
  locale:              string;
  closeAt?:            string;
  labelPlay?:          string;
  labelClosed?:        string;
  labelSelect?:        string;
  labelNoPackage?:     string;
  toastClosedRefresh?: string;
  toastFetchError?:    string;
}

export default function PackageModalButton({
  groupId,
  drawId,
  roundId,
  locale,
  closeAt,
  labelPlay          = "แทงหวย →",
  labelClosed        = "ปิดรับ",
  labelSelect        = "เลือก Package",
  labelNoPackage     = "ไม่พบ Package",
  toastClosedRefresh = "หวยปิดรับแล้ว กำลังรีเฟรชข้อมูล...",
  toastFetchError    = "ไม่สามารถดึงข้อมูล Package ได้",
}: Props) {
  const router = useRouter();
  const [open,      setOpen]      = useState(false);
  const [packages,  setPackages]  = useState<LottoPackage[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [expired,   setExpired]   = useState(false);
  const [toastMsg,  setToastMsg]  = useState<{ text: string; type: "warning" | "error" } | null>(null);
  const playLabel = labelPlay.replace(/\s*→\s*$/g, "").replace(/\s+/g, " ").trim();

  useEffect(() => {
    if (!closeAt) return;
    const check = () => {
      if (new Date(closeAt).getTime() <= Date.now()) setExpired(true);
    };
    check();
    const diff = new Date(closeAt).getTime() - Date.now();
    if (diff <= 0) return;
    const id = setTimeout(() => setExpired(true), diff);
    return () => clearTimeout(id);
  }, [closeAt]);

  async function handleOpen() {
    if (closeAt && new Date(closeAt).getTime() <= Date.now()) {
      setToastMsg({ text: toastClosedRefresh, type: "warning" });
      router.refresh();
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`/api/lotto/groups/${groupId}/packages`);
      const json = await res.json();
      const all: LottoPackage[] = Array.isArray(json?.data) ? json.data : [];
      const active = all.filter((p) => p.is_active !== false);
      if (active.length === 0) {
        setToastMsg({ text: toastFetchError, type: "error" });
        return;
      }
      setPackages(active);
      setOpen(true);
    } catch {
      setToastMsg({ text: toastFetchError, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handlePick(packageId: number) {
    setSelecting(true);
    try {
      const res  = await fetch(`/api/lotto/groups/${groupId}/select-package`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: packageId }),
      });
      const json = await res.json();
      if (!json?.success) {
        const rawMsg = typeof json?.message === "string" ? json.message.trim() : "";
        const displayMsg = rawMsg && !rawMsg.startsWith("{") && !rawMsg.startsWith("[")
          ? rawMsg
          : toastFetchError;
        setToastMsg({ text: displayMsg, type: "error" });
        return;
      }
    } catch {
      setToastMsg({ text: toastFetchError, type: "error" });
      return;
    } finally {
      setSelecting(false);
    }
    setOpen(false);
    const roundPath = roundId != null ? `/${roundId}` : "";
    router.push(`/${locale}/bet/${drawId}${roundPath}/${packageId}`);
  }

  if (expired) {
    return (
      <div className="block w-full text-center bg-ap-red/10 border border-ap-red/20 text-ap-red rounded-full py-2 text-[14px] font-semibold">
        {labelClosed}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={loading}
        className="inline-flex h-[34px] items-center justify-center gap-1.5 whitespace-nowrap w-full bg-gradient-to-r from-[#0066d1] via-[#0a79de] to-[#1895f3] text-white rounded-full px-4 text-[14px] font-bold border border-sky-200/50 hover:brightness-105 transition-all active:scale-95 disabled:opacity-70 shadow-md"
      >
        {loading && (
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
        )}
        <span className="leading-none">{playLabel}</span>
        <svg className="w-3.5 h-3.5 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </button>

      {/* Modal — portal to body to escape parent transform stacking context */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-[16px] font-bold text-ap-primary">{labelSelect}</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-ap-bg flex items-center justify-center text-ap-secondary text-lg leading-none hover:bg-ap-border transition-colors"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {packages.length === 0 ? (
                <div className="text-center py-12 text-ap-tertiary text-[14px]">
                  {labelNoPackage}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => handlePick(pkg.id)}
                      disabled={selecting}
                      className="group w-full rounded-2xl overflow-hidden border border-ap-border hover:border-ap-blue transition-all active:scale-[0.98] shadow-sm disabled:opacity-70"
                    >
                      {resolveImage(pkg.image) ? (
                        <img
                          src={resolveImage(pkg.image)}
                          alt={pkg.name}
                          className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full aspect-[3/4] flex items-center justify-center bg-ap-bg text-[48px]">
                          🎯
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast — portal to body for same reason */}
      {toastMsg && createPortal(
        <Toast
          message={toastMsg.text}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />,
        document.body
      )}
    </>
  );
}
