const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const expressValidator = require('express-validator');
const passport = require('./config/passport');
const router = require('./routes');

//Configuración y modelos BD
const db = require('./config/db');
    require('./models/Usuarios'); 
    require('./models/Categorias');
    require('./models/Comentarios');
    require('./models/Grupos');
    require('./models/Meeti');
    db.sync().then(() => console.log('DB Conectada')).catch((error) => console.log(error));

//Variables de Desarrollo
require('dotenv').config({path: 'variables.env'});

//Aplicación Principal
const app = express();

//Body parse, leer formularios
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Express Validator(validación con bastantes funciones)
app.use(expressValidator());

//Habilitar EJS como template engine
app.use(expressLayouts);
app.set('view engine', 'ejs');

//Ubicación vistas
app.set('views', path.join(__dirname, './views'));

//Archivos staticos
app.use(express.static('public'));

//Habilitar cookie Parser
app.use(cookieParser());

//Crear la session
app.use(session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false
}))

//Inicializar passport
app.use(passport.initialize());
app.use(passport.session());

//Agrega flash messages
app.use(flash());

//Middleware (usuario logueado, flash messages, fecha actual)
app.use((req, res, next) => {
    res.locals.usuario = {...req.user} || null;
    res.locals.mensajes = req.flash();
    const fecha = new Date();
    res.locals.year = fecha.getFullYear();
    next();
});

//Routing
app.use('/', router());

//Leer el Host y el Puerto
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 5000;

//Agrega el Puerto
app.listen(port, host, () => {
    console.log('El servidor esta funcionando');
});