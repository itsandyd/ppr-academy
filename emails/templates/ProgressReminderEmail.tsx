import {
  Button,
  Heading,
  Section,
  Text,
} from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface ProgressReminderEmailProps {
  name: string;
  courseName: string;
  courseUrl: string;
  progress: number;
  lastActivity?: string;
}

export default function ProgressReminderEmail({
  name = "Student",
  courseName = "Course",
  courseUrl = "#",
  progress = 50,
  lastActivity = "7 days ago",
}: ProgressReminderEmailProps) {
  return (
    <EmailLayout preview={`Continue your progress in ${courseName}`}>
      <Heading style={h2}>Don't Lose Your Momentum! 🚀</Heading>
      
      <Text style={text}>
        Hi {name},
      </Text>

      <Text style={text}>
        We noticed you haven't visited <strong>{courseName}</strong> in a while.
        You're doing great so far—let's keep that progress going!
      </Text>

      <Section style={progressBox}>
        <Heading style={h3}>Your Progress</Heading>
        <Section style={progressBar}>
          <Section style={{...progressFill, width: `${progress}%`}} />
        </Section>
        <Text style={progressText}>
          {progress}% Complete • Last activity: {lastActivity}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={courseUrl}>
          Continue Learning
        </Button>
      </Section>

      <Text style={text}>
        <strong>Why continue now?</strong>
      </Text>
      <Text style={text}>
        • Stay on track to complete your course
        <br />
        • Maintain your learning streak
        <br />
        • Get closer to earning your certificate
        <br />
        • Apply what you've learned while it's fresh
      </Text>

      <Text style={text}>
        Just 15 minutes today can make a big difference!
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

const progressBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const progressBar = {
  backgroundColor: "#e5e7eb",
  borderRadius: "9999px",
  height: "8px",
  overflow: "hidden",
  margin: "16px 0",
};

const progressFill = {
  backgroundColor: "#2563eb",
  height: "8px",
  borderRadius: "9999px",
};

const progressText = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "8px 0 0",
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

