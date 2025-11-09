const useDate = ({ settings }) => {
  const { app_date_format } = settings;

  const dateFormat = app_date_format;

  return {
    dateFormat,
  };
};

module.exports = useDate;
