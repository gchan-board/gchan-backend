const express = require('express');
//login functionality
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
//middleware below
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const login = require('./db/login');
const messages = require('./db/messages'); //require é no nome do arquivo sem a extensão
const db =  require('./db/connection');
const app = express();

app.use(morgan('tiny'));


const corsOptions = {
  origin: 'https://guites.github.io',
  credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(flash());
const initializePassport = require('./db/passport-config');
initializePassport(
  passport, 
  email => findUserByEmail(email),
  id => findUserById(id)
);
async function findUserById(id){
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1;',[id]);
  return rows[0];
};
async function findUserByEmail(email){
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1;',[email]);
  return rows[0];
};

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/',(req,res) => {
	res.json({
		message: "fullstack msg board."
	})
});

app.get('/messages', async (req,res) => {
  // const allMsgs = {};
  // allMsgs.msgs = await messages.getAll();
  // if(req.isAuthenticated()){
  //   allMsgs.user = req.user;
  // }
  // res.json(allMsgs);
	messages.getAll().then((allMessages) => {
		res.json(allMessages);
	});
});

// app.post('/login', passport.authenticate('local', {
//   successRedirect: '/',
//   failureRedirect: '/login',
// }))

app.get('/login', function (req, res, next) {
  if (req.isAuthenticated()) {
    return res.send(req.user);
  } else {
    return res.send(false);
  }
})


app.post('/login', function(req, res, next) {
  // console.log(req.body);
  passport.authenticate('local', function(err, user, info) {
    console.log(user);
    if(err) { return res.redirect('/info'); }
    if(!user) { console.log(info); return res.json(info); }
    req.login(user, function(err) {
      if(err) { return next(err); }
      if(req.isAuthenticated()){
        return res.json(req.user);
      }
    })
  })(req,res,next);
})

app.post('/register', async function(req, res, next) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    };
    const { rows } = await db.query('INSERT INTO users (name,email,password) VALUES ($1,$2,$3);',[user.name,user.email,user.password]);
    res.json('success');
  } catch (e) {
    console.log(e);
    res.json(false);
  }
})

app.post('/messages', async (req,res) => {

	messages.postMessage(req).then((message) => {
		res.json(message);
	});
	
});

app.delete('/logout', (req, res) => {
  req.logOut();
  res.json({login: false});
})

app.delete('/message/:id', (req, res) => {
  if(req.isAuthenticated()){
    messages.deleteMessage(req.params.id).then((msg) => {
      res.json(msg);
    })
  } else {
    res.status(401).send('Necessário login via aplicação.');
  }
})


// function checkAuthenticated(req, res, next){
//   if(req.isAuthenticated)
// }


const port = process.env.PORT || 4450;
app.listen(port, () => {
	console.log(`Listening on ${port}.`);
});
