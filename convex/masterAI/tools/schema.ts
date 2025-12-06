import { v } from "convex/values";

// ============================================================================
// AI TOOL DEFINITIONS
// ============================================================================
// This schema defines all tools the AI can call to take actions within the app

export type ToolParameterType = "string" | "number" | "boolean" | "array" | "object";

export interface ToolParameter {
  type: ToolParameterType;
  required: boolean;
  description: string;
  default?: unknown;
  enum?: string[];
  items?: { type: ToolParameterType }; // For array types
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: "course" | "content" | "product" | "query" | "settings";
  parameters: Record<string, ToolParameter>;
  requiresConfirmation: boolean;
  permissions: Array<"creator" | "admin" | "student">;
  examples?: string[];
}

// ============================================================================
// TOOL REGISTRY
// ============================================================================

export const AI_TOOLS: Record<string, ToolDefinition> = {
  // ========================================================================
  // COURSE MANAGEMENT TOOLS
  // ========================================================================
  
  createCourse: {
    name: "createCourse",
    description: "Create a new course with title, description, and optional settings. The course will be created as a draft (unpublished).",
    category: "course",
    parameters: {
      title: {
        type: "string",
        required: true,
        description: "The title of the course",
      },
      description: {
        type: "string",
        required: false,
        description: "Course description explaining what students will learn",
      },
      category: {
        type: "string",
        required: false,
        description: "Course category (e.g., 'Music Production', 'Sound Design', 'Mixing')",
        enum: ["Music Production", "Sound Design", "Mixing", "Mastering", "Synthesis", "Sampling", "Arrangement", "Music Theory", "Business"],
      },
      skillLevel: {
        type: "string",
        required: false,
        description: "Target skill level for the course",
        enum: ["beginner", "intermediate", "advanced", "all-levels"],
        default: "intermediate",
      },
      price: {
        type: "number",
        required: false,
        description: "Course price in dollars (0 for free)",
        default: 0,
      },
      checkoutHeadline: {
        type: "string",
        required: false,
        description: "Marketing headline shown on checkout page",
      },
    },
    requiresConfirmation: true,
    permissions: ["creator", "admin"],
    examples: [
      "Create me a course on Music Theory for beginners",
      "Make a new course called 'Advanced Mixing Techniques' priced at $49",
    ],
  },

  createCourseWithModules: {
    name: "createCourseWithModules",
    description: "Create a complete course with modules, lessons, and chapters in one operation. Perfect for generating a full course structure.",
    category: "course",
    parameters: {
      title: {
        type: "string",
        required: true,
        description: "The title of the course",
      },
      description: {
        type: "string",
        required: false,
        description: "Course description",
      },
      category: {
        type: "string",
        required: false,
        description: "Course category",
      },
      skillLevel: {
        type: "string",
        required: false,
        description: "Target skill level",
        enum: ["beginner", "intermediate", "advanced", "all-levels"],
      },
      price: {
        type: "number",
        required: false,
        description: "Course price in dollars",
        default: 0,
      },
      checkoutHeadline: {
        type: "string",
        required: false,
        description: "Marketing headline for checkout",
      },
      modules: {
        type: "array",
        required: true,
        description: "Array of modules with lessons and chapters",
        items: { type: "object" },
      },
    },
    requiresConfirmation: true,
    permissions: ["creator", "admin"],
    examples: [
      "Create a course on Music Theory with 5 modules covering notes, scales, chords, progressions, and rhythm",
    ],
  },

  addModuleToCourse: {
    name: "addModuleToCourse",
    description: "Add a new module to an existing course",
    category: "course",
    parameters: {
      courseId: {
        type: "string",
        required: true,
        description: "The ID of the course to add the module to",
      },
      title: {
        type: "string",
        required: true,
        description: "Module title",
      },
      description: {
        type: "string",
        required: false,
        description: "Module description",
      },
      position: {
        type: "number",
        required: false,
        description: "Position/order of the module (0-indexed)",
      },
    },
    requiresConfirmation: false, // Auto-execute after course confirmed
    permissions: ["creator", "admin"],
    examples: [
      "Add a new module on 'EQ Fundamentals' to my Mixing course",
    ],
  },

  addLessonToModule: {
    name: "addLessonToModule",
    description: "Add a new lesson to an existing module",
    category: "course",
    parameters: {
      moduleId: {
        type: "string",
        required: true,
        description: "The ID of the module to add the lesson to",
      },
      title: {
        type: "string",
        required: true,
        description: "Lesson title",
      },
      description: {
        type: "string",
        required: false,
        description: "Lesson description",
      },
      position: {
        type: "number",
        required: false,
        description: "Position/order of the lesson",
      },
    },
    requiresConfirmation: false,
    permissions: ["creator", "admin"],
    examples: [
      "Add a lesson about parametric EQ to module X",
    ],
  },

  addChapterToLesson: {
    name: "addChapterToLesson",
    description: "Add a chapter with content to an existing lesson",
    category: "course",
    parameters: {
      lessonId: {
        type: "string",
        required: true,
        description: "The ID of the lesson to add the chapter to",
      },
      courseId: {
        type: "string",
        required: true,
        description: "The ID of the parent course",
      },
      title: {
        type: "string",
        required: true,
        description: "Chapter title",
      },
      content: {
        type: "string",
        required: false,
        description: "Chapter content (text/markdown)",
      },
      position: {
        type: "number",
        required: false,
        description: "Position/order of the chapter",
      },
    },
    requiresConfirmation: false,
    permissions: ["creator", "admin"],
    examples: [
      "Add a chapter about frequency ranges to the EQ lesson",
    ],
  },

  updateCourse: {
    name: "updateCourse",
    description: "Update an existing course's details (title, description, price, etc.)",
    category: "course",
    parameters: {
      courseId: {
        type: "string",
        required: true,
        description: "The ID of the course to update",
      },
      title: {
        type: "string",
        required: false,
        description: "New course title",
      },
      description: {
        type: "string",
        required: false,
        description: "New course description",
      },
      price: {
        type: "number",
        required: false,
        description: "New price",
      },
      isPublished: {
        type: "boolean",
        required: false,
        description: "Whether to publish/unpublish the course",
      },
    },
    requiresConfirmation: true,
    permissions: ["creator", "admin"],
    examples: [
      "Update my Music Theory course price to $29",
      "Publish my Mixing Fundamentals course",
    ],
  },

  // ========================================================================
  // CONTENT GENERATION TOOLS
  // ========================================================================

  generateLessonContent: {
    name: "generateLessonContent",
    description: "Use AI to generate detailed lesson content based on a topic. Returns formatted content that can be added to a chapter.",
    category: "content",
    parameters: {
      topic: {
        type: "string",
        required: true,
        description: "The topic to generate content about",
      },
      style: {
        type: "string",
        required: false,
        description: "Content style/difficulty level",
        enum: ["beginner", "intermediate", "advanced"],
        default: "intermediate",
      },
      wordCount: {
        type: "number",
        required: false,
        description: "Approximate word count for the content",
        default: 1000,
      },
      includeExamples: {
        type: "boolean",
        required: false,
        description: "Whether to include practical examples",
        default: true,
      },
    },
    requiresConfirmation: false,
    permissions: ["creator", "admin"],
    examples: [
      "Generate content about sidechain compression for intermediate producers",
    ],
  },

  generateQuizQuestions: {
    name: "generateQuizQuestions",
    description: "Generate quiz questions to test understanding of a topic or lesson",
    category: "content",
    parameters: {
      topic: {
        type: "string",
        required: true,
        description: "Topic to generate questions about",
      },
      questionCount: {
        type: "number",
        required: false,
        description: "Number of questions to generate",
        default: 5,
      },
      difficulty: {
        type: "string",
        required: false,
        description: "Question difficulty",
        enum: ["easy", "medium", "hard", "mixed"],
        default: "medium",
      },
    },
    requiresConfirmation: false,
    permissions: ["creator", "admin"],
    examples: [
      "Generate 10 quiz questions about compression",
    ],
  },

  generateCourseOutline: {
    name: "generateCourseOutline",
    description: "Generate a complete course outline with modules and lessons based on a topic. Does NOT create the course, just returns the structure for review.",
    category: "content",
    parameters: {
      topic: {
        type: "string",
        required: true,
        description: "Main topic/subject for the course",
      },
      moduleCount: {
        type: "number",
        required: false,
        description: "Desired number of modules",
        default: 5,
      },
      targetAudience: {
        type: "string",
        required: false,
        description: "Target audience skill level",
        enum: ["beginner", "intermediate", "advanced"],
        default: "intermediate",
      },
      style: {
        type: "string",
        required: false,
        description: "Course style",
        enum: ["practical", "theoretical", "project-based", "comprehensive"],
        default: "practical",
      },
    },
    requiresConfirmation: false,
    permissions: ["creator", "admin"],
    examples: [
      "Generate an outline for a course on Sound Design with 6 modules for beginners",
    ],
  },

  // ========================================================================
  // PRODUCT MANAGEMENT TOOLS
  // ========================================================================

  createProduct: {
    name: "createProduct",
    description: "Create a new digital product (sample pack, preset pack, MIDI pack, etc.)",
    category: "product",
    parameters: {
      title: {
        type: "string",
        required: true,
        description: "Product title",
      },
      productType: {
        type: "string",
        required: true,
        description: "Type of digital product",
        enum: ["sample_pack", "preset_pack", "midi_pack", "template", "plugin", "other"],
      },
      description: {
        type: "string",
        required: false,
        description: "Product description",
      },
      price: {
        type: "number",
        required: true,
        description: "Product price in dollars",
      },
      tags: {
        type: "array",
        required: false,
        description: "Tags for discoverability",
        items: { type: "string" },
      },
    },
    requiresConfirmation: true,
    permissions: ["creator", "admin"],
    examples: [
      "Create a sample pack called 'Lo-Fi Drum Hits' for $15",
    ],
  },

  // ========================================================================
  // QUERY TOOLS (Read-Only)
  // ========================================================================

  listMyCourses: {
    name: "listMyCourses",
    description: "Get a list of all courses owned by the user with their status",
    category: "query",
    parameters: {
      status: {
        type: "string",
        required: false,
        description: "Filter by publication status",
        enum: ["all", "published", "draft"],
        default: "all",
      },
      limit: {
        type: "number",
        required: false,
        description: "Maximum number of courses to return",
        default: 10,
      },
    },
    requiresConfirmation: false,
    permissions: ["creator", "admin", "student"],
    examples: [
      "Show me all my draft courses",
      "List my published courses",
    ],
  },

  getCourseDetails: {
    name: "getCourseDetails",
    description: "Get full details of a specific course including modules, lessons, and chapters",
    category: "query",
    parameters: {
      courseId: {
        type: "string",
        required: true,
        description: "The ID of the course to get details for",
      },
    },
    requiresConfirmation: false,
    permissions: ["creator", "admin", "student"],
    examples: [
      "Show me the details of my Mixing course",
    ],
  },

  getCourseStats: {
    name: "getCourseStats",
    description: "Get enrollment and engagement statistics for a course",
    category: "query",
    parameters: {
      courseId: {
        type: "string",
        required: true,
        description: "The ID of the course",
      },
    },
    requiresConfirmation: false,
    permissions: ["creator", "admin"],
    examples: [
      "How many students are enrolled in my Music Theory course?",
    ],
  },

  searchCoursesByTopic: {
    name: "searchCoursesByTopic",
    description: "Search the user's courses by topic or keywords",
    category: "query",
    parameters: {
      query: {
        type: "string",
        required: true,
        description: "Search query",
      },
      limit: {
        type: "number",
        required: false,
        description: "Maximum results to return",
        default: 5,
      },
    },
    requiresConfirmation: false,
    permissions: ["creator", "admin", "student"],
    examples: [
      "Find my courses about mixing",
    ],
  },

  listMyProducts: {
    name: "listMyProducts",
    description: "Get a list of all digital products owned by the user",
    category: "query",
    parameters: {
      productType: {
        type: "string",
        required: false,
        description: "Filter by product type",
        enum: ["all", "sample_pack", "preset_pack", "midi_pack", "template", "plugin"],
        default: "all",
      },
      limit: {
        type: "number",
        required: false,
        description: "Maximum number of products to return",
        default: 10,
      },
    },
    requiresConfirmation: false,
    permissions: ["creator", "admin"],
    examples: [
      "Show me all my sample packs",
    ],
  },

  // ========================================================================
  // SETTINGS & MANAGEMENT TOOLS
  // ========================================================================

  duplicateCourse: {
    name: "duplicateCourse",
    description: "Create a copy of an existing course with all its modules, lessons, and chapters",
    category: "settings",
    parameters: {
      courseId: {
        type: "string",
        required: true,
        description: "The ID of the course to duplicate",
      },
      newTitle: {
        type: "string",
        required: false,
        description: "Title for the duplicated course (defaults to 'Copy of [original]')",
      },
    },
    requiresConfirmation: true,
    permissions: ["creator", "admin"],
    examples: [
      "Duplicate my Music Theory course",
    ],
  },

  deleteCourse: {
    name: "deleteCourse",
    description: "Delete a course and all its content. This action cannot be undone.",
    category: "settings",
    parameters: {
      courseId: {
        type: "string",
        required: true,
        description: "The ID of the course to delete",
      },
      confirmDelete: {
        type: "boolean",
        required: true,
        description: "Must be true to confirm deletion",
      },
    },
    requiresConfirmation: true,
    permissions: ["creator", "admin"],
    examples: [
      "Delete my old test course",
    ],
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all tool names for a given category
 */
export function getToolsByCategory(category: ToolDefinition["category"]): string[] {
  return Object.entries(AI_TOOLS)
    .filter(([_, tool]) => tool.category === category)
    .map(([name]) => name);
}

/**
 * Get tools available for a user role
 */
export function getToolsForRole(role: "creator" | "admin" | "student"): string[] {
  return Object.entries(AI_TOOLS)
    .filter(([_, tool]) => tool.permissions.includes(role))
    .map(([name]) => name);
}

/**
 * Check if a tool requires confirmation
 */
export function toolRequiresConfirmation(toolName: string): boolean {
  return AI_TOOLS[toolName]?.requiresConfirmation ?? true;
}

/**
 * Get a simplified tool description for the LLM
 */
export function getToolDescriptionsForLLM(): string {
  return Object.entries(AI_TOOLS)
    .map(([name, tool]) => {
      const params = Object.entries(tool.parameters)
        .map(([pName, p]) => `  - ${pName}${p.required ? " (required)" : ""}: ${p.description}`)
        .join("\n");
      return `${name}: ${tool.description}\n${params}`;
    })
    .join("\n\n");
}

/**
 * Validate tool parameters against schema
 */
export function validateToolParameters(
  toolName: string,
  params: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const tool = AI_TOOLS[toolName];
  if (!tool) {
    return { valid: false, errors: [`Unknown tool: ${toolName}`] };
  }

  const errors: string[] = [];
  
  // Check required parameters
  for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
    if (paramDef.required && !(paramName in params)) {
      errors.push(`Missing required parameter: ${paramName}`);
    }
    
    // Type validation
    if (paramName in params) {
      const value = params[paramName];
      const expectedType = paramDef.type;
      
      if (expectedType === "string" && typeof value !== "string") {
        errors.push(`Parameter ${paramName} must be a string`);
      }
      if (expectedType === "number" && typeof value !== "number") {
        errors.push(`Parameter ${paramName} must be a number`);
      }
      if (expectedType === "boolean" && typeof value !== "boolean") {
        errors.push(`Parameter ${paramName} must be a boolean`);
      }
      if (expectedType === "array" && !Array.isArray(value)) {
        errors.push(`Parameter ${paramName} must be an array`);
      }
      
      // Enum validation
      if (paramDef.enum && !paramDef.enum.includes(value as string)) {
        errors.push(`Parameter ${paramName} must be one of: ${paramDef.enum.join(", ")}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// VALIDATORS FOR CONVEX
// ============================================================================

export const toolCallValidator = v.object({
  tool: v.string(),
  parameters: v.any(),
  reasoning: v.optional(v.string()),
});

export const toolCallResultValidator = v.object({
  tool: v.string(),
  success: v.boolean(),
  result: v.optional(v.any()),
  error: v.optional(v.string()),
});

export const actionProposalValidator = v.object({
  type: v.literal("action_proposal"),
  proposedActions: v.array(v.object({
    tool: v.string(),
    parameters: v.any(),
    description: v.string(),
    requiresConfirmation: v.boolean(),
  })),
  message: v.string(),
  summary: v.string(),
});

export const actionsExecutedValidator = v.object({
  type: v.literal("actions_executed"),
  results: v.array(toolCallResultValidator),
  summary: v.string(),
  links: v.optional(v.array(v.object({
    label: v.string(),
    url: v.string(),
  }))),
});

// ============================================================================
// INTENT TYPES
// ============================================================================

export type IntentType = "question" | "create" | "modify" | "delete" | "query" | "generate";

export const intentTypeValidator = v.union(
  v.literal("question"),
  v.literal("create"),
  v.literal("modify"),
  v.literal("delete"),
  v.literal("query"),
  v.literal("generate")
);

export interface ToolCall {
  tool: string;
  parameters: Record<string, unknown>;
  reasoning?: string;
}

export interface ActionProposal {
  type: "action_proposal";
  proposedActions: Array<{
    tool: string;
    parameters: Record<string, unknown>;
    description: string;
    requiresConfirmation: boolean;
  }>;
  message: string;
  summary: string;
}

export interface ActionsExecuted {
  type: "actions_executed";
  results: Array<{
    tool: string;
    success: boolean;
    result?: unknown;
    error?: string;
  }>;
  summary: string;
  links?: Array<{
    label: string;
    url: string;
  }>;
}

