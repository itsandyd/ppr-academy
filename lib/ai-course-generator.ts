import OpenAI from 'openai';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { scrapeContent } from './content-scraper';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for course generation
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

// Validation schemas
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

// Enhanced Tavily search function with improved image support
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
      exclude_domains: ['pinterest.com', 'facebook.com', 'instagram.com'], // Exclude social media for more educational content
      max_results: searchType === 'images' ? 10 : 5,
      include_answer: !includeImages,
      include_raw_content: false,
      include_images: includeImages
    };

    // For image-specific searches, adjust the query and options
    if (searchType === 'images') {
      searchOptions.include_images = true;
      searchOptions.max_results = 15;
      searchOptions.include_domains = [
        'unsplash.com',
        'youtube.com', // For video thumbnails
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

// Educational music production images sourced from legitimate platforms
function getEducationalMusicImages(topic: string, skillLevel: string): string[] {
  const topicLower = topic.toLowerCase();
  
  // Authentic DAW interface screenshots and music production content
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

// Enhanced image search with multiple strategies
export async function searchTopicImages(topic: string, skillLevel: string): Promise<string[]> {
  console.log(`🖼️ Searching for course images: ${topic} (${skillLevel})`);
  
  const imageUrls: string[] = [];
  
  try {
    // Strategy 1: Direct image search with Tavily
    const imageQueries = [
      `${topic} music production tutorial interface screenshot`,
      `${topic} ${skillLevel} music production guide`,
      `${topic} DAW plugin interface tutorial`,
      `music production ${topic} workflow setup`
    ];

    for (const query of imageQueries) {
      const results = await searchTavily(query, true, 'images');
      
      // Extract image URLs from results
      for (const result of results) {
        if (result.image_url && isValidImageUrl(result.image_url)) {
          imageUrls.push(result.image_url);
        }
        // Also check for images in content
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
      
      // Don't overwhelm the API
      if (imageUrls.length >= 8) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Strategy 2: Search for YouTube thumbnails and educational content
    if (imageUrls.length < 5) {
      const videoResults = await searchTavily(
        `${topic} music production tutorial youtube ${skillLevel}`,
        false,
        'web'
      );
      
      for (const result of videoResults) {
        // Extract YouTube thumbnail if available
        if (result.url && result.url.includes('youtube.com')) {
          const videoId = extractYouTubeVideoId(result.url);
          if (videoId) {
            imageUrls.push(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
          }
        }
      }
    }

    // Remove duplicates and filter valid URLs
    const uniqueUrls = [...new Set(imageUrls)].filter(url => 
      isValidImageUrl(url) && !url.includes('placeholder')
    );

    if (uniqueUrls.length > 0) {
      console.log(`✅ Found ${uniqueUrls.length} images via Tavily for: ${topic}`);
      return uniqueUrls.slice(0, 6); // Return top 6 images
    }

  } catch (error) {
    console.error('❌ Error searching for topic images via Tavily:', error);
  }
  
  // Fallback to curated educational images
  console.log(`🔄 Using fallback curated images for: ${topic}`);
  return getEducationalMusicImages(topic, skillLevel);
}

// Helper function to validate image URLs
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
    
    // Check if it's from a trusted domain
    const isValidDomain = validDomains.some(domain => 
      urlObj.hostname.includes(domain)
    );
    
    // Check if it has a valid image extension or is from YouTube
    const hasValidExtension = validExtensions.some(ext => 
      urlObj.pathname.toLowerCase().includes(ext)
    ) || urlObj.hostname.includes('youtube.com');
    
    return isValidDomain && hasValidExtension;
  } catch {
    return false;
  }
}

// Helper function to extract YouTube video ID
function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

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

export async function generateAICourse(request: CourseGenerationRequest): Promise<GeneratedCourse> {
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

  // Step 1: Research the topic using Tavily
  console.log(`Researching topic: ${topic}`);
  
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
  
  // Step 2: Generate course structure using OpenAI
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

  const courseStructurePrompt = `
    You are an expert music production educator creating a comprehensive professional course EXCLUSIVELY about "${topic}" at ${skillLevel} level.

    CRITICAL TOPIC FOCUS RULES:
    - This course is ONLY about "${topic}" - do not include any other music production topics
    - Every module, lesson, and chapter must be directly related to "${topic}"
    - If the topic is about a specific tool (like Arpeggiator), focus ONLY on that tool throughout the entire course
    - Do not mix in content about other effects, plugins, or techniques unless directly related to "${topic}"

    Research findings:
    ${researchContext}
    ${descriptionSection}
    ${objectivesSection}
    ${contextSection}

    Create exactly ${targetModules} modules with ${targetLessonsPerModule} lessons each. Each lesson should have 3 chapters.
    All modules, lessons, and chapters must be focused on "${topic}" and nothing else.

    IMPORTANT: Generate ONLY the structure with titles and descriptions. Chapter content will be generated separately.

    Generate complete JSON structure with ALL required fields:

    {
      "course": {
        "title": "Mastering ${topic}: Complete ${skillLevel} Guide",
        "description": "Comprehensive ${skillLevel}-level course focused exclusively on ${topic}",
        "category": "${category}",
        "skillLevel": "${skillLevel}",
        "estimatedDuration": 12
      },
      "modules": [
        {
          "title": "Module title (must be about ${topic})",
          "description": "Module description (must be about ${topic})",
          "orderIndex": 0,
          "lessons": [
            {
              "title": "Lesson title (must be about ${topic})",
              "description": "Lesson description (must be about ${topic})", 
              "orderIndex": 0,
              "chapters": [
                {
                  "title": "Chapter title (must be about ${topic})",
                  "content": "PLACEHOLDER_CONTENT",
                  "duration": 12,
                  "orderIndex": 0
                }
              ]
            }
          ]
        }
      ]
    }
  `;

      try {
    // Step 1: Generate course structure
    console.log('Generating course structure...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt()
        },
        {
          role: "user",
          content: courseStructurePrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8000, // Reduced since we're only generating structure
      response_format: { type: "json_object" }
    });

    const generatedContent = completion.choices[0].message.content;
    if (!generatedContent) {
      throw new Error('No content generated from OpenAI');
    }

    // Parse and validate structure
    const rawData = JSON.parse(generatedContent);
    const courseData = CourseStructureSchema.parse(rawData);

    // Step 2: Generate detailed content for each chapter
    console.log('Generating detailed chapter content...');
    const enhancedModules = await Promise.all(
      courseData.modules.map(async (module: any, moduleIndex: number) => {
        const enhancedLessons = await Promise.all(
          module.lessons.map(async (lesson: any, lessonIndex: number) => {
            const enhancedChapters = [];
            
            // Generate chapters sequentially with small delays to avoid rate limits
            for (let chapterIndex = 0; chapterIndex < lesson.chapters.length; chapterIndex++) {
              const chapter = lesson.chapters[chapterIndex];
              console.log(`Generating content for: ${module.title} > ${lesson.title} > ${chapter.title}`);
              
              try {
                const detailedContent = await generateDetailedChapterContent(
                  topic,
                  chapter.title,
                  skillLevel,
                  module.title,
                  lesson.title
                );
                
                enhancedChapters.push({
                  ...chapter,
                  content: detailedContent.content
                });
                
                // Small delay to avoid rate limiting (except for last chapter)
                if (chapterIndex < lesson.chapters.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              } catch (error) {
                console.error(`Error generating content for chapter ${chapter.title}:`, error);
                // Topic-specific fallback content
                enhancedChapters.push({
                  ...chapter,
                  content: `Welcome to "${chapter.title}" - your guide to mastering ${topic}. This chapter focuses exclusively on ${topic} techniques and applications for ${skillLevel} level students. We'll explore specific aspects of ${topic} that are essential for your music production workflow. Content is being refined to ensure comprehensive coverage of ${topic} and will be updated soon with detailed, hands-on instruction for ${topic}.`
                });
              }
            }
            
            return {
              ...lesson,
              chapters: enhancedChapters
            };
          })
        );
        
        return {
          ...module,
          lessons: enhancedLessons
        };
      })
    );

    // Search for images
    const topicImages = await searchTopicImages(topic, skillLevel);
    const courseThumbnail = topicImages[0] || 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=500&fit=crop';

    // Return structured data with enhanced content
    const finalCourseData = {
      ...courseData,
      modules: enhancedModules
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

// Enhanced chapter content generation
export async function generateDetailedChapterContent(
  topic: string, 
  chapterTitle: string, 
  skillLevel: string, 
  moduleTitle: string, 
  lessonTitle: string
): Promise<{ content: string; images: string[] }> {
  // Search for images
  const chapterImages = await searchTopicImages(`${topic} ${chapterTitle}`, skillLevel);

  const contentPrompt = `Create comprehensive, video-script-ready educational content EXCLUSIVELY about "${topic}" for the chapter "${chapterTitle}".

CRITICAL FOCUS RULES:
- This content must be 100% about "${topic}" and nothing else
- Do NOT mention any other music production topics, effects, or tools
- Every sentence must relate directly to "${topic}"
- Use specific examples and techniques related ONLY to "${topic}"

Context:
- Course Topic: "${topic}" (STAY ON THIS TOPIC ONLY)
- Module: "${moduleTitle}" 
- Lesson: "${lessonTitle}"
- Chapter: "${chapterTitle}"
- Skill Level: ${skillLevel}

Create 1200-2000 words of detailed content about "${topic}" with:
1. Introduction to this aspect of ${topic} (200-300 words)
2. Technical Foundation of ${topic} (300-400 words)
3. Hands-on Implementation of ${topic} (400-600 words)
4. Advanced Applications of ${topic} (200-300 words)
5. Troubleshooting & Mastery of ${topic} (200-300 words)

Format as clean, conversational text suitable for video scripts with clear explanations and examples all related to "${topic}".`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemPrompt()
      },
      {
        role: "user",
        content: contentPrompt
      }
    ],
    temperature: 0.8,
    max_tokens: 6000 // Increased for more comprehensive content per chapter
  });

  const content = completion.choices[0].message.content || `Welcome to "${chapterTitle}" - your comprehensive guide to ${topic}. This chapter focuses exclusively on ${topic} techniques and applications for ${skillLevel} level students. We'll dive deep into the specific aspects of ${topic} that will elevate your music production skills. You'll learn hands-on techniques, advanced applications, and industry best practices for ${topic}. Content is being refined to ensure complete coverage of ${topic} fundamentals and advanced concepts.`;
  
  return {
    content,
    images: chapterImages
  };
} 