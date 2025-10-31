/**
 * Utility functions for generating SEO-optimized JSON-LD structured data
 * Based on Schema.org specifications
 */

// Sanitize JSON to prevent XSS attacks
export function sanitizeJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

// Base URL for the application
const getBaseUrl = () => process.env.NEXT_PUBLIC_APP_URL || "https://ppracademy.com";

// Export type for structured data
export type StructuredDataHtml = {
  __html: string;
};

interface CourseStructuredDataProps {
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
  rating?: {
    value: number;
    count: number;
  };
  duration?: string;
}

export function generateCourseStructuredData(props: CourseStructuredDataProps) {
  const baseUrl = getBaseUrl();
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": props.courseName,
    "description": props.description,
    "provider": {
      "@type": "Organization",
      "name": "PPR Academy",
      "url": baseUrl,
      "sameAs": [
        "https://twitter.com/ppracademy",
        "https://instagram.com/ppracademy"
      ]
    },
    "instructor": {
      "@type": "Person",
      "name": props.instructor.name,
      ...(props.instructor.url && { "url": props.instructor.url })
    },
    "url": props.url,
    ...(props.imageUrl && { "image": props.imageUrl }),
    ...(props.datePublished && { "datePublished": props.datePublished }),
    ...(props.dateModified && { "dateModified": props.dateModified }),
    ...(props.duration && { "timeRequired": props.duration }),
    ...(props.category && { "category": props.category }),
    ...(props.price !== undefined && {
      "offers": {
        "@type": "Offer",
        "price": props.price,
        "priceCurrency": props.currency || "USD",
        "availability": "https://schema.org/InStock",
        "url": props.url
      }
    }),
    ...(props.rating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": props.rating.value,
        "reviewCount": props.rating.count
      }
    })
  };

  return {
    __html: sanitizeJson(structuredData)
  };
}

interface ProductStructuredDataProps {
  name: string;
  description: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  url: string;
  brand?: string;
  category?: string;
  rating?: {
    value: number;
    count: number;
  };
  availability?: "InStock" | "OutOfStock" | "PreOrder";
}

export function generateProductStructuredData(props: ProductStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": props.name,
    "description": props.description,
    "url": props.url,
    ...(props.imageUrl && { "image": props.imageUrl }),
    ...(props.brand && {
      "brand": {
        "@type": "Brand",
        "name": props.brand
      }
    }),
    ...(props.category && { "category": props.category }),
    ...(props.price !== undefined && {
      "offers": {
        "@type": "Offer",
        "price": props.price,
        "priceCurrency": props.currency || "USD",
        "availability": `https://schema.org/${props.availability || "InStock"}`,
        "url": props.url
      }
    }),
    ...(props.rating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": props.rating.value,
        "reviewCount": props.rating.count
      }
    })
  };

  return {
    __html: sanitizeJson(structuredData)
  };
}

interface CreatorStructuredDataProps {
  name: string;
  description?: string;
  url: string;
  imageUrl?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

export function generateCreatorStructuredData(props: CreatorStructuredDataProps) {
  const sameAsLinks = [];
  if (props.socialLinks?.instagram) sameAsLinks.push(props.socialLinks.instagram);
  if (props.socialLinks?.twitter) sameAsLinks.push(props.socialLinks.twitter);
  if (props.socialLinks?.youtube) sameAsLinks.push(props.socialLinks.youtube);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": props.name,
    ...(props.description && { "description": props.description }),
    "url": props.url,
    ...(props.imageUrl && { "image": props.imageUrl }),
    ...(sameAsLinks.length > 0 && { "sameAs": sameAsLinks })
  };

  return {
    __html: sanitizeJson(structuredData)
  };
}

interface OrganizationStructuredDataProps {
  name: string;
  description: string;
  url: string;
  logo?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    facebook?: string;
  };
  contactEmail?: string;
}

export function generateOrganizationStructuredData(props: OrganizationStructuredDataProps) {
  const baseUrl = getBaseUrl();
  const sameAsLinks = [];
  
  if (props.socialLinks?.instagram) sameAsLinks.push(props.socialLinks.instagram);
  if (props.socialLinks?.twitter) sameAsLinks.push(props.socialLinks.twitter);
  if (props.socialLinks?.youtube) sameAsLinks.push(props.socialLinks.youtube);
  if (props.socialLinks?.facebook) sameAsLinks.push(props.socialLinks.facebook);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": props.name,
    "description": props.description,
    "url": props.url || baseUrl,
    ...(props.logo && { "logo": props.logo }),
    ...(sameAsLinks.length > 0 && { "sameAs": sameAsLinks }),
    ...(props.contactEmail && {
      "contactPoint": {
        "@type": "ContactPoint",
        "email": props.contactEmail,
        "contactType": "customer support"
      }
    })
  };

  return {
    __html: sanitizeJson(structuredData)
  };
}

interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function generateBreadcrumbStructuredData(props: BreadcrumbStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": props.items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return {
    __html: sanitizeJson(structuredData)
  };
}

interface WebsiteStructuredDataProps {
  name: string;
  description: string;
  url: string;
  searchUrl?: string;
}

export function generateWebsiteStructuredData(props: WebsiteStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": props.name,
    "description": props.description,
    "url": props.url,
    ...(props.searchUrl && {
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${props.searchUrl}?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    })
  };

  return {
    __html: sanitizeJson(structuredData)
  };
}
