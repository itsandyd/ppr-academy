# Sentry Alert Configuration

## Required Alert Rules

### 1. Payment Webhook Errors (Critical)
- Filter: `tags.component:stripe-webhook`
- Condition: Any new issue
- Action: Email + Slack notification immediately
- Priority: Critical

### 2. Checkout Session Errors (High)
- Filter: `tags.component:checkout-session`
- Condition: Any new issue
- Action: Email notification immediately
- Priority: High

### 3. Error Rate Spike (High)
- Condition: More than 10 events in 5 minutes
- Action: Email + Slack notification
- Priority: High

### 4. Unhandled Exceptions (Medium)
- Filter: `!handled`
- Condition: Any new issue
- Action: Email notification (digest, not every occurrence)
- Priority: Medium

## Environment Variables Required
- `NEXT_PUBLIC_SENTRY_DSN` - Client-side DSN
- `SENTRY_AUTH_TOKEN` - For source map upload during build
- `SENTRY_ORG` - Your Sentry organization slug
- `SENTRY_PROJECT` - Your Sentry project slug

## How to Set Up
1. Go to [sentry.io](https://sentry.io) and create a project (Next.js)
2. Copy the DSN to `NEXT_PUBLIC_SENTRY_DSN`
3. Generate an auth token at Settings > Auth Tokens
4. Go to Alerts > Create Alert Rule for each rule above
5. Configure notification channels (email, Slack webhook)
