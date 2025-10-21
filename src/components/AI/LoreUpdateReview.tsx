import React, { useState } from 'react';
import { Check, X, BookOpen, AlertCircle } from 'lucide-react';
import type { LoreUpdate } from '../../services/loreExtractionService';
import './LoreUpdateReview.scss';

interface LoreUpdateReviewProps {
  updates: LoreUpdate[];
  summary: string;
  onAcceptAll: () => void;
  onDeclineAll: () => void;
  onAcceptSelected: (updateIndices: number[]) => void;
  onClose: () => void;
}

/**
 * Component for reviewing and accepting lore updates
 * Shows extracted lore information before adding to lore document
 */
export const LoreUpdateReview: React.FC<LoreUpdateReviewProps> = ({
  updates,
  summary,
  onAcceptAll,
  onDeclineAll,
  onAcceptSelected,
  onClose,
}) => {
  const [selectedUpdates, setSelectedUpdates] = useState<Set<number>>(
    new Set(updates.map((_, i) => i)) // All selected by default
  );

  const handleToggleUpdate = (index: number) => {
    const newSelected = new Set(selectedUpdates);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedUpdates(newSelected);
  };

  const handleAcceptSelected = () => {
    onAcceptSelected(Array.from(selectedUpdates));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'lore-update__priority--high';
      case 'medium':
        return 'lore-update__priority--medium';
      case 'low':
        return 'lore-update__priority--low';
      default:
        return '';
    }
  };

  if (updates.length === 0) {
    return null;
  }

  return (
    <div className="lore-update-overlay">
      <div className="lore-update-modal">
        {/* Header */}
        <div className="lore-update-modal__header">
          <div className="lore-update-modal__title">
            <BookOpen size={20} />
            <span>Lore Updates Detected</span>
          </div>
          <button className="lore-update-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Summary */}
        <div className="lore-update-modal__summary">
          <AlertCircle size={16} />
          <span>{summary}</span>
        </div>

        {/* Updates List */}
        <div className="lore-update-modal__content">
          <p className="lore-update-modal__instructions">
            Review the following updates that will be added to your lore document:
          </p>

          <div className="lore-update-list">
            {updates.map((update, index) => (
              <div
                key={index}
                className={`lore-update ${
                  selectedUpdates.has(index) ? 'lore-update--selected' : ''
                }`}
                onClick={() => handleToggleUpdate(index)}
              >
                <div className="lore-update__checkbox">
                  <input
                    type="checkbox"
                    checked={selectedUpdates.has(index)}
                    onChange={() => handleToggleUpdate(index)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="lore-update__content">
                  <div className="lore-update__header">
                    <span className="lore-update__section">
                      {update.section}
                      {update.subsection && ` › ${update.subsection}`}
                    </span>
                    <span className={`lore-update__priority ${getPriorityColor(update.priority)}`}>
                      {update.priority}
                    </span>
                  </div>

                  <div className="lore-update__text">{update.content}</div>

                  {update.rationale && (
                    <div className="lore-update__rationale">
                      <AlertCircle size={12} />
                      <span>{update.rationale}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="lore-update-modal__actions">
          <div className="lore-update-modal__selection-info">
            {selectedUpdates.size} of {updates.length} selected
          </div>

          <div className="lore-update-modal__buttons">
            <button className="lore-update-modal__btn lore-update-modal__btn--decline" onClick={onDeclineAll}>
              <X size={16} />
              Decline All
            </button>

            <button
              className="lore-update-modal__btn lore-update-modal__btn--accept"
              onClick={handleAcceptSelected}
              disabled={selectedUpdates.size === 0}
            >
              <Check size={16} />
              Accept Selected ({selectedUpdates.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
