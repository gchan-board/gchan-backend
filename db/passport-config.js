const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');


async function initialize(passport,findUserByEmail, findUserById){
    const authenticateUser = async (email, password, done) => {
        const user = await findUserByEmail(email);
        if( user == null ) {
            return done(null, false, { message: 'Nenhum usuário com este email.'});
        }
        try {
            if (await bcrypt.compare(password, user.password)){
                return done(null, user);
            } else {
                return done(null, false, { message: 'Senha incorreta.' })
            }
        } catch (e) {
            done(e);
        }
    }

    passport.use(new LocalStrategy({ usernameField: 'email' },
    authenticateUser));
    passport.serializeUser((user, done) => done(null,user.id));
    passport.deserializeUser( async (id, done) => {
      try {
        const user = await findUserById(id);
        done(null, user);
      } catch(e) {
        done(e);
      }
    });
}

module.exports = initialize;