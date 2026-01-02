import { Button, Heading, Section, Text } from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface CoachingBookingConfirmationEmailProps {
  studentName: string;
  sessionTitle: string;
  coachName: string;
  sessionDate: string;
  sessionTime: string;
  duration: number;
  sessionUrl: string;
  discordRequired?: boolean;
}

export default function CoachingBookingConfirmationEmail({
  studentName = "Student",
  sessionTitle = "Coaching Session",
  coachName = "Coach",
  sessionDate = "January 1, 2026",
  sessionTime = "10:00 AM",
  duration = 60,
  sessionUrl = "#",
  discordRequired = true,
}: CoachingBookingConfirmationEmailProps) {
  return (
    <EmailLayout preview={`Your coaching session with ${coachName} is confirmed!`}>
      <Heading style={h2}>Session Confirmed! 🎉</Heading>

      <Text style={text}>Hi {studentName},</Text>

      <Text style={text}>
        Great news! Your coaching session with <strong>{coachName}</strong> has been confirmed. Mark
        your calendar and get ready for an amazing session!
      </Text>

      <Section style={box}>
        <Heading style={h3}>Session Details</Heading>
        <Text style={text}>
          <strong>Session:</strong> {sessionTitle}
          <br />
          <strong>Coach:</strong> {coachName}
          <br />
          <strong>Date:</strong> {sessionDate}
          <br />
          <strong>Time:</strong> {sessionTime}
          <br />
          <strong>Duration:</strong> {duration} minutes
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={sessionUrl}>
          View Session Details
        </Button>
      </Section>

      {discordRequired && (
        <Section style={infoBox}>
          <Text style={text}>
            <strong>📱 Discord Access:</strong> A private Discord channel will be created 2 hours
            before your session. You'll receive access automatically.
          </Text>
        </Section>
      )}

      <Text style={text}>
        <strong>Before your session:</strong>
      </Text>
      <Text style={text}>
        • Prepare any questions or topics you want to discuss
        <br />
        • Have your project files ready if applicable
        <br />
        • Test your audio/video setup
        <br />• Be in a quiet environment
      </Text>

      <Text style={text}>
        See you soon!
        <br />
        The PPR Academy Team
      </Text>
    </EmailLayout>
  );
}

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

const infoBox = {
  backgroundColor: "#fef3c7",
  borderLeft: "4px solid #f59e0b",
  padding: "16px 24px",
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
