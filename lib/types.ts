import { Course, User, Enrollment } from "@prisma/client";

export type { User };

export type CourseWithDetails = Course & {
  instructor: User;
  _count?: {
    enrollments: number;
  };
};

export type EnrollmentWithCourse = Enrollment & {
  course: Course & {
    instructor: User;
  };
}; 