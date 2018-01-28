const Encrypter = require('../../helpers/core/encrypter');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

class UsersController {
    constructor (app) {
        this.application = app;
        this._router = require('express').Router();
        this.encrypter = new Encrypter('base64:ExCu21Kx2dH6Sss11CdmfAXbl/MQjz12pEchyRVNMQs=', 'AES-256-CBC');
        this.bind();
    }

    bind () {
        let that = this;
        passport.use(new LocalStrategy({
                usernameField: 'email',
                passwordField: 'password'
            },
            function(email, password, done) {
                that.application.models.user.findOne({email: email}, function(err, user) {
                    if (err) { return done(err); }
                    if (!user) {
                        return done(null, false, { message: 'Incorrect email.' });
                    }

                    if (that.encrypter.decrypt(user.password) !== password) {
                        return done(null, false, { message: 'Incorrect password.' });
                    }

                    return done(null, user);
                });
            }
        ));

        this.bindRoute();
    }

    bindRoute () {
        this.application.app.get('/', this.getWelcome.bind(this));
        this.application.app.get('/register', this.getRegister.bind(this));
        this.application.app.post('/register', this.postRegister.bind(this));
        this.application.app.get('/login', this.getLogin.bind(this));
        this.application.app.post('/login',  this.postLogin.bind(this));
        this.application.app.get('/index', this._ensureAuth, this.index.bind(this));
        this.application.app.get('/logout', this.logout.bind(this));
    }

    getWelcome (req, res) {
        res.redirect('login');//todo change when welcome page will be ready
    }

    getRegister (req, res) {
        res.render('register');
    }

    postRegister (req, res) {
        let body = req.body;

        let formData = {
            name: body.name,
            username: body.username,
            email: body.email,
            password: this.encrypter.encrypt(body.password)
        };

        let user = new this.application.models.user(formData);
        user.save();

        res.redirect('login');
    }

    getLogin (req, res) {
        res.render('login');
    }

    postLogin (req, res, next) {
        let that = this;
        passport.authenticate('local', function(err, user, info) {
            if (err) {
                return next(err);
            };

            if (!user) {
                return res.redirect('/login');
            };

            req.logIn(user, function(err) {
                if (err) { return next(err); }
                return res.redirect('/index');
            });

        })(req, res, next);

        passport.serializeUser(function(user, done) {
            done(null, user.id);
        });

        passport.deserializeUser(function(id, done) {
            that.application.models.user.findById(id, function(err, user) {
                done(err, user);
            });
        });
    }

    index (req, res) {
        let that = this;
        let domains = that.application.models.domain.find({});
        let events = that.application.models.events.find({});

        Promise.all([domains, events]).then(function(results) {
            res.render('index', {
                user: req.user._doc.username,
                domains: results[0],
                events: results[1],
            });
        });

    }

    logout (req, res) {
        req.logOut();
        res.redirect('/login');
    }

    _ensureAuth (req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        } else {
            res.redirect('/login');
        }
    }
}

module.exports = UsersController;
