import { Button, Heading, Section, Text } from "@react-email/components";
import EmailLayout from "../components/EmailLayout";

interface CopyrightStrikeEmailProps {
  creatorName: string;
  contentTitle: string;
  strikeNumber: number;
  totalStrikes: number;
  isSuspended: boolean;
  appealUrl: string;
}

export default function CopyrightStrikeEmail({
  creatorName = "Creator",
  contentTitle = "Sample Pack",
  strikeNumber = 1,
  totalStrikes = 1,
  isSuspended = false,
  appealUrl = "#",
}: CopyrightStrikeEmailProps) {
  return (
    <EmailLayout
      preview={
        isSuspended
          ? "Account Suspended - Copyright Policy Violation"
          : `Copyright Strike ${strikeNumber} of 3`
      }
      footerText="You're receiving this email because your PPR Academy account has received a copyright strike."
    >
      {isSuspended ? (
        <>
          <Section style={suspendedBanner}>
            <Text style={suspendedText}>ACCOUNT SUSPENDED</Text>
          </Section>

          <Heading style={h2}>Your Account Has Been Suspended</Heading>

          <Text style={text}>Dear {creatorName},</Text>

          <Text style={text}>
            Your PPR Academy creator account has been suspended due to repeated copyright policy
            violations. You have received {totalStrikes} copyright strikes, which exceeds our repeat
            infringer threshold.
          </Text>
        </>
      ) : (
        <>
          <Heading style={h2}>Copyright Strike Notice</Heading>

          <Text style={text}>Dear {creatorName},</Text>

          <Text style={text}>
            Your PPR Academy account has received a copyright strike for the following content:
          </Text>
        </>
      )}

      <Section style={alertBox}>
        <Text style={alertTitle}>Content Removed:</Text>
        <Text style={alertContent}>{contentTitle}</Text>
      </Section>

      <Section style={strikeBox}>
        <Text style={strikeTitle}>Your Strike Status</Text>
        <div style={strikeIndicators}>
          {[1, 2, 3].map((num) => (
            <span key={num} style={num <= totalStrikes ? strikeActive : strikeInactive}>
              Strike {num}
            </span>
          ))}
        </div>
        <Text style={strikeWarning}>
          {totalStrikes === 1 && "You have 2 more strikes before account suspension."}
          {totalStrikes === 2 && "Warning: One more strike will result in account suspension."}
          {totalStrikes >= 3 && "Your account has been suspended."}
        </Text>
      </Section>

      <Heading style={h3}>What This Means</Heading>

      {isSuspended ? (
        <Text style={text}>While your account is suspended:</Text>
      ) : (
        <Text style={text}>As a result of this strike:</Text>
      )}

      <Text style={listText}>
        • The infringing content has been removed from the platform
        <br />
        {isSuspended ? (
          <>
            • You cannot access your creator dashboard
            <br />
            • Your existing products are hidden from the marketplace
            <br />
            • You cannot upload new content
            <br />• Your payouts have been paused
          </>
        ) : (
          <>
            • This strike will remain on your account for 12 months
            <br />
            • You may lose access to certain creator features
            <br />• Future violations may result in additional strikes or suspension
          </>
        )}
      </Text>

      <Heading style={h3}>Appeal Process</Heading>

      <Text style={text}>
        If you believe this strike was issued in error, you may appeal the decision. Appeals must
        include evidence that you have the right to use the content or that the copyright claim was
        invalid.
      </Text>

      <Section style={buttonContainer}>
        <Button style={button} href={appealUrl}>
          Submit an Appeal
        </Button>
      </Section>

      <Section style={infoBox}>
        <Text style={infoTitle}>Need Help?</Text>
        <Text style={infoText}>
          If you have questions about this strike or need assistance with the appeal process, please
          contact our support team at support@ppracademy.com
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

const listText = {
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: "28px",
  margin: "16px 0",
};

const suspendedBanner = {
  backgroundColor: "#dc2626",
  borderRadius: "8px",
  padding: "12px 24px",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const suspendedText = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "bold",
  letterSpacing: "1px",
  margin: "0",
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

const strikeBox = {
  backgroundColor: "#1f2937",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const strikeTitle = {
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 16px 0",
};

const strikeIndicators = {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
  marginBottom: "16px",
};

const strikeActive = {
  backgroundColor: "#ef4444",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "600",
  padding: "8px 16px",
  borderRadius: "4px",
};

const strikeInactive = {
  backgroundColor: "#374151",
  color: "#9ca3af",
  fontSize: "12px",
  fontWeight: "600",
  padding: "8px 16px",
  borderRadius: "4px",
};

const strikeWarning = {
  color: "#fbbf24",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
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

const infoBox = {
  backgroundColor: "#eff6ff",
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "24px 0",
};

const infoTitle = {
  color: "#1e40af",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const infoText = {
  color: "#1e40af",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};
