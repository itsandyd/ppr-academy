import { StyleSheet } from "@react-pdf/renderer";

// =============================================================================
// PausePlayRepeat Brand System
// =============================================================================

export const BRAND = {
  primary: "#6366F1",
  primaryLight: "#EEF2FF",
  primaryMid: "#818CF8",
  primaryDark: "#4338CA",
  accent: "#EC4899",
  accentLight: "#FDF2F8",
  text: "#1A1A2E",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",
  white: "#FFFFFF",
  background: "#FAFAFA",
  divider: "#E5E7EB",
  dividerLight: "#F3F4F6",
};

// =============================================================================
// Shared Styles
// =============================================================================

export const styles = StyleSheet.create({
  // Page layouts
  page: {
    fontFamily: "Helvetica",
    backgroundColor: BRAND.white,
    color: BRAND.text,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 48,
  },
  contentPage: {
    fontFamily: "Helvetica",
    backgroundColor: BRAND.white,
    color: BRAND.text,
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: 48,
  },

  // Cover page
  coverPage: {
    fontFamily: "Helvetica",
    backgroundColor: BRAND.white,
    padding: 0,
  },
  coverHeader: {
    backgroundColor: BRAND.primaryDark,
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 48,
  },
  coverBrandLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: BRAND.primaryMid,
    letterSpacing: 3,
    marginBottom: 20,
    textTransform: "uppercase" as const,
  },
  coverTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 32,
    color: BRAND.white,
    lineHeight: 1.2,
    marginBottom: 12,
  },
  coverSubtitle: {
    fontSize: 13,
    color: BRAND.primaryMid,
    lineHeight: 1.5,
    maxWidth: 420,
  },
  coverBadge: {
    marginTop: 28,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: BRAND.primaryMid,
    alignSelf: "flex-start" as const,
  },
  coverBadgeText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: BRAND.white,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  coverFooter: {
    position: "absolute" as const,
    bottom: 40,
    left: 48,
    right: 48,
  },
  coverFooterText: {
    fontSize: 10,
    color: BRAND.textLight,
  },
  coverFooterUrl: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: BRAND.primary,
  },

  // Table of Contents
  tocTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: BRAND.primaryDark,
    marginBottom: 24,
  },
  tocItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.dividerLight,
  },
  tocBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND.primary,
    marginRight: 12,
  },
  tocTypeLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND.primaryMid,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    marginRight: 8,
    width: 100,
  },
  tocHeading: {
    fontSize: 11,
    color: BRAND.text,
    flex: 1,
  },

  // Section Header
  sectionHeaderWrap: {
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTypeLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND.primaryMid,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  sectionHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: BRAND.primaryDark,
    marginBottom: 6,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: BRAND.primary,
    width: 40,
    marginBottom: 4,
  },

  // Bullet item
  bulletItemRow: {
    flexDirection: "row" as const,
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: BRAND.primaryMid,
    marginTop: 4,
    marginRight: 8,
    flexShrink: 0,
  },
  bulletTextWrap: {
    flex: 1,
  },
  bulletText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: BRAND.text,
  },

  // Numbered item
  numberedItemRow: {
    flexDirection: "row" as const,
    marginBottom: 6,
    paddingLeft: 4,
  },
  numberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BRAND.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 8,
    marginTop: 1,
    flexShrink: 0,
  },
  numberText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: BRAND.white,
  },

  // Sub items
  subItemRow: {
    flexDirection: "row" as const,
    marginBottom: 3,
    paddingLeft: 18,
  },
  subItemDash: {
    fontSize: 9,
    color: BRAND.textSecondary,
    marginRight: 6,
    width: 8,
  },
  subItemText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: BRAND.textSecondary,
    flex: 1,
  },

  // Tip box
  tipBox: {
    backgroundColor: BRAND.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.primary,
    padding: 10,
    marginBottom: 8,
    marginLeft: 4,
  },
  tipLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: BRAND.primary,
    letterSpacing: 1,
    marginBottom: 3,
  },
  tipText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: BRAND.text,
  },

  // Warning box
  warningBox: {
    backgroundColor: BRAND.accentLight,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.accent,
    padding: 10,
    marginBottom: 8,
    marginLeft: 4,
  },
  warningLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: BRAND.accent,
    letterSpacing: 1,
    marginBottom: 3,
  },
  warningText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: BRAND.text,
  },

  // Page footer (fixed)
  pageFooter: {
    position: "absolute" as const,
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    borderTopWidth: 1,
    borderTopColor: BRAND.dividerLight,
    paddingTop: 8,
  },
  pageFooterText: {
    fontSize: 8,
    color: BRAND.textLight,
  },
  pageNumber: {
    fontSize: 8,
    color: BRAND.textLight,
  },
});
