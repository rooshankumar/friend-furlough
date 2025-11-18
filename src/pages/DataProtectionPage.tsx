import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Database, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from '@/components/DarkModeToggle';

const DataProtectionPage = () => {
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
              <Lock className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-foreground text-sm md:text-base">Data Protection</span>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Data Protection</h1>
          
          <p className="text-muted-foreground mb-8">
            <strong>Last updated:</strong> November 12, 2024<br />
            <strong>Effective date:</strong> November 12, 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Data Protection Principles</h2>
            <p className="mb-4 text-foreground">
              roshLingua is committed to protecting your personal data in accordance with applicable data protection laws, including GDPR and other international regulations. We follow these core principles:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground">
              <li><strong>Lawfulness:</strong> We only process data with a valid legal basis</li>
              <li><strong>Fairness:</strong> We are transparent about how we use your data</li>
              <li><strong>Minimization:</strong> We collect only the data we need</li>
              <li><strong>Accuracy:</strong> We keep your data accurate and up-to-date</li>
              <li><strong>Security:</strong> We protect your data from unauthorized access</li>
              <li><strong>Accountability:</strong> We are responsible for our data practices</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Your Data Rights</h2>
            
            <h3 className="text-xl font-medium mb-3 text-foreground">2.1 Right to Access</h3>
            <p className="mb-4 text-foreground">
              You have the right to request access to your personal data and receive a copy of the information we hold about you.
            </p>

            <h3 className="text-xl font-medium mb-3 text-foreground">2.2 Right to Rectification</h3>
            <p className="mb-4 text-foreground">
              You can request that we correct any inaccurate or incomplete personal data.
            </p>

            <h3 className="text-xl font-medium mb-3 text-foreground">2.3 Right to Erasure</h3>
            <p className="mb-4 text-foreground">
              You can request deletion of your personal data, subject to certain legal exceptions.
            </p>

            <h3 className="text-xl font-medium mb-3 text-foreground">2.4 Right to Data Portability</h3>
            <p className="mb-4 text-foreground">
              You can request your data in a structured, commonly used format and have it transferred to another service.
            </p>

            <h3 className="text-xl font-medium mb-3 text-foreground">2.5 Right to Object</h3>
            <p className="mb-4 text-foreground">
              You can object to certain types of data processing, including marketing communications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Data Security Measures</h2>
            
            <div className="bg-card p-6 rounded-lg border mb-4">
              <div className="flex items-start space-x-3">
                <Database className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Encryption</h4>
                  <p className="text-muted-foreground">All data is encrypted in transit (TLS/SSL) and at rest using industry-standard encryption protocols.</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border mb-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Access Controls</h4>
                  <p className="text-muted-foreground">We implement strict access controls and authentication mechanisms to prevent unauthorized access to your data.</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border mb-4">
              <div className="flex items-start space-x-3">
                <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Regular Audits</h4>
                  <p className="text-muted-foreground">We conduct regular security audits and penetration testing to identify and address vulnerabilities.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Data Retention</h2>
            <p className="mb-4 text-foreground">
              We retain your personal data only for as long as necessary to provide our services and comply with legal obligations. When you delete your account, we securely delete your data within 30 days, except where we are required to retain it by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. International Data Transfers</h2>
            <p className="mb-4 text-foreground">
              If we transfer your data internationally, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses or adequacy decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Data Protection Officer</h2>
            <p className="mb-4 text-foreground">
              For data protection inquiries or to exercise your rights, please contact our Data Protection Officer:
            </p>
            <p className="text-foreground">
              Email: <a href="mailto:roshlingua@gmail.com" className="text-primary hover:underline">roshlingua@gmail.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Changes to This Policy</h2>
            <p className="mb-4 text-foreground">
              We may update this Data Protection policy from time to time. We will notify you of any significant changes via email or through our platform.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DataProtectionPage;
