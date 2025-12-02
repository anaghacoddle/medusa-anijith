/**
 * Environment configuration utilities
 */
export const getFileSizeLimit = (): number => {
  const defaultLimit = 10 * 1024 * 1024; // 10MB in bytes
  const envLimit = __FILE_SIZE_LIMIT_MB__;
  if (!envLimit) {
    return defaultLimit;
  }
  const limitMB = parseFloat(envLimit);
  if (isNaN(limitMB) || limitMB <= 0) {
    return defaultLimit;
  }
  return limitMB * 1024 * 1024; // Convert MB to bytes
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileSizeLimitMB = (): number => {
  return getFileSizeLimit() / (1024 * 1024);
};
