import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from '@/components/DarkModeToggle';

const CookiesPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Cookie className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Cookies Policy</span>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Cookies Policy</h1>
          
          <p className="text-muted-foreground mb-8">
            <strong>Last updated:</strong> November 12, 2024<br />
            <strong>Effective date:</strong> November 12, 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. What Are Cookies?</h2>
            <p className="mb-4 text-foreground">
              Cookies are small text files that are stored on your device when you visit our website or use our application. They help us remember your preferences and improve your experience on roshLingua.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-medium mb-3 text-foreground">2.1 Essential Cookies</h3>
            <p className="mb-4 text-foreground">
              These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas.
            </p>

            <h3 className="text-xl font-medium mb-3 text-foreground">2.2 Performance Cookies</h3>
            <p className="mb-4 text-foreground">
              These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
            </p>

            <h3 className="text-xl font-medium mb-3 text-foreground">2.3 Functional Cookies</h3>
            <p className="mb-4 text-foreground">
              These cookies enable enhanced functionality and personalization, such as remembering your language preferences and theme settings.
            </p>

            <h3 className="text-xl font-medium mb-3 text-foreground">2.4 Targeting Cookies</h3>
            <p className="mb-4 text-foreground">
              These cookies may be set by our advertising partners to build a profile of your interests and show you relevant advertisements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How to Control Cookies</h2>
            <p className="mb-4 text-foreground">
              You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust some preferences every time you visit our site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Contact Us</h2>
            <p className="mb-4 text-foreground">
              If you have any questions about our Cookies Policy, please contact us at:
            </p>
            <p className="text-foreground">
              Email: <a href="mailto:roshlingua@gmail.com" className="text-primary hover:underline">roshlingua@gmail.com</a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CookiesPolicy;
