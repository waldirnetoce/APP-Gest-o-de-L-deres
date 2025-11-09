
import React, { useState, useMemo } from 'react';
import { User, getNotificationsForUser } from './api';
import { BellIcon, CloseIcon } from './components/icons';

interface NotificationBellProps {
  user: User;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useMemo(() => getNotificationsForUser(user), [user]);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20">
          <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"><CloseIcon /></button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
                notifications.map(notif => (
                    <div key={notif.id} className={`p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-100 dark:hover:bg-gray-700/50 ${!notif.read ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{notif.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{new Date(notif.timestamp).toLocaleString()}</p>
                    </div>
                ))
            ) : (
                <p className="p-4 text-center text-gray-500 dark:text-gray-500">Nenhuma notificação.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;