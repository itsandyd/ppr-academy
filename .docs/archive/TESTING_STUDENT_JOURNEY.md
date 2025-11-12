# Student Journey - End-to-End Test Plan

## 🎯 Test Objective
Verify that a student can successfully:
1. Browse and discover courses
2. Enroll in a course via payment
3. Access course content
4. Complete chapters and track progress
5. Earn a certificate upon completion

**Estimated Time:** 30-45 minutes  
**Test Date:** _______________  
**Tester:** _______________

---

## 📋 Pre-Test Setup

### Prerequisites
- [ ] Creator journey completed (course published)
- [ ] Test course available with:
  - 3 modules
  - 6 chapters
  - At least 1 free preview chapter
  - Price: $49
- [ ] Stripe test mode enabled

### Test Account Details
```
Email: student.test@ppracademy.com
Password: [Generate secure password]
Name: Test Student
```

### Stripe Test Cards
```
✅ Successful Payment:    4242 4242 4242 4242
❌ Declined Payment:      4000 0000 0000 0002
🔐 3D Secure Required:    4000 0027 6000 3184

Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

---

## ✅ Test Checklist

### Phase 1: Sign Up & Browse (5-7 minutes)

#### Step 1: Sign Up as Student
- [ ] Navigate to `https://your-domain.com/sign-up`
- [ ] Enter test email: `student.test@ppracademy.com`
- [ ] Enter password and complete sign-up
- [ ] **Expected:** Email verification sent
- [ ] Verify email if required
- [ ] **Expected:** Redirected to onboarding

**⏱️ Time Taken:** _____ seconds

**🐛 Bugs Found:**
```
Bug #: _______
Description: _______________________________________
Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
```

---

#### Step 2: Select User Type
- [ ] On onboarding, select "Student"
- [ ] Click "Continue"
- [ ] **Expected:** Redirected to student dashboard or marketplace

**✅ Pass Criteria:**
- User type selection clear
- Smooth transition
- Appropriate redirect

---

#### Step 3: Browse Marketplace
- [ ] Navigate to `/courses` or marketplace
- [ ] **Expected:** Course catalog loads
- [ ] Verify:
  - [ ] Multiple courses visible (at least test course)
  - [ ] Course cards show:
    - Thumbnail
    - Title
    - Price
    - Creator name
    - Rating (if any)
  - [ ] Filter/search options available
  - [ ] Categories visible

**✅ Pass Criteria:**
- Page loads quickly (<2 seconds)
- Course cards are attractive
- Layout is organized
- Mobile responsive

**⏱️ Time Taken:** _____ seconds

---

### Phase 2: Course Discovery & Preview (5 minutes)

#### Step 4: Search for Course
- [ ] Use search bar to find "FL Studio" or "Mastering"
- [ ] **Expected:** Test course appears in results
- [ ] Click on course card
- [ ] **Expected:** Course detail page loads

**✅ Pass Criteria:**
- Search works accurately
- Results appear quickly
- Course card is clickable

---

#### Step 5: View Course Detail Page
- [ ] On course page, verify:
  - [ ] Course title: "Mastering FL Studio 101"
  - [ ] Price: $49
  - [ ] Description visible
  - [ ] Instructor info shown
  - [ ] Course curriculum (modules & chapters) listed
  - [ ] Free preview chapter marked
  - [ ] "Enroll Now" button prominent
  - [ ] Reviews section (if any)

**✅ Pass Criteria:**
- All information displays correctly
- Page layout is professional
- No broken images
- Text is readable

**⏱️ Time Taken:** _____ seconds

---

#### Step 6: Watch Free Preview
- [ ] Find free preview chapter (e.g., "Welcome to the Course")
- [ ] Click "Preview" or play button
- [ ] **Expected:** Video player opens/loads
- [ ] Verify:
  - [ ] Video plays without buffering
  - [ ] Player controls work (play, pause, volume, fullscreen)
  - [ ] Quality is acceptable
  - [ ] Can seek through video
- [ ] **Expected:** Cannot access locked chapters

**✅ Pass Criteria:**
- Video loads within 3 seconds
- Playback is smooth
- Locked chapters show lock icon
- Preview gives good impression

**⏱️ Time Taken:** _____ seconds

**🐛 Bugs Found:**
```
Bug #: _______
Description: _______________________________________
```

---

### Phase 3: Enrollment & Payment (10-15 minutes)

#### Step 7: Initiate Checkout
- [ ] Click "Enroll Now" button
- [ ] **Expected:** Redirected to checkout page OR Stripe checkout modal opens
- [ ] Verify checkout page shows:
  - [ ] Course name
  - [ ] Price: $49
  - [ ] Creator's name
  - [ ] Course thumbnail
  - [ ] Payment form fields

**✅ Pass Criteria:**
- Redirect is immediate
- All course info is accurate
- Page is secure (HTTPS)

---

#### Step 8: Fill Payment Information
- [ ] Enter Stripe test card: `4242 4242 4242 4242`
- [ ] Expiry: `12/25`
- [ ] CVC: `123`
- [ ] ZIP: `12345`
- [ ] Email: `student.test@ppracademy.com`
- [ ] Name: `Test Student`
- [ ] **Expected:** Form validates input

**✅ Pass Criteria:**
- Card number validates as you type
- Expiry date formatted automatically
- Required fields marked clearly

**⏱️ Time Taken:** _____ seconds

---

#### Step 9: Complete Purchase (Successful Payment)
- [ ] Click "Pay $49" or "Complete Purchase"
- [ ] **Expected:** Payment processing indicator shows
- [ ] Wait for confirmation
- [ ] **Expected:**
  - Success page or redirect
  - Confirmation message
  - Course now accessible

**✅ Pass Criteria:**
- Payment processes within 5 seconds
- Success message is clear
- No errors in console

**⏱️ Time Taken:** _____ seconds

**🐛 Bugs Found:**
```
Bug #: _______
Description: _______________________________________
Severity: [ ] Critical (payment blocks enrollment)
```

---

#### Step 10: Verify Purchase Confirmation
- [ ] Check for confirmation email
- [ ] **Expected:** Email received within 2 minutes
- [ ] Email contains:
  - [ ] Purchase confirmation
  - [ ] Course name
  - [ ] Amount paid
  - [ ] Receipt/invoice link
  - [ ] "Access Your Course" button/link
- [ ] Click link in email
- [ ] **Expected:** Redirected to course or library

**✅ Pass Criteria:**
- Email arrives promptly
- All information correct
- Links work
- Email design is professional

---

### Phase 4: Course Access & Learning (10-15 minutes)

#### Step 11: Access Course from Library
- [ ] Navigate to `/library` or student dashboard
- [ ] **Expected:** Library page loads
- [ ] Verify:
  - [ ] Enrolled course appears
  - [ ] Course thumbnail shows
  - [ ] Progress indicator shows 0%
  - [ ] "Continue Learning" or "Start Course" button visible

**✅ Pass Criteria:**
- Course appears immediately after purchase
- Progress tracking is initialized
- UI is clean and organized

**⏱️ Time Taken:** _____ seconds

---

#### Step 12: Start Course
- [ ] Click "Start Course" or course card
- [ ] **Expected:** Course player page loads
- [ ] Verify:
  - [ ] First chapter automatically selected
  - [ ] Video player ready
  - [ ] Sidebar shows full curriculum
  - [ ] All chapters are now unlocked
  - [ ] Progress bar at top shows 0%

**✅ Pass Criteria:**
- Course loads quickly
- Layout is intuitive
- Video player is prominent
- Navigation is clear

---

#### Step 13: Watch First Chapter
- [ ] Play first chapter video
- [ ] **Expected:** Video starts playing
- [ ] Watch for at least 30 seconds
- [ ] **Expected:** Progress is tracked
- [ ] Seek to near the end of video
- [ ] **Expected:** "Mark as Complete" button appears OR auto-marks complete

**✅ Pass Criteria:**
- Video playback is smooth
- Progress tracking works
- Completion detection accurate

**⏱️ Time Taken:** _____ seconds

**🐛 Bugs Found:**
```
Bug #: _______
Description: _______________________________________
```

---

#### Step 14: Mark Chapter Complete
- [ ] Click "Mark as Complete" (if manual)
- [ ] **Expected:**
  - Checkmark appears on chapter
  - Progress bar updates
  - Next chapter auto-selects OR "Next Chapter" button appears
  - Overall course progress shows ~17% (1/6 chapters)

**✅ Pass Criteria:**
- Completion is instant
- Visual feedback is clear
- Progress calculation is accurate
- Auto-advance works (if enabled)

---

#### Step 15: Navigate Through Chapters
- [ ] Click "Next Chapter" or select Chapter 1.2
- [ ] **Expected:** Second chapter loads
- [ ] Watch/mark as complete
- [ ] Move to Chapter 2.1 (Module 2)
- [ ] **Expected:** Module 2 expands, chapter loads
- [ ] Mark as complete
- [ ] **Expected:** Progress now ~50% (3/6 chapters)

**✅ Pass Criteria:**
- Navigation is smooth
- Module expansion works
- Progress updates correctly
- Can jump between chapters

**⏱️ Time Taken:** _____ seconds

---

#### Step 16: Test Chapter Features
- [ ] Test video player controls:
  - [ ] Playback speed (0.5x, 1x, 1.5x, 2x)
  - [ ] Volume control
  - [ ] Fullscreen mode
  - [ ] Picture-in-picture (if available)
- [ ] Test sidebar:
  - [ ] Collapse/expand modules
  - [ ] Search chapters (if available)
  - [ ] Jump to specific chapter
- [ ] **Expected:** All features work smoothly

**✅ Pass Criteria:**
- Player controls responsive
- Speed changes work
- Fullscreen is functional
- No playback issues

---

### Phase 5: Quiz (Optional - If Available)

#### Step 17: Take Quiz (If Course Has Quiz)
- [ ] Navigate to quiz chapter
- [ ] **Expected:** Quiz interface loads
- [ ] Answer questions:
  - Multiple choice
  - True/False
  - Fill in the blank (if any)
- [ ] Submit answers
- [ ] **Expected:**
  - Score displayed immediately
  - Correct answers shown
  - Pass/fail status clear
  - Can retake if failed

**✅ Pass Criteria:**
- Quiz UI is intuitive
- Questions load properly
- Scoring is accurate
- Feedback is helpful

**⏱️ Time Taken:** _____ seconds

---

### Phase 6: Course Completion & Certificate (5-10 minutes)

#### Step 18: Complete Remaining Chapters
- [ ] Complete all remaining chapters (Chapters 2.2, 3.1, 3.2)
- [ ] **Expected:** Progress reaches 100%
- [ ] **Expected:** Completion celebration triggers:
  - Confetti animation OR
  - Success modal OR
  - Congratulations message

**✅ Pass Criteria:**
- All chapters can be completed
- 100% completion detected
- Celebration is satisfying
- Next steps are clear

**⏱️ Time Taken:** _____ seconds

**🐛 Bugs Found:**
```
Bug #: _______
Description: _______________________________________
```

---

#### Step 19: Receive Certificate
- [ ] After completion, check for certificate
- [ ] **Expected:** Certificate automatically generated
- [ ] Verify:
  - [ ] Certificate appears in course OR library
  - [ ] "View Certificate" button visible
  - [ ] Email notification sent (check inbox)
- [ ] Click "View Certificate"
- [ ] **Expected:** Certificate page loads

**✅ Pass Criteria:**
- Certificate generates within 10 seconds
- Email arrives within 2 minutes
- Certificate link works

---

#### Step 20: View & Download Certificate
- [ ] On certificate page, verify:
  - [ ] Student name: "Test Student"
  - [ ] Course name: "Mastering FL Studio 101"
  - [ ] Completion date: [Today's date]
  - [ ] Certificate ID/number
  - [ ] Instructor signature or logo
  - [ ] Professional design
- [ ] Click "Download" button
- [ ] **Expected:** PDF downloads successfully
- [ ] Open PDF and verify quality
- [ ] **Expected:** PDF matches web version

**✅ Pass Criteria:**
- Certificate looks professional
- All information is accurate
- PDF downloads without errors
- Print quality is good

**⏱️ Time Taken:** _____ seconds

---

#### Step 21: Share Certificate
- [ ] Find "Share Certificate" options
- [ ] Test share buttons:
  - [ ] LinkedIn
  - [ ] Twitter
  - [ ] Copy link
  - [ ] Email
- [ ] Copy certificate link
- [ ] Open in incognito/new browser
- [ ] **Expected:** Public certificate verification page loads
- [ ] Verify:
  - [ ] Certificate is valid
  - [ ] Verification ID works
  - [ ] Cannot be edited/faked

**✅ Pass Criteria:**
- Share options work
- Public verification accessible
- Certificate is authentic
- Link sharing works

---

### Phase 7: Post-Completion (5 minutes)

#### Step 22: Leave Course Review (If Available)
- [ ] Navigate back to course
- [ ] Find "Leave a Review" section
- [ ] Rate course (1-5 stars)
- [ ] Write review: "Great course for beginners!"
- [ ] Submit review
- [ ] **Expected:**
  - Review posted successfully
  - Appears on course page
  - Creator is notified (optional)

**✅ Pass Criteria:**
- Review form is accessible
- Submission works
- Review displays properly

**⏱️ Time Taken:** _____ seconds

---

#### Step 23: Explore Additional Features
- [ ] Check student dashboard
- [ ] Verify:
  - [ ] Course marked as "Completed"
  - [ ] Certificate badge/icon shown
  - [ ] Learning stats updated:
    - Total courses: 1
    - Completed: 1
    - Certificates earned: 1
    - Hours learned: [X]
- [ ] Browse recommended courses (if any)
- [ ] **Expected:** Personalized recommendations

**✅ Pass Criteria:**
- Dashboard reflects completion
- Stats are accurate
- Recommendations relevant

---

### Phase 8: Failed Payment Test (5 minutes)

#### Step 24: Test Failed Payment Flow
- [ ] Sign out
- [ ] Create new test account: `student.failed@ppracademy.com`
- [ ] Navigate to a course
- [ ] Click "Enroll Now"
- [ ] Enter declined card: `4000 0000 0000 0002`
- [ ] Complete other fields
- [ ] Click "Pay"
- [ ] **Expected:**
  - Payment fails with clear error message
  - User is NOT enrolled
  - Can retry payment
  - No charge is made

**✅ Pass Criteria:**
- Error message is user-friendly
- No enrollment created
- User can try again
- No phantom charges

**⏱️ Time Taken:** _____ seconds

**🐛 Bugs Found:**
```
Bug #: _______
Description: _______________________________________
Severity: [ ] Critical (affects revenue)
```

---

## 📊 Test Results Summary

### Overall Statistics
```
Total Steps Completed: ___ / 24
Time Taken: ___ minutes
Bugs Found: ___
Critical Bugs: ___
High Priority Bugs: ___
Medium Priority Bugs: ___
Low Priority Bugs: ___
```

### Success Rate
```
✅ Passed: ___ steps
⚠️  Passed with Issues: ___ steps
❌ Failed: ___ steps

Overall Pass Rate: ____%
```

---

## 🐛 Bug Report

### Bug #1
**Title:** _______________________________________  
**Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low  
**Steps to Reproduce:**
1. _______________________________________
2. _______________________________________
3. _______________________________________

**Expected Behavior:** _______________________________________

**Actual Behavior:** _______________________________________

**Screenshot/Video:** _______________________________________

**Impact on Students:** _______________________________________

**Priority:** [ ] Must fix before beta [ ] Fix during beta [ ] Post-beta

---

### Bug #2
**Title:** _______________________________________  
**Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low  
**Steps to Reproduce:**
1. _______________________________________
2. _______________________________________
3. _______________________________________

**Expected Behavior:** _______________________________________

**Actual Behavior:** _______________________________________

---

## 🎯 User Experience Observations

### What Worked Well ✅
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Friction Points ⚠️
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Confusing or Unclear 🤔
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Feature Requests 💡
1. _______________________________________
2. _______________________________________
3. _______________________________________

---

## 💰 Payment Flow Analysis

### Successful Payment Test
- [ ] Payment completed
- [ ] Enrollment created instantly
- [ ] Confirmation email sent
- [ ] Access granted immediately
- [ ] Creator earnings recorded
- [ ] Webhook processed

**Issues:** _______________________________________

### Failed Payment Test
- [ ] Error displayed clearly
- [ ] No enrollment created
- [ ] User can retry
- [ ] Support contact info provided

**Issues:** _______________________________________

---

## 🏁 Test Completion Checklist

- [ ] All 24 steps attempted
- [ ] Both successful and failed payment tested
- [ ] Bugs documented with severity
- [ ] Screenshots captured for issues
- [ ] UX feedback recorded
- [ ] Certificate verified and downloaded
- [ ] Email notifications checked
- [ ] Test results summarized
- [ ] Bug reports created
- [ ] Priority fixes identified

---

## 📝 Notes & Additional Comments

### Learning Experience
```
How intuitive was the course player? _______________________________________
How satisfied would you be as a student? _______________________________________
Would you recommend this platform? _______________________________________
```

### Purchase Experience
```
How smooth was the checkout? _______________________________________
Did you feel secure entering payment info? _______________________________________
Was pricing clear and transparent? _______________________________________
```

### Overall Impression
```
_______________________________________
_______________________________________
_______________________________________
```

---

**Test Status:** [ ] PASSED [ ] PASSED WITH ISSUES [ ] FAILED  
**Ready for Beta:** [ ] YES [ ] NO [ ] WITH FIXES

**Tester Signature:** _______________  
**Date Completed:** _______________

