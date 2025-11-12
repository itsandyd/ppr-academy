# Fixing "Type instantiation is excessively deep" Error in Convex

## Problem
When your Convex API grows large (90+ modules), TypeScript can hit its type recursion depth limit, causing the error:
```
Type instantiation is excessively deep and possibly infinite.ts(2589)
```

## Solutions Applied

### 1. Enhanced tsconfig.json
Added TypeScript compiler options to handle large type systems:
- `"types": ["node"]` - Explicitly specify type packages
- `"skipLibCheck": true` - Skip type checking of declaration files (already present)
- `"ts-node"` configuration for script compatibility

### 2. Created API Helper Module
Created `/lib/convex-api.ts` as a type-safe wrapper that:
- Re-exports the Convex API with simplified type inference
- Provides better TypeScript performance
- Maintains full type safety

### Usage Options

#### Option A: Use the helper (Recommended for large apps)
```typescript
// Instead of:
import { api } from "@/convex/_generated/api";

// Use:
import { api } from "@/lib/convex-api";
```

#### Option B: Keep direct imports (Current approach)
The tsconfig changes should resolve most issues without code changes.

### 3. If Issues Persist

If you still see the error, try these additional steps:

1. **Restart TypeScript Server**: Cmd+Shift+P → "TypeScript: Restart TS Server"

2. **Clear TypeScript cache**:
```bash
rm -rf .next
rm -rf node_modules/.cache
```

3. **Rebuild Convex**:
```bash
npx convex dev --once
```

4. **Consider breaking up large Convex modules** - If you have modules with many exports, consider splitting them into smaller, focused modules.

### Best Practices for Large Convex Projects

1. **Organize by feature**: Group related functions into subdirectories
2. **Limit module size**: Keep individual modules under 20-30 exported functions
3. **Use explicit types**: Define return types explicitly rather than relying on inference
4. **Enable skipLibCheck**: Already enabled in your config

## Monitoring

If the error reappears as your app grows:
- Consider using the helper module for all imports
- Review and consolidate similar Convex functions
- Split large modules into smaller, focused ones

## References

- [Convex TypeScript Best Practices](https://docs.convex.dev/using/typescript)
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)

