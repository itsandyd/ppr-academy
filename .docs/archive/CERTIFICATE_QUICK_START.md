# Certificate System - Quick Start Guide

## 🚀 Testing the Certificate System

### Prerequisites
- ✅ Convex dev server running (`npm run dev`)
- ✅ User account created
- ✅ At least one course with chapters

---

## Step 1: Generate Your First Certificate

### Option A: Complete a Course Naturally
1. Go to `/library`
2. Click "Continue Learning" on any enrolled course
3. Mark each chapter as complete by clicking "Mark as Complete"
4. When you complete the last chapter, you'll see:
   ```
   🎉 Congratulations! You've earned a certificate!
   Check your library to view and download it
   ```

### Option B: Quick Test (Use Debug Tools)
If you want to test quickly without completing a full course:

1. Open Convex Dashboard: https://dashboard.convex.dev
2. Go to your project → Data → `certificates` table
3. Click "Add Document"
4. Use this template:
   ```json
   {
     "userId": "your_clerk_user_id",
     "userName": "Your Name",
     "userEmail": "your@email.com",
     "courseId": "course_id_from_courses_table",
     "courseTitle": "Test Course",
     "instructorName": "Instructor Name",
     "instructorId": "instructor_clerk_id",
     "certificateId": "CERT-1704067200000-TEST123",
     "completionDate": 1704067200000,
     "issueDate": 1704067200000,
     "totalChapters": 10,
     "completedChapters": 10,
     "completionPercentage": 100,
     "verificationCode": "ABC-123-XYZ",
     "isValid": true,
     "createdAt": 1704067200000,
     "verificationCount": 0
   }
   ```

---

## Step 2: View Your Certificate

1. Go to `/library`
2. Click the **"Certificates"** tab (with the 🏆 icon)
3. You should see your certificate card with:
   - Course title
   - Instructor name
   - Completion date
   - Completion percentage
   - Verification code
   - Action buttons (Share, Verify, Download)

---

## Step 3: Verify Your Certificate

### Method 1: Direct Verification
1. Click the **"Verify"** button on your certificate card
2. A new tab opens at `/verify/[certificateId]`
3. You should see:
   - ✅ **"Certificate Verified"** with green checkmark
   - Student name
   - Course title
   - Instructor name
   - Completion date
   - Verification count

### Method 2: Verification Lookup
1. Go to `/verify`
2. Enter your verification code (e.g., `ABC-123-XYZ`)
3. Click **"Verify Certificate"**
4. Should redirect to the verification result page

---

## Step 4: Share Your Certificate

### Copy Verification URL
1. Click the **"Share"** button on your certificate card
2. The verification URL is copied to clipboard
3. Paste in a new browser window or share with someone
4. They can verify your certificate without logging in

### Test Sharing
1. Copy the verification URL
2. Open an **incognito/private browser window**
3. Paste the URL
4. Certificate should display as verified

---

## Step 5: Copy Verification Code

1. Click on the verification code (e.g., `ABC-123-XYZ`) on your certificate card
2. Code is copied to clipboard
3. You can share this code with employers or on your resume
4. Anyone can verify it at `/verify`

---

## 🧪 Advanced Testing

### Test Invalid Certificate
1. Go to `/verify/INVALID-CERTIFICATE-ID`
2. Should show ❌ **"Certificate Not Valid"** error
3. Should display helpful error message

### Test Verification Logging
1. Verify a certificate multiple times
2. Check the verification count increments
3. Open Convex Dashboard → `certificateVerifications` table
4. Should see logged verification attempts with timestamps

### Test Duplicate Prevention
1. Complete a course 100%
2. Certificate is generated
3. Try to complete the same course again
4. Should NOT generate duplicate certificate
5. Should return existing certificate

### Test Certificate Revocation
1. Open Convex Dashboard
2. Find a certificate in `certificates` table
3. Set `isValid` to `false`
4. Try to verify the certificate
5. Should show as invalid

---

## 📱 UI Testing Checklist

### Certificate Card
- [ ] Displays course title correctly
- [ ] Shows instructor name
- [ ] Shows completion date in readable format
- [ ] Displays completion percentage
- [ ] Verification code is visible and copyable
- [ ] Valid badge shows (green checkmark)
- [ ] Share button works
- [ ] Verify button opens new tab
- [ ] Download button appears (if PDF available)

### Verification Page
- [ ] Valid certificates show green success state
- [ ] Invalid certificates show red error state
- [ ] Student name displays correctly
- [ ] Course title displays correctly
- [ ] Instructor name displays correctly
- [ ] Completion date formatted properly
- [ ] Verification count increments
- [ ] Certificate ID and code are visible

### Verification Lookup
- [ ] Input field accepts text
- [ ] Placeholder text is helpful
- [ ] Submit button works
- [ ] Redirects to correct verification page
- [ ] Instructions are clear

### Library Certificates Tab
- [ ] Tab shows certificate count
- [ ] Empty state displays when no certificates
- [ ] Certificates display in grid layout
- [ ] Loading skeletons show while fetching
- [ ] "Browse Your Courses" button works in empty state

---

## 🐛 Troubleshooting

### Certificate Not Generating

**Problem:** Completed course but no certificate.

**Check:**
1. Open browser console (F12)
2. Look for errors when marking last chapter complete
3. Check Convex logs in terminal
4. Verify `completionPercentage === 100`
5. Check if certificate already exists for this course

**Fix:**
```typescript
// In browser console:
console.log("Total chapters:", totalChapters);
console.log("Completed chapters:", completedChapters);
console.log("Completion %:", completionPercentage);
```

### Verification Not Working

**Problem:** Certificate shows as invalid.

**Check:**
1. Certificate ID is correct
2. Certificate exists in database
3. `isValid` field is `true`
4. No typos in verification code

**Fix:**
- Check Convex Dashboard → `certificates` table
- Verify the certificate document exists
- Check `isValid` field

### Certificate Missing in Library

**Problem:** Generated certificate doesn't show in library.

**Check:**
1. Refresh the page (hard refresh: Cmd+Shift+R)
2. Check browser console for errors
3. Verify Convex query is working
4. Check user ID matches

**Fix:**
```typescript
// Check in browser console:
const certs = await convex.query(api.certificates.getUserCertificates, { 
  userId: "your_user_id" 
});
console.log("Certificates:", certs);
```

---

## 🎯 Expected Behavior

### When Course is Completed
1. ✅ Toast notification appears: "🎉 Congratulations! You've earned a certificate!"
2. ✅ Certificate is created in database
3. ✅ Certificate appears in library immediately (or after refresh)
4. ✅ Certificate has unique ID and verification code

### When Certificate is Verified
1. ✅ Verification attempt is logged
2. ✅ Verification count increments
3. ✅ Valid certificates show green success state
4. ✅ Invalid certificates show red error state
5. ✅ All certificate details are displayed correctly

### When Certificate is Shared
1. ✅ Verification URL is copied to clipboard
2. ✅ URL can be opened in any browser (no login required)
3. ✅ Certificate displays correctly for anyone
4. ✅ Verification code can be entered manually at `/verify`

---

## 📊 Success Criteria

The certificate system is working correctly if:

- ✅ Certificates generate automatically at 100% completion
- ✅ Certificates appear in user library
- ✅ Verification system works for valid certificates
- ✅ Invalid certificates show error state
- ✅ Verification logging works
- ✅ Sharing functionality works
- ✅ No duplicate certificates are created
- ✅ UI is responsive and looks professional

---

## 🎉 You're Done!

If all the above tests pass, your certificate system is **fully functional**! 🚀

Students can now:
- ✅ Earn certificates by completing courses
- ✅ View certificates in their library
- ✅ Share certificates with employers
- ✅ Verify certificates publicly
- ✅ Build their professional portfolio

Instructors benefit from:
- ✅ Automatic certificate issuance
- ✅ No manual work required
- ✅ Increased course completion rates
- ✅ Professional credibility

---

## 📚 Further Reading

- **Full Documentation:** `CERTIFICATE_SYSTEM.md`
- **Implementation Details:** `CERTIFICATE_IMPLEMENTATION_SUMMARY.md`
- **API Reference:** See `convex/certificates.ts`

---

## 💬 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review Convex logs in terminal
3. Check browser console for errors
4. Verify database schema is up to date
5. Ensure Convex dev server is running
