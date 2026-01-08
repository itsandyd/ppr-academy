"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Award, Download, Share2, CheckCircle2, Calendar, ExternalLink, Twitter, Linkedin, Facebook, Link2, Copy } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

interface CertificateCardProps {
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

export function CertificateCard({ certificate, onDownload }: CertificateCardProps) {
  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/${certificate.certificateId}`
    : `/verify/${certificate.certificateId}`;

  const shareText = `I just completed "${certificate.courseTitle}" on PPR Academy! 🎓🎵 #MusicProduction #Learning`;
  const linkedInShareText = `I'm excited to share that I've completed "${certificate.courseTitle}" on PPR Academy!\n\nThis course helped me level up my music production skills. Check out my verified certificate:`;

  const handleShareLinkedIn = () => {
    // LinkedIn share with pre-filled text
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;
    window.open(url, '_blank', 'width=600,height=600');
    toast.success("Opening LinkedIn...");
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(verifyUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
    toast.success("Opening Twitter...");
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(verifyUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=550,height=420');
    toast.success("Opening Facebook...");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    toast.success("Certificate link copied to clipboard!");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate - ${certificate.courseTitle}`,
          text: `I completed ${certificate.courseTitle} on PPR Academy!`,
          url: verifyUrl,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(certificate.verificationCode);
    toast.success("Verification code copied!");
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight mb-1">
                {certificate.courseTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                by {certificate.instructorName}
              </p>
            </div>
          </div>
          {certificate.isValid && (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Valid
            </Badge>
          )}
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Completed
            </span>
            <span className="font-medium">
              {format(new Date(certificate.completionDate), "MMM d, yyyy")}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-bold text-primary">{certificate.completionPercentage}%</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Verification Code</span>
            <button
              onClick={handleCopyCode}
              className="font-mono font-bold hover:text-primary transition-colors"
            >
              {certificate.verificationCode}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          {certificate.pdfUrl && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onDownload}
              asChild
            >
              <a href={certificate.pdfUrl} download>
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              <DropdownMenuItem onClick={handleShareLinkedIn} className="cursor-pointer">
                <Linkedin className="w-4 h-4 mr-2 text-[#0077B5]" />
                Share on LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareTwitter} className="cursor-pointer">
                <Twitter className="w-4 h-4 mr-2 text-[#1DA1F2]" />
                Share on Twitter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareFacebook} className="cursor-pointer">
                <Facebook className="w-4 h-4 mr-2 text-[#1877F2]" />
                Share on Facebook
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
                <Share2 className="w-4 h-4 mr-2" />
                More Options...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            className="flex-1"
            asChild
          >
            <Link href={`/verify/${certificate.certificateId}`} target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              Verify
            </Link>
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Certificate ID: <code className="bg-muted px-1 rounded">{certificate.certificateId}</code>
        </p>
      </CardContent>
    </Card>
  );
}
