/**
 * Detects whether the current client is a search engine crawler, bot, or automated headless browser.
 */
export function isCrawler(): boolean {
  if (typeof window === 'undefined' || !navigator) return false;

  // Automated browser flags (Puppeteer, Selenium, Playwright, HeadlessChrome, Prerender)
  if (navigator.webdriver) return true;
  if ((window as unknown as { __PRERENDER_INJECTED?: boolean }).__PRERENDER_INJECTED) return true;

  const ua = (navigator.userAgent || '').toLowerCase();
  if (!ua) return false;

  const botRegex =
    /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|yahoo|twitterbot|facebookexternalhit|facebot|linkedinbot|embedly|quora link preview|pinterest|slackbot|vkshare|w3c_validator|whatsapp|screaming frog|semrushbot|ahrefsbot|rogerbot|exabot|mj12bot|dotbot|gigabot|petalbot|ia_archiver|headlesschrome|lighthouse|inspect|phantomjs|crawler|spider|bot/i;

  return botRegex.test(ua);
}

/**
 * Detects whether hardware acceleration is turned off or WebGL is software-rendered / unsupported.
 */
export function isHardwareAccelerationDisabled(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return true;

  try {
    const canvas = document.createElement('canvas');

    // 1. Check if hardware-accelerated WebGL is available.
    // In Khronos WebGL specification: failIfMajorPerformanceCaveat returns null if hardware acceleration
    // is disabled and the browser falls back to CPU software rasterization (e.g., SwiftShader, llvmpipe).
    const hwContext =
      (canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) as
        | WebGLRenderingContext
        | WebGL2RenderingContext
        | null) ||
      (canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }) as
        | WebGLRenderingContext
        | WebGL2RenderingContext
        | null);

    if (!hwContext) {
      // Hardware acceleration is disabled or WebGL is unsupported
      return true;
    }

    // 2. Query debug renderer info to confirm there is no software rasterizer active
    const debugInfo = hwContext.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = (
        hwContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ''
      ).toLowerCase();
      const vendor = (
        hwContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || ''
      ).toLowerCase();

      const softwareKeywords = [
        'swiftshader',
        'llvmpipe',
        'software',
        'softpipe',
        'basic render driver',
        'microsoft basic render',
        'mesa off-screen',
        'lavapipe',
        'apple software renderer',
        'software rasterizer',
        'warp',
      ];

      if (
        softwareKeywords.some(
          (keyword) => renderer.includes(keyword) || vendor.includes(keyword)
        )
      ) {
        return true;
      }
    }

    // Clean up WebGL test context to prevent resource leaks
    const loseContext = hwContext.getExtension('WEBGL_lose_context');
    if (loseContext) {
      loseContext.loseContext();
    }

    return false;
  } catch {
    // If context initialization throws or is blocked, fallback safely
    return true;
  }
}

/**
 * Checks whether user prefers reduced motion for accessibility/battery.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Returns true if the client should render the interactive 3D hero animation.
 * Returns false for search engine crawlers, devices with hardware acceleration off,
 * or environments without full WebGL support.
 */
export function canRenderHero3D(): boolean {
  if (isCrawler()) return false;
  if (isHardwareAccelerationDisabled()) return false;
  if (prefersReducedMotion()) return false;
  return true;
}
