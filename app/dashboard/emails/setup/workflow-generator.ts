import { Node, Edge } from "reactflow";

export type GeneratedWorkflow = {
  id: string;
  name: string;
  description: string;
  type: "welcome" | "purchase" | "course" | "winback";
  triggerDescription: string;
  nodes: Node[];
  edges: Edge[];
};

type ToneOption = "professional" | "casual" | "hype";

type GeneratorInput = {
  storeName: string;
  creatorName: string;
  tone: ToneOption;
  products: any[];
  courses: any[];
  storeUrl: string;
};

// Tone-specific greetings and phrases
const toneConfig = {
  professional: {
    greeting: "Hello",
    thanks: "Thank you",
    closing: "Best regards",
    excited: "I'm pleased to",
    welcome: "Welcome to",
    cta: "Get started",
  },
  casual: {
    greeting: "Hey",
    thanks: "Thanks so much",
    closing: "Cheers",
    excited: "I'm stoked to",
    welcome: "Welcome to the fam!",
    cta: "Let's go",
  },
  hype: {
    greeting: "Yo",
    thanks: "THANK YOU",
    closing: "Let's get it",
    excited: "I'm HYPED to",
    welcome: "LET'S GO! Welcome to",
    cta: "Let's make some heat",
  },
};

export function generateSmartWorkflows(input: GeneratorInput): GeneratedWorkflow[] {
  const { storeName, creatorName, tone, products, courses, storeUrl } = input;
  const t = toneConfig[tone];
  const workflows: GeneratedWorkflow[] = [];

  // Always create welcome series
  workflows.push(generateWelcomeWorkflow(storeName, creatorName, tone, products, courses));

  // Create purchase follow-up if they have products
  if (products.length > 0) {
    workflows.push(generatePurchaseWorkflow(storeName, creatorName, tone, products));
  }

  // Create course onboarding for each course (max 3)
  courses.slice(0, 3).forEach((course: any) => {
    workflows.push(generateCourseWorkflow(storeName, creatorName, tone, course));
  });

  // Always create win-back workflow
  workflows.push(generateWinbackWorkflow(storeName, creatorName, tone));

  return workflows;
}

function generateWelcomeWorkflow(
  storeName: string,
  creatorName: string,
  tone: ToneOption,
  products: any[],
  courses: any[]
): GeneratedWorkflow {
  const t = toneConfig[tone];

  // Determine what to mention based on what they sell
  const hasSamplePacks = products.some((p: any) =>
    ["sample-pack", "preset-pack", "midi-pack"].includes(p.productCategory)
  );
  const hasCourses = courses.length > 0;
  const hasPresets = products.some((p: any) =>
    ["preset-pack", "abletonPreset", "effectChain"].includes(p.productCategory || p.productType)
  );

  let whatYouGet = "";
  if (hasSamplePacks && hasCourses) {
    whatYouGet = "sample packs, courses, and exclusive content";
  } else if (hasSamplePacks) {
    whatYouGet = "sample packs, sounds, and production tips";
  } else if (hasCourses) {
    whatYouGet = "courses, tutorials, and production knowledge";
  } else if (hasPresets) {
    whatYouGet = "presets, production tools, and tips";
  } else {
    whatYouGet = "exclusive content and production resources";
  }

  const email1Body =
    tone === "hype"
      ? `<p>Yo {{firstName}}!</p>

<p>WELCOME TO THE FAM! I'm so hyped you're here.</p>

<p>I'm ${creatorName}, and I've been making beats and helping producers level up for years. Now I'm bringing all that knowledge to you.</p>

<p><strong>Here's what you're gonna get:</strong></p>
<ul>
  <li>Exclusive ${whatYouGet}</li>
  <li>Behind-the-scenes of my production workflow</li>
  <li>Tips that actually work (no fluff)</li>
  <li>Early access + discounts on new releases</li>
</ul>

<p>First things first - hit reply and tell me: <strong>What's your biggest struggle in production right now?</strong></p>

<p>I read EVERY response. Let's get it!</p>

<p>${creatorName}</p>`
      : tone === "casual"
        ? `<p>Hey {{firstName}}!</p>

<p>Welcome! I'm so glad you're here.</p>

<p>I'm ${creatorName}, and I've been on this music production journey for a while now. I've learned a ton along the way, and I'm excited to share it all with you.</p>

<p><strong>Here's what you can expect from me:</strong></p>
<ul>
  <li>${whatYouGet}</li>
  <li>Behind-the-scenes looks at my workflow</li>
  <li>Tips and tricks I wish I knew when starting out</li>
  <li>Early access and discounts on new stuff</li>
</ul>

<p>Quick question - hit reply and let me know: <strong>What's your biggest challenge in production right now?</strong></p>

<p>I read every response and it helps me create better content for you.</p>

<p>Talk soon,<br>${creatorName}</p>`
        : `<p>Hello {{firstName}},</p>

<p>Welcome to ${storeName}. I'm pleased to have you here.</p>

<p>I'm ${creatorName}, and I specialize in helping music producers elevate their craft. Through this community, you'll gain access to professional-grade resources and insights.</p>

<p><strong>What you can expect:</strong></p>
<ul>
  <li>Access to ${whatYouGet}</li>
  <li>Professional production techniques and workflows</li>
  <li>Industry insights and best practices</li>
  <li>Priority access to new releases</li>
</ul>

<p>I'd love to hear from you. What aspect of music production are you looking to improve?</p>

<p>Best regards,<br>${creatorName}</p>`;

  const email2Body =
    tone === "hype"
      ? `<p>Yo {{firstName}}!</p>

<p>Quick tip that's gonna change your game:</p>

<p><strong>Stop making beats. Start finishing them.</strong></p>

<p>Seriously - the #1 thing holding most producers back isn't their skills, it's their 47 unfinished projects sitting in a folder.</p>

<p>Here's what I do: I set a timer for 2 hours. Whatever state the beat is in when that timer goes off? That's the final version. Export it. Move on.</p>

<p>You learn WAY more from finishing 10 okay beats than from having 100 "almost perfect" ones.</p>

<p>Try it this week and let me know how it goes!</p>

<p>Keep grinding,<br>${creatorName}</p>`
      : tone === "casual"
        ? `<p>Hey {{firstName}},</p>

<p>Wanted to share a quick tip that helped me a lot:</p>

<p><strong>The best producers aren't the most talented - they're the ones who finish tracks.</strong></p>

<p>I used to have hundreds of 8-bar loops that never went anywhere. Sound familiar?</p>

<p>What changed for me: I started setting a 2-hour limit on beats. When time's up, I export whatever I have. Done.</p>

<p>It's not about perfection - it's about momentum. You learn more from finishing 10 beats than from endlessly tweaking one.</p>

<p>Give it a try and let me know how it goes!</p>

<p>${creatorName}</p>`
        : `<p>Hello {{firstName}},</p>

<p>I wanted to share a principle that's been instrumental in my development as a producer:</p>

<p><strong>Completion over perfection.</strong></p>

<p>Many producers struggle not because of lack of talent, but because they never finish tracks. They accumulate countless works-in-progress that never see the light of day.</p>

<p>My recommendation: Set firm time constraints on your projects. When the time is up, export and move forward. The learning that comes from completing projects far outweighs the diminishing returns of endless refinement.</p>

<p>I'd encourage you to try this approach with your next project.</p>

<p>Best regards,<br>${creatorName}</p>`;

  const email3Body =
    tone === "hype"
      ? `<p>{{firstName}}!</p>

<p>Alright, you've been on the list for a few days now. Time to take things to the next level.</p>

<p>I've got ${products.length > 0 ? "sample packs, " : ""}${courses.length > 0 ? "courses, " : ""}and resources designed to fast-track your production skills.</p>

<p>And because you're part of the fam, here's <strong>15% off your first purchase</strong>:</p>

<p>Use code: <strong>WELCOME15</strong></p>

<p><a href="{{storeUrl}}">Check out the store</a></p>

<p>No pressure - just wanted you to know it's there when you're ready.</p>

<p>Keep making heat!<br>${creatorName}</p>`
      : tone === "casual"
        ? `<p>Hey {{firstName}},</p>

<p>Now that you've been around for a bit, I wanted to let you know about some resources that might help you level up.</p>

<p>I've created ${products.length > 0 ? "sample packs, " : ""}${courses.length > 0 ? "courses, " : ""}and other stuff specifically for producers who want to improve their craft.</p>

<p>As a thank you for joining the community, here's <strong>15% off your first purchase</strong>:</p>

<p>Use code: <strong>WELCOME15</strong></p>

<p><a href="{{storeUrl}}">Browse the store</a></p>

<p>No pressure at all - just wanted you to have it when you're ready.</p>

<p>Keep creating,<br>${creatorName}</p>`
        : `<p>Hello {{firstName}},</p>

<p>I wanted to introduce you to some resources I've developed that may be valuable for your production journey.</p>

<p>My catalog includes ${products.length > 0 ? "professional sample libraries, " : ""}${courses.length > 0 ? "comprehensive courses, " : ""}and production tools designed to elevate your work.</p>

<p>As a welcome to the community, I'd like to offer you <strong>15% off your first purchase</strong>:</p>

<p>Code: <strong>WELCOME15</strong></p>

<p><a href="{{storeUrl}}">View the catalog</a></p>

<p>Please don't hesitate to reach out if you have any questions.</p>

<p>Best regards,<br>${creatorName}</p>`;

  return {
    id: "welcome-series",
    name: "Welcome Series",
    description: "Automatically welcome new subscribers and introduce them to your content",
    type: "welcome",
    triggerDescription: "When someone joins your email list",
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
          subject:
            tone === "hype"
              ? "LET'S GO! Welcome to the fam"
              : tone === "casual"
                ? "Welcome! Here's what's next..."
                : `Welcome to ${storeName}`,
          body: email1Body,
          templateName: "Welcome Email",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: { delayValue: 2, delayUnit: "days" },
      },
      {
        id: "node_3",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          subject:
            tone === "hype"
              ? "The #1 thing holding you back"
              : tone === "casual"
                ? "A tip that changed everything for me"
                : "A principle for production success",
          body: email2Body,
          templateName: "Value Email",
        },
      },
      {
        id: "node_4",
        type: "delay",
        position: { x: 250, y: 480 },
        data: { delayValue: 3, delayUnit: "days" },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          subject:
            tone === "hype"
              ? "Ready to level up? (15% off inside)"
              : tone === "casual"
                ? "Something for you (15% off)"
                : "A special offer for you",
          body: email3Body,
          templateName: "CTA Email",
        },
      },
      {
        id: "node_6",
        type: "action",
        position: { x: 250, y: 720 },
        data: { actionType: "add_tag", value: "completed-welcome" },
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
  };
}

function generatePurchaseWorkflow(
  storeName: string,
  creatorName: string,
  tone: ToneOption,
  products: any[]
): GeneratedWorkflow {
  const t = toneConfig[tone];

  // Determine product type for tips
  const hasSamplePacks = products.some((p: any) =>
    ["sample-pack", "preset-pack", "midi-pack"].includes(p.productCategory)
  );

  const email1Body =
    tone === "hype"
      ? `<p>YO {{firstName}}!</p>

<p>THANK YOU for your purchase! You just made my day.</p>

<p><strong>Here's how to get your stuff:</strong></p>
<ol>
  <li>Log in to your account</li>
  <li>Go to your Library</li>
  <li>Download and start creating!</li>
</ol>

<p>${hasSamplePacks ? "<strong>Pro tip:</strong> Don't just browse the sounds - pick your top 10 favorites and put them in a separate folder. Those will become your secret weapons." : "<strong>Pro tip:</strong> Don't just download it - open your DAW right now and try it out while you're motivated!"}</p>

<p>Can't wait to hear what you create!</p>

<p>${creatorName}</p>`
      : tone === "casual"
        ? `<p>Hey {{firstName}},</p>

<p>Thank you so much for your purchase! Seriously, it means a lot.</p>

<p><strong>Here's how to access your content:</strong></p>
<ol>
  <li>Log in to your account</li>
  <li>Head to your Library</li>
  <li>Download and start creating!</li>
</ol>

<p>${hasSamplePacks ? "<strong>Quick tip:</strong> Create a 'favorites' folder and drag your top picks there. It'll save you so much time when you're in the zone." : "<strong>Quick tip:</strong> Try to use what you bought in your next session while it's fresh!"}</p>

<p>If you have any issues, just reply to this email. I'm here to help!</p>

<p>Happy creating,<br>${creatorName}</p>`
        : `<p>Hello {{firstName}},</p>

<p>Thank you for your purchase. I appreciate your support.</p>

<p><strong>To access your content:</strong></p>
<ol>
  <li>Log in to your account at ${storeName}</li>
  <li>Navigate to your Library</li>
  <li>Download your files</li>
</ol>

<p>Should you have any questions or encounter any issues, please don't hesitate to reply to this email.</p>

<p>Best regards,<br>${creatorName}</p>`;

  const email2Body =
    tone === "hype"
      ? `<p>{{firstName}}!</p>

<p>Quick check-in - have you had a chance to use your new content yet?</p>

<p>If you made something with it, I'd LOVE to hear it. Seriously - reply with a link!</p>

<p>And if you're stuck or have questions, I got you. Just hit reply.</p>

<p>Keep creating fire!<br>${creatorName}</p>`
      : tone === "casual"
        ? `<p>Hey {{firstName}},</p>

<p>Just checking in - how's it going with your purchase?</p>

<p>Have you had a chance to try it out yet? I'd love to hear how it's working for you.</p>

<p>And if you've made anything with it, feel free to share! I always enjoy seeing what people create.</p>

<p>${creatorName}</p>`
        : `<p>Hello {{firstName}},</p>

<p>I wanted to follow up on your recent purchase.</p>

<p>Have you had an opportunity to explore the content? I'd welcome any feedback you might have.</p>

<p>If you have any questions or need assistance, please let me know.</p>

<p>Best regards,<br>${creatorName}</p>`;

  const email3Body =
    tone === "hype"
      ? `<p>{{firstName}}!</p>

<p>Quick favor - would you mind leaving a review?</p>

<p>It takes like 30 seconds and it REALLY helps other producers find my stuff. Plus your feedback helps me make better content.</p>

<p>Thanks for being part of this!<br>${creatorName}</p>`
      : tone === "casual"
        ? `<p>Hey {{firstName}},</p>

<p>Hope you're enjoying your purchase!</p>

<p>I have a small favor to ask - would you mind leaving a quick review? It really helps other producers discover my content, and your feedback helps me improve.</p>

<p>Only takes about 30 seconds!</p>

<p>Thanks so much,<br>${creatorName}</p>`
        : `<p>Hello {{firstName}},</p>

<p>I hope you've been finding value in your purchase.</p>

<p>If you have a moment, I would greatly appreciate if you could leave a review. Your feedback helps other producers make informed decisions and helps me improve my offerings.</p>

<p>Thank you for your time and support.</p>

<p>Best regards,<br>${creatorName}</p>`;

  return {
    id: "purchase-followup",
    name: "Purchase Follow-up",
    description: "Thank customers, check in on their progress, and request reviews",
    type: "purchase",
    triggerDescription: "When someone purchases any product",
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
          subject:
            tone === "hype"
              ? "YOU'RE IN! Here's your stuff"
              : tone === "casual"
                ? "You're in! Here's how to access everything"
                : "Thank you for your purchase",
          body: email1Body,
          templateName: "Thank You Email",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: { delayValue: 3, delayUnit: "days" },
      },
      {
        id: "node_3",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          subject:
            tone === "hype"
              ? "Made anything yet?"
              : tone === "casual"
                ? "How's it going?"
                : "Following up on your purchase",
          body: email2Body,
          templateName: "Check-in Email",
        },
      },
      {
        id: "node_4",
        type: "delay",
        position: { x: 250, y: 480 },
        data: { delayValue: 4, delayUnit: "days" },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          subject:
            tone === "hype"
              ? "Quick favor? (30 sec)"
              : tone === "casual"
                ? "Quick favor?"
                : "Would you mind leaving a review?",
          body: email3Body,
          templateName: "Review Request",
        },
      },
      {
        id: "node_6",
        type: "action",
        position: { x: 250, y: 720 },
        data: { actionType: "add_tag", value: "review-requested" },
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
  };
}

function generateCourseWorkflow(
  storeName: string,
  creatorName: string,
  tone: ToneOption,
  course: any
): GeneratedWorkflow {
  const courseName = course.title || "the course";
  const courseDescription = course.description || "";

  const email1Body =
    tone === "hype"
      ? `<p>LET'S GO {{firstName}}!</p>

<p>You just enrolled in <strong>${courseName}</strong>! This is gonna be good.</p>

<p><strong>Here's how to crush it:</strong></p>
<ol>
  <li><strong>Set up your workspace</strong> - Have your DAW open while watching. Learn by doing!</li>
  <li><strong>Don't skip ahead</strong> - Each lesson builds on the last. Trust the process.</li>
  <li><strong>Take action</strong> - Try each technique before moving to the next lesson.</li>
  <li><strong>Ask questions</strong> - Reply to any email if you get stuck.</li>
</ol>

<p>Let's make some heat!</p>

<p>${creatorName}</p>`
      : tone === "casual"
        ? `<p>Hey {{firstName}},</p>

<p>Welcome to <strong>${courseName}</strong>! I'm excited to have you as a student.</p>

<p><strong>Here's how to get the most out of this:</strong></p>
<ol>
  <li><strong>Have your DAW open</strong> - Learning by doing is 10x more effective</li>
  <li><strong>Go in order</strong> - Each lesson builds on the previous one</li>
  <li><strong>Practice each technique</strong> - Don't just watch, apply!</li>
  <li><strong>Ask me anything</strong> - Just reply to this email</li>
</ol>

<p>Let's do this!</p>

<p>${creatorName}</p>`
        : `<p>Hello {{firstName}},</p>

<p>Welcome to <strong>${courseName}</strong>. I'm pleased to have you as a student.</p>

<p><strong>To maximize your learning:</strong></p>
<ol>
  <li>Have your DAW ready while going through lessons</li>
  <li>Complete lessons in sequential order</li>
  <li>Practice each technique before proceeding</li>
  <li>Don't hesitate to reach out with questions</li>
</ol>

<p>I look forward to supporting your progress.</p>

<p>Best regards,<br>${creatorName}</p>`;

  const email2Body =
    tone === "hype"
      ? `<p>Yo {{firstName}}!</p>

<p>How's ${courseName} treating you?</p>

<p>By now you should be a few lessons in. Keep that momentum going!</p>

<p>Remember: consistency beats intensity. Even 20 minutes a day adds up fast.</p>

<p>What's been your biggest takeaway so far? Hit reply and let me know!</p>

<p>${creatorName}</p>`
      : tone === "casual"
        ? `<p>Hey {{firstName}},</p>

<p>Just checking in on your progress with ${courseName}!</p>

<p>How's it going so far? Any "aha" moments yet?</p>

<p>Remember, even 15-20 minutes a day is enough. Consistency is key.</p>

<p>Let me know if you have any questions!</p>

<p>${creatorName}</p>`
        : `<p>Hello {{firstName}},</p>

<p>I wanted to check on your progress with ${courseName}.</p>

<p>By this point, you should have completed the initial lessons. How are you finding the material?</p>

<p>If you have any questions or need clarification on any concepts, please don't hesitate to reach out.</p>

<p>Best regards,<br>${creatorName}</p>`;

  const email3Body =
    tone === "hype"
      ? `<p>{{firstName}}!</p>

<p>You're getting close to the finish line on ${courseName}!</p>

<p>The last lessons bring everything together. Don't stop now - you're almost there!</p>

<p><strong>Challenge:</strong> When you finish, create a track using at least 3 things you learned. Then send it to me!</p>

<p>I wanna hear what you make. Let's GO!</p>

<p>${creatorName}</p>`
      : tone === "casual"
        ? `<p>Hey {{firstName}},</p>

<p>You're in the home stretch with ${courseName}!</p>

<p>The final lessons tie everything together - this is where it all clicks.</p>

<p><strong>My challenge to you:</strong> After you finish, make a track using what you learned. I'd love to hear it!</p>

<p>Keep going - you've got this!</p>

<p>${creatorName}</p>`
        : `<p>Hello {{firstName}},</p>

<p>You're approaching the conclusion of ${courseName}.</p>

<p>The final lessons synthesize all the concepts covered. I encourage you to complete them and then apply your knowledge to a practical project.</p>

<p>I would be delighted to hear about your results.</p>

<p>Best regards,<br>${creatorName}</p>`;

  const safeCourseName = courseName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  return {
    id: `course-${safeCourseName}`,
    name: `${courseName} - Student Onboarding`,
    description: `Guide students through ${courseName} with check-ins and encouragement`,
    type: "course",
    triggerDescription: `When someone enrolls in ${courseName}`,
    nodes: [
      {
        id: "node_0",
        type: "trigger",
        position: { x: 250, y: 0 },
        data: {
          triggerType: "product_purchase",
          courseId: course._id,
          courseName: courseName,
          description: `When enrolled in ${courseName}`,
        },
      },
      {
        id: "node_1",
        type: "email",
        position: { x: 250, y: 120 },
        data: {
          subject:
            tone === "hype"
              ? `LET'S GO! Welcome to ${courseName}`
              : tone === "casual"
                ? `Welcome to ${courseName}! Let's get started`
                : `Welcome to ${courseName}`,
          body: email1Body,
          templateName: "Course Welcome",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: { delayValue: 3, delayUnit: "days" },
      },
      {
        id: "node_3",
        type: "email",
        position: { x: 250, y: 360 },
        data: {
          subject:
            tone === "hype"
              ? "How's the course going?!"
              : tone === "casual"
                ? "How's it going?"
                : "Checking on your progress",
          body: email2Body,
          templateName: "Progress Check-in",
        },
      },
      {
        id: "node_4",
        type: "delay",
        position: { x: 250, y: 480 },
        data: { delayValue: 7, delayUnit: "days" },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 250, y: 600 },
        data: {
          subject:
            tone === "hype"
              ? "FINISH STRONG! You're almost there"
              : tone === "casual"
                ? "You're almost there!"
                : "Approaching course completion",
          body: email3Body,
          templateName: "Final Push",
        },
      },
      {
        id: "node_6",
        type: "action",
        position: { x: 250, y: 720 },
        data: { actionType: "add_tag", value: `${safeCourseName}-emails-complete` },
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
  };
}

function generateWinbackWorkflow(
  storeName: string,
  creatorName: string,
  tone: ToneOption
): GeneratedWorkflow {
  const email1Body =
    tone === "hype"
      ? `<p>Yo {{firstName}}!</p>

<p>Haven't seen you around lately - everything good?</p>

<p>I've been dropping some fire content recently and wanted to make sure you didn't miss it.</p>

<p>Still making beats? Hit reply and let me know what you've been working on!</p>

<p>${creatorName}</p>`
      : tone === "casual"
        ? `<p>Hey {{firstName}},</p>

<p>I noticed you haven't been opening my emails lately. No worries - I get it, life gets busy!</p>

<p>Just wanted to check in and make sure you're still interested in production tips and content.</p>

<p>If you are, just reply to this email and say hi! I'd love to hear what you've been working on.</p>

<p>${creatorName}</p>`
        : `<p>Hello {{firstName}},</p>

<p>I noticed it's been a while since you've engaged with my content.</p>

<p>I wanted to reach out and ensure you're still interested in receiving production resources and updates.</p>

<p>If so, I'd appreciate a quick reply. If your interests have changed, no problem at all.</p>

<p>Best regards,<br>${creatorName}</p>`;

  const email2Body =
    tone === "hype"
      ? `<p>{{firstName}}!</p>

<p>Alright, one more shot - I've got a special gift for you.</p>

<p><strong>30% off ANYTHING</strong> in my store. Just because.</p>

<p>Code: <strong>COMEBACK30</strong></p>

<p>Valid for 48 hours. No pressure - just wanted you to have it.</p>

<p>Hope to see you around!</p>

<p>${creatorName}</p>`
      : tone === "casual"
        ? `<p>Hey {{firstName}},</p>

<p>Since it's been a while, I wanted to give you something special.</p>

<p>Here's <strong>30% off anything</strong> in my store:</p>

<p>Code: <strong>COMEBACK30</strong></p>

<p>Valid for the next 48 hours. No strings attached!</p>

<p>Hope you're still making music. Would love to have you back.</p>

<p>${creatorName}</p>`
        : `<p>Hello {{firstName}},</p>

<p>As it's been some time since we've connected, I'd like to offer you a special discount.</p>

<p>Please use code <strong>COMEBACK30</strong> for 30% off any purchase.</p>

<p>This offer is valid for 48 hours.</p>

<p>I hope to hear from you.</p>

<p>Best regards,<br>${creatorName}</p>`;

  return {
    id: "winback",
    name: "Win Back Inactive Subscribers",
    description: "Re-engage subscribers who haven't opened emails in a while",
    type: "winback",
    triggerDescription: "When subscriber is tagged as inactive",
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
          subject:
            tone === "hype"
              ? "{{firstName}}! You still there?"
              : tone === "casual"
                ? "Hey {{firstName}}, still making music?"
                : "We miss you, {{firstName}}",
          body: email1Body,
          templateName: "Re-engagement Email",
        },
      },
      {
        id: "node_2",
        type: "delay",
        position: { x: 250, y: 240 },
        data: { delayValue: 4, delayUnit: "days" },
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
        data: { actionType: "remove_tag", value: "inactive" },
      },
      {
        id: "node_5",
        type: "email",
        position: { x: 400, y: 500 },
        data: {
          subject:
            tone === "hype"
              ? "A gift for you (30% off!)"
              : tone === "casual"
                ? "A little gift for you"
                : "A special offer for you",
          body: email2Body,
          templateName: "Win-back Offer",
        },
      },
      {
        id: "node_6",
        type: "action",
        position: { x: 400, y: 620 },
        data: { actionType: "add_tag", value: "winback-attempted" },
      },
    ],
    edges: [
      { id: "e0-1", source: "node_0", target: "node_1" },
      { id: "e1-2", source: "node_1", target: "node_2" },
      { id: "e2-3", source: "node_2", target: "node_3" },
      { id: "e3-4", source: "node_3", target: "node_4", sourceHandle: "yes" },
      { id: "e3-5", source: "node_3", target: "node_5", sourceHandle: "no" },
      { id: "e5-6", source: "node_5", target: "node_6" },
    ],
  };
}
