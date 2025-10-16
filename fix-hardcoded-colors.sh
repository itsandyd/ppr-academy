#!/bin/bash

# Script to replace hardcoded colors with design system variables
# Run from project root: bash fix-hardcoded-colors.sh

echo "🎨 Fixing hardcoded colors to use design system variables from globals.css..."

# Common replacements
find components app -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/bg-white dark:bg-black/bg-card/g' \
  -e 's/bg-gray-50 dark:bg-gray-900/bg-muted/g' \
  -e 's/bg-gray-100 dark:bg-gray-800/bg-accent/g' \
  -e 's/bg-slate-50 dark:bg-slate-900/bg-muted/g' \
  -e 's/bg-slate-100 dark:bg-slate-800/bg-accent/g' \
  -e 's/text-gray-600 dark:text-gray-400/text-muted-foreground/g' \
  -e 's/text-gray-900 dark:text-gray-100/text-foreground/g' \
  -e 's/text-gray-500 dark:text-gray-500/text-muted-foreground/g' \
  -e 's/border-gray-200 dark:border-gray-800/border-border/g' \
  -e 's/border-slate-200 dark:border-slate-800/border-border/g' \
  {} \;

echo "✅ Done! All hardcoded colors replaced with design system variables."
echo "📝 Review changes and test the app to ensure everything looks correct."

