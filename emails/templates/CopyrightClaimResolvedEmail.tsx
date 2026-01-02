import { Heading, Section, Text } from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface CopyrightClaimResolvedEmailProps {
  recipientName: string;
  contentTitle: string;
  claimId: string;
  resolution: "upheld" | "dismissed" | "counter_notice_accepted";
  resolutionDetails: string;
}

export default function CopyrightClaimResolvedEmail({
  recipientName = "User",
  contentTitle = "Sample Pack",
  claimId = "CLM-123456",
  resolution = "upheld",
  resolutionDetails = "The claim was found to be valid.",
}: CopyrightClaimResolvedEmailProps) {
  const getResolutionTitle = () => {
    switch (resolution) {
      case "upheld":
        return "Copyright Claim Upheld";
      case "dismissed":
        return "Copyright Claim Dismissed";
      case "counter_notice_accepted":
        return "Counter-Notice Accepted";
      default:
        return "Copyright Claim Resolved";
    }
  };

  const getResolutionBanner = () => {
    switch (resolution) {
      case "upheld":
        return { bg: "#fef2f2", border: "#ef4444", text: "#991b1b" };
      case "dismissed":
        return { bg: "#f0fdf4", border: "#22c55e", text: "#166534" };
      case "counter_notice_accepted":
        return { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" };
      default:
        return { bg: "#f3f4f6", border: "#6b7280", text: "#374151" };
    }
  };

  const banner = getResolutionBanner();

  return (
    <EmailLayout
      preview={`Copyright Claim Update: ${getResolutionTitle()}`}
      footerText="You're receiving this email because you were involved in a copyright claim on PPR Academy."
    >
      <Heading style={h2}>{getResolutionTitle()}</Heading>

      <Text style={text}>Dear {recipientName},</Text>

      <Text style={text}>
        We have completed our review of the copyright claim regarding the following content:
      </Text>

      <Section style={box}>
        <Text style={detailLabel}>Content:</Text>
        <Text style={detailValue}>{contentTitle}</Text>

        <Text style={detailLabel}>Claim Reference:</Text>
        <Text style={detailValue}>{claimId}</Text>
      </Section>

      <Section
        style={{
          ...resolutionBox,
          backgroundColor: banner.bg,
          borderLeftColor: banner.border,
        }}
      >
        <Text style={{ ...resolutionTitle, color: banner.text }}>
          Resolution: {getResolutionTitle()}
        </Text>
        <Text style={{ ...resolutionText, color: banner.text }}>{resolutionDetails}</Text>
      </Section>

      {resolution === "upheld" && (
        <>
          <Heading style={h3}>What This Means</Heading>
          <Text style={text}>
            The copyright claim was found to be valid. The content has been removed from the
            platform and a copyright strike may have been issued to the uploader's account.
          </Text>
          <Text style={text}>
            If you are the claimant: Thank you for helping us maintain the integrity of our
            platform.
          </Text>
          <Text style={text}>
            If you are the uploader: This decision may be appealed if you believe it was made in
            error.
          </Text>
        </>
      )}

      {resolution === "dismissed" && (
        <>
          <Heading style={h3}>What This Means</Heading>
          <Text style={text}>
            After careful review, we determined that the copyright claim did not meet the
            requirements for a valid DMCA takedown. The content remains available on the platform.
          </Text>
          <Text style={text}>
            If you are the claimant: If you believe this decision was made in error, you may submit
            a new claim with additional evidence.
          </Text>
        </>
      )}

      {resolution === "counter_notice_accepted" && (
        <>
          <Heading style={h3}>What This Means</Heading>
          <Text style={text}>
            A counter-notice was submitted and the statutory waiting period has passed without the
            claimant filing a court action. The content has been or will be restored.
          </Text>
          <Text style={text}>
            If you are the claimant: You may still pursue legal action independently if you believe
            your copyright has been infringed.
          </Text>
        </>
      )}

      <Section style={infoBox}>
        <Text style={infoTitle}>Questions?</Text>
        <Text style={infoText}>
          If you have questions about this resolution or need further assistance, please contact our
          support team at support@ppracademy.com
        </Text>
      </Section>

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

const resolutionBox = {
  borderRadius: "8px",
  borderLeft: "4px solid",
  padding: "20px 24px",
  margin: "24px 0",
};

const resolutionTitle = {
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const resolutionText = {
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
};

const infoBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "24px 0",
};

const infoTitle = {
  color: "#374151",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const infoText = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};
