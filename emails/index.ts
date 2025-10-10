// Export all email templates
export { default as WelcomeEmail } from "./templates/WelcomeEmail";
export { default as EnrollmentEmail } from "./templates/EnrollmentEmail";
export { default as ProgressReminderEmail } from "./templates/ProgressReminderEmail";
export { default as CompletionEmail } from "./templates/CompletionEmail";
export { default as CertificateEmail } from "./templates/CertificateEmail";
export { default as LaunchAnnouncementEmail } from "./templates/LaunchAnnouncementEmail";
export { default as WeeklyDigestEmail } from "./templates/WeeklyDigestEmail";

// Export layout
export { default as EmailLayout } from "./components/EmailLayout";

// Export utilities
export {
  renderEmailTemplate,
  getAvailableTemplates,
  validateTemplateProps,
  replaceTemplateVariables,
  getExampleProps,
  type EmailTemplateType,
  type EmailTemplateProps,
} from "./render";

