export function formatDateBR(dateString: string): string {
  if (!dateString) return '';
  const cleanStr = dateString.split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
}

export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  const cleanStr = dateString.split('T')[0];
  const parts = cleanStr.split('-').map(Number);
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(dateString);
}
