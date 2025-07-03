"use client";

import dynamic from 'next/dynamic';

// Dynamically import ReactMarkdown to avoid SSR issues
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-slate-200 h-4 rounded"></div>
});

interface ContentRendererProps {
  content: string;
  className?: string;
}

export default function ContentRenderer({ content, className = "" }: ContentRendererProps) {
  if (!content || content.trim() === '') {
    return <div className="text-slate-500 italic">No content available</div>;
  }

  // Check if content is HTML
  const isHTML = /<[^>]*>/g.test(content);

  // Base classes - will be overridden by className prop if provided
  const baseClasses = className || "prose prose-lg max-w-none text-slate-700 leading-relaxed";

  if (isHTML) {
    return (
      <div 
        className={baseClasses}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  } else {
    // Check if content contains markdown formatting
    const hasMarkdown = /[#*`\[\]_~]/.test(content);
    
    if (hasMarkdown) {
      return (
        <div className={baseClasses}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    } else {
      return (
        <div className={`${baseClasses} whitespace-pre-wrap`}>
          {content}
        </div>
      );
    }
  }
} 