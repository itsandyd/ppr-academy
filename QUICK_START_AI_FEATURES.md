# ⚡ Quick Start: AI Features

## 🚀 Get Started in 5 Minutes

### Step 1: Start Convex (Required)

```bash
cd /Users/adysart/Documents/GitHub/ppr-academy
npx convex dev
```

Wait for: `✓ Convex functions ready!`

### Step 2: Generate Embeddings (One-Time)

```
1. Visit: http://localhost:3000/admin/embeddings
2. Click: "Generate New Embeddings"
3. Wait: 2-5 minutes
4. Done!
```

### Step 3: Test Features

#### A. Video Scripts
```
1. Go to: /admin/content-generation
2. Tab: "Viral Video Scripts"
3. Topic: "compression basics"
4. Platform: TikTok
5. Click: Generate
6. Get: Full script in 30 seconds ✅
```

#### B. Course Outlines
```
1. Tab: "Course Outlines"  
2. Title: "Advanced Mixing"
3. Description: "Learn pro techniques..."
4. Click: Generate
5. Get: 5 modules with lessons ✅
```

#### C. Landing Page Copy
```
1. Edit any course
2. Go to: Options step
3. Scroll to: "AI Landing Page Copy"
4. Click: Generate
5. Get: Complete sales copy ✅
```

#### D. Update Notifications
```
1. Edit a course → Add content
2. Products → Course Menu → "Send Update"
3. See: Detected changes
4. Click: "Generate Notification"
5. Review: Human-sounding copy
6. Click: "Send Notification"
7. Done: Students notified ✅
```

---

## 🎯 Quick Test Scenarios

### Test 1: Notification Isolation (Most Important!)

```
1. Send course notification
2. Click bell icon in header
3. See: Notification with creator name/avatar
4. Click notification
5. See: Full dialog opens
6. Log out and log in as different user
7. ✓ Other user doesn't see your notification
```

### Test 2: Subcategory Persistence

```
1. Create/edit course
2. Select category + subcategory
3. Save course
4. Refresh page
5. ✓ Subcategory still selected
```

### Test 3: AI Copy Quality

```
1. Generate any AI content
2. Read the output
3. ✓ Should sound human, not robotic
4. ✓ No buzzwords like "unlock", "transform"
5. ✓ Specific and conversational
```

---

## 🐛 Troubleshooting

### Convex Won't Start

```bash
# Kill existing processes
pkill -f convex

# Start fresh
npx convex dev

# Or deploy directly
npx convex deploy
```

### AI Features Not Working

**Check:**
1. ✅ Convex is running
2. ✅ `OPENAI_API_KEY` is set in .env
3. ✅ Embeddings generated (for RAG features)
4. ✅ No TypeScript errors in console

### Notifications Not Showing

**Check:**
1. ✅ Logged in with correct user
2. ✅ Notifications sent to that userId
3. ✅ Convex queries returning data
4. ✅ Check browser console

---

## 📚 Documentation Map

**Getting Started:**
- `QUICK_START_AI_FEATURES.md` ← You are here

**Feature Guides:**
- `AI_CONTENT_GENERATION_GUIDE.md` - Video & course gen
- `LANDING_PAGE_COPY_GENERATOR_GUIDE.md` - Sales copy
- `COURSE_UPDATE_NOTIFICATIONS_GUIDE.md` - Updates
- `NOTIFICATION_ENROLLMENT_TARGETING.md` - Targeting

**Philosophy:**
- `HUMAN_FIRST_AI_COPY_GUIDE.md` - Writing approach

**Technical:**
- `AI_COURSE_FEATURES_COMPLETE.md` - System overview
- `NOTIFICATION_SYSTEM_COMPLETE.md` - Notification details
- `SESSION_SUMMARY_AI_NOTIFICATIONS_OCT_26.md` - What was built

---

## ✅ Verification Checklist

- [ ] Convex dev server running
- [ ] Embeddings generated
- [ ] OpenAI API key configured
- [ ] Can generate video script
- [ ] Can generate course outline  
- [ ] Can generate landing copy
- [ ] Can send course notification
- [ ] Notifications are user-specific
- [ ] Full dialog works
- [ ] Sender info displays

---

## 🎯 Success!

Once you see all checkmarks above:

**✅ You have a complete AI-powered course platform!**

Features:
- 🎬 Generate viral video scripts
- 📚 Generate course outlines
- 🚀 Generate landing page copy
- 🔔 Send smart course notifications
- 🧑 All with human-first, authentic tone
- 🔒 With proper user isolation & privacy

**Ready to help creators succeed at scale!** 🚀

