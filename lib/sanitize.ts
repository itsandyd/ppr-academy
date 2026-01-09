import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Uses DOMPurify to remove potentially dangerous elements and attributes.
 */
export function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    // Allow common HTML tags for rich content
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'em', 'b', 'i', 'u', 's', 'strike',
      'a', 'img', 'video', 'audio', 'source',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
      'figure', 'figcaption',
      'iframe', // For embedded content like YouTube
    ],
    // Allow safe attributes
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'title', 'width', 'height',
      'class', 'id', 'style',
      'controls', 'autoplay', 'loop', 'muted',
      'frameborder', 'allowfullscreen', 'allow',
      'colspan', 'rowspan',
      'type',
    ],
    // Allow specific URI schemes
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Allow data: URIs for images only
    ADD_DATA_URI_TAGS: ['img'],
    // Additional security settings
    FORBID_TAGS: ['script', 'style', 'noscript', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}

/**
 * Sanitize HTML for email content (more restrictive).
 */
export function sanitizeEmailHtml(html: string | undefined | null): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'em', 'b', 'i', 'u',
      'a', 'img',
      'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'title', 'width', 'height',
      'style', // Email clients often require inline styles
      'colspan', 'rowspan',
      'align', 'valign', 'bgcolor',
    ],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}

/**
 * Strip all HTML tags, returning plain text.
 */
export function stripHtml(html: string | undefined | null): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
