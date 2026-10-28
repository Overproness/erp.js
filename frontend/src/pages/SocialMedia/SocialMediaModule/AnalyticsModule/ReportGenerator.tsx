import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Select, 
  DatePicker, 
  Button, 
  Checkbox, 
  Row, 
  Col,
  Divider,
  Typography,
  Space,
  Table,
  Tag,
  Progress,
  message,
  Statistic
} from '@/components/ui';
import {
  FileTextOutlined,
  DownloadOutlined,
  MailOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  BarChartOutlined
} from '@/components/icons';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';
import { usePostManagement } from '@/hooks/useSocialMedia';

// jsPDF and jspdf-autotable are loaded on-demand (only when the user
// triggers an export) to keep them out of the initial bundle.
const loadPdfLibraries = async (): Promise<typeof import('jspdf').default | false> => {
  try {
    const [{ default: jsPDF }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    // Verify the autoTable plugin attached correctly
    const probe = new jsPDF();
    if (typeof (probe as any).autoTable !== 'function') {
      throw new Error('autoTable function not available');
    }
    return jsPDF;
  } catch (error) {
    console.error('Failed to load PDF libraries:', error);
    return false;
  }
};

const ReportGenerator = () => {
  const translate = useLanguage();
  const { posts } = usePostManagement();
  const [form] = Form.useForm();
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const reportTypes = [
    { value: 'performance', label: translate('Performance Report') },
    { value: 'engagement', label: translate('Engagement Report') },
    { value: 'growth', label: translate('Growth Report') },
    { value: 'roi', label: translate('ROI Report') },
    { value: 'custom', label: translate('Custom Report') }
  ];

  const metrics = [
    { value: 'followers', label: translate('Followers') },
    { value: 'engagement', label: translate('Engagement') },
    { value: 'reach', label: translate('Reach') },
    { value: 'impressions', label: translate('Impressions') },
    { value: 'clicks', label: translate('Clicks') },
    { value: 'shares', label: translate('Shares') },
    { value: 'comments', label: translate('Comments') },
    { value: 'likes', label: translate('Likes') }
  ];

  const platforms = [
    { value: 'facebook', label: 'Facebook', icon: <FacebookOutlined /> },
    { value: 'instagram', label: 'Instagram', icon: <InstagramOutlined /> },
    { value: 'twitter', label: 'Twitter', icon: <TwitterOutlined /> }
  ];

  const handleGeneratePreview = async () => {
    try {
      const values = await form.validateFields();
      setGenerating(true);
      
      // Calculate analytics from dummy posts data
      const calculateAnalytics = () => {
        // Filter posts by date range if available
        const dateRange = values.dateRange;
        let filteredPosts = Array.isArray(posts) ? [...posts] : [];
        
        if (dateRange && dateRange.length === 2) {
          filteredPosts = filteredPosts.filter(post => {
            const postDate = dayjs(post.scheduledAt);
            return postDate.isAfter(dateRange[0]) && postDate.isBefore(dateRange[1]);
          });
        }
        
        // Filter by platforms if selected
        if (values.platforms && values.platforms.length > 0) {
          filteredPosts = filteredPosts.filter(post => 
            post.platforms.some(platform => values.platforms.includes(platform))
          );
        }
        
        // Count published posts
        const publishedPosts = filteredPosts.filter(post => post.status === 'published');
        
        // Calculate total engagement
        const totalEngagement = publishedPosts.reduce((sum, post) => 
          sum + (post.performance?.engagement || 0), 0);
        
        // Calculate total reach
        const totalReach = publishedPosts.reduce((sum, post) => 
          sum + (post.performance?.reach || 0), 0);
        
        // Calculate platform breakdown
        const platformBreakdown = [];
        const platformStats = {};
        
        // Initialize platform stats
        for (const platform of ['facebook', 'instagram', 'twitter']) {
          platformStats[platform] = {
            posts: 0,
            engagement: 0,
            reach: 0
          };
        }
        
        // Aggregate stats by platform
        publishedPosts.forEach(post => {
          post.platforms.forEach(platform => {
            if (platformStats[platform]) {
              platformStats[platform].posts += 1;
              platformStats[platform].engagement += post.performance.engagement / post.platforms.length;
              platformStats[platform].reach += post.performance.reach / post.platforms.length;
            }
          });
        });
        
        // Convert to array format for the report
        for (const [platform, stats] of Object.entries(platformStats)) {
          if (stats.posts > 0) {
            platformBreakdown.push({
              platform,
              posts: stats.posts,
              engagement: Math.round(stats.engagement),
              reach: Math.round(stats.reach)
            });
          }
        }
        
        // Get top posts
        const topPosts = publishedPosts
          .sort((a, b) => b.performance.engagement - a.performance.engagement)
          .slice(0, 5)
          .map(post => ({
            content: post.content,
            platform: post.platforms[0],
            engagement: post.performance.engagement,
            reach: post.performance.reach
          }));
        
        return {
          summary: {
            totalPosts: filteredPosts.length,
            totalEngagement: totalEngagement,
            avgEngagementRate: filteredPosts.length > 0 ? 
              ((totalEngagement / totalReach) * 100).toFixed(1) : 0,
            totalReach: totalReach,
            followerGrowth: 12.5 // This could be calculated if we had historical data
          },
          platformBreakdown,
          topPosts
        };
      };
      
      // Generate analytics from dummy data
      const analytics = calculateAnalytics();
      
      // Set preview data with actual calculations
      setTimeout(() => {
        setPreviewData(analytics);
        setGenerating(false);
      }, 1000);
    } catch (error) {
      console.error('Form validation failed:', error);
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    try {
      setGenerating(true);
      
      if (!previewData) {
        message.error('No report data to export');
        setGenerating(false);
        return;
      }
      
      // Ensure PDF libraries are properly loaded
      const jsPDF = await loadPdfLibraries();
      if (!jsPDF) {
        message.error('PDF export failed: Could not load PDF generation libraries');
        setGenerating(false);
        return;
      }
      
      // Create PDF document
      const doc = new jsPDF();
      const formValues = form.getFieldsValue();
      const dateRange = formValues.dateRange;
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      // First perform a test to verify autoTable is working
      try {
        doc.autoTable({
          head: [['Test']],
          body: [['Test data']],
          startY: 20,
        });
        console.log('autoTable test successful');
      } catch (error) {
        console.error('autoTable test failed:', error);
        message.error('PDF export failed: PDF table functionality not available');
        setGenerating(false);
        return;
      }
      
      // Proceed with report generation
      doc.deletePage(1); // Remove test page
      doc.addPage(); // Add fresh page
      
      // Continue with normal PDF generation
      doc.setFontSize(20);
      const reportTitle = formValues.reportType ? `${formValues.reportType.charAt(0).toUpperCase() + formValues.reportType.slice(1)} Report` : 'Report';
      doc.text(reportTitle, 20, 20);
      
      // Add date range
      doc.setFontSize(12);
      doc.text(`Date Range: ${startDate} to ${endDate}`, 20, 30);
      
      // Add platforms - ensure we have platforms array before proceeding
      if (formValues.platforms && Array.isArray(formValues.platforms)) {
        const platformsText = formValues.platforms
          .map(p => p.charAt(0).toUpperCase() + p.slice(1))
          .join(', ');
        doc.text(`Platforms: ${platformsText}`, 20, 40);
      } else {
        doc.text('Platforms: All', 20, 40);
      }
      
      // Add summary section
      doc.setFontSize(16);
      doc.text('Summary', 20, 55);
      
      // Add summary data - ensure all values are properly stringified
      doc.setFontSize(12);
      doc.text(`Total Posts: ${previewData.summary.totalPosts || 0}`, 20, 65);
      doc.text(`Total Engagement: ${previewData.summary.totalEngagement || 0}`, 20, 75);
      doc.text(`Average Engagement Rate: ${previewData.summary.avgEngagementRate || 0}%`, 20, 85);
      doc.text(`Total Reach: ${previewData.summary.totalReach || 0}`, 20, 95);
      doc.text(`Follower Growth: ${previewData.summary.followerGrowth || 0}%`, 20, 105);
      
      // Add platform breakdown table
      doc.setFontSize(16);
      doc.text('Platform Breakdown', 20, 120);
      
      // Create table data for platform breakdown
      const platformHeaders = [['Platform', 'Posts', 'Engagement', 'Reach']];
      const platformData = previewData.platformBreakdown.map(item => [
        (item.platform ? item.platform.charAt(0).toUpperCase() + item.platform.slice(1) : 'Unknown'),
        String(item.posts || 0),
        String((item.engagement || 0).toLocaleString()),
        String((item.reach || 0).toLocaleString())
      ]);
      
      // Try-catch for better error handling around the autoTable calls
      try {
        // Create platform breakdown table
        doc.autoTable({
          startY: 125,
          head: platformHeaders,
          body: platformData,
          theme: 'grid',
          styles: { overflow: 'linebreak', cellWidth: 'auto' },
          headStyles: { fillColor: [63, 81, 181], textColor: [255, 255, 255] }
        });
        
        // Add top posts table
        let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 125;
        
        // Set font for section title
        doc.setFontSize(16);
        doc.text('Top Performing Posts', 20, finalY + 15);
        
        // Create headers and data for top posts
        const postsHeaders = [['Content', 'Platform', 'Engagement', 'Reach']];
        const postsData = previewData.topPosts.map(item => [
          item.content.substring(0, 40) + '...',
          item.platform.charAt(0).toUpperCase() + item.platform.slice(1),
          item.engagement.toLocaleString(),
          item.reach.toLocaleString()
        ]);
        
        // Create top posts table
        doc.autoTable({
          startY: finalY + 20,
          head: postsHeaders,
          body: postsData,
          theme: 'grid',
          headStyles: { fillColor: [63, 81, 181] }
        });
        
        // Add footer with date
        const currentDate = new Date().toLocaleDateString();
        doc.setFontSize(10);
        doc.text(`Generated on ${currentDate}`, 20, doc.internal.pageSize.height - 10);
        
        // Save the PDF
        doc.save(`${formValues.reportType}_report_${startDate}_${endDate}.pdf`);
        message.success('PDF Report downloaded successfully');
      } catch (err) {
        console.error('Error in PDF generation:', err);
        message.error(`Failed to generate PDF: ${err.message}`);
      }
      
      setGenerating(false);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Export failed: ' + (error.message || 'Unknown error'));
      setGenerating(false);
    }
  };

  const handleEmailReport = async () => {
    try {
      setGenerating(true);
      // Simulate email process
      setTimeout(() => {
        message.success('Report sent via email');
        setGenerating(false);
      }, 1500);
    } catch (error) {
      message.error('Email failed');
      setGenerating(false);
    }
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#E4405F' }} />,
      twitter: <TwitterOutlined style={{ color: '#1DA1F2' }} />
    };
    return icons[platform];
  };

  const platformColumns = [
    {
      title: translate('Platform'),
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => (
        <Space>
          {getPlatformIcon(platform)}
          <Text strong>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Text>
        </Space>
      ),
    },
    {
      title: translate('Posts'),
      dataIndex: 'posts',
      key: 'posts',
    },
    {
      title: translate('Engagement'),
      dataIndex: 'engagement',
      key: 'engagement',
      render: (value) => value.toLocaleString(),
    },
    {
      title: translate('Reach'),
      dataIndex: 'reach',
      key: 'reach',
      render: (value) => value.toLocaleString(),
    },
  ];

  const topPostsColumns = [
    {
      title: translate('Content'),
      dataIndex: 'content',
      key: 'content',
      render: (text) => (
        <div style={{ maxWidth: '200px' }}>
          {text.substring(0, 60)}...
        </div>
      ),
    },
    {
      title: translate('Platform'),
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => (
        <Tag icon={getPlatformIcon(platform)}>
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </Tag>
      ),
    },
    {
      title: translate('Engagement'),
      dataIndex: 'engagement',
      key: 'engagement',
      render: (value) => value.toLocaleString(),
    },
    {
      title: translate('Reach'),
      dataIndex: 'reach',
      key: 'reach',
      render: (value) => value.toLocaleString(),
    },
  ];

  return (
    <div>
      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card title={translate('Report Configuration')}>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                reportType: 'performance',
                dateRange: [dayjs().subtract(30, 'days'), dayjs()],
                platforms: ['facebook', 'instagram', 'twitter'],
                metrics: ['followers', 'engagement', 'reach']
              }}
            >
              <Form.Item
                name="reportType"
                label={translate('Report Type')}
                rules={[{ required: true, message: translate('Please select report type') }]}
              >
                <Select placeholder={translate('Select report type')}>
                  {reportTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="dateRange"
                label={translate('Date Range')}
                rules={[{ required: true, message: translate('Please select date range') }]}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="platforms"
                label={translate('Platforms')}
                rules={[{ required: true, message: translate('Please select platforms') }]}
              >
                <Checkbox.Group style={{ width: '100%' }}>
                  <Row>
                    {platforms.map(platform => (
                      <Col span={24} key={platform.value} style={{ marginBottom: '8px' }}>
                        <Checkbox value={platform.value}>
                          <Space>
                            {platform.icon}
                            {platform.label}
                          </Space>
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Checkbox.Group>
              </Form.Item>

              <Form.Item
                name="metrics"
                label={translate('Metrics to Include')}
                rules={[{ required: true, message: translate('Please select metrics') }]}
              >
                <Checkbox.Group style={{ width: '100%' }}>
                  <Row>
                    {metrics.map(metric => (
                      <Col span={12} key={metric.value} style={{ marginBottom: '8px' }}>
                        <Checkbox value={metric.value}>
                          {metric.label}
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Checkbox.Group>
              </Form.Item>

              <Divider />

              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<BarChartOutlined />}
                  onClick={handleGeneratePreview}
                  loading={generating}
                  block
                >
                  {translate('Generate Preview')}
                </Button>

                {previewData && (
                  <>
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={handleExport} // Remove parameter as we're only using PDF
                      loading={generating}
                      block
                    >
                      {translate('Export as PDF')} {/* Change button text to be more specific */}
                    </Button>

                    {/* <Button
                      icon={<MailOutlined />}
                      onClick={handleEmailReport}
                      loading={generating}
                      block
                    >
                      {translate('Email Report')}
                    </Button> */}
                  </>
                )}
              </Space>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          {previewData ? (
            <Card title={translate('Report Preview')} extra={<FileTextOutlined />}>
              {/* Summary Section */}
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>{translate('Summary')}</Title>
                <Row gutter={16}>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic
                        title={translate('Total Posts')}
                        value={previewData.summary.totalPosts}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic
                        title={translate('Total Engagement')}
                        value={previewData.summary.totalEngagement}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic
                        title={translate('Avg. Engagement Rate')}
                        value={previewData.summary.avgEngagementRate}
                        precision={1}
                        suffix="%"
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>

              {/* Platform Breakdown */}
              <div style={{ marginBottom: '24px' }}>
                <Title level={4}>{translate('Platform Breakdown')}</Title>
                <Table
                  columns={platformColumns}
                  dataSource={previewData.platformBreakdown}
                  pagination={false}
                  size="small"
                  rowKey="platform"
                />
              </div>

              {/* Top Posts */}
              <div>
                <Title level={4}>{translate('Top Performing Posts')}</Title>
                <Table
                  columns={topPostsColumns}
                  dataSource={previewData.topPosts}
                  pagination={false}
                  size="small"
                  rowKey="content"
                />
              </div>
            </Card>
          ) : (
            <Card title={translate('Report Preview')}>
              <div style={{ 
                textAlign: 'center', 
                padding: '60px', 
                color: '#6b7280' 
              }}>
                <FileTextOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <Text>{translate('Generate a preview to see your report')}</Text>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default ReportGenerator;