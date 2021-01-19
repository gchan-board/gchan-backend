const db = require('./connection'); //relative path to file that exports
const Joi = require('joi');

const schema = Joi.object().keys({
  content: Joi.string().max(50).required(),
});

async function postMarquee(marquee){
  const marqueeBody = marquee.body;
  const result = schema.validate(marqueeBody);
	if(result.error == null){
    marqueeBody.created = new Date();
    try{
      const sql = 'INSERT INTO marquees (content, created) VALUES ($1,$2) RETURNING id';
      const values = [marqueeBody.content, marqueeBody.created];
      const client = await db.connect();
      try {
        const query_res = await client.query(sql,values);
        client.release();
        console.log(query_res);
        const returnJSON = {
          content:values[0],
          id:query_res.rows[0].id,
        };
        return JSON.stringify(returnJSON);
      } catch (err) {
        if(err.code == '23505'){
          return {
            error: true,
            origin: 'psql',
            code: '23505'
          };
        }
      }
    } catch(err) {
      console.log(err);
    }
  } else {
		return Promise.reject(result.error);
	}
}
async function getAll(){
	try{
		const client = await db.connect();
		const result = await client.query('SELECT * FROM marquees ORDER BY id DESC LIMIT 5');
		const results = { 'results': (result) ? result.rows : null};
		client.release();
		return results;
	} catch (err){
		console.error(err);
	}
}
module.exports.postMarquee = async function(){
	return postMarquee();
}
module.exports.getAll = async function() {
  return getAll();
}
module.exports = {
  postMarquee,
  getAll,
};