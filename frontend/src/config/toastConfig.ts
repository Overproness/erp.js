/**
 * Toast Notification Configuration
 * Sets up react-toastify with custom styles
 */

import 'react-toastify/dist/ReactToastify.css';
import './toastCustomStyles.css';

export const toastConfig = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
};

export default toastConfig;
