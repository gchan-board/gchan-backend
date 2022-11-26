const fetch = require('node-fetch');
const FormData = require('form-data');
const db = require('./db/connection');

function mockImgurUpload(filepath) {
  // TODO: adapt this for multiple possible hosts/ports combinations
  // TODO: prevent direct access to uploads file on production
  return {
    data: {
      link: `http://localhost:4450/${filepath.replace("uploads/", "")}`,
      processing: {
        status: "completed",
      },
      deletehash: "dummy-delete-hash",
    }
  }
}

function mockImgurDelete() {
  return {
    "data": true,
    "success": true,
    "status": 200
  }
}

function mockImgurInformation() {
  return {
    "data": {
      "id": "TkaS8s8",
      "title": null,
      "description": null,
      "datetime": 1669477415,
      "type": "video/mp4",
      "animated": true,
      "width": 848,
      "height": 576,
      "size": 357627,
      "views": 4,
      "bandwidth": 1430508,
      "vote": null,
      "favorite": false,
      "nsfw": false,
      "section": null,
      "account_url": null,
      "account_id": null,
      "is_ad": false,
      "in_most_viral": false,
      "has_sound": true,
      "tags": [],
      "ad_type": 0,
      "ad_url": "",
      "edited": "0",
      "in_gallery": false,
      "link": "https://github.com/guites/gchan-backend/blob/main/uploads/a5b69f7c-d538-4025-a0a2-f82e3ae67b4c-getin_loser.png?raw=true",
      "mp4_size": 357627,
      "mp4": "https://github.com/guites/gchan-backend/blob/main/uploads/a5b69f7c-d538-4025-a0a2-f82e3ae67b4c-getin_loser.png?raw=true",
      "gifv": "https://github.com/guites/gchan-backend/blob/main/uploads/a5b69f7c-d538-4025-a0a2-f82e3ae67b4c-getin_loser.png?raw=true",
      "hls": "https://github.com/guites/gchan-backend/blob/main/uploads/a5b69f7c-d538-4025-a0a2-f82e3ae67b4c-getin_loser.png?raw=true",
      "processing": {
        "status": "completed"
      },
      "ad_config": {
        "safeFlags": [
          "not_in_gallery",
          "share"
        ],
        "highRiskFlags": [],
        "unsafeFlags": [
          "sixth_mod_unsafe"
        ],
        "wallUnsafeFlags": [],
        "showsAds": false,
        "showAdLevel": 1,
        "safe_flags": [
          "not_in_gallery",
          "share"
        ],
        "high_risk_flags": [],
        "unsafe_flags": [
          "sixth_mod_unsafe"
        ],
        "wall_unsafe_flags": [],
        "show_ads": false,
        "show_ad_level": 1
      }
    },
    "success": true,
    "status": 200
  }
}

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
    logIp,
    mockImgurUpload,
    mockImgurDelete,
    mockImgurInformation,
};