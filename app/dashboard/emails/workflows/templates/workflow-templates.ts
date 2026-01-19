import { Node, Edge } from "reactflow";

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  category: "onboarding" | "sales" | "engagement" | "education";
  icon: string;
  estimatedTime: string;
  nodes: Node[];
  edges: Edge[];
};

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "welcome-series",
    name: "Producer Welcome Series",
    description:
      "Welcome new subscribers with a 3-email sequence. Introduce yourself, share free resources, and guide them to your best content.",
    category: "onboarding",
    icon: "wave",
    estimatedTime: "5 days",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "lead_signup",
          description: "When a lead signs up",
        },
      },
      {
        id: "node_1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          subject: "Welcome to the fam! Here's what's next...",
          body: `<p>Hey {{firstName}},</p>

<p>Welcome! I'm hyped you're here.</p>

<p>I'm a music producer just like you, and I've built this community to share everything I've learned about making beats, mixing tracks, and actually finishing music.</p>

<p>Here's what you can expect from me:</p>
<ul>
  <li>Production tips and tutorials</li>
  <li>Free samples and presets</li>
  <li>Behind-the-scenes of my workflow</li>
  <li>Early access to new releases</li>
</ul>

<p>First things first - hit reply and tell me: <strong>What's your biggest struggle in production right now?</strong></p>

<p>I read every response and it helps me create better content for you.</p>

<p>Let's make some heat,<br>{{creatorName}}</p>`,
          templateName: "Welcome Email",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: {
          delayValue: 2,
          delayUnit: "days",
        },
      },
      {
        id: "node_3",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          subject: "Free resources to level up your production",
          body: `<p>Hey {{firstName}},</p>

<p>I put together some of my best free resources to help you improve your production game.</p>

<p><strong>Check these out:</strong></p>

<p>1. <strong>My Production Checklist</strong> - The exact checklist I use before exporting any track</p>

<p>2. <strong>Mixing Cheat Sheet</strong> - EQ and compression starting points for every instrument</p>

<p>3. <strong>Free Sample Pack</strong> - 50+ sounds from my personal collection</p>

<p><a href="{{storeUrl}}">Grab them here (100% free)</a></p>

<p>These are the same resources I wish I had when I was starting out. They would have saved me years of trial and error.</p>

<p>Let me know which one helps you the most!</p>

<p>{{creatorName}}</p>`,
          templateName: "Free Resources Email",
        },
      },
      {
        id: "node_4",
        type: "delay",
        position: { x: 250, y: 480 },
        data: {
          delayValue: 3,
          delayUnit: "days",
        },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          subject: "Ready to take your production to the next level?",
          body: `<p>Hey {{firstName}},</p>

<p>If you've been enjoying the free content, you're going to love what I've got for you next.</p>

<p>I've created courses and sample packs specifically designed to help producers like you:</p>

<ul>
  <li>Learn professional mixing techniques</li>
  <li>Build a library of industry-quality sounds</li>
  <li>Develop your own unique style</li>
  <li>Actually finish tracks (instead of having 100 unfinished projects)</li>
</ul>

<p><a href="{{storeUrl}}">Check out my store</a></p>

<p>And as a thank you for being part of this community, use code <strong>WELCOME15</strong> for 15% off your first purchase.</p>

<p>Keep creating,<br>{{creatorName}}</p>`,
          templateName: "CTA Email",
        },
      },
      {
        id: "node_6",
        type: "action",
        position: { x: 250, y: 720 },
        data: {
          actionType: "add_tag",
          value: "completed-welcome-series",
        },
      },
    ],
    edges: [
      { id: "e0-1", source: "node_0", target: "node_1" },
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
      { id: "e3-4", source: "node_3", target: "node_4" },
      { id: "e4-5", source: "node_4", target: "node_5" },
      { id: "e5-6", source: "node_5", target: "node_6" },
    ],
  },
  {
    id: "purchase-followup",
    name: "Purchase Thank You Sequence",
    description:
      "Thank customers after a purchase, help them get started with their content, and ask for a review.",
    category: "sales",
    icon: "shoppingBag",
    estimatedTime: "7 days",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "product_purchase",
          description: "When a product is purchased",
        },
      },
      {
        id: "node_1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          subject: "You're in! Here's how to access everything",
          body: `<p>Hey {{firstName}},</p>

<p>Thank you so much for your purchase! You just made my day.</p>

<p>Here's how to access your content:</p>

<ol>
  <li>Log in to your account at {{storeUrl}}</li>
  <li>Go to your Library</li>
  <li>Download and start creating!</li>
</ol>

<p><strong>Pro tip:</strong> If you purchased a sample pack, try layering the sounds with your existing library. That's where the magic happens.</p>

<p>If you have any questions or issues accessing your content, just reply to this email. I'm here to help!</p>

<p>Can't wait to hear what you create,<br>{{creatorName}}</p>`,
          templateName: "Thank You Email",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: {
          delayValue: 3,
          delayUnit: "days",
        },
      },
      {
        id: "node_3",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          subject: "How's it going with your new sounds?",
          body: `<p>Hey {{firstName}},</p>

<p>Just checking in! Have you had a chance to use your new content yet?</p>

<p>Here are some ideas to get the most out of it:</p>

<ul>
  <li><strong>For sample packs:</strong> Create a "favorites" folder with your top 10 sounds for quick access</li>
  <li><strong>For courses:</strong> Try to implement one technique from each lesson before moving on</li>
  <li><strong>For presets:</strong> Use them as starting points, then tweak to make them your own</li>
</ul>

<p>Any questions? I'm just a reply away.</p>

<p>{{creatorName}}</p>`,
          templateName: "Check-in Email",
        },
      },
      {
        id: "node_4",
        type: "delay",
        position: { x: 250, y: 480 },
        data: {
          delayValue: 4,
          delayUnit: "days",
        },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          subject: "Quick favor? (takes 30 seconds)",
          body: `<p>Hey {{firstName}},</p>

<p>I hope you're enjoying your purchase!</p>

<p>I have a quick favor to ask - would you mind leaving a review?</p>

<p>It only takes 30 seconds and it really helps other producers discover my content. Plus, your feedback helps me create better stuff in the future.</p>

<p><a href="{{storeUrl}}">Leave a review here</a></p>

<p>Thank you so much for your support. It means the world to me.</p>

<p>{{creatorName}}</p>

<p>P.S. If there's anything I can improve, I'd love to hear that too. Just hit reply!</p>`,
          templateName: "Review Request",
        },
      },
      {
        id: "node_6",
        type: "action",
        position: { x: 250, y: 720 },
        data: {
          actionType: "add_tag",
          value: "review-requested",
        },
      },
    ],
    edges: [
      { id: "e0-1", source: "node_0", target: "node_1" },
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
      { id: "e3-4", source: "node_3", target: "node_4" },
      { id: "e4-5", source: "node_4", target: "node_5" },
      { id: "e5-6", source: "node_5", target: "node_6" },
    ],
  },
  {
    id: "course-onboarding",
    name: "Course Student Onboarding",
    description:
      "Guide new students through your course with scheduled check-ins, encouragement, and completion motivation.",
    category: "education",
    icon: "graduationCap",
    estimatedTime: "14 days",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "product_purchase",
          description: "When enrolled in a course",
        },
      },
      {
        id: "node_1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          subject: "Let's get you set up for success",
          body: `<p>Hey {{firstName}},</p>

<p>Welcome to the course! I'm so excited to have you as a student.</p>

<p>Before you dive in, here's how to get the most out of this course:</p>

<p><strong>1. Set up your workspace</strong><br>
Make sure you have your DAW open while watching the lessons. Learning by doing is 10x more effective than just watching.</p>

<p><strong>2. Take notes</strong><br>
Keep a production journal. Write down techniques that click for you.</p>

<p><strong>3. Don't skip ahead</strong><br>
Each lesson builds on the previous one. Trust the process.</p>

<p><strong>4. Ask questions</strong><br>
Stuck on something? Reply to any of my emails and I'll help you out.</p>

<p><a href="{{courseUrl}}">Start your first lesson now</a></p>

<p>Let's do this,<br>{{creatorName}}</p>`,
          templateName: "Course Welcome",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: {
          delayValue: 3,
          delayUnit: "days",
        },
      },
      {
        id: "node_3",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          subject: "How's the course going?",
          body: `<p>Hey {{firstName}},</p>

<p>Just checking in on your progress!</p>

<p>By now, you should be through the first few lessons. How's it going?</p>

<p><strong>Quick motivation:</strong> Most people who start online courses never finish them. But you're different - you're here because you're serious about improving your craft.</p>

<p>Even if you can only do 15 minutes a day, that adds up. Consistency beats intensity every time.</p>

<p>Hit reply and let me know:</p>
<ul>
  <li>What's been your biggest "aha moment" so far?</li>
  <li>Is there anything you're stuck on?</li>
</ul>

<p>Keep pushing,<br>{{creatorName}}</p>`,
          templateName: "Progress Check-in",
        },
      },
      {
        id: "node_4",
        type: "delay",
        position: { x: 250, y: 480 },
        data: {
          delayValue: 5,
          delayUnit: "days",
        },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          subject: "You're making progress - don't stop now",
          body: `<p>Hey {{firstName}},</p>

<p>You're about halfway through the course (or at least you should be by now!).</p>

<p>This is usually where people start to lose momentum. Don't let that be you.</p>

<p><strong>Remember why you started:</strong></p>
<ul>
  <li>You wanted to level up your production skills</li>
  <li>You wanted to create music you're actually proud of</li>
  <li>You wanted to stand out from other producers</li>
</ul>

<p>Those goals are still there. And you're closer to them than you were a week ago.</p>

<p>The next few lessons are some of the most valuable in the entire course. Don't miss them!</p>

<p><a href="{{courseUrl}}">Continue your course</a></p>

<p>You've got this,<br>{{creatorName}}</p>`,
          templateName: "Mid-course Motivation",
        },
      },
      {
        id: "node_6",
        type: "delay",
        position: { x: 250, y: 720 },
        data: {
          delayValue: 6,
          delayUnit: "days",
        },
      },
      {
        id: "node_7",
        type: "email",
        position: { x: 250, y: 840 },
        data: {
          subject: "Finish strong - you're almost there!",
          body: `<p>Hey {{firstName}},</p>

<p>You're in the home stretch!</p>

<p>The final lessons bring everything together. This is where you'll see how all the individual techniques combine to create professional-sounding tracks.</p>

<p><strong>Your challenge:</strong> After you finish the last lesson, create a track using at least 3 techniques you learned in this course. Then send it to me!</p>

<p>I'd love to hear what you create. Seriously - hit reply with a link to your track when you're done.</p>

<p><a href="{{courseUrl}}">Finish the course</a></p>

<p>Proud of you for making it this far,<br>{{creatorName}}</p>`,
          templateName: "Final Push Email",
        },
      },
      {
        id: "node_8",
        type: "action",
        position: { x: 250, y: 960 },
        data: {
          actionType: "add_tag",
          value: "course-emails-complete",
        },
      },
    ],
    edges: [
      { id: "e0-1", source: "node_0", target: "node_1" },
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
      { id: "e3-4", source: "node_3", target: "node_4" },
      { id: "e4-5", source: "node_4", target: "node_5" },
      { id: "e5-6", source: "node_5", target: "node_6" },
      { id: "e6-7", source: "node_6", target: "node_7" },
      { id: "e7-8", source: "node_7", target: "node_8" },
    ],
  },
  {
    id: "sample-pack-launch",
    name: "Sample Pack Launch",
    description:
      "Promote a new sample pack with a 3-email launch sequence including announcement, social proof, and last chance.",
    category: "sales",
    icon: "music",
    estimatedTime: "5 days",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "manual",
          description: "Manual enrollment for launch",
        },
      },
      {
        id: "node_1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          subject: "It's here - my new sample pack just dropped",
          body: `<p>Hey {{firstName}},</p>

<p>I've been working on this for months, and I'm hyped to finally share it with you.</p>

<p><strong>Introducing [Pack Name]</strong> - [X] sounds designed for [genre/style].</p>

<p>What's inside:</p>
<ul>
  <li>[X] drum loops and one-shots</li>
  <li>[X] melodic loops (keys, synths, guitars)</li>
  <li>[X] bass sounds</li>
  <li>[X] FX and transitions</li>
  <li>Bonus: [Bonus content]</li>
</ul>

<p>Every sound is:</p>
<ul>
  <li>100% royalty-free</li>
  <li>Mixed and ready to drop into your projects</li>
  <li>Key and BPM labeled</li>
</ul>

<p><strong>Launch special:</strong> Get 25% off for the next 48 hours with code LAUNCH25</p>

<p><a href="{{storeUrl}}">Get the pack now</a></p>

<p>Let's make some heat,<br>{{creatorName}}</p>`,
          templateName: "Launch Announcement",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: {
          delayValue: 1,
          delayUnit: "days",
        },
      },
      {
        id: "node_3",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          subject: "Producers are already making fire with this pack",
          body: `<p>Hey {{firstName}},</p>

<p>The response to [Pack Name] has been insane.</p>

<p>Here's what people are saying:</p>

<blockquote style="border-left: 3px solid #3b82f6; padding-left: 16px; margin: 16px 0;">
"These sounds are exactly what I needed for my next project. Already used 5 of them in a beat!" - [Name]
</blockquote>

<blockquote style="border-left: 3px solid #3b82f6; padding-left: 16px; margin: 16px 0;">
"The quality is insane. These drums hit different." - [Name]
</blockquote>

<blockquote style="border-left: 3px solid #3b82f6; padding-left: 16px; margin: 16px 0;">
"Finally a pack that doesn't sound like everything else. Super unique sounds." - [Name]
</blockquote>

<p>I poured months of work into this pack. Every sound was carefully crafted and tested in real productions.</p>

<p><strong>Reminder:</strong> The 25% launch discount ends tomorrow. Use code LAUNCH25 at checkout.</p>

<p><a href="{{storeUrl}}">Grab your copy</a></p>

<p>{{creatorName}}</p>`,
          templateName: "Social Proof Email",
        },
      },
      {
        id: "node_4",
        type: "delay",
        position: { x: 250, y: 480 },
        data: {
          delayValue: 1,
          delayUnit: "days",
        },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          subject: "Last chance - launch pricing ends tonight",
          body: `<p>Hey {{firstName}},</p>

<p>Quick heads up - the 25% launch discount for [Pack Name] ends tonight at midnight.</p>

<p>After that, it goes back to full price.</p>

<p>If you've been on the fence, now's the time to grab it.</p>

<p><strong>What you get:</strong></p>
<ul>
  <li>[X]+ sounds</li>
  <li>Instant download</li>
  <li>100% royalty-free</li>
  <li>Lifetime access</li>
</ul>

<p>Use code <strong>LAUNCH25</strong> at checkout.</p>

<p><a href="{{storeUrl}}">Get it before the price goes up</a></p>

<p>No pressure - I just didn't want you to miss out if this is something you wanted.</p>

<p>{{creatorName}}</p>`,
          templateName: "Last Chance Email",
        },
      },
      {
        id: "node_6",
        type: "action",
        position: { x: 250, y: 720 },
        data: {
          actionType: "add_tag",
          value: "launch-sequence-complete",
        },
      },
    ],
    edges: [
      { id: "e0-1", source: "node_0", target: "node_1" },
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
      { id: "e3-4", source: "node_3", target: "node_4" },
      { id: "e4-5", source: "node_4", target: "node_5" },
      { id: "e5-6", source: "node_5", target: "node_6" },
    ],
  },
  {
    id: "re-engagement",
    name: "Win Back Inactive Subscribers",
    description:
      "Re-engage subscribers who haven't opened emails in a while with a special offer or reminder.",
    category: "engagement",
    icon: "heart",
    estimatedTime: "7 days",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "tag_added",
          description: "When tagged as inactive",
        },
      },
      {
        id: "node_1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          subject: "Hey {{firstName}}, still making beats?",
          body: `<p>Hey {{firstName}},</p>

<p>I noticed you haven't been opening my emails lately.</p>

<p>No worries - I get it. Life gets busy and inboxes get flooded.</p>

<p>But I wanted to reach out because I've dropped some fire content recently that I think you'd dig:</p>

<ul>
  <li>[Recent content/release 1]</li>
  <li>[Recent content/release 2]</li>
  <li>[Recent content/release 3]</li>
</ul>

<p>If you're still interested in leveling up your production, I'd love to keep you in the loop.</p>

<p>Just click below to let me know you're still with me:</p>

<p><a href="{{storeUrl}}">Yeah, keep me updated!</a></p>

<p>If not, no hard feelings. You can unsubscribe anytime using the link at the bottom.</p>

<p>Hope to hear from you,<br>{{creatorName}}</p>`,
          templateName: "Re-engagement Email 1",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: {
          delayValue: 4,
          delayUnit: "days",
        },
      },
      {
        id: "node_3",
        type: "condition",
        position: { x: 250, y: 360 },
        data: {
          conditionType: "opened_email",
          description: "Opened re-engagement email?",
        },
      },
      {
        id: "node_4",
        type: "action",
        position: { x: 100, y: 500 },
        data: {
          actionType: "remove_tag",
          value: "inactive",
        },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 400, y: 500 },
        data: {
          subject: "A gift for you (since we haven't talked in a while)",
          body: `<p>Hey {{firstName}},</p>

<p>Since it's been a minute, I wanted to do something special for you.</p>

<p>Here's a <strong>30% discount</strong> on anything in my store - just because.</p>

<p>Use code: <strong>MISSEDYOU</strong></p>

<p>Valid for the next 48 hours.</p>

<p><a href="{{storeUrl}}">Browse my store</a></p>

<p>Whether you use it or not, I hope you're still making music and crushing it.</p>

<p>{{creatorName}}</p>`,
          templateName: "Win-back Offer",
        },
      },
      {
        id: "node_6",
        type: "delay",
        position: { x: 400, y: 620 },
        data: {
          delayValue: 3,
          delayUnit: "days",
        },
      },
      {
        id: "node_7",
        type: "action",
        position: { x: 400, y: 740 },
        data: {
          actionType: "add_tag",
          value: "winback-complete",
        },
      },
    ],
    edges: [
      { id: "e0-1", source: "node_0", target: "node_1" },
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
      { id: "e3-4", source: "node_3", target: "node_4", sourceHandle: "yes" },
      { id: "e3-5", source: "node_3", target: "node_5", sourceHandle: "no" },
      { id: "e5-6", source: "node_5", target: "node_6" },
      { id: "e6-7", source: "node_6", target: "node_7" },
    ],
  },
  {
    id: "free-download",
    name: "Free Download Delivery",
    description:
      "Automatically deliver a free download (sample pack, preset, etc.) and follow up to build the relationship.",
    category: "onboarding",
    icon: "seedling",
    estimatedTime: "5 days",
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "tag_added",
          description: "When tagged for free download",
        },
      },
      {
        id: "node_1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          subject: "Your free [download name] is ready!",
          body: `<p>Hey {{firstName}},</p>

<p>As promised, here's your free [download name]!</p>

<p style="text-align: center; margin: 24px 0;">
<a href="{{downloadUrl}}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Download Now</a>
</p>

<p><strong>What you're getting:</strong></p>
<ul>
  <li>[Item 1]</li>
  <li>[Item 2]</li>
  <li>[Item 3]</li>
</ul>

<p><strong>Quick tip:</strong> [How to get the most out of this download]</p>

<p>Enjoy! And let me know what you create with it.</p>

<p>{{creatorName}}</p>`,
          templateName: "Free Download Delivery",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: {
          delayValue: 2,
          delayUnit: "days",
        },
      },
      {
        id: "node_3",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          subject: "Did you download it yet?",
          body: `<p>Hey {{firstName}},</p>

<p>Just wanted to make sure you got your free [download name]!</p>

<p>If you haven't downloaded it yet, here's the link again:</p>

<p><a href="{{downloadUrl}}">Download here</a></p>

<p>And if you already did - how do you like it? I'd love to hear your feedback.</p>

<p>Also, here's a quick tutorial on how I use [the download] in my own productions: [link to tutorial/video if you have one]</p>

<p>{{creatorName}}</p>`,
          templateName: "Download Follow-up",
        },
      },
      {
        id: "node_4",
        type: "delay",
        position: { x: 250, y: 480 },
        data: {
          delayValue: 3,
          delayUnit: "days",
        },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          subject: "Want more like this?",
          body: `<p>Hey {{firstName}},</p>

<p>If you enjoyed the free [download name], you'll love what else I've got.</p>

<p>My most popular products:</p>

<ul>
  <li><strong>[Product 1]</strong> - [brief description]</li>
  <li><strong>[Product 2]</strong> - [brief description]</li>
  <li><strong>[Product 3]</strong> - [brief description]</li>
</ul>

<p>As a thank you for joining my list, here's 15% off your first purchase:</p>

<p>Use code: <strong>FIRST15</strong></p>

<p><a href="{{storeUrl}}">Browse my store</a></p>

<p>{{creatorName}}</p>`,
          templateName: "Upsell Email",
        },
      },
      {
        id: "node_6",
        type: "action",
        position: { x: 250, y: 720 },
        data: {
          actionType: "add_tag",
          value: "free-download-sequence-complete",
        },
      },
    ],
    edges: [
      { id: "e0-1", source: "node_0", target: "node_1" },
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
      { id: "e3-4", source: "node_3", target: "node_4" },
      { id: "e4-5", source: "node_4", target: "node_5" },
      { id: "e5-6", source: "node_5", target: "node_6" },
    ],
  },
];

export const templateCategories = [
  { id: "all", label: "All Templates", icon: "grid" },
  { id: "onboarding", label: "Onboarding", icon: "userPlus" },
  { id: "sales", label: "Sales & Launches", icon: "dollarSign" },
  { id: "engagement", label: "Engagement", icon: "heart" },
  { id: "education", label: "Courses", icon: "graduationCap" },
];
