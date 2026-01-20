/**
 * Generate a default avatar URL using UI Avatars service
 * @param name - The name to generate initials from
 * @returns URL to the avatar image
 */
export function getDefaultAvatar(name: string): string {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&background=6366f1&color=fff&size=128`;
}
