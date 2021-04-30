const Joi = require('joi');
const { query } = require('./connection');
const db = require('./connection'); //relative path to file that exports

const replySchema = Joi.object().keys({
  message_id: Joi.string().alphanum().required(),
	username: Joi.string().max(30).required(),
	content: Joi.string().max(250).required(),
	imageURL: Joi.string().uri({
		scheme: [
			/https?/
		]
	}).allow(''),
  user_id: Joi.number(),
});

async function postReply(reply) {
  const replyBody = reply.body;
	if (!replyBody.username) replyBody.username = 'Anonymous';
	if (!replyBody.imageURL) replyBody.imageURL = '';
	const result = replySchema.validate(replyBody);
	if(result.error == null){
		replyBody.created = new Date();
		try{
			const sql = 'INSERT INTO replies (username, content, imageURL, created, user_id, message_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id';
			const values = [replyBody.username, replyBody.content, replyBody.imageURL, replyBody.created, replyBody.user_id, replyBody.message_id];
      const client = await db.connect();
			try {
				const query_res = await client.query(sql,values);
				const returnJSON = {
          message_id:values[5],
					username:values[0],
					content:values[1],
					imageurl:values[2],
					created:values[3],
          id:query_res.rows[0].id,
          user_id:values[4],
        };
        try {
          const updated_sql = 'UPDATE messages SET updated_at = NOW() WHERE id = $1';
          const updated_values = [replyBody.message_id];
          try {
            const updated_query = await client.query(updated_sql, updated_values);
            client.release();
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
}

async function getReplyFromMessageId(message_id) {
  try{
    const sql = 'SELECT * FROM replies WHERE message_id = $1';
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
  getAll,
  postReply,
  getReplyFromMessageId,
};
