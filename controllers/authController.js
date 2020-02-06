const passport = require('passport');

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos campos son Obligatorios'
});

//Revisar si el Usuario esta autenticado o no
exports.usuarioAutenticado = (req, res, next) => {
    //Si el usuario esta autenticado, adelante
    if(req.isAuthenticated()) {
        return next();
    }

    //Si no esta autenticado
    return res.redirect('/iniciar-sesion');
}

//Cerrar Sesión
exports.cerrarSesion = (req, res, next) => {
    req.logout();
    req.flash('exito', 'Lograste Cerrar Sesión Correctamente');
    res.redirect('/iniciar-sesion');
    next();
}