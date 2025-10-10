import {
  Button,
  Heading,
  Img,
  Section,
  Text,
} from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface CertificateEmailProps {
  name: string;
  courseName: string;
  certificateUrl: string;
  certificateId: string;
  verificationUrl?: string;
}

export default function CertificateEmail({
  name = "Student",
  courseName = "Course",
  certificateUrl = "#",
  certificateId = "CERT-000000",
  verificationUrl = "#",
}: CertificateEmailProps) {
  return (
    <EmailLayout preview={`Your ${courseName} certificate is ready!`}>
      <Section style={headerSection}>
        <Text style={badgeEmoji}>🏆</Text>
        <Heading style={h2}>Your Certificate is Ready!</Heading>
      </Section>

      <Text style={text}>
        Hi {name},
      </Text>

      <Text style={text}>
        Congratulations! Your certificate for <strong>{courseName}</strong> is now
        available. This officially recognizes your hard work and dedication.
      </Text>

      <Section style={certificateBox}>
        <Section style={certificatePreview}>
          <Img
            src="https://via.placeholder.com/500x350/2563eb/ffffff?text=Certificate"
            alt="Certificate Preview"
            style={certificateImage}
          />
          <Text style={previewText}>Certificate Preview</Text>
        </Section>
      </Section>

      <Section style={detailsBox}>
        <Heading style={h3}>Certificate Details</Heading>
        <Text style={detailsText}>
          <strong>Recipient:</strong> {name}
          <br />
          <strong>Course:</strong> {courseName}
          <br />
          <strong>Certificate ID:</strong> {certificateId}
          <br />
          <strong>Status:</strong> Verified ✓
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={certificateUrl}>
          Download Certificate
        </Button>
      </Section>

      <Text style={text}>
        <strong>Share your achievement:</strong>
      </Text>
      <Text style={text}>
        • Add it to your LinkedIn profile
        <br />
        • Include it in your resume
        <br />
        • Share on social media
        <br />
        • Display it on your website
      </Text>

      <Section style={verificationBox}>
        <Text style={smallText}>
          <strong>Verification:</strong> Anyone can verify this certificate at:{" "}
          <a href={verificationUrl} style={link}>
            {verificationUrl}
          </a>
        </Text>
      </Section>

      <Text style={text}>
        We're proud to have you as part of our community. Keep learning and growing!
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
const headerSection = {
  textAlign: "center" as const,
  margin: "32px 0 24px",
};

const badgeEmoji = {
  fontSize: "48px",
  margin: "0",
};

const h2 = {
  color: "#1f2937",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "16px 0",
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

const certificateBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
};

const certificatePreview = {
  textAlign: "center" as const,
};

const certificateImage = {
  width: "100%",
  maxWidth: "500px",
  borderRadius: "8px",
  border: "2px solid #e5e7eb",
};

const previewText = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "8px 0 0",
  fontStyle: "italic",
};

const detailsBox = {
  backgroundColor: "#fef3c7",
  borderLeft: "4px solid #f59e0b",
  padding: "24px",
  margin: "24px 0",
};

const detailsText = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#f59e0b",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const verificationBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const smallText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};

