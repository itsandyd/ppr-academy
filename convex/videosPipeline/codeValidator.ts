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

  // Remove markdown code fences
  const fencePattern = /^```(?:typescript|tsx|ts|jsx|js)?\s*\n?([\s\S]*?)\n?```$/;
  const match = code.match(fencePattern);
  if (match) {
    code = match[1].trim();
  }

  // Also handle case where there's text before/after the fence
  const innerMatch = code.match(/```(?:typescript|tsx|ts|jsx|js)?\s*\n?([\s\S]*?)\n?```/);
  if (innerMatch && !match) {
    code = innerMatch[1].trim();
  }

  return code;
}
