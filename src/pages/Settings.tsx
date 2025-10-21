import { useAuth } from '../contexts/AuthContext';
import { BookOpen, User, Mail, LogOut, ArrowLeft, Settings as SettingsIcon, Trash2, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { deleteAllUserData } from '../documentService';

export default function Settings() {
  const { user, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // First delete all user data
      await deleteAllUserData(user.uid);
      
      // Then delete the user account
      await deleteAccount();
      
      // Navigate to landing page
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50">
      {/* Enhanced Header */}
      <header className="glass border-b border-secondary-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="btn-ghost btn-sm p-2">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <BookOpen className="h-8 w-8 text-primary-600" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-2xl font-bold text-gradient">Lorewise</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-secondary-600" />
              <span className="text-lg font-semibold text-secondary-900">Settings</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-secondary-900 mb-2">Settings</h1>
          <p className="text-lg text-secondary-600">Manage your account preferences and settings</p>
        </div>

        <div className="grid gap-6 animate-fade-in-up animation-delay-200">
          {/* Account Information */}
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-secondary-900">Account Information</h2>
                <p className="text-sm text-secondary-600">Your account details and profile information</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="label">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <div className="p-3 bg-secondary-50 rounded-lg border border-secondary-200">
                  <p className="text-sm font-medium text-secondary-900">{user?.email}</p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-secondary-200">
                <button
                  onClick={logout}
                  className="btn btn-outline text-error-600 border-error-300 hover:bg-error-50 hover:border-error-400 focus:ring-error-500 group"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card p-6 border-2 border-error-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-error-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-error-900">Danger Zone</h2>
                <p className="text-sm text-error-600">Irreversible and destructive actions</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-error-50 rounded-lg border border-error-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Trash2 className="w-5 h-5 text-error-600" />
                    <div>
                      <p className="font-medium text-error-900">Delete Account</p>
                      <p className="text-sm text-error-600">
                        Permanently delete your account and all your data. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="btn bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-4 py-2 font-medium transition-colors"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="card p-6 border-dashed border-2 border-secondary-200">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SettingsIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary-900 mb-2">More Settings Coming Soon</h3>
              <p className="text-secondary-600 mb-4">
                We're working on adding more customization options for your writing experience.
              </p>
              <div className="inline-flex items-center space-x-2 text-sm text-secondary-500">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                <span>In development</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-error-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error-600" />
              </div>
              <h3 className="text-xl font-bold text-error-900">Delete Account</h3>
            </div>
            
            <p className="text-secondary-600 mb-6">
              Are you sure you want to delete your account? This will permanently remove:
            </p>
            
            <ul className="list-disc list-inside text-sm text-secondary-600 mb-6 space-y-1">
              <li>All your novel series</li>
              <li>All your documents and chapters</li>
              <li>Your account and profile</li>
              <li>All associated data</li>
            </ul>
            
            <p className="text-error-600 font-medium mb-6">
              This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 btn btn-outline text-secondary-600 border-secondary-300 hover:bg-secondary-50 hover:border-secondary-400 focus:ring-secondary-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 btn bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-4 py-2 font-medium transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
