/**
 * Converts HTML content to plain text for WhatsApp messages
 * Removes all HTML tags and converts common HTML entities
 */
export function htmlToPlainText(html: string): string {
  if (!html) return ''

  let text = html

  // Remove script and style elements
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Convert common block elements to line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/?(div|p|h1|h2|h3|h4|h5|h6|tr|li)[^>]*>/gi, '\n')

  // Convert list items with bullets
  text = text.replace(/<li[^>]*>/gi, '\n• ')

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '')

  // Convert HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  text = text.replace(/&apos;/g, "'")

  // Remove excessive whitespace and line breaks
  text = text.replace(/[ \t]+/g, ' ') // Multiple spaces to single space
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple line breaks to double line break
  text = text.trim()

  return text
}

/**
 * Generates a WhatsApp wa.me link with a pre-filled message
 * @param phoneNumber - Phone number in international format (e.g., "521234567890")
 * @param message - The message text to pre-fill
 * @returns The complete wa.me URL
 */
export function generateWhatsAppLink(phoneNumber: string | null | undefined, message: string): string {
  // Handle null or undefined phone numbers
  if (!phoneNumber) {
    throw new Error('Phone number is required')
  }

  // Convert to string if it's not already
  const phoneStr = String(phoneNumber)

  // Remove any non-numeric characters from phone number
  const cleanPhone = phoneStr.replace(/\D/g, '')

  if (!cleanPhone) {
    throw new Error('Invalid phone number format')
  }

  // URL encode the message
  const encodedMessage = encodeURIComponent(message)

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}
