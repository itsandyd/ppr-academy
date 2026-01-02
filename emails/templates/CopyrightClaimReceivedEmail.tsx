import { Heading, Section, Text } from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface CopyrightClaimReceivedEmailProps {
  claimantName: string;
  contentTitle: string;
  claimId: string;
  submittedAt: string;
}

export default function CopyrightClaimReceivedEmail({
  claimantName = "Rights Holder",
  contentTitle = "Sample Pack",
  claimId = "CLM-123456",
  submittedAt = "January 1, 2025",
}: CopyrightClaimReceivedEmailProps) {
  return (
    <EmailLayout
      preview="Your DMCA copyright claim has been received"
      footerText="You're receiving this email because you submitted a copyright claim on PPR Academy."
    >
      <Heading style={h2}>Copyright Claim Received</Heading>

      <Text style={text}>Dear {claimantName},</Text>

      <Text style={text}>
        We have received your DMCA copyright claim regarding the following content:
      </Text>

      <Section style={box}>
        <Text style={detailLabel}>Content Title:</Text>
        <Text style={detailValue}>{contentTitle}</Text>

        <Text style={detailLabel}>Claim Reference:</Text>
        <Text style={detailValue}>{claimId}</Text>

        <Text style={detailLabel}>Submitted:</Text>
        <Text style={detailValue}>{submittedAt}</Text>
      </Section>

      <Heading style={h3}>What Happens Next?</Heading>

      <Text style={text}>
        Our team will review your claim within 48 hours. During this time, we will:
      </Text>

      <Text style={listText}>
        • Verify the information provided in your claim
        <br />
        • Notify the content uploader of the claim
        <br />• Take appropriate action if the claim is valid
      </Text>

      <Text style={text}>
        You will receive an email notification when your claim has been reviewed and a decision has
        been made.
      </Text>

      <Section style={warningBox}>
        <Text style={warningText}>
          Please note: Filing a false DMCA claim is a violation of federal law and may result in
          legal consequences. If you have any doubts about your claim, please contact us before
          proceeding.
        </Text>
      </Section>

      <Text style={text}>
        If you have any questions about your claim, please reply to this email or contact our
        support team.
      </Text>

      <Text style={text}>
        Best regards,
        <br />
        The PPR Academy Trust & Safety Team
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
  margin: "24px 0 16px",
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const listText = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "28px",
  margin: "16px 0",
  paddingLeft: "8px",
};

const box = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const detailLabel = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const detailValue = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0 0 16px 0",
};

const warningBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  borderLeft: "4px solid #f59e0b",
  padding: "16px 20px",
  margin: "24px 0",
};

const warningText = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};
