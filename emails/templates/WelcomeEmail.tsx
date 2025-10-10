import {
  Button,
  Heading,
  Link,
  Section,
  Text,
} from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface WelcomeEmailProps {
  name: string;
  courseName?: string;
  courseUrl?: string;
}

export default function WelcomeEmail({
  name = "Student",
  courseName = "PPR Academy",
  courseUrl = "#",
}: WelcomeEmailProps) {
  return (
    <EmailLayout preview={`Welcome to ${courseName}!`}>
      <Heading style={h2}>Welcome, {name}! 🎉</Heading>
      
      <Text style={text}>
        We're thrilled to have you join {courseName}. You're about to embark on an
        exciting learning journey, and we're here to support you every step of the way.
      </Text>

      <Section style={box}>
        <Heading style={h3}>What's Next?</Heading>
        <Text style={text}>
          • Explore your course content and materials
          <br />
          • Set up your learning schedule
          <br />
          • Join our community discussions
          <br />
          • Track your progress in the dashboard
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={courseUrl}>
          Start Learning
        </Button>
      </Section>

      <Text style={text}>
        If you have any questions or need help getting started, don't hesitate to reach out.
        We're always here to help!
      </Text>

      <Text style={text}>
        Best regards,
        <br />
        The PPR Academy Team
      </Text>
    </EmailLayout>
  );
}

// Styles
const h2 = {
  color: "#1f2937",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "32px 0 24px",
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

const box = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

