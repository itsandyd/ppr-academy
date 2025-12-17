# Meta App Review Submission Guide

## PPR Academy - Instagram API Permissions

**Document Version:** 1.0  
**Last Updated:** December 5, 2025  
**Status:** Resubmission Required (2 prior rejections)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Permissions Required](#permissions-required)
3. [Rejection History & Lessons Learned](#rejection-history--lessons-learned)
4. [Screencast Requirements (CRITICAL)](#screencast-requirements-critical)
5. [Permission Descriptions](#permission-descriptions)
6. [Testing Instructions for Reviewers](#testing-instructions-for-reviewers)
7. [Submission Checklist](#submission-checklist)
8. [Timeline & Expectations](#timeline--expectations)

---

## Executive Summary

### What We're Building
PPR Academy's **Comment-to-DM Automation System** allows music educators and content creators to:
1. Set up automated responses to Instagram comments containing trigger keywords
2. Automatically reply to comments publicly
3. Send Direct Messages with content/links to users who request it via comments

### Why We Need These Permissions
This is the same pattern used by ManyChat, Later, Hootsuite, and other established platforms. The flow is:
1. Creator posts: "Comment 'FREE' to get the download link"
2. Follower comments: "FREE"
3. System detects keyword → Posts reply: "Check your DMs!"
4. System sends DM with the download link

### Current Blockers
- **instagram_manage_messages** - Rejected for "Disallowed Use Case" (wrong description submitted)
- **All other permissions** - Rejected for "Screencast Not Aligned" (video missing required elements)

---

## Permissions Required

| Permission | Purpose | Status |
|------------|---------|--------|
| `instagram_basic` | Read account ID, username, profile picture | ❌ Rejected (screencast issue) |
| `instagram_manage_comments` | Read comments, post automated replies | ❌ Rejected (screencast issue) |
| `instagram_manage_messages` | Send DMs to users who request content | ❌ Rejected (wrong description) |
| `pages_show_list` | List Facebook Pages user manages | ❌ Rejected (screencast issue) |
| `pages_messaging` | Required for Graph API messaging endpoint | ❌ Rejected (screencast issue) |
| `pages_read_engagement` | Read page/post data for automation setup | ❌ Rejected (screencast issue) |

---

## Rejection History & Lessons Learned

### Rejection #1 (December 1, 2025)

**Issue:** Screencast Not Aligned with Use Case Details

**What went wrong:**
- Screencast did not show complete OAuth flow
- Missing permission consent screen
- No captions or text overlays
- `instagram_manage_messages` had wrong description (described `instagram_basic` instead)

### Rejection #2 (December 4, 2025)

**Issue:** Same - Screencast Not Aligned with Use Case Details

**What went wrong:**
- Still missing complete Meta login flow
- User granting permissions not clearly shown
- Missing captions and tool-tips
- Need to explain buttons and UI elements

### Key Learnings

1. **Meta reviewers are VERY literal** - They need to see exactly what you describe
2. **The OAuth popup is critical** - Must show the full flow from click → popup → consent → allow → return
3. **Captions are mandatory** - Text overlays explaining each step
4. **No video cuts** - Continuous, unedited flow
5. **Each permission description must match its purpose** - Don't mix up descriptions!

---

## Screencast Requirements (CRITICAL)

### What Meta MUST See in Your Video

#### Scene-by-Scene Breakdown

```
SCENE 1: INTRO (5 seconds)
├── Text overlay: "PPR Academy - Instagram Automation Demo"
├── Text overlay: "Demonstrating: [permission name]"
└── Show starting state (dashboard, no Instagram connected)

SCENE 2: PRE-CONNECTION STATE (10 seconds)
├── Show dashboard with no Instagram account connected
├── Text overlay: "Starting with no Instagram account connected"
└── Text overlay: "User will now connect their Instagram Business account"

SCENE 3: INITIATE OAUTH (5 seconds)
├── Mouse hovers over "Connect Instagram" button
├── Text overlay: "Clicking 'Connect Instagram' to start Meta OAuth flow"
└── Click the button

SCENE 4: FACEBOOK OAUTH POPUP (20 seconds) ⚠️ MOST CRITICAL
├── Show Facebook OAuth popup appearing
├── Text overlay: "Facebook OAuth login screen"
├── Show account selection (if applicable)
├── PAUSE on permission consent screen for 5+ seconds
├── Text overlay: "User reviews requested permissions"
├── Text overlay: "Permissions: [list specific permissions]"
├── Show clicking "Continue" / "Allow"
└── Text overlay: "User grants permission to the app"

SCENE 5: RETURN TO APP (10 seconds)
├── Show redirect back to your app
├── Show "Connected" status with username
├── Text overlay: "Instagram account successfully connected"
└── Text overlay: "Account info retrieved using instagram_basic permission"

SCENE 6: CREATE AUTOMATION (30 seconds)
├── Click "Create Automation"
├── Text overlay: "Creating a comment-triggered automation"
├── Enter trigger keyword (e.g., "TEST")
├── Text overlay: "Trigger keyword: TEST"
├── Enter reply message
├── Text overlay: "Auto-reply: Thanks! Check your DMs"
├── Select Instagram post
├── Text overlay: "Selecting post to attach automation to"
├── Save automation
└── Text overlay: "Automation saved and active"

SCENE 7: TEST AUTOMATION (45 seconds) ⚠️ CRITICAL FOR COMMENTS/MESSAGES
├── Show Instagram (web or phone)
├── Text overlay: "Now testing the automation on Instagram"
├── Navigate to the post
├── Text overlay: "Going to the post with the automation"
├── Comment trigger keyword from DIFFERENT account
├── Text overlay: "User comments trigger keyword"
├── Wait 10-30 seconds
├── Show automated reply appearing
├── Text overlay: "instagram_manage_comments: Auto-reply posted"
├── Show DM notification/inbox
└── Text overlay: "instagram_manage_messages: DM delivered to user"

SCENE 8: END (5 seconds)
├── Text overlay: "End-to-end flow complete"
└── Text overlay: "All permissions demonstrated successfully"
```

### Video Technical Requirements

| Requirement | Specification |
|-------------|---------------|
| **Resolution** | 1080p minimum |
| **Length** | 2-5 minutes |
| **Language** | English UI |
| **Captions** | Required - text overlays throughout |
| **Audio** | Optional but helpful (voiceover) |
| **Editing** | No cuts during OAuth flow |
| **Format** | MP4, MOV, or direct upload |

### Tools for Adding Captions

- **Mac:** iMovie (free), ScreenFlow ($149)
- **Windows:** Clipchamp (free), Camtasia ($250)
- **Online:** Kapwing.com (free), Canva Video (free)
- **Simple:** Loom with annotations (free)

---

## Permission Descriptions

### instagram_basic

```
HOW WE USE THIS PERMISSION:

PPR Academy uses instagram_basic to access fundamental Instagram Business account 
information for our comment-triggered automation platform for music educators 
and content creators.

SPECIFIC USES:

1. READ ACCOUNT PROFILE INFO
   - We access the Instagram Business account ID to identify the account
   - We retrieve the username (e.g., @abletonppr) to display in our dashboard
   - We fetch the profile picture to show which account is connected

2. VERIFY ACCOUNT CONNECTION
   - After OAuth, we confirm the Instagram Business account is properly linked
   - We display connection status so users know their account is active
   - We validate the account type is a Business or Creator account

3. ROUTE WEBHOOKS CORRECTLY
   - The account ID received via instagram_basic is used to match incoming 
     webhook events to the correct user's automations
   - Without this, we cannot associate comments with the right account

VALUE FOR USERS:
- Creators can see their connected Instagram account details in our dashboard
- Provides visual confirmation that their account is properly linked
- Enables our system to correctly associate automations with the right account

NECESSITY:
instagram_basic is the foundational permission that provides the account identifiers 
needed for all other Instagram API functionality. Without it, we cannot:
- Identify which Instagram account the user has connected
- Display account information in our UI
- Route webhook events to the correct automations
- Use any other Instagram permissions

This permission is required by Meta as a prerequisite for instagram_manage_messages 
and instagram_manage_comments.
```

---

### instagram_manage_comments

```
HOW WE USE THIS PERMISSION:

PPR Academy uses instagram_manage_comments to power our comment-triggered 
automation system for music educators and content creators.

SPECIFIC USES:

1. READ COMMENTS (via Webhooks)
   - We receive webhook notifications when users comment on Instagram posts
   - We analyze comment text to detect trigger keywords (e.g., "Ableton", "FREE", "LINK")
   - This enables our automation to respond to specific user requests

2. POST COMMENT REPLIES
   - When a trigger keyword is detected, we post an automated public reply
   - Example: User comments "Ableton" → We reply "Thanks for your interest! Check your DMs 🎵"
   - This acknowledges user engagement publicly while directing them to check their DMs

3. AUTOMATION FLOW
   - Creator sets up automation: "When someone comments 'Ableton', reply with 'Check your DMs!'"
   - Follower comments "Ableton" on a post
   - Our webhook detects the keyword
   - We post an automated comment reply AND send a DM with the resource link

HOW IT ADDS VALUE:

For Creators:
- Automatically engages with every interested follower (no manual work)
- Provides instant public acknowledgment to commenters
- Increases engagement metrics with timely responses
- Works 24/7 even when creator is offline

For Instagram Users:
- Receive immediate responses to their comments
- Know their comment was seen and acted upon
- Get directed to relevant resources they requested

WHY IT'S NECESSARY:

Without instagram_manage_comments, we cannot:
- Detect when users comment trigger keywords on posts
- Post automated reply comments to acknowledge engagement
- Complete the "comment → reply + DM" automation workflow

This permission is essential for our core feature: comment-triggered automations 
that help creators engage with their audience at scale.

COMPLIANCE:
- We only post replies to comments containing creator-defined trigger keywords
- All automated replies are configured by the account owner
- We do not delete or hide user comments
- We do not spam or post unsolicited comments
```

---

### instagram_manage_messages ⚠️ PREVIOUSLY REJECTED - USE THIS DESCRIPTION

```
WHICH FUNCTIONALITY REQUIRES THIS PERMISSION:

PPR Academy's "Comment-to-DM" automation feature requires instagram_manage_messages 
to deliver user-requested content via Direct Message.

The workflow is:
1. Creator posts content on Instagram with a call-to-action: "Comment 'FREE' to get the download link"
2. Follower comments the keyword "FREE" (user-initiated action)
3. Our system detects the keyword and sends a DM with the requested download link
4. Follower receives exactly what they asked for

This feature ONLY sends DMs when a user explicitly requests it by commenting a specific keyword.

---

HOW THIS PERMISSION ENHANCES APP FUNCTIONALITY:

Without instagram_manage_messages, we cannot complete the content delivery workflow:
- Instagram comments don't support clickable links
- Creators cannot manually DM thousands of followers who request content
- The only way to deliver downloadable content is via Direct Message

Our integration works as follows:
1. Webhook receives comment notification from Instagram
2. System checks if comment contains a creator-defined trigger keyword
3. If matched, we call the Instagram Messaging API to send a DM
4. DM contains the link/content the user requested by commenting

This is the same pattern used by established platforms like ManyChat and Later.

---

HOW THIS ENHANCES END USER EXPERIENCE:

For Instagram Users (Followers):
- Instant delivery of requested content (no waiting)
- Simple interaction: comment a word, receive content in DMs
- No need to find links, navigate websites, or fill out forms
- Get exactly what they asked for with minimal friction

For Creators:
- Automatically fulfill every content request at scale
- Engage with audience 24/7 without manual DM sending
- Build email lists and deliver lead magnets efficiently
- Professional content delivery experience for followers

---

IMPORTANT COMPLIANCE NOTES:

✓ DMs are ONLY sent when users explicitly request them by commenting
✓ Users must take an action (comment) before receiving any DM
✓ We do NOT send unsolicited, promotional, or cold outreach messages
✓ Creators control what keywords trigger DMs
✓ All DMs are direct responses to user-initiated requests
✓ This follows the same user-initiated messaging pattern as ManyChat

This is NOT automated spam - it's automated DELIVERY of user-requested content.
```

---

### pages_show_list

```
HOW WE USE THIS PERMISSION:

PPR Academy uses pages_show_list to retrieve the Facebook Pages that a user 
manages, which is required to connect their Instagram Business account.

SPECIFIC USES:

1. LIST USER'S FACEBOOK PAGES
   - During OAuth, we retrieve all Pages the user manages
   - We display these Pages so users can select which one to connect
   - This is required because Instagram Business accounts are linked to Facebook Pages

2. IDENTIFY INSTAGRAM-LINKED PAGE
   - We check which Facebook Page has an Instagram Business account connected
   - This allows us to access the Instagram API through the correct Page

3. STORE PAGE ACCESS TOKEN
   - We store the Page access token to make Instagram API calls
   - This enables our automation features to work on behalf of the user

VALUE FOR USERS:
- Users can see and select from their managed Pages
- Clear indication of which Page is linked to Instagram
- Seamless connection process without manual configuration

NECESSITY:
This permission is required by Meta's API architecture. Instagram Business accounts 
are accessed through their linked Facebook Page. Without pages_show_list, we cannot:
- Determine which Facebook Page to use for Instagram API access
- Retrieve the Page access token needed for Instagram operations
- Complete the Instagram account connection flow
```

---

### pages_messaging

```
HOW WE USE THIS PERMISSION:

PPR Academy uses pages_messaging to send Direct Messages through the Instagram 
Messaging API, which operates via the connected Facebook Page.

SPECIFIC USES:

1. SEND INSTAGRAM DMs
   - When a user comments a trigger keyword on Instagram, we send them a DM
   - The DM contains the content/link they requested by commenting
   - This is done through the Page's messaging endpoint

2. MESSAGE DELIVERY CONFIRMATION
   - We confirm that messages were successfully delivered
   - This allows us to log automation activity and provide status to creators

FLOW:
1. User comments "FREE" on Instagram post
2. Webhook notifies our system
3. We call POST /{page-id}/messages with the Instagram user's ID
4. DM is delivered to the user who requested it

VALUE FOR USERS:
- Followers receive requested content instantly via DM
- Creators can deliver content at scale without manual messaging
- Seamless integration between comment triggers and DM delivery

NECESSITY:
pages_messaging is required for the Instagram Messaging API to function. 
Without it, we cannot:
- Send any Direct Messages to Instagram users
- Complete the comment-to-DM automation workflow
- Deliver content that users have explicitly requested

COMPLIANCE:
- Messages are only sent to users who explicitly requested them via comment
- We do not send unsolicited messages
- All messaging is user-initiated through the comment trigger system
```

---

### pages_read_engagement

```
HOW WE USE THIS PERMISSION:

PPR Academy uses pages_read_engagement to retrieve Instagram post data so 
creators can select which posts to attach automations to.

SPECIFIC USES:

1. FETCH INSTAGRAM POSTS
   - We retrieve the user's Instagram posts through the Facebook Page connection
   - Posts are displayed in our dashboard for automation setup
   - Creators select which post should trigger their automation

2. DISPLAY POST DETAILS
   - We show post thumbnails, captions, and engagement metrics
   - This helps creators identify and select the right post
   - Creators can see which posts already have automations attached

3. RETRIEVE PAGE METADATA
   - We access basic Page information to display in the dashboard
   - This confirms the correct Page/Instagram account is connected

VALUE FOR USERS:
- Creators can see all their Instagram posts in our dashboard
- Easy visual selection of which post to attach automation to
- Clear overview of post engagement and automation status

NECESSITY:
Without pages_read_engagement, we cannot:
- Display the user's Instagram posts in our interface
- Allow creators to select which post triggers the automation
- Show any content from the connected Instagram account

This permission is essential for the automation setup process - creators must 
be able to see and select their posts.
```

---

## Testing Instructions for Reviewers

**Include this in the "Testing Instructions" field:**

```
STEP-BY-STEP TESTING INSTRUCTIONS:

Step 1: Go to https://ppracademy.com/dashboard/social and sign in.

Step 2: Click "Connect Instagram" and complete the Facebook/Instagram 
        OAuth flow to link an Instagram Business account.

Step 3: Click "Create Automation" and configure:
        - Trigger keyword: "TEST"
        - Comment reply: "Thanks! Check your DMs"
        - Select any Instagram post from the connected account

Step 4: Save the automation.

Step 5: On Instagram, go to the post selected in Step 3 and comment 
        "TEST" using a different Instagram account (not the connected 
        business account).

Step 6: Within 30 seconds, observe:
        - An automated comment reply appears: "Thanks! Check your DMs"
        - A Direct Message is received with the configured content

Step 7: Return to the dashboard to see the automation activity logged.

IMPORTANT NOTES:
- The commenting user must be a real Instagram account, not a test user 
  from App Roles (test users cannot receive bot messages)
- The automation only triggers for the specific keyword configured
- DMs are only sent to users who comment the trigger keyword (user-initiated)
```

---

## Submission Checklist

### Before Recording Your Screencast

- [ ] App is deployed to production URL (not localhost)
- [ ] Instagram account is disconnected (so you can show full connection flow)
- [ ] Have a second Instagram account ready to test comments
- [ ] Screen recording software ready with text overlay capability
- [ ] English language set in app UI

### Screencast Must Include

- [ ] **Intro screen** with app name and permission being demonstrated
- [ ] **Pre-connection state** showing dashboard without Instagram connected
- [ ] **"Connect Instagram" button** click
- [ ] **Facebook OAuth popup** appearing
- [ ] **Permission consent screen** - PAUSE HERE 5+ SECONDS
- [ ] **User clicking "Continue/Allow"** to grant permissions
- [ ] **Return to app** showing connected status
- [ ] **Create automation** flow with trigger keyword
- [ ] **Test on Instagram** - comment from different account
- [ ] **Show automated reply** appearing
- [ ] **Show DM delivery** (for instagram_manage_messages)
- [ ] **Text overlays/captions** throughout explaining each step

### Text to Add to Submission Notes

```
SCREENCAST CONTENTS:
- 0:00 - Intro and starting state
- 0:15 - OAuth flow initiated
- 0:25 - Facebook OAuth popup with permission consent screen
- 0:45 - User grants permissions
- 0:50 - Return to app with connected status
- 1:00 - Creating automation with trigger keyword
- 1:30 - Testing automation on Instagram
- 2:00 - Automated comment reply demonstrated
- 2:15 - DM delivery demonstrated
- 2:30 - End

All UI is in English with captions explaining each step.
This app uses frontend OAuth authentication (not server-to-server).
```

### Final Review

- [ ] Each permission has the CORRECT description (not mixed up!)
- [ ] Screencast shows FULL OAuth flow without cuts
- [ ] Text overlays added explaining every step
- [ ] Testing instructions provided
- [ ] Production URL used (not localhost)

---

## Timeline & Expectations

### Typical Review Timeline

| Scenario | Timeframe |
|----------|-----------|
| Best case (all requirements met) | 1-2 business days |
| Average | 3-5 business days |
| If questions/clarifications needed | 1-2 weeks |
| With rejections and resubmissions | 2-4 weeks total |

### What Happens After Submission

1. **Automated checks** run immediately (format, required fields)
2. **Human review** within 1-5 business days
3. **Email notification** sent with results
4. **If approved**: Permissions work immediately
5. **If rejected**: Feedback provided, can resubmit

### Checking Status

1. Go to [Meta Developer Console](https://developers.facebook.com/apps/)
2. Select your app
3. Navigate to **App Review** → **Submissions**
4. View status: Pending, Approved, or Rejected with feedback

---

## Contact & Resources

### Meta Resources
- [App Review Introduction Video](https://developers.facebook.com/docs/app-review)
- [Screen Recording Guide](https://developers.facebook.com/docs/app-review/resources/screencast)
- [Permissions Reference](https://developers.facebook.com/docs/permissions/reference)
- [Common Rejection Guidelines](https://developers.facebook.com/docs/app-review/common-rejections)

### Similar Approved Apps (for reference)
- ManyChat - Uses same comment-to-DM pattern
- Later - Uses same comment-to-DM pattern
- Hootsuite - Uses same Instagram automation pattern

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 5, 2025 | Initial document after 2 rejections |

---

*This document should be updated after each submission attempt with lessons learned.*







