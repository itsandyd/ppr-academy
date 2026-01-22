# Task: Get Stripe Credits Purchase Working End-to-End

## Objective
Ensure the Stripe credits purchase flow works completely - from clicking "Buy" on /credits/purchase to credits appearing in the user's account.

## Success Criteria
- [ ] Stripe environment variables are correctly configured and validated
- [ ] Credit packages display correctly on /credits/purchase
- [ ] Checkout session creates successfully when user clicks purchase
- [ ] Stripe redirects to checkout page without errors
- [ ] Webhook receives and processes checkout.session.completed event
- [ ] Credits are added to user's Convex account after successful payment
- [ ] Success/cancel redirect pages work correctly
- [ ] Error states are handled gracefully with clear user feedback

## Process
1. **Verify Configuration**: Check .env.local has STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
2. **Test API Route**: Ensure /api/credits/create-checkout-session works with proper auth
3. **Test Checkout Flow**: Verify Stripe checkout session creation with test mode
4. **Verify Webhook**: Ensure /api/webhooks/stripe handles credit purchases
5. **Test Credit Addition**: Confirm Convex mutation addCredits works from webhook
6. **End-to-End Test**: Complete a test purchase using Stripe test cards
7. **Fix Any Issues**: Address any errors encountered during testing

## Key Files
- app/credits/purchase/page.tsx
- app/api/credits/create-checkout-session/route.ts
- app/api/webhooks/stripe/route.ts
- convex/credits.ts (addCredits mutation)
- .env.local (Stripe keys)

## Test Card
Use: 4242 4242 4242 4242 (any future date, any CVC)

## Output Instruction
When all success criteria are met and a test purchase successfully adds credits:
<promise>STRIPE_CREDITS_COMPLETE</promise>
