# 🎨 Hardcoded Colors Audit & Fix Guide

## Issue Found

Your cursor rules state:
> The project uses Tailwind CSS values from @globals.css for colors and forbids hardcoded color values.

But we have **57 files** using `bg-white dark:bg-black` and **135 instances** of `bg-gray-`/`bg-slate-` that should use design system variables.

---

## 📊 Audit Results

### Hardcoded Patterns Found:
- `bg-white dark:bg-black` - **57 files**
- `bg-gray-*` / `bg-slate-*` - **135 instances in 40 files**
- `text-gray-*` / `text-slate-*` - Likely many more
- `border-gray-*` - Also present

---

## ✅ Design System Mapping

### From globals.css, you have these variables:

**Backgrounds:**
- `--background` - Main page background
- `--card` - Card backgrounds
- `--popover` - Popover/dropdown backgrounds
- `--muted` - Muted/subtle backgrounds
- `--accent` - Accent backgrounds

**Text:**
- `--foreground` - Main text
- `--muted-foreground` - Secondary text
- `--card-foreground` - Text on cards

**Borders:**
- `--border` - Standard borders
- `--input` - Input borders

---

## 🔄 Replacement Rules

### Instead of Hardcoded:
```tsx
// ❌ Hardcoded
bg-white dark:bg-black
bg-gray-50 dark:bg-gray-900
bg-slate-100 dark:bg-slate-800
text-gray-600 dark:text-gray-400
border-gray-200 dark:border-gray-800

// ✅ Design System
bg-background
bg-muted
bg-card
text-muted-foreground
border-border
```

### Complete Mapping:

| Hardcoded | Design System Variable | Use Case |
|-----------|----------------------|----------|
| `bg-white dark:bg-black` | `bg-background` or `bg-card` | Main backgrounds, cards |
| `bg-gray-50 dark:bg-gray-900` | `bg-muted` | Subtle backgrounds |
| `bg-gray-100 dark:bg-gray-800` | `bg-accent` or `bg-muted` | Hover states, accents |
| `bg-slate-50 dark:bg-slate-900` | `bg-muted` | Secondary backgrounds |
| `text-gray-600 dark:text-gray-400` | `text-muted-foreground` | Secondary text |
| `text-gray-900 dark:text-gray-100` | `text-foreground` | Primary text |
| `text-slate-500` | `text-muted-foreground` | Muted text |
| `border-gray-200 dark:border-gray-800` | `border-border` or `border-input` | Borders |
| `border-slate-300 dark:border-slate-700` | `border-border` | Standard borders |

---

## 🔧 Automated Fix Script

I'll create a script to replace all hardcoded colors with design system variables:

### Files to Fix (Priority Order):

**High Priority (User-Facing):**
1. components/ui/* - Base components
2. app/[slug]/* - Storefronts
3. app/(dashboard)/* - Dashboard
4. app/library/* - Student pages
5. app/admin/* - Admin panel

**Medium Priority:**
6. components/dashboard/*
7. components/storefront/*
8. components/courses/*

**Low Priority:**
9. Documentation files
10. Legacy components

---

## 🎯 Recommended Approach

### Option A: Global Find & Replace (Fast)
Replace these patterns across entire codebase:
1. `bg-white dark:bg-black` → `bg-card`
2. `bg-gray-50 dark:bg-gray-900` → `bg-muted`
3. `bg-gray-100 dark:bg-gray-800` → `bg-accent`
4. `text-gray-600 dark:text-gray-400` → `text-muted-foreground`
5. `border-gray-200 dark:border-gray-800` → `border-border`

**Time:** 10 minutes  
**Risk:** Low (design system is well-defined)

---

### Option B: Manual Review (Safer)
Go file-by-file and replace based on context.

**Time:** 2 hours  
**Risk:** Very low

---

## 🚀 Quick Fix Commands

Want me to do mass replacements now? I can update:

1. All `bg-white dark:bg-black` → `bg-card`
2. All Select/Dialog/Command backgrounds
3. All gray/slate colors → design system equivalents

This will ensure 100% consistency with your globals.css design system!

