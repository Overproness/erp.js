import apolloClient from '@/graphql/client';
import { GENERATE_ANALYTICS_REPORT } from '@/graphql/operations/analytics';
import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  MailOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Steps,
  Switch,
  Tag,
  TimePicker,
} from 'antd';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useState } from 'react';

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

export default function CustomReportBuilder({ visible, onClose }) {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedVisualizations, setSelectedVisualizations] = useState([]);
  const [schedulingEnabled, setSchedulingEnabled] = useState(false);

  const modules = [
    { label: 'CRM', value: 'crm' },
    { label: 'Sales', value: 'sales' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Reputation', value: 'reputation' },
    { label: 'Tasks', value: 'tasks' },
    { label: 'Documents', value: 'documents' },
  ];

  const visualizationTypes = [
    { label: 'Line Chart', value: 'line' },
    { label: 'Bar Chart', value: 'bar' },
    { label: 'Pie Chart', value: 'pie' },
    { label: 'Area Chart', value: 'area' },
    { label: 'Table', value: 'table' },
    { label: 'Statistics Cards', value: 'cards' },
  ];

  const handleNext = () => {
    // Get field names for current step
    const stepFields = {
      0: ['reportName', 'dateRange'],
      1: ['groupBy'],
      2: [],
      3: schedulingEnabled ? ['recipientEmails', 'scheduleFrequency'] : [],
    };

    const fieldsToValidate = stepFields[currentStep];

    if (fieldsToValidate.length > 0) {
      form
        .validateFields(fieldsToValidate)
        .then(() => {
          setCurrentStep(currentStep + 1);
        })
        .catch((error) => {
          console.error('Validation failed:', error);
        });
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      // Validate all fields first
      await form.validateFields(['reportName', 'dateRange']);

      // Get all form values (pass true to get all fields including untouched ones)
      const values = form.getFieldsValue(true);
      console.log('🚀 ~ handleSubmit ~ values:', values);
      setLoading(true);

      // Ensure required fields are present
      if (!values.reportName) {
        message.error('Please provide a report name');
        setLoading(false);
        return;
      }

      const reportConfig = {
        name: values.reportName,
        description: values.description || '',
        modules: selectedModules,
        visualizations: selectedVisualizations,
        filters: {
          dateRange: values.dateRange || 'last30days',
          groupBy: values.groupBy || 'day',
        },
        scheduling: schedulingEnabled
          ? {
              enabled: true,
              frequency: values.scheduleFrequency || 'weekly',
              dayOfWeek: values.dayOfWeek,
              dayOfMonth: values.dayOfMonth,
              time: values.scheduleTime ? values.scheduleTime.format('HH:mm') : '09:00',
              recipients: values.recipientEmails || [],
              format: values.deliveryFormat || 'pdf',
              startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
              endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
            }
          : {
              enabled: false,
            },
      };

      const { data } = await apolloClient.mutate({
        mutation: GENERATE_ANALYTICS_REPORT,
        variables: { input: reportConfig },
      });

      if (data.analyticsGenerateReport?.success) {
        message.success('Report generated successfully!');
        setGeneratedReport(data.analyticsGenerateReport.result);
      } else {
        message.error('Failed to create report');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      message.error('An error occurred while creating the report');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setCurrentStep(0);
    setSelectedModules([]);
    setSelectedVisualizations([]);
    setGeneratedReport(null);
    setSchedulingEnabled(false);
    onClose();
  };

  const handleDownloadReport = () => {
    if (!generatedReport) return;

    const reportData = {
      name: generatedReport.name || 'Untitled Report',
      description: generatedReport.description || '',
      generatedAt: new Date(generatedReport.generatedAt).toLocaleString(),
      modules: generatedReport.modules || [],
      data: generatedReport.data || {},
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = (generatedReport.name || 'report').replace(/\s+/g, '_');
    link.download = `${fileName}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success('Report downloaded successfully!');
  };

  const handleDownloadPDF = async () => {
    if (!generatedReport) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Title
      doc.setFontSize(20);
      doc.setTextColor(31, 78, 121);
      doc.text(generatedReport.name || 'Analytics Report', pageWidth / 2, yPos, {
        align: 'center',
      });
      yPos += 15;

      // Description
      if (generatedReport.description) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const splitDescription = doc.splitTextToSize(generatedReport.description, pageWidth - 40);
        doc.text(splitDescription, 20, yPos);
        yPos += splitDescription.length * 5 + 10;
      }

      // Metadata
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generated: ${new Date(generatedReport.generatedAt).toLocaleString()}`, 20, yPos);
      yPos += 8;
      doc.text(`Modules: ${generatedReport.modules.join(', ').toUpperCase()}`, 20, yPos);
      yPos += 15;

      // Add data for each module
      Object.keys(generatedReport.data || {}).forEach((module) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        // Module header
        doc.setFontSize(14);
        doc.setTextColor(31, 78, 121);
        doc.text(module.toUpperCase() + ' Analytics', 20, yPos);
        yPos += 10;

        // Module data
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        const moduleData = generatedReport.data[module];

        // If there's timeline data, create a table
        if (
          moduleData.timeline &&
          Array.isArray(moduleData.timeline) &&
          moduleData.timeline.length > 0
        ) {
          const tableData = moduleData.timeline.map((item) => {
            const value = item.count || item.revenue || item.value || 0;
            const formattedValue = item.revenue ? `$${value.toFixed(2)}` : value;
            return [item._id || 'N/A', formattedValue];
          });

          doc.autoTable({
            startY: yPos,
            head: [['Date', 'Value']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [31, 78, 121], textColor: 255, fontStyle: 'bold' },
            margin: { left: 20, right: 20 },
            styles: { fontSize: 9 },
          });

          yPos = doc.lastAutoTable.finalY + 15;
        } else if (
          moduleData.campaigns ||
          moduleData.ratingDistribution ||
          moduleData.statusDistribution
        ) {
          // Handle special data structures with tables
          const dataArray =
            moduleData.campaigns || moduleData.ratingDistribution || moduleData.statusDistribution;

          if (Array.isArray(dataArray) && dataArray.length > 0) {
            const tableData = dataArray.map((item) => [
              item._id || item.status || 'N/A',
              item.count || item.total || 0,
            ]);

            const headers = moduleData.campaigns
              ? ['Campaign Status', 'Count']
              : moduleData.ratingDistribution
                ? ['Rating', 'Count']
                : ['Status', 'Count'];

            doc.autoTable({
              startY: yPos,
              head: [headers],
              body: tableData,
              theme: 'striped',
              headStyles: { fillColor: [31, 78, 121], textColor: 255, fontStyle: 'bold' },
              margin: { left: 20, right: 20 },
              styles: { fontSize: 9 },
            });

            yPos = doc.lastAutoTable.finalY + 15;
          } else {
            doc.setTextColor(100, 100, 100);
            doc.text('No data available for this module', 20, yPos);
            yPos += 15;
          }
        } else if (Object.keys(moduleData).length === 0) {
          doc.setTextColor(100, 100, 100);
          doc.text('No data available for this module', 20, yPos);
          yPos += 15;
        } else {
          // Display other data as formatted key-value pairs
          doc.setFontSize(9);
          Object.entries(moduleData).forEach(([key, value]) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'bold');
            doc.text(`${key}:`, 20, yPos);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(80, 80, 80);
            const splitValue = doc.splitTextToSize(` ${displayValue}`, pageWidth - 60);
            doc.text(splitValue, 50, yPos);
            yPos += splitValue.length * 5 + 3;
          });
          yPos += 10;
        }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = (generatedReport.name || 'report').replace(/\s+/g, '_');
      doc.save(`${fileName}_${Date.now()}.pdf`);
      message.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('Failed to generate PDF');
    }
  };

  const handleDownloadCSV = () => {
    if (!generatedReport) return;

    // Convert report data to CSV format
    let csvContent = `Report: ${generatedReport.name || 'Untitled Report'}\n`;
    csvContent += `Generated: ${new Date(generatedReport.generatedAt).toLocaleString()}\n\n`;

    // Add data for each module
    Object.keys(generatedReport.data || {}).forEach((module) => {
      csvContent += `\n${module.toUpperCase()} Data\n`;
      csvContent += `-------------------\n`;
      csvContent += JSON.stringify(generatedReport.data[module], null, 2) + '\n';
    });

    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = (generatedReport.name || 'report').replace(/\s+/g, '_');
    link.download = `${fileName}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success('CSV report downloaded successfully!');
  };

  const steps = [
    {
      title: 'Basic Info',
      icon: <FileTextOutlined />,
    },
    {
      title: 'Select Modules',
      icon: <BarChartOutlined />,
    },
    {
      title: 'Visualizations',
      icon: <CheckCircleOutlined />,
    },
    {
      title: 'Scheduling',
      icon: <ClockCircleOutlined />,
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Form.Item
              name="reportName"
              label="Report Name"
              rules={[{ required: true, message: 'Please enter a report name' }]}
            >
              <Input placeholder="e.g., Monthly Sales Overview" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <TextArea rows={4} placeholder="Describe what this report will show..." />
            </Form.Item>
            <Form.Item name="dateRange" label="Default Date Range" initialValue="last30days">
              <Select>
                <Option value="last7days">Last 7 Days</Option>
                <Option value="last30days">Last 30 Days</Option>
                <Option value="last90days">Last 90 Days</Option>
                <Option value="thisMonth">This Month</Option>
                <Option value="lastMonth">Last Month</Option>
                <Option value="thisYear">This Year</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 1:
        return (
          <>
            <div style={{ marginBottom: '16px', fontWeight: 500 }}>
              Select the modules you want to include in this report:
            </div>
            <Checkbox.Group
              style={{ width: '100%' }}
              onChange={setSelectedModules}
              value={selectedModules}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {modules.map((module) => (
                  <Card key={module.value} size="small" hoverable>
                    <Checkbox value={module.value}>
                      <strong>{module.label}</strong>
                    </Checkbox>
                  </Card>
                ))}
              </Space>
            </Checkbox.Group>
            <Form.Item name="groupBy" label="Group Data By" style={{ marginTop: '24px' }}>
              <Select placeholder="Select grouping">
                <Option value="day">Day</Option>
                <Option value="week">Week</Option>
                <Option value="month">Month</Option>
                <Option value="quarter">Quarter</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 2:
        return (
          <>
            <p style={{ marginBottom: '16px' }}>Choose how you want to visualize the data:</p>
            <Checkbox.Group
              style={{ width: '100%' }}
              onChange={setSelectedVisualizations}
              value={selectedVisualizations}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {visualizationTypes.map((viz) => (
                  <Card key={viz.value} size="small" hoverable>
                    <Checkbox value={viz.value}>
                      <strong>{viz.label}</strong>
                    </Checkbox>
                  </Card>
                ))}
              </Space>
            </Checkbox.Group>

            <Card title="Summary" style={{ marginTop: '24px', background: '#f0f2f5' }} size="small">
              <p>
                <strong>Selected Modules:</strong>
              </p>
              <div style={{ marginBottom: '12px' }}>
                {selectedModules.map((mod) => (
                  <Tag key={mod} color="blue">
                    {mod.toUpperCase()}
                  </Tag>
                ))}
              </div>
              <p>
                <strong>Visualizations:</strong>
              </p>
              <div>
                {selectedVisualizations.map((viz) => (
                  <Tag key={viz} color="green">
                    {viz}
                  </Tag>
                ))}
              </div>
            </Card>
          </>
        );

      case 3:
        return (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Space align="center">
                <Switch checked={schedulingEnabled} onChange={setSchedulingEnabled} />
                <span style={{ fontWeight: 500 }}>Enable Automatic Report Scheduling</span>
              </Space>
            </div>

            {schedulingEnabled && (
              <>
                <Card style={{ marginBottom: '16px' }} size="small">
                  <Form.Item
                    name="scheduleFrequency"
                    label="Frequency"
                    rules={[{ required: true, message: 'Please select a frequency' }]}
                    initialValue="weekly"
                  >
                    <Radio.Group>
                      <Space direction="vertical">
                        <Radio value="daily">Daily</Radio>
                        <Radio value="weekly">Weekly</Radio>
                        <Radio value="monthly">Monthly</Radio>
                        <Radio value="quarterly">Quarterly</Radio>
                      </Space>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.scheduleFrequency !== currentValues.scheduleFrequency
                    }
                  >
                    {({ getFieldValue }) => {
                      const frequency = getFieldValue('scheduleFrequency');

                      if (frequency === 'weekly') {
                        return (
                          <Form.Item name="dayOfWeek" label="Day of Week" initialValue="1">
                            <Select>
                              <Option value="1">Monday</Option>
                              <Option value="2">Tuesday</Option>
                              <Option value="3">Wednesday</Option>
                              <Option value="4">Thursday</Option>
                              <Option value="5">Friday</Option>
                              <Option value="6">Saturday</Option>
                              <Option value="0">Sunday</Option>
                            </Select>
                          </Form.Item>
                        );
                      }

                      if (frequency === 'monthly') {
                        return (
                          <Form.Item name="dayOfMonth" label="Day of Month" initialValue={1}>
                            <InputNumber min={1} max={28} style={{ width: '100%' }} />
                          </Form.Item>
                        );
                      }

                      return null;
                    }}
                  </Form.Item>

                  <Form.Item name="scheduleTime" label="Time" initialValue={null}>
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item name="startDate" label="Start Date (Optional)">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item name="endDate" label="End Date (Optional)">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Card>

                <Card
                  title={
                    <>
                      <MailOutlined /> Email Delivery
                    </>
                  }
                  size="small"
                  style={{ marginBottom: '16px' }}
                >
                  <Form.Item
                    name="recipientEmails"
                    label="Recipient Emails"
                    rules={[
                      { required: true, message: 'Please add at least one email' },
                      {
                        type: 'array',
                        message: 'Please enter valid email addresses',
                      },
                    ]}
                  >
                    <Select
                      mode="tags"
                      style={{ width: '100%' }}
                      placeholder="Enter email addresses and press Enter"
                      tokenSeparators={[',', ' ']}
                    />
                  </Form.Item>

                  <Form.Item name="deliveryFormat" label="Report Format" initialValue="pdf">
                    <Radio.Group>
                      <Radio value="pdf">PDF</Radio>
                      <Radio value="csv">CSV</Radio>
                      <Radio value="json">JSON</Radio>
                      <Radio value="all">All Formats</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Card>

                <Card title="Summary" style={{ background: '#f0f2f5' }} size="small">
                  <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) => {
                      const frequency = getFieldValue('scheduleFrequency') || 'weekly';
                      const dayOfWeek = getFieldValue('dayOfWeek');
                      const dayOfMonth = getFieldValue('dayOfMonth');
                      const time = getFieldValue('scheduleTime');
                      const emails = getFieldValue('recipientEmails') || [];
                      const format = getFieldValue('deliveryFormat') || 'pdf';

                      const dayNames = [
                        'Sunday',
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                        'Friday',
                        'Saturday',
                      ];

                      let scheduleText = 'Report will be sent ';
                      if (frequency === 'daily') scheduleText += 'every day';
                      else if (frequency === 'weekly')
                        scheduleText += `every ${dayNames[dayOfWeek] || 'Monday'}`;
                      else if (frequency === 'monthly')
                        scheduleText += `on day ${dayOfMonth || 1} of each month`;
                      else if (frequency === 'quarterly') scheduleText += 'every quarter';

                      if (time) scheduleText += ` at ${time.format('HH:mm')}`;

                      return (
                        <>
                          <p>
                            <strong>Schedule:</strong> {scheduleText}
                          </p>
                          <p>
                            <strong>Format:</strong> {format.toUpperCase()}
                          </p>
                          <p>
                            <strong>Recipients:</strong>{' '}
                            {emails.length > 0 ? emails.join(', ') : 'None'}
                          </p>
                        </>
                      );
                    }}
                  </Form.Item>
                </Card>
              </>
            )}

            {!schedulingEnabled && (
              <Card style={{ textAlign: 'center', padding: '40px' }}>
                <ClockCircleOutlined
                  style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }}
                />
                <p style={{ color: '#8c8c8c' }}>
                  Enable scheduling to automatically send this report to recipients
                </p>
              </Card>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title="Custom Report Builder"
      open={visible}
      onCancel={handleClose}
      width={700}
      footer={null}
    >
      <Steps current={currentStep} style={{ marginBottom: '24px' }}>
        {steps.map((step) => (
          <Step key={step.title} title={step.title} icon={step.icon} />
        ))}
      </Steps>

      <Form form={form} layout="vertical">
        {renderStepContent()}
      </Form>

      {!generatedReport ? (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Space>
            {currentStep > 0 && <Button onClick={handlePrev}>Previous</Button>}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={handleNext}>
                Next
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={selectedModules.length === 0 || selectedVisualizations.length === 0}
              >
                Generate Report
              </Button>
            )}
          </Space>
        </div>
      ) : (
        <div style={{ marginTop: '24px' }}>
          <Card
            title="Report Generated Successfully!"
            style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}
          >
            <p>
              <strong>Report Name:</strong> {generatedReport.name}
            </p>
            <p>
              <strong>Generated:</strong> {new Date(generatedReport.generatedAt).toLocaleString()}
            </p>
            <p>
              <strong>Modules:</strong>{' '}
              {generatedReport.modules.map((mod) => (
                <Tag key={mod} color="blue">
                  {mod.toUpperCase()}
                </Tag>
              ))}
            </p>
            <div style={{ marginTop: '16px' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={handleDownloadPDF}
                  size="large"
                >
                  Download PDF
                </Button>
                <Button icon={<DownloadOutlined />} onClick={handleDownloadCSV}>
                  Download CSV
                </Button>
                <Button icon={<DownloadOutlined />} onClick={handleDownloadReport}>
                  Download JSON
                </Button>
                <Button onClick={() => setGeneratedReport(null)}>Create Another Report</Button>
                <Button onClick={handleClose}>Close</Button>
              </Space>
            </div>
          </Card>
        </div>
      )}
    </Modal>
  );
}
