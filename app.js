const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const hbs = require('express-handlebars');
const _ = require('lodash');
const session = require('express-session');
const passport = require('passport');
const Model = require('./app/models/baseModel');

class Application
{
    constructor() {
        this.app = express();
        this.env = null;
        this.config = null;
        this.controllers = {};

        this.init();
    }

    get instance() {
        return this.app;
    }

    get basePath() {
        return __dirname;
    }

    get appPath() {
        return path.join(__dirname, 'app');
    }

    get appPath() {
        return path.join(__dirname, 'app');
    }

    init() {
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.engine('hbs', hbs({extname: 'hbs',defaultLayout: 'main', layoutsDir: __dirname + '/views/layouts'}));
        this.app.set('view engine', 'hbs');
        this.app.use(require('morgan')('dev'));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(require('cookie-parser')());
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use(session({
            secret: 'secret',
            saveUninitialized: true,
            resave: true,
        }));
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        this.start();
    }

    start() {
        let that = this;

        (new Model(that)).run().then(
            () => {
                that.requireController();
                that.init404Handler();
                that.initErrorHandler();
            }
        )
    }

    requireController() {
        let that = this;
        let controllerPath = path.join(__dirname, 'app', 'http', 'controllers');

        _.each(fs.readdirSync(controllerPath), function (file) {
            let controller = require(path.join(controllerPath, file));
            let name = file.replace('.js', '');

            that.controllers[name] = new controller(that);
        });
    }

    init404Handler () {
        this.app.use(function(req, res, next) {
            let err = new Error('Not Found');
            err.status = 404;
            next(err);
        });
    }

    initErrorHandler () {
        this.app.use(function(err, req, res, next) {
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};

            // render the error page
            res.status(err.status || 500);
            res.render('error');
        });
    }
}

let app = new Application();

module.exports = app.instance;
