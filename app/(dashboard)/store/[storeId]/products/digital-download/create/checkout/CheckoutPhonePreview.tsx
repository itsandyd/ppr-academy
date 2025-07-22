import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CheckoutPhonePreviewProps {
  title?: string;
  body?: string;
  price?: number;
  cta?: string;
  image?: File | null;
}

export function CheckoutPhonePreview({ 
  title = "Digital Product Title", 
  body = "", 
  price = 9.99, 
  cta = "Buy Now",
  image 
}: CheckoutPhonePreviewProps) {
  return (
    <Card className="w-[356px] h-[678px] rounded-3xl border-4 border-black/90 bg-white flex flex-col p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Avatar className="w-10 h-10">
          <AvatarImage src="" alt="Profile" />
          <AvatarFallback className="text-sm font-semibold bg-muted">
            AD
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold">Andrew Dysart</span>
      </div>
      
      {/* Digital Product Preview */}
      <div className="flex-1 space-y-4">
        {/* Hero Image */}
        <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center overflow-hidden">
          {image ? (
            <img 
              src={URL.createObjectURL(image)} 
              alt="Product preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-white/50 rounded-lg mx-auto mb-2" />
              <span className="text-xs text-gray-500">Product Image</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg leading-tight">
              {title || "Digital Product Title"}
            </h3>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              ${price?.toFixed(2) || "9.99"}
            </Badge>
          </div>
          
          {/* Description */}
          {body && (
            <div 
              className="text-sm text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          )}
          
          {/* Bullet Points (Static for demo) */}
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Instant download after purchase</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>Lifetime access included</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
              <span>30-day money back guarantee</span>
            </div>
          </div>
        </div>

        {/* Purchase Form */}
        <div className="space-y-3 pt-4">
          <Button 
            className="w-full bg-[#6356FF] hover:bg-[#5248E6] text-white h-10 rounded-lg"
          >
            {cta || "Buy Now"}
          </Button>
          
          {/* Customer Info Fields */}
          <div className="space-y-2 pt-2">
            <Input placeholder="Your Name" className="h-9 text-sm" />
            <Input placeholder="Your Email" className="h-9 text-sm" />
          </div>
        </div>
      </div>
    </Card>
  );
} 