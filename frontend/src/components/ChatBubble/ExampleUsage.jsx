/**
 * Example: How to use Copilot in a Customer Detail Page
 *
 * This example shows how to integrate the AI copilot with module-specific context
 */

import { Button, Card, Descriptions, Space } from 'antd';
import { useEffect, useState } from 'react';
import { useCopilot } from '../../context/useCopilot';
import { useCopilotModule } from '../../hooks/useCopilotModule';

export default function CustomerDetailExample({ customerId }) {
  const [customer, setCustomer] = useState(null);
  const { openCopilot, sendMessage } = useCopilot();

  // Automatically set copilot context for this module
  useCopilotModule('customer', {
    entityId: customerId,
    data: customer,
  });

  useEffect(() => {
    // Fetch customer data (example)
    fetchCustomer(customerId).then(setCustomer);
  }, [customerId]);

  // Example: Quick action to ask AI about customer
  const handleAskAboutCustomer = () => {
    openCopilot();
    sendMessage(`Tell me about this customer and suggest engagement strategies`);
  };

  // Example: Get AI suggestions for follow-up
  const handleSuggestFollowUp = () => {
    openCopilot();
    sendMessage(`What follow-up actions would you recommend for this customer?`);
  };

  if (!customer) return <div>Loading...</div>;

  return (
    <div>
      <Card title="Customer Details">
        <Descriptions bordered>
          <Descriptions.Item label="Name">{customer.name}</Descriptions.Item>
          <Descriptions.Item label="Email">{customer.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{customer.phone}</Descriptions.Item>
          <Descriptions.Item label="Company">{customer.company}</Descriptions.Item>
        </Descriptions>

        <Space style={{ marginTop: 16 }}>
          <Button onClick={handleAskAboutCustomer}>Ask AI About Customer</Button>
          <Button onClick={handleSuggestFollowUp}>Get Follow-up Suggestions</Button>
        </Space>
      </Card>

      {/* ChatBubble is globally available and will use the context set above */}
    </div>
  );
}

// Mock fetch function
async function fetchCustomer(id) {
  return {
    id,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Acme Corp',
  };
}
