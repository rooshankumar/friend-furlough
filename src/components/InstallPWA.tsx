import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import roshLinguaLogo from "@/assets/roshlingua-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show install banner
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Installation not available",
        description: "This app is either already installed or your browser doesn't support installation.",
        variant: "default"
      });
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast({
        title: "App installed!",
        description: "roshLingua has been added to your home screen.",
      });
    }

    // Clear the deferredPrompt for reuse
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Check if user dismissed recently (within 7 days)
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDaysInMs) {
        setShowInstallBanner(false);
      }
    }
  }, []);

  if (!showInstallBanner) {
    return null;
  }

  return (
    <>
      {/* Centered Modal for PWA Install */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border-b border-border p-6 text-center">
            <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-border">
              <img src={roshLinguaLogo} alt="roshLingua" className="h-16 w-16" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">Install roshLingua</h2>
            <p className="text-muted-foreground text-sm">Get the full app experience</p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                  <span className="text-success text-sm">✓</span>
                </div>
                <span className="text-foreground">Offline access to conversations</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                  <span className="text-success text-sm">✓</span>
                </div>
                <span className="text-foreground">Quick launch from home screen</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                  <span className="text-success text-sm">✓</span>
                </div>
                <span className="text-foreground">Native app-like experience</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                  <span className="text-success text-sm">✓</span>
                </div>
                <span className="text-foreground">Push notifications (coming soon)</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleInstallClick}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3"
              >
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                className="flex-1 py-3"
              >
                Maybe Later
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Free to install • No registration required
            </p>
          </div>

          {/* Close button */}
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-muted-foreground hover:bg-muted rounded-full w-8 h-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default InstallPWA;
