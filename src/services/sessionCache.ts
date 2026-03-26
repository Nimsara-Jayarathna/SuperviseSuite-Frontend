type SessionCacheClearer = () => void;

const sessionCacheClearers = new Set<SessionCacheClearer>();

/**
 * Registers an in-memory cache clearer that should run when auth session changes.
 */
export function registerSessionCacheClearer(clearer: SessionCacheClearer): () => void {
  sessionCacheClearers.add(clearer);

  return () => {
    sessionCacheClearers.delete(clearer);
  };
}

/**
 * Clears all registered session-scoped in-memory caches.
 */
export function clearSessionCaches(): void {
  for (const clearCache of sessionCacheClearers) {
    try {
      clearCache();
    } catch {
      // Best-effort cleanup only; never block auth flow on cache clear failure.
    }
  }
}
