const Usuarios = require('../models/Usuarios');
const enviarEmail = require('../handlers/emails');

const multer = require('multer');
const shortid = require('shortid');
const fs = require('fs');
const uuid = require('uuid/v4');

const configuracionMulter = {
    limits: {fileSize: 100000},
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, next) => {
            next(null, __dirname+'/../public/uploads/perfiles/');
        },
        filename: (req, file, next) => {
            const extension = file.mimetype.split('/')[1];
            next(null, `${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, next) {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            //El Formato es Válido            
            next(null, true);
        }else {
            //El Formato no es Válido
            next(new Error('Formato no válido'), false);
        }
    }
}
const upload = multer(configuracionMulter).single('imagen');

//Sube una Imagen en el Servidor
exports.subirImagen = (req, res, next) => {
    upload(req, res, function(error) {
        if (error) {
            if (error instanceof multer.MulterError) {
                if (error.code === 'LIMIT_FILE_SIZE') {
                    req.flash('error', 'El Archivo es muy grande')
                }else {
                    req.flash('error', error.message);
                }
            }else if(error.hasOwnProperty('message')) { //este codigo revisa si existe un mensaje
                req.flash('error', error.message);
            }
            res.redirect('back');
            return;
        }else {
            next();
        }
    })
}

exports.formCrearCuenta = (req, res) => {
    res.render('crear-cuenta', {
        nombrePagina : 'Crea tu Cuenta'
    })
}

exports.crearNuevaCuenta = async (req, res) => {
    const usuario = req.body;   
     
    req.checkBody('confirmar', 'El password confirmado no puede ir vacio').notEmpty();
    req.checkBody('confirmar', 'El password es diferente').equals(req.body.password); 

    //Leer los errores de Express
    const erroresExpress = req.validationErrors();

    try {
        await Usuarios.create(usuario);

        //Url de Confirmación
        const url = `http://${req.headers.host}/confirmar-cuenta/${usuario.email}`;

        //Enviar Email de confirmación
        await enviarEmail.enviarEmail({
            usuario,
            url,
            subject: 'Confirma tu Cuenta de Meeti',
            archivo: 'confirmar-cuenta'
        })

        //Flash Message y redireccionar
        req.flash('exito', 'Hemos enviado un E-mail, confirma tu Cuenta');
        res.redirect('/iniciar-sesion');
    } catch (error) {
        //Extraer el message de los errores
        const erroresSequelize = error.errors.map(err => err.message);     
        
        //Extraer unicamente el msg de los errores
        const errExp = erroresExpress.map(err => err.msg);

        //Unirlos
        const listaErrores = [...erroresSequelize, ...errExp];

        req.flash('error', listaErrores);
        res.redirect('/crear-cuenta');
    }    
}

// Confirma la Suscripción del Usuario
exports.confirmarCuenta = async(req, res, next) => {
    //Verificar que el Usuario Existe 
    const usuario = await Usuarios.findOne({where: { email: req.params.correo }});

    //Si no existe, redireccionar
    if(!usuario) {
        req.flash('error', 'No existe esa cuenta');
        res.redirect('/crear-cuenta');
        return next();
    }

    //Si existe, confirmar suscripción y redireccionar
    usuario.activo = 1;
    await usuario.save();

    req.flash('exito', 'La cuenta se ha confirmado, ya puedes iniciar sesión');
    res.redirect('/iniciar-sesion');
}

//Formulario para iniciar sesion
exports.formIniciarSesion = (req, res) => {
    res.render('iniciar-sesion', {
        nombrePagina : 'Iniciar Sesión'
    })
}

//Muestra el formulario para editar el Perfil
exports.formEditarPerfil = async(req, res) => {
    const usuario = await Usuarios.findByPk(req.user.id);

    res.render('editar-perfil', {
        nombrePagina: 'Editar Perfil',
        usuario
    })
}

//Almacena en la BD los cambios al perfil
exports.editarPerfil = async(req, res) => {
    const usuario = await Usuarios.findByPk(req.user.id);

    req.sanitizeBody('nombre');
    req.sanitizeBody('email');
    //Leer datos del form
    const {nombre, descripcion, email} = req.body;

    //Asignar los Valores
    usuario.nombre = nombre;
    usuario.descripcion = descripcion;
    usuario.email = email;

    //Guardar en la BD
    await usuario.save();
    req.flash('exito', 'Cambios guardados Correctamente');
    res.redirect('/administracion');
}

//Muestra el Formulario para modificar el Password
exports.formCambiarPassword = (req, res) => {
    res.render('cambiar-password', {
        nombrePagina: 'Cambiar Password'
    })
}

//Revisa si el Password anterior es correcto y lo modifica por uno nuevo
exports.cambiarPassword = async(req, res, next) => {
    const usuario = await Usuarios.findByPk(req.user.id);

    //Verificar que el Password anterior sea correcto
    if(!usuario.validarPassword(req.body.anterior)) {
        req.flash('error', 'El Password actual es incorrecto');
        res.redirect('/administracion');
        return next();
    }

    //Si el Password es correcto, hashear el nuevo
    const hash = usuario.hashPassword(req.body.nuevo);

    //Asignar el Password al usuario
    usuario.password = hash;

    //Guardar en la BD
    await usuario.save();

    //Redireccionar 
    req.logout();
    req.flash('exito', 'Password Modificado Correctamente, vuelve a iniciar sesión');
    res.redirect('/iniciar-sesion');
}

//Muestra el Formulario para subir una imgen de Perfil
exports.formSubirImagenPerfil = async(req, res) => {
    const usuario = await Usuarios.findByPk(req.user.id);

    //Mostrar la Vista 
    res.render('imagen-perfil', {
        nombrePagina: 'Subir Imagen de Perfil',
        usuario
    });
}

//Guardar la imagen nueva, elimina la anterior(si aplica) y guarda y registra en la BD
exports.guardarImagenPerfil = async(req, res) => {
    const usuario = await Usuarios.findByPk(req.user.id);

    //Si hay imagen anterior, eliminarla
    if (req.file && usuario.imagen) {
        const imagenAnteriorPath = __dirname + `/../public/uploads/perfiles/${usuario.imagen}`;

        //Eliminar archivo con filesystem
        fs.unlink(imagenAnteriorPath, (error) => {
            if (error) {
                console.log(error);
            }
            return;
        })
    }

    //Almacenar la nueva Imagen
    if (req.file) {
        usuario.imagen = req.file.filename;
    }

    //Almacenar en la BD y Redireccionar
    await usuario.save();
    req.flash('exito', 'Cambios Almacenados Correctamente');
    res.redirect('/administracion');

}













