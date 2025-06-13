import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourseWithDetails } from "@/lib/types";
import { Users, DollarSign } from "lucide-react";
import { generateSlug } from "@/lib/utils";

interface CourseCardProps {
  course: CourseWithDetails;
}

export default function CourseCard({ course }: CourseCardProps) {
  const instructorName = course.instructor ? 
    `${course.instructor.firstName || ""} ${course.instructor.lastName || ""}`.trim() || 
    course.instructor.email || 
    "Unknown Instructor" : 
    "Unknown Instructor";

  // Generate slug from title (temporary until migration adds slug field)
  const courseSlug = generateSlug(course.title);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <div className="relative h-48 bg-slate-200">
        {course.imageUrl ? (
          <Image
            src={course.imageUrl}
            alt={course.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
            <span className="text-white text-4xl font-bold">
              {course.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {course.price && (
          <Badge className="absolute top-4 right-4 bg-dark text-white">
            <DollarSign className="w-3 h-3 mr-1" />
            {course.price}
          </Badge>
        )}
      </div>
      
      <CardContent className="p-6 flex-1">
        <h3 className="text-xl font-bold text-dark mb-2 line-clamp-2">
          {course.title}
        </h3>
        
        {course.description && (
          <p className="text-slate-600 mb-4 line-clamp-3">
            {course.description}
          </p>
        )}
        
        <div className="flex items-center text-sm text-slate-500">
          <span>{instructorName}</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0 flex items-center justify-between">
        <div className="flex items-center text-sm text-slate-500">
          <Users className="w-4 h-4 mr-1" />
          <span>{course._count?.enrollments || 0} students</span>
        </div>
        
        <Link href={`/courses/${courseSlug}`}>
          <Button variant="outline" size="sm">
            View Course
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 