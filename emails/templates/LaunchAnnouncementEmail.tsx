import {
  Button,
  Heading,
  Img,
  Section,
  Text,
} from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface LaunchAnnouncementEmailProps {
  courseName: string;
  courseDescription: string;
  courseUrl: string;
  courseImage?: string;
  instructorName?: string;
  price?: string;
  launchDate?: string;
}

export default function LaunchAnnouncementEmail({
  courseName = "New Course",
  courseDescription = "Learn something amazing with this brand new course!",
  courseUrl = "#",
  courseImage = "https://via.placeholder.com/600x300/2563eb/ffffff?text=Course+Image",
  instructorName = "Instructor",
  price = "$99",
  launchDate = "Now",
}: LaunchAnnouncementEmailProps) {
  return (
    <EmailLayout preview={`New Course: ${courseName} is now available!`}>
      <Section style={announcementBadge}>
        <Text style={badgeText}>NEW COURSE</Text>
      </Section>

      <Heading style={h1}>{courseName}</Heading>

      <Section style={imageContainer}>
        <Img
          src={courseImage}
          alt={courseName}
          style={courseImageStyle}
        />
      </Section>

      <Text style={text}>
        We're excited to announce the launch of our newest course: <strong>{courseName}</strong>!
      </Text>

      <Text style={description}>
        {courseDescription}
      </Text>

      <Section style={highlightBox}>
        <Heading style={h3}>What You'll Learn</Heading>
        <Text style={text}>
          • Master essential skills and techniques
          <br />
          • Get hands-on with real-world projects
          <br />
          • Learn from industry experts
          <br />
          • Earn a verifiable certificate
        </Text>
      </Section>

      <Section style={infoBox}>
        <Section style={infoItem}>
          <Text style={infoLabel}>Instructor</Text>
          <Text style={infoValue}>{instructorName}</Text>
        </Section>
        <Section style={infoItem}>
          <Text style={infoLabel}>Launch Date</Text>
          <Text style={infoValue}>{launchDate}</Text>
        </Section>
        <Section style={infoItem}>
          <Text style={infoLabel}>Price</Text>
          <Text style={infoValue}>{price}</Text>
        </Section>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={courseUrl}>
          Enroll Now
        </Button>
      </Section>

      <Section style={urgencyBox}>
        <Text style={urgencyText}>
          🔥 <strong>Limited Time:</strong> Early bird pricing available for the first 100 students!
        </Text>
      </Section>

      <Text style={text}>
        Don't miss this opportunity to level up your skills. Join hundreds of students
        who are already transforming their careers.
      </Text>

      <Text style={text}>
        Have questions? Reply to this email and we'll help you out!
      </Text>

      <Text style={text}>
        See you in class,
        <br />
        The PPR Academy Team
      </Text>
    </EmailLayout>
  );
}

// Styles
const announcementBadge = {
  textAlign: "center" as const,
  margin: "24px 0 16px",
};

const badgeText = {
  backgroundColor: "#10b981",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "bold",
  letterSpacing: "1px",
  padding: "6px 16px",
  borderRadius: "9999px",
  display: "inline-block",
};

const h1 = {
  color: "#1f2937",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0 0 32px",
  textAlign: "center" as const,
};

const h3 = {
  color: "#1f2937",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px",
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const description = {
  color: "#1f2937",
  fontSize: "18px",
  lineHeight: "28px",
  margin: "24px 0",
  fontWeight: "500",
};

const imageContainer = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const courseImageStyle = {
  width: "100%",
  maxWidth: "600px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
};

const highlightBox = {
  backgroundColor: "#eff6ff",
  borderRadius: "8px",
  padding: "24px",
  margin: "32px 0",
};

const infoBox = {
  display: "flex",
  justifyContent: "space-between",
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  margin: "32px 0",
};

const infoItem = {
  flex: "1",
  textAlign: "center" as const,
};

const infoLabel = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 8px",
  fontWeight: "500",
};

const infoValue = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 48px",
};

const urgencyBox = {
  backgroundColor: "#fef3c7",
  border: "2px dashed #f59e0b",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const urgencyText = {
  color: "#92400e",
  fontSize: "14px",
  margin: "0",
};

