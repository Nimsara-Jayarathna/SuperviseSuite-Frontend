import { useCallback, useState } from 'react';
import type { MeetingRecord } from '../../types';

type MeetingRecordFormState = {
  isFormOpen: boolean;
  formMode: 'add' | 'edit';
  editingRecord: MeetingRecord | null;
  openAdd: () => void;
  openEdit: (record: MeetingRecord) => void;
  closeForm: () => void;
};

export function useMeetingRecordFormState(): MeetingRecordFormState {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingRecord, setEditingRecord] = useState<MeetingRecord | null>(null);

  const openAdd = useCallback(() => {
    setFormMode('add');
    setEditingRecord(null);
    setIsFormOpen(true);
  }, []);

  const openEdit = useCallback((record: MeetingRecord) => {
    setFormMode('edit');
    setEditingRecord(record);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingRecord(null);
    setFormMode('add');
  }, []);

  return {
    isFormOpen,
    formMode,
    editingRecord,
    openAdd,
    openEdit,
    closeForm,
  };
}
