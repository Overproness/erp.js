const useAppSettings = () => {
  let settings = {};
  settings['app_email'] = 'noreply@erpcrm.com';
  settings['base_url'] = 'https://cloud.erpcrm.com';
  return settings;
};

module.exports = useAppSettings;
