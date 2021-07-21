/*
 *  ************************************************************************
 *  *  © [2015 - 2020] Quintype Technologies India Private Limited
 *  *  All Rights Reserved.
 *  *************************************************************************
 */

const apm = require("elastic-apm-node");

const handleSpanInstance = ({ apmInstance, isStart, title }) => {
  if (!process.env.APM_SERVICE_NAME && !process.env.APM_SECRET_TOKEN) {
    return;
  }

  if (isStart && !apmInstance) {
    return apm.startSpan(title);
  }

  if (apmInstance) apmInstance.end();
  return true;
};

module.exports = {
  handleSpanInstance,
};
