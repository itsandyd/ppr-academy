# Creator Journey - End-to-End Test Plan

## 🎯 Test Objective
Verify that a creator can successfully:
1. Sign up and complete onboarding
2. Create a store
3. Build and publish a course
4. Connect payment processing
5. View analytics

**Estimated Time:** 45-60 minutes  
**Test Date:** _______________  
**Tester:** _______________

---

## 📋 Pre-Test Setup

### Test Account Details
```
Email: creator.test@ppracademy.com
Password: [Generate secure password]
Name: Test Creator
Store Name: Test Producer Academy
```

### Required Materials
- [ ] 3 test videos (or use sample URLs)
- [ ] 1 course thumbnail image
- [ ] Test Stripe account (or use Stripe test mode)
- [ ] Valid email address for notifications

---

## ✅ Test Checklist

### Phase 1: Sign Up & Onboarding (5-7 minutes)

#### Step 1: Sign Up
- [ ] Navigate to `https://your-domain.com/sign-up`
- [ ] Click "Sign up with Google" OR "Sign up with Email"
- [ ] **Expected:** Clerk authentication modal appears
- [ ] Enter test email and password
- [ ] **Expected:** Email verification sent (check inbox)
- [ ] Verify email if required
- [ ] **Expected:** Redirected to onboarding

**🐛 Bugs Found:**
```
Bug #: _______
Description: _______________________________________
Severity: [ ] Critical [ ] High [ ] Medium [ ] Low
```

---

#### Step 2: Complete User Type Selection
- [ ] On onboarding page, see "Are you a Creator or Student?"
- [ ] Select "Creator"
- [ ] Click "Continue"
- [ ] **Expected:** Redirected to creator-specific onboarding

**✅ Pass Criteria:**
- User type selection is clear
- Both options are clickable
- Transition is smooth

**⏱️ Time Taken:** _____ seconds

---

#### Step 3: Profile Setup
- [ ] Enter creator profile information:
  - Display name: "Test Creator"
  - Bio: "Music producer and educator"
  - Profile image (optional)
- [ ] Click "Complete Profile"
- [ ] **Expected:** Profile saved successfully

**🐛 Bugs Found:**
```
Bug #: _______
Description: _______________________________________
```

---

### Phase 2: Store Creation (5-10 minutes)

#### Step 4: Access Store Creation
- [ ] From dashboard, click "Create Store" or navigate to `/dashboard/create-store`
- [ ] **Expected:** Store creation form appears

---

#### Step 5: Fill Store Details
- [ ] Enter store information:
  - **Store Name:** "Test Producer Academy"
  - **Slug:** "test-producer" (auto-generated from name)
  - **Description:** "High-quality music production courses"
  - **Category:** Select "Music Production"
  - **Store Image:** Upload thumbnail (optional)
- [ ] Click "Create Store"
- [ ] **Expected:** Store created, redirected to store dashboard

**✅ Pass Criteria:**
- Slug auto-generates correctly
- Store name validation works (no duplicates)
- Success toast appears
- Redirect happens smoothly

**⏱️ Time Taken:** _____ seconds

**🐛 Bugs Found:**
```
Bug #: _______
Description: _______________________________________
```

---

### Phase 3: Course Creation (15-20 minutes)

#### Step 6: Start Course Creation
- [ ] From store dashboard, click "Create Course"
- [ ] **Expected:** Course creation form loads

---

#### Step 7: Fill Course Basic Info
- [ ] Enter course details:
  - **Title:** "Mastering FL Studio 101"
  - **Description:** "Learn the fundamentals of music production in FL Studio"
  - **Category:** "Music Production"
  - **Level:** "Beginner"
  - **Price:** $49.00
  - **Thumbnail:** Upload course image
- [ ] Click "Save & Continue" or "Create Course"
- [ ] **Expected:** Course created, redirected to course builder

**✅ Pass Criteria:**
- All fields validate properly
- Image upload works
- Price accepts decimal values
- Course appears in creator's course list

**⏱️ Time Taken:** _____ seconds

---

#### Step 8: Create Course Structure (Modules)
- [ ] Click "Add Module" button
- [ ] Create Module 1:
  - **Title:** "Getting Started"
  - **Description:** "Introduction to FL Studio"
  - **Order:** 1
- [ ] Click "Add Module" again
- [ ] Create Module 2:
  - **Title:** "Basic Techniques"
  - **Description:** "Essential production skills"
  - **Order:** 2
- [ ] Create Module 3:
  - **Title:** "Your First Beat"
  - **Description:** "Create a complete track"
  - **Order:** 3
- [ ] **Expected:** 3 modules visible in course builder

**✅ Pass Criteria:**
- Modules can be added
- Order is correct
- Modules can be collapsed/expanded
- Edit/delete options available

---

#### Step 9: Add Chapters to Module 1
- [ ] Click "Add Chapter" in Module 1
- [ ] Create Chapter 1.1:
  - **Title:** "Welcome to the Course"
  - **Type:** "Video"
  - **Video:** Upload or enter URL
  - **Duration:** Auto-detected or manual entry
  - **Description:** "Course overview"
  - **Is Free Preview:** ✓ (checked)
- [ ] Click "Add Chapter" again
- [ ] Create Chapter 1.2:
  - **Title:** "FL Studio Interface Tour"
  - **Type:** "Video"
  - **Video:** Upload or enter URL
  - **Duration:** Auto-detected
  - **Is Free Preview:** ☐ (unchecked)
- [ ] **Expected:** 2 chapters appear under Module 1

**✅ Pass Criteria:**
- Video upload works OR URL input works
- Free preview checkbox functions
- Chapters display in order
- Duration auto-detects (if supported)

**⏱️ Time Taken:** _____ seconds

**🐛 Bugs Found:**
```
Bug #: _______
Description: _______________________________________
```

---

#### Step 10: Add Chapters to Module 2
- [ ] Click "Add Chapter" in Module 2
- [ ] Create Chapter 2.1:
  - **Title:** "Understanding the Piano Roll"
  - **Type:** "Video"
  - **Video:** Upload or enter URL
- [ ] Create Chapter 2.2:
  - **Title:** "Working with Samples"
  - **Type:** "Video"
  - **Video:** Upload or enter URL
- [ ] **Expected:** 2 chapters appear under Module 2

---

#### Step 11: Add Chapters to Module 3
- [ ] Create Chapter 3.1: "Laying Down Drums"
- [ ] Create Chapter 3.2: "Adding Melody and Bass"
- [ ] **Expected:** 2 chapters appear under Module 3

**✅ Pass Criteria:**
- Total: 3 modules, 6 chapters
- All chapters visible in builder
- Can rearrange order (drag & drop or buttons)

---

#### Step 12: Add Course Details (Optional)
- [ ] Add "What You'll Learn" bullet points:
  - "Navigate FL Studio confidently"
  - "Create your first complete beat"
  - "Understand music production basics"
- [ ] Add "Requirements":
  - "Computer with FL Studio installed"
  - "No prior experience needed"
- [ ] Add course tags/keywords (if supported)
- [ ] **Expected:** All details saved

---

### Phase 4: Course Publishing (5 minutes)

#### Step 13: Preview Course
- [ ] Click "Preview" button
- [ ] **Expected:** Course preview page opens
- [ ] Verify:
  - [ ] Course title displays correctly
  - [ ] Price shows: $49
  - [ ] Description is readable
  - [ ] Modules & chapters listed
  - [ ] Free preview chapter is marked
  - [ ] "Enroll Now" button visible

**✅ Pass Criteria:**
- Preview looks professional
- All information is accurate
- Layout is responsive (test on mobile if possible)

---

#### Step 14: Publish Course
- [ ] Return to course builder
- [ ] Click "Publish Course" button
- [ ] **Expected:** Confirmation dialog appears
- [ ] Confirm: "Yes, Publish"
- [ ] **Expected:** 
  - Success toast: "Course published successfully!"
  - Course status changes to "Published"
  - Course visible on storefront

**✅ Pass Criteria:**
- Status changes immediately
- Toast notification shows
- Course appears in store's published courses

**⏱️ Time Taken:** _____ seconds

**🐛 Bugs Found:**
```
Bug #: _______
Description: _______________________________________
```

---

### Phase 5: Payment Setup (10-15 minutes)

#### Step 15: Navigate to Payment Settings
- [ ] Go to Store Dashboard
- [ ] Click "Settings" or "Payment Settings"
- [ ] **Expected:** Payment/Stripe Connect section visible

---

#### Step 16: Connect Stripe Account
- [ ] Click "Connect Stripe" button
- [ ] **Expected:** Redirected to Stripe Connect OAuth flow
- [ ] Complete Stripe onboarding:
  - [ ] Business type: Individual
  - [ ] Country: [Your country]
  - [ ] Email: [Your email]
  - [ ] Phone: [Your phone]
  - [ ] Business details (for test, use dummy data)
- [ ] Grant permissions to PPR Academy
- [ ] **Expected:** Redirected back to PPR Academy with success message

**✅ Pass Criteria:**
- OAuth flow works smoothly
- Redirect back to platform successful
- "Stripe Connected" badge or status shown
- Can disconnect/reconnect

**⏱️ Time Taken:** _____ seconds

**🐛 Bugs Found:**
```
Bug #: _______
Description: _______________________________________
Severity: [ ] Critical (payment won't work)
```

---

#### Step 17: Verify Payment Status
- [ ] Check payment settings page
- [ ] Verify:
  - [ ] Stripe account ID displayed
  - [ ] Account status: "Active" or "Connected"
  - [ ] Test mode indicator (if in test mode)
- [ ] **Expected:** All payment info accurate

---

### Phase 6: View Public Storefront (5 minutes)

#### Step 18: Access Public Store
- [ ] Navigate to `/[storeSlug]` (e.g., `/test-producer`)
- [ ] **Expected:** Public storefront loads
- [ ] Verify:
  - [ ] Store name displays
  - [ ] Store description visible
  - [ ] Published course(s) appear
  - [ ] Course cards show:
    - Thumbnail
    - Title
    - Price
    - Creator name
    - Enrollment count (if any)

**✅ Pass Criteria:**
- Storefront looks professional
- Course cards are clickable
- Layout is clean and organized
- Mobile responsive

---

#### Step 19: View Course Detail Page
- [ ] Click on published course
- [ ] **Expected:** Course detail page loads
- [ ] Verify:
  - [ ] All course info displays
  - [ ] Modules and chapters listed
  - [ ] "Enroll Now" button prominent
  - [ ] Free preview chapter is playable
  - [ ] Other chapters are locked

**✅ Pass Criteria:**
- Can play free preview video
- Cannot access locked chapters
- Enroll button works (proceeds to checkout)

**⏱️ Time Taken:** _____ seconds

---

### Phase 7: Analytics Dashboard (5 minutes)

#### Step 20: Access Creator Dashboard
- [ ] Navigate to `/dashboard/store/[storeId]`
- [ ] **Expected:** Store analytics dashboard loads

---

#### Step 21: Verify Dashboard Metrics
- [ ] Check displayed metrics:
  - [ ] Total Revenue: $0 (no sales yet)
  - [ ] Total Students: 0
  - [ ] Total Courses: 1
  - [ ] Total Views: [some number]
- [ ] Check charts/graphs (if any):
  - [ ] Revenue over time
  - [ ] Enrollment trends
  - [ ] Popular courses
- [ ] **Expected:** All metrics display correctly

**✅ Pass Criteria:**
- Numbers are accurate
- No errors in console
- Charts render properly
- Page loads quickly (<2 seconds)

**⏱️ Time Taken:** _____ seconds

**🐛 Bugs Found:**
```
Bug #: _______
Description: _______________________________________
```

---

## 📊 Test Results Summary

### Overall Statistics
```
Total Steps Completed: ___ / 21
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

## 🏁 Test Completion Checklist

- [ ] All 21 steps attempted
- [ ] Bugs documented with severity levels
- [ ] Screenshots/videos captured for critical bugs
- [ ] UX feedback recorded
- [ ] Test results summarized
- [ ] Bug reports created in issue tracker (if applicable)
- [ ] Communicated results to team
- [ ] Priority fixes identified

---

## 📝 Notes & Additional Comments

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

