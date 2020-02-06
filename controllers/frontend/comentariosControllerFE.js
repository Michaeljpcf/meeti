const Comentarios = require('../../models/Comentarios');
const Meeti = require('../../models/Meeti');

exports.agregarComentario = async(req, res, next) => {
    //Obtener el Comentario
    const {comentario} = req.body;

    //Crear Comentario en la BD
    await Comentarios.create({
        mensaje: comentario, 
        usuarioId: req.user.id,
        meetiId: req.params.id
    });

    //Redireccionar a la misma página
    res.redirect('back');
    next();
}

//Elimina un Comentario de la BD
exports.eliminarComentario = async(req, res, next) => {
    //Tomar el ID del Comentario
    const {comentarioId} = req.body;

    //Consultar el Comentario
    const comentario = await Comentarios.findOne({where: {id: comentarioId}});    

    //Verificar si existe el Comentario
    if (!comentario) {
        res.status(404).send('Acción no válida');
        return next();
    }

    //Consultar el Meeti del Comentario
    const meeti = await Meeti.findOne({where: {id: comentario.meetiId}});

    //Verificar quien lo borra sea el Creador
    if (comentario.usuarioId === req.user.id || meeti.usuarioId === req.user.id) {
        await Comentarios.destroy({where: {
            id: comentario.id
        }});
        res.status(200).send('Eliminado Correctamente');
        return next();
    } else {
        res.status(403).send('Acción no válida');
        return next();
    }
}