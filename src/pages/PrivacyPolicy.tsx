import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from '@/components/DarkModeToggle';

const PrivacyPolicy = () => {
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
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Privacy Policy</span>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Privacy Policy</h1>
          
          <p className="text-muted-foreground mb-8">
            <strong>Last updated:</strong> November 12, 2024<br />
            <strong>Effective date:</strong> November 12, 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to RoshLingua ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our cultural exchange and language learning platform.
            </p>
            <p className="mb-4">
              <strong>Contact Information:</strong><br />
              Email: <a href="mailto:roshlingua@gmail.com" className="text-primary hover:underline">roshlingua@gmail.com</a><br />
              Website: www.roshlingua.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3">2.1 Personal Information</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Name and profile information</li>
              <li>Email address</li>
              <li>Country and city of residence</li>
              <li>Languages you speak and want to learn</li>
              <li>Cultural interests and preferences</li>
              <li>Profile photos and shared content</li>
              <li>Age (for safety and compliance purposes)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.2 Communication Data</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Messages sent through our platform</li>
              <li>Community posts and comments</li>
              <li>Photos and media shared in conversations</li>
              <li>Voice messages (if applicable)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.3 Technical Information</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Device information and operating system</li>
              <li>IP address and location data (approximate)</li>
              <li>Usage patterns and app interactions</li>
              <li>Performance and error logs</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Platform Services:</strong> To provide cultural exchange and language learning features</li>
              <li><strong>Matching:</strong> To connect you with compatible language partners</li>
              <li><strong>Safety:</strong> To moderate content and ensure community safety</li>
              <li><strong>Communication:</strong> To send important updates and notifications</li>
              <li><strong>Improvement:</strong> To enhance our services and user experience</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-medium mb-3">4.1 With Other Users</h3>
            <p className="mb-4">
              Your profile information, posts, and messages are shared with other users as part of the cultural exchange experience. You control what information to share in your profile.
            </p>

            <h3 className="text-xl font-medium mb-3">4.2 Service Providers</h3>
            <p className="mb-4">
              We may share information with trusted third-party service providers who help us operate our platform, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Cloud hosting and database services (Supabase)</li>
              <li>Content delivery networks</li>
              <li>Analytics and performance monitoring</li>
              <li>Customer support tools</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">4.3 Legal Requirements</h3>
            <p className="mb-4">
              We may disclose your information if required by law, court order, or to protect the rights, property, or safety of RoshLingua, our users, or others.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Content moderation and AI safety systems</li>
              <li>Secure cloud infrastructure</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights and Choices</h2>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct your information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Export your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Restriction:</strong> Request limitation of processing</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, contact us at <a href="mailto:roshlingua@gmail.com" className="text-primary hover:underline">roshlingua@gmail.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. International Data Transfers</h2>
            <p className="mb-4">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="mb-4">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Data Retention</h2>
            <p className="mb-4">
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of our service after such changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us:
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
              This Privacy Policy is part of our commitment to protecting your privacy and building trust in our platform.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
