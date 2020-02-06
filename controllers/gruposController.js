const Categorias = require('../models/Categorias');
const Grupos = require('../models/Grupos');

const multer = require('multer');
const shortid = require('shortid');
const fs = require('fs');
const uuid = require('uuid/v4');

const configuracionMulter = {
    limits: {fileSize: 100000},
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, next) => {
            next(null, __dirname+'/../public/uploads/grupos/');
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

exports.formNuevoGrupo = async(req, res) => {
    const categorias = await Categorias.findAll();

    res.render('nuevo-grupo', {
        nombrePagina: 'Crea un Nuevo Grupo',
        categorias
    })
}

//Almacena los grupos en la BD
exports.crearGrupo = async(req, res) => {
    //sanitizar
    req.sanitizeBody('nombre');
    req.sanitizeBody('url');

    const grupo = req.body;

    //Almacena el Usuario autenticado como el creador del Grupo
    grupo.usuarioId = req.user.id;

    //Leer la Imagen
    if (req.file) {//este codigo revisa si el Usuario sube o no un Archivo 
        grupo.imagen = req.file.filename;
    }
    
    grupo.id = uuid();

    try {
        //Almacenar en la BD
        await Grupos.create(grupo);
        req.flash('exito', 'Se ha creado el Grupo Correctamente');
        res.redirect('/administracion');
    } catch (error) {
        //Extraer el message de los errores
        const erroresSequelize = error.errors.map(err => err.message);    
        req.flash('error', erroresSequelize);
        res.redirect('/nuevo-grupo');
    }
}

exports.formEditarGrupo = async(req, res) => {
    const consultas = [];
    consultas.push(Grupos.findByPk(req.params.grupoId));
    consultas.push(Categorias.findAll());

    //Promise con Await
    const [grupo, categorias] = await Promise.all(consultas);

    res.render('editar-grupo', {
        nombrePagina: `Editar Grupo : ${grupo.nombre}`,
        grupo,
        categorias
    })
}

//Guarda los cambios en la BD
exports.editarGrupo = async(req, res, next) => {
    const grupo = await Grupos.findOne({where: {id: req.params.grupoId, usuarioId: req.user.id}});

    //Si no Existe este grupo o no es el dueño
    if (!grupo) {
        req.flash('error', 'Operación no válida');
        res.redirect('/administracion');
        return next();
    }

    //Todo bien leer los valores
    const {nombre, descripcion, categoriaId, url} = req.body;

    //Asignar los valores
    grupo.nombre = nombre;
    grupo.descripcion = descripcion;
    grupo.categoriaId = categoriaId;
    grupo.url = url;

    //Guardamos en la BD
    await grupo.save();
    req.flash('exito', 'Cambios almacenados Correctamente');
    res.redirect('/administracion');
}

//Muestra el formulario para editar una imagen de Grupo
exports.formEditarImagen = async(req, res) => {
    const grupo = await Grupos.findOne({ where: { id: req.params.grupoId, usuarioId: req.user.id}});

    res.render('imagen-grupo', {
        nombrePagina: `Editar Imagen Grupo : ${grupo.nombre}`,
        grupo
    })
}

//Modifica la Imagen en la BD y elimina la anterior
exports.editarImagen = async(req, res, next) => {
    const grupo = await Grupos.findOne({ where: { id: req.params.grupoId, usuarioId: req.user.id }});

    //El Grupo existe y es válido
    if(!grupo) {
        req.flash('error', 'Operación no válida');
        res.redirect('/iniciar-sesion');
        return next();
    }

    // //Verificar que el archivo sea Nuevo
    // if(req.file) {
    //     console.log(req.file.filename);
    // }

    // //revisar que exista un archivo anterior
    // if (grupo.imagen) {
    //     console.log(grupo.imagen);
    // }

    //Si hay imagen anterior y nueva, significa que vamos a borrar la anterior
    if (req.file && grupo.imagen) {
        const imagenAnteriorPath = __dirname + `/../public/uploads/grupos/${grupo.imagen}`;

        //Eliminar archivo con filesystem
        fs.unlink(imagenAnteriorPath, (error) => {
            if (error) {
                console.log(error);
            }
            return;
        })
    }

    //Si hay una imagen nueva, la guardamos
    if (req.file) {
        grupo.imagen = req.file.filename;
    }

    //Guardad en la BD
    await grupo.save();
    req.flash('exito', 'Cambios Almacenados Correctamente');
    res.redirect('/administracion');

}

//Muestra el formulario para eliminar un grupo
exports.formEliminarGrupo = async(req, res, next) => {
    const grupo = await Grupos.findOne({where: {id: req.params.grupoId, usuarioId: req.user.id }});

    if (!grupo) {
        req.flash('error', 'Operación no Válida');
        res.redirect('/administracion');
        return next();
    }

    //Todo bien ejecutar la Vista
    res.render('eliminar-grupo', {
        nombrePagina: `Eliminar Grupo : ${grupo.nombre}`
    })
}

/* ------------------------------------------ */
/* Elimina el Grupo e Imagen */
/* ------------------------------------------ */
exports.eliminarGrupo = async(req, res, next) => {
    const grupo = await Grupos.findOne({where: {id: req.params.grupoId, usuarioId: req.user.id }});   

    //Si hay una Imagen, eliminarla
    if (grupo.imagen) {
        const imagenAnteriorPath = __dirname + `/../public/uploads/grupos/${grupo.imagen}`;

        //Eliminar archivo con filesystem
        fs.unlink(imagenAnteriorPath, (error) => {
            if (error) {
                console.log(error);
            }
            return;
        });
    }

    //Eliminar el Grupo
    await Grupos.destroy({
        where: {
            id: req.params.grupoId
        }
    });

    //Redireccionar al Usuario
    req.flash('exito', 'Grupo Eliminado');
    res.redirect('/administracion');
}