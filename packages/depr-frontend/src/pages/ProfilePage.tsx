import { LogOut, Mail, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthentication } from '../hooks/useAuthentication';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';

/**
 * Profile page displays user information and account management options
 * Designed to be easily extensible for additional profile fields and settings
 */
const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthentication();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-gray-500">Manage your account information and settings</p>
      </div>

      {/* User Information Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-800">
              <UserIcon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
              <p className="text-sm text-gray-500">Your personal details and contact information</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Email Field */}
            <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <p className="text-sm text-gray-900 mt-1">{user.email}</p>
              </div>
            </div>

            {/* Placeholder sections for future profile fields */}
            {/* Uncomment and implement when ready
            <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
              <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <p className="text-sm text-gray-900 mt-1">{user.firstName || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
              <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700">Last Name</label>
                <p className="text-sm text-gray-900 mt-1">{user.lastName || 'Not set'}</p>
              </div>
            </div>
            */}
          </div>
        </div>
      </Card>

      {/* Settings Section - Placeholder for future settings */}
      {/* Uncomment when ready to add settings
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-700">Notifications</p>
                <p className="text-xs text-gray-500">Manage email and push notifications</p>
              </div>
              <Button variant="secondary" size="sm">Configure</Button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-700">Privacy</p>
                <p className="text-xs text-gray-500">Control your data and privacy settings</p>
              </div>
              <Button variant="secondary" size="sm">Manage</Button>
            </div>
          </div>
        </div>
      </Card>
      */}

      {/* Account Actions Section */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h2>
          <div className="space-y-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              leftIcon={<LogOut className="h-4 w-4" />}
              className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              Log Out
            </Button>
            <p className="text-xs text-gray-500">
              Signing out will end your current session and you will need to log in again to access your account.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;