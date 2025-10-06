# PPR Academy - Design Decisions & Preferences

> This document tracks all design decisions, UI preferences, and implementation guidelines for the PPR Academy platform.

## 🎨 UI/UX Preferences

### Colors & Theming
- **Toast Notifications**: Always use `bg-white dark:bg-black` for consistent backgrounds
- **Dropdown Menus**: Always use `bg-white dark:bg-black` for consistent backgrounds
- **Primary Color**: Purple/Pink gradients (e.g., `from-purple-600 to-pink-600`)
- **Dark Mode**: Full support required - test all components in both light and dark modes

### Typography
- (Add your preferences here)

### Component Styling
- (Add your component preferences here)

---

## 🏗️ Architecture Decisions

### Data Model
- **Course `userId` field**: Stores Clerk ID (not Convex user `_id`)
- **Store `userId` field**: Stores Clerk ID (not Convex user `_id`)
- **Published vs Draft**: Only published content should show on public storefronts

### Query Patterns
- Use `convexUser.clerkId` when querying courses by user
- Use `convexUser._id` when querying digital products by user
- Public storefronts should use `getPublishedProductsByStore` and `getPublishedCoursesByStore`
- Dashboard should use `getProductsByStore` and `getCoursesByStore` (shows all)

---

## 📝 Course Creation Workflow

### Required Fields
- **Course Info**: Title, Description, Category, Skill Level (all marked with red asterisk)
- **Checkout**: Price, Checkout Headline (all marked with red asterisk)
- **Validation**: Show specific error messages, not generic ones

### Preview Mode
- Unpublished courses accessible to owner with `?preview=true` parameter
- Preview banner should show: "Preview Mode - This course is not published yet"

---

## 🔧 Technical Preferences

### Form Validation
- Always show visual feedback for required fields (red border when touched and empty)
- Display inline error messages below fields
- Show validation alerts at top of forms summarizing all issues

### Error Handling
- Always show specific error messages in toasts
- Never show generic "Failed" messages without details

### Authentication
- Use Clerk for auth
- Always sync users to Convex via webhooks

---

## 🚀 Features & Functionality

### Course Landing Pages
- Support preview mode for owners
- Only show published courses to public
- Generate slug from course title on creation

### Products Listing
- Show "Preview Landing Page" for unpublished courses
- Show "View Live" for published courses
- Copy link should work for both published and unpublished

### User Library Page
- Fetch real user data from Convex (no mock data)
- Show user's enrolled courses with progress
- Display stats: courses enrolled, completed, hours learned, current streak, certificates
- Show recent activity feed (completed lessons, started courses)
- Empty states for no enrolled courses or no activity
- Loading states with skeletons during data fetch

### Course Card Navigation
- Enrolled courses (`isEnrolled: true`) link to `/library/courses/{slug}` (course player)
- Non-enrolled courses link to `/courses/{slug}` (public sales page)
- Button text: "Continue Learning" for enrolled, "View Course" or "Learn More" for non-enrolled

---

## 📋 Common Fixes & Patterns

### Issue: Products not showing on storefront
**Solution**: Check if `storeId` is correct and matches the user's current store

### Issue: Edit course not loading data
**Solution**: Ensure queries use `convexUser.clerkId` not `convexUser._id`

### Issue: Preview URL showing 404
**Solution**: Check course has correct `storeId` and `userId`, verify preview mode logic

---

## 🎯 Future Enhancements

(Add features you want to build here)

---

## 📚 Stack Reference

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Convex
- **Styling**: Tailwind CSS, shadcn/ui
- **Auth**: Clerk
- **Payment**: Stripe Connect (planned)

---

**Last Updated**: October 6, 2025
