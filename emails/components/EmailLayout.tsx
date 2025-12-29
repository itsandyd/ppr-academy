import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  footerText?: string;
  unsubscribeUrl?: string;
}

export default function EmailLayout({
  preview,
  children,
  footerText = "You're receiving this email because you're a student at PPR Academy.",
  unsubscribeUrl = "{{unsubscribeLink}}",
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>PPR Academy</Heading>
          </Section>

          <Section style={content}>{children}</Section>

          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerTextStyle}>{footerText}</Text>
            <Text style={footerTextStyle}>
              <Link href={unsubscribeUrl} style={link}>
                Unsubscribe
              </Link>
              {" • "}
              <Link href="https://ppracademy.com" style={link}>
                Website
              </Link>
              {" • "}
              <Link href="mailto:support@ppracademy.com" style={link}>
                Help
              </Link>
            </Text>
            <Text style={addressStyle}>
              PPR Academy LLC, 651 N Broad St Suite 201, Middletown, DE 19709
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 48px",
  textAlign: "center" as const,
  backgroundColor: "#2563eb",
};

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const content = {
  padding: "0 48px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 0",
};

const footer = {
  padding: "0 48px",
};

const footerTextStyle = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "8px 0",
  textAlign: "center" as const,
};

const addressStyle = {
  color: "#a0aec0",
  fontSize: "11px",
  lineHeight: "14px",
  margin: "16px 0 0 0",
  textAlign: "center" as const,
};

const link = {
  color: "#2563eb",
  textDecoration: "none",
};
