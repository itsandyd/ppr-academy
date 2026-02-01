import { MarketingCampaignTemplate, musicProducerHashtags } from "../types";

// Course Completion Celebration Template
export const courseCompletionTemplate: MarketingCampaignTemplate = {
  id: "course-completion",
  name: "Course Completion Celebration",
  description: "Celebrate student completing your course",
  campaignType: "course_milestone",
  productTypes: ["course"],
  icon: "GraduationCap",
  estimatedReach: "high",

  email: {
    subject: "You did it! {{courseName}} complete",
    previewText: "Congratulations on finishing the course",
    body: `<p>Hey {{firstName}},</p>

<p><strong>CONGRATULATIONS!</strong></p>

<p>You just completed <strong>{{courseName}}</strong>! That's a huge accomplishment.</p>

<p>Here's what you've learned:</p>
<ul>
  <li>{{skill1}}</li>
  <li>{{skill2}}</li>
  <li>{{skill3}}</li>
</ul>

<p>These aren't just theories - these are real skills you can use in your productions right now.</p>

<p><strong>What's next?</strong></p>

<p>The best way to cement what you've learned is to put it into practice. Here's a challenge for you:</p>

<p style="background-color: #f3f4f6; padding: 16px; border-radius: 8px;">
  <strong>{{challenge}}</strong>
</p>

<p>If you want to keep leveling up, check out my other courses:</p>

<p style="margin: 24px 0;">
  <a href="{{nextCourseUrl}}" style="display: inline-block; background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Continue Learning</a>
</p>

<p>Proud of you,<br>{{creatorName}}</p>

<p style="color: #6b7280; font-size: 12px;">P.S. Reply to this email and tell me what you're working on with your new skills!</p>`,
    ctaText: "Continue Learning",
    ctaUrl: "{{nextCourseUrl}}",
  },

  instagram: {
    caption: `Another student just completed {{courseName}}.

There's no better feeling than seeing people level up their production skills.

If you've finished any of my courses, drop a in the comments.

For everyone still working through the material - keep going. Every lesson gets you closer to your goals.

What course or skill are you working on right now?`,
    hashtags: [
      "coursecompletion", "musicproducer", "studentwin", "producerlife",
      "learningmusic", "musicproduction", "producer", "levelup",
      "musiccourse", "producereducation"
    ],
    callToAction: "Tag someone who should take this course",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `Another student just finished {{courseName}}.

Watching people level up their production skills is the best part of creating courses.

If you've completed one of my courses, reply with what you learned.`,
    hashtags: ["producerwins", "musicproduction"],
  },

  facebook: {
    post: `STUDENT SPOTLIGHT

Another producer just completed {{courseName}}!

It's always amazing to see people put in the work and level up their skills.

If you've finished any of my courses, share what you learned in the comments. Let's celebrate your wins together.

And if you're still working through the material - keep going. You've got this.`,
    callToAction: "Share your progress",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Celebrating another student who completed {{courseName}}.

In music production education, seeing students apply what they've learned is the ultimate reward.

The skills covered in this course - {{skill1}}, {{skill2}}, {{skill3}} - are now tools in their production arsenal.

Continuous learning is what separates hobbyists from professionals.`,
    hashtags: ["MusicEducation", "StudentSuccess", "MusicProduction"],
    professionalAngle: "Education and skill development",
  },

  tiktok: {
    caption: `Another student just finished my course. Congrats! Here's what they learned.`,
    hashtags: ["producertok", "musicproducer", "coursecompletion", "fyp", "learnmusic"],
    hookLine: "Someone just finished my production course and here's what they can do now",
  },

  variables: [
    { key: "{{firstName}}", label: "Student First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
    { key: "{{courseName}}", label: "Course Name", type: "text", required: true },
    { key: "{{skill1}}", label: "Skill Learned 1", type: "text", required: true },
    { key: "{{skill2}}", label: "Skill Learned 2", type: "text", required: true },
    { key: "{{skill3}}", label: "Skill Learned 3", type: "text", required: true },
    { key: "{{challenge}}", label: "Post-Course Challenge", type: "text", required: true, placeholder: "Create a full track using the techniques from Module 3" },
    { key: "{{nextCourseUrl}}", label: "Next Course URL", type: "url", required: false },
  ],

  recommendedTiming: {
    email: "Immediately after course completion",
    social: "Weekly student spotlight posts",
  },
};

// Module Completion Check-In Template
export const moduleCompletionTemplate: MarketingCampaignTemplate = {
  id: "module-completion",
  name: "Module Completion Check-In",
  description: "Encourage students after completing a module",
  campaignType: "course_milestone",
  productTypes: ["course"],
  icon: "CheckCircle",
  estimatedReach: "medium",

  email: {
    subject: "Nice work on {{moduleName}}!",
    previewText: "You're making great progress",
    body: `<p>Hey {{firstName}},</p>

<p>Just wanted to say: <strong>nice work completing {{moduleName}}!</strong></p>

<p>You're now {{progressPercent}}% through {{courseName}}. Keep that momentum going!</p>

<p><strong>Quick recap of what you covered:</strong></p>
<ul>
  <li>{{recap1}}</li>
  <li>{{recap2}}</li>
  <li>{{recap3}}</li>
</ul>

<p><strong>Pro tip:</strong> {{proTip}}</p>

<p>Up next: <strong>{{nextModuleName}}</strong></p>

<p>This module is going to build on what you just learned. You'll discover {{nextModuleTeaser}}.</p>

<p style="margin: 24px 0;">
  <a href="{{courseUrl}}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Continue to Next Module</a>
</p>

<p>Keep it up,<br>{{creatorName}}</p>`,
    ctaText: "Continue to Next Module",
    ctaUrl: "{{courseUrl}}",
  },

  instagram: {
    caption: `Progress update for my course students:

If you're working through {{courseName}}, how's it going?

Drop your progress percentage in the comments.

Pro tip: Even 15 minutes a day adds up. Consistency beats intensity.

What module are you on right now?`,
    hashtags: [
      "learning", "musicproducer", "courseprogress", "producerlife",
      "musicproduction", "levelingup", "producer", "musiccourse"
    ],
    callToAction: "Drop your progress in comments",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `To everyone taking one of my courses:

How's your progress?

Remember: 15 minutes a day > 3 hours once a week.

Consistency wins. Keep going.`,
    hashtags: ["learning", "producer"],
  },

  facebook: {
    post: `Course check-in time!

To everyone working through {{courseName}} - how's it going?

Share your progress in the comments. Whether you're 10% in or almost done, I want to celebrate with you.

Struggling with anything? Ask your questions below and I'll help out.`,
    callToAction: "Share your progress",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `For anyone investing in music production education:

Consistent, incremental progress is more valuable than sporadic intensive sessions.

15 minutes daily builds stronger neural pathways than 3-hour marathon sessions once a week.

What are you learning right now?`,
    hashtags: ["Learning", "MusicProduction", "Consistency"],
    professionalAngle: "Educational philosophy",
  },

  tiktok: {
    caption: `Course check-in. How's your progress? Drop it in the comments.`,
    hashtags: ["producertok", "learning", "musicproducer", "fyp"],
    hookLine: "If you're taking one of my courses right now, this is for you",
  },

  variables: [
    { key: "{{firstName}}", label: "Student First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
    { key: "{{courseName}}", label: "Course Name", type: "text", required: true },
    { key: "{{moduleName}}", label: "Completed Module Name", type: "text", required: true },
    { key: "{{progressPercent}}", label: "Progress Percentage", type: "text", required: true, placeholder: "40" },
    { key: "{{recap1}}", label: "Module Recap 1", type: "text", required: true },
    { key: "{{recap2}}", label: "Module Recap 2", type: "text", required: true },
    { key: "{{recap3}}", label: "Module Recap 3", type: "text", required: true },
    { key: "{{proTip}}", label: "Pro Tip Related to Module", type: "text", required: true },
    { key: "{{nextModuleName}}", label: "Next Module Name", type: "text", required: true },
    { key: "{{nextModuleTeaser}}", label: "Next Module Teaser", type: "text", required: true, placeholder: "how to create professional-sounding mixes" },
    { key: "{{courseUrl}}", label: "Course URL", type: "url", required: true },
  ],

  recommendedTiming: {
    email: "Immediately after module completion",
    social: "General progress check-in posts",
  },
};

// Certificate Earned Recognition Template
export const certificateEarnedTemplate: MarketingCampaignTemplate = {
  id: "certificate-earned",
  name: "Certificate Earned Recognition",
  description: "Recognize and celebrate certificate achievement",
  campaignType: "course_milestone",
  productTypes: ["course"],
  icon: "Award",
  estimatedReach: "high",

  email: {
    subject: "Your certificate is ready!",
    previewText: "You've earned it",
    body: `<p>Hey {{firstName}},</p>

<p><strong>You did it!</strong></p>

<p>You've successfully completed <strong>{{courseName}}</strong> and earned your certificate!</p>

<p style="margin: 24px 0; text-align: center;">
  <a href="{{certificateUrl}}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Download Your Certificate</a>
</p>

<p><strong>What this certificate represents:</strong></p>
<ul>
  <li>{{achievement1}}</li>
  <li>{{achievement2}}</li>
  <li>{{achievement3}}</li>
</ul>

<p><strong>Share your achievement!</strong></p>
<p>You've put in the work - now show it off. Share your certificate on social media and tag me at {{socialHandle}}. I'd love to celebrate with you!</p>

<p><strong>What's next?</strong></p>
<p>If you want to keep building your skills, here are some courses that build on what you've learned:</p>
<ul>
  <li>{{recommendedCourse1}}</li>
  <li>{{recommendedCourse2}}</li>
</ul>

<p style="margin: 24px 0;">
  <a href="{{storeUrl}}" style="display: inline-block; background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Browse More Courses</a>
</p>

<p>Proud of you,<br>{{creatorName}}</p>`,
    ctaText: "Download Your Certificate",
    ctaUrl: "{{certificateUrl}}",
  },

  instagram: {
    caption: `CERTIFICATES GOING OUT

Another batch of producers just earned their completion certificates.

If you finished {{courseName}} and got your certificate - share it in your stories and tag me! I want to celebrate with you.

Your commitment to improving your craft is what sets you apart.

Who's working toward their next certificate?`,
    hashtags: [
      "certificate", "musicproducer", "achievement", "producerlife",
      "coursecompletion", "musicproduction", "producer", "levelup",
      "proudmoment", "musiccourse"
    ],
    callToAction: "Share your certificate and tag me",
    suggestedImageStyle: "single",
  },

  twitter: {
    tweet: `Certificates going out to {{courseName}} graduates!

If you earned yours, share it and tag me.

Your commitment to leveling up your production skills deserves recognition.`,
    hashtags: ["certified", "producer"],
  },

  facebook: {
    post: `CERTIFICATES ARE READY!

To everyone who completed {{courseName}} - your certificates are ready to download.

This represents real work and real skill development:
• {{achievement1}}
• {{achievement2}}
• {{achievement3}}

Share your certificate in the comments or on your timeline and tag me. I want to celebrate this milestone with you!`,
    callToAction: "Share your certificate",
    suggestedImageStyle: "single",
  },

  linkedin: {
    post: `Congratulations to the latest graduates of {{courseName}}.

These producers have demonstrated commitment to professional development in:
• {{achievement1}}
• {{achievement2}}
• {{achievement3}}

In the music industry, continuous learning is a competitive advantage. These certified producers are investing in their craft.

If you've earned your certificate, feel free to share it here.`,
    hashtags: ["Certification", "MusicProduction", "ProfessionalDevelopment"],
    professionalAngle: "Professional certification recognition",
  },

  tiktok: {
    caption: `Certificates are ready! If you finished the course, go download yours. You earned it.`,
    hashtags: ["producertok", "certified", "musicproducer", "fyp", "achievement"],
    hookLine: "If you just completed my course, your certificate is waiting for you",
  },

  variables: [
    { key: "{{firstName}}", label: "Student First Name", type: "text", required: false, defaultValue: "there" },
    { key: "{{creatorName}}", label: "Your Name", type: "text", required: true },
    { key: "{{courseName}}", label: "Course Name", type: "text", required: true },
    { key: "{{certificateUrl}}", label: "Certificate Download URL", type: "url", required: true },
    { key: "{{achievement1}}", label: "Achievement 1", type: "text", required: true },
    { key: "{{achievement2}}", label: "Achievement 2", type: "text", required: true },
    { key: "{{achievement3}}", label: "Achievement 3", type: "text", required: true },
    { key: "{{socialHandle}}", label: "Your Social Handle", type: "text", required: true, placeholder: "@yourname" },
    { key: "{{recommendedCourse1}}", label: "Recommended Course 1", type: "text", required: false },
    { key: "{{recommendedCourse2}}", label: "Recommended Course 2", type: "text", required: false },
    { key: "{{storeUrl}}", label: "Store URL", type: "url", required: false },
  ],

  recommendedTiming: {
    email: "Immediately when certificate is issued",
    social: "Weekly graduate recognition posts",
  },
};

// Export all course milestone templates
export const courseMilestoneTemplates: MarketingCampaignTemplate[] = [
  courseCompletionTemplate,
  moduleCompletionTemplate,
  certificateEarnedTemplate,
];
