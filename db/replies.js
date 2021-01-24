const Joi = require('joi');
const { query } = require('./connection');
const db = require('./connection'); //relative path to file that exports

const replySchema = Joi.object().keys({
  message_id: Joi.string().alphanum().required(),
	username: Joi.string().alphanum().required(),
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
        client.release();
        console.log(query_res);
				const returnJSON = {
          message_id:values[5],
					username:values[0],
					content:values[1],
					imageurl:values[2],
					created:values[3],
          id:query_res.rows[0].id,
          user_id:values[4],
				};
				return JSON.stringify(returnJSON);
			} catch (err) {
        console.log(err);
        console.log(err.stack);
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
      console.log(err);
      console.log(err.stack);
    }
  } catch (err){
    console.error(err);
    return (err);
  }
}

module.exports.postReply = async function(){
  return postReply();
}
module.exports.getReplyFromMessageId = async function(){
  return getReplyFromMessageId();
}
module.exports = {
  postReply,
  getReplyFromMessageId,
};