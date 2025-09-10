import {
  Mail,
  Music,
  Calendar,
  Package,
  GraduationCap,
  Repeat,
  Tv,
  Users,
  Link,
  DollarSign,
  Layers,
  Waves,
  Headphones,
  Mic,
  Radio,
  FileAudio,
  Zap,
  type LucideIcon
} from "lucide-react";

export interface MusicProductOption {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string; // CSS gradient class
  iconColor: string; // Icon color class
  isPopular?: boolean;
  isNew?: boolean;
  category: 'music' | 'content' | 'services' | 'community';
}

export const musicOptions: MusicProductOption[] = [
  // Music Products (Primary)
  {
    id: "sample-pack",
    title: "Sample Pack",
    subtitle: "Sell drum kits, loops, one-shots, and stems for producers",
    icon: Music,
    gradient: "from-purple-500 to-pink-500",
    iconColor: "text-white",
    isPopular: true,
    category: 'music'
  },
  {
    id: "preset-pack",
    title: "Preset Pack",
    subtitle: "Synth presets, effect chains, and plugin settings",
    icon: Waves,
    gradient: "from-blue-500 to-cyan-500",
    iconColor: "text-white",
    isPopular: true,
    category: 'music'
  },
  {
    id: "beat-lease",
    title: "Beat Lease",
    subtitle: "License your beats for exclusive or non-exclusive use",
    icon: Radio,
    gradient: "from-orange-500 to-red-500",
    iconColor: "text-white",
    category: 'music'
  },
  {
    id: "project-files",
    title: "Project Files",
    subtitle: "Full DAW project files (Logic, Ableton, FL Studio, etc.)",
    icon: FileAudio,
    gradient: "from-green-500 to-emerald-500",
    iconColor: "text-white",
    category: 'music'
  },

  // Educational Content
  {
    id: "ecourse",
    title: "Music Course",
    subtitle: "Teach production, mixing, theory, or music business",
    icon: GraduationCap,
    gradient: "from-indigo-500 to-purple-500",
    iconColor: "text-white",
    category: 'content'
  },
  {
    id: "digital",
    title: "Music Guide",
    subtitle: "PDFs, chord progressions, mixing templates, cheat sheets",
    icon: Package,
    gradient: "from-slate-600 to-slate-800",
    iconColor: "text-white",
    category: 'content'
  },

  // Services
  {
    id: "coaching",
    title: "Music Coaching",
    subtitle: "1-on-1 production lessons, mixing feedback, career guidance",
    icon: Headphones,
    gradient: "from-amber-500 to-orange-500",
    iconColor: "text-white",
    category: 'services'
  },
  {
    id: "mixing-service",
    title: "Mixing/Mastering",
    subtitle: "Professional mixing and mastering services",
    icon: Mic,
    gradient: "from-rose-500 to-pink-500",
    iconColor: "text-white",
    isNew: true,
    category: 'services'
  },

  // Community & Engagement
  {
    id: "emails",
    title: "Lead Magnet",
    subtitle: "Free sample pack or guide to build your email list",
    icon: Mail,
    gradient: "from-teal-500 to-cyan-500",
    iconColor: "text-white",
    category: 'community'
  },
  {
    id: "membership",
    title: "Producer Community",
    subtitle: "Monthly sample packs, exclusive content, Discord access",
    icon: Users,
    gradient: "from-violet-500 to-purple-500",
    iconColor: "text-white",
    category: 'community'
  },
  {
    id: "webinar",
    title: "Live Workshop",
    subtitle: "Host live production sessions, beat battles, Q&As",
    icon: Tv,
    gradient: "from-cyan-500 to-blue-500",
    iconColor: "text-white",
    category: 'community'
  },

  // Bundles & Special
  {
    id: "bundle",
    title: "Producer Bundle",
    subtitle: "Combine sample packs, presets, and courses at a discount",
    icon: Layers,
    gradient: "from-emerald-500 to-green-500",
    iconColor: "text-white",
    category: 'music'
  },
  {
    id: "url",
    title: "Music Links",
    subtitle: "Link to Spotify, YouTube, SoundCloud, or streaming platforms",
    icon: Link,
    gradient: "from-gray-600 to-gray-800",
    iconColor: "text-white",
    category: 'content'
  },
  {
    id: "affiliate",
    title: "Affiliate Program",
    subtitle: "Earn 20% monthly from PausePlayRepeat referrals",
    icon: DollarSign,
    gradient: "from-green-600 to-emerald-600",
    iconColor: "text-white",
    category: 'services'
  }
];

// Group options by category for better organization
export const groupedOptions = {
  music: musicOptions.filter(opt => opt.category === 'music'),
  content: musicOptions.filter(opt => opt.category === 'content'),
  services: musicOptions.filter(opt => opt.category === 'services'),
  community: musicOptions.filter(opt => opt.category === 'community'),
};

// Get popular options for featured section
export const popularOptions = musicOptions.filter(opt => opt.isPopular);
export const newOptions = musicOptions.filter(opt => opt.isNew);
