// Utility functions for handling embed videos and extracting thumbnails

export interface EmbedVideoInfo {
  platform: "youtube" | "vimeo" | "other";
  videoId?: string;
  thumbnailUrl?: string;
  videoTitle?: string;
  embedCode: string;
}

/**
 * Extract video information from embed codes
 */
export function extractVideoInfo(embedCode: string): EmbedVideoInfo {
  // YouTube iframe/embed - more flexible regex
  const youtubeMatch = embedCode.match(/src=["']https?:\/\/www\.youtube\.com\/embed\/([^?"']+)/);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      platform: "youtube",
      videoId,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      videoTitle: `YouTube Video (${videoId})`,
      embedCode,
    };
  }

  // Also try to match YouTube embed codes that might be truncated
  const youtubeTruncatedMatch = embedCode.match(/src=["']https?:\/\/www\.youtube\.co/);
  if (youtubeTruncatedMatch) {
    // For truncated codes, we can't extract video ID, so return null
    return {
      platform: "youtube",
      videoId: "unknown",
      videoTitle: "YouTube Video",
      embedCode,
    };
  }

  // Vimeo iframe - more flexible regex
  const vimeoMatch = embedCode.match(/src=["']https?:\/\/player\.vimeo\.com\/video\/(\d+)/);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return {
      platform: "vimeo",
      videoId,
      thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
      videoTitle: `Vimeo Video (${videoId})`,
      embedCode,
    };
  }

  // Generic video tag
  const videoMatch = embedCode.match(/<video[^>]*src=["']([^"']+)["']/);
  if (videoMatch) {
    return {
      platform: "other",
      videoTitle: "Embedded Video",
      embedCode,
    };
  }

  // Default fallback
  return {
    platform: "other",
    videoTitle: "Embedded Video",
    embedCode,
  };
}

/**
 * Get thumbnail URL for embed video
 */
export function getEmbedVideoThumbnail(embedCode: string): string | undefined {
  const videoInfo = extractVideoInfo(embedCode);
  return videoInfo.thumbnailUrl || undefined;
}

/**
 * Get video title for embed video
 */
export function getEmbedVideoTitle(embedCode: string): string {
  const videoInfo = extractVideoInfo(embedCode);
  return videoInfo.videoTitle || "Embedded Video";
}
