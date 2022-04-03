const fetch = require('node-fetch');
const FormData = require('form-data');
const db = require('./db/connection');

async function testCaptcha(messageBody) {

  const environment = process.env.NODE_ENV;
  const cors_url = process.env.CORS_ORIGIN_URL;
  const recaptchaKey = process.env.RECAPTCHA3_KEY;

  // recaptcha is not validated on DEV environment
  if (environment === 'development') return { success: true };

  try {
    if (!messageBody.recaptcha_token) throw new Error('recaptcha_token must be sent along with POST body');
    const captchaToken = messageBody.recaptcha_token;
    const formdata = new FormData();
    formdata.append("secret", recaptchaKey);
    formdata.append("response", captchaToken);
    const requestOptions = {
      method: 'POST',
      body: formdata,
    };
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", requestOptions);
    const respObj = await response.json();
    if (!cors_url.includes(respObj.hostname)) throw new Error('Hostname not allowed by CORS policy.');
    return respObj;
  } catch(error) {
    console.log(error);
    // TODO: this might spill application data to the front end
    return {
      success: false,
      'details': error.message ? error.message : JSON.stringify(error)
    };
  }
}

async function logIp(table_pk, table_name, action, score, request) {
  const headers = request.headers;
  const remote_address = request.connection.remoteAddress;
  const x_real_ip = headers['x-real-ip'];
  const x_forwarded_for = headers['x-forwarded-for'];
  const ip_array = [x_real_ip, remote_address, x_forwarded_for];
  try {
    const sql = 'INSERT INTO post_logs (table_pk, table_name, action, x_real_ip, remoteAddress, x_forwarded_for, score) VALUES ($1, $2, $3, $4, $5, $6, $7)';
    let sql_data = [table_pk, table_name, action];
    sql_data = sql_data.concat(ip_array);
    sql_data.push(score);
    const client = await db.connect();
    try {
      client.query(sql, sql_data);
      client.release();
    } catch (err) {
      console.log('erro logId client.query, ', err);
    }
  } catch (err) {
    console.log('erro logId db.connect, ', err);
  }
}

module.exports = {
    testCaptcha,
    logIp
};