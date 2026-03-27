import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";

const SW_URL = `${import.meta.env.BASE_URL}sw.js`;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: import.meta.env.BASE_URL });
    return reg;
  } catch (err) {
    console.error("SW registration failed:", err);
    return null;
  }
}

async function getVapidKey(): Promise<string> {
  const res = await fetch(`${import.meta.env.BASE_URL}api/push/vapid-key`);
  const data = await res.json();
  return data.publicKey as string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<boolean> {
  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) return true;

    const vapidKey = await getVapidKey();
    if (!vapidKey) return false;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    });

    const res = await fetch(`${import.meta.env.BASE_URL}api/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("occ_token") ?? ""}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))),
        },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Push subscribe error:", err);
    return false;
  }
}

export async function requestAndSubscribePush(): Promise<"granted" | "denied" | "unsupported"> {
  if (!("Notification" in window) || !("PushManager" in window)) return "unsupported";

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") return "denied";

  const reg = await registerServiceWorker();
  if (reg) {
    await subscribeToPush(reg);
  }
  return "granted";
}

export function usePushNotifications() {
  const { user } = useAuth();
  const subscribed = useRef(false);

  useEffect(() => {
    if (!user || subscribed.current) return;
    subscribed.current = true;

    navigator.serviceWorker?.addEventListener("message", (event) => {
      if (event.data?.type === "navigate") {
        const base = import.meta.env.BASE_URL.replace(/\/$/, "");
        window.location.href = base + (event.data.url ?? "/");
      }
    });

    const alreadyAsked = localStorage.getItem("occ_push_asked");
    if (alreadyAsked === "true" && Notification.permission === "granted") {
      registerServiceWorker().then((reg) => {
        if (reg) subscribeToPush(reg);
      });
    }
  }, [user]);
}
