# Quick Setup Guide - Data Entry Automation

## Prerequisites

✅ All backend dependencies already installed (tesseract.js, xlsx, csv-parser, etc.)
✅ Backend services created and routes configured
✅ Frontend components created

## Installation Steps

### Step 1: Install Frontend Dependency

```bash
cd frontend
npm install lucide-react
```

### Step 2: Import Component in Your Modules

For each module you want to add import functionality to, add these lines:

```jsx
// At the top of your file
import { DataImportButton } from "../../components/DataEntry";

// In your component's render/return
<DataImportButton
  moduleName="client" // Change this to match your module
  onImportComplete={(result) => {
    // Refresh your data list
    dispatch(erp.list({ entity: "client" }));
  }}
/>;
```

### Step 3: Test the Implementation

1. **Test OCR Import**:

   - Create a test image with customer information (business card)
   - Click "Import Data" button
   - Select "OCR - Image/PDF"
   - Upload the image
   - Verify data extraction

2. **Test Spreadsheet Import**:

   - Create a CSV file with sample customers:
     ```csv
     Name,Email,Phone,Address
     Test Corp,test@corp.com,+1234567890,123 Main St
     ```
   - Click "Import Data"
   - Select "Spreadsheet"
   - Upload the CSV
   - Verify column mapping and data

3. **Test URL Import**:
   - Click "Import Data"
   - Select "URL Import"
   - Enter a contact page URL
   - Verify data extraction

## Module Integration Quick Reference

### Customers/Clients

```jsx
<DataImportButton moduleName="client" onImportComplete={handleRefresh} />
```

### Quotes

```jsx
<DataImportButton moduleName="quote" onImportComplete={handleRefresh} />
```

### Invoices

```jsx
<DataImportButton moduleName="invoice" onImportComplete={handleRefresh} />
```

### Payments

```jsx
<DataImportButton moduleName="payment" onImportComplete={handleRefresh} />
```

### Payment Methods

```jsx
<DataImportButton moduleName="paymentMode" onImportComplete={handleRefresh} />
```

### Taxes

```jsx
<DataImportButton moduleName="taxes" onImportComplete={handleRefresh} />
```

### Tasks

```jsx
<DataImportButton moduleName="task" onImportComplete={handleRefresh} />
```

### Appointments

```jsx
<DataImportButton moduleName="appointment" onImportComplete={handleRefresh} />
```

### Team

```jsx
<DataImportButton moduleName="team" onImportComplete={handleRefresh} />
```

### Follow-ups

```jsx
<DataImportButton moduleName="followUp" onImportComplete={handleRefresh} />
```

### URLs

```jsx
<DataImportButton moduleName="url" onImportComplete={handleRefresh} />
```

## Customization

### Add More Column Aliases

Edit `backend/src/services/dataEntry/moduleSchemas.js` and add more aliases to field definitions:

```javascript
email: {
  type: 'email',
  required: true,
  aliases: ['email', 'email address', 'e-mail', 'work email', 'contact email']
}
```

### Adjust AI Parameters

Edit service files to tune AI behavior:

```javascript
// In enhancedOCRService.js, enhancedSpreadsheetService.js, etc.
const response = await aiService.chat({
  messages: [...],
  temperature: 0.1, // Lower = more deterministic (0.0-1.0)
  maxTokens: 2000    // Adjust based on needs
});
```

### Change File Size Limits

Edit `backend/src/routes/dataEntryRoutes.js`:

```javascript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // Change from 10MB to 20MB
  },
  ...
});
```

## Troubleshooting

### Issue: Import button doesn't show

**Solution**: Make sure you've installed lucide-react and imported the component correctly.

### Issue: OCR fails

**Solution**: Check that Tesseract worker initializes. Check backend logs for errors.

### Issue: Column mapping is wrong

**Solution**: Add more aliases to the module schema for your specific column names.

### Issue: Validation errors

**Solution**: Check that your data matches the required fields in the schema.

### Issue: AI timeout

**Solution**: Reduce the amount of data being processed at once, or increase timeout values.

## Sample Data Files

### Sample CSV for Customers

```csv
Name,Email,Phone,Address,Country,Type
ABC Corporation,contact@abc.com,+1-555-0100,123 Business St,USA,company
John Smith,john@smith.com,+1-555-0101,456 Main Ave,USA,individual
XYZ Industries,info@xyz.com,+44-20-1234-5678,789 Commerce Rd,UK,company
```

### Sample CSV for Invoices

```csv
Client Name,Invoice Date,Due Date,Item Name,Quantity,Price,Total
ABC Corporation,2024-01-15,2024-02-15,Consulting Services,10,100,1000
XYZ Industries,2024-01-20,2024-02-20,Software Development,20,150,3000
```

### Sample CSV for Tasks

```csv
Title,Description,Status,Priority,Due Date,Assigned To
Complete Project Proposal,Draft and finalize proposal,in_progress,high,2024-02-01,john@company.com
Review Contract,Legal review of client contract,pending,medium,2024-02-05,jane@company.com
```

## API Testing with Postman/cURL

### OCR Import

```bash
curl -X POST http://localhost:8888/api/data-entry/ocr/client \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

### Spreadsheet Import

```bash
curl -X POST http://localhost:8888/api/data-entry/spreadsheet/client \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/customers.csv" \
  -F "options={\"autoMap\":true,\"validateRows\":true}"
```

### URL Import

```bash
curl -X POST http://localhost:8888/api/data-entry/url/client \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/contact",
    "options": {
      "useAI": true,
      "validateResult": true
    }
  }'
```

## Production Checklist

- [ ] Install lucide-react
- [ ] Add import buttons to all modules
- [ ] Test with sample data
- [ ] Configure file size limits appropriately
- [ ] Set up proper error logging
- [ ] Train users on the import workflow
- [ ] Create module-specific sample CSV templates
- [ ] Document any custom field mappings
- [ ] Set up monitoring for import operations
- [ ] Test with production-like data volumes

## Support Files

- **Full Documentation**: `DATA_ENTRY_AUTOMATION_GUIDE.md`
- **Integration Examples**: `INTEGRATION_EXAMPLES.js`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **This Quick Setup**: `QUICK_SETUP.md`

## Getting Help

1. Check the console for error messages
2. Review module schemas in `moduleSchemas.js`
3. Test API endpoints directly with Postman
4. Check backend logs for service errors
5. Verify authentication tokens are valid

---

**You're all set! Start with one module (Client recommended) and expand from there.**
