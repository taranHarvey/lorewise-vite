import React from 'react';
import { Check, X, Info } from 'lucide-react';
import './DiffVisualization.scss';

export interface DiffChange {
  id: string;
  type: 'insert' | 'delete' | 'replace';
  from: number;
  to: number;
  newText?: string;
  oldText?: string;
  rationale?: string;
}

interface DiffVisualizationProps {
  changes: DiffChange[];
  onAccept: (changeId: string) => void;
  onReject: (changeId: string) => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  showRationale?: boolean;
}

/**
 * Component for visualizing AI-proposed changes with accept/reject controls
 * Displays changes in a list format with color-coded types
 */
export const DiffVisualization: React.FC<DiffVisualizationProps> = ({
  changes,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  showRationale = true,
}) => {
  if (changes.length === 0) {
    return null;
  }

  const getChangeTypeLabel = (type: DiffChange['type']): string => {
    switch (type) {
      case 'insert':
        return 'Addition';
      case 'delete':
        return 'Deletion';
      case 'replace':
        return 'Replacement';
      default:
        return 'Change';
    }
  };

  const getChangeTypeClass = (type: DiffChange['type']): string => {
    return `diff-change-type--${type}`;
  };

  return (
    <div className="diff-visualization">
      <div className="diff-visualization__header">
        <h3 className="diff-visualization__title">
          Proposed Changes ({changes.length})
        </h3>
        {changes.length > 1 && (
          <div className="diff-visualization__bulk-actions">
            {onAcceptAll && (
              <button
                className="diff-visualization__bulk-btn diff-visualization__bulk-btn--accept"
                onClick={onAcceptAll}
                title="Accept all changes"
              >
                <Check size={14} />
                Accept All
              </button>
            )}
            {onRejectAll && (
              <button
                className="diff-visualization__bulk-btn diff-visualization__bulk-btn--reject"
                onClick={onRejectAll}
                title="Reject all changes"
              >
                <X size={14} />
                Reject All
              </button>
            )}
          </div>
        )}
      </div>

      <div className="diff-visualization__changes">
        {changes.map((change, index) => (
          <div key={change.id} className="diff-change-card">
            <div className="diff-change-card__header">
              <span className={`diff-change-type ${getChangeTypeClass(change.type)}`}>
                {getChangeTypeLabel(change.type)}
              </span>
              <span className="diff-change-card__index">#{index + 1}</span>
            </div>

            <div className="diff-change-card__content">
              {change.type === 'delete' && change.oldText && (
                <div className="diff-change-card__text diff-change-card__text--old">
                  <span className="diff-change-card__label">Remove:</span>
                  <span className="diff-change-card__value">{change.oldText}</span>
                </div>
              )}

              {change.type === 'insert' && change.newText && (
                <div className="diff-change-card__text diff-change-card__text--new">
                  <span className="diff-change-card__label">Add:</span>
                  <span className="diff-change-card__value">{change.newText}</span>
                </div>
              )}

              {change.type === 'replace' && (
                <>
                  {change.oldText && (
                    <div className="diff-change-card__text diff-change-card__text--old">
                      <span className="diff-change-card__label">From:</span>
                      <span className="diff-change-card__value">{change.oldText}</span>
                    </div>
                  )}
                  {change.newText && (
                    <div className="diff-change-card__text diff-change-card__text--new">
                      <span className="diff-change-card__label">To:</span>
                      <span className="diff-change-card__value">{change.newText}</span>
                    </div>
                  )}
                </>
              )}

              {showRationale && change.rationale && (
                <div className="diff-change-card__rationale">
                  <Info size={14} className="diff-change-card__rationale-icon" />
                  <span className="diff-change-card__rationale-text">
                    {change.rationale}
                  </span>
                </div>
              )}
            </div>

            <div className="diff-change-card__actions">
              <button
                className="diff-change-card__btn diff-change-card__btn--reject"
                onClick={() => onReject(change.id)}
                title="Reject this change (Ctrl+Shift+R)"
              >
                <X size={16} />
                Reject
              </button>
              <button
                className="diff-change-card__btn diff-change-card__btn--accept"
                onClick={() => onAccept(change.id)}
                title="Accept this change (Ctrl+Shift+A)"
              >
                <Check size={16} />
                Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
