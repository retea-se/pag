/**
 * Matomo Analytics Hook for På G
 *
 * Provides event tracking functions that integrate with Matomo.
 * All tracking is privacy-focused: no PII, cookieless, respects DNT.
 *
 * Events use category 'PagApp' with the following structure:
 * _paq.push(['trackEvent', 'PagApp', action, label, value])
 */

/**
 * Track a custom event in Matomo
 * @param {string} action - Event action (e.g., 'filter_change', 'event_click')
 * @param {string} [label] - Optional label for additional context
 * @param {number} [value] - Optional numeric value
 */
export function trackEvent(action, label, value) {
  if (typeof window._paq !== 'undefined') {
    window._paq.push(['trackEvent', 'PagApp', action, label, value]);
  }
}

/**
 * Track a virtual page view (for SPA navigation)
 * @param {string} path - The virtual path (e.g., '/rss', '/info')
 * @param {string} [title] - Optional page title
 */
export function trackPageView(path, title) {
  if (typeof window._paq !== 'undefined') {
    if (title) {
      window._paq.push(['setDocumentTitle', title]);
    }
    window._paq.push(['setCustomUrl', window.location.origin + '/pag' + path]);
    window._paq.push(['trackPageView']);
  }
}

// Pre-defined tracking functions for common events

/**
 * Track date filter change
 * @param {string} filter - Filter ID (yesterday, today, tomorrow, week, upcoming)
 * @param {number} eventCount - Number of events in the filtered view
 */
export function trackFilterChange(filter, eventCount) {
  trackEvent('filter_change', filter, eventCount);
}

/**
 * Track event card click
 * @param {string} arena - Arena name
 * @param {string} category - Event category (concert, hockey, etc.)
 */
export function trackEventClick(arena, category) {
  trackEvent('event_click', arena, undefined);
  if (category) {
    trackEvent('event_click_category', category);
  }
}

/**
 * Track manual refresh
 * @param {boolean} success - Whether the refresh was successful
 */
export function trackRefresh(success) {
  trackEvent('refresh', success ? 'success' : 'error');
}

/**
 * Track navigation link click
 * @param {string} target - Target page (rss, info, github, dashboard)
 */
export function trackNavClick(target) {
  trackEvent('nav_click', target);
}

/**
 * Track feed URL copy
 * @param {string} feedType - Feed type (rss, ical, json)
 * @param {string} period - Feed period (today, tomorrow, week, upcoming)
 */
export function trackFeedCopy(feedType, period) {
  trackEvent('feed_copy', `${feedType}_${period}`);
}

/**
 * Track feed view/download
 * @param {string} feedType - Feed type (rss, ical, json)
 * @param {string} period - Feed period (today, tomorrow, week, upcoming)
 */
export function trackFeedView(feedType, period) {
  trackEvent('feed_view', `${feedType}_${period}`);
}

/**
 * Track manual update trigger (from dashboard)
 * @param {boolean} success - Whether the trigger was successful
 */
export function trackManualUpdate(success) {
  trackEvent('manual_update', success ? 'triggered' : 'error');
}

/**
 * Track error occurrence
 * @param {string} errorType - Type of error (load_events, api_error, etc.)
 */
export function trackError(errorType) {
  trackEvent('error', errorType);
}

/**
 * React hook that returns all tracking functions
 * @returns {Object} Object with all tracking functions
 */
export function useMatomo() {
  return {
    trackEvent,
    trackPageView,
    trackFilterChange,
    trackEventClick,
    trackRefresh,
    trackNavClick,
    trackFeedCopy,
    trackFeedView,
    trackManualUpdate,
    trackError
  };
}

export default useMatomo;
