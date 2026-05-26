import { API_BASE_URL } from '@/config/serverApiConfig';
import { Spin } from '@/components/ui';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PublicDocumentShare from '../PublicDocumentShare';
import UrlRedirectModule from './UrlModule/UrlRedirectModule';

export default function RedirectHandler() {
  const { shortCode } = useParams();
  const [loading, setLoading] = useState(true);
  const [isDocumentShare, setIsDocumentShare] = useState(false);

  useEffect(() => {
    const checkUrlType = async () => {
      try {
        // Check the /api/s/:shortCode endpoint (API_BASE_URL already includes /api/)
        const response = await axios.get(`${API_BASE_URL}s/${shortCode}`, {
          headers: {
            'X-Public-Request': 'true', // Explicitly mark as public to avoid auth errors
          },
        });

        // Check if the response indicates it's a document share
        if (response.data?.isDocumentShare || response.data?.category === 'document_share') {
          setIsDocumentShare(true);
        } else {
          setIsDocumentShare(false);
        }
        setLoading(false);
      } catch (error) {
        // Check if the error response indicates it's a document share
        if (
          error.response?.data?.isDocumentShare ||
          error.response?.data?.category === 'document_share'
        ) {
          setIsDocumentShare(true);
        } else {
          setIsDocumentShare(false);
        }
        setLoading(false);
      }
    };

    checkUrlType();
  }, [shortCode]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // Route to appropriate handler based on URL type
  return isDocumentShare ? <PublicDocumentShare /> : <UrlRedirectModule shortCode={shortCode} />;
}
