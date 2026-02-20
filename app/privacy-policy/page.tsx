export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
      <h1 className="text-2xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-gray-600">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Personal Information</h3>
            <p>
              When you use PausePlayRepeat, we may collect personal information including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name and email address</li>
              <li>Profile information and preferences</li>
              <li>Course progress and completion data</li>
              <li>Payment and billing information</li>
            </ul>

            <h3 className="text-xl font-medium">Social Media Integration</h3>
            <p>
              When you connect social media accounts for automation features:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Social media account IDs and usernames</li>
              <li>Public posts and comments for automation triggers</li>
              <li>Direct messages sent through our automation system</li>
              <li>Access tokens (securely encrypted and stored)</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and improve our educational services</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send course updates and important notifications</li>
            <li>Enable social media automation features</li>
            <li>Provide customer support</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Social Media Automation</h2>
          <p>
            Our social media automation features allow you to automatically respond to comments and messages. 
            When you enable these features:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We monitor your connected social media accounts for trigger keywords</li>
            <li>We send automated messages on your behalf using your connected accounts</li>
            <li>All messages are sent from your own social media accounts, not ours</li>
            <li>You maintain full control over message content and automation settings</li>
            <li>You can disable automation at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
          <p>
            We do not sell, rent, or share your personal information with third parties except:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>With your explicit consent</li>
            <li>To comply with legal requirements</li>
            <li>With trusted service providers who help operate our platform</li>
            <li>In connection with a business transfer</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your information:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption of sensitive data in transit and at rest</li>
            <li>Secure access tokens for social media integrations</li>
            <li>Regular security assessments and updates</li>
            <li>Limited access to personal information on a need-to-know basis</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and associated data</li>
            <li>Disconnect social media integrations</li>
            <li>Opt-out of promotional communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to improve your experience, analyze usage, 
            and provide personalized content. You can control cookie preferences through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
          <p>
            Our services are not intended for children under 13. We do not knowingly collect 
            personal information from children under 13 years of age.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any 
            material changes by posting the new policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p>
            If you have questions about this privacy policy, please contact us at:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <p>Email: privacy@pauseplayrepeat.com</p>
            <p>Address: PausePlayRepeat, LLC</p>
          </div>
        </section>
      </div>
    </div>
  );
}
