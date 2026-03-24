import { useState } from 'react';

export default function useOnFetch() {
  const [result, setResult] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  let onFetch = async (callback) => {
    setIsLoading(true);
    try {
      const data = await callback;
      setResult(data.result);
      if (data.success === true) {
        setIsSuccess(true);
      } else {
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('useOnFetch error:', error);
      setResult(null);
      setIsSuccess(false);
    }
    setIsLoading(false);
  };

  return { onFetch, result, isSuccess, isLoading };
}
