import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TiptapEditor from '../components/TiptapEditor/TiptapEditor';
import LoreEditor from '../components/LoreEditor/LoreEditor';
import TabSystem from '../components/TabSystem/TabSystem';
import { useEditorTabs } from '../hooks/useEditorTabs';
import { useAuth } from '../contexts/AuthContext';
import ResizableAIPanel from '../components/AI/ResizableAIPanel';
import EditorToolbar from '../components/TiptapEditor/EditorToolbar';
import LoreToolbar from '../components/LoreEditor/LoreToolbar';
import { 
  getDocument, 
  updateDocument, 
  getUserSeries, 
  getSeriesDocuments,
  getSeriesLore,
  createSeriesLore,
  updateSeriesLore
} from '../documentService';
import type { Series, SeriesLore } from '../documentService';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import '../components/TiptapEditor/editor.css';
import '../components/LoreEditor/lore-editor.css';


export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [document, setDocument] = useState<any>(null);
  const [title, setTitle] = useState('Untitled');
  const [content, setContent] = useState('<p></p>');
  const [loading, setLoading] = useState(true);
  const [currentSeries, setCurrentSeries] = useState<Series | null>(null);
  const [currentLore, setCurrentLore] = useState<SeriesLore | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(true);
  const [selectedText] = useState('');
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [loreStatus, setLoreStatus] = useState<{ isProcessing: boolean; message?: string }>({ isProcessing: false });

  // Tab management
  const {
    tabs,
    activeTab,
    addTab,
    closeTab,
    switchToTab,
    updateTabSaveTime,
    saveScrollPosition,
    getScrollPosition,
  } = useEditorTabs();

  useEffect(() => {
      const loadData = async () => {
        if (!user || !id) return;

      try {
        setLoading(true);
        
        // Load the document
        const doc = await getDocument(id);
        if (doc) {
          setDocument(doc);
          setTitle(doc.title || 'Untitled');
          setContent(doc.content || '<p></p>');
          
                 // Load the series that contains this document
                 const userSeries = await getUserSeries(user.uid);
                 const seriesWithDocuments = await Promise.all(
                   userSeries.map(async (s) => {
                     const seriesDocs = await getSeriesDocuments(s.id);
                     return {
                       series: s,
                       hasDocument: seriesDocs.some(d => d.id === id)
                     };
                   })
                 );
                 
                 const seriesWithDocument = seriesWithDocuments.find(s => s.hasDocument);
                 if (seriesWithDocument) {
                   setCurrentSeries(seriesWithDocument.series);
                   
                   // Load or create series lore
                   let lore = await getSeriesLore(seriesWithDocument.series.id);
                   if (!lore) {
                     // Create lore if it doesn't exist
                     await createSeriesLore(seriesWithDocument.series.id, user.uid);
                     lore = await getSeriesLore(seriesWithDocument.series.id);
                   }
                   if (lore) {
                     setCurrentLore(lore);
                   }
                   
                   // Initialize tabs - add lore tab first (inactive), then book tab (active)
                   if (lore) {
                     addTab(lore.id, 'Series Lore', 'lore');
                     console.log('Added lore tab:', lore.id);
                   }
                   addTab(doc.id, doc.title, 'book');
                   console.log('Added book tab:', doc.id, doc.title);
                     } else {
                       // Document not found in any series, redirect to dashboard
                       navigate('/dashboard');
                     }
            } else {
              // Document not found, redirect to dashboard
              navigate('/dashboard');
            }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, id, navigate]);

  const handleUpdate = async (newContent: string) => {
    setContent(newContent);
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new timeout for auto-save (2 seconds after user stops typing)
    const timeout = setTimeout(async () => {
      if (document && user) {
            try {
              await updateDocument(document.id, {
                content: newContent,
              });
            } catch (error) {
              console.error('Error auto-saving document:', error);
            }
      }
    }, 2000);
    
    setAutoSaveTimeout(timeout);
  };


  const handleAutoSave = async () => {
    if (document && user) {
      try {
        await updateDocument(document.id, {
          content,
          title,
        });
      } catch (error) {
        console.error('Error auto-saving document:', error);
      }
    }
  };

  const handleLoreSave = async () => {
    if (currentLore && user) {
      try {
        await updateSeriesLore(currentLore.id, {
          content: currentLore.content,
        });
        updateTabSaveTime(currentLore.id, new Date());
      } catch (error) {
        console.error('Error saving lore:', error);
      }
    }
  };

  const handleLoreAutoSave = async () => {
    if (currentLore && user) {
      try {
        await updateSeriesLore(currentLore.id, {
          content: currentLore.content,
        });
      } catch (error) {
        console.error('Error auto-saving lore:', error);
      }
    }
  };

  const handleLoreUpdate = (newContent: string) => {
    if (currentLore) {
      setCurrentLore({
        ...currentLore,
        content: newContent,
      });
    }
  };

  // Handle AI-triggered lore updates (with save)
  const handleAILoreUpdate = async (updatedLoreContent: string) => {
    if (currentLore && user) {
      try {
        // Update local state
        setCurrentLore({
          ...currentLore,
          content: updatedLoreContent,
        });

        // Save to database
        await updateSeriesLore(currentLore.id, {
          content: updatedLoreContent,
        });

        console.log('Lore updated successfully from AI');
      } catch (error) {
        console.error('Error updating lore from AI:', error);
        throw error; // Propagate error to show in chat
      }
    }
  };

  const handleTabChange = (tabId: string) => {
    console.log('Tab change requested:', tabId, 'Current active tab:', activeTab?.id);
    
    // Save current scroll position before switching
    if (activeTab && typeof window !== 'undefined' && window.document) {
      try {
        const scrollContainer = window.document.querySelector('.overflow-y-auto');
        if (scrollContainer) {
          const currentScrollTop = scrollContainer.scrollTop;
          console.log('Saving scroll position for tab', activeTab.id, ':', currentScrollTop);
          saveScrollPosition(activeTab.id, currentScrollTop);
        }
      } catch (error) {
        console.log('Error saving scroll position:', error);
      }
    }
    
    // Switch to the new tab
    switchToTab(tabId);
  };

  const handleTabClose = (tabId: string) => {
    closeTab(tabId);
    
    // If we close the last tab, navigate back to series
    if (tabs.length === 1) {
      if (currentSeries) {
        navigate(`/series/${currentSeries.id}`);
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
        // Set new timeout for auto-save title changes
        const timeout = setTimeout(async () => {
          if (document && user) {
            try {
              await updateDocument(document.id, {
                title: newTitle,
              });
            } catch (error) {
              console.error('Error auto-saving title:', error);
            }
          }
        }, 1000);
    
    setAutoSaveTimeout(timeout);
  };


  const handleBackToSeries = () => {
    if (currentSeries) {
      navigate(`/series/${currentSeries.id}`);
    } else {
      navigate('/dashboard');
    }
  };

  // Get surrounding text for AI context
  const getSurroundingText = () => {
    // This is a placeholder - in a real implementation, you'd get this from the editor
    return content.substring(0, 500);
  };


  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // Add scroll event listener to save scroll positions
  useEffect(() => {
    // Only set up scroll listener after component has mounted and activeTab is available
    if (!activeTab) return;

    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      // Debounce scroll saving to avoid too many updates
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (activeTab && typeof window !== 'undefined' && window.document) {
          try {
            // Look for the specific scroll container in the editor content
            const editorContainer = window.document.querySelector('.ProseMirror')?.parentElement;
            const scrollContainer = editorContainer?.querySelector('.overflow-y-auto') || 
                                  window.document.querySelector('.overflow-y-auto');
            
            if (scrollContainer) {
              saveScrollPosition(activeTab.id, scrollContainer.scrollTop);
            }
          } catch (error) {
            console.log('Error saving scroll position:', error);
          }
        }
      }, 100);
    };

    // Use a timeout to ensure DOM is ready
    const setupTimeout = setTimeout(() => {
      if (typeof window !== 'undefined' && window.document) {
        try {
          // Look for the specific scroll container in the editor content
          const editorContainer = window.document.querySelector('.ProseMirror')?.parentElement;
          const scrollContainer = editorContainer?.querySelector('.overflow-y-auto') || 
                                window.document.querySelector('.overflow-y-auto');
          
          if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
          }
        } catch (error) {
          console.log('Error setting up scroll listener:', error);
        }
      }
    }, 200);

    return () => {
      clearTimeout(setupTimeout);
      clearTimeout(scrollTimeout);
      if (typeof window !== 'undefined' && window.document) {
        try {
          // Look for the specific scroll container in the editor content
          const editorContainer = window.document.querySelector('.ProseMirror')?.parentElement;
          const scrollContainer = editorContainer?.querySelector('.overflow-y-auto') || 
                                window.document.querySelector('.overflow-y-auto');
          
          if (scrollContainer) {
            scrollContainer.removeEventListener('scroll', handleScroll);
          }
        } catch (error) {
          console.log('Error cleaning up scroll listener:', error);
        }
      }
    };
  }, [activeTab, saveScrollPosition]);

  // Restore scroll position when active tab changes
  useEffect(() => {
    if (!activeTab) return;

    const savedScrollPosition = getScrollPosition(activeTab.id);
    console.log('Active tab changed:', activeTab.type, activeTab.id, 'Saved scroll position:', savedScrollPosition);

    if (savedScrollPosition > 0) {
      // Use a very short timeout to ensure the content is rendered but before it becomes visible
      const restoreTimeout = setTimeout(() => {
        if (typeof window !== 'undefined' && window.document) {
          try {
            // Look for the specific scroll container in the editor content
            const editorContainer = window.document.querySelector('.ProseMirror')?.parentElement;
            const scrollContainer = editorContainer?.querySelector('.overflow-y-auto') || 
                                  window.document.querySelector('.overflow-y-auto');
            
            if (scrollContainer) {
              console.log('Restoring scroll position to:', savedScrollPosition);
              // Set scroll position immediately without animation
              scrollContainer.scrollTop = savedScrollPosition;
            } else {
              console.log('No scroll container found for restoration');
            }
          } catch (error) {
            console.log('Error restoring scroll position:', error);
          }
        }
      }, 10); // Very short delay to ensure DOM is ready

      return () => clearTimeout(restoreTimeout);
    }
  }, [activeTab, getScrollPosition]);

  // Debug active tab changes
  useEffect(() => {
    console.log('Active tab changed:', activeTab?.type, activeTab?.id, 'Available tabs:', tabs.length);
  }, [activeTab, tabs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading editor...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">Authentication required</div>
          <div className="text-gray-600">Please log in to access the editor.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Editor Area with Tabs */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar with Back Button and Formatting Tools */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToSeries}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                title="Back to series"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              
              {activeTab && (
                <>
                  {activeTab.type === 'book' ? (
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="text-lg font-semibold bg-transparent border-none outline-none text-gray-900 hover:bg-gray-50 px-2 py-1 rounded"
                      placeholder="Untitled Book"
                    />
                  ) : (
                    <h2 className="text-lg font-semibold text-gray-900">
                      Series Lore & Bible
                    </h2>
                  )}
                </>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Editor Toolbar - Show for all tabs */}
              {(activeTab?.type === 'book' && editorInstance) || (activeTab?.type === 'lore' && currentLore) ? (
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
                  {activeTab?.type === 'book' && editorInstance && (
                    <EditorToolbar
                      editor={editorInstance}
                      title={title}
                      onTitleChange={handleTitleChange}
                      showBackButton={false}
                    />
                  )}
                  {activeTab?.type === 'lore' && currentLore && (
                    <LoreToolbar />
                  )}
                </div>
              ) : null}
              
              {!isAIChatOpen && (
                <button
                  onClick={() => setIsAIChatOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Open AI Assistant"
                >
                  <MessageSquare className="w-4 h-4" />
                  AI Assistant
                </button>
              )}
            </div>
          </div>
        </div>

    {/* Main Content Area - Flex layout for editor and AI chat */}
    <div className="flex-1 flex overflow-hidden">
      {/* Tab System - Takes remaining space */}
      <div className="flex-1 flex flex-col min-w-[300px] flex-shrink">
        <TabSystem
          tabs={tabs}
          onTabChange={handleTabChange}
          onTabClose={handleTabClose}
        >
          <div className="flex-1 h-full overflow-hidden">
            {/* Main Editor Area */}
            {activeTab?.type === 'book' && (
            <TiptapEditor
              content={content}
              onUpdate={handleUpdate}
              onAutoSave={handleAutoSave}
              user={user}
              lore={currentLore}
              onEditorReady={setEditorInstance}
              loreStatus={loreStatus}
            />
            )}
            {activeTab?.type === 'lore' && currentLore && (
              <LoreEditor
                lore={currentLore}
                onUpdate={handleLoreUpdate}
                onSave={handleLoreSave}
                onAutoSave={handleLoreAutoSave}
                user={user}
              />
            )}
          </div>
        </TabSystem>
      </div>

      {/* Resizable AI Panel - Side by side */}
      <ResizableAIPanel
        lore={currentLore || undefined}
        selectedText={selectedText}
        surroundingText={getSurroundingText()}
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        className="flex-shrink-0 relative"
        documentId={document?.id}
        seriesId={currentSeries?.id}
        editor={editorInstance}
        fullDocumentText={content}
        onLoreUpdate={handleAILoreUpdate}
        onLoreStatusChange={setLoreStatus}
      />
    </div>
      </div>
    </div>
  );
}
