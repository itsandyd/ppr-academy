export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  category: "welcome" | "sales" | "engagement" | "education" | "transactional" | "services" | "admin";
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

  // ============================================================================
  // SERVICES TEMPLATES - Coaching, Mixing, Mastering, Playlist Curation
  // ============================================================================

  // COACHING SERVICES
  {
    id: "coaching-booking-confirm",
    name: "Coaching Session Booked",
    subject: "Your coaching session is confirmed!",
    category: "services",
    description: "Confirm a coaching session booking with details",
    body: `<p>Hey {{firstName}},</p>

<p><strong>Your coaching session is booked!</strong></p>

<p>Here are the details:</p>
<ul>
  <li><strong>Date:</strong> {{sessionDate}}</li>
  <li><strong>Time:</strong> {{sessionTime}}</li>
  <li><strong>Duration:</strong> {{sessionDuration}}</li>
  <li><strong>Meeting Link:</strong> {{meetingLink}}</li>
</ul>

<p><strong>Before our session:</strong></p>
<ol>
  <li>Send me your current project or mix (if applicable)</li>
  <li>List 2-3 specific things you want to work on</li>
  <li>Have your DAW open and ready</li>
</ol>

<p>If you need to reschedule, just reply to this email at least 24 hours before our session.</p>

<p>Looking forward to working with you!</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "coaching-session-reminder",
    name: "Coaching Session Reminder",
    subject: "Reminder: Your coaching session is tomorrow",
    category: "services",
    description: "Remind about upcoming coaching session",
    body: `<p>Hey {{firstName}},</p>

<p>Just a quick reminder - we have our coaching session <strong>tomorrow</strong>!</p>

<p><strong>Session Details:</strong></p>
<ul>
  <li><strong>Date:</strong> {{sessionDate}}</li>
  <li><strong>Time:</strong> {{sessionTime}}</li>
  <li><strong>Meeting Link:</strong> {{meetingLink}}</li>
</ul>

<p><strong>Quick checklist:</strong></p>
<ul>
  <li>Did you send me your project files?</li>
  <li>Do you have specific questions ready?</li>
  <li>Is your audio/video setup tested?</li>
</ul>

<p>If you can't make it, please let me know ASAP so we can reschedule.</p>

<p>See you tomorrow!</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "coaching-session-followup",
    name: "Coaching Session Follow-Up",
    subject: "Great session! Here's what we covered",
    category: "services",
    description: "Follow up after a coaching session with notes and next steps",
    body: `<p>Hey {{firstName}},</p>

<p>Thanks for the session today! I loved working through {{sessionTopic}} with you.</p>

<p><strong>Key takeaways from our session:</strong></p>
<ul>
  <li>{{takeaway1}}</li>
  <li>{{takeaway2}}</li>
  <li>{{takeaway3}}</li>
</ul>

<p><strong>Your homework:</strong></p>
<ol>
  <li>{{homework1}}</li>
  <li>{{homework2}}</li>
</ol>

<p>If you have any questions as you work through this, just hit reply.</p>

<p><strong>Ready for another session?</strong> Book your next one here:</p>

<p><a href="{{bookingUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Book Next Session</a></p>

<p>Keep crushing it!</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "coaching-package-offer",
    name: "Coaching Package Offer",
    subject: "Save on coaching with a package deal",
    category: "services",
    description: "Offer a multi-session coaching package",
    body: `<p>Hey {{firstName}},</p>

<p>I noticed you've booked a few coaching sessions - thank you for trusting me with your production journey!</p>

<p>I wanted to let you know about my <strong>coaching package</strong> that could save you money:</p>

<p style="background-color: #f3f4f6; padding: 16px; border-radius: 8px;">
<strong>{{packageName}}</strong><br>
{{packageSessions}} sessions for \${{packagePrice}}<br>
<span style="color: #16a34a; font-weight: bold;">Save {{savingsPercent}}% vs. individual sessions</span>
</p>

<p>This is perfect if you want to:</p>
<ul>
  <li>Work through a complete project together</li>
  <li>Learn a full workflow from start to finish</li>
  <li>Get consistent guidance over a few weeks</li>
</ul>

<p><a href="{{packageUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Get the Package</a></p>

<p>Let me know if you have any questions!</p>

<p>{{creatorName}}</p>`,
  },

  // MIXING & MASTERING SERVICES
  {
    id: "mixing-inquiry-response",
    name: "Mixing Service Inquiry Response",
    subject: "Re: Mixing inquiry - let's make your track shine",
    category: "services",
    description: "Respond to a mixing service inquiry",
    body: `<p>Hey {{firstName}},</p>

<p>Thanks for reaching out about mixing! I'd love to work on your track.</p>

<p><strong>Here's how my mixing service works:</strong></p>

<p><strong>What I Need From You:</strong></p>
<ul>
  <li>All stems/tracks bounced individually (WAV, 24-bit preferred)</li>
  <li>Reference tracks (2-3 songs with the vibe you're going for)</li>
  <li>Any notes on what you're looking for</li>
  <li>BPM and key of the track</li>
</ul>

<p><strong>What You Get:</strong></p>
<ul>
  <li>Professional mix of your track</li>
  <li>{{revisionCount}} rounds of revisions</li>
  <li>Stems + final master-ready mix</li>
  <li>Turnaround: {{turnaroundDays}} days</li>
</ul>

<p><strong>Pricing:</strong> \${{mixingPrice}} per track</p>

<p>Ready to get started? Send over your stems and let's go!</p>

<p><a href="{{uploadUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Upload Your Stems</a></p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "mixing-files-received",
    name: "Mixing Files Received",
    subject: "Got your stems! Starting your mix",
    category: "services",
    description: "Confirm receipt of stems and set expectations",
    body: `<p>Hey {{firstName}},</p>

<p>Got your stems! Everything looks good and I'm excited to work on "{{trackName}}".</p>

<p><strong>What happens next:</strong></p>
<ol>
  <li>I'll start working on your mix today</li>
  <li>First draft ready in {{turnaroundDays}} days</li>
  <li>You'll get a private link to review</li>
  <li>Send me your revision notes</li>
  <li>Final delivery after revisions</li>
</ol>

<p>I'll reach out if I have any questions about your reference tracks or notes.</p>

<p>Talk soon!</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "mixing-first-draft",
    name: "Mixing First Draft Ready",
    subject: "Your mix is ready for review!",
    category: "services",
    description: "Deliver first mix draft for client review",
    body: `<p>Hey {{firstName}},</p>

<p><strong>Your first mix is ready!</strong></p>

<p>Listen here:</p>

<p style="text-align: center; margin: 24px 0;">
<a href="{{previewUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Listen to Mix</a>
</p>

<p><strong>Feedback tips:</strong></p>
<ul>
  <li>Listen on multiple systems (headphones, speakers, car)</li>
  <li>Be specific (e.g., "vocals too loud in chorus" vs. "something feels off")</li>
  <li>Reference your original vision and reference tracks</li>
  <li>Don't rush - take a day to sit with it</li>
</ul>

<p>You have <strong>{{revisionsRemaining}} revisions remaining</strong>. Send me your notes when you're ready!</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "mixing-final-delivery",
    name: "Mixing Final Delivery",
    subject: "Your final mix is here!",
    category: "services",
    description: "Deliver final mixed track with files",
    body: `<p>Hey {{firstName}},</p>

<p><strong>Your mix is complete!</strong></p>

<p>Download your files here:</p>

<p style="text-align: center; margin: 24px 0;">
<a href="{{downloadUrl}}" style="display: inline-block; background-color: #16a34a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Download Final Mix</a>
</p>

<p><strong>What's included:</strong></p>
<ul>
  <li>Final mix (WAV, 24-bit)</li>
  <li>Final mix (MP3, 320kbps)</li>
  <li>Stem bounces (if requested)</li>
</ul>

<p>It was great working on "{{trackName}}" with you! If you're happy with the results, I'd really appreciate:</p>
<ul>
  <li>A review on my profile</li>
  <li>A shoutout when you release the track</li>
  <li>Tagging me so I can share it too!</li>
</ul>

<p><strong>Need mastering?</strong> I also offer mastering services:</p>

<p><a href="{{masteringUrl}}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Get It Mastered</a></p>

<p>{{creatorName}}</p>`,
  },

  // PLAYLIST CURATION SERVICES
  {
    id: "playlist-submission-received",
    name: "Playlist Submission Received",
    subject: "Got your submission! Here's what happens next",
    category: "services",
    description: "Confirm receipt of playlist submission",
    body: `<p>Hey {{firstName}},</p>

<p>Thanks for submitting "{{trackName}}" to my playlist!</p>

<p><strong>What happens now:</strong></p>
<ol>
  <li>I listen to every submission personally</li>
  <li>Review takes {{reviewDays}} days</li>
  <li>You'll hear back either way</li>
</ol>

<p><strong>Tips to increase your chances:</strong></p>
<ul>
  <li>Make sure your track fits the playlist vibe</li>
  <li>Professional mix and master quality</li>
  <li>Complete metadata (artwork, credits)</li>
  <li>Track should be on Spotify</li>
</ul>

<p>I'll be in touch soon!</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "playlist-accepted",
    name: "Track Accepted to Playlist",
    subject: "Congrats! Your track is on the playlist!",
    category: "services",
    description: "Notify artist their track was added to playlist",
    body: `<p>Hey {{firstName}},</p>

<p><strong>Great news - "{{trackName}}" is now on {{playlistName}}!</strong></p>

<p style="text-align: center; margin: 24px 0;">
<a href="{{playlistUrl}}" style="display: inline-block; background-color: #16a34a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Playlist</a>
</p>

<p><strong>To maximize your placement:</strong></p>
<ul>
  <li>Share the playlist on your socials</li>
  <li>Add it to your Spotify profile</li>
  <li>Tell your fans to follow the playlist</li>
  <li>Engage with other artists on the playlist</li>
</ul>

<p><strong>Placement Details:</strong></p>
<ul>
  <li>Position: {{playlistPosition}}</li>
  <li>Duration: {{placementDuration}}</li>
  <li>Playlist followers: {{followerCount}}</li>
</ul>

<p>Congrats again! Keep making fire music.</p>

<p>{{creatorName}}</p>`,
  },

  // BEAT LEASE TEMPLATES
  {
    id: "beat-lease-delivery",
    name: "Beat Lease Delivery",
    subject: "Your beat is ready to download!",
    category: "sales",
    description: "Deliver purchased beat with license terms",
    body: `<p>Hey {{firstName}},</p>

<p>Thanks for copping "{{beatName}}"! Here's your download:</p>

<p style="text-align: center; margin: 24px 0;">
<a href="{{downloadUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Download Beat</a>
</p>

<p><strong>Your License: {{licenseName}}</strong></p>
<ul>
  <li>Streams: {{streamLimit}}</li>
  <li>Music videos: {{videoLimit}}</li>
  <li>Radio broadcasts: {{radioLimit}}</li>
  <li>Credit: "Prod. by {{creatorName}}"</li>
</ul>

<p><strong>Files included:</strong></p>
<ul>
  <li>{{fileList}}</li>
</ul>

<p><strong>Important:</strong> Please read the license agreement included in your download. It contains all the terms for using this beat.</p>

<p>Can't wait to hear what you do with it! Tag me when you drop.</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "beat-exclusive-offer",
    name: "Beat Exclusive Rights Offer",
    subject: "Own this beat outright - exclusive rights available",
    category: "sales",
    description: "Offer exclusive rights to a beat a customer leased",
    body: `<p>Hey {{firstName}},</p>

<p>I noticed you leased "{{beatName}}" recently. Wanted to give you first dibs on something:</p>

<p><strong>The exclusive rights are still available.</strong></p>

<p>What does exclusive mean?</p>
<ul>
  <li>You OWN the beat - no one else can use it</li>
  <li>Unlimited streams, sales, and radio play</li>
  <li>Full trackouts and stems included</li>
  <li>I remove it from my catalog permanently</li>
</ul>

<p>Since you already have a lease, I'm offering you a special deal:</p>

<p style="background-color: #fef3c7; padding: 16px; border-radius: 8px; text-align: center;">
<strong>Exclusive Rights: \${{exclusivePrice}}</strong><br>
<span style="text-decoration: line-through; color: #9ca3af;">Regular: \${{regularPrice}}</span><br>
<span style="color: #d97706; font-weight: bold;">Your Lease Credit Applied</span>
</p>

<p>This offer is valid for {{offerDays}} days. After that, it goes back to full price (or someone else might grab it).</p>

<p><a href="{{exclusiveUrl}}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Lock In Exclusive Rights</a></p>

<p>Let me know if you have any questions!</p>

<p>{{creatorName}}</p>`,
  },

  // PRESET & MIDI PACK TEMPLATES
  {
    id: "preset-pack-launch",
    name: "Preset Pack Launch",
    subject: "NEW: {{packName}} presets just dropped",
    category: "sales",
    description: "Announce a new preset pack release",
    body: `<p>Hey {{firstName}},</p>

<p><strong>It's finally here!</strong></p>

<p>After months of work, I'm dropping my brand new preset pack:</p>

<p style="text-align: center; font-size: 24px; font-weight: bold; margin: 24px 0;">{{packName}}</p>

<p><strong>What's inside:</strong></p>
<ul>
  <li>{{presetCount}} presets for {{dawName}}</li>
  <li>{{categoryBreakdown}}</li>
  <li>Bonus: {{bonusContent}}</li>
</ul>

<p><strong>These presets are perfect for:</strong></p>
<ul>
  <li>{{useCase1}}</li>
  <li>{{useCase2}}</li>
  <li>{{useCase3}}</li>
</ul>

<p style="text-align: center; margin: 24px 0;">
<a href="{{productUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Get {{packName}} - \${{price}}</a>
</p>

<p><strong>Launch Special:</strong> Use code {{discountCode}} for {{discountPercent}}% off (expires {{expiryDate}})</p>

<p>Let's make some heat!</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "preset-installation-guide",
    name: "Preset Installation Guide",
    subject: "How to install your new presets",
    category: "transactional",
    description: "Help customers install their purchased presets",
    body: `<p>Hey {{firstName}},</p>

<p>Thanks for grabbing {{packName}}! Here's how to install your presets:</p>

<p><strong>For {{dawName}}:</strong></p>
<ol>
  <li>{{step1}}</li>
  <li>{{step2}}</li>
  <li>{{step3}}</li>
  <li>{{step4}}</li>
</ol>

<p><strong>Video walkthrough:</strong></p>
<p><a href="{{tutorialUrl}}">Watch Installation Tutorial</a></p>

<p><strong>Common issues:</strong></p>
<ul>
  <li><strong>Presets not showing up?</strong> Restart your DAW after installation</li>
  <li><strong>Wrong file format?</strong> Make sure you're using {{dawName}} version {{minVersion}} or higher</li>
  <li><strong>Missing sounds?</strong> Some presets require {{requirements}}</li>
</ul>

<p>Still stuck? Just reply to this email and I'll help you out.</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "midi-pack-tips",
    name: "MIDI Pack Usage Tips",
    subject: "3 ways to use your new MIDI files",
    category: "education",
    description: "Help customers get value from MIDI packs",
    body: `<p>Hey {{firstName}},</p>

<p>Now that you have {{packName}}, here are 3 ways to get the most out of it:</p>

<p><strong>1. Use as-is for quick starts</strong></p>
<p>Drag a MIDI file into your project and layer your own sounds. Instant inspiration without starting from scratch.</p>

<p><strong>2. Chop and rearrange</strong></p>
<p>Cut sections, flip the order, combine multiple files. These are building blocks - make them yours.</p>

<p><strong>3. Learn from the patterns</strong></p>
<p>Study the note placements, velocities, and rhythms. Understanding WHY something sounds good is how you level up.</p>

<p><strong>Bonus tip:</strong> Try transposing melodies to different keys. Same notes, completely different vibe.</p>

<p>What are you going to make with these? Hit reply and let me know!</p>

<p>{{creatorName}}</p>`,
  },

  // PROJECT FILE TEMPLATES
  {
    id: "project-file-delivery",
    name: "Project File Delivery",
    subject: "Your project file is ready to explore",
    category: "transactional",
    description: "Deliver purchased project file with instructions",
    body: `<p>Hey {{firstName}},</p>

<p>Your project file for "{{projectName}}" is ready!</p>

<p style="text-align: center; margin: 24px 0;">
<a href="{{downloadUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Download Project</a>
</p>

<p><strong>Requirements:</strong></p>
<ul>
  <li>DAW: {{dawName}} {{minVersion}} or higher</li>
  <li>Plugins: {{requiredPlugins}}</li>
  <li>Samples included: {{samplesIncluded}}</li>
</ul>

<p><strong>How to get the most out of this:</strong></p>
<ol>
  <li>Open and listen through the full arrangement</li>
  <li>Solo tracks to hear individual elements</li>
  <li>Study the mixer settings and effects chains</li>
  <li>Experiment with changing elements</li>
</ol>

<p>This is a learning tool - don't just copy, understand WHY I made each decision.</p>

<p>Questions? Just reply!</p>

<p>{{creatorName}}</p>`,
  },

  // BUNDLE TEMPLATES
  {
    id: "bundle-launch",
    name: "Bundle Launch Announcement",
    subject: "The ultimate bundle just dropped: {{bundleName}}",
    category: "sales",
    description: "Announce a new product bundle",
    body: `<p>Hey {{firstName}},</p>

<p>I've been putting something together for a while now, and it's finally ready:</p>

<p style="text-align: center; font-size: 24px; font-weight: bold; margin: 24px 0;">{{bundleName}}</p>

<p><strong>Everything included:</strong></p>
<ul>
  <li>{{bundleItem1}} (Value: \${{bundleItem1Value}})</li>
  <li>{{bundleItem2}} (Value: \${{bundleItem2Value}})</li>
  <li>{{bundleItem3}} (Value: \${{bundleItem3Value}})</li>
</ul>

<p style="background-color: #f0fdf4; padding: 16px; border-radius: 8px;">
<strong>Total Value: \${{totalValue}}</strong><br>
<strong>Bundle Price: \${{bundlePrice}}</strong><br>
<span style="color: #16a34a; font-weight: bold;">You Save: \${{savings}} ({{savingsPercent}}% off)</span>
</p>

<p>This is the most complete package I've ever put together. Everything you need to {{bundleBenefit}}.</p>

<p style="text-align: center; margin: 24px 0;">
<a href="{{bundleUrl}}" style="display: inline-block; background-color: #16a34a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Get the Bundle</a>
</p>

<p>{{creatorName}}</p>`,
  },
  {
    id: "bundle-upsell",
    name: "Bundle Upsell After Purchase",
    subject: "Complete your collection with the full bundle",
    category: "sales",
    description: "Offer bundle to someone who bought individual products",
    body: `<p>Hey {{firstName}},</p>

<p>Thanks for grabbing {{purchasedProduct}}!</p>

<p>Quick question - did you know this is part of my {{bundleName}} bundle?</p>

<p>Since you already own {{purchasedProduct}}, I want to offer you a special deal:</p>

<p style="background-color: #fef3c7; padding: 16px; border-radius: 8px;">
<strong>Complete the Bundle</strong><br>
Get everything else in {{bundleName}} for just \${{upgradePrice}}<br>
<span style="color: #d97706; font-weight: bold;">(Regular bundle: \${{fullBundlePrice}})</span>
</p>

<p><strong>What you'd be adding:</strong></p>
<ul>
  <li>{{remainingItem1}}</li>
  <li>{{remainingItem2}}</li>
  <li>{{remainingItem3}}</li>
</ul>

<p><a href="{{upgradeUrl}}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete My Bundle</a></p>

<p>This offer is only valid for {{offerDays}} days.</p>

<p>{{creatorName}}</p>`,
  },

  // SAMPLE PACK ADDITIONAL TEMPLATES
  {
    id: "sample-pack-genre-launch",
    name: "Genre-Specific Sample Pack Launch",
    subject: "[{{genre}}] New sounds just dropped",
    category: "sales",
    description: "Launch a genre-specific sample pack",
    body: `<p>Hey {{firstName}},</p>

<p>If you make <strong>{{genre}}</strong>, this one's for you.</p>

<p>I just dropped <strong>{{packName}}</strong> - {{sampleCount}} sounds designed specifically for {{genre}} producers.</p>

<p><strong>What's inside:</strong></p>
<ul>
  <li>{{drumCount}} drum one-shots</li>
  <li>{{loopCount}} loops</li>
  <li>{{fxCount}} FX and risers</li>
  <li>{{bonusContent}}</li>
</ul>

<p><strong>These sounds are:</strong></p>
<ul>
  <li>100% royalty-free</li>
  <li>Key and BPM labeled</li>
  <li>Professionally processed</li>
  <li>Ready to drag and drop</li>
</ul>

<p><strong>Audio previews:</strong></p>
<p><a href="{{previewUrl}}">Listen to demo tracks</a></p>

<p style="text-align: center; margin: 24px 0;">
<a href="{{productUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Get {{packName}} - \${{price}}</a>
</p>

<p>{{creatorName}}</p>`,
  },

  // ADMIN / LEARNER-TO-CREATOR TEMPLATES
  {
    id: "l2c-welcome-platform",
    name: "Platform Welcome",
    subject: "Welcome to PPR Academy - Your music production journey starts here",
    category: "admin",
    description: "Welcome new users to the platform and introduce what's possible",
    body: `<p>Hey {{firstName}},</p>

<p>Welcome to PPR Academy! You've just joined a community of music producers who are serious about leveling up their skills.</p>

<p>Here's what you can do on PPR Academy:</p>
<ul>
  <li><strong>Learn</strong> - Access courses from top producers</li>
  <li><strong>Download</strong> - Get samples, presets, and project files</li>
  <li><strong>Connect</strong> - Join a community of fellow producers</li>
  <li><strong>Earn</strong> - Share your own knowledge and get paid</li>
</ul>

<p>Start exploring and find the content that speaks to your style.</p>

<p>Got questions? Just reply to this email - we're here to help.</p>

<p>Let's make some noise,<br>The PPR Academy Team</p>`,
  },
  {
    id: "l2c-discover-creators",
    name: "Discover Creator Benefits",
    subject: "Did you know? You can earn money on PPR Academy",
    category: "admin",
    description: "Introduce the creator side of the platform to learners",
    body: `<p>Hey {{firstName}},</p>

<p>We noticed you've been crushing it on PPR Academy - love to see it!</p>

<p>Quick question: <strong>Have you ever thought about sharing what you know?</strong></p>

<p>PPR Academy isn't just for learning - it's also a place where producers like you can:</p>
<ul>
  <li>Sell your sample packs and presets</li>
  <li>Create and sell courses</li>
  <li>Offer mixing/mastering services</li>
  <li>Build a recurring income from your knowledge</li>
</ul>

<p>Some of our creators are making thousands every month just by sharing their production knowledge.</p>

<p>Curious? Here's how to get started:</p>
<ol>
  <li>Click "Create" in your dashboard</li>
  <li>Set up your creator profile</li>
  <li>Upload your first product</li>
</ol>

<p><a href="{{createStoreUrl}}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Creating</a></p>

<p>What do you think?<br>The PPR Academy Team</p>`,
  },
  {
    id: "l2c-creator-success-story",
    name: "Creator Success Story",
    subject: "How {{creatorName}} made $X in their first month",
    category: "admin",
    description: "Share a success story to inspire learners to become creators",
    body: `<p>Hey {{firstName}},</p>

<p>I wanted to share a quick story that might inspire you.</p>

<p>{{creatorName}} was in your exact position a few months ago - a producer learning new skills on PPR Academy.</p>

<p>Then they decided to try something different. They packaged up some of their drum samples and listed them for sale.</p>

<p><strong>The result?</strong> They made {{earnings}} in their first month, and it's been growing ever since.</p>

<p>Here's what {{creatorName}} said:</p>
<blockquote style="border-left: 4px solid #8b5cf6; padding-left: 16px; margin: 16px 0; color: #64748b;">
"I didn't think anyone would want my stuff. Turns out, the unique sounds I was making were exactly what other producers were looking for."
</blockquote>

<p>You have unique sounds and techniques too. Why not share them?</p>

<p><a href="{{createStoreUrl}}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Your Creator Journey</a></p>

<p>Rooting for you,<br>The PPR Academy Team</p>`,
  },
  {
    id: "l2c-first-product-idea",
    name: "Your First Product Idea",
    subject: "The easiest way to start earning on PPR Academy",
    category: "admin",
    description: "Give learners a concrete idea for their first product",
    body: `<p>Hey {{firstName}},</p>

<p>Thinking about creating but not sure where to start?</p>

<p>Here's the <strong>easiest first product</strong> most successful creators recommend:</p>

<p><strong>A Sample Pack</strong></p>

<p>You probably have folders full of one-shots, loops, and sounds you've made. Package 50-100 of your best ones, and you've got a product.</p>

<p>Here's a simple formula:</p>
<ol>
  <li>Pick your best 50-100 samples</li>
  <li>Organize them into folders (kicks, snares, hi-hats, etc.)</li>
  <li>Create a simple cover image</li>
  <li>Write a short description</li>
  <li>Price it at $15-25</li>
</ol>

<p>That's it. You could have your first product live in an hour.</p>

<p>The key is to <strong>start simple</strong>. Your first product doesn't need to be perfect - it just needs to exist.</p>

<p><a href="{{createProductUrl}}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Create Your First Product</a></p>

<p>What sounds do you have that others might want?<br>The PPR Academy Team</p>`,
  },
  {
    id: "l2c-creator-features",
    name: "Creator Tools Overview",
    subject: "Everything you get as a PPR Academy creator",
    category: "admin",
    description: "Showcase the tools and features available to creators",
    body: `<p>Hey {{firstName}},</p>

<p>Here's everything you unlock when you become a creator on PPR Academy:</p>

<p><strong>Sell Products</strong></p>
<ul>
  <li>Sample packs & presets</li>
  <li>Project files & templates</li>
  <li>Video courses</li>
  <li>1-on-1 coaching sessions</li>
  <li>Mixing/mastering services</li>
</ul>

<p><strong>Marketing Tools</strong></p>
<ul>
  <li>Email automation to nurture your audience</li>
  <li>Discount codes & promotions</li>
  <li>Lead magnets (free downloads)</li>
  <li>Analytics & insights</li>
</ul>

<p><strong>Get Paid</strong></p>
<ul>
  <li>Direct payments via Stripe</li>
  <li>Keep 90% of your sales</li>
  <li>No monthly fees</li>
</ul>

<p><strong>Grow Your Brand</strong></p>
<ul>
  <li>Customizable creator profile</li>
  <li>Product reviews & ratings</li>
  <li>Appear in marketplace search</li>
</ul>

<p><a href="{{createStoreUrl}}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Become a Creator</a></p>

<p>The PPR Academy Team</p>`,
  },
  {
    id: "l2c-overcome-doubt",
    name: "Overcome Creator Doubt",
    subject: "You're more ready than you think",
    category: "admin",
    description: "Address common objections and fears about becoming a creator",
    body: `<p>Hey {{firstName}},</p>

<p>Can I be real with you for a second?</p>

<p>A lot of producers think they're "not ready" to sell their stuff. Maybe you've thought:</p>
<ul>
  <li>"My sounds aren't good enough"</li>
  <li>"Nobody would pay for what I make"</li>
  <li>"I'm not a professional"</li>
  <li>"I don't know how to market myself"</li>
</ul>

<p><strong>Here's the truth:</strong> You don't need to be a chart-topping producer to create value for others.</p>

<p>There are producers right now who would LOVE your workflow, your sound design, your mixing techniques - because you're a few steps ahead of them.</p>

<p>You know that thing you figured out last month? That's valuable to someone who's stuck on it right now.</p>

<p>The creators who succeed aren't the "best" - they're the ones who started.</p>

<p>What's one thing you know that could help another producer?</p>

<p><a href="{{createStoreUrl}}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Sharing Your Knowledge</a></p>

<p>Believe in yourself,<br>The PPR Academy Team</p>`,
  },
  {
    id: "l2c-course-creation",
    name: "Create Your First Course",
    subject: "Turn your production skills into a course",
    category: "admin",
    description: "Encourage learners to create their first course",
    body: `<p>Hey {{firstName}},</p>

<p>You've been learning on PPR Academy. Now it's time to <strong>teach</strong>.</p>

<p>Creating a course is easier than you think. Here's a simple framework:</p>

<p><strong>Step 1: Pick ONE specific topic</strong><br>
Don't try to teach "music production." Teach "How to Make Hard-Hitting 808 Patterns" or "Mixing Vocals in FL Studio."</p>

<p><strong>Step 2: Break it into 5-10 lessons</strong><br>
Each lesson should be 5-15 minutes. Teach one concept per video.</p>

<p><strong>Step 3: Record with what you have</strong><br>
Screen recording + your voice is enough. You don't need fancy equipment.</p>

<p><strong>Step 4: Upload and publish</strong><br>
Our course builder makes it easy to organize and sell your content.</p>

<p><strong>Pricing tip:</strong> Start at $29-49 for a focused mini-course. You can always create bigger courses later.</p>

<p>What could you teach in 10 short videos?</p>

<p><a href="{{createCourseUrl}}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Create Your Course</a></p>

<p>The PPR Academy Team</p>`,
  },
  {
    id: "l2c-final-nudge",
    name: "Final Creator Nudge",
    subject: "Last chance to unlock creator mode",
    category: "admin",
    description: "Final push for learners who haven't converted to creators",
    body: `<p>Hey {{firstName}},</p>

<p>I've sent you a few emails about becoming a creator on PPR Academy.</p>

<p>I'm not going to keep bugging you about it - but before I stop, I want to share one last thought:</p>

<p><strong>The best time to start was yesterday. The second best time is now.</strong></p>

<p>A year from now, you could:</p>
<ul>
  <li>Have a catalog of products earning passive income</li>
  <li>Be known as a go-to source for {{yourNiche}}</li>
  <li>Have students thanking you for helping them level up</li>
</ul>

<p>Or you could be in the same place, still thinking about "someday."</p>

<p>The creators who succeed aren't special. They just started.</p>

<p>Will you?</p>

<p><a href="{{createStoreUrl}}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Now</a></p>

<p>Whatever you decide, keep making music.<br>The PPR Academy Team</p>`,
  },
  {
    id: "l2c-welcome-new-creator",
    name: "Welcome New Creator",
    subject: "You did it! Welcome to the creator side",
    category: "admin",
    description: "Congratulate and onboard new creators",
    body: `<p>Hey {{firstName}},</p>

<p><strong>Congrats - you're officially a PPR Academy creator!</strong></p>

<p>This is a big step. You're no longer just consuming - you're creating. And that's where the magic happens.</p>

<p>Here's your creator onboarding checklist:</p>
<ol>
  <li><strong>Complete your profile</strong> - Add a photo, bio, and social links</li>
  <li><strong>Create your first product</strong> - Start simple (sample pack or preset)</li>
  <li><strong>Set up payouts</strong> - Connect Stripe to get paid</li>
  <li><strong>Share your store</strong> - Let your network know you're selling</li>
</ol>

<p>Over the next few days, I'll send you tips to help you:</p>
<ul>
  <li>Create products that sell</li>
  <li>Price your content right</li>
  <li>Build an email list</li>
  <li>Promote without feeling salesy</li>
</ul>

<p><a href="{{creatorDashboardUrl}}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Creator Dashboard</a></p>

<p>Excited to see what you create!<br>The PPR Academy Team</p>`,
  },
];

export const emailTemplateCategories = [
  { id: "all", label: "All Templates" },
  { id: "welcome", label: "Welcome & Onboarding" },
  { id: "sales", label: "Sales & Launches" },
  { id: "services", label: "Services" },
  { id: "engagement", label: "Engagement" },
  { id: "education", label: "Courses" },
  { id: "transactional", label: "Transactional" },
  { id: "admin", label: "Learner to Creator" },
];
