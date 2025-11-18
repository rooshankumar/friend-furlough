import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, AlertCircle, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from '@/components/DarkModeToggle';

const SafetyPage = () => {
  return (
    <div className="min-h-screen md:ml-16 bg-background pb-16 md:pb-0">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild className="gap-2">
              <Link to="/" className="flex items-center">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
            </Button>
            <div className="flex items-center space-x-2 flex-1 justify-center">
              <Shield className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-foreground text-sm md:text-base">Safety</span>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Safety & Community Guidelines</h1>
          
          <p className="text-muted-foreground mb-8">
            <strong>Last updated:</strong> November 12, 2024<br />
            <strong>Effective date:</strong> November 12, 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Our Commitment to Safety</h2>
            <p className="mb-4 text-foreground">
              At roshLingua, your safety and well-being are our top priorities. We are committed to maintaining a safe, respectful, and inclusive community where cultural exchange and language learning can flourish.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Community Standards</h2>
            
            <h3 className="text-xl font-medium mb-3 text-foreground">2.1 Respect and Inclusivity</h3>
            <p className="mb-4 text-foreground">
              We expect all members to treat each other with respect and dignity. Discrimination, harassment, or hate speech based on race, ethnicity, gender, religion, sexual orientation, or any other characteristic is strictly prohibited.
            </p>

            <h3 className="text-xl font-medium mb-3 text-foreground">2.2 Appropriate Content</h3>
            <p className="mb-4 text-foreground">
              All content shared on roshLingua must be appropriate and respectful. We prohibit explicit sexual content, violence, illegal activities, and any content that violates our community standards.
            </p>

            <h3 className="text-xl font-medium mb-3 text-foreground">2.3 Privacy and Consent</h3>
            <p className="mb-4 text-foreground">
              Respect the privacy of other users. Do not share personal information without consent, and do not engage in stalking or harassment of any kind.
            </p>

            <h3 className="text-xl font-medium mb-3 text-foreground">2.4 Authentic Interactions</h3>
            <p className="mb-4 text-foreground">
              Be authentic in your interactions. Do not impersonate others, create fake profiles, or engage in deceptive practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Safety Features</h2>
            
            <div className="bg-card p-6 rounded-lg border mb-4">
              <div className="flex items-start space-x-3">
                <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Verified Profiles</h4>
                  <p className="text-muted-foreground">We verify user information to ensure authenticity and reduce the risk of fraud.</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Reporting Tools</h4>
                  <p className="text-muted-foreground">Users can easily report inappropriate behavior or content. Our moderation team reviews all reports promptly.</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border mb-4">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">24/7 Moderation</h4>
                  <p className="text-muted-foreground">Our dedicated moderation team monitors the platform 24/7 to ensure community safety.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Reporting Violations</h2>
            <p className="mb-4 text-foreground">
              If you encounter any behavior or content that violates our community standards, please report it immediately. You can:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground">
              <li>Use the report button on any post or message</li>
              <li>Contact our support team at <a href="mailto:roshlingua@gmail.com" className="text-primary hover:underline">roshlingua@gmail.com</a></li>
              <li>Use the in-app reporting feature in your profile settings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Consequences of Violations</h2>
            <p className="mb-4 text-foreground">
              Violations of our community standards may result in:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground">
              <li>Warning or temporary suspension</li>
              <li>Content removal</li>
              <li>Permanent account termination</li>
              <li>Legal action if necessary</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Contact Us</h2>
            <p className="mb-4 text-foreground">
              If you have any questions about our Safety Guidelines, please contact us at:
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

export default SafetyPage;
