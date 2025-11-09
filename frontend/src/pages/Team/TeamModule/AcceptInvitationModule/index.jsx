import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, Form, Input, Button, Alert, Typography, Spin, Divider, Space, Row, Col, notification } from 'antd';
import { API_BASE_URL } from '@/config/serverApiConfig';
import { clearAuthIfNeeded } from './utils';

const { Title, Text } = Typography;

const AcceptInvitationModule = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [invitationData, setInvitationData] = useState(null);
  const [form] = Form.useForm();
  
  // Debug the API URL being used
  console.log('Using API base URL:', API_BASE_URL);
  console.log('Current invitation token:', token);
    // Clear any existing auth on component mount to ensure the invitation flow works correctly
  useEffect(() => {
    try {
      // Clear all auth data from localStorage, sessionStorage, and Redux
      localStorage.removeItem('auth');
      sessionStorage.removeItem('auth');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
      
      // Create a clean axios without any auth headers
      const cleanAxios = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'X-Public-Request': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      // Override axios defaults for this page
      Object.keys(axios.defaults.headers.common).forEach(key => {
        if (key !== 'Content-Type') {
          delete axios.defaults.headers.common[key];
        }
      });
      
      console.log('Existing authentication cleared to ensure proper invitation flow');
    } catch (err) {
      console.error('Error clearing auth data:', err);
    }
  }, []);useEffect(() => {    const fetchInvitationDetails = async () => {
      try {
        setLoading(true);
        console.log('Attempting to fetch invitation with token:', token);
        
        // Create a completely fresh axios instance that won't be affected by interceptors
        const publicAxios = axios.create({
          baseURL: API_BASE_URL,
          headers: {
            'X-Public-Request': 'true',
            'Content-Type': 'application/json'
          }
        });
        
        // Remove any auth headers to ensure we're making a clean public request
        delete publicAxios.defaults.headers.common['Authorization'];
        publicAxios.interceptors.request.use(config => {
          // Force remove any auth headers that might be added by other interceptors
          delete config.headers.Authorization;
          return config;
        });        // Use the team invitation API endpoint that doesn't require authentication
        // Make sure we're using the correct endpoint format without double /api/ prefixes
        // API_BASE_URL already ends with api/, so we don't need to include it again
        console.log(`Making request to: ${API_BASE_URL}public/team/${token}`);
        const response = await publicAxios.get(`public/team/${token}`);
        console.log('Invitation details response:', response.data);
        
        if (response.data.success) {
          setInvitationData(response.data.result);
        } else {
          setError("Invalid or expired invitation");
        }
      } catch (err) {
        console.error('Error fetching invitation details:', err.response || err);
        setError(err.response?.data?.message || "Invalid or expired invitation");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [token]);const onFinish = async (values) => {
    try {
      setSubmitting(true);
      console.log('Accepting invitation with password:', values.password ? '****' : 'none');
      
      // Create a completely fresh axios instance that won't be affected by interceptors
      const publicAxios = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'X-Public-Request': 'true',
          'Content-Type': 'application/json'
        }
      });
      
      // Remove any auth headers to ensure we're making a clean public request
      delete publicAxios.defaults.headers.common['Authorization'];
      publicAxios.interceptors.request.use(config => {
        // Force remove any auth headers that might be added by other interceptors
        delete config.headers.Authorization;
        return config;
      });        // API_BASE_URL already ends with api/, so we need to use the correct path format
        // The backend route is mounted at /api/public/team/:token/accept
        const response = await publicAxios.post(`public/team/${token}/accept`, {
          password: values.password
        });
      
      console.log('Accept invitation response:', response.data);
      
      if (response.data.success) {
        notification.success({
          message: 'Account Created',
          description: 'Your account has been set up successfully. You can now login with your email and password.',
        });
        
        // Navigate to login page after successful password setup
        navigate('/login', { 
          state: { 
            message: "Your account has been set up successfully. You can now login with your email and password." 
          }
        });
      }
    } catch (err) {
      console.error('Error accepting invitation:', err.response || err);
      setError(err.response?.data?.message || "Failed to accept invitation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: '80vh' }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card>
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
            />
            <Divider />
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  return (
    <Row justify="center" align="middle" style={{ minHeight: '80vh' }}>
      <Col xs={24} sm={20} md={16} lg={12} xl={8}>
        <Card>
          <Title level={2}>Accept Team Invitation</Title>
          <Divider />
          
          <div style={{ marginBottom: '24px' }}>
            <Text>Hello <strong>{invitationData.name}</strong>,</Text>
            <br />
            <Text>
              You've been invited to join <strong>{invitationData.team.name}</strong> as a team member. 
              Please set your password to complete your account setup.
            </Text>
          </div>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item
              label="Set Your Password"
              name="password"
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password />
            </Form.Item>
            
            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  Accept Invitation
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export { AcceptInvitationModule };
