import apolloClient from '@/graphql/client';
import { getListQuery } from '@/graphql/operations/crudFactory';
import { GET_TEAMS, LIST_TEAM_MEMBERS } from '@/graphql/operations/team';
import useLanguage from '@/locale/useLanguage';
import { CloseOutlined, InboxOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Typography,
  Upload,
} from '@/components/ui';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateTaskModule = ({ initialValues = null, isUpdateForm = false, onSave, onCancel }) => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Integration module states
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  // Fetch teams on component mount
  useEffect(() => {
    fetchTeams();
    fetchCustomers();
    fetchInvoices();
    fetchQuotes();
    fetchDocuments();
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to fetch customers from API
  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const { data } = await apolloClient.query({ query: getListQuery('client') });

      if (data.clientList?.success && data.clientList?.result) {
        const customersData = Array.isArray(data.clientList.result)
          ? data.clientList.result
          : data.clientList.result.items || [];
        setCustomers(customersData);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Function to fetch invoices from API
  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const { data } = await apolloClient.query({ query: getListQuery('invoice') });

      if (data.invoiceList?.success && data.invoiceList?.result) {
        const invoicesData = Array.isArray(data.invoiceList.result)
          ? data.invoiceList.result
          : data.invoiceList.result.items || [];
        setInvoices(invoicesData);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Function to fetch quotes from API
  const fetchQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const { data } = await apolloClient.query({ query: getListQuery('quote') });

      if (data.quoteList?.success && data.quoteList?.result) {
        const quotesData = Array.isArray(data.quoteList.result)
          ? data.quoteList.result
          : data.quoteList.result.items || [];
        setQuotes(quotesData);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Function to fetch documents from API
  const fetchDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const { data } = await apolloClient.query({ query: getListQuery('document') });

      if (data.documentList?.success && data.documentList?.result) {
        const documentsData = Array.isArray(data.documentList.result)
          ? data.documentList.result
          : data.documentList.result.items || [];
        setDocuments(documentsData);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Function to fetch appointments from API
  const fetchAppointments = async () => {
    try {
      const { data } = await apolloClient.query({ query: getListQuery('appointment') });

      if (data.appointmentList?.success && data.appointmentList?.result) {
        const appointmentsData = Array.isArray(data.appointmentList.result)
          ? data.appointmentList.result
          : data.appointmentList.result.items || [];
        setAppointments(appointmentsData);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // Silently fail - appointments are optional
    }
  };

  // Function to fetch teams from API
  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const { data } = await apolloClient.query({ query: GET_TEAMS });

      if (data.teamList?.success && data.teamList?.result) {
        const teamsData = Array.isArray(data.teamList.result)
          ? data.teamList.result
          : data.teamList.result.items || [];
        setTeams(teamsData);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      message.error(translate('Failed to load teams'));
    } finally {
      setLoadingTeams(false);
    }
  };

  // Function to handle team selection and fetch members
  const handleTeamChange = useCallback(
    async (teamId) => {
      setSelectedTeam(teamId);
      setTeamMembers([]);
      form.setFieldsValue({ assignedTo: undefined }); // Clear assignee when team changes

      if (!teamId) {
        return;
      }

      setLoadingMembers(true);
      try {
        const { data } = await apolloClient.query({
          query: LIST_TEAM_MEMBERS,
          variables: { id: teamId },
        });

        if (data.teamListMembers?.success && data.teamListMembers?.result) {
          setTeamMembers(data.teamListMembers.result);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        message.error(translate('Failed to load team members'));
      } finally {
        setLoadingMembers(false);
      }
    },
    [form, translate]
  );

  // Set form values when initialValues changes or in update mode
  useEffect(() => {
    if (initialValues) {
      try {
        // Process document sharing data for form
        const documentPurpose = {};
        const documentNotes = {};
        const documentIds = [];

        if (initialValues.documents && Array.isArray(initialValues.documents)) {
          initialValues.documents.forEach((doc) => {
            const docId = doc.document?._id || doc.document;
            documentIds.push(docId);
            documentPurpose[docId] = doc.purpose || 'reference';
            documentNotes[docId] = doc.notes || '';
          });
          setSelectedDocuments(documentIds);
        }

        // Convert dates to dayjs objects for the form
        const formattedValues = {
          ...initialValues,
          deadline: initialValues.deadline ? dayjs(initialValues.deadline) : null,
          assignedTeam: initialValues.assignedTeam?._id || initialValues.assignedTeam,
          assignedTo: initialValues.assignedTo?._id || initialValues.assignedTo,
          customer: initialValues.customer?._id || initialValues.customer,
          invoice: initialValues.invoice?._id || initialValues.invoice,
          quote: initialValues.quote?._id || initialValues.quote,
          appointment: initialValues.appointment?._id || initialValues.appointment,
          documents: documentIds,
          documentPurpose,
          documentNotes,
        };

        form.setFieldsValue(formattedValues);

        // If there's an assigned team, load its members
        if (formattedValues.assignedTeam) {
          handleTeamChange(formattedValues.assignedTeam);
        }

        // Set file list if attachments exist
        if (initialValues.attachments && initialValues.attachments.length > 0) {
          setFileList(
            initialValues.attachments.map((file, index) => ({
              uid: `-${index}`,
              name: file.name,
              status: 'done',
              url: file.url,
              size: file.size,
              type: file.type,
            }))
          );
        }
      } catch (error) {
        console.error('Error setting form values:', error);
      }
    }
  }, [initialValues, form, handleTeamChange]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Process document sharing data
      const documentsData =
        values.documents?.map((docId) => ({
          document: docId,
          purpose: values.documentPurpose?.[docId] || 'reference',
          notes: values.documentNotes?.[docId] || '',
          status: 'pending',
        })) || [];

      // Format values before submission
      const formattedValues = {
        ...values,
        deadline: values.deadline ? values.deadline.toISOString() : null,
        documents: documentsData,
        attachments: fileList.map((file) => ({
          name: file.name,
          url: file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : ''),
          size: file.size,
          type: file.type,
        })),
      };

      // Remove the temporary form fields
      delete formattedValues.documentPurpose;
      delete formattedValues.documentNotes;

      if (onSave) {
        await onSave(formattedValues, isUpdateForm ? initialValues?._id || id : null);
      }

      // Redirect back to tasks list if not in a modal context
      if (!onCancel) {
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      // Error message is handled by the parent component
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/tasks');
    }
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([...fileList, file]);
      return false;
    },
    fileList,
  };

  return (
    <Card style={{ borderRadius: '12px' }}>
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {isUpdateForm ? translate('Update Task') : translate('Create Task')}
        </Title>

        <Space>
          <Button icon={<CloseOutlined />} onClick={handleCancel}>
            {translate('Cancel')}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={loading}
          >
            {isUpdateForm ? translate('Update') : translate('Create')}
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: '0 0 24px 0' }} />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'pending',
          priority: 'medium',
        }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Form.Item
              name="title"
              label={translate('Title')}
              rules={[{ required: true, message: translate('Please enter task title') }]}
            >
              <Input placeholder={translate('Enter task title')} />
            </Form.Item>

            <Form.Item name="description" label={translate('Description')}>
              <TextArea placeholder={translate('Enter task description')} rows={4} />
            </Form.Item>

            <Form.Item name="attachments" label={translate('Attachments')}>
              <Upload.Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">{translate('Click or drag files to upload')}</p>
                <p className="ant-upload-hint">
                  {translate('Support for documents, images, etc.')}
                </p>
              </Upload.Dragger>
            </Form.Item>
          </Col>

          <Col xs={24} lg={8}>
            <Card size="small" title={translate('Task Details')} style={{ marginBottom: '24px' }}>
              <Form.Item
                name="status"
                label={translate('Status')}
                rules={[{ required: true, message: translate('Please select status') }]}
              >
                <Select placeholder={translate('Select status')}>
                  <Option value="pending">{translate('Pending')}</Option>
                  <Option value="assigned">{translate('Assigned')}</Option>
                  <Option value="in_progress">{translate('In Progress')}</Option>
                  <Option value="completed">{translate('Completed')}</Option>
                  <Option value="cancelled">{translate('Cancelled')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="priority"
                label={translate('Priority')}
                rules={[{ required: true, message: translate('Please select priority') }]}
              >
                <Select placeholder={translate('Select priority')}>
                  <Option value="low">{translate('Low')}</Option>
                  <Option value="medium">{translate('Medium')}</Option>
                  <Option value="high">{translate('High')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="deadline"
                label={translate('Deadline')}
                rules={[{ required: true, message: translate('Please select deadline') }]}
              >
                <DatePicker style={{ width: '100%' }} showTime format="YYYY-MM-DD HH:mm" />
              </Form.Item>

              <Form.Item
                name="assignedTeam"
                label={translate('Assigned Team')}
                rules={[{ required: true, message: translate('Please select a team') }]}
              >
                <Select
                  placeholder={translate('Select team')}
                  showSearch
                  optionFilterProp="children"
                  loading={loadingTeams}
                  onChange={handleTeamChange}
                  filterOption={(input, option) =>
                    (option?.children?.toLowerCase() ?? '').includes(input.toLowerCase())
                  }
                >
                  {Array.isArray(teams) &&
                    teams.map((team) => (
                      <Option key={team._id} value={team._id}>
                        {team.name}
                      </Option>
                    ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="assignedTo"
                label={translate('Assigned To')}
                rules={[{ required: false }]}
              >
                <Select
                  placeholder={
                    selectedTeam
                      ? translate('Select team member (optional)')
                      : translate('Please select a team first')
                  }
                  showSearch
                  optionFilterProp="children"
                  loading={loadingMembers}
                  disabled={!selectedTeam}
                  allowClear
                  filterOption={(input, option) =>
                    (option?.children?.toLowerCase() ?? '').includes(input.toLowerCase())
                  }
                >
                  {Array.isArray(teamMembers) &&
                    teamMembers.map((member) => (
                      <Option key={member.user._id} value={member.user._id}>
                        {member.user.name || member.user.email} ({member.role})
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Card>

            <Card
              size="small"
              title={translate('Additional Info')}
              style={{ marginBottom: '24px' }}
            >
              <Form.Item name="tags" label={translate('Tags')}>
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder={translate('Enter tags')}
                  tokenSeparators={[',']}
                />
              </Form.Item>
            </Card>

            <Card
              size="small"
              title={translate('Module Integration')}
              style={{ marginBottom: '24px' }}
            >
              <Form.Item name="customer" label={translate('Customer')}>
                <Select
                  placeholder={translate('Select customer (optional)')}
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  loading={loadingCustomers}
                  filterOption={(input, option) =>
                    (option?.children?.toLowerCase() ?? '').includes(input.toLowerCase())
                  }
                >
                  {Array.isArray(customers) &&
                    customers.map((customer) => (
                      <Option key={customer._id} value={customer._id}>
                        {customer.name}
                      </Option>
                    ))}
                </Select>
              </Form.Item>

              <Form.Item name="invoice" label={translate('Invoice')}>
                <Select
                  placeholder={translate('Select invoice (optional)')}
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  loading={loadingInvoices}
                  filterOption={(input, option) =>
                    (option?.children?.toLowerCase() ?? '').includes(input.toLowerCase())
                  }
                >
                  {Array.isArray(invoices) &&
                    invoices.map((invoice) => (
                      <Option key={invoice._id} value={invoice._id}>
                        #{invoice.number}/{invoice.year} - {invoice.client?.name || 'N/A'}
                      </Option>
                    ))}
                </Select>
              </Form.Item>

              <Form.Item name="quote" label={translate('Quote')}>
                <Select
                  placeholder={translate('Select quote (optional)')}
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  loading={loadingQuotes}
                  filterOption={(input, option) =>
                    (option?.children?.toLowerCase() ?? '').includes(input.toLowerCase())
                  }
                >
                  {Array.isArray(quotes) &&
                    quotes.map((quote) => (
                      <Option key={quote._id} value={quote._id}>
                        #{quote.number}/{quote.year} - {quote.client?.name || 'N/A'}
                      </Option>
                    ))}
                </Select>
              </Form.Item>

              <Form.Item name="appointment" label={translate('Appointment')}>
                <Select
                  placeholder={translate('Select appointment (optional)')}
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children?.toLowerCase() ?? '').includes(input.toLowerCase())
                  }
                >
                  {Array.isArray(appointments) &&
                    appointments.map((appointment) => (
                      <Option key={appointment._id} value={appointment._id}>
                        {appointment.title}
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </Card>

            <Card
              size="small"
              title={translate('Document Sharing')}
              style={{ marginBottom: '24px' }}
            >
              <Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                {translate('Share documents with team leads for approval or signing')}
              </Text>

              <Form.Item name="documents" label={translate('Select Documents')}>
                <Select
                  mode="multiple"
                  placeholder={translate('Select documents to share')}
                  showSearch
                  allowClear
                  optionFilterProp="children"
                  loading={loadingDocuments}
                  onChange={(values) => setSelectedDocuments(values)}
                  filterOption={(input, option) =>
                    (option?.children?.toLowerCase() ?? '').includes(input.toLowerCase())
                  }
                >
                  {Array.isArray(documents) &&
                    documents.map((doc) => (
                      <Option key={doc._id} value={doc._id}>
                        {doc.title} ({doc.documentType})
                      </Option>
                    ))}
                </Select>
              </Form.Item>

              {selectedDocuments && selectedDocuments.length > 0 && (
                <>
                  {selectedDocuments.map((docId, index) => {
                    const doc = documents.find((d) => d._id === docId);
                    return (
                      <Card
                        key={docId}
                        size="small"
                        title={doc?.title || `Document ${index + 1}`}
                        style={{ marginBottom: '8px', backgroundColor: '#fafafa' }}
                      >
                        <Form.Item
                          name={['documentPurpose', docId]}
                          label={translate('Purpose')}
                          style={{ marginBottom: '8px' }}
                        >
                          <Select placeholder={translate('Select purpose')}>
                            <Option value="reference">{translate('Reference')}</Option>
                            <Option value="approval">{translate('Approval')}</Option>
                            <Option value="signing">{translate('Signing')}</Option>
                            <Option value="review">{translate('Review')}</Option>
                            <Option value="attachment">{translate('Attachment')}</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item
                          name={['documentNotes', docId]}
                          label={translate('Notes')}
                          style={{ marginBottom: 0 }}
                        >
                          <TextArea
                            placeholder={translate('Add notes for this document')}
                            rows={2}
                          />
                        </Form.Item>
                      </Card>
                    );
                  })}
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default CreateTaskModule;
