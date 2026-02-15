import { Skeleton } from "@/components/ui/skeleton";

export default function CourseDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-12">
      {/* Hero */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-12 mb-8">
        <Skeleton className="w-full md:w-1/2 h-48 md:h-72 rounded-lg" />
        <div className="w-full md:w-1/2 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-12 w-40 mt-4" />
        </div>
      </div>
      {/* Module list */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
