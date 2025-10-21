import { useState, useCallback } from 'react';

interface Tab {
  id: string;
  title: string;
  type: 'book' | 'lore';
  isActive: boolean;
  lastSaved?: Date;
  scrollPosition?: number;
}

export function useEditorTabs() {
  const [tabs, setTabs] = useState<Tab[]>([]);

  // Add a new tab
  const addTab = useCallback((id: string, title: string, type: 'book' | 'lore') => {
    setTabs(prevTabs => {
      // Check if tab already exists
      const existingTab = prevTabs.find(tab => tab.id === id);
      if (existingTab) {
        // Just activate the existing tab
        return prevTabs.map(tab => ({
          ...tab,
          isActive: tab.id === id
        }));
      }

      // Deactivate all existing tabs
      const deactivatedTabs = prevTabs.map(tab => ({ ...tab, isActive: false }));

      // Add new tab - only make it active if it's a book tab, or if there are no other tabs
      const newTab: Tab = {
        id,
        title,
        type,
        isActive: type === 'book' || deactivatedTabs.length === 0,
        lastSaved: new Date(),
      };

      return [...deactivatedTabs, newTab];
    });
  }, []);

  // Close a tab
  const closeTab = useCallback((tabId: string) => {
    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabId);
      
      // If we're closing the active tab, switch to another tab
      const closedTab = prevTabs.find(tab => tab.id === tabId);
      if (closedTab?.isActive && newTabs.length > 0) {
        // Activate the last tab (most recently added)
        const updatedTabs = newTabs.map((tab, index) => ({
          ...tab,
          isActive: index === newTabs.length - 1
        }));
        return updatedTabs;
      }
      
      return newTabs;
    });
  }, []);

  // Switch to a tab
  const switchToTab = useCallback((tabId: string) => {
    setTabs(prevTabs =>
      prevTabs.map(tab => ({
        ...tab,
        isActive: tab.id === tabId
      }))
    );
  }, []);

  // Update tab title
  const updateTabTitle = useCallback((tabId: string, newTitle: string) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId ? { ...tab, title: newTitle } : tab
      )
    );
  }, []);

  // Update tab save timestamp
  const updateTabSaveTime = useCallback((tabId: string, saveTime: Date) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId ? { ...tab, lastSaved: saveTime } : tab
      )
    );
  }, []);

  // Save scroll position for a tab
  const saveScrollPosition = useCallback((tabId: string, scrollPosition: number) => {
    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === tabId ? { ...tab, scrollPosition } : tab
      )
    );
  }, []);

  // Get scroll position for a tab
  const getScrollPosition = useCallback((tabId: string): number => {
    const tab = tabs.find(tab => tab.id === tabId);
    return tab?.scrollPosition || 0;
  }, [tabs]);

  // Get current active tab
  const activeTab = tabs.find(tab => tab.isActive) || null;

  // Close all tabs
  const closeAllTabs = useCallback(() => {
    setTabs([]);
  }, []);

  return {
    tabs,
    activeTab,
    addTab,
    closeTab,
    switchToTab,
    updateTabTitle,
    updateTabSaveTime,
    saveScrollPosition,
    getScrollPosition,
    closeAllTabs,
  };
}
