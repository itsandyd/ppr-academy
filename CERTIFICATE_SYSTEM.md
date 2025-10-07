# Course Completion Certificate System

## Overview

The PPR Academy Certificate System automatically generates verifiable certificates when students complete courses. Certificates include unique verification codes and can be shared on social media or LinkedIn.

---

## Features

### ✅ Automatic Certificate Generation
- Certificates are automatically generated when a student completes 100% of a course
- One-time generation per user per course
- Includes completion percentage, date, and course details

### ✅ Verification System
- Each certificate has a unique Certificate ID and Verification Code
- Public verification page at `/verify/[certificateId]`
- Verification lookup page at `/verify` for entering codes
- Tracks verification attempts and counts

### ✅ Beautiful Certificate Design
- Professional certificate template with decorative borders
- Includes student name, course title, instructor name
- Completion date and verification information
- Downloadable as PDF (future enhancement)

### ✅ User Library Integration
- Certificates tab in user library (`/library`)
- Certificate cards with share and verify buttons
- Quick copy verification code

---

## Database Schema

### `certificates` Table

```typescript
{
  // Student Info
  userId: string,              // Clerk user ID
  userName: string,            // Student's full name
  userEmail: string,           // For verification
  
  // Course Info
  courseId: Id<"courses">,
  courseTitle: string,         // Cached for display
  instructorName: string,      // Course creator's name
  instructorId: string,        // Course creator's ID
  
  // Certificate Details
  certificateId: string,       // Unique verification ID (UUID)
  completionDate: number,      // When course was completed
  issueDate: number,           // When certificate was issued
  
  // Progress Metrics
  totalChapters: number,
  completedChapters: number,
  completionPercentage: number,
  timeSpent?: number,          // Total time in minutes
  
  // Certificate File
  pdfUrl?: string,             // URL to generated PDF (Convex storage)
  pdfStorageId?: Id<"_storage">, // Storage ID for PDF
  
  // Verification
  verificationCode: string,    // Short code (e.g., "ABC-123-XYZ")
  isValid: boolean,            // Can be revoked if needed
  
  // Metadata
  createdAt: number,
  lastVerifiedAt?: number,     // Last time someone verified this cert
  verificationCount: number,   // How many times verified
}
```

### `certificateVerifications` Table

```typescript
{
  certificateId: string,       // The certificate being verified
  verifierIp?: string,         // IP address of verifier
  verifierUserAgent?: string,  // Browser info
  isValid: boolean,            // Verification result
  verifiedAt: number,          // Timestamp
}
```

---

## API Functions

### Queries

#### `getUserCertificates(userId: string)`
Get all certificates for a user, sorted by issue date (newest first).

**Returns:** Array of certificate objects

**Example:**
```typescript
const certificates = useQuery(api.certificates.getUserCertificates, { 
  userId: user.id 
});
```

#### `getCertificateById(certificateId: string)`
Get a certificate by its unique ID for verification.

**Returns:** Certificate object or null

**Example:**
```typescript
const certificate = useQuery(api.certificates.getCertificateById, { 
  certificateId: "CERT-1234567890-ABC123" 
});
```

#### `getCertificateByCode(verificationCode: string)`
Get a certificate by its short verification code.

**Returns:** Certificate object or null

**Example:**
```typescript
const certificate = useQuery(api.certificates.getCertificateByCode, { 
  verificationCode: "ABC-123-XYZ" 
});
```

#### `hasCertificate(userId: string, courseId: Id<"courses">)`
Check if a user has a certificate for a specific course.

**Returns:** `{ hasCertificate: boolean, certificateId?: string }`

**Example:**
```typescript
const result = useQuery(api.certificates.hasCertificate, { 
  userId: user.id,
  courseId: courseData._id
});
```

### Mutations

#### `generateCertificate(args)`
Generate a new certificate for course completion.

**Args:**
```typescript
{
  userId: string,
  userName: string,
  userEmail: string,
  courseId: Id<"courses">,
  courseTitle: string,
  instructorName: string,
  instructorId: string,
  totalChapters: number,
  completedChapters: number,
  completionPercentage: number,
  timeSpent?: number,
}
```

**Returns:** `{ success: boolean, certificateId?: string, verificationCode?: string, error?: string }`

**Example:**
```typescript
const result = await generateCertificate({
  userId: user.id,
  userName: user.fullName || "Student",
  userEmail: user.emailAddresses[0]?.emailAddress || "",
  courseId: courseData._id,
  courseTitle: courseData.title,
  instructorName: "John Doe",
  instructorId: "user_123",
  totalChapters: 10,
  completedChapters: 10,
  completionPercentage: 100,
});
```

#### `verifyCertificate(certificateId: string, verifierIp?: string, verifierUserAgent?: string)`
Verify a certificate and log the verification attempt.

**Returns:** `{ isValid: boolean, certificate?: {...} }`

**Example:**
```typescript
const result = await verifyCertificate({
  certificateId: "CERT-1234567890-ABC123",
  verifierUserAgent: navigator.userAgent,
});
```

#### `revokeCertificate(certificateId: string, revokedBy: string)`
Revoke a certificate (instructor/admin only).

**Returns:** `{ success: boolean, error?: string }`

---

## UI Components

### `<CertificateCard />`
**Location:** `/components/certificates/CertificateCard.tsx`

Displays a certificate in card format with actions.

**Props:**
```typescript
{
  certificate: {
    _id: string;
    courseTitle: string;
    instructorName: string;
    certificateId: string;
    completionDate: number;
    issueDate: number;
    completionPercentage: number;
    verificationCode: string;
    isValid: boolean;
    pdfUrl?: string;
  };
  onDownload?: () => void;
}
```

**Features:**
- Share button (copies verification URL)
- Copy verification code button
- Download PDF button (if available)
- Verify button (opens verification page)

### `<CertificateTemplate />`
**Location:** `/components/certificates/CertificateTemplate.tsx`

Visual certificate template for display/printing.

**Props:**
```typescript
{
  userName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: number;
  certificateId: string;
  verificationCode: string;
  completionPercentage: number;
}
```

**Features:**
- Professional design with decorative borders
- PPR Academy branding
- Verification information
- Print-ready layout (1056x816px)

---

## Pages

### `/verify` - Certificate Verification Lookup
**File:** `/app/verify/page.tsx`

Public page where anyone can enter a certificate ID or verification code to verify authenticity.

**Features:**
- Input field for certificate ID or verification code
- Instructions for verification
- Redirects to verification result page

### `/verify/[certificateId]` - Certificate Verification Result
**File:** `/app/verify/[certificateId]/page.tsx`

Displays verification result for a specific certificate.

**Features:**
- ✅ Valid certificate: Shows student name, course, instructor, completion date
- ❌ Invalid certificate: Shows error message
- Logs verification attempt
- Displays verification count

### `/library` - User Library (Certificates Tab)
**File:** `/app/library/page.tsx`

User's personal library with a dedicated Certificates tab.

**Features:**
- Grid of certificate cards
- Empty state with call-to-action
- Certificate count display

---

## Integration Flow

### 1. Course Completion Detection

In `/app/library/courses/[slug]/page.tsx`:

```typescript
const handleChapterComplete = async (chapterId: string) => {
  // ... mark chapter complete ...
  
  // Count total and completed chapters
  let totalChapters = 0;
  let completedChapters = 0;
  
  courseData.modules?.forEach((module: any) => {
    module.lessons?.forEach((lesson: any) => {
      lesson.chapters?.forEach((chapter: any) => {
        totalChapters++;
        if (chapter._id === chapterId || chapter.isCompleted) {
          completedChapters++;
        }
      });
    });
  });

  const completionPercentage = Math.round((completedChapters / totalChapters) * 100);

  // Generate certificate if 100% complete
  if (completionPercentage === 100 && !hasCertificate?.hasCertificate) {
    const result = await generateCertificate({
      // ... certificate data ...
    });

    if (result.success) {
      toast.success("🎉 Congratulations! You've earned a certificate!");
    }
  }
};
```

### 2. Certificate Display

In user library:
```typescript
const userCertificates = useQuery(
  api.certificates.getUserCertificates,
  { userId: user.id }
);

// Display in Certificates tab
{userCertificates?.map((cert) => (
  <CertificateCard key={cert._id} certificate={cert} />
))}
```

### 3. Verification

Public verification:
```typescript
const certificate = useQuery(
  api.certificates.getCertificateById,
  { certificateId }
);

// Log verification
useEffect(() => {
  verifyCertificate({
    certificateId,
    verifierUserAgent: navigator.userAgent,
  });
}, [certificateId]);
```

---

## Verification System

### Certificate ID Format
- Format: `CERT-{timestamp}-{random}`
- Example: `CERT-1704067200000-ABC123XYZ`
- Unique and tamper-proof

### Verification Code Format
- Format: `XXX-XXX-XXX` (9 characters, 3 groups of 3)
- Uses only unambiguous characters (no 0, O, 1, I, etc.)
- Easy to type and share
- Example: `ABC-123-XYZ`

### Verification URL
- Direct: `https://ppracademy.com/verify/CERT-1704067200000-ABC123XYZ`
- Lookup: `https://ppracademy.com/verify` (enter code)

---

## Future Enhancements

### PDF Generation
- Server-side PDF generation using Puppeteer or similar
- Upload to Convex storage
- Automatic download on certificate earn

### Email Delivery
- Send certificate via email when earned
- Include PDF attachment
- Verification link in email

### Social Sharing
- LinkedIn integration (add to profile)
- Twitter/X share with preview
- Facebook share

### Certificate Templates
- Multiple certificate designs
- Instructor-customizable templates
- Course-specific branding

### Analytics
- Track certificate shares
- Verification analytics
- Most verified courses

### Blockchain Verification
- Store certificate hashes on blockchain
- Immutable verification
- NFT certificates (optional)

---

## Testing

### Manual Testing Checklist

1. **Certificate Generation**
   - [ ] Complete a course 100%
   - [ ] Verify certificate is generated
   - [ ] Check certificate appears in library
   - [ ] Verify toast notification appears

2. **Certificate Display**
   - [ ] View certificate in library
   - [ ] Check all details are correct
   - [ ] Verify verification code is displayed

3. **Verification**
   - [ ] Copy verification URL
   - [ ] Open in new browser/incognito
   - [ ] Verify certificate shows as valid
   - [ ] Check verification count increments

4. **Verification Lookup**
   - [ ] Go to `/verify`
   - [ ] Enter verification code
   - [ ] Verify redirects to certificate page
   - [ ] Check certificate details

5. **Sharing**
   - [ ] Click share button
   - [ ] Verify URL is copied
   - [ ] Test URL in different browser

6. **Edge Cases**
   - [ ] Try verifying invalid certificate ID
   - [ ] Try verifying with wrong code
   - [ ] Complete same course twice (should not duplicate)
   - [ ] Revoke certificate and verify it shows as invalid

---

## Troubleshooting

### Certificate Not Generating

**Problem:** Completed course but no certificate generated.

**Solutions:**
1. Check if `completionPercentage === 100`
2. Verify `hasCertificate` query is working
3. Check console for errors
4. Ensure all chapters are marked complete

### Verification Not Working

**Problem:** Certificate shows as invalid when it should be valid.

**Solutions:**
1. Check `certificateId` is correct
2. Verify certificate exists in database
3. Check `isValid` field is `true`
4. Look for Convex errors in console

### Certificate Missing Details

**Problem:** Certificate shows "Instructor" or missing data.

**Solutions:**
1. Check course has `creatorName` and `creatorId`
2. Verify user data is passed correctly
3. Add fallback values in certificate generation

---

## Security Considerations

### Certificate Revocation
- Instructors can revoke certificates if needed
- Revoked certificates show as invalid
- Verification logs maintained for audit trail

### Verification Logging
- All verification attempts are logged
- Includes IP address and user agent
- Helps detect fraudulent verification attempts

### Data Privacy
- User email is stored but not displayed publicly
- Only student name and course info shown on verification page
- Verification logs are internal only

---

## Summary

The Certificate System provides:
- ✅ Automatic certificate generation on course completion
- ✅ Unique verification codes and IDs
- ✅ Public verification system
- ✅ Beautiful certificate design
- ✅ Integration with user library
- ✅ Sharing capabilities
- ✅ Verification logging and analytics

Students are motivated to complete courses to earn certificates, which they can share on social media and add to their professional profiles. The verification system ensures authenticity and builds trust in PPR Academy certifications.
