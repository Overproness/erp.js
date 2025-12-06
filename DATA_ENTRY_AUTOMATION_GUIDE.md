# Data Entry Automation System - Implementation Guide

## Overview

This system provides comprehensive data entry automation across all modules using:

- **AI-Powered OCR**: Extract data from images, scanned documents, and PDFs
- **Spreadsheet Automation**: Import from CSV/Excel with intelligent column mapping
- **URL Import**: Scrape and extract data from websites
- **AI Enhancement**: Automatically validate, clean, and categorize imported data

## Architecture

### Backend Services

Located in `backend/src/services/dataEntry/`:

1. **moduleSchemas.js** - Defines field mappings and validation rules for each module
2. **enhancedOCRService.js** - OCR extraction with Tesseract.js and AI fallback
3. **enhancedSpreadsheetService.js** - CSV/Excel parsing with AI column mapping
4. **urlImportService.js** - Web scraping and API data extraction
5. **dataValidationService.js** - Data validation, enhancement, and AI categorization

### Backend API Routes

**Base URL**: `/api/data-entry`

All endpoints require authentication (`adminAuth.isValidAuthToken`)

#### Available Endpoints

1. **GET /modules** - List all available modules
2. **GET /modules/:moduleName/schema** - Get schema for specific module
3. **POST /ocr/:moduleName** - Extract data from image/PDF
4. **POST /ocr/:moduleName/batch** - Batch process multiple files
5. **POST /spreadsheet/:moduleName** - Import from CSV/Excel
6. **POST /spreadsheet/:moduleName/preview** - Preview spreadsheet data
7. **POST /url/:moduleName** - Import from URL
8. **POST /url/:moduleName/batch** - Import from multiple URLs
9. **POST /validate/:moduleName** - Validate and enhance bulk data
10. **POST /complete-fields/:moduleName** - Auto-complete missing fields
11. **POST /save/:moduleName** - Save validated data to database

### Frontend Components

Located in `frontend/src/components/DataEntry/`:

1. **DataImportWizard.jsx** - Full-featured import wizard with 4-step process
2. **DataImportButton.jsx** - Simple button to trigger import wizard

## Supported Modules

The system supports the following modules with pre-configured schemas:

1. **client** - Customer/Client management
2. **quote** - Quotes/Estimates
3. **invoice** - Invoices
4. **payment** - Payments
5. **paymentMode** - Payment Methods
6. **taxes** - Tax configurations
7. **task** - Tasks
8. **appointment** - Appointments/Meetings
9. **team** - Team members/Admin users
10. **followUp** - Follow-up management
11. **url** - URL tracking

## Integration Guide

### Adding Import to Existing Modules

#### Step 1: Import the Button Component

```jsx
import { DataImportButton } from "../../components/DataEntry";
```

#### Step 2: Add Button to Module Header/Toolbar

```jsx
const ClientModule = () => {
  const handleImportComplete = (result) => {
    console.log("Import completed:", result);
    // Refresh your data list
    fetchClients();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Customers</h1>
        <DataImportButton
          moduleName="client"
          onImportComplete={handleImportComplete}
        />
      </div>
      {/* Rest of your module */}
    </div>
  );
};
```

### Module-Specific Integration Examples

#### 1. Customer/Client Module

```jsx
// In ClientDataTableModule.jsx or similar
import { DataImportButton } from "../../components/DataEntry";

// Add to toolbar
<DataImportButton
  moduleName="client"
  onImportComplete={(result) => {
    // Refresh client list
    dispatch(erp.list({ entity: "client" }));
  }}
/>;
```

#### 2. Quote Module

```jsx
import { DataImportButton } from "../../components/DataEntry";

<DataImportButton
  moduleName="quote"
  onImportComplete={(result) => {
    dispatch(erp.list({ entity: "quote" }));
  }}
/>;
```

#### 3. Invoice Module

```jsx
import { DataImportButton } from "../../components/DataEntry";

<DataImportButton
  moduleName="invoice"
  onImportComplete={(result) => {
    dispatch(erp.list({ entity: "invoice" }));
  }}
/>;
```

#### 4. Payment Module

```jsx
import { DataImportButton } from "../../components/DataEntry";

<DataImportButton
  moduleName="payment"
  onImportComplete={(result) => {
    dispatch(erp.list({ entity: "payment" }));
  }}
/>;
```

#### 5. Task Module

```jsx
import { DataImportButton } from "../../components/DataEntry";

<DataImportButton
  moduleName="task"
  onImportComplete={(result) => {
    dispatch(erp.list({ entity: "task" }));
  }}
/>;
```

## Frontend Package Requirements

Install the required package:

```bash
npm install lucide-react
```

## Usage Examples

### 1. OCR Import

Users can:

- Upload images of business cards, invoices, quotes, etc.
- Scan documents and import data automatically
- Batch process multiple documents at once

The system will:

- Extract text using Tesseract OCR
- Fall back to AI vision if OCR fails
- Structure data according to module schema
- Validate and enhance extracted data

### 2. Spreadsheet Import

Users can:

- Import customer lists from Excel/CSV
- Bulk import invoices, quotes, payments
- Export data from other systems and import

The system will:

- Automatically map columns to fields
- Use AI for ambiguous column names
- Validate each row
- Flag errors and duplicates
- Enhance data with AI

### 3. URL Import

Users can:

- Import customer data from LinkedIn profiles
- Extract invoice data from accounting software URLs
- Import contact info from websites
- Fetch data from API endpoints

The system will:

- Scrape webpage content
- Extract structured data (JSON-LD, microdata)
- Use AI to parse and structure information
- Validate against module schema

## API Usage Examples

### OCR Import

```javascript
// Single file
const formData = new FormData();
formData.append("file", imageFile);

const response = await fetch("/api/data-entry/ocr/client", {
  method: "POST",
  headers: { Authorization: "Bearer " + token },
  body: formData,
});

const result = await response.json();
// result.data contains extracted client information
```

### Spreadsheet Import

```javascript
const formData = new FormData();
formData.append("file", excelFile);
formData.append(
  "options",
  JSON.stringify({
    autoMap: true,
    validateRows: true,
    useAI: true,
  })
);

const response = await fetch("/api/data-entry/spreadsheet/invoice", {
  method: "POST",
  headers: { Authorization: "Bearer " + token },
  body: formData,
});

const result = await response.json();
// result.data contains array of imported invoices
```

### URL Import

```javascript
const response = await fetch("/api/data-entry/url/client", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: "https://example.com/contact",
    options: {
      useAI: true,
      validateResult: true,
    },
  }),
});

const result = await response.json();
// result.data contains extracted client information
```

## Customization

### Adding New Modules

To add support for a new module:

1. Edit `backend/src/services/dataEntry/moduleSchemas.js`
2. Add your module schema:

```javascript
myModule: {
  name: 'MyModule',
  model: 'MyModel', // Mongoose model name
  fields: {
    fieldName: {
      type: 'string',
      required: true,
      aliases: ['alternate names', 'synonyms']
    },
    // ... more fields
  },
  aiPrompt: 'Description for AI extraction'
}
```

### Customizing Field Mappings

Edit the `aliases` array in module schemas to add more column name variations:

```javascript
email: {
  type: 'email',
  required: true,
  aliases: ['email', 'email address', 'e-mail', 'contact email', 'work email']
}
```

### Customizing AI Behavior

Adjust AI parameters in service files:

```javascript
const response = await aiService.chat({
  messages: [...],
  temperature: 0.1, // Lower = more deterministic
  maxTokens: 2000
});
```

## Error Handling

The system provides comprehensive error handling:

- **Validation errors**: Invalid data is flagged with specific error messages
- **Format errors**: Wrong file formats are rejected with clear messages
- **Network errors**: Timeout and connection errors are handled gracefully
- **Duplicate detection**: Potential duplicates are flagged for review

## Performance Considerations

- **Batch Processing**: OCR supports batch processing of up to 10 files
- **File Size Limits**: 10MB per file by default (configurable in routes)
- **AI Rate Limiting**: Consider AI API rate limits for bulk imports
- **Database Transactions**: Large imports are processed in batches

## Security

- All endpoints require authentication
- File uploads are validated by type and size
- Uploaded files are automatically cleaned up after processing
- SQL injection and XSS protection via Mongoose

## Testing

Test the implementation:

1. **OCR**: Upload a business card image or invoice PDF
2. **Spreadsheet**: Import a CSV with customer data
3. **URL**: Extract data from a contact page
4. **Validation**: Check that errors are properly flagged
5. **Enhancement**: Verify AI categorization and field completion

## Troubleshooting

### Common Issues

1. **OCR fails**: Ensure Tesseract worker initializes properly
2. **Column mapping wrong**: Add more aliases to schema
3. **AI timeout**: Reduce data size or increase timeout
4. **Import button not showing**: Check module name matches schema
5. **Lucide icons missing**: Install `lucide-react` package

### Debug Mode

Enable detailed logging in services:

```javascript
console.log("OCR result:", result);
console.log("Validation:", validation);
```

## Next Steps

1. Install `lucide-react`: `npm install lucide-react`
2. Add import buttons to all modules
3. Test with sample data
4. Customize schemas as needed
5. Train users on the import workflow

## Support

For issues or questions:

- Check the module schemas for field mappings
- Review API response errors
- Test with small datasets first
- Verify authentication tokens
- Check console for detailed error messages
