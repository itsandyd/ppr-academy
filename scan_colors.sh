#!/bin/bash
echo "🔍 Scanning for remaining hardcoded colors..."
echo ""
echo "📌 Primary brand colors (#6356FF, #5248E6):"
grep -r "#6356FF\|#5248E6" app/ components/ --include="*.tsx" --include="*.ts" | wc -l
echo ""
echo "📌 Text colors (#0F0F0F, #0F0F1C, #6B6E85, #4B4E68):"
grep -r "#0F0F0F\|#0F0F1C\|#6B6E85\|#4B4E68" app/ components/ --include="*.tsx" --include="*.ts" | wc -l
echo ""
echo "📌 Border colors (#EEF0FA, #E8EAF8, #E5E7F5):"
grep -r "#EEF0FA\|#E8EAF8\|#E5E7F5" app/ components/ --include="*.tsx" --include="*.ts" | wc -l
echo ""
echo "💡 Run this for details:"
echo "grep -r \"#[0-9a-fA-F]\" app/ components/ --include=\"*.tsx\" --include=\"*.ts\""

