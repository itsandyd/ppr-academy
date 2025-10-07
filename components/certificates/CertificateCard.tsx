"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Share2, CheckCircle2, Calendar, ExternalLink } from "lucide-react";
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
  const handleShare = () => {
    const verifyUrl = `${window.location.origin}/verify/${certificate.certificateId}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Certificate - ${certificate.courseTitle}`,
        text: `I completed ${certificate.courseTitle} on PPR Academy!`,
        url: verifyUrl,
      });
    } else {
      navigator.clipboard.writeText(verifyUrl);
      toast.success("Verification link copied to clipboard!");
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
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>

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
