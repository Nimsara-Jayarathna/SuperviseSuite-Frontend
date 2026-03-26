import { useCallback, useEffect, useMemo, useState } from 'react';

type SelectionPayload = {
  githubRepositoryId: string;
  customName?: string;
  primary?: true;
};

export function useRepositorySelection(maxSelectable: number) {
  const [selectedRepositoryIds, setSelectedRepositoryIds] = useState<string[]>([]);
  const [primaryRepositoryId, setPrimaryRepositoryId] = useState<string | null>(null);
  const [customNameByRepositoryId, setCustomNameByRepositoryId] = useState<Record<string, string>>(
    {},
  );

  const safeMaxSelectable = Math.max(0, maxSelectable);

  useEffect(() => {
    if (selectedRepositoryIds.length <= safeMaxSelectable) {
      return;
    }

    const trimmed = selectedRepositoryIds.slice(0, safeMaxSelectable);
    setSelectedRepositoryIds(trimmed);
    if (primaryRepositoryId && !trimmed.includes(primaryRepositoryId)) {
      setPrimaryRepositoryId(trimmed[0] ?? null);
    }
  }, [primaryRepositoryId, safeMaxSelectable, selectedRepositoryIds]);

  const isSelected = useCallback(
    (repositoryId: string): boolean => selectedRepositoryIds.includes(repositoryId),
    [selectedRepositoryIds],
  );

  const toggleRepository = useCallback(
    (repositoryId: string) => {
      setSelectedRepositoryIds((current) => {
        if (current.includes(repositoryId)) {
          const next = current.filter((id) => id !== repositoryId);
          if (primaryRepositoryId === repositoryId) {
            setPrimaryRepositoryId(null);
          }
          return next;
        }

        if (safeMaxSelectable > 0 && current.length >= safeMaxSelectable) {
          return current;
        }

        const next = [...current, repositoryId];
        if (!primaryRepositoryId) {
          setPrimaryRepositoryId(repositoryId);
        }
        return next;
      });
    },
    [primaryRepositoryId, safeMaxSelectable],
  );

  const togglePrimaryRepository = useCallback(
    (repositoryId: string) => {
      if (!selectedRepositoryIds.includes(repositoryId)) {
        return;
      }
      setPrimaryRepositoryId((current) => (current === repositoryId ? null : repositoryId));
    },
    [selectedRepositoryIds],
  );

  const setCustomName = useCallback((repositoryId: string, value: string) => {
    setCustomNameByRepositoryId((current) => ({ ...current, [repositoryId]: value }));
  }, []);

  const clear = useCallback(() => {
    setSelectedRepositoryIds([]);
    setPrimaryRepositoryId(null);
    setCustomNameByRepositoryId({});
  }, []);

  const selectionsPayload = useMemo<SelectionPayload[]>(() => {
    return selectedRepositoryIds.map((repositoryId) => {
      const customName = customNameByRepositoryId[repositoryId]?.trim();
      return {
        githubRepositoryId: repositoryId,
        customName: customName && customName.length > 0 ? customName : undefined,
        primary: primaryRepositoryId === repositoryId ? true : undefined,
      };
    });
  }, [customNameByRepositoryId, primaryRepositoryId, selectedRepositoryIds]);

  return useMemo(
    () => ({
      selectedRepositoryIds,
      primaryRepositoryId,
      customNameByRepositoryId,
      selectionsPayload,
      isSelected,
      toggleRepository,
      setPrimaryRepositoryId: togglePrimaryRepository,
      setCustomName,
      clear,
    }),
    [
      clear,
      customNameByRepositoryId,
      isSelected,
      primaryRepositoryId,
      selectionsPayload,
      selectedRepositoryIds,
      setCustomName,
      toggleRepository,
      togglePrimaryRepository,
    ],
  );
}
