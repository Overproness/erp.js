import useLanguage from '@/locale/useLanguage';
import { Spin, message } from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ErrorPage from './ErrorPage';
import RedirectPage from './RedirectPage';

const UrlRedirectModule = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const { shortCode } = useParams();

  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [portal, setPortal] = useState(null);

  useEffect(() => {
    loadUrlData();
  }, [shortCode]);

  const loadUrlData = async (options = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      let params = {};
      if (options.password) params.password = options.password;

      const response = await axios.get(`/api/s/${shortCode}`, {
        params,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      if (response.data.success) {
        const urlData = response.data.result;
        setUrl(urlData);

        // Handle portals based on backend response
        setRequiresPassword(false);
        setIsExpired(false);
        setIsLimitReached(false);
        setPortal(null);

        if (urlData.isPasswordProtected) {
          setRequiresPassword(true);
          setPortal('password');
        } else if (urlData.isExpired) {
          setIsExpired(true);
          setPortal('expired');
        } else if (urlData.isLimitReached) {
          setIsLimitReached(true);
          setPortal('limit_reached');
        } else {
          handleRedirect(urlData);
        }
      } else {
        // Handle portal from backend
        if (response.data.portal) {
          setPortal(response.data.portal);
          setUrl({
            ...response.data,
            ...response.data.result,
            originalUrl:
              response.data.originalUrl ||
              (response.data.result && response.data.result.originalUrl),
          });
          setRequiresPassword(response.data.portal === 'password');
          setIsExpired(response.data.portal === 'expired');
          setIsLimitReached(response.data.portal === 'limit_reached');
        } else {
          setError(response.data.message || translate('URL not found'));
        }
      }
    } catch (err) {
      console.error('Redirect error:', err);

      // Handle specific HTTP status codes
      if (err.response) {
        const { status, data } = err.response;

        if (data && data.portal) {
          setPortal(data.portal);
          setUrl({
            ...data,
            ...data.result,
            originalUrl: data.originalUrl || (data.result && data.result.originalUrl),
          });
          setRequiresPassword(data.portal === 'password');
          setIsExpired(data.portal === 'expired');
          setIsLimitReached(data.portal === 'limit_reached');
        } else if (status === 404) {
          setError(translate('URL not found'));
        } else {
          setError(data.message || translate('Failed to load URL'));
        }
      } else {
        setError(translate('Failed to load URL'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = (urlData) => {
    const destinationUrl = urlData.originalUrl;
    window.location.href = destinationUrl;
  };

  // Remove the old handlePasswordSubmit POST logic and use loadUrlData with password
  const handlePasswordSubmit = async (password) => {
    try {
      // Try to load URL with password as query param
      await loadUrlData({ password });
      // If password is correct, the portal will disappear and redirect will happen
      // If incorrect, error will be set and portal will remain
      // We can check if error is set after loadUrlData
      if (!error) {
        return true;
      } else {
        message.error(translate('Incorrect password'));
        return false;
      }
    } catch (error) {
      message.error(translate('Password verification failed'));
      return false;
    }
  };

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

  if (error || (!url && !requiresPassword && !isExpired && !isLimitReached && !portal)) {
    return <ErrorPage error={error} shortCode={shortCode} />;
  }

  // Show portals according to backend response
  if (portal === 'password' || requiresPassword) {
    return (
      <RedirectPage
        url={url || { shortCode }}
        requiresPassword={true}
        isExpired={false}
        isLimitReached={false}
        onPasswordSubmit={handlePasswordSubmit}
        onBack={() => navigate(-1)}
      />
    );
  }
  if (portal === 'expired' || isExpired) {
    return (
      <RedirectPage
        url={url || { shortCode }}
        requiresPassword={false}
        isExpired={true}
        isLimitReached={false}
        onPasswordSubmit={handlePasswordSubmit}
        onBack={() => navigate(-1)}
      />
    );
  }
  if (portal === 'limit_reached' || isLimitReached) {
    return (
      <RedirectPage
        url={url || { shortCode }}
        requiresPassword={false}
        isExpired={false}
        isLimitReached={true}
        onPasswordSubmit={handlePasswordSubmit}
        onBack={() => navigate(-1)}
      />
    );
  }

  // This shouldn't be reached if auto-redirect works
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
};

export default UrlRedirectModule;
