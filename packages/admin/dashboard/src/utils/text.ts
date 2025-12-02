export const truncateText = (text: string, maxLength = 30): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
};
