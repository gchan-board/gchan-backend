const Joi = require('joi');
const { query } = require('./connection');
const db = require('./connection'); //relative path to file that exports
// libs para verificar o captcha
const fetch = require('node-fetch');
const FormData = require('form-data');

const replySchema = Joi.object().keys({
  message_id: Joi.string().alphanum().required(),
	username: Joi.string().max(30).required(),
	content: Joi.string().max(1000).required(),
	imageURL: Joi.string().uri({
		scheme: [
			/https?/
		]
	}).allow(''),
  user_id: Joi.number(),
  recaptcha_token: Joi.string().allow('')
});

async function logIp(table_pk, table_name, action, ip_array, score) {
  try {
    const sql = 'INSERT INTO post_logs (table_pk, table_name, action, x_real_ip, remoteAddress, x_forwarded_for, score) VALUES ($1, $2, $3, $4, $5, $6, $7)';
    let sql_data = [table_pk, table_name, action];
    sql_data = sql_data.concat(ip_array);
    sql_data.push(score);
    const client = await db.connect();
    try {
      const query_res = client.query(sql, sql_data);
      client.release();
    } catch (err) {
      console.log('erro logId client.query, ', err);
    }
  } catch (err) {
    console.log('erro logId db.connect, ', err);
  }
}

async function testCaptcha(token) {
  var formdata = new FormData();
  formdata.append("secret", process.env.RECAPTCHA3_KEY);
  formdata.append("response", token);
  var requestOptions = {
    method: 'POST',
    body: formdata,
  };
  return fetch("https://www.google.com/recaptcha/api/siteverify", requestOptions)
  .then(response => response.json())
  .catch(error => error);
}

async function postReply(reply) {
  const replyBody = reply.body;

  // para registro do IP / reCAPTCHA
  const replyHeaders = reply.headers;
  const replyConnection = reply.connection;
  const x_real_ip = replyHeaders['x-real-ip'];
  const connection_remote_address = replyConnection.remoteAddress;
  const x_forwarded_for = replyHeaders['x-forwarded-for'];
  const ip_array = [x_real_ip, connection_remote_address, x_forwarded_for];

  if (!replyBody.recaptcha_token) {
    return { error: true, origin: 'recaptcha', code: 'empty' };
  }
  const captchaResponse = await testCaptcha(replyBody.recaptcha_token);
  if (captchaResponse.success) {
    if(process.env.CORS_ORIGIN_URL.includes(captchaResponse.hostname)) {
      if (!replyBody.username) replyBody.username = 'Anonymous';
      if (!replyBody.imageURL) replyBody.imageURL = '';
      const result = replySchema.validate(replyBody);
      if(result.error == null){
        try{
          const sql = 'INSERT INTO replies (username, content, imageURL, user_id, message_id) VALUES ($1,$2,$3,$4,$5) RETURNING id';
          const values = [
            replyBody.username,
            replyBody.content,
            replyBody.imageURL,
            replyBody.user_id,
            replyBody.message_id
          ];
          const client = await db.connect();
          try {
            const query_res = await client.query(sql,values);

            const currentDateTime = new Date(); 

            const reply_id = query_res.rows[0].id;

            const returnJSON = {
              message_id:values[4],
              username:values[0],
              content:values[1],
              imageurl:values[2],
              created:currentDateTime,
              id:reply_id,
              user_id:values[3],
            };
            try {
              const updated_sql = 'UPDATE messages SET updated_at = NOW() WHERE id = $1';
              const updated_values = [replyBody.message_id];
              try {
                const updated_query = await client.query(updated_sql, updated_values);
                client.release();
                logIp(reply_id, 'replies', 'insert', ip_array, captchaResponse.score);
                return JSON.stringify(returnJSON);
              } catch (err) {
                return JSON.stringify(returnJSON);
              }
            } catch (err) {
              return JSON.stringify(returnJSON);
            }
          } catch (err) {
            if (err.code == "23505") {
             return {
               error: true,
               origin: 'psql',
               code: '23505'
             };
            }
          }
        } catch (err){
          console.error(err);
          return (err);
        }
      } else {
        return result.error; 
      }
    } else {
      return {
        error: true,
        origin: 'recaptcha',
        code: 'hostname'
      }
    }
  } else {
    return {
      error: true,
      origin: 'recaptcha',
      code: 'failure'
    }
  }
}

async function getReplyFromMessageId(message_id) {
  try{
    const sql = 'SELECT * FROM replies WHERE message_id = $1 ORDER BY id ASC';
    const values = [message_id];
    const client = await db.connect();
    try {
      const query_res = await client.query(sql,values);
      client.release();
      if(query_res.rows.length > 0){
        return (query_res.rows);
      } else {
        return {
          error: true,
          origin: 'psql',
          code: 'no results'
        };
      }
    } catch (err) {
      return err;
    }
  } catch (err){
    return (err);
  }
}
async function getAll() {
  try {
    const client = await db.connect();
    const result = await client.query('SELECT * FROM replies ORDER BY id DESC');
    const results = { 'results': (result) ? result.rows : null};
    client.release();
    return results;
  } catch (err) {
    console.error(err);
    return {
      error: true,
      origin: 'psql',
      code: 'no results'
    }
  }
}

async function getOne(id) {
  try {
    const client = await db.connect();
    const sql = 'SELECT * FROM replies WHERE id = $1';
    const values = [id];
    try {
      const query_res = await client.query(sql, values);
      client.release();
      if(query_res.rows.length > 0) {
        const results = {'results': (query_res) ? query_res.rows : null };
        return results;
      } else {
        return {
          error: true,
          origin: 'psql',
          code: 'no results'
        };
      }
    } catch (err) {
      return {
        error: true,
        origin: 'psql',
        code: err.code
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function getManyById(ids) {

  try {
    const client = await db.connect();
    const sql = 'SELECT * FROM replies WHERE id = ANY ($1)';
    const values = [ids];
    try {
      const query_res = await client.query(sql, values);
      client.release();
      if(query_res.rows.length > 0) {
        const results = {'results': (query_res) ? query_res.rows : null };
        return results;
      } else {
        return {
          error: true,
          origin: 'psql',
          code: 'no results'
        };
      }
    } catch (err) {
      return {
        error: true,
        origin: 'psql',
        code: err.code
      }
    }
  } catch (err) {
    console.error(err);
  }

}

module.exports.getOne = async function() {
  return getOne();
}
module.exports.getAll = async function() {
  return getAll();
}
module.exports.postReply = async function(){
  return postReply();
}
module.exports.getReplyFromMessageId = async function(){
  return getReplyFromMessageId();
}
module.exports = {
  getOne,
  getManyById,
  getAll,
  postReply,
  getReplyFromMessageId,
};
