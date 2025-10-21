import React, { useState } from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockNotifications } from '../../utils/mockData';
import { cn, formatDate, getNotificationTypeColor } from '../../utils/helpers';

type NavbarProps = {
  className?: string;
};

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadNotifications = mockNotifications.filter((notification) => !notification.read);
  const navigate = useNavigate();

  return (
    <div className={cn('flex h-16 items-center border-b border-gray-200 bg-white px-6', className)}>
      <div className="flex-1">
        {/* TODO: Add search */}
        <div className="relative w-64" style={{ display: 'none' }}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="h-10 w-full rounded-md border border-gray-300 bg-gray-50 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* TODO: Add notifications */}
        <div className="relative" style={{ display: 'none' }}>
          <button
            className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-md border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-200 p-3">
                <h3 className="font-medium">Notifications</h3>
                <button className="text-xs text-primary-600 hover:text-primary-800">Mark all as read</button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {mockNotifications.length > 0 ? (
                  mockNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'mb-2 rounded-md border p-3 transition-colors',
                        getNotificationTypeColor(notification.type),
                        notification.read ? 'opacity-70' : '',
                      )}
                    >
                      <div className="flex justify-between">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <span className="text-xs text-gray-500">{formatDate(notification.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-xs">{notification.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-sm text-gray-500">No notifications</p>
                )}
              </div>
              <div className="border-t border-gray-200 p-2">
                <button className="w-full rounded-md p-2 text-center text-sm text-primary-600 hover:bg-primary-50">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200"></div>

        <button
          onClick={() => navigate('/profile')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-800 hover:bg-primary-200 transition-colors cursor-pointer"
          aria-label="View profile"
        >
          <User className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Navbar;
