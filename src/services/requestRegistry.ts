let nextRequestId = 1;

const activeControllers = new Map<number, AbortController>();

function logDev(message: string, payload?: Record<string, unknown>): void {
  if (!import.meta.env.DEV) {
    return;
  }
  if (payload) {
    // eslint-disable-next-line no-console
    console.info(`[requestRegistry] ${message}`, payload);
    return;
  }
  // eslint-disable-next-line no-console
  console.info(`[requestRegistry] ${message}`);
}

export function createManagedAbortSignal(): {
  id: number;
  signal: AbortSignal;
  release: () => void;
} {
  const id = nextRequestId++;
  const controller = new AbortController();
  activeControllers.set(id, controller);

  return {
    id,
    signal: controller.signal,
    release: () => {
      activeControllers.delete(id);
    },
  };
}

export function abortAllInFlightRequests(reason = 'session-transition'): number {
  const entries = [...activeControllers.entries()];
  for (const [id, controller] of entries) {
    controller.abort(reason);
    activeControllers.delete(id);
  }

  logDev('aborted in-flight requests', { reason, count: entries.length });
  return entries.length;
}
