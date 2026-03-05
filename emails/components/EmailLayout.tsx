import {
  Body,
  Container,
  Head,
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
  footerText,
  unsubscribeUrl = "{{unsubscribeLink}}",
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>{children}</Section>

          <Section style={footer}>
            <Text style={spacer}>
              <br /><br /><br /><br /><br /><br /><br /><br /><br /><br />
            </Text>
            <Text style={unsubscribeStyle}>
              <Link href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe
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
  backgroundColor: "#ffffff",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const content = {
  padding: "0 48px",
  fontSize: "18px",
  lineHeight: "200%",
};

const footer = {
  padding: "0 48px",
};

const spacer = {
  margin: "0",
  padding: "0",
  lineHeight: "100%",
};

const unsubscribeStyle = {
  color: "#888888",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "0",
  textAlign: "center" as const,
};

const unsubscribeLink = {
  color: "#888888",
  textDecoration: "underline",
};

const addressStyle = {
  color: "#888888",
  fontSize: "12px",
  lineHeight: "14px",
  margin: "4px 0 0 0",
  textAlign: "center" as const,
};
