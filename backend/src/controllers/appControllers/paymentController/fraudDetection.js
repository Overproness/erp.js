const mongoose = require('mongoose');
const Payment = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');
const { aiSettings } = require('@/config');

/**
 * AI Fraud Detection for Payment Transactions
 * Analyzes payment patterns and detects potential fraud
 */
const detectPaymentFraud = async (req, res) => {
  try {
    const { invoiceId } = req.body;

    // Permission check
    if (req.user && !req.user.permissions?.canReadPayments) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to access payments',
      });
    }

    // Validate invoice ID
    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invoice ID is required',
      });
    }

    // Get company ID for access control
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;

    // Find the invoice with all payments
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      companyID,
      removed: false,
    })
      .populate('client')
      .populate({
        path: 'payment',
        populate: {
          path: 'paymentMode',
        },
      });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Invoice not found or access denied',
      });
    }

    // Get all payments for this invoice
    const payments = await Payment.find({
      invoice: invoiceId,
      companyID,
      removed: false,
    })
      .populate('client')
      .populate('paymentMode')
      .sort({ date: 1 });

    if (!payments || payments.length === 0) {
      return res.status(200).json({
        success: true,
        result: {
          riskLevel: 'low',
          score: 0,
          flags: [],
          summary: 'No payments found for analysis',
          recommendations: [],
        },
        message: 'No payments to analyze',
      });
    }

    // Get historical payments for this client
    const clientPaymentHistory = await Payment.find({
      client: invoice.client._id,
      companyID,
      removed: false,
    })
      .populate('invoice')
      .sort({ date: -1 })
      .limit(50);

    // Prepare data for AI analysis
    const analysisData = {
      invoice: {
        id: invoice._id,
        number: invoice.number,
        total: invoice.total,
        discount: invoice.discount,
        currency: invoice.currency,
        date: invoice.date,
        expiredDate: invoice.expiredDate,
        paymentStatus: invoice.paymentStatus,
        credit: invoice.credit,
        remainingBalance: invoice.total - invoice.discount - invoice.credit,
      },
      client: {
        name: invoice.client.name,
        email: invoice.client.email,
        phone: invoice.client.phone,
      },
      currentPayments: payments.map((p) => ({
        id: p._id,
        number: p.number,
        amount: p.amount,
        date: p.date,
        paymentMode: p.paymentMode?.name || 'Unknown',
        reference: p.ref,
        description: p.description,
        created: p.created,
      })),
      paymentHistory: clientPaymentHistory.map((p) => ({
        amount: p.amount,
        date: p.date,
        paymentMode: p.paymentMode?.name || 'Unknown',
        invoiceAmount: p.invoice?.total || 0,
      })),
      statistics: {
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
        averagePaymentAmount:
          clientPaymentHistory.length > 0
            ? clientPaymentHistory.reduce((sum, p) => sum + p.amount, 0) /
              clientPaymentHistory.length
            : 0,
        clientTotalPayments: clientPaymentHistory.length,
      },
    };

    // Rule-based fraud detection
    const fraudIndicators = [];
    let riskScore = 0;

    // Check 1: Payment amount exceeds invoice total
    if (analysisData.statistics.totalAmount > invoice.total - invoice.discount) {
      fraudIndicators.push({
        type: 'overpayment',
        severity: 'high',
        message: 'Total payments exceed invoice amount',
        details: `Payments: ${analysisData.statistics.totalAmount}, Invoice: ${
          invoice.total - invoice.discount
        }`,
      });
      riskScore += 30;
    }

    // Check 2: Multiple payments in short time period
    if (payments.length > 1) {
      const timeDiffs = [];
      for (let i = 1; i < payments.length; i++) {
        const diff = Math.abs(new Date(payments[i].date) - new Date(payments[i - 1].date));
        const hoursDiff = diff / (1000 * 60 * 60);
        timeDiffs.push(hoursDiff);
      }
      const minTimeDiff = Math.min(...timeDiffs);
      if (minTimeDiff < 1) {
        fraudIndicators.push({
          type: 'rapid_transactions',
          severity: 'medium',
          message: 'Multiple payments made within 1 hour',
          details: `Minimum time difference: ${minTimeDiff.toFixed(2)} hours`,
        });
        riskScore += 20;
      }
    }

    // Check 3: Unusual payment amount compared to history
    if (clientPaymentHistory.length > 3) {
      const avgPayment = analysisData.statistics.averagePaymentAmount;
      const currentMaxPayment = Math.max(...payments.map((p) => p.amount));
      if (currentMaxPayment > avgPayment * 3) {
        fraudIndicators.push({
          type: 'unusual_amount',
          severity: 'medium',
          message: 'Payment amount significantly higher than historical average',
          details: `Current: ${currentMaxPayment}, Average: ${avgPayment.toFixed(2)}`,
        });
        riskScore += 15;
      }
    }

    // Check 4: Payment mode inconsistency
    const paymentModes = payments.map((p) => p.paymentMode?.name).filter(Boolean);
    const uniqueModes = [...new Set(paymentModes)];
    if (uniqueModes.length > 2 && payments.length <= 5) {
      fraudIndicators.push({
        type: 'inconsistent_payment_method',
        severity: 'low',
        message: 'Multiple different payment methods used',
        details: `Used ${uniqueModes.length} different payment methods: ${uniqueModes.join(', ')}`,
      });
      riskScore += 10;
    }

    // Check 5: Payment after invoice expiry
    const expiredPayments = payments.filter(
      (p) => new Date(p.date) > new Date(invoice.expiredDate)
    );
    if (expiredPayments.length > 0) {
      fraudIndicators.push({
        type: 'late_payment',
        severity: 'low',
        message: 'Payments made after invoice expiration date',
        details: `${expiredPayments.length} payment(s) after ${invoice.expiredDate}`,
      });
      riskScore += 5;
    }

    // Check 6: Round number patterns (potential manual manipulation)
    const roundNumberPayments = payments.filter(
      (p) => p.amount % 100 === 0 || p.amount % 1000 === 0
    );
    if (roundNumberPayments.length === payments.length && payments.length > 1) {
      fraudIndicators.push({
        type: 'suspicious_pattern',
        severity: 'low',
        message: 'All payments are round numbers',
        details: 'May indicate manual manipulation or estimation',
      });
      riskScore += 5;
    }

    // Determine risk level
    let riskLevel = 'low';
    if (riskScore >= 50) riskLevel = 'critical';
    else if (riskScore >= 30) riskLevel = 'high';
    else if (riskScore >= 15) riskLevel = 'medium';

    // Generate AI-powered insights if enabled
    let aiInsights = null;
    if (aiSettings?.global?.enabled && process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const prompt = `You are a financial fraud detection expert. Analyze the following payment transaction data and provide insights:

Invoice Details:
- Amount: ${invoice.total} ${invoice.currency}
- Discount: ${invoice.discount}
- Due Date: ${invoice.expiredDate}
- Current Status: ${invoice.paymentStatus}

Payments Received (${payments.length}):
${payments
  .map(
    (p, i) =>
      `${i + 1}. Amount: ${p.amount}, Date: ${p.date}, Method: ${
        p.paymentMode?.name || 'Unknown'
      }, Reference: ${p.ref || 'N/A'}`
  )
  .join('\n')}

Client Payment History:
- Total Historical Payments: ${clientPaymentHistory.length}
- Average Payment Amount: ${analysisData.statistics.averagePaymentAmount.toFixed(2)}

Current Fraud Indicators Detected:
${
  fraudIndicators.length > 0
    ? fraudIndicators.map((f) => `- ${f.type}: ${f.message}`).join('\n')
    : 'None detected'
}

Please provide:
1. Overall fraud risk assessment (Low/Medium/High/Critical)
2. Additional fraud patterns or anomalies you detect
3. Specific recommendations for the business
4. Any financial irregularities that need attention

Keep the response concise and actionable.`;

        const completion = await openai.chat.completions.create({
          model: aiSettings.providers.openai.models.sentimentAnalysis || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a financial fraud detection expert specializing in payment transaction analysis.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 800,
        });

        aiInsights = completion.choices[0].message.content;
      } catch (aiError) {
        console.error('AI fraud detection error:', aiError);
        // Continue without AI insights
      }
    }

    // Generate recommendations
    const recommendations = [];
    if (riskScore >= 30) {
      recommendations.push('Review all payment transactions manually');
      recommendations.push('Contact client to verify payment authenticity');
    }
    if (fraudIndicators.some((f) => f.type === 'overpayment')) {
      recommendations.push('Process refund for overpayment immediately');
      recommendations.push('Update invoice credit balance');
    }
    if (fraudIndicators.some((f) => f.type === 'rapid_transactions')) {
      recommendations.push('Verify payment sources are legitimate');
      recommendations.push('Check for duplicate payment entries');
    }
    if (fraudIndicators.some((f) => f.type === 'unusual_amount')) {
      recommendations.push('Confirm payment amount with client');
      recommendations.push('Review for potential data entry errors');
    }
    if (riskScore < 15 && fraudIndicators.length === 0) {
      recommendations.push('Payment patterns appear normal');
      recommendations.push('No immediate action required');
    }

    // Prepare response
    const result = {
      riskLevel,
      riskScore,
      maxRiskScore: 100,
      flags: fraudIndicators,
      summary: `Analyzed ${payments.length} payment(s) totaling ${analysisData.statistics.totalAmount} ${invoice.currency} against invoice ${invoice.number}/${invoice.year}`,
      recommendations,
      aiInsights,
      analysisDate: new Date(),
      invoice: {
        id: invoice._id,
        number: invoice.number,
        total: invoice.total,
        paid: invoice.credit,
        status: invoice.paymentStatus,
      },
      payments: payments.map((p) => ({
        id: p._id,
        number: p.number,
        amount: p.amount,
        date: p.date,
        method: p.paymentMode?.name,
      })),
    };

    return res.status(200).json({
      success: true,
      result,
      message: 'Fraud detection analysis completed',
    });
  } catch (error) {
    console.error('Fraud detection error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = {
  detectPaymentFraud,
};
