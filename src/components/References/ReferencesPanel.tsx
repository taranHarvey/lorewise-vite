import { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  X,
  BookOpen,
  User,
  Globe,
  FileCode,
} from 'lucide-react';
import { referenceService, ReferenceDocument } from '../../services/referenceService';

interface ReferencesPanelProps {
  userId: string;
  seriesId?: string;
  documentId?: string;
  onClose?: () => void;
  onReferencesUpdate?: (activeRefs: ReferenceDocument[]) => void;
}

export default function ReferencesPanel({
  userId,
  seriesId,
  documentId,
  onClose,
  onReferencesUpdate,
}: ReferencesPanelProps) {
  const [references, setReferences] = useState<ReferenceDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadReferences();
  }, [userId, seriesId, documentId]);

  useEffect(() => {
    // Notify parent of active references
    const activeRefs = references.filter(ref => ref.isActive);
    onReferencesUpdate?.(activeRefs);
  }, [references, onReferencesUpdate]);

  const loadReferences = async () => {
    try {
      let refs: ReferenceDocument[] = [];
      
      if (documentId) {
        refs = await referenceService.getDocumentReferences(documentId);
      } else if (seriesId) {
        refs = await referenceService.getSeriesReferences(seriesId);
      } else {
        refs = await referenceService.getUserReferences(userId);
      }
      
      setReferences(refs);
    } catch (err) {
      console.error('Error loading references:', err);
      setError('Failed to load references');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const content = await referenceService.readFileContent(file);
      const fileType = file.name.endsWith('.md') ? 'md' : 
                      file.name.endsWith('.txt') ? 'txt' : 'plain';
      
      await referenceService.uploadReference(
        file.name,
        content,
        'other', // Default type, user can change later
        fileType,
        userId,
        seriesId,
        documentId
      );

      await loadReferences();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleToggleActive = async (referenceId: string, currentState: boolean) => {
    try {
      await referenceService.toggleReferenceActive(referenceId, !currentState);
      await loadReferences();
    } catch (err) {
      console.error('Error toggling reference:', err);
      setError('Failed to toggle reference');
    }
  };

  const handleDelete = async (referenceId: string) => {
    if (!confirm('Are you sure you want to delete this reference?')) {
      return;
    }

    try {
      await referenceService.deleteReference(referenceId);
      await loadReferences();
    } catch (err) {
      console.error('Error deleting reference:', err);
      setError('Failed to delete reference');
    }
  };

  const getTypeIcon = (type: ReferenceDocument['type']) => {
    switch (type) {
      case 'lore':
        return <BookOpen className="w-4 h-4" />;
      case 'character':
        return <User className="w-4 h-4" />;
      case 'world':
        return <Globe className="w-4 h-4" />;
      case 'summary':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileCode className="w-4 h-4" />;
    }
  };

  const activeReferences = references.filter(ref => ref.isActive);
  const inactiveReferences = references.filter(ref => !ref.isActive);

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">References</h2>
          <p className="text-sm text-gray-500">
            {activeReferences.length} active
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Upload Section */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? 'Uploading...' : 'Upload Reference'}
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Supported: .txt, .md files
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* References List */}
      <div className="flex-1 overflow-y-auto">
        {/* Active References */}
        {activeReferences.length > 0 && (
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Active in AI Context
            </h3>
            <div className="space-y-2">
              {activeReferences.map((ref) => (
                <ReferenceCard
                  key={ref.id}
                  reference={ref}
                  onToggle={handleToggleActive}
                  onDelete={handleDelete}
                  getTypeIcon={getTypeIcon}
                />
              ))}
            </div>
          </div>
        )}

        {/* Inactive References */}
        {inactiveReferences.length > 0 && (
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Inactive
            </h3>
            <div className="space-y-2 opacity-60">
              {inactiveReferences.map((ref) => (
                <ReferenceCard
                  key={ref.id}
                  reference={ref}
                  onToggle={handleToggleActive}
                  onDelete={handleDelete}
                  getTypeIcon={getTypeIcon}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {references.length === 0 && !isUploading && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm mb-2">No references yet</p>
            <p className="text-gray-400 text-xs">
              Upload reference documents to help AI maintain consistency
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ReferenceCardProps {
  reference: ReferenceDocument;
  onToggle: (id: string, currentState: boolean) => void;
  onDelete: (id: string) => void;
  getTypeIcon: (type: ReferenceDocument['type']) => JSX.Element;
}

function ReferenceCard({ reference, onToggle, onDelete, getTypeIcon }: ReferenceCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-2">
        <div className="text-gray-600 mt-0.5">
          {getTypeIcon(reference.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm text-gray-900 truncate">
              {reference.title}
            </h4>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onToggle(reference.id, reference.isActive)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title={reference.isActive ? 'Remove from AI context' : 'Add to AI context'}
              >
                {reference.isActive ? (
                  <Eye className="w-4 h-4 text-blue-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              <button
                onClick={() => onDelete(reference.id)}
                className="p-1 rounded hover:bg-red-50 transition-colors"
                title="Delete reference"
              >
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span className="px-1.5 py-0.5 bg-gray-100 rounded">
              {reference.type}
            </span>
            <span>{referenceService.formatFileSize(reference.size)}</span>
          </div>
          
          {expanded && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 max-h-32 overflow-y-auto">
              {reference.content.substring(0, 500)}
              {reference.content.length > 500 && '...'}
            </div>
          )}
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-700 mt-1"
          >
            {expanded ? 'Show less' : 'Show preview'}
          </button>
        </div>
      </div>
    </div>
  );
}

