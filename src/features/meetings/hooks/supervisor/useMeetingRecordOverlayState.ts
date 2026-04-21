import { useCallback, useState } from 'react';
import type { MeetingRecord } from '../../types';

type MeetingRecordOverlayState = {
  viewingRecord: MeetingRecord | null;
  pendingDelete: MeetingRecord | null;
  openView: (record: MeetingRecord) => void;
  closeView: () => void;
  openDelete: (record: MeetingRecord) => void;
  closeDelete: () => void;
};

export function useMeetingRecordOverlayState(): MeetingRecordOverlayState {
  const [viewingRecord, setViewingRecord] = useState<MeetingRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MeetingRecord | null>(null);

  const openView = useCallback((record: MeetingRecord) => {
    setViewingRecord(record);
  }, []);

  const closeView = useCallback(() => {
    setViewingRecord(null);
  }, []);

  const openDelete = useCallback((record: MeetingRecord) => {
    setPendingDelete(record);
  }, []);

  const closeDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  return {
    viewingRecord,
    pendingDelete,
    openView,
    closeView,
    openDelete,
    closeDelete,
  };
}
