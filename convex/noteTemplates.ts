import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create default note templates for new users
 * Call this when a user first accesses the notes system
 */
export const createDefaultTemplates = internalMutation({
  args: {
    userId: v.string(),
  },
  returns: v.array(v.id("noteTemplates")),
  handler: async (ctx, args) => {
    const templates = [
      {
        name: "Course Planning Template",
        description: "Structure for planning a comprehensive course",
        category: "Course Planning",
        icon: "🎓",
        content: `<h1>📚 Course Title: [Your Course Name]</h1>

<h2>🎯 Course Overview</h2>
<p><strong>Target Audience:</strong> [Who is this course for?]</p>
<p><strong>Skill Level:</strong> [Beginner/Intermediate/Advanced]</p>
<p><strong>Duration:</strong> [How long will it take to complete?]</p>
<p><strong>Prerequisites:</strong> [What should students know before starting?]</p>

<h2>🎯 Learning Objectives</h2>
<p>By the end of this course, students will be able to:</p>
<ul>
  <li>[ ] [Objective 1]</li>
  <li>[ ] [Objective 2]</li>
  <li>[ ] [Objective 3]</li>
  <li>[ ] [Objective 4]</li>
</ul>

<h2>📋 Course Outline</h2>

<h3>Module 1: [Module Name]</h3>
<ul>
  <li>Lesson 1.1: [Lesson Name]</li>
  <li>Lesson 1.2: [Lesson Name]</li>
  <li>Lesson 1.3: [Lesson Name]</li>
</ul>

<h3>Module 2: [Module Name]</h3>
<ul>
  <li>Lesson 2.1: [Lesson Name]</li>
  <li>Lesson 2.2: [Lesson Name]</li>
  <li>Lesson 2.3: [Lesson Name]</li>
</ul>

<h3>Module 3: [Module Name]</h3>
<ul>
  <li>Lesson 3.1: [Lesson Name]</li>
  <li>Lesson 3.2: [Lesson Name]</li>
  <li>Lesson 3.3: [Lesson Name]</li>
</ul>

<h2>📝 Assessment Strategy</h2>
<ul>
  <li>[ ] Quizzes after each module</li>
  <li>[ ] Hands-on projects</li>
  <li>[ ] Final capstone project</li>
  <li>[ ] Peer review activities</li>
</ul>

<h2>📚 Resources & Materials</h2>
<ul>
  <li>[ ] Required textbooks/readings</li>
  <li>[ ] Video resources</li>
  <li>[ ] Tools and software needed</li>
  <li>[ ] Additional reference materials</li>
</ul>

<h2>💡 Ideas & Notes</h2>
<p>[Space for brainstorming and additional thoughts]</p>`,
        tags: ["course-planning", "education", "structure"],
      },
      
      {
        name: "Research Notes Template",
        description: "Organize research findings and insights",
        category: "Research",
        icon: "🔍",
        content: `<h1>🔍 Research Topic: [Topic Name]</h1>

<h2>📊 Research Question</h2>
<p><strong>Primary Question:</strong> [What are you trying to understand or solve?]</p>
<p><strong>Sub-questions:</strong></p>
<ul>
  <li>[Sub-question 1]</li>
  <li>[Sub-question 2]</li>
  <li>[Sub-question 3]</li>
</ul>

<h2>🎯 Research Objectives</h2>
<ul>
  <li>[ ] [Objective 1]</li>
  <li>[ ] [Objective 2]</li>
  <li>[ ] [Objective 3]</li>
</ul>

<h2>📚 Key Sources</h2>

<h3>📖 Academic Papers</h3>
<ul>
  <li><strong>[Author, Year]:</strong> [Title] - [Key finding or relevance]</li>
  <li><strong>[Author, Year]:</strong> [Title] - [Key finding or relevance]</li>
</ul>

<h3>🌐 Online Resources</h3>
<ul>
  <li><strong>[Website/Platform]:</strong> <a href="[URL]">[Title]</a> - [Key insight]</li>
  <li><strong>[Website/Platform]:</strong> <a href="[URL]">[Title]</a> - [Key insight]</li>
</ul>

<h2>💡 Key Findings</h2>
<blockquote>
<p><strong>Finding 1:</strong> [Detailed description]<br>
<em>Source: [Citation]</em></p>
</blockquote>

<blockquote>
<p><strong>Finding 2:</strong> [Detailed description]<br>
<em>Source: [Citation]</em></p>
</blockquote>

<h2>🤔 Analysis & Insights</h2>
<p>[Your interpretation of the findings]</p>

<h2>❓ Questions for Further Investigation</h2>
<ul>
  <li>[ ] [Question 1]</li>
  <li>[ ] [Question 2]</li>
  <li>[ ] [Question 3]</li>
</ul>

<h2>📝 Next Steps</h2>
<ul>
  <li>[ ] [Action item 1]</li>
  <li>[ ] [Action item 2]</li>
  <li>[ ] [Action item 3]</li>
</ul>`,
        tags: ["research", "analysis", "sources"],
      },

      {
        name: "Meeting Notes Template",
        description: "Capture meeting discussions and action items",
        category: "Meetings",
        icon: "🤝",
        content: `<h1>🤝 Meeting: [Meeting Title]</h1>

<h2>📋 Meeting Details</h2>
<p><strong>Date:</strong> [Date]</p>
<p><strong>Time:</strong> [Start Time] - [End Time]</p>
<p><strong>Location/Platform:</strong> [Physical location or video call link]</p>

<h2>👥 Attendees</h2>
<ul>
  <li>[Name 1] - [Role]</li>
  <li>[Name 2] - [Role]</li>
  <li>[Name 3] - [Role]</li>
</ul>

<h2>🎯 Agenda</h2>
<ul>
  <li>[ ] [Agenda item 1]</li>
  <li>[ ] [Agenda item 2]</li>
  <li>[ ] [Agenda item 3]</li>
  <li>[ ] [Agenda item 4]</li>
</ul>

<h2>💬 Discussion Points</h2>

<h3>[Topic 1]</h3>
<ul>
  <li>[Key point discussed]</li>
  <li>[Another important point]</li>
  <li><strong>Decision:</strong> [What was decided?]</li>
</ul>

<h3>[Topic 2]</h3>
<ul>
  <li>[Key point discussed]</li>
  <li>[Another important point]</li>
  <li><strong>Decision:</strong> [What was decided?]</li>
</ul>

<h2>✅ Action Items</h2>
<ul>
  <li>[ ] <strong>[Assignee]:</strong> [Task description] - <em>Due: [Date]</em></li>
  <li>[ ] <strong>[Assignee]:</strong> [Task description] - <em>Due: [Date]</em></li>
  <li>[ ] <strong>[Assignee]:</strong> [Task description] - <em>Due: [Date]</em></li>
</ul>

<h2>📊 Key Decisions Made</h2>
<ol>
  <li>[Decision 1]</li>
  <li>[Decision 2]</li>
  <li>[Decision 3]</li>
</ol>

<h2>🔄 Follow-up Items</h2>
<ul>
  <li>[ ] [Item to discuss in next meeting]</li>
  <li>[ ] [Item requiring further research]</li>
  <li>[ ] [Item pending external input]</li>
</ul>

<h2>📅 Next Meeting</h2>
<p><strong>Date:</strong> [Next meeting date]</p>
<p><strong>Focus:</strong> [Main topics for next meeting]</p>`,
        tags: ["meetings", "collaboration", "action-items"],
      },

      {
        name: "Learning Journal Template",
        description: "Document your learning journey and insights",
        category: "Learning",
        icon: "📖",
        content: `<h1>📖 Learning Journal: [Topic/Course Name]</h1>

<h2>📅 Date: [Today's Date]</h2>

<h2>🎯 Learning Goals</h2>
<p><strong>What I want to learn today:</strong></p>
<ul>
  <li>[ ] [Goal 1]</li>
  <li>[ ] [Goal 2]</li>
  <li>[ ] [Goal 3]</li>
</ul>

<h2>📚 What I Learned</h2>

<h3>🔑 Key Concepts</h3>
<ul>
  <li><strong>[Concept 1]:</strong> [Brief explanation]</li>
  <li><strong>[Concept 2]:</strong> [Brief explanation]</li>
  <li><strong>[Concept 3]:</strong> [Brief explanation]</li>
</ul>

<h3>💡 New Insights</h3>
<blockquote>
<p>"[Quote or insight that stood out to you]"</p>
</blockquote>

<p>[Your reflection on this insight and why it matters]</p>

<h2>🤔 Questions & Confusion</h2>
<ul>
  <li>❓ [What didn't I understand?]</li>
  <li>❓ [What needs more clarification?]</li>
  <li>❓ [What would I like to explore further?]</li>
</ul>

<h2>🔗 Connections</h2>
<p><strong>How does this relate to what I already know?</strong></p>
<ul>
  <li>[Connection to previous learning]</li>
  <li>[Connection to personal experience]</li>
  <li>[Connection to other subjects/topics]</li>
</ul>

<h2>🎯 Application</h2>
<p><strong>How can I use this knowledge?</strong></p>
<ul>
  <li>[ ] [Practical application 1]</li>
  <li>[ ] [Practical application 2]</li>
  <li>[ ] [Project idea based on this learning]</li>
</ul>

<h2>📝 Next Steps</h2>
<ul>
  <li>[ ] [What to study next]</li>
  <li>[ ] [Skills to practice]</li>
  <li>[ ] [Resources to explore]</li>
</ul>

<h2>⭐ Reflection</h2>
<p><strong>What went well in my learning today?</strong></p>
<p>[Your reflection]</p>

<p><strong>What could I improve next time?</strong></p>
<p>[Areas for improvement]</p>

<p><strong>Learning satisfaction (1-10):</strong> [Rating]/10</p>`,
        tags: ["learning", "reflection", "journal"],
      },

      {
        name: "Project Planning Template",
        description: "Plan and track project progress",
        category: "Project Management",
        icon: "🚀",
        content: `<h1>🚀 Project: [Project Name]</h1>

<h2>📋 Project Overview</h2>
<p><strong>Description:</strong> [Brief project description]</p>
<p><strong>Start Date:</strong> [Date]</p>
<p><strong>Target Completion:</strong> [Date]</p>
<p><strong>Project Lead:</strong> [Name]</p>

<h2>🎯 Project Objectives</h2>
<ul>
  <li>[ ] [Objective 1 - be specific and measurable]</li>
  <li>[ ] [Objective 2 - be specific and measurable]</li>
  <li>[ ] [Objective 3 - be specific and measurable]</li>
</ul>

<h2>👥 Team & Stakeholders</h2>
<p><strong>Core Team:</strong></p>
<ul>
  <li>[Name] - [Role/Responsibility]</li>
  <li>[Name] - [Role/Responsibility]</li>
  <li>[Name] - [Role/Responsibility]</li>
</ul>

<p><strong>Key Stakeholders:</strong></p>
<ul>
  <li>[Name] - [Interest/Influence]</li>
  <li>[Name] - [Interest/Influence]</li>
</ul>

<h2>📊 Project Phases</h2>

<h3>Phase 1: [Phase Name]</h3>
<p><strong>Timeline:</strong> [Start] - [End]</p>
<p><strong>Key Deliverables:</strong></p>
<ul>
  <li>[ ] [Deliverable 1]</li>
  <li>[ ] [Deliverable 2]</li>
  <li>[ ] [Deliverable 3]</li>
</ul>

<h3>Phase 2: [Phase Name]</h3>
<p><strong>Timeline:</strong> [Start] - [End]</p>
<p><strong>Key Deliverables:</strong></p>
<ul>
  <li>[ ] [Deliverable 1]</li>
  <li>[ ] [Deliverable 2]</li>
  <li>[ ] [Deliverable 3]</li>
</ul>

<h2>🎯 Success Criteria</h2>
<ul>
  <li>✅ [Criterion 1]</li>
  <li>✅ [Criterion 2]</li>
  <li>✅ [Criterion 3]</li>
</ul>

<h2>⚠️ Risks & Mitigation</h2>
<p><strong>Risk 1:</strong> [Description]</p>
<ul>
  <li><strong>Likelihood:</strong> [High/Medium/Low]</li>
  <li><strong>Impact:</strong> [High/Medium/Low]</li>
  <li><strong>Mitigation:</strong> [How to prevent/handle]</li>
</ul>

<h2>📈 Progress Tracking</h2>
<p><strong>Overall Progress:</strong> [X]% Complete</p>

<h3>Current Sprint/Week</h3>
<ul>
  <li>[ ] [Task 1]</li>
  <li>[ ] [Task 2]</li>
  <li>[ ] [Task 3]</li>
</ul>

<h2>📝 Notes & Updates</h2>
<p><strong>[Date]:</strong> [Update or note]</p>
<p><strong>[Date]:</strong> [Update or note]</p>`,
        tags: ["project-management", "planning", "tracking"],
      },

      {
        name: "Content Ideas Template",
        description: "Capture and develop content ideas",
        category: "Content Creation",
        icon: "💡",
        content: `<h1>💡 Content Ideas: [Topic/Theme]</h1>

<h2>🧠 Brainstorming Session</h2>
<p><strong>Date:</strong> [Today's date]</p>
<p><strong>Focus:</strong> [What type of content am I planning?]</p>

<h2>💭 Raw Ideas</h2>
<ul>
  <li>[Idea 1 - just capture it, don't judge]</li>
  <li>[Idea 2 - let creativity flow]</li>
  <li>[Idea 3 - quantity over quality at this stage]</li>
  <li>[Idea 4]</li>
  <li>[Idea 5]</li>
</ul>

<h2>⭐ Priority Ideas</h2>

<h3>🎯 Idea 1: [Title]</h3>
<p><strong>Content Type:</strong> [Blog post/Video/Course/Podcast/etc.]</p>
<p><strong>Target Audience:</strong> [Who is this for?]</p>
<p><strong>Key Message:</strong> [Main point to convey]</p>
<p><strong>Outline:</strong></p>
<ul>
  <li>[Point 1]</li>
  <li>[Point 2]</li>
  <li>[Point 3]</li>
</ul>
<p><strong>Estimated Effort:</strong> [Time/Resources needed]</p>

<h3>🎯 Idea 2: [Title]</h3>
<p><strong>Content Type:</strong> [Blog post/Video/Course/Podcast/etc.]</p>
<p><strong>Target Audience:</strong> [Who is this for?]</p>
<p><strong>Key Message:</strong> [Main point to convey]</p>
<p><strong>Outline:</strong></p>
<ul>
  <li>[Point 1]</li>
  <li>[Point 2]</li>
  <li>[Point 3]</li>
</ul>
<p><strong>Estimated Effort:</strong> [Time/Resources needed]</p>

<h2>🔍 Research Needed</h2>
<ul>
  <li>[ ] [Research topic 1]</li>
  <li>[ ] [Research topic 2]</li>
  <li>[ ] [Expert to interview]</li>
  <li>[ ] [Statistics to find]</li>
</ul>

<h2>📅 Content Calendar</h2>
<p><strong>This Week:</strong></p>
<ul>
  <li>[ ] [Content piece to create]</li>
  <li>[ ] [Content piece to publish]</li>
</ul>

<p><strong>Next Week:</strong></p>
<ul>
  <li>[ ] [Planned content]</li>
  <li>[ ] [Planned content]</li>
</ul>

<h2>🎨 Creative Resources</h2>
<ul>
  <li>[Image/graphic needed]</li>
  <li>[Video footage needed]</li>
  <li>[Music/audio needed]</li>
  <li>[Tools to use]</li>
</ul>

<h2>📊 Success Metrics</h2>
<p><strong>How will I measure success?</strong></p>
<ul>
  <li>[Views/reads target]</li>
  <li>[Engagement target]</li>
  <li>[Conversion target]</li>
</ul>`,
        tags: ["content", "creativity", "planning"],
      }
    ];

    const templateIds = [];
    
    for (const template of templates) {
      const templateId = await ctx.db.insert("noteTemplates", {
        name: template.name,
        description: template.description,
        content: template.content,
        category: template.category,
        tags: template.tags,
        icon: template.icon,
        isPublic: true,
        createdBy: args.userId,
        usageCount: 0,
      });
      templateIds.push(templateId);
    }

    return templateIds;
  },
});
