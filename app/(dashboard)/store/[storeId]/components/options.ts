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
  colorClass: string; // CSS class using design system colors
  iconColorClass?: string; // Optional custom icon color
}

export const options: ProductOption[] = [
  {
    id: "emails",
    title: "Collect Emails / Applications",
    subtitle: "Collect Your Audience's Info with a Lead Magnet",
    icon: Mail,
    colorClass: "bg-accent/20 hover:bg-accent/30",
    iconColorClass: "text-primary"
  },
  {
    id: "digital",
    title: "Digital Product",
    subtitle: "PDFs, Guides, Templates, Exclusive Content, eBooks, etc.",
    icon: Box,
    colorClass: "bg-primary/10 hover:bg-primary/15",
    iconColorClass: "text-primary"
  },
  {
    id: "coaching",
    title: "Coaching Call",
    subtitle: "Book Discovery Calls, Paid Coaching",
    icon: Calendar,
    colorClass: "bg-secondary/30 hover:bg-secondary/40",
    iconColorClass: "text-secondary-foreground"
  },
  {
    id: "custom",
    title: "Custom Product",
    subtitle: '"Ask Me Anything" requests, Audits/Analyses, Video Reviews',
    icon: Package,
    colorClass: "bg-muted hover:bg-muted/80",
    iconColorClass: "text-primary"
  },
  {
    id: "ecourse",
    title: "eCourse",
    subtitle: "Create, Host, and Sell your Course within PausePlayRepeat",
    icon: GraduationCap,
    colorClass: "bg-chart-1/10 hover:bg-chart-1/15",
    iconColorClass: "text-chart-1"
  },
  {
    id: "membership",
    title: "Recurring Membership",
    subtitle: "Charge Recurring Subscriptions",
    icon: Repeat,
    colorClass: "bg-chart-2/10 hover:bg-chart-2/15",
    iconColorClass: "text-chart-2"
  },
  {
    id: "webinar",
    title: "Webinar",
    subtitle: "Host exclusive coaching sessions or online events with multiple customers",
    icon: Tv,
    colorClass: "bg-chart-3/10 hover:bg-chart-3/15",
    iconColorClass: "text-chart-3"
  },
  {
    id: "community",
    title: "Community",
    subtitle: "Host a free or paid community",
    icon: Users,
    colorClass: "bg-chart-4/10 hover:bg-chart-4/15",
    iconColorClass: "text-chart-4"
  },
  {
    id: "url",
    title: "URL / Media",
    subtitle: "Link to a Website, Affiliate Link, or even Embed Youtube and Spotify content",
    icon: Link,
    colorClass: "bg-chart-5/10 hover:bg-chart-5/15",
    iconColorClass: "text-chart-5"
  },
  {
    id: "affiliate",
    title: "PausePlayRepeat Affiliate Link",
    subtitle: "Refer a friend and receive 20% of their PausePlayRepeat Subscription fee each month!",
    icon: DollarSign,
    colorClass: "bg-destructive/10 hover:bg-destructive/15",
    iconColorClass: "text-destructive"
  }
]; 