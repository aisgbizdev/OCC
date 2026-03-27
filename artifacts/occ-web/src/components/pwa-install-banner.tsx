import { useState, useEffect } from "react";
import { X, Download, Bell } from "lucide-react";
import { requestAndSubscribePush } from "@/hooks/use-push-notifications";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const installDismissed = localStorage.getItem("occ_install_dismissed");
    const pushAsked = localStorage.getItem("occ_push_asked");

    if (!pushAsked && "Notification" in window && Notification.permission === "default") {
      setShowPush(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      if (!installDismissed) setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setShowInstall(false);
      localStorage.setItem("occ_install_dismissed", "true");
    }
  };

  const handleDismissInstall = () => {
    setShowInstall(false);
    localStorage.setItem("occ_install_dismissed", "true");
  };

  const handleEnablePush = async () => {
    localStorage.setItem("occ_push_asked", "true");
    await requestAndSubscribePush();
    setShowPush(false);
  };

  const handleDismissPush = () => {
    localStorage.setItem("occ_push_asked", "dismissed");
    setShowPush(false);
  };

  if (dismissed || (!showInstall && !showPush)) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 space-y-2">
      {showPush && (
        <div className="bg-card border border-primary/20 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Aktifkan Notifikasi Push</p>
              <p className="text-xs text-muted-foreground mt-0.5">Dapatkan alert komplain, tugas, dan inaktivitas dealer langsung ke HP Anda.</p>
            </div>
            <button onClick={handleDismissPush} className="text-muted-foreground hover:text-foreground p-1 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnablePush}
              className="flex-1 bg-primary text-primary-foreground text-xs font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Aktifkan
            </button>
            <button
              onClick={handleDismissPush}
              className="flex-1 text-xs font-medium py-2 rounded-lg border hover:bg-muted transition-colors"
            >
              Nanti
            </button>
          </div>
        </div>
      )}

      {showInstall && (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Install OCC</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tambahkan OCC ke homescreen untuk akses cepat seperti aplikasi native.</p>
            </div>
            <button onClick={handleDismissInstall} className="text-muted-foreground hover:text-foreground p-1 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-primary text-primary-foreground text-xs font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Install Sekarang
            </button>
            <button
              onClick={handleDismissInstall}
              className="flex-1 text-xs font-medium py-2 rounded-lg border hover:bg-muted transition-colors"
            >
              Lewati
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
