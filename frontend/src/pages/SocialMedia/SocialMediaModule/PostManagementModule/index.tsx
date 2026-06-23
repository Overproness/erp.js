import React, { useState } from 'react';
import { Tabs, Button, Space } from '@/components/ui';
import { ArrowLeftOutlined, CalendarOutlined, PlusOutlined, EditOutlined, UnorderedListOutlined, EyeOutlined } from '@/components/icons';
import { useNavigate } from 'react-router-dom';
import PostEditor from './PostEditor';
import PostList from './PostList';
import PostCalendar from './PostCalendar';
import PostPreview from './PostPreview';
import useLanguage from '@/locale/useLanguage';

const { TabPane } = Tabs;

const PostManagementModule = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Add this to track where navigation came from
  const [currentView, setCurrentView] = useState('list');

  const handleBack = () => {
    navigate('/social-media');
  };

  const handleCreatePost = () => {
    setSelectedPost(null);
    setIsCreating(true);
    setActiveTab('editor');
    setCurrentView('new'); // Add this to track that we're creating a new post
  };

  const handleEditPost = (post) => {
    setSelectedPost(post);
    setIsCreating(false);
    setActiveTab('editor');
    setCurrentView('edit'); // Add this to track that we're editing a post
  };

  const handlePreviewPost = (post) => {
    setSelectedPost(post);
    setActiveTab('preview');
  };

  const handlePostSaved = () => {
    setIsCreating(false);
    setSelectedPost(null);
    setActiveTab('list');
    setCurrentView('list');
  };

  // Create a separate variable for the editor tab title
  const editorTabTitle = (
    <span>
      <PlusOutlined />
      {/* Always show "+ New Post" when creating, and "Edit Post" when editing */}
      {isCreating || currentView === 'new' ? `+ ${translate('New Post')}` : translate('Edit Post')}
    </span>
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
          >
            {translate('Back to Social Media')}
          </Button>
        </Space>
        
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            {translate('Post Management')}
          </h3>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Create, schedule, and manage your social media posts
          </p>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          // If navigating to the editor tab from elsewhere, respect the current mode
          // Don't change isCreating state here, as it would reset the form
        }}
        type="card"
        tabPosition="top"
      >
        <TabPane
          tab={
            <span>
              <UnorderedListOutlined />
              {translate('All Posts')}
            </span>
          }
          key="list"
        >
          <PostList 
            onEditPost={handleEditPost}
            onPreviewPost={handlePreviewPost}
          />
        </TabPane>

        <TabPane
          tab={
            <span>
              <CalendarOutlined />
              {translate('Calendar')}
            </span>
          }
          key="calendar"
        >
          <PostCalendar 
            onEditPost={handleEditPost}
            onCreatePost={handleCreatePost}
          />
        </TabPane>

        <TabPane
          tab={editorTabTitle}
          key="editor"
        >
          <PostEditor 
            post={selectedPost}
            isCreating={isCreating}
            onSave={handlePostSaved}
            onCancel={() => setActiveTab('list')}
          />
        </TabPane>

        {selectedPost && (
          <TabPane
            tab={
              <span>
                <EyeOutlined />
                {translate('Preview')}
              </span>
            }
            key="preview"
          >
            <PostPreview 
              post={selectedPost}
              onEdit={() => handleEditPost(selectedPost)}
              onBack={() => setActiveTab('list')}
            />
          </TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default PostManagementModule;
