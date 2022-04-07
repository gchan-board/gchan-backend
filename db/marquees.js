const db = require('./connection');
const Joi = require('joi');

const schema = Joi.object().keys({
  content: Joi.string().max(50).required(),
  // TODO: remove this field, validate that href is a valid url when it is sent
  has_url: Joi.bool(),
  href: Joi.string().uri({ scheme: [ /https?/ ]})
    .when('has_url',{
      is: true,
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
});

async function postMarquee(marquee){
  const marqueeBody = marquee;
  const result = schema.validate(marqueeBody);
  if (result.error) return {...result.error, "status_code": 400 }
  marqueeBody.created = new Date(); // TODO: this should be auto generated in the database
  let client;
  try{
    const sql = 'INSERT INTO marquees (content, created, href, has_url) VALUES ($1,$2,$3,$4) RETURNING id';
    const values = [marqueeBody.content, marqueeBody.created, marqueeBody.href, marqueeBody.has_url];
    client = await db.connect();
    const query_res = await client.query(sql,values);
    const returnJSON = {
      content:values[0],
      has_url:values[3],
      href:values[2],
      id:query_res.rows[0].id,
    };
    return {...returnJSON, "status_code": 201};
    } catch (err) {
      if(err.code == '23505') {
        return {
          error: true,
          origin: 'psql',
          code: '23505',
          details: 'Duplicated item',
          status_code: 400
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