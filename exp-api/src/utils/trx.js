const { WebpayPlus } = require('transbank-sdk');
const {
  Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes,
} = require('transbank-sdk');

const tx = new WebpayPlus.Transaction(new Options(
  IntegrationCommerceCodes.WEBPAY_PLUS,
  IntegrationApiKeys.WEBPAY,
  Environment.Integration,
));

const createTransaction = async (buyOrder, company, amount, returnUrl) => {
  const result = await tx.create(buyOrder, company, amount, returnUrl);
  return result;
};

module.exports = { tx, createTransaction };
