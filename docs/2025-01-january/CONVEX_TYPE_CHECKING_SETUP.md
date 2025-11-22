# Convex Type Checking Setup

This document outlines the comprehensive type checking system implemented for the PPR Academy Convex project.

## Overview

The type checking system ensures robust type safety across both your Next.js frontend and Convex backend, catching type errors during development and build time.

## Features

- ✅ Strict TypeScript configuration for enhanced type safety
- ✅ Separate type checking for Convex backend
- ✅ Pre-commit hooks to prevent type errors from being committed
- ✅ Comprehensive type checking script with detailed reporting
- ✅ GitHub Actions CI/CD integration
- ✅ Utility functions for common Convex patterns
- ✅ Runtime validation helpers

## Quick Start

### Daily Development

```bash
# Run full type checking suite
npm run typecheck:full

# Check only main application types
npm run typecheck

# Check only Convex backend types
npm run typecheck:convex

# Check everything (types + linting)
npm run check-all
```

### Build Process

The build process now automatically includes type checking:

```bash
npm run build  # Includes typecheck:full before building
```

## Configuration Files

### 1. Main TypeScript Config (`tsconfig.json`)

Enhanced with strict type checking options:
- `exactOptionalPropertyTypes`: Ensures optional properties are handled correctly
- `noUncheckedIndexedAccess`: Prevents unsafe array/object access
- `noImplicitReturns`: Requires explicit return statements
- `noFallthroughCasesInSwitch`: Prevents accidental fallthrough in switches

### 2. Convex TypeScript Config (`convex/tsconfig.json`)

Specialized configuration for the Convex backend:
- Extends main config with backend-specific settings
- Includes `_generated` directory for Convex types
- Stricter checking for server-side code

## Scripts

### Type Checking Scripts

```json
{
  "typecheck": "tsc --noEmit",
  "typecheck:convex": "tsc --noEmit --project convex/",
  "typecheck:full": "tsx scripts/type-check.ts",
  "check-all": "npm run typecheck:full"
}
```

### Type Check Script (`scripts/type-check.ts`)

Comprehensive script that:
- Runs TypeScript checking for main app
- Runs TypeScript checking for Convex backend
- Validates Convex schema consistency
- Runs Next.js linting
- Provides detailed reporting

## Pre-commit Hooks

Husky pre-commit hook (`.husky/pre-commit`) automatically runs type checking before commits, preventing type errors from being committed to the repository.

## CI/CD Integration

GitHub Actions workflow (`.github/workflows/type-check.yml`) runs:
- Type checking across multiple Node.js versions
- Convex schema validation
- Build verification
- Linting checks
- Prettier formatting verification

## Convex Type Validation Utilities

### Location: `convex/lib/typeValidation.ts`

Provides utilities for:

#### Common Validators

```typescript
import { commonValidators, idValidators } from "./lib/typeValidation";

// Use predefined validators
const userValidator = idValidators.users();
const emailValidator = commonValidators.email();
const publishStatusValidator = commonValidators.publishStatus();
```

#### Type Guards

```typescript
import { typeGuards } from "./lib/typeValidation";

// Runtime type checking
if (typeGuards.isValidEmail(email)) {
  // email is now typed as string and validated
}
```

#### Validated Function Helper

```typescript
import { createValidatedFunction } from "./lib/typeValidation";

export const myQuery = query(createValidatedFunction({
  args: { userId: v.id("users"), email: v.string() },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    // Fully type-safe implementation
    return { success: true };
  }
}));
```

#### Runtime Validation

```typescript
import { runtimeValidators } from "./lib/typeValidation";

// Throws error if validation fails
const validEmail = runtimeValidators.validateEmail(userInput);
const positiveNumber = runtimeValidators.validatePositiveNumber(price, "price");
```

## Best Practices

### 1. Function Definition

Always use the new Convex function syntax with proper validation:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: { userId: v.id("users") },
  returns: v.union(v.object({
    _id: v.id("users"),
    name: v.string(),
    email: v.string(),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
```

### 2. Use Type-Safe IDs

```typescript
// Good: Type-safe ID usage
import type { Id } from "../_generated/dataModel";

const userId: Id<"users"> = args.userId;

// Avoid: Generic string usage
const userId: string = args.userId; // ❌
```

### 3. Leverage Common Validators

```typescript
import { commonValidators } from "./lib/typeValidation";

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    email: commonValidators.email(),
    status: commonValidators.publishStatus(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Implementation
  },
});
```

### 4. Error Handling

```typescript
import { errors } from "./lib/typeValidation";

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw errors.notFound("User");
    }
    // Continue with deletion
  },
});
```

## Troubleshooting

### Common Type Errors

1. **Missing return validator**: Always include `returns:` in function definitions
2. **Incorrect ID types**: Use `Id<"tableName">` instead of `string`
3. **Optional property access**: Enable `noUncheckedIndexedAccess` catches unsafe property access
4. **Missing null checks**: Convex can return `null`, always handle this case

### Fixing Type Errors

1. Run `npm run typecheck:full` to see all errors
2. Focus on Convex-specific errors first with `npm run typecheck:convex`
3. Use the validation utilities in `convex/lib/typeValidation.ts`
4. Check the generated types in `convex/_generated/`

## Development Workflow

1. **Before coding**: Run `npm run typecheck:full` to ensure clean state
2. **During development**: Use TypeScript-aware editor (VS Code recommended)
3. **Before committing**: Pre-commit hook automatically runs type checking
4. **CI/CD**: GitHub Actions validates types on every push/PR

## Performance Notes

- Type checking runs in parallel with build processes where possible
- Convex type checking is separated to allow independent validation
- CI matrix tests multiple Node.js versions for compatibility
- Pre-commit hooks prevent slow CI feedback loops

## Future Enhancements

- [ ] Add custom ESLint rules for Convex patterns
- [ ] Integrate with IDE for real-time validation
- [ ] Add performance monitoring for type check duration
- [ ] Create automated type coverage reporting
