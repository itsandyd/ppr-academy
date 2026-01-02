export const colors = {
  primary: "#2563eb",
  primaryDark: "#1e40af",

  text: {
    primary: "#1f2937",
    secondary: "#4b5563",
    muted: "#6b7280",
    light: "#9ca3af",
  },

  background: {
    page: "#f6f9fc",
    card: "#ffffff",
    muted: "#f3f4f6",
    dark: "#1f2937",
  },

  status: {
    success: "#22c55e",
    successBg: "#f0fdf4",
    successText: "#166534",

    warning: "#f59e0b",
    warningBg: "#fffbeb",
    warningText: "#92400e",

    error: "#ef4444",
    errorBg: "#fef2f2",
    errorText: "#991b1b",

    info: "#3b82f6",
    infoBg: "#eff6ff",
    infoText: "#1e40af",
  },

  border: "#e6ebf1",
};

export const typography = {
  h1: {
    color: colors.background.card,
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0",
  },

  h2: {
    color: colors.text.primary,
    fontSize: "28px",
    fontWeight: "bold",
    margin: "32px 0 24px",
  },

  h3: {
    color: colors.text.primary,
    fontSize: "20px",
    fontWeight: "bold",
    margin: "24px 0 16px",
  },

  body: {
    color: colors.text.secondary,
    fontSize: "16px",
    lineHeight: "26px",
    margin: "16px 0",
  },

  small: {
    color: colors.text.muted,
    fontSize: "14px",
    lineHeight: "22px",
  },

  label: {
    color: colors.text.muted,
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    margin: "0 0 4px 0",
  },
};

export const components = {
  button: {
    backgroundColor: colors.primary,
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "14px 32px",
  },

  box: {
    backgroundColor: colors.background.muted,
    borderRadius: "8px",
    padding: "24px",
    margin: "24px 0",
  },

  alertBox: (variant: "success" | "warning" | "error" | "info") => ({
    backgroundColor: colors.status[`${variant}Bg`],
    borderRadius: "8px",
    borderLeft: `4px solid ${colors.status[variant]}`,
    padding: "16px 20px",
    margin: "24px 0",
  }),
};
