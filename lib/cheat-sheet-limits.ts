import type { OutlineSection } from "./pdf-generator";

const SECTION_PRIORITY: Record<string, number> = {
  quick_reference: 4,
  step_by_step: 3,
  comparison: 2,
  tips: 1,
  key_takeaways: 0,
  glossary: -1,
  custom: 0,
};

export function enforceCheatSheetLimits(
  sections: OutlineSection[]
): OutlineSection[] {
  // 1. Sort by priority, cap at 4 sections
  let trimmed = [...sections]
    .sort(
      (a, b) =>
        (SECTION_PRIORITY[b.type] ?? 0) - (SECTION_PRIORITY[a.type] ?? 0)
    )
    .slice(0, 4);

  // 2. Cap items per section at 6
  trimmed = trimmed.map((s) => ({
    ...s,
    items: s.items.slice(0, 6),
  }));

  // 3. Cap subItems at 3, enforce text length limits
  trimmed = trimmed.map((s) => ({
    ...s,
    items: s.items.map((item) => ({
      ...item,
      text:
        item.text.length > 100
          ? item.text.substring(0, 97) + "..."
          : item.text,
      subItems: item.subItems
        ?.slice(0, 3)
        .map((sub) =>
          sub.length > 80 ? sub.substring(0, 77) + "..." : sub
        ),
    })),
  }));

  // 4. If total items > 30, trim from lowest-priority sections
  let totalItems = trimmed.reduce((sum, s) => sum + s.items.length, 0);
  while (totalItems > 30 && trimmed.length > 1) {
    const lowestIdx = trimmed.length - 1;
    if (trimmed[lowestIdx].items.length > 3) {
      trimmed[lowestIdx] = {
        ...trimmed[lowestIdx],
        items: trimmed[lowestIdx].items.slice(0, 3),
      };
    } else {
      trimmed.pop();
    }
    totalItems = trimmed.reduce((sum, s) => sum + s.items.length, 0);
  }

  return trimmed;
}
