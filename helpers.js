const fetch = require('node-fetch');
const FormData = require('form-data');

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

module.exports = {
    testCaptcha
};