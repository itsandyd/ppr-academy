import * as cheerio from "cheerio";
import { YoutubeTranscript } from "youtube-transcript";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import OpenAI from "openai";

// Lazy OpenAI initialization to avoid build-time issues
function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function fixYouTubeTranscriptErrors(content: string, title: string): Promise<string> {
  try {
    const prompt = `Clean up this text and return only the cleaned content without any prefixes or explanatory text:

${content}`;

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Low temperature for consistent corrections
      max_tokens: 20000, // Increased for longer transcripts
    });

    let correctedContent = response.choices[0].message.content || content;
    
    // Remove common AI response prefixes if they exist
    correctedContent = correctedContent
      .replace(/^Here's a cleaned-up version of the text:\s*[-—]*\s*/i, '')
      .replace(/^Here's the cleaned-up text:\s*[-—]*\s*/i, '')
      .replace(/^Cleaned text:\s*[-—]*\s*/i, '')
      .trim();

    return correctedContent;
  } catch (error) {
    console.error('Error fixing YouTube transcript:', error);
    return content; // Return original if processing fails
  }
}

async function processContentWithAI(content: string, type: 'youtube' | 'article', title: string): Promise<string> {
  if (type === 'youtube') {
    // Special processing for YouTube transcripts - only fix transcription errors
    return await fixYouTubeTranscriptErrors(content, title);
  }
  
  try {
    const prompt = `Clean up and format this article content to make it more readable and well-structured for educational notes.

Raw content:
${content}

Please:
1. Improve readability and flow
2. Add proper paragraph structure
3. Remove any irrelevant navigation or ads text
4. Focus on the main educational content
5. Preserve all important information

Format as plain text with clear section breaks using line spacing and simple text formatting. Do not use markdown syntax (no #, ##, *, -, etc.). Use clear paragraph breaks and simple indentation for structure. Make it readable as plain text in a textarea.

Return only the cleaned content without any meta-commentary.`;

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      max_tokens: 5000,
      temperature: 0.3,
    });

    return response.choices[0].message.content || content;
  } catch (error) {
    console.error('Error processing content with AI:', error);
    // Return original content if AI processing fails
    return content;
  }
}

interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  type: 'article' | 'youtube' | 'unknown';
  chunks: string[];
  metadata?: {
    author?: string;
    publishDate?: string;
    duration?: string;
    description?: string;
  };
}

export async function scrapeContent(url: string, fixErrors: boolean = false): Promise<ScrapedContent> {
  try {
    let result: ScrapedContent;
    
    // Determine content type and scrape
    if (isYouTubeUrl(url)) {
      result = await scrapeYouTubeVideo(url);

      if (fixErrors) {

        result.content = await processContentWithAI(result.content, 'youtube', result.title);

      } else {

      }
      
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ["\n\n", "\n", ". ", " ", ""]
      });
      
      result.chunks = await textSplitter.splitText(result.content);
      return result;
    } else {
      result = await scrapeArticle(url);
      // Only process articles for better readability
      result.content = await processContentWithAI(result.content, 'article', result.title);
    }
    
    // Use Langchain's text splitter for better chunking
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", ". ", " ", ""]
    });
    
    const chunks = await textSplitter.splitText(result.content);
    result.chunks = chunks;
    
    return result;
  } catch (error) {
    console.error('Error scraping content:', error);
    throw new Error(`Failed to scrape content from ${url}: ${(error as Error).message}`);
  }
}

function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/.test(url);
}

function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

async function scrapeYouTubeVideo(url: string): Promise<ScrapedContent> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  try {
    // Get transcript with retry logic for intermittent failures
    let transcript: any[] | null = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const result = await YoutubeTranscript.fetchTranscript(videoId);
        if (result && result.length > 0) {
          transcript = result;
          break; // Success, exit retry loop
        }
        throw new Error('Empty transcript received');
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error(`No transcript available for this video. The video may not have captions enabled, or captions may be auto-generated and unavailable for extraction.`);
        }
        
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!transcript || transcript.length === 0) {
      throw new Error(`No transcript available for this video. The video may not have captions enabled, or captions may be auto-generated and unavailable for extraction.`);
    }
    
    // Preserve natural speech flow with line breaks for better readability
    const content = transcript.map(item => item.text.trim()).join('\n');

    // Get video metadata
    const metadata = await getYouTubeMetadata(videoId);

    return {
      title: metadata.title || 'YouTube Video',
      content: content,
      url: url,
      type: 'youtube',
      chunks: [], // Will be populated by the main scrapeContent function
      metadata: {
        author: metadata.author,
        duration: metadata.duration,
        description: metadata.description,
        publishDate: metadata.publishDate
      }
    };
  } catch (error) {
    console.error(`YouTube transcript error for video ${videoId}:`, error);
    throw new Error(`Failed to get YouTube transcript: ${(error as Error).message}. Make sure the video has captions available.`);
  }
}

async function getYouTubeMetadata(videoId: string): Promise<any> {
  try {
    // Use YouTube oEmbed API to get basic metadata
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch video metadata');
    }
    
    const data = await response.json() as any;
    
    return {
      title: data.title,
      author: data.author_name,
      description: data.title, // oEmbed doesn't provide description
      duration: null, // oEmbed doesn't provide duration
      publishDate: null // oEmbed doesn't provide publish date
    };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    return {
      title: 'YouTube Video',
      author: 'Unknown',
      description: '',
      duration: null,
      publishDate: null
    };
  }
}

async function scrapeArticle(url: string): Promise<ScrapedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    let title = $('title').text() || 
                $('h1').first().text() || 
                $('meta[property="og:title"]').attr('content') || 
                'Untitled Article';

    // Extract main content
    let content = '';
    
    // Try multiple selectors for article content
    const contentSelectors = [
      'article',
      '[class*="content"]',
      '[class*="article"]',
      '[class*="post"]',
      '[id*="content"]',
      'main',
      '.entry-content',
      '.post-content',
      '.article-body',
      '.story-body'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        if (content.length > 100) { // Only use if we get substantial content
          break;
        }
      }
    }

    // Fallback: extract all paragraph text
    if (!content || content.length < 100) {
      content = $('p').map((i, el) => $(el).text()).get().join(' ').trim();
    }

    // Clean up content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();

    // Extract metadata
    const author = $('meta[name="author"]').attr('content') || 
                  $('meta[property="article:author"]').attr('content') ||
                  $('.author').first().text() ||
                  $('[class*="author"]').first().text();

    const publishDate = $('meta[property="article:published_time"]').attr('content') ||
                       $('meta[name="publish-date"]').attr('content') ||
                       $('time').attr('datetime');

    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content');

    if (!content || content.length < 50) {
      throw new Error('Could not extract meaningful content from the article');
    }

    return {
      title: title.trim(),
      content: content,
      url: url,
      type: 'article',
      chunks: [], // Will be populated by the main scrapeContent function
      metadata: {
        author: author?.trim(),
        publishDate: publishDate,
        description: description?.trim()
      }
    };
  } catch (error) {
    throw new Error(`Failed to scrape article: ${(error as Error).message}`);
  }
}

// Simple text chunking for vector storage
export function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 100): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += maxChunkSize - overlap) {
    const chunk = words.slice(i, i + maxChunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

// Generate embeddings using OpenAI
export async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, returning placeholder embeddings');
      return new Array(1536).fill(0).map(() => Math.random() - 0.5);
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002'
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    // Return a placeholder embedding for development
    return new Array(1536).fill(0).map(() => Math.random() - 0.5);
  }
}

// Search and scrape content for course research
export async function searchAndScrapeContent(query: string, maxResults: number = 5): Promise<ScrapedContent[]> {
  try {
    // This could be enhanced with actual search APIs like Google Custom Search
    // For now, return empty array - in production you'd integrate with search APIs
    return [];
  } catch (error) {
    console.error('Error searching and scraping content:', error);
    return [];
  }
} 