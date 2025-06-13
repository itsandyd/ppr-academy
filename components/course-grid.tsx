import { CourseWithDetails } from "@/lib/types";
import CourseCard from "@/components/course-card";

interface CourseGridProps {
  courses: CourseWithDetails[];
}

export default function CourseGrid({ courses }: CourseGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
} 