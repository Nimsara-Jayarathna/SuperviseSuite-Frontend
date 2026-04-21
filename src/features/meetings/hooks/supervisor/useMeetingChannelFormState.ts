import { useCallback, useState } from 'react';
import type { MeetingChannel } from '../../types';

type MeetingChannelFormState = {
  isFormOpen: boolean;
  formMode: 'add' | 'edit';
  editingChannel: MeetingChannel | null;
  pendingDelete: MeetingChannel | null;
  openAdd: () => void;
  openEdit: (channel: MeetingChannel) => void;
  closeForm: () => void;
  openDelete: (channel: MeetingChannel) => void;
  closeDelete: () => void;
};

export function useMeetingChannelFormState(): MeetingChannelFormState {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingChannel, setEditingChannel] = useState<MeetingChannel | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MeetingChannel | null>(null);

  const openAdd = useCallback(() => {
    setFormMode('add');
    setEditingChannel(null);
    setIsFormOpen(true);
  }, []);

  const openEdit = useCallback((channel: MeetingChannel) => {
    setFormMode('edit');
    setEditingChannel(channel);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingChannel(null);
    setFormMode('add');
  }, []);

  const openDelete = useCallback((channel: MeetingChannel) => {
    setPendingDelete(channel);
  }, []);

  const closeDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  return {
    isFormOpen,
    formMode,
    editingChannel,
    pendingDelete,
    openAdd,
    openEdit,
    closeForm,
    openDelete,
    closeDelete,
  };
}
