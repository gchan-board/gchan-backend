const db = require('./connection'); //relative path to file that exports
const Joi = require('joi');

const schema = Joi.object().keys({
  content: Joi.string().max(50).required(),
  has_url: Joi.bool(),
  href: Joi.string().uri({
    scheme: [
      /https?/
    ]
  }).allow(''),
});

async function postMarquee(marquee){
  const marqueeBody = marquee;
  console.log(marqueeBody);
  if(!marqueeBody.href) {
    marqueeBody.href = '';
  }
  if(!marqueeBody.has_url || marqueeBody.has_url == 'false'){
    marqueeBody.has_url = false;
    marqueeBody.href = '';
  }
  const result = schema.validate(marqueeBody);
  if(result.error == null){
    marqueeBody.created = new Date();
    console.log(marqueeBody);
    try{
      const sql = 'INSERT INTO marquees (content, created, href, has_url) VALUES ($1,$2,$3,$4) RETURNING id';
      const values = [marqueeBody.content, marqueeBody.created, marqueeBody.href, marqueeBody.has_url];
      const client = await db.connect();
      console.log(values);
      try {
        const query_res = await client.query(sql,values);
        client.release();
        console.log(query_res);
        const returnJSON = {
          content:values[0],
          has_url:values[3],
          href:values[2],
          id:query_res.rows[0].id,
        };
        return JSON.stringify(returnJSON);
      } catch (err) {
        console.log(err);
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
    console.log(marqueeBody.has_url)
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