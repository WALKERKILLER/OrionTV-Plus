import { api } from "@/services/api";
import { getAdFilteredM3u8Candidates } from "@/services/m3u";
import Logger from "@/utils/Logger";

const logger = Logger.withTag("M3U8");

interface ResolutionCacheEntry {
  resolution: string | null;
  timestamp: number;
}

interface SourceStatsCacheEntry {
  stats: M3U8SourceStats;
  timestamp: number;
}

export interface M3U8SourceStats {
  quality: string;
  loadSpeed: string;
  pingTime: number;
  hasError?: boolean;
}

export interface SourceStatsOptions {
  signal?: AbortSignal;
  sourceKey?: string;
}

interface PlaylistFetchResult {
  text: string;
  finalUrl: string;
}

const resolutionCache: Record<string, ResolutionCacheEntry> = {};
const sourceStatsCache: Record<string, SourceStatsCacheEntry> = {};
const CACHE_DURATION_MS = 5 * 60 * 1000;
const SOURCE_STATS_CACHE_DURATION_MS = 2 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 6000;
const UNKNOWN_LABEL = "\u672a\u77e5";

const formatSpeed = (speedKBps: number) => {
  if (!Number.isFinite(speedKBps) || speedKBps <= 0) {
    return UNKNOWN_LABEL;
  }

  if (speedKBps >= 1024) {
    return `${(speedKBps / 1024).toFixed(1)} MB/s`;
  }

  return `${speedKBps.toFixed(1)} KB/s`;
};

const normalizeApiBaseUrl = (apiBaseUrl: string) => apiBaseUrl.replace(/\/$/, "");

const isM3U8Url = (url: string) => {
  if (!url) {
    return false;
  }

  if (/\/api\/proxy(?:-m3u8|\/m3u8)/i.test(url)) {
    return true;
  }

  if (/\.m3u8(?:$|[?#&])/i.test(url)) {
    return true;
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    return /\.m3u8(?:$|[?#&])/i.test(decodedUrl);
  } catch {
    return false;
  }
};

const isHttpUrl = (url: string) => /^https?:\/\//i.test(url);

const resolvePlaylistUrl = (baseUrl: string, target: string) => {
  try {
    return new URL(target, baseUrl).toString();
  } catch {
    return target;
  }
};

const inferQualityFromBandwidth = (bandwidth: number) => {
  if (bandwidth >= 12000000) return "4K";
  if (bandwidth >= 7000000) return "2K";
  if (bandwidth >= 3500000) return "1080p";
  if (bandwidth >= 1800000) return "720p";
  if (bandwidth >= 900000) return "480p";
  if (bandwidth > 0) return "360p";
  return null;
};

const inferQualityFromUrl = (url: string | null | undefined) => {
  if (!url) {
    return null;
  }

  let normalized = url.toLowerCase();
  try {
    normalized = decodeURIComponent(url).toLowerCase();
  } catch {
    // keep original text
  }

  if (/2160|4k/.test(normalized)) return "4K";
  if (/1440|2k/.test(normalized)) return "2K";
  if (/1080/.test(normalized)) return "1080p";
  if (/720/.test(normalized)) return "720p";
  if (/480/.test(normalized)) return "480p";
  if (/360/.test(normalized)) return "360p";
  return null;
};

const extractQuality = (playlistText: string, sourceUrl?: string): string | null => {
  const lines = playlistText.split(/\r?\n/);
  let highestResolution = 0;
  let highestBandwidth = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.startsWith("#EXT-X-STREAM-INF")) {
      continue;
    }

    const resolutionMatch = line.match(/RESOLUTION=(\d+)x(\d+)/i);
    if (resolutionMatch) {
      const height = Number.parseInt(resolutionMatch[2], 10);
      if (height > highestResolution) {
        highestResolution = height;
      }
    }

    const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/i);
    if (bandwidthMatch) {
      const bandwidth = Number.parseInt(bandwidthMatch[1], 10);
      if (bandwidth > highestBandwidth) {
        highestBandwidth = bandwidth;
      }
    }
  }

  if (highestResolution > 0) {
    return `${highestResolution}p`;
  }

  const inferredFromBandwidth = inferQualityFromBandwidth(highestBandwidth);
  if (inferredFromBandwidth) {
    return inferredFromBandwidth;
  }

  return inferQualityFromUrl(sourceUrl ?? null);
};

const extractFirstPlayableUrl = (playlistText: string, playlistUrl: string): string | null => {
  const lines = playlistText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.startsWith("#")) {
      continue;
    }

    return resolvePlaylistUrl(playlistUrl, line);
  }

  return null;
};

const withTimeoutFetch = async (
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
  externalSignal?: AbortSignal
) => {
  const controller = new AbortController();
  const abortHandler = () => controller.abort();

  if (externalSignal?.aborted) {
    controller.abort();
  }
  externalSignal?.addEventListener("abort", abortHandler, { once: true });

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const fetchPromise = fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });

    return (await Promise.race([fetchPromise, timeoutPromise])) as Response;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    externalSignal?.removeEventListener("abort", abortHandler);
  }
};

const buildPlaylistCandidates = (url: string, sourceKey?: string) => {
  const candidates: string[] = [];
  const baseUrl = api.baseURL ? normalizeApiBaseUrl(api.baseURL) : "";
  const encodedUrl = encodeURIComponent(url);

  if (baseUrl && isHttpUrl(url)) {
    if (sourceKey) {
      const encodedSourceKey = encodeURIComponent(sourceKey);
      const adFilteredCandidates = getAdFilteredM3u8Candidates(url, baseUrl, sourceKey);
      candidates.push(...adFilteredCandidates);
      candidates.push(
        `${baseUrl}/api/proxy-m3u8?url=${encodedUrl}&source=${encodedSourceKey}&moontv-source=${encodedSourceKey}`
      );
      candidates.push(`${baseUrl}/api/proxy/m3u8?url=${encodedUrl}&moontv-source=${encodedSourceKey}`);
    } else {
      candidates.push(`${baseUrl}/api/proxy-m3u8?url=${encodedUrl}`);
      candidates.push(`${baseUrl}/api/proxy/m3u8?url=${encodedUrl}`);
    }
  }

  candidates.push(url);

  return Array.from(new Set(candidates.filter(Boolean)));
};

const fetchPlaylistText = async (url: string, signal?: AbortSignal): Promise<PlaylistFetchResult> => {
  const response = await withTimeoutFetch(url, { method: "GET" }, REQUEST_TIMEOUT_MS, signal);
  if (!response.ok) {
    throw new Error(`Playlist request failed with status ${response.status}`);
  }

  const text = await response.text();
  return {
    text,
    finalUrl: response.url || url,
  };
};

const fetchPlaylistFromCandidates = async (candidates: string[], signal?: AbortSignal): Promise<PlaylistFetchResult> => {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      return await fetchPlaylistText(candidate, signal);
    } catch (error) {
      lastError = error;
      logger.debug(`[M3U8] Failed to fetch candidate playlist: ${candidate}`);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to fetch playlist from all candidates");
};

const measurePingTime = async (candidates: string[], signal?: AbortSignal) => {
  let fallbackElapsed = 0;

  for (const candidate of candidates) {
    const startedAt = performance.now();

    try {
      await withTimeoutFetch(
        candidate,
        {
          method: "GET",
          headers: {
            Range: "bytes=0-1",
          },
        },
        4500,
        signal
      );

      return Math.round(Math.max(performance.now() - startedAt, 1));
    } catch {
      fallbackElapsed = Math.round(Math.max(performance.now() - startedAt, fallbackElapsed));
    }
  }

  return fallbackElapsed;
};

const measureLoadSpeed = async (url: string, signal?: AbortSignal) => {
  const startedAt = performance.now();

  const response = await withTimeoutFetch(
    url,
    {
      method: "GET",
      headers: {
        Range: "bytes=0-262143",
      },
    },
    REQUEST_TIMEOUT_MS,
    signal
  );

  if (!response.ok) {
    throw new Error(`Source speed request failed with status ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = buffer.byteLength || Number.parseInt(response.headers.get("content-length") || "0", 10);
  const elapsed = Math.max((performance.now() - startedAt) / 1000, 0.001);
  const speedKBps = bytes / 1024 / elapsed;

  return formatSpeed(speedKBps);
};

const measureLoadSpeedFromCandidates = async (candidates: string[], signal?: AbortSignal) => {
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      return await measureLoadSpeed(candidate, signal);
    } catch (error) {
      lastError = error;
      logger.debug(`[M3U8] Failed to measure source speed from candidate: ${candidate}`);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to measure source speed");
};

export const getResolutionFromM3U8 = async (url: string, signal?: AbortSignal): Promise<string | null> => {
  const perfStart = performance.now();
  logger.info(`[PERF] M3U8 resolution detection START - url: ${url.substring(0, 100)}...`);

  const cachedEntry = resolutionCache[url];
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS) {
    const perfEnd = performance.now();
    logger.info(
      `[PERF] M3U8 resolution detection CACHED - took ${(perfEnd - perfStart).toFixed(2)}ms, resolution: ${cachedEntry.resolution}`
    );
    return cachedEntry.resolution;
  }

  if (!isM3U8Url(url)) {
    logger.info("[PERF] M3U8 resolution detection SKIPPED - not M3U8 file");
    return null;
  }

  try {
    const candidates = buildPlaylistCandidates(url);
    const playlist = await fetchPlaylistFromCandidates(candidates, signal);
    const resolutionString = extractQuality(playlist.text, playlist.finalUrl);

    resolutionCache[url] = {
      resolution: resolutionString,
      timestamp: Date.now(),
    };

    const perfEnd = performance.now();
    logger.info(
      `[PERF] M3U8 resolution detection COMPLETE - took ${(perfEnd - perfStart).toFixed(2)}ms, resolution: ${resolutionString}`
    );

    return resolutionString;
  } catch (error) {
    const perfEnd = performance.now();
    logger.info(`[PERF] M3U8 resolution detection ERROR - took ${(perfEnd - perfStart).toFixed(2)}ms, error: ${error}`);
    return null;
  }
};

export const getSourceStatsFromM3U8 = async (url: string, options: SourceStatsOptions = {}): Promise<M3U8SourceStats> => {
  const { signal, sourceKey } = options;
  const cacheKey = `${sourceKey || "default"}::${url}`;

  const cachedEntry = sourceStatsCache[cacheKey];
  if (cachedEntry && Date.now() - cachedEntry.timestamp < SOURCE_STATS_CACHE_DURATION_MS) {
    return cachedEntry.stats;
  }

  if (!isM3U8Url(url) && !isHttpUrl(url)) {
    return {
      quality: inferQualityFromUrl(url) || UNKNOWN_LABEL,
      loadSpeed: UNKNOWN_LABEL,
      pingTime: 0,
      hasError: true,
    };
  }

  try {
    const playlistCandidates = buildPlaylistCandidates(url, sourceKey);
    const [playlist, pingTime] = await Promise.all([
      fetchPlaylistFromCandidates(playlistCandidates, signal),
      measurePingTime(playlistCandidates, signal),
    ]);

    let quality = extractQuality(playlist.text, playlist.finalUrl) || UNKNOWN_LABEL;
    let speedTargetUrl = extractFirstPlayableUrl(playlist.text, playlist.finalUrl) || playlist.finalUrl;

    if (isM3U8Url(speedTargetUrl)) {
      try {
        const childPlaylist = await fetchPlaylistFromCandidates(buildPlaylistCandidates(speedTargetUrl, sourceKey), signal);
        quality = extractQuality(childPlaylist.text, childPlaylist.finalUrl) || quality;
        speedTargetUrl = extractFirstPlayableUrl(childPlaylist.text, childPlaylist.finalUrl) || speedTargetUrl;
      } catch {
        // Keep current speedTargetUrl and quality.
      }
    }

    const loadSpeed = await measureLoadSpeedFromCandidates(buildPlaylistCandidates(speedTargetUrl, sourceKey), signal);

    const result: M3U8SourceStats = {
      quality,
      loadSpeed,
      pingTime: Math.max(pingTime, 1),
      hasError: false,
    };

    sourceStatsCache[cacheKey] = {
      stats: result,
      timestamp: Date.now(),
    };

    return result;
  } catch (error) {
    logger.info(`[PERF] Source stats detection ERROR - url: ${url}, error: ${error}`);

    return {
      quality: inferQualityFromUrl(url) || UNKNOWN_LABEL,
      loadSpeed: UNKNOWN_LABEL,
      pingTime: 0,
      hasError: true,
    };
  }
};
