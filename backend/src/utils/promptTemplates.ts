// @ts-nocheck
const promptTemplates = {
  // System prompts for different AI assistant types
  systemPrompts: {
    general: (companyName = 'Your Company') => `You are a helpful AI assistant for ${companyName}'s ERP/CRM system called "Tech Revisor Automation Suite". 
              You help ${companyName} manage their business operations including customers, invoices, quotes, payments, documents, and workflows.
              Always provide clear, actionable advice and maintain a professional yet friendly tone. 
              When addressing the user, remember you are assisting ${companyName} with their business needs.`,

    document: (companyName = 'Your Company') => `You are a document analysis specialist for ${companyName}'s Tech Revisor ERP system.
               Help ${companyName} analyze, organize, and manage their business documents.
               Focus on content extraction, compliance checking, and document management best practices.
               Provide insights about document content, suggest tags, and identify key information for ${companyName}.`,

    workflow: (companyName = 'Your Company') => `You are a workflow optimization expert for ${companyName}'s Tech Revisor ERP system.
               Help ${companyName} design, improve, and automate their business processes.
               Analyze existing workflows, suggest improvements, identify bottlenecks, and recommend automation opportunities.
               Focus on efficiency, compliance, and best practices that will benefit ${companyName}.`,

    analytics: (companyName = 'Your Company') => `You are a business intelligence analyst for ${companyName}'s Tech Revisor ERP system.
                Help ${companyName} understand their business data and make data-driven decisions.
                Analyze trends, provide insights, and suggest actionable recommendations that will drive ${companyName}'s growth.
                Focus on KPIs, performance metrics, and business growth opportunities.`,

    customer: (companyName = 'Your Company') => `You are a customer relationship specialist for ${companyName}'s Tech Revisor ERP system.
               Help ${companyName} manage customer interactions, analyze customer behavior, and improve satisfaction.
               Provide insights on customer segmentation, retention strategies, and relationship building for ${companyName}.`,

    financial: (companyName = 'Your Company') => `You are a financial advisor for ${companyName}'s Tech Revisor ERP system.
                Help ${companyName} understand their financial data, manage cash flow, and make informed decisions.
                Analyze financial performance, suggest cost optimizations, and provide budgeting advice for ${companyName}.`,
  },

  // Analysis prompts
  analysis: {
    invoice: (data) => `
      Analyze this invoice data and provide comprehensive insights:
      
      Invoice Details:
      - Number: ${data.number}
      - Client: ${data.client?.name}
      - Amount: ${data.total} ${data.currency}
      - Status: ${data.status}
      - Payment Status: ${data.paymentStatus}
      - Due Date: ${data.expiredDate}
      - Created: ${data.created}
      
      Please provide:
      1. Payment risk assessment
      2. Cash flow impact analysis
      3. Client relationship insights
      4. Follow-up recommendations
      5. Any red flags or opportunities
    `,

    quote: (data) => `
      Analyze this quote data and provide strategic insights:
      
      Quote Details:
      - Number: ${data.number}
      - Client: ${data.client?.name}
      - Amount: ${data.total} ${data.currency}
      - Status: ${data.status}
      - Expiry Date: ${data.expiredDate}
      - Created: ${data.created}
      
      Please provide:
      1. Conversion probability assessment
      2. Competitive positioning analysis
      3. Pricing strategy insights
      4. Follow-up recommendations
      5. Win/loss factors
    `,

    customer: (data) => `
      Analyze this customer profile and provide comprehensive insights:
      
      Customer Details:
      - Name: ${data.name}
      - Type: ${data.customerType}
      - Segment: ${data.customerValue?.segment}
      - Lifetime Value: ${data.customerValue?.lifetimeValue}
      - Last Purchase: ${data.behavior?.lastPurchaseDate}
      - Purchase Frequency: ${data.behavior?.purchaseFrequency}
      
      Please provide:
      1. Customer health score
      2. Retention risk assessment
      3. Upselling/cross-selling opportunities
      4. Engagement strategy recommendations
      5. Loyalty program suggestions
    `,

    document: (data) => `
      Analyze this document and extract key insights:
      
      Document Details:
      - Title: ${data.title}
      - Type: ${data.documentType}
      - Size: ${data.fileSize} bytes
      - Tags: ${data.tags?.join(', ')}
      - Created: ${data.created}
      
      Please provide:
      1. Content summary and key points
      2. Compliance requirements analysis
      3. Related document suggestions
      4. Action items extraction
      5. Risk or opportunity identification
    `,
  },

  // Suggestion prompts
  suggestions: {
    workflow: (data) => `
      Review this workflow and provide optimization suggestions:
      
      Workflow: ${JSON.stringify(data, null, 2)}
      
      Please provide:
      1. Efficiency improvement opportunities
      2. Automation possibilities
      3. Bottleneck identification
      4. Best practice recommendations
      5. Integration opportunities with other modules
      6. Compliance considerations
    `,

    process: (module, data) => `
      Suggest process improvements for the ${module} module based on this data:
      
      Current Process Data: ${JSON.stringify(data, null, 2)}
      
      Please provide:
      1. Current process pain points
      2. Streamlining opportunities
      3. Technology leverage suggestions
      4. Performance metrics to track
      5. Implementation roadmap
    `,

    automation: (context) => `
      Suggest automation opportunities based on this business context:
      
      Context: ${JSON.stringify(context, null, 2)}
      
      Please provide:
      1. Repetitive task identification
      2. Automation priority ranking
      3. Technology requirements
      4. ROI estimation
      5. Implementation timeline
      6. Risk mitigation strategies
    `,
  },

  // Prediction prompts
  predictions: {
    sales: (data) => `
      Based on this sales data, provide sales forecasting insights:
      
      Historical Data: ${JSON.stringify(data, null, 2)}
      
      Please provide predictions for the next 30, 60, and 90 days:
      1. Revenue forecasts with confidence intervals
      2. Key factors influencing predictions
      3. Seasonal trends identification
      4. Risk factors and mitigation strategies
      5. Actionable recommendations to improve outcomes
    `,

    cashflow: (data) => `
      Analyze cash flow patterns and provide financial predictions:
      
      Financial Data: ${JSON.stringify(data, null, 2)}
      
      Please provide:
      1. Cash flow forecasts for next quarter
      2. Potential cash crunch periods
      3. Working capital optimization suggestions
      4. Payment collection improvements
      5. Investment opportunity timing
    `,

    customer: (data) => `
      Predict customer behavior and lifecycle insights:
      
      Customer Data: ${JSON.stringify(data, null, 2)}
      
      Please provide:
      1. Customer lifetime value predictions
      2. Churn risk assessment
      3. Next purchase timing forecasts
      4. Upselling opportunity windows
      5. Engagement optimization strategies
    `,
  },

  // General conversation prompts
  conversation: {
    greeting: (companyName = 'Your Company') => `Hello! I'm your AI assistant for ${companyName}'s Tech Revisor ERP system. 
              I can help ${companyName} with analysis, suggestions, predictions, and general questions about your business operations.
              How can I assist ${companyName} today?`,

    help: (companyName = 'Your Company') => `I can help ${companyName} with:
           
           📊 **Analysis**: Deep insights into ${companyName}'s invoices, quotes, customers, and documents
           💡 **Suggestions**: Process improvements, workflow optimizations, and best practices for ${companyName}
           🔮 **Predictions**: Sales forecasts, cash flow projections, and customer behavior analysis for ${companyName}
           ❓ **Questions**: General business advice and ERP system guidance tailored to ${companyName}
           
           Just ask me anything about ${companyName}'s business data or processes!`,

    error: (companyName = 'Your Company') => `I apologize, but I encountered an issue processing ${companyName}'s request. 
            Please try rephrasing your question or provide more specific details about what ${companyName} needs help with.`,

    unknown: (companyName = 'Your Company') => `I'm not sure I understand ${companyName}'s request completely. 
              Could you please provide more context or try asking in a different way? 
              I'm here to help ${companyName} with analysis, suggestions, predictions, and general business questions.`,
  },

  // Context-aware prompts
  contextual: {
    moduleIntro: (module, companyName = 'Your Company') => `I see ${companyName} is working with the ${module} module. I can help ${companyName} analyze data, suggest improvements, and provide insights specific to ${module} operations.`,
    
    dataAnalysis: (module, recordCount, companyName = 'Your Company') => `I found ${recordCount} records in ${companyName}'s ${module} data. Would you like me to analyze trends, identify patterns, or provide specific insights for ${companyName}?`,
    
    noData: (module, companyName = 'Your Company') => `It looks like ${companyName} doesn't have much data in the ${module} module yet. I can help ${companyName} understand best practices for getting started or setting up efficient processes.`,
  },

  // Response formatting templates
  formatting: {
    analysis: `## Analysis Results

### Key Insights
{insights}

### Recommendations
{recommendations}

### Action Items
{actions}

### Additional Notes
{notes}`,

    suggestions: `## Optimization Suggestions

### Priority 1 (High Impact)
{highPriority}

### Priority 2 (Medium Impact)
{mediumPriority}

### Priority 3 (Low Impact)
{lowPriority}

### Implementation Notes
{implementation}`,

    predictions: `## Predictions & Forecasts

### Short Term (30 days)
{shortTerm}

### Medium Term (90 days)
{mediumTerm}

### Long Term (1 year)
{longTerm}

### Confidence Level
{confidence}

### Key Factors
{factors}`,
  },
};

module.exports = promptTemplates;
