"use client";

import { generateCourseStructuredData } from "@/lib/seo/structured-data";
import { StructuredData } from "@/lib/seo/structured-data-client";

interface CourseStructuredDataWrapperProps {
  courseName: string;
  description: string;
  instructor: {
    name: string;
    url?: string;
  };
  price?: number;
  currency?: string;
  imageUrl?: string;
  category?: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
}

export function CourseStructuredDataWrapper(props: CourseStructuredDataWrapperProps) {
  const structuredData = generateCourseStructuredData(props);
  
  return <StructuredData data={structuredData} />;
}

