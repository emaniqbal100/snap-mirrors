import sanitizeHtml from 'sanitize-html';

// Product descriptions can contain simple formatting (bold, italic, lists, line breaks, links)
// pasted from the admin panel. Everything else (scripts, styles, event handlers, images, iframes...)
// is removed so the storefront can render the saved HTML safely.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: { a: ['href', 'rel', 'target'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  transformTags: {
    b: 'strong',
    i: 'em',
    div: 'p',
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
  },
};

export const MAX_DESCRIPTION_LENGTH = 20000;

// True when the text contains real HTML tags (as opposed to a plain-text description,
// which is stored untouched so characters like "<" and "&" are not altered).
export function looksLikeHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(text);
}

export function sanitizeDescription(text: string): string {
  if (!looksLikeHtml(text)) return text;
  return sanitizeHtml(text, OPTIONS).trim();
}
