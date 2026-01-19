export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  category: "welcome" | "sales" | "engagement" | "education" | "transactional";
  description: string;
  body: string;
};

export const prebuiltEmailTemplates: EmailTemplate[] = [
  // WELCOME TEMPLATES
  {
    id: "welcome-producer",
    name: "Welcome New Producer",
    subject: "Welcome to the fam! Let's make some heat",
    category: "welcome",
    description: "Warm welcome for new subscribers who are music producers",
    body: `<p>Hey {{firstName}},</p>

<p>Welcome! I'm hyped you're here.</p>

<p>I'm a music producer just like you, and I've built this community to share everything I've learned about making beats, mixing tracks, and actually finishing music.</p>

<p>Here's what you can expect from me:</p>
<ul>
  <li>Production tips and tutorials</li>
  <li>Free samples and presets</li>
  <li>Behind-the-scenes of my workflow</li>
  <li>Early access to new releases</li>
  <li>Exclusive discounts</li>
</ul>

<p>First things first - hit reply and tell me: <strong>What's your biggest struggle in production right now?</strong></p>

<p>I read every response and it helps me create better content for you.</p>

<p>Let's make some heat,<br>{{creatorName}}</p>`,
  },
  {
    id: "welcome-free-download",
    name: "Free Download Delivery",
    subject: "Your free [download] is ready!",
    category: "welcome",
    description: "Deliver a lead magnet or free resource",
    body: `<p>Hey {{firstName}},</p>

<p>As promised, here's your free download!</p>

<p style="text-align: center; margin: 24px 0;">
<a href="{{downloadUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Download Now</a>
</p>

<p><strong>Pro tip:</strong> Don't just let this sit in your downloads folder. Open your DAW right now and try it out while you're motivated!</p>

<p>I'll be sending you more valuable content over the next few days. Keep an eye on your inbox.</p>

<p>Enjoy!<br>{{creatorName}}</p>`,
  },
  {
    id: "welcome-story",
    name: "My Producer Journey",
    subject: "How I went from bedroom producer to...",
    category: "welcome",
    description: "Share your story to build connection",
    body: `<p>Hey {{firstName}},</p>

<p>I wanted to share a bit about my journey.</p>

<p>I started making beats in my bedroom with nothing but a laptop and some cracked software (don't judge - we've all been there).</p>

<p>For years, I struggled with:</p>
<ul>
  <li>Mixes that sounded muddy and unprofessional</li>
  <li>Hundreds of unfinished projects</li>
  <li>Comparing myself to other producers</li>
  <li>Not knowing if I was even good enough</li>
</ul>

<p>But I kept going. I studied, practiced, failed, and learned.</p>

<p>Now I'm sharing everything I've learned so you can skip the years of trial and error I went through.</p>

<p>What about you? What's your production journey been like so far?</p>

<p>Hit reply - I'd love to hear your story.</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "welcome-resources",
    name: "Best Free Resources",
    subject: "Free resources to level up your production",
    category: "welcome",
    description: "Share your best free content and resources",
    body: `<p>Hey {{firstName}},</p>

<p>I put together some of my best free resources to help you improve your production game.</p>

<p><strong>Check these out:</strong></p>

<p>1. <strong>My Production Checklist</strong><br>
The exact checklist I use before exporting any track.</p>

<p>2. <strong>Mixing Cheat Sheet</strong><br>
EQ and compression starting points for every instrument.</p>

<p>3. <strong>Free Sample Pack</strong><br>
50+ sounds from my personal collection.</p>

<p><a href="{{storeUrl}}">Grab them here (100% free)</a></p>

<p>These are the same resources I wish I had when I was starting out.</p>

<p>Let me know which one helps you the most!</p>

<p>{{creatorName}}</p>`,
  },

  // SALES TEMPLATES
  {
    id: "sales-pack-launch",
    name: "Sample Pack Launch",
    subject: "NEW: [Pack Name] just dropped",
    category: "sales",
    description: "Announce a new sample pack or sound library",
    body: `<p>Hey {{firstName}},</p>

<p>I've been cooking up something special, and it's finally ready.</p>

<p><strong>Introducing [Pack Name]</strong></p>

<p>What's inside:</p>
<ul>
  <li>[X] drum loops and one-shots</li>
  <li>[X] melodic loops</li>
  <li>[X] bass sounds</li>
  <li>[X] FX and transitions</li>
  <li>100% royalty-free</li>
</ul>

<p>Every sound is mixed, processed, and ready to drop straight into your DAW.</p>

<p><strong>Launch special:</strong> 25% off for the next 48 hours.</p>

<p><a href="{{productUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Get the Pack</a></p>

<p>Let's make some heat,<br>{{creatorName}}</p>`,
  },
  {
    id: "sales-course-launch",
    name: "Course Launch",
    subject: "Learn [skill] - New course just dropped",
    category: "sales",
    description: "Announce a new course or tutorial series",
    body: `<p>Hey {{firstName}},</p>

<p>You asked for it, and I delivered.</p>

<p>I just launched a brand new course: <strong>[Course Name]</strong></p>

<p>In this course, you'll learn:</p>
<ul>
  <li>[What they'll learn 1]</li>
  <li>[What they'll learn 2]</li>
  <li>[What they'll learn 3]</li>
  <li>[What they'll learn 4]</li>
</ul>

<p>This isn't just theory - it's the exact process I use in my own productions.</p>

<p><strong>What's included:</strong></p>
<ul>
  <li>[X] video lessons</li>
  <li>Downloadable project files</li>
  <li>Bonus presets/samples</li>
  <li>Lifetime access</li>
</ul>

<p><strong>Launch price:</strong> [Price] (regular [Price])</p>

<p><a href="{{courseUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Enroll Now</a></p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "sales-flash-sale",
    name: "Flash Sale",
    subject: "24 hours only: [X]% off everything",
    category: "sales",
    description: "Limited time discount on products",
    body: `<p>Hey {{firstName}},</p>

<p>Quick heads up - I'm running a flash sale for the next 24 hours.</p>

<p><strong>[X]% off everything in my store.</strong></p>

<p>Sample packs, courses, presets - all of it.</p>

<p>No code needed, the discount is already applied.</p>

<p><a href="{{storeUrl}}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Shop the Sale</a></p>

<p>This ends tomorrow at midnight. Don't sleep on it.</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "sales-last-chance",
    name: "Last Chance Reminder",
    subject: "Final hours: Sale ends tonight",
    category: "sales",
    description: "Urgency email before sale ends",
    body: `<p>Hey {{firstName}},</p>

<p>Just a heads up - the sale ends tonight at midnight.</p>

<p>After that, prices go back to normal.</p>

<p>If you've been eyeing something, now's your last chance to grab it at the discounted price.</p>

<p><a href="{{storeUrl}}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Shop Before It's Gone</a></p>

<p>No pressure - just didn't want you to miss out if there was something you wanted.</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "sales-testimonials",
    name: "Customer Success Stories",
    subject: "See what other producers are creating",
    category: "sales",
    description: "Share testimonials and social proof",
    body: `<p>Hey {{firstName}},</p>

<p>I wanted to share some messages I've been getting about [Product Name]...</p>

<blockquote style="border-left: 3px solid #3b82f6; padding-left: 16px; margin: 16px 0; font-style: italic;">
"These sounds are exactly what I needed. Already used them in 3 beats!" - [Name]
</blockquote>

<blockquote style="border-left: 3px solid #3b82f6; padding-left: 16px; margin: 16px 0; font-style: italic;">
"The quality is insane. Worth every penny." - [Name]
</blockquote>

<blockquote style="border-left: 3px solid #3b82f6; padding-left: 16px; margin: 16px 0; font-style: italic;">
"Finally sounds that don't sound like everything else out there." - [Name]
</blockquote>

<p>These results are possible for you too.</p>

<p><a href="{{productUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Them</a></p>

<p>{{creatorName}}</p>`,
  },

  // ENGAGEMENT TEMPLATES
  {
    id: "engagement-checkin",
    name: "Simple Check-In",
    subject: "Still making beats?",
    category: "engagement",
    description: "Re-engage subscribers with a personal touch",
    body: `<p>Hey {{firstName}},</p>

<p>Just checking in - how's the music coming along?</p>

<p>I've been working on some new content and wanted to make sure you're still interested in production tips and sounds.</p>

<p>Hit reply and let me know:</p>
<ul>
  <li>What are you working on right now?</li>
  <li>What's your biggest challenge?</li>
  <li>Is there anything specific you want me to create?</li>
</ul>

<p>I read every response.</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "engagement-tip",
    name: "Quick Production Tip",
    subject: "A mixing tip that changed everything for me",
    category: "engagement",
    description: "Share a valuable tip to provide value",
    body: `<p>Hey {{firstName}},</p>

<p>Quick tip that might help you:</p>

<p><strong>[The Tip]</strong></p>

<p>[Explain the tip in detail - what it is, why it works, how to implement it]</p>

<p>Try it in your next session and let me know how it goes!</p>

<p>{{creatorName}}</p>

<p>P.S. Want more tips like this? Check out [related course/content].</p>`,
  },
  {
    id: "engagement-winback",
    name: "Win-Back Email",
    subject: "We miss you {{firstName}}!",
    category: "engagement",
    description: "Re-engage inactive subscribers",
    body: `<p>Hey {{firstName}},</p>

<p>I noticed you haven't opened my emails in a while.</p>

<p>No worries - I get it. Life gets busy.</p>

<p>But I wanted to reach out because I've dropped some fire content recently:</p>

<ul>
  <li>[New content/release 1]</li>
  <li>[New content/release 2]</li>
  <li>[New content/release 3]</li>
</ul>

<p>If you're still making music, I'd love to keep you in the loop.</p>

<p><a href="{{storeUrl}}">Click here to stay subscribed</a></p>

<p>If not, no hard feelings. You can unsubscribe anytime.</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "engagement-gift",
    name: "Surprise Gift",
    subject: "A gift for you (just because)",
    category: "engagement",
    description: "Surprise discount or freebie",
    body: `<p>Hey {{firstName}},</p>

<p>I wanted to do something nice for you today.</p>

<p>Here's a <strong>30% discount</strong> on anything in my store:</p>

<p>Use code: <strong>GIFT30</strong></p>

<p>No catch, no strings attached. Just my way of saying thanks for being part of this community.</p>

<p><a href="{{storeUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Browse My Store</a></p>

<p>Valid for the next 48 hours.</p>

<p>Enjoy!<br>{{creatorName}}</p>`,
  },

  // EDUCATION TEMPLATES
  {
    id: "education-course-welcome",
    name: "Course Welcome",
    subject: "Welcome to [Course Name]! Let's get started",
    category: "education",
    description: "Onboard new course students",
    body: `<p>Hey {{firstName}},</p>

<p>Welcome to the course! I'm excited to have you as a student.</p>

<p><strong>Here's how to get the most out of this:</strong></p>

<p><strong>Step 1: Set up your workspace</strong><br>
Have your DAW open while watching. Learning by doing is 10x more effective.</p>

<p><strong>Step 2: Don't skip ahead</strong><br>
Each lesson builds on the previous one. Trust the process.</p>

<p><strong>Step 3: Take action</strong><br>
After each lesson, try to implement what you learned before moving on.</p>

<p><strong>Step 4: Ask questions</strong><br>
Stuck on something? Just reply to this email.</p>

<p><a href="{{courseUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Learning</a></p>

<p>Let's do this,<br>{{creatorName}}</p>`,
  },
  {
    id: "education-progress-check",
    name: "Course Progress Check",
    subject: "How's the course going?",
    category: "education",
    description: "Check on student progress",
    body: `<p>Hey {{firstName}},</p>

<p>Just checking in on your progress!</p>

<p>By now, you should be through the first few lessons. How's it going?</p>

<p><strong>Quick motivation:</strong> Most people who start online courses never finish. But you're different - you're here because you're serious about improving.</p>

<p>Even if you can only do 15 minutes a day, that adds up. Consistency beats intensity.</p>

<p>Let me know if you're stuck on anything - I'm here to help.</p>

<p>Keep going,<br>{{creatorName}}</p>`,
  },
  {
    id: "education-completion",
    name: "Course Completion",
    subject: "You did it! Congratulations on finishing the course",
    category: "education",
    description: "Celebrate course completion",
    body: `<p>Hey {{firstName}},</p>

<p><strong>CONGRATULATIONS!</strong></p>

<p>You finished the course! I'm so proud of you.</p>

<p>But completing the course is just the beginning. The real magic happens when you apply what you've learned.</p>

<p><strong>Your next steps:</strong></p>
<ol>
  <li>Create a track using at least 3 techniques from the course</li>
  <li>Share it with me - I'd love to hear it!</li>
  <li>Keep practicing and refining your skills</li>
</ol>

<p>If you enjoyed the course, I'd really appreciate a review. It helps other producers find it.</p>

<p><a href="{{reviewUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Leave a Review</a></p>

<p>Thank you for learning with me!<br>{{creatorName}}</p>`,
  },

  // TRANSACTIONAL TEMPLATES
  {
    id: "transactional-purchase",
    name: "Purchase Confirmation",
    subject: "You're in! Here's how to access your content",
    category: "transactional",
    description: "Confirm purchase and provide access",
    body: `<p>Hey {{firstName}},</p>

<p>Thank you for your purchase! You just made my day.</p>

<p><strong>Here's how to access your content:</strong></p>

<ol>
  <li>Log in at {{storeUrl}}</li>
  <li>Go to your Library</li>
  <li>Download and start creating!</li>
</ol>

<p><a href="{{libraryUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Access Your Purchase</a></p>

<p>If you have any issues, just reply to this email. I'm here to help!</p>

<p>Can't wait to hear what you create,<br>{{creatorName}}</p>`,
  },
  {
    id: "transactional-review",
    name: "Review Request",
    subject: "Quick favor? (30 seconds)",
    category: "transactional",
    description: "Ask for a product review",
    body: `<p>Hey {{firstName}},</p>

<p>I hope you've been enjoying your purchase!</p>

<p>I have a quick favor - would you mind leaving a review?</p>

<p>It only takes 30 seconds and really helps other producers discover my content.</p>

<p><a href="{{reviewUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Leave a Review</a></p>

<p>Thank you so much - I really appreciate your support!</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "transactional-download-reminder",
    name: "Download Reminder",
    subject: "Don't forget to download your content!",
    category: "transactional",
    description: "Remind to download purchased content",
    body: `<p>Hey {{firstName}},</p>

<p>Just a friendly reminder - you have content waiting for you!</p>

<p>I noticed you haven't downloaded your purchase yet. Don't let it sit there - go grab it and start creating!</p>

<p><a href="{{libraryUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Download Now</a></p>

<p>If you're having any trouble accessing your content, just hit reply and I'll help you out.</p>

<p>{{creatorName}}</p>`,
  },
];

export const emailTemplateCategories = [
  { id: "all", label: "All Templates" },
  { id: "welcome", label: "Welcome & Onboarding" },
  { id: "sales", label: "Sales & Launches" },
  { id: "engagement", label: "Engagement" },
  { id: "education", label: "Courses" },
  { id: "transactional", label: "Transactional" },
];
