import { useMoney } from '@/settings';

// Quick debug component to test money formatting
export default function DebugMoneyTest() {
  const { moneyFormatter } = useMoney();

  const testAmount = 245;

  let result;
  try {
    result = moneyFormatter({
      amount: testAmount,
      currency_code: 'USD',
    });
    console.log('Money formatter result:', { result, type: typeof result });
  } catch (error) {
    result = `Error: ${error.message}`;
    console.error('Money formatter error:', error);
  }

  return (
    <div>
      <p>Input: {testAmount}</p>
      <p>Output: {result}</p>
      <p>Type: {typeof result}</p>
    </div>
  );
}
