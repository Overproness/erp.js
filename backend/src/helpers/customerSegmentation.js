const calculateCustomerSegment = (customer) => {
  let points = 0;
  
  // Calculate based on total purchases
  if (customer.customerValue?.totalPurchases) {
    if (customer.customerValue.totalPurchases > 100) points += 30;
    else if (customer.customerValue.totalPurchases > 50) points += 20;
    else if (customer.customerValue.totalPurchases > 20) points += 10;
  }

  // Calculate based on lifetime value
  if (customer.customerValue?.lifetimeValue) {
    if (customer.customerValue.lifetimeValue > 10000) points += 30;
    else if (customer.customerValue.lifetimeValue > 5000) points += 20;
    else if (customer.customerValue.lifetimeValue > 1000) points += 10;
  }

  // Calculate based on purchase frequency
  if (customer.behavior?.purchaseFrequency === 'high') points += 20;
  else if (customer.behavior?.purchaseFrequency === 'medium') points += 10;

  // Determine segment based on points
  if (points >= 70) return 'platinum';
  else if (points >= 50) return 'gold';
  else if (points >= 30) return 'silver';
  return 'bronze';
};

module.exports = { calculateCustomerSegment };