import OpenAI from 'openai';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { scrapeContent } from './content-scraper';
import { 
  OrchestratorAgent as MultiAgentOrchestrator, 
  AgentContext as MultiAgentContext 
} from './multi-agent-system';

// Multi-Agent System for Course Generation - removed duplicate interfaces

// Lazy OpenAI initialization to avoid build-time issues
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Base Agent Interface
interface Agent {
  name: string;
  role: string;
  execute(context: AgentContext): Promise<AgentResult>;
}

// Context passed between agents
interface AgentContext {
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
interface AgentResult {
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
class ResearchAgent implements Agent {
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
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.log(`⚠️ Search failed for: ${query}`);
        }
      }

      // Analyze and synthesize research data
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
    
    const completion = await getOpenAIClient().chat.completions.create({
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
    // Simple extraction - could be enhanced with NLP
    const topics = analysis.match(/\d+\.\s+([^\n]+)/g) || [];
    return topics.map(t => t.replace(/\d+\.\s+/, '').trim()).slice(0, 10);
  }
}

// Structure Agent - Creates course architecture
class StructureAgent implements Agent {
  name = "Structure Agent";
  role = "Curriculum Design & Course Architecture";

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`🏗️ ${this.name}: Designing course structure for "${context.topic}"`);
    
    try {
      const researchContext = (context.researchData as any)?.analysis || `Creating course structure for ${context.topic}`;
      
      const completion = await getOpenAIClient().chat.completions.create({
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
      
      // Validate structure
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
class ContentAgent implements Agent {
  name = "Content Agent";
  role = "Educational Content Generation";

  async execute(context: AgentContext): Promise<AgentResult> {
    console.log(`✍️ ${this.name}: Generating content for "${context.topic}"`);
    
    try {
      if (!context.courseStructure) {
        throw new Error('Course structure required for content generation');
      }

      const enhancedStructure = await this.generateDetailedContent(context);

      return {
        success: true,
        data: enhancedStructure,
        context: { generatedContent: enhancedStructure }
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Content generation failed: ${error.message}`
      };
    }
  }

  private async generateDetailedContent(context: AgentContext): Promise<any> {
    const structure = { ...context.courseStructure };
    const totalChapters = this.countTotalChapters(structure);
    let processedChapters = 0;

    console.log(`📝 Generating detailed content for ${totalChapters} chapters...`);

    // Process each module, lesson, and chapter
    for (const module of structure.modules) {
      for (const lesson of module.lessons) {
        for (const chapter of lesson.chapters) {
          try {
            console.log(`📝 Processing: ${module.title} > ${lesson.title} > ${chapter.title} (${++processedChapters}/${totalChapters})`);
            
            const detailedContent = await this.generateChapterContent(
              context.topic,
              chapter.title,
              context.skillLevel,
              module.title,
              lesson.title,
              context
            );

            // Replace placeholder content with detailed content
            chapter.content = detailedContent.content;
            chapter.wordCount = detailedContent.wordCount;
            chapter.keyTopics = detailedContent.keyTopics;

            // Rate limiting to avoid API overload
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (error) {
            console.error(`❌ Failed to generate content for chapter: ${chapter.title}`, error);
            // Keep existing content as fallback
          }
        }
      }
    }

    return structure;
  }

  private async generateChapterContent(
    topic: string,
    chapterTitle: string,
    skillLevel: string,
    moduleTitle: string,
    lessonTitle: string,
    context: AgentContext
  ): Promise<{content: string, wordCount: number, keyTopics: string[]}> {
    
    const completion = await getOpenAIClient().chat.completions.create({
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

Research Context: ${context.researchData?.analysis || 'Focus on practical application and professional techniques'}

Generate comprehensive content about "${topic}" that educates students on this specific aspect.`
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
    // Extract key learning points from content
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
class ImageAgent implements Agent {
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

    // Remove duplicates and validate
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
class QualityAgent implements Agent {
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
    // Analyze if content stays focused on the main topic
    const structure = context.generatedContent || context.courseStructure;
    if (!structure) return { score: 0, details: 'No content to analyze' };

    // Sample some chapter content for analysis
    const sampleContent = this.extractSampleContent(structure);
    const topicMentions = (sampleContent.match(new RegExp(context.topic, 'gi')) || []).length;
    const totalWords = sampleContent.split(' ').length;
    
    const focusRatio = totalWords > 0 ? (topicMentions / totalWords) * 100 : 0;
    const score = Math.min(focusRatio * 20, 100); // Scale appropriately

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
    const score = Math.min((averageWordsPerChapter / 800) * 100, 100); // Target 800+ words per chapter

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
    const score = hasObjectives ? 100 : 60; // Partial credit if no custom objectives

    return {
      score,
      details: hasObjectives ? `${context.learningObjectives!.length} learning objectives defined` : 'Using default learning progression'
    };
  }

  private async checkTechnicalAccuracy(context: AgentContext): Promise<{score: number, details: string}> {
    // This would ideally use more sophisticated analysis
    // For now, we'll do basic checks
    const hasResearch = !!context.researchData;
    const score = hasResearch ? 85 : 70; // Higher score if research was conducted

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
class OrchestratorAgent implements Agent {
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
    console.log(`🎼 ${this.name}: Starting multi-agent course generation for "${context.topic}"`);
    
    const executionLog = [];
    let currentContext = { ...context };

    try {
      // Execute agents in sequence
      for (const agent of this.agents) {
        console.log(`\n🤖 Executing ${agent.name}...`);
        const startTime = Date.now();
        
        const result = await agent.execute(currentContext);
        const executionTime = Date.now() - startTime;
        
        executionLog.push({
          agent: agent.name,
          success: result.success,
          executionTime,
          error: result.error
        });

        if (!result.success) {
          console.log(`❌ ${agent.name} failed: ${result.error}`);
          // Continue with other agents unless it's a critical failure
          if (agent.name === 'Structure Agent') {
            throw new Error(`Critical failure in ${agent.name}: ${result.error}`);
          }
        } else {
          console.log(`✅ ${agent.name} completed in ${executionTime}ms`);
          // Merge context updates
          if (result.context) {
            currentContext = { ...currentContext, ...result.context };
          }
        }
      }

      // Compile final course data
      const finalCourse = await this.compileFinalCourse(currentContext);

      return {
        success: true,
        data: {
          course: finalCourse,
          executionLog,
          qualityScore: currentContext.qualityScore
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

  private async compileFinalCourse(context: AgentContext): Promise<any> {
    const structure = context.generatedContent || context.courseStructure;
    const images = context.images || [];
    
    // Add course thumbnail
    const courseThumbnail = images[0] || 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=500&fit=crop';

    // Calculate statistics
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
      images: images.slice(1) // Additional images for course content
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

// Keep existing functions for backward compatibility
export async function searchTavily(query: string, includeImages = false, searchType = 'web'): Promise<any[]> {
  if (!process.env.TAVILY_API_KEY) {
    console.log('⚠️ Tavily API key not available. Please add TAVILY_API_KEY to your .env file');
    return [];
  }

  try {
    const searchOptions: any = {
      query: query,
      search_depth: 'basic',
      include_domains: [],
      exclude_domains: ['pinterest.com', 'facebook.com', 'instagram.com'],
      max_results: searchType === 'images' ? 10 : 5,
      include_answer: !includeImages,
      include_raw_content: false,
      include_images: includeImages
    };

    if (searchType === 'images') {
      searchOptions.include_images = true;
      searchOptions.max_results = 15;
      searchOptions.include_domains = [
        'unsplash.com',
        'youtube.com',
        'ableton.com',
        'native-instruments.com',
        'loopmasters.com',
        'splice.com'
      ];
    }

    console.log(`🔍 Tavily ${searchType} search: "${query}"`);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
      },
      body: JSON.stringify(searchOptions)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Tavily API error (${response.status}): ${errorText}`);
      return [];
    }

    const data = await response.json();
    console.log(`✅ Tavily found ${data.results?.length || 0} results for "${query}"`);
    return data.results || [];
  } catch (error) {
    console.error('❌ Tavily search error:', error);
    return [];
  }
}

export async function searchTopicImages(topic: string, skillLevel: string): Promise<string[]> {
  console.log(`🖼️ Searching for course images: ${topic} (${skillLevel})`);
  
  const imageUrls: string[] = [];
  
  try {
    const imageQueries = [
      `${topic} music production tutorial interface screenshot`,
      `${topic} ${skillLevel} music production guide`,
      `${topic} DAW plugin interface tutorial`,
      `music production ${topic} workflow setup`
    ];

    for (const query of imageQueries) {
      const results = await searchTavily(query, true, 'images');
      
      for (const result of results) {
        if (result.image_url && isValidImageUrl(result.image_url)) {
          imageUrls.push(result.image_url);
        }
        if (result.images && Array.isArray(result.images)) {
          for (const img of result.images) {
            if (typeof img === 'string' && isValidImageUrl(img)) {
              imageUrls.push(img);
            } else if (img.url && isValidImageUrl(img.url)) {
              imageUrls.push(img.url);
            }
          }
        }
      }
      
      if (imageUrls.length >= 8) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const uniqueUrls = [...new Set(imageUrls)].filter(url => 
      isValidImageUrl(url) && !url.includes('placeholder')
    );

    if (uniqueUrls.length > 0) {
      console.log(`✅ Found ${uniqueUrls.length} images via Tavily for: ${topic}`);
      return uniqueUrls.slice(0, 6);
    }

  } catch (error) {
    console.error('❌ Error searching for topic images via Tavily:', error);
  }
  
  console.log(`🔄 Using fallback curated images for: ${topic}`);
  return getEducationalMusicImages(topic, skillLevel);
}

function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const validDomains = [
    'unsplash.com',
    'images.unsplash.com',
    'img.youtube.com',
    'cdn.shopify.com',
    'amazonaws.com',
    'cloudinary.com',
    'imgur.com'
  ];
  
  try {
    const urlObj = new URL(url);
    
    const isValidDomain = validDomains.some(domain => 
      urlObj.hostname.includes(domain)
    );
    
    const hasValidExtension = validExtensions.some(ext => 
      urlObj.pathname.toLowerCase().includes(ext)
    ) || urlObj.hostname.includes('youtube.com');
    
    return isValidDomain && hasValidExtension;
  } catch {
    return false;
  }
}

function getEducationalMusicImages(topic: string, skillLevel: string): string[] {
  const topicLower = topic.toLowerCase();
  
  const imageCollections = {
    default: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=500&fit=crop'
    ],
    synthesizer: [
      'https://images.unsplash.com/photo-1563330232-57114bb5e5cb?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1614680889342-77b0b4e3cda0?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1567184406952-9f6ba54cb614?w=800&h=500&fit=crop'
    ],
    mixing: [
      'https://images.unsplash.com/photo-1519683384663-a3d56c3c3d8b?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&h=500&fit=crop'
    ],
    production: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=500&fit=crop'
    ]
  };
  
  if (topicLower.includes('synth') || topicLower.includes('oscillator') || topicLower.includes('analog')) {
    return imageCollections.synthesizer;
  }
  
  if (topicLower.includes('mixing') || topicLower.includes('mastering') || topicLower.includes('eq')) {
    return imageCollections.mixing;
  }
  
  if (topicLower.includes('production') || topicLower.includes('beat') || topicLower.includes('track')) {
    return imageCollections.production;
  }
  
  return imageCollections.default;
}

// Validation schemas (keep existing)
const ChapterSchema = z.object({
  title: z.string(),
  content: z.string(),
  duration: z.number(),
  orderIndex: z.number()
});

const LessonSchema = z.object({
  title: z.string(),
  description: z.string(),
  orderIndex: z.number(),
  chapters: z.array(ChapterSchema)
});

const ModuleSchema = z.object({
  title: z.string(),
  description: z.string(),
  orderIndex: z.number(),
  lessons: z.array(LessonSchema)
});

const CourseSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedDuration: z.number()
});

const CourseStructureSchema = z.object({
  course: CourseSchema,
  modules: z.array(ModuleSchema)
});

// Keep existing interfaces for backward compatibility
interface CourseGenerationRequest {
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
}

interface GeneratedCourse {
  course: any;
  modules: any[];
  lessons: any[];
  chapters: any[];
  stats: {
    modules: number;
    lessons: number;
    chapters: number;
  };
}

// Updated generateAICourse function using multi-agent system
export async function generateAICourse(request: CourseGenerationRequest): Promise<GeneratedCourse> {
  console.log(`🚀 Starting multi-agent course generation for: "${request.topic}"`);
  
  const orchestrator = new MultiAgentOrchestrator();
  
  const context: MultiAgentContext = {
    topic: request.topic,
    skillLevel: request.skillLevel,
    category: request.category,
    instructorId: request.instructorId,
    price: request.price,
    description: request.description,
    learningObjectives: request.learningObjectives || [],
    targetModules: request.targetModules || 4,
    targetLessonsPerModule: request.targetLessonsPerModule || 3,
    additionalContext: request.additionalContext
  };

  const result = await orchestrator.execute(context);
  
  if (!result.success) {
    throw new Error(result.error || 'Multi-agent course generation failed');
  }

  const courseData = result.data.course;
  
  console.log(`✅ Multi-agent course generation completed!`);
  console.log(`📊 Quality Score: ${result.data.qualityScore?.toFixed(1) || 'N/A'}/100`);
  console.log(`📈 Generated: ${courseData.stats.modules} modules, ${courseData.stats.lessons} lessons, ${courseData.stats.chapters} chapters`);
  
  // Log execution summary
  if (result.data.executionLog) {
    console.log(`\n📋 Agent Execution Summary:`);
    result.data.executionLog.forEach((log: any) => {
      const status = log.success ? '✅' : '❌';
      console.log(`  ${status} ${log.agent}: ${log.executionTime}ms ${log.error ? `(${log.error})` : ''}`);
    });
  }

  return courseData;
}

// Legacy function for single-pass generation (kept for backward compatibility)
export async function generateAICourseLegacy(request: CourseGenerationRequest): Promise<GeneratedCourse> {
  const { 
    topic, 
    skillLevel, 
    category, 
    instructorId, 
    price,
    description,
    learningObjectives = [],
    targetModules = 4,
    targetLessonsPerModule = 3,
    additionalContext
  } = request;

  console.log(`📚 Legacy course generation for: ${topic}`);
  
  // Step 1: Research the topic
  let searchQuery = `${topic} music production tutorial guide ${skillLevel} level`;
  if (additionalContext) {
    searchQuery += ` ${additionalContext}`;
  }
  
  let searchResults = [];
  try {
    searchResults = await searchTavily(searchQuery);
  } catch (error) {
    console.log('Tavily search unavailable, proceeding with AI knowledge base');
  }
  
  // Step 2: Generate course structure
  const researchContext = searchResults.length > 0 
    ? searchResults.map(r => `- ${r.title}: ${r.content}`).join('\n')
    : `Using comprehensive music production knowledge base for ${topic} at ${skillLevel} level`;
  
  const objectivesSection = learningObjectives.length > 0 
    ? `\n\nLearning Objectives to Cover:\n${learningObjectives.map(obj => `- ${obj}`).join('\n')}`
    : '';
  
  const contextSection = additionalContext 
    ? `\n\nAdditional Context and Requirements:\n${additionalContext}`
    : '';
  
  const descriptionSection = description 
    ? `\n\nCustom Course Description:\n${description}`
    : '';

  try {
    console.log('Generating course structure...');
    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt()
        },
        {
          role: "user",
          content: `Create a comprehensive professional course EXCLUSIVELY about "${topic}" at ${skillLevel} level.

CRITICAL REQUIREMENTS:
- Generate exactly ${targetModules} modules
- Each module must have exactly ${targetLessonsPerModule} lessons  
- Each lesson must have exactly 3 chapters
- All content must focus only on "${topic}"
- Each chapter content should be 300-500 words focusing on "${topic}"
- Content should be clear and educational
- Include practical examples related to "${topic}"

Research context: ${researchContext}
${descriptionSection}
${objectivesSection}
${contextSection}

Create a well-structured course that progresses from basics to advanced topics, all focused on "${topic}".`
        }
      ],
      temperature: 0.7,
      max_tokens: 8000,
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
                minItems: targetModules,
                maxItems: targetModules,
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    orderIndex: { type: "number" },
                    lessons: {
                      type: "array",
                      minItems: targetLessonsPerModule,
                      maxItems: targetLessonsPerModule,
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

    const generatedContent = completion.choices[0].message.content;
    if (!generatedContent) {
      throw new Error('No content generated from OpenAI');
    }

    const rawData = JSON.parse(generatedContent);
    const courseData = CourseStructureSchema.parse(rawData);

    // Validate structure requirements
    if (courseData.modules.length !== targetModules) {
      throw new Error(`Invalid structure: Expected ${targetModules} modules, but AI generated ${courseData.modules.length} modules`);
    }
    
    const totalLessons = courseData.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0);
    const expectedLessons = targetModules * targetLessonsPerModule;
    
    if (totalLessons !== expectedLessons) {
      throw new Error(`Invalid structure: Expected ${expectedLessons} lessons total, but AI generated ${totalLessons} lessons`);
    }

    // Get course images
    const topicImages = await searchTopicImages(topic, skillLevel);
    const courseThumbnail = topicImages[0] || 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=500&fit=crop';

    const finalCourseData = {
      ...courseData,
      modules: courseData.modules
    };

    return {
      course: {
        ...finalCourseData.course,
        price,
        thumbnail: courseThumbnail,
        instructorId,
        isPublished: false
      },
      modules: finalCourseData.modules,
      lessons: finalCourseData.modules.flatMap((m: any) => m.lessons),
      chapters: finalCourseData.modules.flatMap((m: any) => m.lessons.flatMap((l: any) => l.chapters)),
      stats: {
        modules: finalCourseData.modules.length,
        lessons: finalCourseData.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0),
        chapters: finalCourseData.modules.reduce((acc: number, m: any) => 
          acc + m.lessons.reduce((lacc: number, l: any) => lacc + l.chapters.length, 0), 0)
      }
    };

  } catch (error: any) {
    console.error('Error generating course:', error);
    throw new Error(`Failed to generate course: ${error.message}`);
  }
}

// Keep existing system prompt function
const systemPrompt = () => {
  const now = new Date().toISOString();
  return `You are a world-renowned music production educator and curriculum designer. Today is ${now}. Follow these instructions when creating courses:

CRITICAL: STAY STRICTLY ON THE SPECIFIED TOPIC - Never mix content from other topics or tools
- Every single chapter must be 100% focused on the exact topic requested
- If the topic is "Arpeggiator in Ableton", DO NOT mention overdrive, compression, EQ, or any other unrelated topics
- Use ONLY the specific tool/technique mentioned in the topic throughout the entire course
- Each chapter title, content, and examples must be directly related to the main topic

Content Requirements:
- You are creating professional masterclass-level content suitable for video production
- Each chapter must contain 800-1500 words of comprehensive, video-script-ready content
- Use conversational tone as if teaching directly to a student in a video
- Include specific technical details, parameter values, and step-by-step instructions
- Provide real-world examples and industry best practices specific to the topic
- Structure content for easy conversion to video scripts with clear segments
- Be highly organized with consistent formatting
- Anticipate student needs and provide proactive guidance
- Treat students as motivated learners seeking professional-level knowledge
- Accuracy is critical - provide detailed, actionable information about the SPECIFIC topic only
- Include advanced techniques alongside fundamentals for the SPECIFIC topic
- Consider modern production methods and industry standards for the SPECIFIC topic
- Use detailed explanations with specific examples related ONLY to the topic`;
};

// Fast course generation for initial creation (outline mode)
export async function generateAICourseFast(request: CourseGenerationRequest): Promise<GeneratedCourse> {
  console.log(`🚀 Starting FAST AI course generation for: ${request.topic}`);
  
  try {
    // Quick research phase
    const researchQueries = [
      `${request.topic} music production tutorial ${request.skillLevel}`,
      `${request.topic} techniques guide professional music production`
    ];

    let researchData = [];
    for (const query of researchQueries) {
      try {
        const results = await searchTavily(query);
        researchData.push(...results.slice(0, 3)); // Limit results
        await new Promise(resolve => setTimeout(resolve, 200)); // Short delay
      } catch (error) {
        console.log(`⚠️ Fast research query failed: ${query}`);
      }
    }

    // Generate course structure
    const structureResult = await generateCourseStructure(request, researchData);
    if (!structureResult.success) {
      throw new Error(structureResult.error);
    }

    // Generate OUTLINE content only (fast)
    const courseWithOutlines = await generateCourseOutlines(structureResult.data, request);
    
    // Quick image search (minimal)
    let courseThumbnail = 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=500&fit=crop';
    try {
      const quickImages = await searchTopicImages(`${request.topic} music production`, request.skillLevel);
      if (quickImages.length > 0) {
        courseThumbnail = quickImages[0];
      }
    } catch (error) {
      console.log('⚠️ Quick image search failed, using fallback');
    }

    // Calculate stats
    const stats = calculateCourseStats(courseWithOutlines);
    
    const courseData = {
      title: courseWithOutlines.course.title,
      slug: generateSlug(courseWithOutlines.course.title),
      description: courseWithOutlines.course.description,
      price: request.price,
      thumbnail: courseThumbnail,
      category: request.category,
      skillLevel: request.skillLevel,
      estimatedDuration: courseWithOutlines.course.estimatedDuration,
      instructorId: request.instructorId,
      isPublished: false
    };

    console.log(`✅ Fast course generation completed for: ${request.topic}`);
    
    return {
      course: courseData,
      modules: courseWithOutlines.modules,
      lessons: courseWithOutlines.modules.flatMap((m: any) => m.lessons),
      chapters: courseWithOutlines.modules.flatMap((m: any) => 
        m.lessons.flatMap((l: any) => l.chapters)
      ),
      stats
    };

  } catch (error: any) {
    console.error('Fast course generation failed:', error);
    throw new Error(`Fast course generation failed: ${error.message}`);
  }
}

// Generate course structure with basic validation
async function generateCourseStructure(request: CourseGenerationRequest, researchData: any[]) {
  const researchSummary = researchData.slice(0, 5).map(item => 
    `${item.title}: ${item.content?.substring(0, 200)}...`
  ).join('\n');

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a curriculum design expert for music production education. Create logical, progressive course structures.`
        },
        {
          role: "user",
          content: `Create a course structure for "${request.topic}" at ${request.skillLevel} level.

Research Context:
${researchSummary}

Requirements:
- Generate exactly ${request.targetModules || 4} modules
- Each module must have exactly ${request.targetLessonsPerModule || 3} lessons  
- Each lesson must have exactly 3 chapters
- Focus on "${request.topic}"
- Progressive difficulty

${request.description ? `Description: ${request.description}` : ''}
${request.learningObjectives?.length ? `Objectives: ${request.learningObjectives.join(', ')}` : ''}`
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
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
                minItems: request.targetModules || 4,
                maxItems: request.targetModules || 4,
                items: {
                  type: "object", 
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    orderIndex: { type: "number" },
                    lessons: {
                      type: "array",
                      minItems: request.targetLessonsPerModule || 3,
                      maxItems: request.targetLessonsPerModule || 3,
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
    return { success: true, data: structure };

  } catch (error: any) {
    return { success: false, error: `Structure generation failed: ${error.message}` };
  }
}

// Generate outline content for all chapters (fast, short summaries)
async function generateCourseOutlines(structure: any, request: CourseGenerationRequest) {
  console.log('📝 Generating course outlines...');
  
  // Process all chapters but generate SHORT outline content only
  for (const module of structure.modules) {
    for (const lesson of module.lessons) {
      for (const chapter of lesson.chapters) {
        // Replace detailed content with outline
        chapter.content = `# ${chapter.title}

## Overview
This chapter covers ${chapter.title.toLowerCase()} in the context of ${request.topic}. 

## Learning Objectives
- Understand key concepts of ${chapter.title.toLowerCase()}
- Apply techniques specific to ${request.topic}
- Practice hands-on implementation

## Key Topics
- Introduction and fundamentals
- Practical application techniques
- Industry best practices
- Common challenges and solutions

## Next Steps
Complete the exercises and move to the next chapter to continue your ${request.topic} journey.

*Note: Detailed content will be generated when you access this chapter.*`;

        // Set outline flag for later expansion
        chapter.isOutline = true;
        chapter.wordCount = chapter.content.split(' ').length;
      }
    }
  }

  return structure;
}

// Helper function to calculate course statistics
function calculateCourseStats(structure: any) {
  const moduleCount = structure.modules?.length || 0;
  const lessonCount = structure.modules?.reduce((acc: number, m: any) => 
    acc + (m.lessons?.length || 0), 0) || 0;
  const chapterCount = structure.modules?.reduce((acc: number, m: any) => 
    acc + (m.lessons?.reduce((lacc: number, l: any) => 
      lacc + (l.chapters?.length || 0), 0) || 0), 0) || 0;

  return {
    modules: moduleCount,
    lessons: lessonCount,
    chapters: chapterCount
  };
}

// Helper function to generate a slug from a title
function generateSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50);
} 