import {
  Button,
  Heading,
  Section,
  Text,
} from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface EnrollmentEmailProps {
  name: string;
  courseName: string;
  courseUrl: string;
  instructorName?: string;
}

export default function EnrollmentEmail({
  name = "Student",
  courseName = "Course",
  courseUrl = "#",
  instructorName = "Your Instructor",
}: EnrollmentEmailProps) {
  return (
    <EmailLayout preview={`You're enrolled in ${courseName}!`}>
      <Heading style={h2}>Enrollment Confirmed! ✅</Heading>
      
      <Text style={text}>
        Hi {name},
      </Text>

      <Text style={text}>
        Great news! You're now enrolled in <strong>{courseName}</strong>.
        Your learning journey starts now, and we can't wait to see what you'll achieve.
      </Text>

      <Section style={box}>
        <Heading style={h3}>Course Details</Heading>
        <Text style={text}>
          <strong>Course:</strong> {courseName}
          <br />
          <strong>Instructor:</strong> {instructorName}
          <br />
          <strong>Status:</strong> Active
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={courseUrl}>
          Access Your Course
        </Button>
      </Section>

      <Text style={text}>
        <strong>What you can do now:</strong>
      </Text>
      <Text style={text}>
        • Watch the welcome video
        <br />
        • Download course materials
        <br />
        • Complete your first lesson
        <br />
        • Join the student community
      </Text>

      <Text style={text}>
        Let's get started!
        <br />
        {instructorName}
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
  backgroundColor: "#dbeafe",
  borderLeft: "4px solid #2563eb",
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

