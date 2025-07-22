"use client";

import { Card } from "@/components/ui/card";
import { Phone, Video, Calendar } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export function CoachingCallPhonePreview() {
  const params = useParams();
  const storeId = params.storeId as string;

  return (
    <div className="w-[356px] h-[678px] bg-black rounded-[28px] p-2 shadow-2xl">
      <div className="w-full h-full bg-white rounded-[20px] overflow-hidden">
        {/* Status bar */}
        <div className="h-6 bg-black rounded-t-[20px] flex items-center justify-center">
          <div className="w-20 h-1 bg-white rounded-full"></div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Book a Call</h3>
            <p className="text-sm text-gray-500 mt-1">Choose your coaching session</p>
          </div>
          
          {/* Call Card */}
          <Card className="p-4 border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-blue-100 rounded-lg flex items-center justify-center">
                <Video size={20} className="text-teal-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">1:1 Call with Me</h4>
                <p className="text-sm text-gray-600">60 min session</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-teal-600">$99</span>
              </div>
            </div>
          </Card>
          
          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Video size={16} className="text-gray-400" />
              <span className="text-gray-600">Video call included</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-600">Flexible scheduling</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-gray-400" />
              <span className="text-gray-600">Follow-up support</span>
            </div>
          </div>
          
          {/* CTA Button */}
                      <Link href={`/store/${storeId}/page/create`}>
            <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
              Book Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
} 