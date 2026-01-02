import { Button, Heading, Section, Text } from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface CoachingSessionReminderEmailProps {
  recipientName: string;
  sessionTitle: string;
  otherPartyName: string;
  sessionDate: string;
  sessionTime: string;
  duration: number;
  sessionUrl: string;
  isCoach: boolean;
  hoursUntil: number;
}

export default function CoachingSessionReminderEmail({
  recipientName = "User",
  sessionTitle = "Coaching Session",
  otherPartyName = "Participant",
  sessionDate = "January 1, 2026",
  sessionTime = "10:00 AM",
  duration = 60,
  sessionUrl = "#",
  isCoach = false,
  hoursUntil = 24,
}: CoachingSessionReminderEmailProps) {
  const timeLabel = hoursUntil === 1 ? "1 hour" : `${hoursUntil} hours`;

  return (
    <EmailLayout preview={`Reminder: Your coaching session starts in ${timeLabel}`}>
      <Heading style={h2}>Session Starting Soon! ⏰</Heading>

      <Text style={text}>Hi {recipientName},</Text>

      <Text style={text}>
        This is a friendly reminder that your coaching session {isCoach ? "with" : "with"}{" "}
        <strong>{otherPartyName}</strong> starts in <strong>{timeLabel}</strong>.
      </Text>

      <Section style={box}>
        <Heading style={h3}>Session Details</Heading>
        <Text style={text}>
          <strong>Session:</strong> {sessionTitle}
          <br />
          <strong>{isCoach ? "Student" : "Coach"}:</strong> {otherPartyName}
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
          {isCoach ? "View Session" : "Join Session"}
        </Button>
      </Section>

      {hoursUntil <= 2 && (
        <Section style={urgentBox}>
          <Text style={text}>
            <strong>🔔 Discord channel is now ready!</strong> Head to Discord to join your private
            coaching channel.
          </Text>
        </Section>
      )}

      <Text style={text}>
        <strong>Quick checklist:</strong>
      </Text>
      <Text style={text}>
        {isCoach ? (
          <>
            • Review student's goals and questions
            <br />
            • Prepare any reference materials
            <br />
            • Test your audio/video
            <br />• Be ready 5 minutes early
          </>
        ) : (
          <>
            • Have your questions ready
            <br />
            • Prepare any files you want to discuss
            <br />
            • Test your audio/video
            <br />• Find a quiet space
          </>
        )}
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

const urgentBox = {
  backgroundColor: "#dcfce7",
  borderLeft: "4px solid #22c55e",
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
