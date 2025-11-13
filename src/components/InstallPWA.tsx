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
      {/* Compact Bottom Banner for PWA Install */}
      <div 
        className="fixed inset-0 z-[60] bg-transparent"
        onClick={handleDismiss}
      >
        <div 
          className="fixed bottom-4 left-4 right-4 z-[61] bg-background/95 backdrop-blur-md border border-border rounded-xl shadow-lg animate-in slide-in-from-bottom-2 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 p-4">
            {/* App Icon */}
            <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center shadow-sm border border-border flex-shrink-0">
              <img src={roshLinguaLogo} alt="roshLingua" className="h-8 w-8" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                Install roshLingua
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                Get the full app experience
              </p>
            </div>

            {/* Install Button */}
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white text-xs px-3 py-1.5 h-auto flex-shrink-0"
            >
              <Download className="h-3 w-3 mr-1" />
              Install
            </Button>

            {/* Close Button */}
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:bg-muted rounded-full w-6 h-6 p-0 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InstallPWA;
