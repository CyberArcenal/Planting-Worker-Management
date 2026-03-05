// src/renderer/pages/notifications/hooks/useNotificationView.ts
import { useState } from 'react';
import { showError } from '../../../utils/notification';
import notificationAPI, {type Notification} from '../../../api/core/notifications';

export const useNotificationView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  const open = async (id: number) => {
    setIsOpen(true);
    setLoading(true);
    try {
      const response = await notificationAPI.getById(id);
      if (!response.status) throw new Error(response.message);
      setNotification(response.data);
    } catch (err: any) {
      showError(err.message || 'Failed to load notification');
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    setNotification(null);
  };

  return {
    isOpen,
    loading,
    notification,
    open,
    close,
  };
};