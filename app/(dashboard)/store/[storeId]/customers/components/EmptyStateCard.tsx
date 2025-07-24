import { Card } from "@/components/ui/card";

export function EmptyStateCard() {
  return (
    <Card className="h-[440px] w-full rounded-2xl flex flex-col items-center justify-center shadow-[0_12px_24px_rgba(16,24,40,0.04)] bg-white">
      {/* Illustration placeholder - replace with actual asset */}
      <div className="h-24 mb-6 flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mb-2 flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg"></div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
        </div>
        <div className="mt-1 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
          ★ 5.0
        </div>
      </div>

      <h3 className="text-xl font-bold text-[#0F1633] mt-6">Get your first customer</h3>

      <a
        href="/dashboard/products/new"
        className="mt-2 text-[#6356FF] text-[15px] font-semibold hover:underline"
      >
        Launch and share paid products →
      </a>

      <a
        href="https://docs.example.com/grow-list"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#4B4E68] text-sm font-normal hover:underline"
      >
        Or learn how to grow your customer list here
      </a>
    </Card>
  );
} 