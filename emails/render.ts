import { render } from "@react-email/render";
import WelcomeEmail from "./templates/WelcomeEmail";
import EnrollmentEmail from "./templates/EnrollmentEmail";
import ProgressReminderEmail from "./templates/ProgressReminderEmail";
import CompletionEmail from "./templates/CompletionEmail";
import CertificateEmail from "./templates/CertificateEmail";
import LaunchAnnouncementEmail from "./templates/LaunchAnnouncementEmail";
import WeeklyDigestEmail from "./templates/WeeklyDigestEmail";

export type EmailTemplateType =
  | "welcome"
  | "enrollment"
  | "progress_reminder"
  | "completion"
  | "certificate"
  | "new_course"
  | "weekly_digest"
  | "custom";

export interface EmailTemplateProps {
  [key: string]: any;
}

/**
 * Render an email template to HTML string
 */
export async function renderEmailTemplate(
  type: EmailTemplateType,
  props: EmailTemplateProps
): Promise<{ html: string; text: string }> {
  let Component;

  switch (type) {
    case "welcome":
      Component = WelcomeEmail;
      break;
    case "enrollment":
      Component = EnrollmentEmail;
      break;
    case "progress_reminder":
      Component = ProgressReminderEmail;
      break;
    case "completion":
      Component = CompletionEmail;
      break;
    case "certificate":
      Component = CertificateEmail;
      break;
    case "new_course":
      Component = LaunchAnnouncementEmail;
      break;
    case "weekly_digest":
      Component = WeeklyDigestEmail;
      break;
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }

  const html = await render(Component(props as any));
  const text = await render(Component(props as any), { plainText: true });

  return { html, text };
}

/**
 * Get a list of all available email templates
 */
export function getAvailableTemplates() {
  return [
    {
      type: "welcome" as EmailTemplateType,
      name: "Welcome Email",
      description: "Welcome new students to your course",
      requiredProps: ["name", "courseName", "courseUrl"],
    },
    {
      type: "enrollment" as EmailTemplateType,
      name: "Enrollment Confirmation",
      description: "Confirm student enrollment in a course",
      requiredProps: ["name", "courseName", "courseUrl"],
    },
    {
      type: "progress_reminder" as EmailTemplateType,
      name: "Progress Reminder",
      description: "Remind inactive students to continue learning",
      requiredProps: ["name", "courseName", "courseUrl", "progress"],
    },
    {
      type: "completion" as EmailTemplateType,
      name: "Course Completion",
      description: "Celebrate course completion with students",
      requiredProps: ["name", "courseName", "certificateUrl"],
    },
    {
      type: "certificate" as EmailTemplateType,
      name: "Certificate Delivery",
      description: "Deliver earned certificates to students",
      requiredProps: ["name", "courseName", "certificateUrl", "certificateId"],
    },
    {
      type: "new_course" as EmailTemplateType,
      name: "Course Launch Announcement",
      description: "Announce new course launches to your audience",
      requiredProps: ["courseName", "courseDescription", "courseUrl"],
    },
    {
      type: "weekly_digest" as EmailTemplateType,
      name: "Weekly Digest",
      description: "Send weekly learning summaries to students",
      requiredProps: ["name"],
    },
  ];
}

/**
 * Validate template props
 */
export function validateTemplateProps(
  type: EmailTemplateType,
  props: EmailTemplateProps
): { valid: boolean; missing: string[] } {
  const template = getAvailableTemplates().find((t) => t.type === type);

  if (!template) {
    return { valid: false, missing: [] };
  }

  const missing = template.requiredProps.filter((prop) => !props[prop]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Replace variables in custom template content
 */
export function replaceTemplateVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(regex, value);
  });

  return result;
}

/**
 * Get example props for a template (for preview/testing)
 */
export function getExampleProps(type: EmailTemplateType): EmailTemplateProps {
  const examples: Record<EmailTemplateType, EmailTemplateProps> = {
    welcome: {
      name: "John Doe",
      courseName: "Master Music Production",
      courseUrl: "https://example.com/course",
    },
    enrollment: {
      name: "Jane Smith",
      courseName: "Audio Engineering 101",
      courseUrl: "https://example.com/course",
      instructorName: "Mike Producer",
    },
    progress_reminder: {
      name: "Alex Johnson",
      courseName: "Beat Making Fundamentals",
      courseUrl: "https://example.com/course",
      progress: 65,
      lastActivity: "5 days ago",
    },
    completion: {
      name: "Sarah Williams",
      courseName: "Mixing & Mastering",
      certificateUrl: "https://example.com/certificate",
      nextCourseUrl: "https://example.com/courses",
      completionDate: new Date().toLocaleDateString(),
    },
    certificate: {
      name: "Michael Brown",
      courseName: "Sound Design Essentials",
      certificateUrl: "https://example.com/certificate/download",
      certificateId: "CERT-2024-001234",
      verificationUrl: "https://example.com/verify/CERT-2024-001234",
    },
    new_course: {
      courseName: "Advanced Synthesis Techniques",
      courseDescription:
        "Take your sound design to the next level with advanced synthesis methods used by top producers.",
      courseUrl: "https://example.com/course/new",
      courseImage: "https://via.placeholder.com/600x300/2563eb/ffffff?text=Course+Image",
      instructorName: "Producer Pro",
      price: "$149",
      launchDate: "This Monday",
    },
    weekly_digest: {
      name: "Chris Davis",
      courseProgress: [
        {
          courseName: "Music Theory Basics",
          progress: 75,
          courseUrl: "https://example.com/course/1",
        },
        {
          courseName: "DAW Mastery",
          progress: 40,
          courseUrl: "https://example.com/course/2",
        },
      ],
      newCourses: [
        {
          courseName: "Vocal Production",
          instructor: "Sarah Singer",
          thumbnail: "https://via.placeholder.com/600x300",
          courseUrl: "https://example.com/course/3",
        },
      ],
      certificates: [
        {
          courseName: "Beat Making 101",
          issueDate: new Date().toLocaleDateString(),
          certificateUrl: "https://example.com/certificate/1",
        },
      ],
      weekOf: new Date().toLocaleDateString(),
    },
    custom: {},
  };

  return examples[type] || {};
}
