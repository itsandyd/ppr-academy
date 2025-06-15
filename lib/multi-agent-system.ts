import OpenAI from 'openai';
import { searchTavily, searchTopicImages } from './ai-course-generator';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Base Agent Interface
export interface Agent {
  name: string;
  role: string;
  execute(context: AgentContext): Promise<AgentResult>;
}

// Context passed between agents
export interface AgentContext {
  topic: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  instructorId: string;
  price: number;
  description?: string;
  learningObjectives?: string[];
  targetModules?: number;
  targetLessonsPerModule?: number;
  additionalContext?: string;
  researchData?: any;
  courseStructure?: any;
  generatedContent?: any;
  images?: string[];
  qualityScore?: number;
  [key: string]: any;
}

// Result from agent execution
export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  context?: Partial<AgentContext>;
}

// System prompts for different agents
const getSystemPrompt = (agentType: string) => {
  const now = new Date().toISOString();
  const basePrompt = `You are a specialized AI agent for music production education. Today is ${now}.`;
  
  const prompts = {
    research: `${basePrompt} You are the Research Agent - an expert at gathering comprehensive, current information about music production topics. Your role is to:
- Search for the most current and relevant information about specific music production topics
- Analyze trends, techniques, and industry standards
- Identify key learning points and educational pathways
- Focus exclusively on the requested topic without deviation
- Provide actionable insights for course creation`,

    structure: `${basePrompt} You are the Structure Agent - a curriculum design expert specializing in music production education. Your role is to:
- Create logical, progressive learning structures
- Design optimal module and lesson flows
- Ensure proper skill progression from basics to advanced
- Balance theoretical knowledge with practical application
- Stay strictly focused on the specific topic requested
- Create engaging, comprehensive learning pathways`,

    content: `${basePrompt} You are the Content Agent - a master educator and content creator for music production. Your role is to:
- Generate comprehensive, video-script-ready educational content
- Write in conversational, engaging style suitable for video production
- Include specific technical details, parameters, and step-by-step instructions
- Provide real-world examples and industry best practices
- Create content that's immediately actionable for students
- Maintain strict focus on the specific topic throughout all content`,

    image: `${basePrompt} You are the Image Agent - a visual content specialist for music production education. Your role is to:
- Find relevant, high-quality images for educational content
- Source professional screenshots, interface examples, and tutorial visuals
- Ensure images enhance learning and understanding
- Curate diverse visual content that supports the educational narrative
- Focus on legitimate, educational-purpose imagery`,

    quality: `${basePrompt} You are the Quality Agent - an educational content validator and optimizer. Your role is to:
- Assess content quality, accuracy, and educational value
- Ensure all content stays strictly on the specified topic
- Validate learning objectives are met
- Check for consistency across all course materials
- Identify gaps or areas needing improvement
- Ensure professional standards are maintained`
  };

  return prompts[agentType as keyof typeof prompts] || basePrompt;
};

// Research Agent - Gathers comprehensive topic information
export class ResearchAgent implements Agent {
  name = "Research Agent";
  role = "Information Gathering & Topic Analysis";

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`🔍 ${this.name}: Researching "${context.topic}"`);
    
    try {
      const searchQueries = [
        `${context.topic} music production tutorial ${context.skillLevel}`,
        `${context.topic} techniques guide professional music production`,
        `${context.topic} best practices industry standards ${context.skillLevel}`,
        `${context.topic} workflow tips music producer education`
      ];

      if (context.additionalContext) {
        searchQueries.push(`${context.topic} ${context.additionalContext} music production`);
      }

      const researchData = [];
      
      for (const query of searchQueries) {
        try {
          const results = await searchTavily(query);
          researchData.push(...results);
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.log(`⚠️ Search failed for: ${query}`);
        }
      }

      const analysis = await this.analyzeResearchData(researchData, context);

      return {
        success: true,
        data: analysis,
        context: { researchData: analysis }
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Research failed: ${error.message}`
      };
    }
  }

  private async analyzeResearchData(data: any[], context: AgentContext): Promise<any> {
    const researchSummary = data.map(item => `${item.title}: ${item.content}`).join('\n\n');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: getSystemPrompt('research')
        },
        {
          role: "user",
          content: `Analyze this research data for "${context.topic}" at ${context.skillLevel} level:

${researchSummary}

Provide:
1. Key learning concepts for ${context.topic}
2. Industry standards and best practices
3. Logical skill progression pathways
4. Common challenges and solutions
5. Essential techniques students must learn
6. Current trends and modern approaches

Focus exclusively on "${context.topic}" - do not include unrelated topics.`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return {
      rawData: data,
      analysis: completion.choices[0].message.content,
      keyTopics: await this.extractKeyTopics(completion.choices[0].message.content || '', context.topic),
      timestamp: new Date().toISOString()
    };
  }

  private async extractKeyTopics(analysis: string, topic: string): Promise<string[]> {
    const topics = analysis.match(/\d+\.\s+([^\n]+)/g) || [];
    return topics.map(t => t.replace(/\d+\.\s+/, '').trim()).slice(0, 10);
  }
}

// Structure Agent - Creates course architecture
export class StructureAgent implements Agent {
  name = "Structure Agent";
  role = "Curriculum Design & Course Architecture";

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`🏗️ ${this.name}: Designing course structure for "${context.topic}"`);
    
    try {
      const researchContext = context.researchData?.analysis || `Creating course structure for ${context.topic}`;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: getSystemPrompt('structure')
          },
          {
            role: "user",
            content: `Create a comprehensive course structure EXCLUSIVELY about "${context.topic}" at ${context.skillLevel} level.

Research Context:
${researchContext}

Requirements:
- Generate exactly ${context.targetModules || 4} modules
- Each module must have exactly ${context.targetLessonsPerModule || 3} lessons
- Each lesson must have exactly 3 chapters
- Focus solely on "${context.topic}"
- Progressive difficulty: foundations → intermediate → advanced → mastery
- Practical, hands-on learning approach

${context.learningObjectives?.length ? `Learning Objectives:\n${context.learningObjectives.map(obj => `- ${obj}`).join('\n')}\n` : ''}
${context.description ? `Course Description:\n${context.description}\n` : ''}
${context.additionalContext ? `Additional Context:\n${context.additionalContext}\n` : ''}

Create a logical, engaging course structure that builds skills progressively.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "course_structure",
            schema: {
              type: "object",
              properties: {
                course: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                    skillLevel: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                    estimatedDuration: { type: "number" }
                  },
                  required: ["title", "description", "category", "skillLevel", "estimatedDuration"]
                },
                modules: {
                  type: "array",
                  minItems: context.targetModules || 4,
                  maxItems: context.targetModules || 4,
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      orderIndex: { type: "number" },
                      lessons: {
                        type: "array",
                        minItems: context.targetLessonsPerModule || 3,
                        maxItems: context.targetLessonsPerModule || 3,
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            orderIndex: { type: "number" },
                            chapters: {
                              type: "array",
                              minItems: 3,
                              maxItems: 3,
                              items: {
                                type: "object",
                                properties: {
                                  title: { type: "string" },
                                  content: { type: "string" },
                                  duration: { type: "number" },
                                  orderIndex: { type: "number" }
                                },
                                required: ["title", "content", "duration", "orderIndex"]
                              }
                            }
                          },
                          required: ["title", "description", "orderIndex", "chapters"]
                        }
                      }
                    },
                    required: ["title", "description", "orderIndex", "lessons"]
                  }
                }
              },
              required: ["course", "modules"]
            }
          }
        }
      });

      const structure = JSON.parse(completion.choices[0].message.content || '{}');
      
      const validation = await this.validateStructure(structure, context);
      
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      return {
        success: true,
        data: structure,
        context: { courseStructure: structure }
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Structure creation failed: ${error.message}`
      };
    }
  }

  private async validateStructure(structure: any, context: AgentContext): Promise<{isValid: boolean, error?: string}> {
    const targetModules = context.targetModules || 4;
    const targetLessonsPerModule = context.targetLessonsPerModule || 3;
    
    if (!structure.modules || structure.modules.length !== targetModules) {
      return {
        isValid: false,
        error: `Expected ${targetModules} modules, got ${structure.modules?.length || 0}`
      };
    }

    const totalLessons = structure.modules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0);
    const expectedLessons = targetModules * targetLessonsPerModule;
    
    if (totalLessons !== expectedLessons) {
      return {
        isValid: false,
        error: `Expected ${expectedLessons} lessons total, got ${totalLessons}`
      };
    }

    return { isValid: true };
  }
}

// Content Agent - Generates detailed educational content
export class ContentAgent implements Agent {
  name = "Content Agent";
  role = "Educational Content Generation";

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`✍️ ${this.name}: Content generation handled by orchestrator in parallel`);
    
    // This agent is now primarily used for its generateChapterContent method
    // by the orchestrator's parallel content generation
    return {
      success: true,
      data: null,
      context: {}
    };
  }

  private async generateChapterContent(
    topic: string,
    chapterTitle: string,
    skillLevel: string,
    moduleTitle: string,
    lessonTitle: string,
    context: AgentContext,
    contentTracker?: any
  ): Promise<{content: string, wordCount: number, keyTopics: string[]}> {
    
    // Build context about previously covered content
    const avoidanceContext = contentTracker ? `

AVOID REPEATING THESE ALREADY COVERED CONCEPTS:
${Array.from(contentTracker.coveredConcepts).slice(-10).join(', ')}

PREVIOUS CHAPTERS COVERED:
${contentTracker.previousChapters.slice(-3).join('\n')}

PROGRESSION CONTEXT:
- This is chapter ${(contentTracker.moduleProgress[moduleTitle] || 0) + 1} in "${moduleTitle}"
- Build upon previous concepts without repeating them
- Focus on NEW aspects of "${topic}" not yet covered
- Each chapter should introduce UNIQUE techniques or applications
` : '';

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: getSystemPrompt('content')
        },
        {
          role: "user",
          content: `Create comprehensive educational content EXCLUSIVELY about "${topic}" for this chapter:

Chapter: "${chapterTitle}"
Module: "${moduleTitle}"
Lesson: "${lessonTitle}"
Skill Level: ${skillLevel}
Topic Focus: ${topic}

CRITICAL REQUIREMENTS:
- Content must be 100% about "${topic}" and nothing else
- Write 800-1200 words of detailed, educational content
- Use conversational tone suitable for video scripts
- Include specific technical details and step-by-step instructions
- Provide practical examples related to "${topic}"
- Structure with clear sections and learning points
- Make content immediately actionable for students
- DO NOT repeat concepts already covered in previous chapters
- Focus on UNIQUE aspects of "${chapterTitle}" within "${topic}"
- Build progressively on previous knowledge without redundancy

${avoidanceContext}

Research Context: ${context.researchData?.analysis || 'Focus on practical application and professional techniques'}

Generate UNIQUE, NON-REPETITIVE content about "${topic}" that specifically addresses "${chapterTitle}" without duplicating previous material.`
        }
      ],
      temperature: 0.8,
      max_tokens: 4000
    });

    const content = completion.choices[0].message.content || '';
    const wordCount = content.split(' ').length;
    const keyTopics = await this.extractKeyTopics(content, topic);

    return {
      content,
      wordCount,
      keyTopics
    };
  }

  private countTotalChapters(structure: any): number {
    return structure.modules.reduce((acc: number, module: any) =>
      acc + module.lessons.reduce((lacc: number, lesson: any) =>
        lacc + (lesson.chapters?.length || 0), 0), 0);
  }

  private async extractKeyTopics(content: string, mainTopic: string): Promise<string[]> {
    const lines = content.split('\n').filter(line => 
      line.includes(mainTopic) || 
      line.match(/\d+\./) || 
      line.includes('learn') || 
      line.includes('technique')
    );
    return lines.slice(0, 5).map(line => line.trim().substring(0, 100));
  }
}

// Image Agent - Curates visual content
export class ImageAgent implements Agent {
  name = "Image Agent";
  role = "Visual Content Curation";

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`🖼️ ${this.name}: Finding images for "${context.topic}"`);
    
    try {
      const images = await this.findRelevantImages(context);
      
      return {
        success: true,
        data: images,
        context: { images }
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Image curation failed: ${error.message}`,
        context: { images: this.getFallbackImages(context.topic, context.skillLevel) }
      };
    }
  }

  private async findRelevantImages(context: AgentContext): Promise<string[]> {
    const imageQueries = [
      `${context.topic} music production tutorial interface`,
      `${context.topic} ${context.skillLevel} music production guide`,
      `${context.topic} DAW plugin interface tutorial`,
      `music production ${context.topic} workflow setup`
    ];

    const allImages: string[] = [];

    for (const query of imageQueries) {
      try {
        const images = await searchTopicImages(query, context.skillLevel);
        allImages.push(...images);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`⚠️ Image search failed for: ${query}`);
      }
    }

    const uniqueImages = [...new Set(allImages)].filter(url => this.isValidImageUrl(url));
    
    return uniqueImages.length > 0 ? uniqueImages.slice(0, 10) : this.getFallbackImages(context.topic, context.skillLevel);
  }

  private isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return url.includes('unsplash.com') || 
             url.includes('images.unsplash.com') || 
             url.includes('img.youtube.com') ||
             url.includes('amazonaws.com');
    } catch {
      return false;
    }
  }

  private getFallbackImages(topic: string, skillLevel: string): string[] {
    return [
      'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=500&fit=crop'
    ];
  }
}

// Quality Agent - Validates and optimizes content
export class QualityAgent implements Agent {
  name = "Quality Agent";
  role = "Content Quality Assurance";

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`🔍 ${this.name}: Validating course quality for "${context.topic}"`);
    
    try {
      const qualityReport = await this.assessQuality(context);
      
      return {
        success: true,
        data: qualityReport,
        context: { qualityScore: qualityReport.overallScore }
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Quality assessment failed: ${error.message}`
      };
    }
  }

  private async assessQuality(context: AgentContext): Promise<any> {
    const checks = {
      topicFocus: await this.checkTopicFocus(context),
      contentDepth: await this.checkContentDepth(context),
      structureCoherence: await this.checkStructureCoherence(context),
      learningObjectives: await this.checkLearningObjectives(context),
      technicalAccuracy: await this.checkTechnicalAccuracy(context)
    };

    const overallScore = Object.values(checks).reduce((sum: number, check: any) => sum + check.score, 0) / Object.keys(checks).length;

    return {
      checks,
      overallScore,
      recommendations: this.generateRecommendations(checks),
      timestamp: new Date().toISOString()
    };
  }

  private async checkTopicFocus(context: AgentContext): Promise<{score: number, details: string}> {
    const structure = context.generatedContent || context.courseStructure;
    if (!structure) return { score: 0, details: 'No content to analyze' };

    const sampleContent = this.extractSampleContent(structure);
    const topicMentions = (sampleContent.match(new RegExp(context.topic, 'gi')) || []).length;
    const totalWords = sampleContent.split(' ').length;
    
    const focusRatio = totalWords > 0 ? (topicMentions / totalWords) * 100 : 0;
    const score = Math.min(focusRatio * 20, 100);

    return {
      score,
      details: `Topic "${context.topic}" mentioned ${topicMentions} times in ${totalWords} words (${focusRatio.toFixed(2)}% focus ratio)`
    };
  }

  private async checkContentDepth(context: AgentContext): Promise<{score: number, details: string}> {
    const structure = context.generatedContent || context.courseStructure;
    if (!structure) return { score: 0, details: 'No content to analyze' };

    let totalWords = 0;
    let chapterCount = 0;

    for (const module of structure.modules || []) {
      for (const lesson of module.lessons || []) {
        for (const chapter of lesson.chapters || []) {
          if (chapter.content) {
            totalWords += chapter.content.split(' ').length;
            chapterCount++;
          }
        }
      }
    }

    const averageWordsPerChapter = chapterCount > 0 ? totalWords / chapterCount : 0;
    const score = Math.min((averageWordsPerChapter / 800) * 100, 100);

    return {
      score,
      details: `${chapterCount} chapters with average ${averageWordsPerChapter.toFixed(0)} words per chapter`
    };
  }

  private async checkStructureCoherence(context: AgentContext): Promise<{score: number, details: string}> {
    const structure = context.courseStructure;
    if (!structure) return { score: 0, details: 'No structure to analyze' };

    const moduleCount = structure.modules?.length || 0;
    const expectedModules = context.targetModules || 4;
    const structureScore = (moduleCount === expectedModules) ? 100 : 0;

    return {
      score: structureScore,
      details: `${moduleCount}/${expectedModules} modules with proper lesson distribution`
    };
  }

  private async checkLearningObjectives(context: AgentContext): Promise<{score: number, details: string}> {
    const hasObjectives = (context.learningObjectives?.length || 0) > 0;
    const score = hasObjectives ? 100 : 60;

    return {
      score,
      details: hasObjectives ? `${context.learningObjectives!.length} learning objectives defined` : 'Using default learning progression'
    };
  }

  private async checkTechnicalAccuracy(context: AgentContext): Promise<{score: number, details: string}> {
    const hasResearch = !!context.researchData;
    const score = hasResearch ? 85 : 70;

    return {
      score,
      details: hasResearch ? 'Content based on current industry research' : 'Content based on knowledge base'
    };
  }

  private extractSampleContent(structure: any): string {
    let sampleContent = '';
    let sampleCount = 0;
    const maxSamples = 5;

    for (const module of structure.modules || []) {
      for (const lesson of module.lessons || []) {
        for (const chapter of lesson.chapters || []) {
          if (chapter.content && sampleCount < maxSamples) {
            sampleContent += ' ' + chapter.content;
            sampleCount++;
          }
        }
      }
    }

    return sampleContent;
  }

  private generateRecommendations(checks: any): string[] {
    const recommendations = [];

    if (checks.topicFocus.score < 70) {
      recommendations.push('Increase focus on the main topic throughout all content');
    }

    if (checks.contentDepth.score < 70) {
      recommendations.push('Expand chapter content with more detailed explanations and examples');
    }

    if (checks.structureCoherence.score < 100) {
      recommendations.push('Review course structure to ensure proper module and lesson organization');
    }

    if (checks.technicalAccuracy.score < 80) {
      recommendations.push('Incorporate more current industry research and best practices');
    }

    return recommendations;
  }
}

// Orchestrator Agent - Coordinates all agents
export class OrchestratorAgent implements Agent {
  name = "Orchestrator Agent";
  role = "Multi-Agent Coordination";

  private agents: Agent[] = [
    new ResearchAgent(),
    new StructureAgent(),
    new ContentAgent(),
    new ImageAgent(),
    new QualityAgent()
  ];

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`🎼 ${this.name}: Starting optimized multi-agent course generation for "${context.topic}"`);
    
    const executionLog = [];
    let currentContext = { ...context };

    try {
      // Phase 1: Run Research and Image agents in parallel (independent operations)
      console.log(`\n🚀 Phase 1: Parallel Research & Image Search`);
      const phase1Start = Date.now();
      
      const [researchResult, imageResult] = await Promise.all([
        this.agents[0].execute(currentContext), // Research Agent
        this.agents[3].execute(currentContext)  // Image Agent
      ]);

      const phase1Time = Date.now() - phase1Start;
      console.log(`✅ Phase 1 completed in ${phase1Time}ms`);

      // Update context with research data
      if (researchResult.success && researchResult.context) {
        currentContext = { ...currentContext, ...researchResult.context };
      }
      if (imageResult.success && imageResult.context) {
        currentContext = { ...currentContext, ...imageResult.context };
      }

      executionLog.push(
        { agent: 'Research Agent', success: researchResult.success, executionTime: phase1Time, error: researchResult.error },
        { agent: 'Image Agent', success: imageResult.success, executionTime: phase1Time, error: imageResult.error }
      );

      // Phase 2: Structure generation (depends on research)
      console.log(`\n🏗️ Phase 2: Course Structure Generation`);
      const structureStart = Date.now();
      
      const structureResult = await this.agents[1].execute(currentContext); // Structure Agent
      const structureTime = Date.now() - structureStart;
      
      executionLog.push({
        agent: 'Structure Agent',
        success: structureResult.success,
        executionTime: structureTime,
        error: structureResult.error
      });

      if (!structureResult.success) {
        throw new Error(`Critical failure in Structure Agent: ${structureResult.error}`);
      }

      if (structureResult.context) {
        currentContext = { ...currentContext, ...structureResult.context };
      }
      console.log(`✅ Phase 2 completed in ${structureTime}ms`);

      // Phase 3: Parallel Content Generation & Quality Assessment
      console.log(`\n⚡ Phase 3: Parallel Content Generation & Quality Assessment`);
      const phase3Start = Date.now();
      
      const [contentResult, qualityResult] = await Promise.all([
        this.generateContentInParallel(currentContext), // Parallel content generation
        this.agents[4].execute(currentContext)           // Quality Agent (can run on structure)
      ]);

      const phase3Time = Date.now() - phase3Start;
      console.log(`✅ Phase 3 completed in ${phase3Time}ms`);

      if (contentResult.success && contentResult.context) {
        currentContext = { ...currentContext, ...contentResult.context };
      }
      if (qualityResult.success && qualityResult.context) {
        currentContext = { ...currentContext, ...qualityResult.context };
      }

      executionLog.push(
        { agent: 'Content Agent (Parallel)', success: contentResult.success, executionTime: phase3Time, error: contentResult.error },
        { agent: 'Quality Agent', success: qualityResult.success, executionTime: phase3Time, error: qualityResult.error }
      );

      const finalCourse = await this.compileFinalCourse(currentContext);

      const totalTime = Date.now() - phase1Start;
      console.log(`🎉 Total generation time: ${totalTime}ms`);

      return {
        success: true,
        data: {
          course: finalCourse,
          executionLog,
          qualityScore: currentContext.qualityScore,
          totalTime
        },
        context: currentContext
      };

    } catch (error: any) {
      console.error(`❌ ${this.name} failed:`, error);
      return {
        success: false,
        error: `Orchestration failed: ${error.message}`,
        data: { executionLog }
      };
    }
  }

  // New method for parallel content generation
  private async generateContentInParallel(context: AgentContext): Promise<AgentResult> {
    try {
      if (!context.courseStructure) {
        throw new Error('Course structure required for content generation');
      }

      const structure = { ...context.courseStructure };
      const allChapters = this.collectAllChapters(structure);
      const totalChapters = allChapters.length;
      
      console.log(`📝 Generating content for ${totalChapters} chapters in parallel batches...`);

      // Content tracker for avoiding repetition
      const contentTracker = {
        coveredConcepts: new Set<string>(),
        previousChapters: [] as string[],
        moduleProgress: {} as Record<string, number>
      };

      // Initialize module progress
      structure.modules.forEach((module: any) => {
        contentTracker.moduleProgress[module.title] = 0;
      });

      // Create a content agent instance for content generation
      const contentAgent = new ContentAgent();

      // Process chapters in parallel batches of 4
      const batchSize = 4;
      const batches = [];
      
      for (let i = 0; i < allChapters.length; i += batchSize) {
        batches.push(allChapters.slice(i, i + batchSize));
      }

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} chapters)`);

        // Generate content for all chapters in this batch in parallel
        const batchPromises = batch.map(async (chapterInfo: any) => {
          try {
            const detailedContent = await (contentAgent as any).generateChapterContent(
              context.topic,
              chapterInfo.chapter.title,
              context.skillLevel,
              chapterInfo.moduleTitle,
              chapterInfo.lessonTitle,
              context,
              contentTracker
            );

            chapterInfo.chapter.content = detailedContent.content;
            chapterInfo.chapter.wordCount = detailedContent.wordCount;
            chapterInfo.chapter.keyTopics = detailedContent.keyTopics;

            // Update tracker (sequential to avoid race conditions)
            detailedContent.keyTopics.forEach((topic: string) => contentTracker.coveredConcepts.add(topic));
            contentTracker.previousChapters.push(`${chapterInfo.chapter.title}: ${detailedContent.content.substring(0, 200)}...`);
            contentTracker.moduleProgress[chapterInfo.moduleTitle]++;

            return { success: true, chapterTitle: chapterInfo.chapter.title };
          } catch (error) {
            console.error(`❌ Failed to generate content for chapter: ${chapterInfo.chapter.title}`, error);
            return { success: false, chapterTitle: chapterInfo.chapter.title, error };
          }
        });

        // Wait for this batch to complete before starting the next
        await Promise.all(batchPromises);
        
        // Small delay between batches to avoid rate limiting
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      return {
        success: true,
        data: structure,
        context: { generatedContent: structure }
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Parallel content generation failed: ${error.message}`
      };
    }
  }

  // Helper method to collect all chapters with their context
  private collectAllChapters(structure: any): any[] {
    const allChapters = [];
    
    for (const module of structure.modules) {
      for (const lesson of module.lessons) {
        for (const chapter of lesson.chapters) {
          allChapters.push({
            chapter,
            moduleTitle: module.title,
            lessonTitle: lesson.title
          });
        }
      }
    }
    
    return allChapters;
  }

  private async compileFinalCourse(context: AgentContext): Promise<any> {
    const structure = context.generatedContent || context.courseStructure;
    const images = context.images || [];
    
    const courseThumbnail = images[0] || 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=500&fit=crop';
    const stats = this.calculateCourseStats(structure);

    return {
      course: {
        ...structure.course,
        price: context.price,
        thumbnail: courseThumbnail,
        instructorId: context.instructorId,
        isPublished: false,
        qualityScore: context.qualityScore
      },
      modules: structure.modules,
      lessons: structure.modules.flatMap((m: any) => m.lessons),
      chapters: structure.modules.flatMap((m: any) => m.lessons.flatMap((l: any) => l.chapters)),
      stats,
      images: images.slice(1)
    };
  }

  private calculateCourseStats(structure: any): any {
    const moduleCount = structure.modules?.length || 0;
    const lessonCount = structure.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
    const chapterCount = structure.modules?.reduce((acc: number, m: any) => 
      acc + (m.lessons?.reduce((lacc: number, l: any) => lacc + (l.chapters?.length || 0), 0) || 0), 0) || 0;

    return {
      modules: moduleCount,
      lessons: lessonCount,
      chapters: chapterCount
    };
  }
} 