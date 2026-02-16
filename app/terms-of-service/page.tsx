export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
      <h1 className="text-2xl md:text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-gray-600">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using PPR Academy ("Service"), you accept and agree to be bound by 
            the terms and provision of this agreement. If you do not agree to abide by the above, 
            please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
          <p>
            PPR Academy provides educational content, courses, and social media automation tools 
            for content creators and music producers. Our services include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Online courses and educational content</li>
            <li>Social media scheduling and automation tools</li>
            <li>Community features and creator resources</li>
            <li>Analytics and performance tracking</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Account Registration</h3>
            <p>
              You must provide accurate and complete information when creating an account. 
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>

            <h3 className="text-xl font-medium">Account Responsibilities</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintain accurate account information</li>
              <li>Protect your login credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Comply with all platform rules and social media platform terms</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Social Media Automation</h2>
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Automation Features</h3>
            <p>
              Our social media automation tools allow you to automatically respond to comments and 
              messages on connected platforms. By using these features, you agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for all automated messages sent from your accounts</li>
              <li>You will comply with all social media platform policies and terms</li>
              <li>You will not use automation for spam, harassment, or illegal activities</li>
              <li>You understand that automation uses your connected social media accounts</li>
            </ul>

            <h3 className="text-xl font-medium">Platform Compliance</h3>
            <p>
              You agree to comply with all terms of service and community guidelines of connected 
              social media platforms including Instagram, Facebook, Twitter, and others.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Payments and Subscriptions</h2>
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Billing</h3>
            <p>
              Subscription fees are billed in advance and are non-refundable except as required by law. 
              Prices may change with notice.
            </p>

            <h3 className="text-xl font-medium">Cancellation</h3>
            <p>
              You may cancel your subscription at any time. Cancellation will be effective at the 
              end of your current billing period.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Content and Intellectual Property</h2>
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Our Content</h3>
            <p>
              All course materials, platform features, and proprietary content are owned by 
              PPR Academy and protected by intellectual property laws.
            </p>

            <h3 className="text-xl font-medium">User Content</h3>
            <p>
              You retain ownership of content you create or upload. You grant us a license to use, 
              display, and distribute your content as necessary to provide our services.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Prohibited Uses</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the service for any unlawful purpose or illegal activity</li>
            <li>Spam, harass, or abuse other users or third parties</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Reverse engineer or copy our proprietary features</li>
            <li>Use automation to violate social media platform policies</li>
            <li>Share account credentials with others</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Service Availability</h2>
          <p>
            We strive to maintain high service availability but do not guarantee uninterrupted access. 
            We may temporarily suspend service for maintenance, updates, or security reasons.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
          <p>
            PPR Academy shall not be liable for any indirect, incidental, special, or consequential 
            damages resulting from your use of the service, including but not limited to loss of 
            profits, data, or business opportunities.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice, if you 
            breach these terms or engage in activities that harm our platform or other users.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Social Media Platform Integration</h2>
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Third-Party Platforms</h3>
            <p>
              Our automation features integrate with third-party social media platforms. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>These platforms have their own terms of service and privacy policies</li>
              <li>We are not responsible for changes to third-party platform policies</li>
              <li>Integration features may be modified or discontinued based on platform changes</li>
              <li>You are solely responsible for compliance with platform-specific rules</li>
            </ul>

            <h3 className="text-xl font-medium">Data Processing</h3>
            <p>
              When using automation features, we process social media data to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Monitor for keyword triggers in comments and messages</li>
              <li>Send automated responses through your connected accounts</li>
              <li>Track automation performance and analytics</li>
              <li>Ensure compliance with rate limits and platform policies</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Changes will be effective 
            immediately upon posting. Your continued use of the service constitutes acceptance 
            of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
          <p>
            These terms shall be interpreted and governed in accordance with the laws of the 
            jurisdiction where PPR Academy operates.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">14. Contact Information</h2>
          <p>
            For questions about these terms of service, please contact us at:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <p>Email: legal@pauseplayrepeat.com</p>
            <p>Address: PPR Academy, LLC</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">15. Severability</h2>
          <p>
            If any part of these terms is held invalid or unenforceable, that portion will be 
            construed consistent with applicable law, and the remaining portions will remain 
            in full force and effect.
          </p>
        </section>
      </div>
    </div>
  );
}
