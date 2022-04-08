const Joi = require('joi');
const db = require('./connection');
const { testCaptcha, logIp } = require('../helpers');

const schema = Joi.object().keys({
	username: Joi.string().max(30).required(),
	subject: Joi.string().max(50).allow(''),
	message: Joi.string().max(250).required(),
	imageURL: Joi.string().uri({
		scheme: [
			/https?/
		]
	}).allow(''),
	giphyURL: Joi.string(),
  options: Joi.string(),
  user_id: Joi.number(),
  gif_origin: Joi.string().allow(''),
  recaptcha_token: Joi.string().allow(''),
});

async function getAll(offset){
  let sql = 'SELECT * FROM messages WHERE deleted = false ORDER BY updated_at DESC, id DESC'; 
  if (offset) sql += ' OFFSET $1 LIMIT 15';
  let client;
	try{
    client = await db.connect();
		const result = offset ? await client.query(sql, [offset]) : await client.query(sql);
		return {
      'results': (result) ? result.rows : null,
      'status_code': 200
    };
	} catch (err){
    return {
      details: err.message ? err.message : JSON.stringify(err),
      status_code: err.where ? 400 : 500 // if prop `where` is present, it's probably a psql validation error
    };
	} finally {
		client.release();
  }
}

async function getOne(id) {
  let client;
  try {
    client = await db.connect();
    const sql = 'SELECT * FROM messages WHERE id = $1 AND deleted = false';
    const values = [id];
    const query_res = await client.query(sql, values);
    return { 'results': query_res.rows, 'status_code': 200 };
  } catch (err) {
    return {
      details: err.message ? err.message : JSON.stringify(err),
      status_code: err.where ? 400 : 500,
    }
  } finally {
    client.release();
  }
}

async function deleteMessage(messageID){
  try {
    const sql = 'DELETE FROM messages WHERE id = $1 RETURNING id';
    const values = [messageID];
    const client = await db.connect();
    try {
      const query_res = await client.query(sql,values);
      client.release();
      if(query_res.rows.length > 0){
        return ({'id': query_res.rows[0].id});
      }
      return (false);
    } catch (err) {
      return(err);
    }
  } catch (err) {
    return (err);
  }
}

async function postMessage(message){
  const messageBody = message.body;

  const captchaResponse = await testCaptcha(messageBody);
  if (!captchaResponse.success) return {...captchaResponse, "status_code": 400};

  if (!messageBody.username) messageBody.username = 'anônimo';
  if (!messageBody.imageURL) messageBody.imageURL = '';
  const result = schema.validate(messageBody);
  if (result.error) return {...result.error, "status_code": 400};
  let client;
  try {
    const sql = 'INSERT INTO messages (username, subject, message, imageURL, giphyURL, options, user_id, gif_origin) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id';
    const values = [
      messageBody.username,
      messageBody.subject,
      messageBody.message,
      messageBody.imageURL,
      messageBody.giphyURL,
      messageBody.options,
      messageBody.user_id,
      messageBody.gif_origin
    ];
    client = await db.connect();
    const query_res = await client.query(sql,values);
    const post_id = query_res.rows[0].id;
    const currentDateTime = new Date();
    const returnJSON = {
      username: values[0],
      subject: values[1],
      message: values[2],
      imageurl: values[3],
      giphyURL: values[4],
      options: values[5],
      created: currentDateTime,
      id: post_id,
      user_id: values[6],
      gif_origin: values[7]
    };
    logIp(post_id, 'messages', 'insert', captchaResponse.score, message);
    return {...returnJSON, "status_code": 201};
  } catch (err){
    // 23505 is thrown by postgres for duplicated messages
    if (err.code == "23505") {
      return {
        error: true,
        origin: 'psql',
        code: '23505',
        details: 'Duplicated message',
        status_code: 400,
      };
    }
    return {
      "status_code": 500,
      "details": err.message ? err.message : JSON.stringify(err),
    }
  } finally {
    client.release();
  }
}

async function getPostReplies(message_id) {
  let client;
  try {
    const sql = 'SELECT * FROM replies WHERE message_id = $1 ORDER BY id ASC';
    const values = [message_id];
    client = await db.connect();
    const query_res = await client.query(sql,values);
    return {
      "results": query_res.rows,
      "status_code": 200
    };
  } catch (err){
    return {
      details: err.message ? err.message : JSON.stringify(err),
      status_code: err.where ? 400 : 500,
    };
  } finally {
    client.release();
  }
}

module.exports.getPostReplies = async function() {
  return getPostReplies();
}

module.exports.deleteMessage = async function(){
  return deleteMessage();
}

module.exports.postMessage = async function(){
	return postMessage();
}

module.exports.getAll = async function(){
	return getAll();
}

module.exports.getOne = async function(){
	return getOne();
}

module.exports = {
  postMessage,
  getAll,
  getOne,
  deleteMessage,
  getPostReplies,
};
