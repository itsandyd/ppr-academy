import {
  Button,
  Heading,
  Section,
  Text,
} from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface CompletionEmailProps {
  name: string;
  courseName: string;
  certificateUrl?: string;
  nextCourseUrl?: string;
  completionDate?: string;
}

export default function CompletionEmail({
  name = "Student",
  courseName = "Course",
  certificateUrl = "#",
  nextCourseUrl = "#",
  completionDate = new Date().toLocaleDateString(),
}: CompletionEmailProps) {
  return (
    <EmailLayout preview={`Congratulations! You completed ${courseName}`}>
      <Section style={celebrationSection}>
        <Text style={emoji}>🎉</Text>
        <Heading style={h1}>Congratulations!</Heading>
      </Section>

      <Text style={text}>
        Hi {name},
      </Text>

      <Text style={text}>
        You did it! You've successfully completed <strong>{courseName}</strong>.
        This is a huge accomplishment, and we're incredibly proud of you! 🏆
      </Text>

      <Section style={statsBox}>
        <Heading style={h3}>Your Achievement</Heading>
        <Text style={statsText}>
          <strong>Course:</strong> {courseName}
          <br />
          <strong>Completed:</strong> {completionDate}
          <br />
          <strong>Status:</strong> ✅ Certified
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={certificateUrl}>
          Download Your Certificate
        </Button>
      </Section>

      <Text style={text}>
        <strong>What's next?</strong>
      </Text>
      <Text style={text}>
        • Share your certificate on LinkedIn
        <br />
        • Apply what you've learned
        <br />
        • Continue with another course
        <br />
        • Join our alumni community
      </Text>

      <Section style={nextCourseBox}>
        <Heading style={h4}>Ready for More?</Heading>
        <Text style={text}>
          Keep the momentum going! Check out our recommended courses that build
          on what you've learned.
        </Text>
        <Button style={secondaryButton} href={nextCourseUrl}>
          Browse Courses
        </Button>
      </Section>

      <Text style={text}>
        Thank you for being an amazing student. We can't wait to see what you'll
        accomplish next!
      </Text>

      <Text style={text}>
        With pride,
        <br />
        The PPR Academy Team
      </Text>
    </EmailLayout>
  );
}

// Styles
const celebrationSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const emoji = {
  fontSize: "64px",
  margin: "0",
};

const h1 = {
  color: "#1f2937",
  fontSize: "36px",
  fontWeight: "bold",
  margin: "16px 0 32px",
};

const h3 = {
  color: "#1f2937",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px",
};

const h4 = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 12px",
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const statsBox = {
  backgroundColor: "#dcfce7",
  borderLeft: "4px solid #10b981",
  padding: "24px",
  margin: "24px 0",
};

const statsText = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0",
};

const nextCourseBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const secondaryButton = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "10px 24px",
  marginTop: "16px",
};

