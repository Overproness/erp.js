// @ts-nocheck
const mongoose = require('mongoose');
const Quote = mongoose.model('Quote');
const Invoice = mongoose.model('Invoice');

const convertQuoteToInvoice = async (req, res) => {
  try {
    // Permission check for users
    if (req.user && !req.user.permissions?.canCreateInvoices) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'Permission denied: cannot convert quote to invoice',
      });
    }

    const { id } = req.params;
    console.log('Converting quote with ID:', id);

    // Find the quote
    const quote = await Quote.findById(id).populate('client');
    if (!quote) {
      console.log('Quote not found:', id);
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Quote not found',
      });
    }

    console.log('Quote found:', {
      id: quote._id,
      expiredDate: quote.expiredDate,
      converted: quote.converted,
      status: quote.status,
    });

    // Check if quote is expired
    if (quote.expiredDate && new Date() > new Date(quote.expiredDate)) {
      console.log('Quote is expired');
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Cannot convert expired quote to invoice',
      });
    }

    // Check if quote is already converted
    if (quote.converted) {
      console.log('Quote already converted');
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Quote is already converted to invoice',
      });
    }

    // Check companyID match
    const userCompanyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    if (quote.companyID !== userCompanyID) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'Permission denied: cannot convert quotes from another company',
      });
    }

    // Create invoice from quote
    const currentYear = new Date().getFullYear();
    const owner = req.user ? req.user._id : req.companyOwner._id;
    const company = req.user ? req.user.companyOwner : req.companyOwner._id;

    // Find the highest existing invoice number for this year and owner
    const lastInvoice = await Invoice.findOne({
      owner: company || owner,
      year: currentYear,
    }).sort({ number: -1 });

    const invoiceNumber = lastInvoice ? lastInvoice.number + 1 : 1;

    const invoiceData = {
      client: quote.client,
      number: invoiceNumber,
      year: currentYear,
      status: 'draft',
      date: new Date(),
      expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      taxRate: quote.taxRate,
      subTotal: quote.subTotal,
      taxTotal: quote.taxTotal,
      total: quote.total,
      items: quote.items,
      notes: quote.notes,
      currency: quote.currency,
      owner: company || owner,
      createdBy: owner,
      paymentStatus: 'unpaid',
      converted: {
        from: 'quote',
        quote: quote._id,
      },
      companyID: userCompanyID, // Set companyID
    };

    const invoice = await new Invoice(invoiceData).save();

    // Update quote to mark as converted
    await Quote.findByIdAndUpdate(id, {
      converted: true,
      convertedDate: new Date(),
      convertedInvoice: invoice._id,
    });

    return res.status(200).json({
      success: true,
      result: invoice,
      message: 'Quote converted to invoice successfully',
    });
  } catch (error) {
    console.error('Convert quote to invoice error:', error);
    console.log('Quote conversion error message:', error.message);
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = convertQuoteToInvoice;
