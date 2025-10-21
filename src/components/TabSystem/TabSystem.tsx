import React from 'react';
import { X, BookOpen, FileText } from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  type: 'book' | 'lore';
  isActive: boolean;
  lastSaved?: Date;
}

interface TabSystemProps {
  tabs: Tab[];
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  children: React.ReactNode;
}

export default function TabSystem({
  tabs,
  onTabChange,
  onTabClose,
  children,
}: TabSystemProps) {
  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose(tabId);
  };

  if (tabs.length === 0) {
    return (
      <div className="flex border-b border-gray-200 bg-gray-50 h-10">
        <div className="flex items-center px-4 text-sm text-gray-500">
          No documents open
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Custom Tab List */}
      <div className="flex border-b border-gray-200 bg-gray-50 h-10 flex-shrink-0">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`
              group flex items-center px-4 cursor-pointer border-r border-gray-200
              transition-colors duration-200 min-w-0 max-w-64 h-10
              ${tab.isActive 
                ? 'bg-white border-b-2 border-blue-500 text-gray-900 font-medium' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }
            `}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {tab.type === 'book' ? (
                <BookOpen className="w-4 h-4 flex-shrink-0" />
              ) : (
                <FileText className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-sm truncate">
                {tab.title}
              </span>
              {tab.lastSaved && (
                <span className="text-xs text-gray-400 truncate">
                  {tab.lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
            <button
              onClick={(e) => handleTabClose(e, tab.id)}
              className="ml-2 p-1 hover:bg-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Close tab"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
