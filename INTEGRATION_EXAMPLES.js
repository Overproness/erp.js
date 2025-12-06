/**
 * Integration Examples for Data Entry Automation
 * Copy these snippets into respective module files
 */

// ============================================
// 1. CLIENT/CUSTOMER MODULE INTEGRATION
// ============================================

// File: frontend/src/apps/Client/ClientDataTableModule.jsx (or similar)

import { useDispatch } from "react-redux";
import { DataImportButton } from "../../components/DataEntry";
import { erp } from "../../redux/erp/actions";

// Add this button to your module's toolbar/header
const ClientModule = () => {
  const dispatch = useDispatch();

  const handleImportComplete = (result) => {
    console.log("Imported clients:", result);
    // Refresh the client list after import
    dispatch(erp.list({ entity: "client" }));
    // Show success message
    alert(`Successfully imported ${result.saved} clients!`);
  };

  return (
    <div>
      {/* Add to your existing header/toolbar */}
      <div className="flex justify-between items-center mb-4">
        <h1>Customers</h1>
        <div className="flex gap-2">
          <DataImportButton
            moduleName="client"
            onImportComplete={handleImportComplete}
          />
          {/* Your other buttons */}
        </div>
      </div>
      {/* Rest of your module */}
    </div>
  );
};

// ============================================
// 2. QUOTE MODULE INTEGRATION
// ============================================

// File: frontend/src/apps/Quote/QuoteDataTableModule.jsx

const QuoteModule = () => {
  const dispatch = useDispatch();

  const handleImportComplete = (result) => {
    dispatch(erp.list({ entity: "quote" }));
    // Optionally show detailed results
    if (result.failed > 0) {
      console.warn(
        "Some quotes failed to import:",
        result.items.filter((i) => !i.success)
      );
    }
  };

  return (
    <div className="toolbar">
      <DataImportButton
        moduleName="quote"
        onImportComplete={handleImportComplete}
        className="ml-2"
      />
    </div>
  );
};

// ============================================
// 3. INVOICE MODULE INTEGRATION
// ============================================

// File: frontend/src/apps/Invoice/InvoiceDataTableModule.jsx

const InvoiceModule = () => {
  const dispatch = useDispatch();

  const handleImportComplete = (result) => {
    dispatch(erp.list({ entity: "invoice" }));
    // Update invoice statistics
    dispatch(erp.summary({ entity: "invoice" }));
  };

  return (
    <div className="invoice-toolbar">
      <DataImportButton
        moduleName="invoice"
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

// ============================================
// 4. PAYMENT MODULE INTEGRATION
// ============================================

// File: frontend/src/apps/Payment/PaymentDataTableModule.jsx

const PaymentModule = () => {
  const dispatch = useDispatch();

  const handleImportComplete = (result) => {
    dispatch(erp.list({ entity: "payment" }));
  };

  return (
    <div className="payment-header">
      <DataImportButton
        moduleName="payment"
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

// ============================================
// 5. PAYMENT METHOD MODULE INTEGRATION
// ============================================

// File: frontend/src/apps/PaymentMode/PaymentModeDataTableModule.jsx

const PaymentModeModule = () => {
  const dispatch = useDispatch();

  const handleImportComplete = (result) => {
    dispatch(erp.list({ entity: "paymentMode" }));
  };

  return (
    <div className="settings-toolbar">
      <DataImportButton
        moduleName="paymentMode"
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

// ============================================
// 6. TAXES MODULE INTEGRATION
// ============================================

// File: frontend/src/apps/Taxes/TaxesDataTableModule.jsx

const TaxesModule = () => {
  const dispatch = useDispatch();

  const handleImportComplete = (result) => {
    dispatch(erp.list({ entity: "taxes" }));
  };

  return (
    <div className="taxes-toolbar">
      <DataImportButton
        moduleName="taxes"
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

// ============================================
// 7. TASK MODULE INTEGRATION
// ============================================

// File: frontend/src/apps/Task/TaskDataTableModule.jsx

const TaskModule = () => {
  const dispatch = useDispatch();

  const handleImportComplete = (result) => {
    dispatch(erp.list({ entity: "task" }));
    // Update task board if using kanban view
    dispatch({ type: "REFRESH_TASK_BOARD" });
  };

  return (
    <div className="task-toolbar">
      <DataImportButton
        moduleName="task"
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

// ============================================
// 8. APPOINTMENT MODULE INTEGRATION
// ============================================

// File: frontend/src/apps/Appointment/AppointmentDataTableModule.jsx

const AppointmentModule = () => {
  const dispatch = useDispatch();

  const handleImportComplete = (result) => {
    dispatch(erp.list({ entity: "appointment" }));
    // Refresh calendar view if applicable
    dispatch({ type: "REFRESH_CALENDAR" });
  };

  return (
    <div className="appointment-toolbar">
      <DataImportButton
        moduleName="appointment"
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

// ============================================
// 9. TEAM MODULE INTEGRATION
// ============================================

// File: frontend/src/apps/Team/TeamDataTableModule.jsx

const TeamModule = () => {
  const dispatch = useDispatch();

  const handleImportComplete = (result) => {
    dispatch(erp.list({ entity: "team" }));
  };

  return (
    <div className="team-toolbar">
      <DataImportButton
        moduleName="team"
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

// ============================================
// 10. FOLLOW-UP MODULE INTEGRATION
// ============================================

// File: frontend/src/apps/FollowUp/FollowUpDataTableModule.jsx

const FollowUpModule = () => {
  const dispatch = useDispatch();

  const handleImportComplete = (result) => {
    dispatch(erp.list({ entity: "followUp" }));
  };

  return (
    <div className="followup-toolbar">
      <DataImportButton
        moduleName="followUp"
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

// ============================================
// 11. URL MODULE INTEGRATION
// ============================================

// File: frontend/src/apps/URL/URLDataTableModule.jsx

const URLModule = () => {
  const dispatch = useDispatch();

  const handleImportComplete = (result) => {
    dispatch(erp.list({ entity: "url" }));
  };

  return (
    <div className="url-toolbar">
      <DataImportButton
        moduleName="url"
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};

// ============================================
// ADVANCED: Custom Import with Preprocessing
// ============================================

const AdvancedImportExample = () => {
  const [showWizard, setShowWizard] = useState(false);

  const handleImportComplete = async (result) => {
    // Do custom preprocessing before saving
    const processedData = result.items.map((item) => ({
      ...item,
      customField: "custom value",
      timestamp: new Date(),
    }));

    // Save with custom logic
    try {
      await request.post(`/api/data-entry/save/client`, {
        data: processedData,
      });

      // Refresh list
      dispatch(erp.list({ entity: "client" }));
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  return (
    <DataImportButton
      moduleName="client"
      onImportComplete={handleImportComplete}
    />
  );
};

// ============================================
// ADVANCED: Programmatic Import (No UI)
// ============================================

import request from "../../request";

const programmaticImport = async () => {
  // Import from URL programmatically
  try {
    const response = await request.post("/api/data-entry/url/client", {
      url: "https://example.com/contact",
      options: {
        useAI: true,
        validateResult: true,
      },
    });

    if (response.data.success) {
      // Save the extracted data
      await request.post("/api/data-entry/save/client", {
        data: [response.data.data],
      });

      console.log("Import successful");
    }
  } catch (error) {
    console.error("Import failed:", error);
  }
};

// ============================================
// ADVANCED: Batch URL Import
// ============================================

const batchURLImport = async (urls) => {
  try {
    const response = await request.post("/api/data-entry/url/client/batch", {
      urls: urls,
      options: {
        useAI: true,
        validateResult: true,
      },
    });

    if (response.data.success) {
      const validData = response.data.results
        .filter((r) => r.success)
        .map((r) => r.data);

      // Save all valid data
      await request.post("/api/data-entry/save/client", {
        data: validData,
      });

      console.log(
        `Imported ${validData.length} clients from ${urls.length} URLs`
      );
    }
  } catch (error) {
    console.error("Batch import failed:", error);
  }
};

// ============================================
// USAGE WITH EXISTING DATA TABLE
// ============================================

// If you have a DataTable component, add the button like this:
const YourDataTable = () => {
  return (
    <div>
      <div className="data-table-header">
        <h2>Your Module</h2>
        <div className="actions">
          <DataImportButton
            moduleName="client"
            onImportComplete={(result) => {
              // Your refresh logic
            }}
          />
          {/* Other action buttons */}
        </div>
      </div>

      {/* Your data table */}
    </div>
  );
};
