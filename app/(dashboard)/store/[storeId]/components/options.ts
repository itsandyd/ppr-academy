import {
  Mail,
  Box,
  Calendar,
  Package,
  GraduationCap,
  Repeat,
  Tv,
  Users,
  Link,
  DollarSign,
  type LucideIcon
} from "lucide-react";

export interface ProductOption {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tint: string;
}

export const options: ProductOption[] = [
  {
    id: "emails",
    title: "Collect Emails / Applications",
    subtitle: "Collect Your Audience's Info with a Lead Magnet",
    icon: Mail,
    tint: "#FDEDF4"
  },
  {
    id: "digital",
    title: "Digital Product",
    subtitle: "PDFs, Guides, Templates, Exclusive Content, eBooks, etc.",
    icon: Box,
    tint: "#E7F2FF"
  },
  {
    id: "coaching",
    title: "Coaching Call",
    subtitle: "Book Discovery Calls, Paid Coaching",
    icon: Calendar,
    tint: "#E8F6FF"
  },
  {
    id: "custom",
    title: "Custom Product",
    subtitle: '"Ask Me Anything" requests, Audits/Analyses, Video Reviews',
    icon: Package,
    tint: "#FFF9DA"
  },
  {
    id: "ecourse",
    title: "eCourse",
    subtitle: "Create, Host, and Sell your Course within Stan",
    icon: GraduationCap,
    tint: "#E4F3FF"
  },
  {
    id: "membership",
    title: "Recurring Membership",
    subtitle: "Charge Recurring Subscriptions",
    icon: Repeat,
    tint: "#E9F4FF"
  },
  {
    id: "webinar",
    title: "Webinar",
    subtitle: "Host exclusive coaching sessions or online events with multiple customers",
    icon: Tv,
    tint: "#EDF8FF"
  },
  {
    id: "community",
    title: "Community",
    subtitle: "Host a free or paid community",
    icon: Users,
    tint: "#F2ECFF"
  },
  {
    id: "url",
    title: "URL / Media",
    subtitle: "Link to a Website, Affiliate Link, or even Embed Youtube and Spotify content",
    icon: Link,
    tint: "#FFEDEE"
  },
  {
    id: "affiliate",
    title: "Stan Affiliate Link",
    subtitle: "Refer a friend and receive 20% of their Stan Subscription fee each month!",
    icon: DollarSign,
    tint: "#EAF2FF"
  }
]; 