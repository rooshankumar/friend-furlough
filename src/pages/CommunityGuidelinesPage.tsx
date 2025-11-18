import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Heart, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from '@/components/DarkModeToggle';

const CommunityGuidelinesPage = () => {
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
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Community Guidelines</span>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Community Guidelines</h1>
          
          <p className="text-muted-foreground mb-8">
            <strong>Last updated:</strong> November 12, 2024<br />
            <strong>Effective date:</strong> November 12, 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Our Community Values</h2>
            <p className="mb-4 text-foreground">
              roshLingua is built on the foundation of cultural respect, mutual learning, and authentic human connection. These guidelines help us maintain a vibrant, safe, and welcoming community for everyone.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Be Respectful</h2>
            
            <div className="bg-card p-6 rounded-lg border mb-4">
              <div className="flex items-start space-x-3">
                <Heart className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Treat Everyone with Dignity</h4>
                  <p className="text-muted-foreground">Respect cultural differences, beliefs, and perspectives. Celebrate diversity as a strength of our community.</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">No Harassment or Discrimination</h4>
                  <p className="text-muted-foreground">Do not engage in harassment, bullying, or discrimination based on race, ethnicity, gender, religion, sexual orientation, or any other characteristic.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Keep It Appropriate</h2>
            
            <h3 className="text-xl font-medium mb-3 text-foreground">2.1 Content Standards</h3>
            <ul className="list-disc pl-6 mb-4 text-foreground">
              <li>No explicit sexual content or nudity</li>
              <li>No graphic violence or gore</li>
              <li>No promotion of illegal activities</li>
              <li>No hate speech or extremist content</li>
              <li>No spam or commercial advertising</li>
              <li>No misinformation or false information</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 text-foreground">2.2 Language</h3>
            <p className="mb-4 text-foreground">
              While we celebrate language learning, excessive profanity or offensive language is not permitted. Remember that our community includes people of all ages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Be Authentic</h2>
            
            <div className="bg-card p-6 rounded-lg border mb-4">
              <div className="flex items-start space-x-3">
                <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Genuine Profiles</h4>
                  <p className="text-muted-foreground">Use your real name and authentic information. Do not impersonate others or create fake profiles.</p>
                </div>
              </div>
            </div>

            <p className="mb-4 text-foreground">
              Authentic interactions build trust and create meaningful connections. Be yourself and encourage others to do the same.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Respect Privacy</h2>
            <ul className="list-disc pl-6 mb-4 text-foreground">
              <li>Do not share personal information without consent</li>
              <li>Do not screenshot or share private conversations</li>
              <li>Do not engage in stalking or unwanted contact</li>
              <li>Respect others' boundaries and preferences</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Contribute Positively</h2>
            <ul className="list-disc pl-6 mb-4 text-foreground">
              <li>Share knowledge and help others learn</li>
              <li>Provide constructive feedback</li>
              <li>Celebrate others' progress and achievements</li>
              <li>Participate in cultural exchange respectfully</li>
              <li>Report violations to help keep the community safe</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Intellectual Property</h2>
            <p className="mb-4 text-foreground">
              Respect intellectual property rights. Do not share copyrighted content without permission. Give credit to creators and authors.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Consequences of Violations</h2>
            <p className="mb-4 text-foreground">
              We take violations seriously. Depending on the severity and frequency, consequences may include:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground">
              <li>Warning or temporary suspension</li>
              <li>Content removal or editing</li>
              <li>Permanent account termination</li>
              <li>Legal action if necessary</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Reporting Violations</h2>
            <p className="mb-4 text-foreground">
              If you encounter content or behavior that violates these guidelines, please report it immediately:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground">
              <li>Use the report button on posts or messages</li>
              <li>Contact our support team at <a href="mailto:roshlingua@gmail.com" className="text-primary hover:underline">roshlingua@gmail.com</a></li>
              <li>Use the in-app reporting feature</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Contact Us</h2>
            <p className="mb-4 text-foreground">
              Questions about our Community Guidelines? Reach out to us:
            </p>
            <p className="text-foreground">
              Email: <a href="mailto:roshlingua@gmail.com" className="text-primary hover:underline">roshlingua@gmail.com</a>
            </p>
          </section>

          <div className="bg-primary/10 p-6 rounded-lg border border-primary/20 mt-8">
            <p className="text-foreground">
              <strong>Together, we create a community where cultural exchange thrives and everyone feels safe, respected, and valued. Thank you for being part of roshLingua! 🌍</strong>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommunityGuidelinesPage;
