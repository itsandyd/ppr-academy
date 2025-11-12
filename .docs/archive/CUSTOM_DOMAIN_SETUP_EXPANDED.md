# Custom Domain Setup Guide

## How to Connect Your Custom Domain to Your Storefront

Setting up a custom domain gives your storefront a professional edge, improves your SEO, and builds trust with your audience. This guide walks you through connecting "ytuni.com" to your store—a domain whose DNS is already configured for a seamless setup.

---

## Step-by-Step Process

### **Step 1: Navigate to Store Settings**

To begin, you'll need to access your custom domain settings within your dashboard.

1. **Log in to your dashboard** at academy.pauseplayrepeat.com
2. **Click on "Settings"** in the main navigation menu
3. **Select "Custom Domain"** from the settings options

This will open the Custom Domain configuration page where you can manage your storefront's web address.

---

### **Step 2: Enter Your Domain**

Once you're on the Custom Domain page, it's time to input your domain name.

1. **Locate the domain input field** on the page
2. **Type "ytuni.com"** exactly as shown
   - ⚠️ **Important:** Do not include "http://", "https://", or "www"
   - ✅ **Correct:** `ytuni.com`
   - ❌ **Incorrect:** `www.ytuni.com` or `https://ytuni.com`
3. **Click the "Connect" or "Verify" button** to proceed

The system will now begin verifying your domain's DNS configuration.

---

### **Step 3: Automatic Domain Verification**

Behind the scenes, the platform automatically checks your domain's DNS settings to ensure everything is configured correctly.

**What happens during verification:**
- The system checks for proper DNS records (A records, CNAME records, etc.)
- It verifies that the domain points to the correct servers
- It confirms SSL/TLS certificate availability for secure HTTPS connections

**In your case:** Because "ytuni.com" is already configured with the correct DNS settings, the verification process completes immediately. No waiting, no manual configuration—just instant connection.

---

### **Step 4: Domain Connection Confirmed**

Once verification succeeds, you'll see immediate confirmation that your custom domain is active.

**What you'll see on screen:**
- ✅ **Active Domain Status:** "ytuni.com" will be displayed as your storefront's active custom domain
- 🎯 **Benefits Highlighted:** The page will show key advantages of using a custom domain:
  - **Professional Branding:** Your own domain reinforces your brand identity
  - **Improved SEO:** Custom domains rank better in search engines
  - **Increased Trust:** Customers trust branded domains over generic subdomains
  - **Full Control:** You own and control your web presence
- 🎉 **Success Message:** A confirmation banner appears stating:
  
  > **Task Succeeded:** Domain ytuni.com connected successfully and verified as active.

---

## What Happens Next?

### Your Store Is Now Live on Your Custom Domain

Congratulations! Your storefront is now fully accessible via **ytuni.com**. Here's what this means:

#### **1. Branded URL**
- Old URL: `academy.pauseplayrepeat.com/store/your-store-name`
- New URL: `ytuni.com`

Your customers can now visit your store using your clean, memorable custom domain.

#### **2. Automatic HTTPS**
Your custom domain is automatically secured with an SSL certificate, meaning all traffic uses encrypted HTTPS connections. This protects your customers' data and improves search rankings.

#### **3. Email & Marketing Ready**
You can now use your custom domain in:
- Email marketing campaigns
- Social media bios
- Business cards and promotional materials
- YouTube video descriptions
- Podcast show notes

#### **4. SEO Benefits Active**
Search engines like Google now see your content under your own domain, building domain authority and improving your search rankings over time.

---

## Testing Your Custom Domain

Before sharing your new URL, verify everything works correctly:

1. **Open a new browser tab** (or use incognito/private mode)
2. **Navigate to `https://ytuni.com`**
3. **Confirm your storefront loads** with all products, images, and content intact
4. **Test key functionality:**
   - Product pages load correctly
   - Checkout process works
   - Images and media display properly
   - Navigation menus function
   - Mobile responsiveness

---

## Troubleshooting (If Needed)

While your domain connected successfully, here's what to check if you encounter issues in the future:

### **Domain Isn't Loading**
- Clear your browser cache and cookies
- Try accessing from a different device or network
- Wait 5-10 minutes for DNS propagation (though usually instant)

### **SSL Certificate Warnings**
- If you see "Not Secure" warnings, wait up to 24 hours for SSL provisioning
- Contact support if the issue persists beyond 24 hours

### **Old Domain Still Showing**
- Clear browser cache
- DNS changes can take up to 48 hours to propagate globally
- Use a DNS checker tool to verify propagation status

---

## Managing Your Custom Domain

### **Viewing Domain Status**
You can always check your custom domain status by returning to:
**Dashboard → Settings → Custom Domain**

This page will show:
- Current active domain
- Connection status (Active, Pending, Disconnected)
- SSL certificate status
- Last verified date

### **Updating DNS Records (If Needed)**
If you ever need to update your DNS configuration, you'll need to access your domain registrar (where you purchased ytuni.com):

**Required DNS Records:**
- **A Record:** Points to the platform's IP address
- **CNAME Record:** May be used for www subdomain
- **TXT Record:** Used for domain verification

*Note: Since your DNS is already configured, you shouldn't need to change anything.*

### **Disconnecting Your Domain**
If you ever need to disconnect your custom domain:
1. Go to **Settings → Custom Domain**
2. Click **"Disconnect Domain"**
3. Confirm the action
4. Your store will revert to the default subdomain

---

## Best Practices for Custom Domains

### **1. Use a Short, Memorable Domain**
✅ `ytuni.com` is perfect—short, easy to spell, easy to remember

### **2. Avoid Special Characters**
Stick to letters, numbers, and hyphens only. Avoid underscores and special characters.

### **3. Consider Multiple Extensions**
If your primary domain is `.com`, consider purchasing `.net`, `.io`, or country-specific extensions to protect your brand.

### **4. Update All Marketing Materials**
Once your custom domain is live, update:
- Social media profiles (Instagram, Twitter, YouTube, TikTok)
- Email signatures
- Business cards
- Link-in-bio tools (Linktree, Beacons, etc.)
- Advertising campaigns
- Affiliate links

### **5. Set Up Analytics**
Connect Google Analytics or your preferred analytics tool to track traffic to your custom domain.

---

## Benefits of Using a Custom Domain

### **Professional Credibility**
A custom domain signals that you're serious about your business. It's the difference between:
- `academy.pauseplayrepeat.com/store/beatmaker123` ❌
- `ytuni.com` ✅

### **Brand Recognition**
Every time someone visits your site, they see YOUR brand, not a generic platform URL. This builds brand equity over time.

### **Marketing Flexibility**
Custom domains are easier to:
- Print on merchandise
- Share verbally ("Visit ytuni.com")
- Include in video intros and outros
- Feature in podcast ads

### **Search Engine Optimization (SEO)**
Search engines favor custom domains over subdomains. Benefits include:
- **Higher Rankings:** Custom domains rank better in search results
- **Domain Authority:** You build authority on YOUR domain, not someone else's
- **Rich Snippets:** Eligibility for enhanced search result features
- **Backlinks:** Inbound links point to your domain, increasing its value

### **Data Ownership**
With a custom domain, you control:
- Analytics and traffic data
- Email addresses (e.g., info@ytuni.com)
- Redirects and URL structure
- Subdomains (e.g., shop.ytuni.com, blog.ytuni.com)

### **Customer Trust**
Customers are more likely to:
- Complete purchases on branded domains
- Return to a memorable URL
- Share your link with others
- Trust your business with their payment information

---

## Technical Details (For Advanced Users)

### **DNS Configuration**
Your custom domain uses the following DNS setup:

```
Type    Name    Value                           TTL
A       @       [Platform IP Address]           300
CNAME   www     [Platform Domain]               300
TXT     @       [Verification Token]            300
```

### **SSL/TLS Certificates**
The platform automatically provisions and renews SSL certificates using Let's Encrypt or similar certificate authorities. This ensures:
- HTTPS encryption (green padlock in browser)
- Automatic renewal every 90 days
- No manual intervention required

### **CDN & Performance**
Your custom domain benefits from:
- Global CDN (Content Delivery Network) for fast page loads
- Automatic image optimization
- Caching for improved performance
- DDoS protection

---

## Frequently Asked Questions

### **Can I use a subdomain?**
Yes! You can connect subdomains like `shop.ytuni.com` or `store.ytuni.com` in addition to your root domain.

### **What if my DNS isn't configured yet?**
The platform provides detailed DNS configuration instructions if your domain isn't ready. You'll need to add specific DNS records through your domain registrar.

### **Can I change my custom domain later?**
Yes, you can disconnect one domain and connect a different one at any time through the Custom Domain settings.

### **Does this affect my existing content?**
No. All your products, courses, and content remain exactly the same—only the URL changes.

### **What happens to the old URL?**
Your old subdomain URL (e.g., `academy.pauseplayrepeat.com/store/your-store`) will automatically redirect to your custom domain.

### **How long does DNS propagation take?**
In your case, since DNS is already configured, the connection is instant. Typically, DNS changes can take 24-48 hours to propagate globally.

### **Can I use an existing domain I already own?**
Absolutely! You can connect any domain you own by updating its DNS records to point to the platform.

---

## Next Steps

Now that your custom domain is connected, consider these next steps to maximize its impact:

### **1. Update Your Socials**
- Instagram bio
- Twitter/X profile
- YouTube channel description
- TikTok bio
- LinkedIn profile

### **2. Set Up Email Forwarding**
Configure email addresses like:
- info@ytuni.com
- support@ytuni.com
- sales@ytuni.com

### **3. Create a Redirect Strategy**
If you have old links floating around, set up redirects to ensure visitors land on your custom domain.

### **4. Monitor Traffic**
Install Google Analytics or another tracking tool to monitor:
- Visitor counts
- Traffic sources
- Conversion rates
- Popular pages

### **5. Share the News**
Announce your custom domain to your audience:
- Social media posts
- Email newsletter
- YouTube community tab
- Discord/community channels

---

## Support & Resources

### **Need Help?**
If you encounter any issues with your custom domain:
- **Documentation:** Visit the help center for detailed guides
- **Support Team:** Contact support@academy.pauseplayrepeat.com
- **Community:** Join the Discord community for peer support
- **Video Tutorials:** Check YouTube for step-by-step video guides

### **Recommended Domain Registrars**
If you need to purchase a domain:
- **Namecheap:** Affordable, user-friendly
- **Google Domains:** Clean interface, integrated with Google services
- **Cloudflare:** Advanced DNS features
- **GoDaddy:** Popular, extensive support

---

## Summary

You've successfully connected **ytuni.com** as your custom domain. Your storefront is now:

✅ **Live and accessible** at ytuni.com  
✅ **Secured with HTTPS** encryption  
✅ **Optimized for SEO** and search rankings  
✅ **Ready for marketing** across all channels  
✅ **Professionally branded** with your domain  

**Confirmation Status:**
> Task Succeeded: Domain ytuni.com connected successfully and verified as active.

Your custom domain is fully operational and ready to impress your customers. Welcome to your new, professional online presence! 🎉

---

*Last Updated: October 30, 2025*  
*Platform: Pause Play Repeat Academy*  
*Domain Status: Active ✅*

