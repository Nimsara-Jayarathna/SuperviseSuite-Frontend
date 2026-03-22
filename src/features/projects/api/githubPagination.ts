import { isApiException } from '@/services/apiClient';
import type { PaginatedListResult } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value as T[];
}

export function buildPagedUrl(path: string, page: number, size?: number) {
  const query = new URLSearchParams();
  if (page > 1) {
    query.set('page', String(page));
  }
  if (typeof size === 'number' && Number.isFinite(size) && size > 0) {
    query.set('size', String(size));
  }
  const queryString = query.toString();
  return queryString.length > 0 ? `${path}?${queryString}` : path;
}

export function normalizePaginatedPayload<T>(
  payload: unknown,
  page: number,
  size?: number,
): PaginatedListResult<T> {
  const requestedSize = Number.isFinite(size) && size && size > 0 ? size : null;

  if (Array.isArray(payload)) {
    const effectiveSize = requestedSize ?? (payload.length > 0 ? payload.length : 10);
    return {
      items: payload as T[],
      hasMore: payload.length >= effectiveSize,
      page,
      size: effectiveSize,
    };
  }

  if (isRecord(payload)) {
    const items = asArray<T>(payload.items)
      .concat(asArray<T>(payload.content))
      .concat(asArray<T>(payload.results))
      .concat(asArray<T>(payload.data));

    const normalizedItems = items.length > 0 ? items : [];

    const hasMoreFromFlag = typeof payload.hasMore === 'boolean' ? payload.hasMore : null;
    const totalPages =
      typeof payload.totalPages === 'number' && Number.isFinite(payload.totalPages)
        ? payload.totalPages
        : null;
    const hasNextPage =
      typeof payload.hasNext === 'boolean'
        ? payload.hasNext
        : typeof payload.nextPage === 'number' && Number.isFinite(payload.nextPage);
    const payloadSize =
      typeof payload.size === 'number' && Number.isFinite(payload.size) && payload.size > 0
        ? payload.size
        : typeof payload.pageSize === 'number' &&
            Number.isFinite(payload.pageSize) &&
            payload.pageSize > 0
          ? payload.pageSize
          : null;
    const effectiveSize =
      payloadSize ?? requestedSize ?? (normalizedItems.length > 0 ? normalizedItems.length : 10);

    const hasMore =
      hasMoreFromFlag ??
      (totalPages !== null
        ? page < totalPages
        : hasNextPage || normalizedItems.length >= effectiveSize);

    return {
      items: normalizedItems,
      hasMore,
      page,
      size: effectiveSize,
    };
  }

  return {
    items: [],
    hasMore: false,
    page,
    size: requestedSize ?? 10,
  };
}

export function fallbackSlicePage<T>(
  allItems: T[],
  page: number,
  size?: number,
): PaginatedListResult<T> {
  const effectiveSize = Number.isFinite(size) && size && size > 0 ? size : 10;
  const start = (page - 1) * effectiveSize;
  const end = start + effectiveSize;
  const items = allItems.slice(start, end);
  return {
    items,
    hasMore: end < allItems.length,
    page,
    size: effectiveSize,
  };
}

export function shouldFallbackToDashboard(error: unknown) {
  return (
    isApiException(error) && (error.apiError.code === 'NOT_FOUND' || error.apiError.status === 404)
  );
}
