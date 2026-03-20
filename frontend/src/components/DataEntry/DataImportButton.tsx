import { Upload } from 'lucide-react';
import { useState } from 'react';
import DataImportWizard from './DataImportWizard';

/**
 * DataImportButton Component
 * Simple button that opens the import wizard
 * Can be added to any module's toolbar or header
 */
const DataImportButton = ({ moduleName, onImportComplete, className = '' }) => {
  //   console.log('🚀 ~ DataImportButton ~ onImportComplete:', onImportComplete);
  //   console.log('🚀 ~ DataImportButton ~ moduleName:', moduleName);
  const [showWizard, setShowWizard] = useState(false);

  const handleImportComplete = (result) => {
    setShowWizard(false);
    onImportComplete?.(result);
  };

  return (
    <>
      <button
        onClick={() => setShowWizard(true)}
        className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:cursor-pointer transition-colors border-0 ${className}`}
      >
        <Upload size={18} className="mr-2" />
        Import Data
      </button>

      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <DataImportWizard
              moduleName={moduleName}
              onImportComplete={handleImportComplete}
              onCancel={() => setShowWizard(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default DataImportButton;
