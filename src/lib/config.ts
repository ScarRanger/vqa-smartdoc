/**
 * Application configuration and environment variables
 */

// Resolve API base URL with sensible defaults:
// - If NEXT_PUBLIC_API_URL is set, use it (explicit override)
// - In development, default to local backend
// - In production, default to same-origin proxy path to use Next.js rewrite
const resolvedApiBaseUrl = (() => {
  // In production, ALWAYS use the same-origin proxy path to avoid CORS/stale URLs
  if (process.env.NODE_ENV === 'production') return '/api/backend';
  // In development, allow explicit override; else default to local backend
  const explicit = process.env.NEXT_PUBLIC_API_URL;
  if (explicit && explicit.trim().length > 0) return explicit.trim();
  return 'http://localhost:8000';
})();

export const config = {
  // API Configuration
  api: {
    baseUrl: resolvedApiBaseUrl,
    timeout: 30000,
    uploadTimeout: 60000,
    vqaTimeout: 90000,
  },
  
  // Application Settings
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'VQA SmartDoc',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  },
  
  // File Upload Settings
  upload: {
    maxSizeMB: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE_MB || '10'),
    supportedTypes: (process.env.NEXT_PUBLIC_SUPPORTED_FILE_TYPES || 'pdf,png,jpg,jpeg,gif,webp')
      .split(',')
      .map(type => type.trim().toLowerCase()),
    supportedMimeTypes: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
    ],
  },
  
  // CORS Settings
  cors: {
    origins: (process.env.NEXT_PUBLIC_CORS_ORIGINS || 'http://localhost:3000,https://localhost:3000')
      .split(',')
      .map(origin => origin.trim()),
  },
  
  // Feature Flags
  features: {
    enableFileValidation: true,
    enableProgressTracking: true,
    enableErrorTracking: true,
    enableOfflineMode: false,
  },
} as const;

/**
 * Get the appropriate API endpoint URL
 */
export function getApiUrl(endpoint: string = ''): string {
  const baseUrl = config.api.baseUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.replace(/^\//, ''); // Remove leading slash
  return `${baseUrl}${cleanEndpoint ? '/' + cleanEndpoint : ''}`;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return config.app.environment === 'development';
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return config.app.environment === 'production';
}

/**
 * Get file size limit in bytes
 */
export function getMaxFileSize(): number {
  return config.upload.maxSizeMB * 1024 * 1024;
}

/**
 * Check if file type is supported
 */
export function isSupportedFileType(fileType: string): boolean {
  return (config.upload.supportedMimeTypes as readonly string[]).includes(fileType.toLowerCase());
}

/**
 * Get supported file extensions as a display string
 */
export function getSupportedFileTypesDisplay(): string {
  return config.upload.supportedTypes.join(', ').toUpperCase();
}

/**
 * Log debug information in development
 */
export function debugLog(message: string, data?: unknown): void {
  if (config.app.enableDebug && isDevelopment()) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}

/**
 * Log error information
 */
export function errorLog(message: string, error?: unknown): void {
  console.error(`[ERROR] ${message}`, error || '');
}

export default config;
