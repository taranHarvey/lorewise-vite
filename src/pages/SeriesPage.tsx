import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSeries, getSeriesDocuments, createDocument, deleteDocument } from '../documentService';
import type { Series, Document } from '../documentService';
import { Plus, ArrowLeft, BookOpen, FileText, Trash2, MoreVertical, ScrollText } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
}

export default function SeriesPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [series, setSeries] = useState<Series | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !seriesId) return;

      try {
        setLoading(true);
        
        // Load the series
        const seriesData = await getSeries(seriesId);
        if (seriesData) {
          setSeries(seriesData);
          
          // Load the documents for this series
          const documents = await getSeriesDocuments(seriesId);
          const seriesBooks: Book[] = documents.map(doc => ({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            lastModified: doc.updatedAt.toDate()
          }));
          setBooks(seriesBooks);
        } else {
          // Series not found, redirect to dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error loading series data:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, seriesId, navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Don't close if clicking on dropdown menu or three dots button
      if (openDropdown && !target.closest('.dropdown-menu') && !target.closest('.three-dots-button')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleNewBook = async () => {
    if (!series || !user) return;
    
    try {
      const newBookNumber = books.length + 1;
      const documentId = await createDocument(
        user.uid, 
        series.id, 
        `Book ${newBookNumber}: Untitled`
      );
      
      // Navigate to the new book
      navigate(`/editor/${documentId}`);
    } catch (error) {
      console.error('Error creating new book:', error);
    }
  };

  const handleBookClick = (book: Book) => {
    navigate(`/editor/${book.id}`);
  };

  const handleManageLore = () => {
    // Navigate to the first book in the series, which will open with both book and lore tabs
    if (books.length > 0) {
      navigate(`/editor/${books[0].id}`);
    } else {
      // If no books exist, create one and then navigate to it
      handleNewBook();
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      await deleteDocument(bookId);
      
      // Remove from local state
      setBooks(prev => prev.filter(book => book.id !== bookId));
      
      // Close any open dropdowns
      setOpenDropdown(null);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading series...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">Authentication required</div>
          <div className="text-gray-600">Please log in to access the series.</div>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">Series not found</div>
          <div className="text-gray-600">The series you're looking for doesn't exist.</div>
          <button
            onClick={handleBackToDashboard}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{series.title}</h1>
                {series.description && (
                  <p className="text-sm text-gray-600">{series.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleManageLore}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ScrollText className="w-4 h-4" />
                Manage Lore
              </button>
              <button
                onClick={handleNewBook}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Book
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Series Overview</h2>
          </div>
          
          {/* Series Lore Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900 flex items-center gap-2">
                <ScrollText className="w-5 h-5" />
                Series Lore & Bible
              </h3>
              <button
                onClick={handleManageLore}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Edit →
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Document your world-building, character details, plot points, and any other important information for this series. 
              This lore will be available when writing and can be referenced by the AI assistant.
            </p>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Books in this series</h2>
            <p className="text-sm text-gray-600">
              Click on a book to open it, or create a new book to get started.
            </p>
          </div>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No books yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first book in this series.
            </p>
            <button
              onClick={handleNewBook}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create First Book
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => handleBookClick(book)}
                  >
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{book.title}</h3>
                      <p className="text-sm text-gray-500">
                        Last modified {book.lastModified.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Three dots menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === book.id ? null : book.id);
                      }}
                      className="three-dots-button p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {openDropdown === book.id && (
                      <div 
                        className="dropdown-menu absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Delete button clicked for book:', book.id);
                            setShowDeleteConfirm(book.id);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div 
                  className="text-sm text-gray-600 cursor-pointer"
                  onClick={() => handleBookClick(book)}
                >
                  <p>Click to open and edit</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteConfirm(null);
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Book</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this book? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  console.log('Cancel clicked');
                  setShowDeleteConfirm(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Delete confirmed for book:', showDeleteConfirm);
                  handleDeleteBook(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
