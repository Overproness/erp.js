import { API_BASE_URL } from '@/config/serverApiConfig';
import apolloClient from '@/graphql/client';
import { DATA_ENTRY_IMPORT_FROM_URL, DATA_ENTRY_VALIDATE, DATA_ENTRY_SAVE } from '@/graphql/operations/misc';
import storePersist from '@/redux/storePersist';
import {
  AlertTriangle,
  CheckCircle,
  FileImage,
  FileSpreadsheet,
  Info,
  Link,
  Loader,
  Upload,
  XCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';

// Module-specific data format guides
const MODULE_GUIDES = {
  client: {
    title: 'Client/Customer Data',
    description: 'Import customer or client contact information',
    requiredFields: ['Name', 'Email', 'Phone'],
    optionalFields: ['Address', 'Country', 'Customer Type', 'Industry', 'Company Size', 'Tags'],
    exampleData: {
      Name: 'Acme Corporation',
      Email: 'contact@acme.com',
      Phone: '+1-555-0100',
      Address: '123 Business St',
      Country: 'United States',
      'Customer Type': 'company',
      Industry: 'Technology',
      'Company Size': 'Medium',
    },
    tips: [
      'Customer Type should be "individual" or "company"',
      'Company Size should be "Small", "Medium", or "Large"',
      'Email addresses will be validated',
    ],
  },
  quote: {
    title: 'Quote/Estimate Data',
    description: 'Import sales quotes or estimates with line items',
    requiredFields: ['Client Name', 'Quote Date', 'Expiry Date', 'Items'],
    optionalFields: ['Description', 'Tax Rate', 'Subtotal', 'Tax Total', 'Total'],
    exampleData: {
      'Client Name': 'Acme Corporation',
      'Quote Date': '2024-01-15',
      'Expiry Date': '2024-02-15',
      'Item Name': 'Website Development',
      Quantity: '1',
      Price: '5000',
      Total: '5000',
    },
    tips: [
      'Dates should be in YYYY-MM-DD format',
      'For multiple items, use separate rows with the same quote details',
      'Total = Quantity × Price for each line item',
      'Tax calculations will be automatic if Tax Rate is provided',
    ],
  },
  invoice: {
    title: 'Invoice Data',
    description: 'Import invoices with billing details and line items',
    requiredFields: ['Client Name', 'Invoice Date', 'Due Date', 'Items'],
    optionalFields: ['Description', 'Tax Rate', 'Subtotal', 'Tax Total', 'Total'],
    exampleData: {
      'Client Name': 'Acme Corporation',
      'Invoice Date': '2024-01-15',
      'Due Date': '2024-02-15',
      'Item Name': 'Consulting Services',
      Quantity: '10',
      Price: '150',
      Total: '1500',
    },
    tips: [
      'Dates should be in YYYY-MM-DD format',
      'Due Date must be after Invoice Date',
      'For multiple items, use separate rows with the same invoice details',
      'System will auto-calculate totals if not provided',
    ],
  },
  payment: {
    title: 'Payment Data',
    description: 'Import payment transactions and records',
    requiredFields: ['Client Name', 'Invoice Reference', 'Payment Date', 'Amount'],
    optionalFields: ['Currency', 'Payment Method', 'Reference Number', 'Description'],
    exampleData: {
      'Client Name': 'Acme Corporation',
      'Invoice Reference': 'INV-001',
      'Payment Date': '2024-01-20',
      Amount: '1500',
      Currency: 'USD',
      'Payment Method': 'Bank Transfer',
    },
    tips: [
      'Currency defaults to USD if not specified',
      'Payment Date should be in YYYY-MM-DD format',
      'Amount should be a positive number',
      'Reference Number is optional but recommended for tracking',
    ],
  },
  paymentMode: {
    title: 'Payment Method Data',
    description: 'Import available payment methods',
    requiredFields: ['Name'],
    optionalFields: ['Description', 'Enabled'],
    exampleData: {
      Name: 'Credit Card',
      Description: 'Visa, Mastercard, Amex',
      Enabled: 'true',
    },
    tips: ['Enabled should be "true" or "false"', 'Name should be unique'],
  },
  taxes: {
    title: 'Tax Configuration Data',
    description: 'Import tax rates and configurations',
    requiredFields: ['Tax Name', 'Tax Rate'],
    optionalFields: ['Description', 'Enabled'],
    exampleData: {
      'Tax Name': 'Sales Tax',
      'Tax Rate': '8.5',
      Description: 'State sales tax',
      Enabled: 'true',
    },
    tips: [
      'Tax Rate should be a percentage (e.g., 8.5 for 8.5%)',
      'Enabled should be "true" or "false"',
    ],
  },
  lead: {
    title: 'Follow-up/Lead Management Data',
    description: 'Import leads and follow-up tasks for sales pipeline',
    requiredFields: ['Name', 'Email', 'Status'],
    optionalFields: [
      'Phone',
      'Company',
      'Source',
      'Assigned To',
      'Notes',
      'Priority',
      'Expected Close Date',
    ],
    exampleData: {
      Name: 'John Smith',
      Email: 'john.smith@example.com',
      Phone: '+1-555-0123',
      Company: 'Tech Solutions Inc',
      Status: 'new',
      Source: 'Website',
      Priority: 'high',
    },
    tips: [
      'Status can be: "new", "contacted", "qualified", "proposal", "won", "lost"',
      'Priority should be: "low", "medium", or "high"',
      'Expected Close Date should be in YYYY-MM-DD format',
      'Source indicates where the lead came from (e.g., Website, Referral, Cold Call)',
    ],
  },
  followUp: {
    title: 'Follow-up/Lead Management Data',
    description: 'Import leads and follow-up tasks for sales pipeline',
    requiredFields: ['Name', 'Email', 'Status'],
    optionalFields: [
      'Phone',
      'Company',
      'Source',
      'Assigned To',
      'Notes',
      'Priority',
      'Expected Close Date',
    ],
    exampleData: {
      Name: 'John Smith',
      Email: 'john.smith@example.com',
      Phone: '+1-555-0123',
      Company: 'Tech Solutions Inc',
      Status: 'new',
      Source: 'Website',
      Priority: 'high',
    },
    tips: [
      'Status can be: "new", "contacted", "qualified", "proposal", "won", "lost"',
      'Priority should be: "low", "medium", or "high"',
      'Expected Close Date should be in YYYY-MM-DD format',
      'Source indicates where the lead came from (e.g., Website, Referral, Cold Call)',
    ],
  },
  url: {
    title: 'URL/Link Data',
    description: 'Import URLs or web links with metadata',
    requiredFields: ['URL', 'Title'],
    optionalFields: ['Description', 'Category', 'Tags', 'Notes'],
    exampleData: {
      URL: 'https://example.com/resource',
      Title: 'Important Resource',
      Description: 'Documentation for API',
      Category: 'Development',
      Tags: 'api, docs',
    },
    tips: [
      'URLs must be valid and start with http:// or https://',
      'Tags can be comma-separated',
      'Category helps organize URLs into groups',
    ],
  },
  task: {
    title: 'Task Management Data',
    description: 'Import tasks, to-dos, and action items',
    requiredFields: ['Title', 'Status'],
    optionalFields: [
      'Description',
      'Assigned To',
      'Due Date',
      'Priority',
      'Project',
      'Tags',
      'Estimated Hours',
    ],
    exampleData: {
      Title: 'Complete project proposal',
      Description: 'Draft and review proposal for client',
      'Assigned To': 'john.doe@example.com',
      'Due Date': '2024-01-30',
      Priority: 'high',
      Status: 'in-progress',
      Project: 'Client Onboarding',
    },
    tips: [
      'Status can be: "pending", "in-progress", "completed", "cancelled"',
      'Priority should be: "low", "medium", or "high"',
      'Due Date should be in YYYY-MM-DD format',
      'Assigned To should be a user email or name',
      'Estimated Hours should be a number',
    ],
  },
  appointment: {
    title: 'Appointment/Meeting Data',
    description: 'Import appointments, meetings, and scheduled events',
    requiredFields: ['Title', 'Start Date', 'Start Time'],
    optionalFields: [
      'End Date',
      'End Time',
      'Location',
      'Attendees',
      'Description',
      'Type',
      'Status',
    ],
    exampleData: {
      Title: 'Client Meeting',
      'Start Date': '2024-01-20',
      'Start Time': '10:00',
      'End Date': '2024-01-20',
      'End Time': '11:00',
      Location: 'Conference Room A',
      Attendees: 'john@example.com, jane@example.com',
      Type: 'meeting',
    },
    tips: [
      'Start/End Date should be in YYYY-MM-DD format',
      'Start/End Time should be in HH:MM format (24-hour)',
      'Attendees can be comma-separated email addresses',
      'Type can be: "meeting", "call", "video-conference", "appointment"',
      'Status can be: "scheduled", "confirmed", "cancelled", "completed"',
      'If End Date is omitted, it defaults to Start Date',
    ],
  },
};

/**
 * DataImportWizard Component
 * Unified component for importing data via OCR, Spreadsheet, or URL
 * Can be used across all modules (Customers, Quotes, Invoices, etc.)
 */
const DataImportWizard = ({ moduleName, onImportComplete, onCancel, className = '' }) => {
  const [step, setStep] = useState(1); // 1: Method Selection, 2: Upload/Input, 3: Preview/Validate, 4: Confirm
  const [importMethod, setImportMethod] = useState(null); // 'ocr', 'spreadsheet', 'url'
  const [files, setFiles] = useState([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [error, setError] = useState(null);

  // Step 1: Select import method
  const importMethods = [
    {
      id: 'ocr',
      name: 'OCR - Image/PDF',
      icon: FileImage,
      description: 'Extract data from images, scanned documents, or PDFs',
      acceptedFormats: '.jpg,.jpeg,.png,.pdf',
    },
    {
      id: 'spreadsheet',
      name: 'Spreadsheet',
      icon: FileSpreadsheet,
      description: 'Import from CSV or Excel files with automatic column mapping',
      acceptedFormats: '.csv,.xlsx,.xls',
    },
    {
      id: 'url',
      name: 'URL Import',
      icon: Link,
      description: 'Extract data from website URLs or API endpoints',
      acceptedFormats: null,
    },
  ];

  // Handle file selection
  const handleFileChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError(null);
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    setError(null);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Process OCR import
  const processOCR = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Processing OCR with files:', files);
      console.log('Files array length:', files.length);

      if (!files || files.length === 0) {
        setError('No files selected');
        setLoading(false);
        return;
      }

      console.log('File object:', files[0]);
      console.log('File details:', {
        name: files[0]?.name,
        size: files[0]?.size,
        type: files[0]?.type,
      });

      const authData = storePersist.get('auth');
      const token = authData?.current?.token;

      const formData = new FormData();

      if (files.length === 1) {
        // Single file
        formData.append('file', files[0]);
        console.log('FormData created, checking entries...');

        // Debug: Check FormData contents
        for (let pair of formData.entries()) {
          console.log('FormData entry:', pair[0], typeof pair[1], pair[1]);
        }

        console.log('Making POST request to:', `${API_BASE_URL}data-entry/ocr/${moduleName}`);
        console.log('Auth token:', token ? 'Present' : 'Missing');

        const axios = (await import('axios')).default;
        // Use global axios instance which has proper transformRequest handling
        const response = await axios.post(`${API_BASE_URL}data-entry/ocr/${moduleName}`, formData, {
          headers: {
            // Don't set Content-Type, let axios set it with boundary
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.data.success) {
          setExtractedData([response.data.data]);
          setStep(3);
        } else {
          setError(response.data.error || 'OCR extraction failed');
        }
      } else {
        // Batch processing
        files.forEach((file) => formData.append('files', file));

        const axiosBatch = (await import('axios')).default;
        const response = await axiosBatch.post(
          `${API_BASE_URL}data-entry/ocr/${moduleName}/batch`,
          formData,
          {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );

        if (response.data.success) {
          const successfulExtractions = response.data.results
            .filter((r) => r.success)
            .map((r) => r.data);
          setExtractedData(successfulExtractions);
          setStep(3);
        } else {
          setError(response.data.error || 'OCR extraction failed');
        }
      }
    } catch (err) {
      console.error('OCR error:', err);
      setError(err.response?.data?.error || 'Failed to process files');
    } finally {
      setLoading(false);
    }
  };

  // Process spreadsheet import
  const processSpreadsheet = async () => {
    setLoading(true);
    setError(null);

    try {
      const authData = storePersist.get('auth');
      const token = authData?.current?.token;

      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append(
        'options',
        JSON.stringify({
          autoMap: true,
          validateRows: true,
          useAI: true,
        })
      );

      const axios = (await import('axios')).default;
      const response = await axios.post(
        `${API_BASE_URL}data-entry/spreadsheet/${moduleName}`,
        formData,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      console.log('Spreadsheet response:', response.data);

      if (response.data.success) {
        // Extract valid data from response
        const validData = response.data.data
          .filter((item) => item && item.data)
          .map((item) => item.data);

        console.log('Valid data extracted:', validData);
        console.log('Total rows:', response.data.totalRows);
        console.log('Valid rows:', response.data.validRows);
        console.log('Invalid rows:', response.data.invalidRows);

        if (validData.length === 0) {
          setError(`No valid data found. ${response.data.invalidRows} rows had errors.`);
          setValidationResults(response.data);
          return;
        }

        setExtractedData(validData);
        setValidationResults(response.data);
        setStep(3);
      } else {
        setError(response.data.error || 'Spreadsheet import failed');
      }
    } catch (err) {
      console.error('Spreadsheet error:', err);
      setError(err.response?.data?.error || 'Failed to process spreadsheet');
    } finally {
      setLoading(false);
    }
  };

  // Process URL import
  const processURL = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await apolloClient.mutate({
        mutation: DATA_ENTRY_IMPORT_FROM_URL,
        variables: {
          url: url,
          options: { useAI: true, validateResult: true, module: moduleName },
        },
      });

      const result = data.dataEntryImportFromUrl;
      if (result.success) {
        setExtractedData([result.result]);
        setStep(3);
      } else {
        setError(result.message || 'URL import failed');
      }
    } catch (err) {
      console.error('URL error:', err);
      setError(err.message || 'Failed to import from URL');
    } finally {
      setLoading(false);
    }
  };

  // Validate and enhance data
  const validateData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await apolloClient.mutate({
        mutation: DATA_ENTRY_VALIDATE,
        variables: {
          input: {
            data: extractedData,
            module: moduleName,
            options: { enhanceWithAI: true, autoFix: true, categorize: true, deduplication: true },
          },
        },
      });

      const result = data.dataEntryValidate;
      if (result.success) {
        setValidationResults(result.result);
        setStep(4);
      } else {
        setError('Validation failed');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError(err.message || 'Failed to validate data');
    } finally {
      setLoading(false);
    }
  };

  // Save data to database
  const saveData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use enhanced data if available
      const dataToSave = validationResults?.items
        ? validationResults.items.filter((item) => item.valid).map((item) => item.enhanced)
        : extractedData;

      const { data } = await apolloClient.mutate({
        mutation: DATA_ENTRY_SAVE,
        variables: { input: { data: dataToSave, module: moduleName } },
      });

      const result = data.dataEntrySave;
      if (result.success) {
        onImportComplete?.(result);
      } else {
        setError('Failed to save data');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save data');
    } finally {
      setLoading(false);
    }
  };

  // Handle next step
  const handleNext = () => {
    if (step === 2) {
      if (importMethod === 'ocr') {
        processOCR();
      } else if (importMethod === 'spreadsheet') {
        processSpreadsheet();
      } else if (importMethod === 'url') {
        processURL();
      }
    } else if (step === 3) {
      validateData();
    } else if (step === 4) {
      saveData();
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Import Data</h2>
        <p className="text-gray-600 mt-1">
          Import data using AI-powered OCR, spreadsheet automation, or URL extraction
        </p>
      </div>

      {/* Module Data Format Guide */}
      {MODULE_GUIDES[moduleName] && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Info className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                {MODULE_GUIDES[moduleName].title}
              </h3>
              <p className="text-sm text-blue-700 mb-3">{MODULE_GUIDES[moduleName].description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                {/* Required Fields */}
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-1">Required Fields:</p>
                  <ul className="text-xs text-blue-700 space-y-0.5">
                    {MODULE_GUIDES[moduleName].requiredFields.map((field, idx) => (
                      <li key={idx}>• {field}</li>
                    ))}
                  </ul>
                </div>

                {/* Optional Fields */}
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-1">Optional Fields:</p>
                  <ul className="text-xs text-blue-700 space-y-0.5">
                    {MODULE_GUIDES[moduleName].optionalFields.slice(0, 5).map((field, idx) => (
                      <li key={idx}>• {field}</li>
                    ))}
                    {MODULE_GUIDES[moduleName].optionalFields.length > 5 && (
                      <li className="italic">
                        ... and {MODULE_GUIDES[moduleName].optionalFields.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Example Data */}
              <details className="text-xs">
                <summary className="font-semibold text-blue-900 cursor-pointer hover:text-blue-700 mb-2">
                  Example Data Format
                </summary>
                <div className="mt-2 p-3 bg-white border border-blue-200 rounded">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-blue-200">
                        {Object.keys(MODULE_GUIDES[moduleName].exampleData).map((key, idx) => (
                          <th key={idx} className="px-2 py-1 text-left font-semibold text-blue-900">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {Object.values(MODULE_GUIDES[moduleName].exampleData).map((val, idx) => (
                          <td key={idx} className="px-2 py-1 text-blue-700">
                            {val}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </details>

              {/* Tips */}
              {MODULE_GUIDES[moduleName].tips && MODULE_GUIDES[moduleName].tips.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Tips:</p>
                  <ul className="text-xs text-blue-700 space-y-0.5">
                    {MODULE_GUIDES[moduleName].tips.map((tip, idx) => (
                      <li key={idx}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {['Method', 'Upload', 'Preview', 'Confirm'].map((label, idx) => (
            <div key={idx} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step > idx + 1
                    ? 'bg-green-500 text-white'
                    : step === idx + 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step > idx + 1 ? <CheckCircle size={20} /> : idx + 1}
              </div>
              {idx < 3 && (
                <div className={`w-16 h-1 ${step > idx + 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
              <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <XCircle className="text-red-500 mt-0.5 mr-2" size={20} />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Method Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {importMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => {
                  setImportMethod(method.id);
                  setStep(2);
                }}
                className={`p-6 border-0 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all ${
                  importMethod === method.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <method.icon className="mx-auto mb-4 text-blue-500" size={48} />
                <h3 className="font-semibold text-lg mb-2">{method.name}</h3>
                <p className="text-sm text-gray-600 relative width-[90%] text-wrap">
                  {method.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Upload/Input */}
        {step === 2 && (
          <div>
            {(importMethod === 'ocr' || importMethod === 'spreadsheet') && (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
              >
                <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Accepted formats:{' '}
                  {importMethods.find((m) => m.id === importMethod)?.acceptedFormats}
                </p>
                <input
                  type="file"
                  multiple={importMethod === 'ocr'}
                  accept={importMethods.find((m) => m.id === importMethod)?.acceptedFormats}
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
                >
                  Select Files
                </label>
                {files.length > 0 && (
                  <div className="mt-6">
                    <p className="font-medium text-gray-700 mb-2">
                      Selected Files ({files.length}):
                    </p>
                    <ul className="text-sm text-gray-600">
                      {files.map((file, idx) => (
                        <li key={idx}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {importMethod === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-2 text-sm text-gray-500">
                  AI will extract relevant information from the webpage
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview Data */}
        {step === 3 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Extracted Data Preview</h3>

            {/* Show validation summary if available */}
            {validationResults && (
              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-600">Total Rows</p>
                  <p className="text-2xl font-bold text-blue-700">{validationResults.totalRows}</p>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">Valid Rows</p>
                  <p className="text-2xl font-bold text-green-700">{validationResults.validRows}</p>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">Invalid Rows</p>
                  <p className="text-2xl font-bold text-red-700">{validationResults.invalidRows}</p>
                </div>
              </div>
            )}

            {/* Show errors if any */}
            {validationResults?.errors && validationResults.errors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg max-h-40 overflow-y-auto">
                <p className="font-medium text-red-800 mb-2">Validation Errors:</p>
                <ul className="text-sm text-red-600 space-y-1">
                  {validationResults.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>
                      Row {err.row}: {err.errors.map((e) => e.message).join(', ')}
                    </li>
                  ))}
                  {validationResults.errors.length > 5 && (
                    <li className="font-medium">
                      ... and {validationResults.errors.length - 5} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}

            {extractedData && extractedData.length > 0 ? (
              <>
                <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {Object.keys(extractedData[0] || {}).map((key) => (
                          <th
                            key={key}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {extractedData.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((value, vIdx) => (
                            <td key={vIdx} className="px-4 py-3 text-sm text-gray-700">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {extractedData.length > 10 && (
                  <p className="mt-2 text-sm text-gray-500">
                    Showing 10 of {extractedData.length} records
                  </p>
                )}
              </>
            ) : (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <p className="text-gray-500">No valid data to preview</p>
                <p className="text-sm text-gray-400 mt-2">
                  All rows may have validation errors. Check the errors above.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Validation Results */}
        {step === 4 && validationResults && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Validation Results</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 mr-2" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-green-700">
                      {validationResults.validItems}
                    </p>
                    <p className="text-sm text-green-600">Valid Records</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <XCircle className="text-red-500 mr-2" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-red-700">
                      {validationResults.invalidItems}
                    </p>
                    <p className="text-sm text-red-600">Invalid Records</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="text-yellow-500 mr-2" size={24} />
                  <div>
                    <p className="text-2xl font-bold text-yellow-700">
                      {validationResults.duplicates || 0}
                    </p>
                    <p className="text-sm text-yellow-600">Duplicates</p>
                  </div>
                </div>
              </div>
            </div>
            {validationResults.enhancedItems > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800">
                  <strong>{validationResults.enhancedItems}</strong> records were enhanced with AI
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else onCancel?.();
          }}
          className="px-6 py-2 border-0 border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        <button
          onClick={handleNext}
          disabled={
            loading ||
            (step === 2 &&
              ((importMethod !== 'url' && files.length === 0) || (importMethod === 'url' && !url)))
          }
          className="px-6 py-2 bg-blue-500 border-0 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading && <Loader className="animate-spin mr-2" size={20} />}
          {step === 4 ? 'Import Data' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default DataImportWizard;
