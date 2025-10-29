# Customers vs Fans - System Architecture

## 🎯 Overview

Your app now has TWO complementary systems for managing people:

### 1. **Customers** (`/store/[storeId]/customers`) 
**Purpose:** Track transactions and revenue
- Who bought what
- How much they spent
- Course enrollments
- Purchase history
- Revenue metrics

**Data Focus:**
- Transactional (purchases, enrollments)
- Revenue tracking
- Product/course relationships

**Use Cases:**
- "Who bought my course?"
- "How much revenue did I make?"
- "Which customers are subscribed?"

---

### 2. **Fans** (`/store/[storeId]/contacts`)
**Purpose:** Email marketing & audience engagement
- Email list management
- Engagement scoring
- Tag-based segmentation
- Producer profiles (DAW, genre, goals)
- Activity tracking (opens, clicks, replies)

**Data Focus:**
- Marketing (engagement, tags, scores)
- Producer profiles
- Email behavior

**Use Cases:**
- "Send email to all FL Studio users"
- "Who are my most engaged fans?"
- "Tag all beginners for email series"
- "Find fans interested in trap music"

---

## 🔄 Auto-Sync System

**When someone makes a purchase:**
1. They get added to **Customers** (transaction record)
2. They automatically get added to **Fans** (marketing database)
3. Their engagement score increases based on purchase amount
4. They get auto-tagged as "customer"

**Implementation:**
- `convex/customerFanSync.ts` - Sync functions
- `syncCustomerToFans` - Called when customer created
- Adds purchase points to fan score
- Logs purchase activity

---

## 📊 Key Differences

| Feature | Customers | Fans |
|---------|-----------|------|
| **Primary Focus** | Revenue & Sales | Email & Engagement |
| **Data** | Purchases, Enrollments | Tags, Scores, Profiles |
| **Use Case** | "Who paid me?" | "Who should I email?" |
| **Metrics** | Revenue, AOV | Open rates, Engagement |
| **Navigation** | `/customers` | `/contacts` (labeled "Fans") |

---

## 🚀 Navigation

### In Email Campaigns Page:
- **Campaigns** - Send emails
- **Automations** - Email workflows
- **Fans** - Manage audience (→ `/contacts`)

### Separate Section:
- **Customers** - Track revenue & purchases

---

## 💡 Best Practices

### When to use Customers:
- ✅ Analyzing sales data
- ✅ Checking who bought what
- ✅ Revenue reporting
- ✅ Refunds/support issues

### When to use Fans:
- ✅ Sending email campaigns
- ✅ Segmenting by interest/behavior
- ✅ Building automations
- ✅ Tracking engagement
- ✅ Tagging audiences

---

## 🔗 How They Connect

1. **Customer makes purchase**
   ```
   Purchase → Create Customer Record → Auto-sync to Fans
   ```

2. **Fan in database**
   ```
   Email address links Customer <-> Fan
   ```

3. **Shared data:**
   - Email (primary key)
   - Name
   - Purchase history (from Customers → Updates Fan score)

---

## 📝 Example Workflows

### Scenario 1: New Course Purchase
```
1. Someone buys "Mixing Masterclass" for $99
2. Customer record created: 
   - Name, email, enrolled course
   - Total spent: $99
3. Fan record auto-synced:
   - Added to fans with email
   - Score increased by 9 points ($99 / 10)
   - Tagged as "customer"
   - Activity logged: "Purchased: Mixing Masterclass"
```

### Scenario 2: Email Campaign
```
1. You want to email all Ableton users
2. Go to Fans (/contacts)
3. Filter by tag: "ableton"
4. Create campaign targeting these fans
5. Track who opens (updates lastOpenDate, adds points)
```

### Scenario 3: Finding High-Value Customers
```
1. Go to Customers (/customers)
2. Sort by "Total Spent"
3. See who spent the most
4. Cross-reference in Fans to check engagement score
```

---

## 🎨 UI Labels

To make it creator-friendly:
- ❌ Don't say: "Contacts" or "Email List"
- ✅ Do say: "Fans" 

**Why?** Music producers have "fans", not "contacts". It's warmer and more authentic.

---

## 🔮 Future Enhancements

1. **Unified View**
   - Show fan engagement score in customer list
   - Show purchase history in fan profile

2. **Smart Segments**
   - "High-value customers with low engagement"
   - "Engaged fans who haven't purchased yet"

3. **Predictive Tags**
   - Auto-tag based on behavior
   - "likely-to-purchase", "at-risk-churn"

---

## ✅ You Now Have

- 🎯 **Customers** - Transaction & revenue tracking
- 💌 **Fans** - Email marketing & engagement
- 🔄 **Auto-sync** - Purchases update both systems
- 📊 **Separate but connected** - Best of both worlds!

---

## 🚀 Next Steps

1. Customers continue to use `/store/[storeId]/customers`
2. Fans use `/store/[storeId]/contacts` (labeled "Fans")
3. Purchases automatically sync to fans
4. Use fans for email campaigns
5. Use customers for revenue analysis

