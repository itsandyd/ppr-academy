import { Button, Heading, Section, Text } from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface CoachingNewBookingEmailProps {
  coachName: string;
  studentName: string;
  studentEmail: string;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
  duration: number;
  amount: number;
  notes?: string;
  dashboardUrl: string;
}

export default function CoachingNewBookingEmail({
  coachName = "Coach",
  studentName = "Student",
  studentEmail = "student@example.com",
  sessionTitle = "Coaching Session",
  sessionDate = "January 1, 2026",
  sessionTime = "10:00 AM",
  duration = 60,
  amount = 50,
  notes,
  dashboardUrl = "#",
}: CoachingNewBookingEmailProps) {
  return (
    <EmailLayout preview={`New booking: ${studentName} booked a session with you!`}>
      <Heading style={h2}>New Booking! 🎉</Heading>

      <Text style={text}>Hi {coachName},</Text>

      <Text style={text}>
        Great news! <strong>{studentName}</strong> has booked a coaching session with you.
      </Text>

      <Section style={box}>
        <Heading style={h3}>Booking Details</Heading>
        <Text style={text}>
          <strong>Session:</strong> {sessionTitle}
          <br />
          <strong>Student:</strong> {studentName}
          <br />
          <strong>Email:</strong> {studentEmail}
          <br />
          <strong>Date:</strong> {sessionDate}
          <br />
          <strong>Time:</strong> {sessionTime}
          <br />
          <strong>Duration:</strong> {duration} minutes
          <br />
          <strong>Amount:</strong> ${amount}
        </Text>
      </Section>

      {notes && (
        <Section style={notesBox}>
          <Heading style={h3}>Student Notes</Heading>
          <Text style={text}>{notes}</Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          View in Dashboard
        </Button>
      </Section>

      <Text style={text}>
        <strong>What happens next:</strong>
      </Text>
      <Text style={text}>
        • A private Discord channel will be created 2 hours before the session
        <br />
        • Both you and the student will receive a reminder email
        <br />• You can add notes or cancel the session from your dashboard
      </Text>

      <Text style={text}>
        Happy coaching!
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
  backgroundColor: "#dcfce7",
  borderLeft: "4px solid #22c55e",
  padding: "24px",
  margin: "24px 0",
};

const notesBox = {
  backgroundColor: "#f3f4f6",
  borderLeft: "4px solid #6b7280",
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
