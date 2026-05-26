import SearchResultsDisplay from '@/components/SearchResultsDisplay';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { selectAdvancedSearchState } from '@/redux/erp/selectors';
import { buildAdvancedSearchQuery, formatSearchResults } from '@/utils/helpers';
import {
  FileSearchOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from '@/components/ui';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const { Panel } = Collapse;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const AdvancedSearch = ({
  entity = 'document',
  onSearchResults = null,
  allowedDocumentTypes = [
    'Invoice',
    'Contract',
    'Report',
    'Receipt',
    'Agreement',
    'Certificate',
    'Legal',
    'Financial',
    'Other',
  ],
  availableTags = [
    'Important',
    'Urgent',
    'Draft',
    'Final',
    'Approved',
    'Rejected',
    'Pending',
    'Review',
    'Archived',
    'Confidential',
    'External',
    'Internal',
  ],
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const translate = useLanguage();
  const [isSearchPerformed, setIsSearchPerformed] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');

  // Get search state from Redux
  const { result, isLoading } = useSelector(selectAdvancedSearchState) || {
    result: { result: [], pagination: {} },
    isLoading: false,
  };

  const [searchResults, setSearchResults] = useState([]);
  const [searchTerms, setSearchTerms] = useState([]);
  const [sortOptions, setSortOptions] = useState({
    sortField: 'created',
    sortOrder: 'desc',
  });

  // Update search results when Redux state changes
  useEffect(() => {
    console.log('Advanced Search - Redux State Changed:', result);
    console.log('Advanced Search - Result.result:', result?.result);
    console.log('Advanced Search - Result.pagination:', result?.pagination);

    if (result && result.result) {
      const formattedResults = formatSearchResults(result.result, searchTerms);
      console.log('Advanced Search - Formatted Results:', formattedResults);
      setSearchResults(formattedResults);

      if (onSearchResults && typeof onSearchResults === 'function') {
        onSearchResults(formattedResults, result.pagination);
      }
    }
  }, [result]);

  // Handle the advanced search submission
  const handleSearch = (values) => {
    console.log('Advanced Search - Form Values:', values);

    // Extract search terms for highlighting
    const textTerms = values.text
      ? values.text.split(' ').filter((term) => term.trim() !== '')
      : [];
    setSearchTerms(textTerms);

    // Prepare search parameters
    const searchParams = {
      ...values,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      ...sortOptions,
      page: 1,
      limit: 20,
    };

    // If date range is provided, format it properly
    if (values.dateRange && values.dateRange.length === 2) {
      searchParams.dateFrom = values.dateRange[0].format('YYYY-MM-DD');
      searchParams.dateTo = values.dateRange[1].format('YYYY-MM-DD');
      delete searchParams.dateRange;
    }

    console.log('Advanced Search - Search Params:', searchParams);

    // Build query and dispatch search action
    const queryOptions = buildAdvancedSearchQuery(searchParams);
    console.log('Advanced Search - Query Options:', queryOptions);

    dispatch(
      erp.advancedSearch({
        entity,
        options: queryOptions,
      })
    );

    setIsSearchPerformed(true);
  };

  // Handle tag selection
  const handleTagChange = (tags) => {
    setSelectedTags(tags);
    form.setFieldsValue({ tags });
  };

  // Handle adding a custom tag
  const handleAddTag = () => {
    if (customTag && !selectedTags.includes(customTag)) {
      const newTags = [...selectedTags, customTag];
      setSelectedTags(newTags);
      form.setFieldsValue({ tags: newTags });
      setCustomTag('');
    }
  };

  // Reset form and results
  const handleReset = () => {
    form.resetFields();
    setSelectedTags([]);
    setCustomTag('');
    setIsSearchPerformed(false);
    setSearchResults([]);

    if (onSearchResults && typeof onSearchResults === 'function') {
      onSearchResults([], {});
    }
  };

  // Handle sorting change
  const handleSortChange = (field, order) => {
    const newSortOptions = { sortField: field, sortOrder: order };
    setSortOptions(newSortOptions);

    // If search has already been performed, re-run search with new sort options
    if (isSearchPerformed) {
      const values = form.getFieldsValue();
      const searchParams = {
        ...values,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        ...newSortOptions,
        page: 1,
        limit: 20,
      };

      // If date range is provided, format it properly
      if (values.dateRange && values.dateRange.length === 2) {
        searchParams.dateFrom = values.dateRange[0].format('YYYY-MM-DD');
        searchParams.dateTo = values.dateRange[1].format('YYYY-MM-DD');
        delete searchParams.dateRange;
      }

      dispatch(
        erp.advancedSearch({
          entity,
          options: buildAdvancedSearchQuery(searchParams),
        })
      );
    }
  };

  return (
    <div>
      <Card
        className="advanced-search"
        styles={{
          body: { padding: '24px' }, // Using the new styles API instead of bodyStyle
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Title level={4}>
              <FileSearchOutlined /> {translate('Advanced Document Search')}
            </Title>
            <Divider />
          </Col>

          <Col span={24}>
            <Form form={form} name="advanced_search" layout="vertical" onFinish={handleSearch}>
              <Row gutter={16}>
                <Col xs={24} sm={24} md={12} lg={8}>
                  <Form.Item
                    name="text"
                    label={translate('Full-Text Search')}
                    tooltip={translate('Search across all text content in documents')}
                  >
                    <Input
                      placeholder={translate('Enter search terms...')}
                      allowClear
                      prefix={<SearchOutlined />}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={24} md={12} lg={8}>
                  <Form.Item name="title" label={translate('Document Title')}>
                    <Input placeholder={translate('Search by title...')} allowClear />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={24} md={12} lg={8}>
                  <Form.Item name="documentType" label={translate('Document Type')}>
                    <Select placeholder={translate('Select document type')} allowClear>
                      {allowedDocumentTypes.map((type) => (
                        <Option key={type} value={type}>
                          {type}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={24} md={12} lg={8}>
                  <Form.Item name="fileType" label={translate('File Type')}>
                    <Select placeholder={translate('Select file type')} allowClear>
                      <Option value="pdf">PDF</Option>
                      <Option value="doc">DOC/DOCX</Option>
                      <Option value="xls">XLS/XLSX</Option>
                      <Option value="txt">TXT</Option>
                      <Option value="csv">CSV</Option>
                      <Option value="img">Images (JPG/PNG)</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={24} md={12} lg={8}>
                  <Form.Item name="dateRange" label={translate('Date Range')}>
                    <RangePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
              </Row>

              <Collapse ghost>
                <Panel
                  header={
                    <Text strong>
                      <FilterOutlined /> {translate('Additional Filters')}
                    </Text>
                  }
                  key="additional-filters"
                >
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item label={translate('Tags')} name="tags">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Select
                            mode="multiple"
                            placeholder={translate('Select or create tags')}
                            value={selectedTags}
                            onChange={handleTagChange}
                            style={{ width: '100%' }}
                            allowClear
                          >
                            {availableTags.map((tag) => (
                              <Option key={tag} value={tag}>
                                {tag}
                              </Option>
                            ))}
                          </Select>

                          <Space>
                            <Input
                              placeholder={translate('Add custom tag')}
                              value={customTag}
                              onChange={(e) => setCustomTag(e.target.value)}
                              onPressEnter={handleAddTag}
                            />
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTag}>
                              {translate('Add')}
                            </Button>
                          </Space>

                          <div>
                            {selectedTags.map((tag) => (
                              <Tag
                                key={tag}
                                closable
                                onClose={() => {
                                  const newTags = selectedTags.filter((t) => t !== tag);
                                  setSelectedTags(newTags);
                                  form.setFieldsValue({ tags: newTags });
                                }}
                                style={{ margin: '5px 5px 0 0' }}
                              >
                                {tag}
                              </Tag>
                            ))}
                          </div>
                        </Space>
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={24} md={12}>
                      <Form.Item name="description" label={translate('Description')}>
                        <Input placeholder={translate('Search in description...')} allowClear />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={24} md={12}>
                      <Form.Item name="fileName" label={translate('File Name')}>
                        <Input placeholder={translate('Search by file name...')} allowClear />
                      </Form.Item>
                    </Col>
                  </Row>
                </Panel>

                <Panel
                  header={
                    <Text strong>
                      <SearchOutlined /> {translate('Sort Options')}
                    </Text>
                  }
                  key="sort-options"
                >
                  <Row gutter={16}>
                    <Col span={24}>
                      <Space>
                        <span>{translate('Sort by')}:</span>
                        <Select
                          value={sortOptions.sortField}
                          onChange={(value) => handleSortChange(value, sortOptions.sortOrder)}
                          style={{ width: 150 }}
                        >
                          <Option value="title">{translate('Title')}</Option>
                          <Option value="created">{translate('Date Created')}</Option>
                          <Option value="updated">{translate('Date Updated')}</Option>
                          <Option value="documentType">{translate('Document Type')}</Option>
                        </Select>

                        <Select
                          value={sortOptions.sortOrder}
                          onChange={(value) => handleSortChange(sortOptions.sortField, value)}
                          style={{ width: 120 }}
                        >
                          <Option value="asc">{translate('Ascending')}</Option>
                          <Option value="desc">{translate('Descending')}</Option>
                        </Select>
                      </Space>
                    </Col>
                  </Row>
                </Panel>
              </Collapse>

              <Divider />

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SearchOutlined />}
                    loading={isLoading}
                  >
                    {translate('Search')}
                  </Button>
                  <Button onClick={handleReset} icon={<UndoOutlined />}>
                    {translate('Reset')}
                  </Button>
                  <Tooltip
                    title={translate(
                      'Advanced search supports full-text search across document contents and metadata'
                    )}
                  >
                    <Button type="link">{translate('Search Tips')}</Button>
                  </Tooltip>
                </Space>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Card>

      {/* Display Search Results */}
      {isSearchPerformed && (
        <Card
          style={{ marginTop: '16px' }}
          title={
            <Space>
              <FileSearchOutlined />
              <span>
                {translate('Search Results')} ({result?.pagination?.total || 0})
              </span>
            </Space>
          }
        >
          <SearchResultsDisplay
            results={searchResults}
            loading={isLoading}
            pagination={result?.pagination}
            onPageChange={(page) => {
              const values = form.getFieldsValue();
              const searchParams = {
                ...values,
                tags: selectedTags.length > 0 ? selectedTags : undefined,
                ...sortOptions,
                page,
                limit: 20,
              };

              if (values.dateRange && values.dateRange.length === 2) {
                searchParams.dateFrom = values.dateRange[0].format('YYYY-MM-DD');
                searchParams.dateTo = values.dateRange[1].format('YYYY-MM-DD');
                delete searchParams.dateRange;
              }

              dispatch(
                erp.advancedSearch({
                  entity,
                  options: buildAdvancedSearchQuery(searchParams),
                })
              );
            }}
            showEmptyResults={true}
          />
        </Card>
      )}
    </div>
  );
};

export default AdvancedSearch;
