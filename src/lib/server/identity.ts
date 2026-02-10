export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const sanitizeIdPart = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'user';

export const userIdFromEmail = (email: string) => {
  const normalized = normalizeEmail(email);
  const localPart = normalized.split('@')[0] ?? normalized;
  return `user-${sanitizeIdPart(localPart)}`;
};

export const displayNameFromEmail = (email: string) => {
  const normalized = normalizeEmail(email);
  const localPart = normalized.split('@')[0] ?? normalized;
  const [firstPart] = localPart.split(/[._-]+/);
  if (!firstPart) return 'Membro';
  return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
};
