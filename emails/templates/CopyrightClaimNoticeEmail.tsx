import { Button, Heading, Section, Text } from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface CopyrightClaimNoticeEmailProps {
  creatorName: string;
  contentTitle: string;
  claimantName: string;
  claimId: string;
  counterNoticeUrl: string;
  deadline: string;
}

export default function CopyrightClaimNoticeEmail({
  creatorName = "Creator",
  contentTitle = "Sample Pack",
  claimantName = "Rights Holder",
  claimId = "CLM-123456",
  counterNoticeUrl = "#",
  deadline = "January 15, 2025",
}: CopyrightClaimNoticeEmailProps) {
  return (
    <EmailLayout
      preview="DMCA Copyright Claim Notice - Action Required"
      footerText="You're receiving this email because content you uploaded to PPR Academy has been subject to a copyright claim."
    >
      <Heading style={h2}>Copyright Claim Notice</Heading>

      <Text style={text}>Dear {creatorName},</Text>

      <Text style={text}>
        We have received a DMCA copyright claim regarding content you uploaded to PPR Academy. Under
        the Digital Millennium Copyright Act, we are required to notify you of this claim.
      </Text>

      <Section style={alertBox}>
        <Text style={alertTitle}>Content Affected:</Text>
        <Text style={alertContent}>{contentTitle}</Text>
      </Section>

      <Section style={box}>
        <Text style={detailLabel}>Claim Reference:</Text>
        <Text style={detailValue}>{claimId}</Text>

        <Text style={detailLabel}>Claimant:</Text>
        <Text style={detailValue}>{claimantName}</Text>

        <Text style={detailLabel}>Response Deadline:</Text>
        <Text style={detailValue}>{deadline}</Text>
      </Section>

      <Heading style={h3}>Your Options</Heading>

      <Text style={text}>You have the following options to respond to this claim:</Text>

      <Text style={listText}>
        <strong>1. Do nothing:</strong> If the claim is valid, the content will be removed and you
        may receive a copyright strike on your account.
        <br />
        <br />
        <strong>2. Submit a counter-notice:</strong> If you believe the claim is invalid or you have
        the right to use this content, you may file a formal counter-notice under penalty of
        perjury.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={counterNoticeUrl}>
          Submit Counter-Notice
        </Button>
      </Section>

      <Section style={warningBox}>
        <Text style={warningTitle}>Important Information About Counter-Notices</Text>
        <Text style={warningText}>
          A counter-notice is a legal document. By filing one, you are stating under penalty of
          perjury that:
        </Text>
        <Text style={warningList}>
          • You have a good faith belief that the content was removed by mistake
          <br />
          • You consent to the jurisdiction of the federal court in your district
          <br />• You will accept service of process from the claimant
        </Text>
        <Text style={warningText}>
          If you file a counter-notice, the claimant has 14 days to file a court action. If they do
          not, we may restore your content.
        </Text>
      </Section>

      <Heading style={h3}>Repeat Infringer Policy</Heading>

      <Text style={text}>
        Please be aware that PPR Academy has a repeat infringer policy. Accounts that receive three
        valid copyright strikes may be permanently suspended.
      </Text>

      <Text style={text}>
        If you have questions about this claim or need assistance, please contact our support team.
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
  fontSize: "15px",
  lineHeight: "26px",
  margin: "16px 0",
};

const box = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const alertBox = {
  backgroundColor: "#fef2f2",
  borderRadius: "8px",
  borderLeft: "4px solid #ef4444",
  padding: "16px 20px",
  margin: "24px 0",
};

const alertTitle = {
  color: "#991b1b",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const alertContent = {
  color: "#991b1b",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0",
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

const warningBox = {
  backgroundColor: "#fffbeb",
  borderRadius: "8px",
  borderLeft: "4px solid #f59e0b",
  padding: "20px 24px",
  margin: "24px 0",
};

const warningTitle = {
  color: "#92400e",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 12px 0",
};

const warningText = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px 0",
};

const warningList = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "8px 0",
  paddingLeft: "8px",
};
