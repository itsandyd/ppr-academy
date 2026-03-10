/**
 * Code validation utilities for LLM-generated Remotion compositions.
 *
 * Three layers of validation:
 *   1. Syntax — is it parseable TypeScript?
 *   2. Security — does it contain forbidden patterns?
 *   3. Structure — does it have the right shape for Remotion?
 */

// ─── Forbidden Patterns (from Section 12 of the design doc) ────────────────

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bfetch\s*\(/, label: "fetch()" },
  { pattern: /\bXMLHttpRequest/i, label: "XMLHttpRequest" },
  { pattern: /\beval\s*\(/, label: "eval()" },
  { pattern: /\bnew\s+Function\s*\(/, label: "new Function()" },
  { pattern: /\brequire\s*\(/, label: "require()" },
  { pattern: /\bimport\s*\(/, label: "dynamic import()" },
  { pattern: /\bprocess\./, label: "process.*" },
  { pattern: /\b__dirname\b/, label: "__dirname" },
  { pattern: /\b__filename\b/, label: "__filename" },
  { pattern: /\bfs\./, label: "fs.*" },
  { pattern: /\bchild_process\b/, label: "child_process" },
  { pattern: /\bexecSync\s*\(/, label: "execSync()" },
  { pattern: /\bspawnSync\s*\(/, label: "spawnSync()" },
  { pattern: /\bBuffer\./, label: "Buffer.*" },
  { pattern: /\bglobalThis\./, label: "globalThis.*" },
  { pattern: /\bwindow\.location/, label: "window.location" },
  { pattern: /\bdocument\.cookie/, label: "document.cookie" },
  { pattern: /\bnavigator\./, label: "navigator.*" },
  { pattern: /\blocalStorage\b/, label: "localStorage" },
  { pattern: /\bsessionStorage\b/, label: "sessionStorage" },
  { pattern: /\bWebSocket\b/, label: "WebSocket" },
  { pattern: /\bEventSource\b/, label: "EventSource" },
  { pattern: /\bServiceWorker\b/, label: "ServiceWorker" },
  { pattern: /\bimportScripts\b/, label: "importScripts" },
];

// ─── Syntax Validation ─────────────────────────────────────────────────────

export function validateSyntax(code: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for obvious syntax issues via simple heuristics
  // (We can't run the full TS compiler in the Convex Node runtime easily,
  //  so we do lightweight checks and let Remotion catch deeper issues at render.)

  // Check balanced braces
  let braceCount = 0;
  let parenCount = 0;
  let bracketCount = 0;
  for (const char of code) {
    if (char === "{") braceCount++;
    if (char === "}") braceCount--;
    if (char === "(") parenCount++;
    if (char === ")") parenCount--;
    if (char === "[") bracketCount++;
    if (char === "]") bracketCount--;

    if (braceCount < 0) {
      errors.push("Unmatched closing brace '}'");
      break;
    }
    if (parenCount < 0) {
      errors.push("Unmatched closing parenthesis ')'");
      break;
    }
    if (bracketCount < 0) {
      errors.push("Unmatched closing bracket ']'");
      break;
    }
  }

  if (braceCount !== 0 && !errors.some((e) => e.includes("brace"))) {
    errors.push(`Unbalanced braces: ${braceCount > 0 ? "missing closing" : "extra closing"} (off by ${Math.abs(braceCount)})`);
  }
  if (parenCount !== 0 && !errors.some((e) => e.includes("paren"))) {
    errors.push(`Unbalanced parentheses: off by ${Math.abs(parenCount)}`);
  }
  if (bracketCount !== 0 && !errors.some((e) => e.includes("bracket"))) {
    errors.push(`Unbalanced brackets: off by ${Math.abs(bracketCount)}`);
  }

  // Check for common JSX errors
  // Unclosed JSX tags (simple check)
  const selfClosingOrVoid =
    /\bimg\b|\bbr\b|\bhr\b|\binput\b|\bmeta\b|\blink\b|\barea\b/;
  const openTags = code.match(/<([A-Z][A-Za-z0-9]*)[^>]*(?<!\/)>/g) || [];
  const closeTags = code.match(/<\/([A-Z][A-Za-z0-9]*)>/g) || [];
  // This is a rough check — React components
  if (openTags.length > 0 && closeTags.length === 0 && openTags.length > 3) {
    errors.push("Possible unclosed JSX tags — many opening tags but no closing tags found");
  }

  // Check for empty code
  if (code.trim().length < 50) {
    errors.push("Generated code is suspiciously short (< 50 chars)");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Security Validation ────────────────────────────────────────────────────

export function validateSecurity(code: string): {
  safe: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  for (const { pattern, label } of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      violations.push(`Forbidden pattern detected: ${label}`);
    }
  }

  // Check for attempts to break out of the function scope
  if (/\bthis\s*\.\s*constructor/.test(code)) {
    violations.push("Attempt to access constructor chain");
  }
  if (/\bObject\s*\.\s*getPrototypeOf/.test(code)) {
    violations.push("Attempt to traverse prototype chain");
  }
  if (/\barguments\s*\.\s*callee/.test(code)) {
    violations.push("arguments.callee access");
  }

  return { safe: violations.length === 0, violations };
}

// ─── Structure Validation ───────────────────────────────────────────────────

export function validateStructure(code: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // The generated code should be a function body that returns a React component.
  // Expected pattern:
  //   const { AbsoluteFill, Sequence, ... } = Remotion;
  //   const { FadeUp, CenterScene, ... } = Components;
  //   const MyVideo = () => { ... };
  //   return MyVideo;

  // Must have a return statement
  if (!/\breturn\s+\w+/.test(code)) {
    errors.push("No 'return ComponentName' found — the code must return a React component");
  }

  // Must destructure from Remotion
  if (!/Remotion/.test(code)) {
    errors.push("No reference to 'Remotion' — must destructure from the Remotion parameter");
  }

  // Must use AbsoluteFill or Sequence (core Remotion primitives)
  if (!/AbsoluteFill/.test(code) && !/Sequence/.test(code)) {
    errors.push("No AbsoluteFill or Sequence usage — likely not a valid Remotion composition");
  }

  // Should define at least one component (arrow function or function declaration with JSX)
  if (!/</.test(code)) {
    errors.push("No JSX found — the code must contain React components with JSX");
  }

  // Must be substantial enough to be a real composition
  if (code.length < 500) {
    errors.push(`Code is only ${code.length} chars — too short for a real video composition`);
  }

  return { valid: errors.length === 0, errors };
}

// ─── Combined Validation ────────────────────────────────────────────────────

export function validateAll(code: string): {
  valid: boolean;
  errors: string[];
} {
  const allErrors: string[] = [];

  const syntax = validateSyntax(code);
  const security = validateSecurity(code);
  const structure = validateStructure(code);

  allErrors.push(...syntax.errors.map((e) => `[Syntax] ${e}`));
  allErrors.push(...security.violations.map((e) => `[Security] ${e}`));
  allErrors.push(...structure.errors.map((e) => `[Structure] ${e}`));

  return { valid: allErrors.length === 0, errors: allErrors };
}

// ─── Code Extraction Helper ─────────────────────────────────────────────────

/**
 * Extract code from an LLM response that might contain markdown fences.
 * Strips ```typescript ... ``` or ```tsx ... ``` wrappers.
 */
export function extractCode(raw: string): string {
  let code = raw.trim();

  // Remove markdown code fences (including ```javascript variant)
  const fencePattern = /^```(?:typescript|tsx|ts|jsx|js|javascript)?\s*\n?([\s\S]*?)\n?```$/;
  const match = code.match(fencePattern);
  if (match) {
    code = match[1].trim();
  }

  // Also handle case where there's text before/after the fence
  const innerMatch = code.match(/```(?:typescript|tsx|ts|jsx|js|javascript)?\s*\n?([\s\S]*?)\n?```/);
  if (innerMatch && !match) {
    code = innerMatch[1].trim();
  }

  return code;
}

// ─── Scene Code Cleaning ────────────────────────────────────────────────────

/**
 * Clean AI-generated scene code before validation.
 * Strips markdown fences, import/export lines, and text outside the component.
 */
export function cleanSceneCode(raw: string): string {
  let code = raw.trim();

  // Strip markdown fences — handle all variants:
  // Opening fences: ```javascript, ```tsx, ```jsx, ```js, ```typescript, plain ```
  // Fences with code on the same line: ```javascript const Scene6...
  // Fences with leading whitespace or newlines
  // Closing fences: ``` at end of output
  code = code.replace(/^\s*```(?:typescript|tsx|ts|jsx|js|javascript)?\s*\n/gm, "");
  // Handle opening fence with code continuing on the same line (no newline after lang tag)
  code = code.replace(/^\s*```(?:typescript|tsx|ts|jsx|js|javascript)\s+/gm, "");
  // Handle plain opening fence with code on same line
  code = code.replace(/^\s*```\s+(?=\S)/gm, "");
  // Closing fences (on their own line or at end of string)
  code = code.replace(/\n?\s*```\s*$/gm, "");
  code = code.trim();

  // Strip lines that start with import
  code = code
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("import "))
    .join("\n");

  // Strip lines that start with export (export default, export const, etc.)
  code = code
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("export "))
    .join("\n");

  // Strip text before the first const/var/function declaration
  const declMatch = code.match(
    /^([\s\S]*?)((?:const|var|let|function)\s+(?:Scene|[A-Z])\w*)/m
  );
  if (declMatch && declMatch.index !== undefined) {
    const beforeDecl = declMatch[1];
    // Only strip if there's non-whitespace text before (explanation text)
    if (beforeDecl.trim().length > 0) {
      code = code.substring(declMatch.index + beforeDecl.length);
    }
  }

  // Strip text after the final `};` (trailing explanation text)
  const lastSemicolon = code.lastIndexOf("};");
  if (lastSemicolon !== -1) {
    const after = code.substring(lastSemicolon + 2).trim();
    // Only trim if there's trailing non-code text
    if (after.length > 0 && !after.startsWith("const ") && !after.startsWith("var ")) {
      code = code.substring(0, lastSemicolon + 2);
    }
  }

  return code.trim();
}

/**
 * Detect if cleaned output is planning text (not code).
 * Returns true if the text appears to be planning notes, frame breakdowns,
 * or other non-code output from the AI.
 */
export function isNonCodeOutput(code: string): boolean {
  const head = code.substring(0, 200);
  // Must contain at least one code indicator in the first 200 chars
  const hasCodeIndicator =
    /\bconst\s/.test(head) ||
    /\bfunction\s/.test(head) ||
    /=>/.test(head) ||
    /\breturn\s*\(/.test(head) ||
    /\bvar\s/.test(head) ||
    /\blet\s/.test(head);
  return !hasCodeIndicator;
}

// ─── Delimiter Auto-Fix ─────────────────────────────────────────────────────

/**
 * Auto-fix unbalanced braces, parentheses, and brackets.
 * Handles the common off-by-1-3 delimiter mismatches from AI models.
 */
export function autoFixDelimiters(code: string): string {
  let fixed = code;

  // Count each delimiter type
  let openBraces = 0, closeBraces = 0;
  let openParens = 0, closeParens = 0;
  let openBrackets = 0, closeBrackets = 0;
  for (const ch of fixed) {
    if (ch === "{") openBraces++;
    if (ch === "}") closeBraces++;
    if (ch === "(") openParens++;
    if (ch === ")") closeParens++;
    if (ch === "[") openBrackets++;
    if (ch === "]") closeBrackets++;
  }

  // Add missing closing delimiters at the end
  if (openBraces > closeBraces) {
    const diff = openBraces - closeBraces;
    console.log(`  autoFixDelimiters: adding ${diff} missing "}"`);
    fixed = fixed.trimEnd() + "\n" + "}".repeat(diff);
  }
  if (openParens > closeParens) {
    const diff = openParens - closeParens;
    console.log(`  autoFixDelimiters: adding ${diff} missing ")"`);
    fixed = fixed.trimEnd() + ")".repeat(diff);
  }
  if (openBrackets > closeBrackets) {
    const diff = openBrackets - closeBrackets;
    console.log(`  autoFixDelimiters: adding ${diff} missing "]"`);
    fixed = fixed.trimEnd() + "]".repeat(diff);
  }

  // Remove excess closing delimiters from the end
  if (closeBraces > openBraces) {
    const diff = closeBraces - openBraces;
    console.log(`  autoFixDelimiters: removing ${diff} excess "}"`);
    for (let i = 0; i < diff; i++) {
      const lastIdx = fixed.lastIndexOf("}");
      if (lastIdx > -1) fixed = fixed.substring(0, lastIdx) + fixed.substring(lastIdx + 1);
    }
  }
  if (closeParens > openParens) {
    const diff = closeParens - openParens;
    console.log(`  autoFixDelimiters: removing ${diff} excess ")"`);
    for (let i = 0; i < diff; i++) {
      const lastIdx = fixed.lastIndexOf(")");
      if (lastIdx > -1) fixed = fixed.substring(0, lastIdx) + fixed.substring(lastIdx + 1);
    }
  }
  if (closeBrackets > openBrackets) {
    const diff = closeBrackets - openBrackets;
    console.log(`  autoFixDelimiters: removing ${diff} excess "]"`);
    for (let i = 0; i < diff; i++) {
      const lastIdx = fixed.lastIndexOf("]");
      if (lastIdx > -1) fixed = fixed.substring(0, lastIdx) + fixed.substring(lastIdx + 1);
    }
  }

  return fixed;
}

// ─── Scene Validation ───────────────────────────────────────────────────────

/**
 * Validate a single scene component (lighter than full validateAll).
 * Only checks syntax, security, and minimal structure.
 */
export function validateSceneCode(code: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Syntax: balanced delimiters (strict)
  const syntax = validateSyntax(code);
  errors.push(...syntax.errors.map((e) => `[Syntax] ${e}`));

  // Security: forbidden patterns (strict)
  const security = validateSecurity(code);
  errors.push(...security.violations.map((e) => `[Security] ${e}`));

  // Structure: only fail if the code is essentially empty
  if (code.trim().length < 50) {
    errors.push("[Structure] Scene code is too short (under 50 chars)");
  } else {
    // Pass if ANY of these indicators are found:
    const hasReactIndicator =
      /<[A-Z]/.test(code) ||                                    // JSX component tag
      /<div|<span|<svg|<p\b|<h[1-6]/.test(code) ||             // HTML elements
      /style=\{\{/.test(code) ||                                 // style={{ }}
      /className=/.test(code) ||                                 // className prop
      /React\.createElement/.test(code) ||                       // createElement
      /AbsoluteFill|Sequence|SceneShell|GlassCard/.test(code) || // Remotion/component names
      /CenterScene|FadeUp|GradientText|SectionLabel/.test(code) ||
      /interpolate\(|spring\(\{|useCurrentFrame/.test(code);     // Remotion hooks

    if (!hasReactIndicator) {
      errors.push(
        "[Structure] No JSX, React component usage, or Remotion patterns found"
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
