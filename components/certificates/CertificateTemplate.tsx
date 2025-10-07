"use client";

import { format } from "date-fns";
import { Award, CheckCircle2 } from "lucide-react";

interface CertificateTemplateProps {
  userName: string;
  courseTitle: string;
  instructorName: string;
  completionDate: number;
  certificateId: string;
  verificationCode: string;
  completionPercentage: number;
}

export function CertificateTemplate({
  userName,
  courseTitle,
  instructorName,
  completionDate,
  certificateId,
  verificationCode,
  completionPercentage,
}: CertificateTemplateProps) {
  return (
    <div 
      id="certificate-template"
      className="w-[1056px] h-[816px] bg-white relative overflow-hidden"
      style={{
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* Decorative Border */}
      <div className="absolute inset-0 border-[20px] border-double border-amber-700/30" />
      <div className="absolute inset-[30px] border-[2px] border-amber-700/20" />

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10">
          <Award className="w-32 h-32 text-amber-700" />
        </div>
        <div className="absolute bottom-10 right-10">
          <Award className="w-32 h-32 text-amber-700" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
              <Award className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-amber-900 mb-2">
            Certificate of Completion
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-700 to-transparent mx-auto" />
        </div>

        {/* Body */}
        <div className="text-center space-y-6 max-w-3xl">
          <p className="text-xl text-gray-700">This is to certify that</p>
          
          <h2 className="text-5xl font-bold text-gray-900 border-b-2 border-amber-700/30 pb-4">
            {userName}
          </h2>

          <p className="text-xl text-gray-700">has successfully completed</p>

          <h3 className="text-3xl font-semibold text-amber-900 px-8">
            {courseTitle}
          </h3>

          <div className="flex items-center justify-center gap-2 text-lg text-gray-700">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span>{completionPercentage}% Course Completion</span>
          </div>

          <p className="text-lg text-gray-600">
            Instructed by <span className="font-semibold text-gray-900">{instructorName}</span>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 w-full max-w-3xl">
          <div className="flex items-end justify-between">
            {/* Date */}
            <div className="text-center">
              <div className="w-48 border-t-2 border-gray-900 mb-2" />
              <p className="text-sm text-gray-600">Date of Completion</p>
              <p className="text-base font-semibold text-gray-900">
                {format(new Date(completionDate), "MMMM d, yyyy")}
              </p>
            </div>

            {/* PPR Academy Logo/Seal */}
            <div className="text-center">
              <div className="w-24 h-24 rounded-full border-4 border-amber-700 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center mb-2">
                <div className="text-center">
                  <p className="text-xs font-bold text-amber-900">PPR</p>
                  <p className="text-[10px] text-amber-800">ACADEMY</p>
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="text-center">
              <div className="w-48 border-t-2 border-gray-900 mb-2" />
              <p className="text-sm text-gray-600">Instructor</p>
              <p className="text-base font-semibold text-gray-900">{instructorName}</p>
            </div>
          </div>
        </div>

        {/* Verification Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 mb-1">
            Verify this certificate at: <span className="font-mono">{window.location.origin}/verify</span>
          </p>
          <p className="text-xs text-gray-500">
            Verification Code: <span className="font-mono font-bold text-gray-700">{verificationCode}</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            Certificate ID: {certificateId}
          </p>
        </div>
      </div>
    </div>
  );
}
