import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const STORAGE_KEY = "casa-dos-20-usage-count";
const DISMISSED_KEY = "casa-dos-20-paywall-dismissed";
const THRESHOLD = 3;

function getCount(): number {
  try { return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10) || 0; }
  catch { return 0; }
}

function setCount(n: number) {
  try { localStorage.setItem(STORAGE_KEY, String(n)); } catch {}
}

function getDismissedAt(): number {
  try { return parseInt(localStorage.getItem(DISMISSED_KEY) || "0", 10) || 0; }
  catch { return 0; }
}

export function useTrialActivation() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // Conditions where we should never show the modal
  const shouldSkip =
    !user ||
    user.hasPremium ||
    user.role === "admin" ||
    !!user.trialEndsAt; // already used trial (expired or active)

  // Track a meaningful action and potentially trigger the paywall
  const trackAction = useCallback(() => {
    if (shouldSkip) return;
    const count = getCount() + 1;
    setCount(count);
    if (count >= THRESHOLD) {
      // Only show again if it's been more than 12h since last dismissal
      const dismissed = getDismissedAt();
      const twelveHours = 12 * 60 * 60 * 1000;
      if (!dismissed || Date.now() - dismissed > twelveHours) {
        setShowModal(true);
        apiRequest("POST", "/api/trial/paywall-event", { event: "paywall_viewed" }).catch(() => {});
      }
    }
  }, [shouldSkip]);

  // Trigger paywall immediately (e.g., when hitting the free limit)
  const triggerPaywall = useCallback(() => {
    if (shouldSkip) return;
    const dismissed = getDismissedAt();
    const sixHours = 6 * 60 * 60 * 1000;
    if (!dismissed || Date.now() - dismissed > sixHours) {
      setShowModal(true);
      apiRequest("POST", "/api/trial/paywall-event", { event: "paywall_viewed" }).catch(() => {});
    }
  }, [shouldSkip]);

  const dismiss = useCallback(() => {
    setShowModal(false);
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())); } catch {}
  }, []);

  const activate = useCallback(async () => {
    if (isActivating) return;
    setIsActivating(true);
    try {
      apiRequest("POST", "/api/trial/paywall-event", { event: "paywall_clicked" }).catch(() => {});
      const res = await apiRequest("POST", "/api/trial/activate");
      if (!res.ok) throw new Error("Erro ao ativar");
      const data = await res.json();
      // Update auth cache with new trial data
      queryClient.setQueryData(["/api/auth/me"], (old: any) => ({
        ...old,
        hasPremium: data.hasPremium,
        premiumReason: data.premiumReason,
        trialEndsAt: data.trialEndsAt,
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setShowModal(false);
      // Reset usage count
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    } catch {
      // ignore — modal stays open
    } finally {
      setIsActivating(false);
    }
  }, [isActivating]);

  return { showModal, trackAction, triggerPaywall, dismiss, activate, isActivating };
}
