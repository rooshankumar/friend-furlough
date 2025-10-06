import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
      {/* Mobile Banner - Bottom */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-gradient-cultural text-white p-4 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="font-semibold text-sm">Install roshLingua</p>
            <p className="text-xs opacity-90">Get the full app experience</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleInstallClick}
              size="sm"
              variant="secondary"
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Install
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Banner - Top Right */}
      <div className="hidden md:block fixed top-4 right-4 z-40 bg-card border border-border shadow-lg rounded-lg p-4 max-w-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Download className="h-5 w-5 text-primary" />
              <p className="font-semibold">Install roshLingua</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Install our app for a better experience with offline access and quick launch.
            </p>
          </div>
          <Button
            onClick={handleDismiss}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleInstallClick}
          className="w-full mt-3"
          variant="cultural"
        >
          <Download className="h-4 w-4 mr-2" />
          Install App
        </Button>
      </div>
    </>
  );
};

export default InstallPWA;
