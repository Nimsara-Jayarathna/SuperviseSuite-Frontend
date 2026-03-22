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

export function buildPagedUrl(path: string, page: number, size: number) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return `${path}?${query.toString()}`;
}

export function normalizePaginatedPayload<T>(
  payload: unknown,
  page: number,
  size: number,
): PaginatedListResult<T> {
  if (Array.isArray(payload)) {
    return {
      items: payload as T[],
      hasMore: payload.length >= size,
      page,
      size,
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

    const hasMore =
      hasMoreFromFlag ??
      (totalPages !== null ? page < totalPages : hasNextPage || normalizedItems.length >= size);

    return {
      items: normalizedItems,
      hasMore,
      page,
      size,
    };
  }

  return {
    items: [],
    hasMore: false,
    page,
    size,
  };
}

export function fallbackSlicePage<T>(
  allItems: T[],
  page: number,
  size: number,
): PaginatedListResult<T> {
  const start = (page - 1) * size;
  const end = start + size;
  const items = allItems.slice(start, end);
  return {
    items,
    hasMore: end < allItems.length,
    page,
    size,
  };
}

export function shouldFallbackToDashboard(error: unknown) {
  return (
    isApiException(error) && (error.apiError.code === 'NOT_FOUND' || error.apiError.status === 404)
  );
}
