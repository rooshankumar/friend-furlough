import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from '@/components/DarkModeToggle';

const TermsOfService = () => {
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
              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-foreground text-sm md:text-base">Terms of Service</span>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 md:px-8 py-6 md:py-8 max-w-4xl mx-auto">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Terms of Service</h1>
          
          <p className="text-muted-foreground mb-8">
            <strong>Last updated:</strong> November 12, 2024<br />
            <strong>Effective date:</strong> November 12, 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              Welcome to RoshLingua, a cultural exchange and language learning platform. By accessing or using our service, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our service.
            </p>
            <p className="mb-4">
              <strong>Contact Information:</strong><br />
              Email: <a href="mailto:roshlingua@gmail.com" className="text-primary hover:underline">roshlingua@gmail.com</a><br />
              Website: www.roshlingua.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              RoshLingua is a platform that connects people from different cultures for language exchange and cultural learning. Our service includes:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>User profiles and matching system</li>
              <li>Real-time messaging and communication tools</li>
              <li>Community features and cultural sharing</li>
              <li>Language learning resources and tools</li>
              <li>Safety and moderation features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Eligibility</h2>
            <p className="mb-4">
              To use RoshLingua, you must:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Be at least 13 years old (or the minimum age in your jurisdiction)</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Not be prohibited from using our service under applicable law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. User Accounts</h2>
            <h3 className="text-xl font-medium mb-3">4.1 Account Creation</h3>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
            
            <h3 className="text-xl font-medium mb-3">4.2 Account Information</h3>
            <p className="mb-4">
              You agree to provide accurate, current, and complete information and to update such information as necessary to maintain its accuracy.
            </p>
            
            <h3 className="text-xl font-medium mb-3">4.3 Account Security</h3>
            <p className="mb-4">
              You must immediately notify us of any unauthorized use of your account or any other breach of security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use Policy</h2>
            <h3 className="text-xl font-medium mb-3">5.1 Permitted Uses</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Cultural exchange and language learning</li>
              <li>Respectful communication with other users</li>
              <li>Sharing appropriate cultural content</li>
              <li>Participating in community activities</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">5.2 Prohibited Activities</h3>
            <p className="mb-4">You agree NOT to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Harass, abuse, or harm other users</li>
              <li>Share inappropriate, offensive, or illegal content</li>
              <li>Impersonate others or create fake profiles</li>
              <li>Spam or send unsolicited messages</li>
              <li>Use the platform for commercial purposes without permission</li>
              <li>Attempt to hack, disrupt, or damage our systems</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Share personal contact information publicly</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Content and Intellectual Property</h2>
            <h3 className="text-xl font-medium mb-3">6.1 User Content</h3>
            <p className="mb-4">
              You retain ownership of content you create and share on RoshLingua. By posting content, you grant us a license to use, display, and distribute your content on our platform.
            </p>
            
            <h3 className="text-xl font-medium mb-3">6.2 Platform Content</h3>
            <p className="mb-4">
              All platform features, design, and functionality are owned by RoshLingua and protected by intellectual property laws.
            </p>
            
            <h3 className="text-xl font-medium mb-3">6.3 Content Moderation</h3>
            <p className="mb-4">
              We reserve the right to review, moderate, or remove content that violates these Terms or our Community Guidelines.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Privacy and Data Protection</h2>
            <p className="mb-4">
              Your privacy is important to us. Please review our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> to understand how we collect, use, and protect your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Safety and Community Guidelines</h2>
            <p className="mb-4">
              RoshLingua is committed to providing a safe environment for cultural exchange. We employ:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>AI-powered content moderation</li>
              <li>User reporting and blocking features</li>
              <li>Community guidelines enforcement</li>
              <li>24/7 safety monitoring</li>
              <li>Age-appropriate content filtering</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <h3 className="text-xl font-medium mb-3">9.1 Termination by You</h3>
            <p className="mb-4">
              You may terminate your account at any time by contacting us or using the account deletion feature.
            </p>
            
            <h3 className="text-xl font-medium mb-3">9.2 Termination by Us</h3>
            <p className="mb-4">
              We may suspend or terminate your account if you violate these Terms, engage in harmful behavior, or for other legitimate reasons.
            </p>
            
            <h3 className="text-xl font-medium mb-3">9.3 Effect of Termination</h3>
            <p className="mb-4">
              Upon termination, your access to the service will cease, and we may delete your account and data in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Disclaimers and Limitations</h2>
            <h3 className="text-xl font-medium mb-3">10.1 Service Availability</h3>
            <p className="mb-4">
              We strive to provide reliable service but cannot guarantee uninterrupted access or error-free operation.
            </p>
            
            <h3 className="text-xl font-medium mb-3">10.2 User Interactions</h3>
            <p className="mb-4">
              We are not responsible for the actions or behavior of other users. Use caution when interacting with others online.
            </p>
            
            <h3 className="text-xl font-medium mb-3">10.3 Third-Party Content</h3>
            <p className="mb-4">
              We are not responsible for third-party content, links, or services accessed through our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
            <p className="mb-4">
              To the fullest extent permitted by law, RoshLingua shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law and Disputes</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with applicable laws. Any disputes will be resolved through good faith negotiation or appropriate legal channels.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
            <p className="mb-4">
              We may modify these Terms from time to time. We will notify users of material changes and obtain consent where required by law. Continued use of our service constitutes acceptance of updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
            <p className="mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Mail className="h-5 w-5 text-primary" />
                <strong>Email:</strong>
                <a href="mailto:roshlingua@gmail.com" className="text-primary hover:underline">
                  roshlingua@gmail.com
                </a>
              </div>
              <p className="text-gray-600">
                We will respond to your inquiry within 48 hours.
              </p>
            </div>
          </section>

          <div className="border-t pt-8 mt-12">
            <p className="text-center text-gray-600">
              By using RoshLingua, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
