# Hybrid User Guide (Student + Creator)

## 🎯 What is a Hybrid User?

A **hybrid user** is someone who is BOTH:
- ✅ **Student** - Enrolled in courses from other creators
- ✅ **Creator** - Has their own store and sells content

This is the most common scenario on the platform!

---

## 🔄 Smart Dashboard Redirect Logic

When a hybrid user clicks "Go to Dashboard" or visits `/dashboard`, the system uses this logic:

```
1. Check if user has a store AND enrolled courses
   ↓
2. Check if they manually specified a preference (?view=creator or ?view=student)
   ↓
3. Check localStorage for saved preference
   ↓
4. Default to CREATOR dashboard (/home)
   - Business comes first
   - Easy to switch to /library via nav
```

### Priority Order
1. **URL Parameter** (`?view=creator` or `?view=student`) - Highest priority
2. **Saved Preference** (localStorage) - Medium priority
3. **Default Behavior** (Creator dashboard) - Fallback

---

## 🎛️ Dashboard Preference Switcher

Hybrid users see a **preference switcher** in their navigation that allows them to:

### 1. See Current Mode
- "Creator Mode" badge when on `/home` or `/store`
- "Student Mode" badge when on `/library`

### 2. Quick Switch
Click the dropdown to instantly switch between:
- **Student Library** - View enrolled courses & progress
- **Creator Dashboard** - Manage store & analytics

### 3. Set Default
Choose which dashboard to see by default:
- "Always Student" - Default to `/library`
- "Always Creator" - Default to `/home`

---

## 📱 Usage Examples

### Example 1: New Hybrid User
```
1. User signs up as student
2. Enrolls in 3 courses
3. Later decides to become a creator
4. Creates store
5. Now clicks "Go to Dashboard"
   ↓
   Defaults to /home (creator dashboard)
   ↓
   Can see switcher: "Creator Mode ▼"
   ↓
   Clicks dropdown → switches to "Student Library"
```

### Example 2: Saved Preference
```
1. Hybrid user sets default to "Student"
2. Closes browser
3. Returns next day
4. Clicks "Go to Dashboard"
   ↓
   Redirects to /library (saved preference)
   ↓
   Can still switch to creator mode anytime
```

### Example 3: URL Override
```
1. Hybrid user receives email: "Check your sales!"
2. Email link: https://app.com/dashboard?view=creator
3. Clicks link
   ↓
   Goes directly to /home (creator dashboard)
   ↓
   Overrides any saved preference
```

---

## 🎨 User Interface

### Navigation for Hybrid Users
```
┌─────────────────────────────────────────────────────┐
│  [Browse]  [Dashboard ▼]  [Library]  [Profile]     │
│            Creator Mode                              │
│            ↓ Student Library                        │
│            ↓ Set Default                            │
└─────────────────────────────────────────────────────┘
```

The switcher appears:
- ✅ In header navigation
- ✅ On `/home` page (creator dashboard)
- ✅ On `/library` page (student dashboard)
- ✅ On `/store` page (store management)

### Switcher Dropdown Content
```
┌─────────────────────────────────────────┐
│ Switch Dashboard          [Hybrid]      │
├─────────────────────────────────────────┤
│ 📚 Student Library            ✓         │
│    View enrolled courses & progress     │
│                                         │
│ 🏪 Creator Dashboard                    │
│    Manage store & view analytics        │
├─────────────────────────────────────────┤
│ Set as default:                         │
│ 📚 Always Student              ✓        │
│ 🏪 Always Creator                       │
└─────────────────────────────────────────┘
```

---

## 💾 LocalStorage Preference

The preference is saved in the browser's localStorage:

```typescript
// Key
'dashboard-preference'

// Values
'student'  // Always go to /library
'creator'  // Always go to /home
null       // No preference (use default)
```

### How to Reset Preference
Users can reset their preference by:
1. Opening browser console
2. Running: `localStorage.removeItem('dashboard-preference')`
3. Or by simply clicking a different "Set as default" option

---

## 🔧 Implementation Details

### Dashboard Redirect (`/dashboard`)
```typescript
// Checks in order:
1. URL param: ?view=creator or ?view=student
2. localStorage: dashboard-preference
3. Default: /home (if has store and enrollments)
```

### Preference Switcher Component
**Location:** `components/dashboard/dashboard-preference-switcher.tsx`

**Shows when:**
- User has a store AND enrolled courses
- User is authenticated

**Hides when:**
- User is student only
- User is creator only
- User is not signed in

---

## 📊 User Type Matrix

| Has Store | Has Enrollments | User Type | Default Redirect | Show Switcher |
|-----------|----------------|-----------|-----------------|---------------|
| ❌ | ❌ | New User | `/library` | ❌ |
| ❌ | ✅ | Student Only | `/library` | ❌ |
| ✅ | ❌ | Creator Only | `/home` | ❌ |
| ✅ | ✅ | **Hybrid** | `/home` | ✅ |

---

## 🎯 Design Decisions

### Why Default to Creator Dashboard?
1. **Business First** - Most users care about revenue/analytics first
2. **Library Always Accessible** - One click away via nav
3. **Creator Intent** - Creating a store shows strong creator intent
4. **Flexibility** - Can override with preference or URL param

### Why Check Enrollments?
- Having a store doesn't mean you're not learning
- Many creators take courses from other creators
- Important to acknowledge both roles

### Why Use LocalStorage?
- **Fast** - No database query needed
- **Private** - Preference stays on device
- **Simple** - Easy to implement and reset
- **Stateless** - Works without server

---

## 🚀 Adding the Switcher to Navigation

To show the preference switcher in your navigation, import and use it:

```typescript
// Example: components/navbar.tsx
import { DashboardPreferenceSwitcher } from '@/components/dashboard/dashboard-preference-switcher';

export function Navbar() {
  return (
    <nav>
      <Link href="/">Browse</Link>
      <Link href="/dashboard">Dashboard</Link>
      
      {/* Shows only for hybrid users */}
      <DashboardPreferenceSwitcher />
      
      <UserButton />
    </nav>
  );
}
```

---

## 🐛 Troubleshooting

### Issue: Switcher doesn't appear
**Check:**
- User is signed in
- User has a store (check `/store` or Convex database)
- User has enrolled courses (check `/library` or `purchases` table)
- Component is imported and rendered in nav

### Issue: Preference not saving
**Check:**
- Browser localStorage is enabled
- No errors in console
- localStorage key is `'dashboard-preference'`
- Value is exactly `'student'` or `'creator'`

### Issue: Always redirects to wrong dashboard
**Solution:**
- Clear localStorage: `localStorage.removeItem('dashboard-preference')`
- Check URL parameters (remove `?view=...`)
- Refresh page

---

## 📖 User Education

### Onboarding Messages

**When Student Becomes Creator:**
```
🎉 Welcome to Creator Mode!

You're now both a student and a creator. You can:
- Switch between dashboards anytime using the dropdown
- Set your default preference
- Access your library from any page

[Got it] [Set Default to Creator]
```

**When Creator Enrolls in First Course:**
```
📚 You're now a student too!

Since you're taking courses, you can now:
- Access your Student Library
- Track your learning progress
- Switch between creator and student mode

[Got it] [View My Library]
```

---

## 🎨 Visual Example

```
Landing Page (/)
    ↓
[Go to Dashboard]
    ↓
/dashboard (smart redirect)
    ↓
┌─────────────────────────────────────┐
│ Has Store? → YES                     │
│ Has Enrollments? → YES               │
│ → HYBRID USER                        │
└─────────────────────────────────────┘
    ↓
Check Preference:
├─ URL param → ?view=creator → /home
├─ localStorage → 'student' → /library
└─ Default → /home
    ↓
Show switcher in nav:
[Creator Mode ▼]
    ↓
User clicks dropdown
    ↓
Switches to /library
    ↓
[Student Mode ▼]
```

---

## ✅ Testing Checklist

### Setup Test Accounts
1. Create student-only account (no store)
2. Create creator-only account (has store, no enrollments)
3. Create hybrid account (has store AND enrollments)

### Test Cases
- [ ] Student sees no switcher, goes to `/library`
- [ ] Creator sees no switcher, goes to `/home`
- [ ] Hybrid sees switcher on all dashboard pages
- [ ] Clicking switcher changes mode instantly
- [ ] Setting default saves to localStorage
- [ ] Preference persists after page refresh
- [ ] URL parameter `?view=creator` overrides preference
- [ ] URL parameter `?view=student` overrides preference
- [ ] Clearing localStorage resets to default

---

## 💡 Future Enhancements

### Possible Improvements
1. **Badge Counts**
   - Show unread notifications in switcher
   - "You have 3 new enrollments" in creator mode
   - "2 new lessons available" in student mode

2. **Quick Actions**
   - Add quick links in dropdown
   - "Create New Course" in creator section
   - "Continue Learning" in student section

3. **Usage Analytics**
   - Track which mode users prefer
   - Show usage stats: "You spent 70% time in creator mode"

4. **Auto-Switch Based on Context**
   - Coming from course page → student mode
   - Coming from sales email → creator mode

---

*Hybrid user support complete! Users can seamlessly switch between learning and teaching. 🎓🏪*

