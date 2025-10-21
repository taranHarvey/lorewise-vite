import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, BookOpen, Settings, User, LogOut, Sparkles, Calendar, FileText, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUserSeries, getUserDocuments, getSeriesDocumentCount, updateSeries, deleteSeries, createSeries, createDocument, getSeriesDocuments } from '../documentService';
import type { Series } from '../documentService';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [seriesCount, setSeriesCount] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<Series[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [seriesDocumentCounts, setSeriesDocumentCounts] = useState<Record<string, number>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNewSeries = async () => {
    if (isNavigating || !user) return;
    
    setIsNavigating(true);
    
    try {
      // Create a new series
      const seriesId = await createSeries(user.uid, 'My New Series', 'Start your writing journey here');
      
      // Navigate to the series page
      navigate(`/series/${seriesId}`);
      
      // Reset loading state after navigation
      setIsNavigating(false);
    } catch (error) {
      console.error('Error creating new series:', error);
      setIsNavigating(false);
    }
  };

  const handleSeriesClick = (seriesId: string) => {
    // Navigate to the series page
    navigate(`/series/${seriesId}`);
  };

  const filteredSeries = series.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDropdownToggle = (seriesId: string) => {
    setOpenDropdown(openDropdown === seriesId ? null : seriesId);
  };

  const handleEditSeries = (seriesItem: Series) => {
    setEditingSeries(seriesItem);
    setOpenDropdown(null);
  };

  const handleSaveEdit = async (updatedSeries: Series) => {
    if (!user) return;
    
    try {
      await updateSeries(updatedSeries.id, {
        title: updatedSeries.title,
        description: updatedSeries.description,
      });
      
      // Update local state
      setSeries(prev => prev.map(s => 
        s.id === updatedSeries.id ? updatedSeries : s
      ));
      setEditingSeries(null);
    } catch (error) {
      console.error('Error updating series:', error);
    }
  };

  const handleDeleteSeries = async (seriesId: string) => {
    if (!user) return;
    
    try {
      await deleteSeries(seriesId);
      
      // Update local state
      setSeries(prev => prev.filter(s => s.id !== seriesId));
      setSeriesCount(prev => prev - 1);
      setShowDeleteConfirm(null);
      setOpenDropdown(null);
    } catch (error) {
      console.error('Error deleting series:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const [userSeries, documents] = await Promise.all([
          getUserSeries(user.uid),
          getUserDocuments(user.uid)
        ]);
        
        setSeries(userSeries);
        setSeriesCount(userSeries.length);
        setDocumentsCount(documents.length);
        
        // Get document counts for each series
        const documentCounts: Record<string, number> = {};
        for (const seriesItem of userSeries) {
          const count = await getSeriesDocumentCount(seriesItem.id);
          documentCounts[seriesItem.id] = count;
        }
        setSeriesDocumentCounts(documentCounts);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50">
      {/* Enhanced Header */}
      <header className="glass border-b border-secondary-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <BookOpen className="h-8 w-8 text-primary-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-2xl font-bold text-gradient">Lorewise</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-secondary-900">Welcome back</p>
                  <p className="text-xs text-secondary-600 truncate max-w-32">{user?.email}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Link
                  to="/settings"
                  className="btn-ghost btn-sm p-2"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
                <button
                  onClick={logout}
                  className="btn-ghost btn-sm p-2 text-secondary-600 hover:text-error-600"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center space-x-3 mb-4">
            <Sparkles className="w-6 h-6 text-primary-600" />
            <h1 className="text-4xl font-bold text-secondary-900">Your Writing Dashboard</h1>
          </div>
          <p className="text-lg text-secondary-600 max-w-2xl">
            Manage your novel series, track your progress, and continue your creative journey.
          </p>
        </div>

        {/* Search and New Series */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in-up animation-delay-200">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search your series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12 h-12"
            />
          </div>
            <button
              onClick={handleNewSeries}
              disabled={isNavigating}
              className="btn-primary group disabled:opacity-50 disabled:cursor-not-allowed rounded-xl h-12 px-4 text-sm font-medium"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span>{isNavigating ? 'Creating...' : 'New Series'}</span>
            </button>
        </div>

        {/* Series Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-400">
          {/* Empty state when no series exist */}
          {filteredSeries.length === 0 && !loading && (
            <div className="col-span-full">
              <div className="card p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-secondary-900 mb-3">
                  {searchQuery ? 'No series found' : 'Ready to start your first series?'}
                </h3>
                <p className="text-secondary-600 mb-8 max-w-md mx-auto leading-relaxed">
                  {searchQuery 
                    ? 'Try adjusting your search terms or create a new series.'
                    : 'Create your first novel series and begin your writing journey. Our AI-powered platform will help you stay consistent across all your stories.'
                  }
                </p>
                <button
                  onClick={handleNewSeries}
                  disabled={isNavigating}
                  className="btn-primary btn-xl group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-5 h-5 group-hover:animate-bounce-gentle" />
                  <span>{isNavigating ? 'Creating...' : 'Create Your First Series'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Series Cards */}
          {filteredSeries.map((seriesItem) => (
            <div key={seriesItem.id} className="card-hover p-6 group relative">
              <div 
                onClick={() => handleSeriesClick(seriesItem.id)}
                className={`cursor-pointer ${isNavigating ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-secondary-900 mb-2 group-hover:text-primary-700 transition-colors">
                    {seriesItem.title}
                  </h3>
                  <p className="text-secondary-600 text-sm leading-relaxed">
                    {seriesItem.description || 'No description available'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between text-sm text-secondary-500">
                  <span>Created {seriesItem.createdAt.toDate().toLocaleDateString()}</span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>{seriesDocumentCounts[seriesItem.id] || 0} chapters</span>
                  </span>
                </div>
              </div>

              {/* Three dots menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDropdownToggle(seriesItem.id);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>

                {/* Dropdown Menu */}
                {openDropdown === seriesItem.id && (
                  <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeriesClick(seriesItem.id);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Eye className="w-4 h-4 mr-3" />
                        Open in Editor
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSeries(seriesItem);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4 mr-3" />
                        Edit Series
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(seriesItem.id);
                          setOpenDropdown(null);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-3" />
                        Delete Series
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Placeholder for future series */}
          {/* <div className="card-hover p-6 group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-secondary-900 mb-2 group-hover:text-primary-700 transition-colors">
                  Sample Series
                </h3>
                <p className="text-secondary-600 text-sm mb-4 leading-relaxed">
                  A fantasy adventure series about magical realms and epic quests
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-secondary-500">
                <span className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>3 chapters</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>2 days ago</span>
                </span>
              </div>
              <button className="btn-primary btn-sm">
                Open Series
              </button>
            </div>
          </div> */}
        </div>
      </main>

      {/* Edit Series Modal */}
      {editingSeries && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Series</h3>
            <EditSeriesForm
              series={editingSeries}
              onSave={handleSaveEdit}
              onCancel={() => setEditingSeries(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Series</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this series? This action cannot be undone and will delete all chapters within this series.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSeries(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Series
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Edit Series Form Component
function EditSeriesForm({ 
  series, 
  onSave, 
  onCancel 
}: { 
  series: Series; 
  onSave: (updatedSeries: Series) => void; 
  onCancel: () => void; 
}) {
  const [title, setTitle] = useState(series.title);
  const [description, setDescription] = useState(series.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...series,
      title,
      description,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Series Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Describe your series..."
        />
      </div>
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}
