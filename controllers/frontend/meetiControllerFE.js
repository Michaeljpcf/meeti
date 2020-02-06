const Meeti = require('../../models/Meeti');
const Grupos = require('../../models/Grupos');
const Usuarios = require('../../models/Usuarios');
const Categorias = require('../../models/Categorias');
const Comentarios = require('../../models/Comentarios');
const moment = require('moment');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.mostrarMeeti = async(req, res) => {
    const meeti = await Meeti.findOne({
        where: {
            slug: req.params.slug      
        },
        include: [
            {
                model: Grupos
            },
            {
                model: Usuarios,
                attributes: ['id','nombre', 'imagen']
            }
        ]
    });

    //Si no existe
    if (!meeti) {
        res.redirect('/');
    }

    //Consultar por Meeti's cercanos
    const ubicacion = Sequelize.literal(`ST_GeomFromText('POINT(${meeti.ubicacion.coordinates[0]} ${meeti.ubicacion.coordinates[1]})')`);

    //ST_DISTANCE_Sphere = Retorna una línea en metros
    const distancia = Sequelize.fn('ST_DistanceSphere', Sequelize.col('ubicacion'), ubicacion);

    //Encontrar Meeti's cercanos
    const cercanos = await Meeti.findAll({
        order: distancia, //los ordena del más cercano al lejano
        where: Sequelize.where(distancia, {[Op.lte]: 2000}), //2 mil metros o 2km
        limit: 3, //máximo 3
        offset: 1,
        include: [
            {
                model: Grupos
            },
            {
                model: Usuarios,
                attributes: ['id','nombre', 'imagen']
            }
        ]
    })

    //Consultar después de verificar que existe el meeti
    const comentarios = await Comentarios.findAll({
        where: {meetiId: meeti.id},
        include: [
            {
                model: Usuarios,
                attributes: ['id', 'nombre', 'imagen']
            }
        ]
})

    //Pasar el Resultado hacia la vista
    res.render('mostrar-meeti', {
        nombrePagina: meeti.titulo,
        meeti,
        comentarios,
        cercanos,
        moment
    })
}

//Confirma o cancela si el Usuario asistirá al Meeti
exports.confirmarAsistencia = async(req, res) => {
    console.log(req.body);

    const {accion}= req.body;

    if (accion === 'confirmar') {
        //Agregar Usuario
        Meeti.update(
            {'interesados': Sequelize.fn('array_append', Sequelize.col('interesados'), req.user.id)},
            {'where': {'slug': req.params.slug}}
        );
        //Mensaje
        res.send('Has Confirmado tu Asistencia');
    } else {
        //Cancelar la Asistencia del Usuario
        Meeti.update(
            {'interesados': Sequelize.fn('array_remove', Sequelize.col('interesados'), req.user.id)},
            {'where': {'slug': req.params.slug}}
        );
        //Mensaje
        res.send('Has Cancelado tu Asistencia');
    }   
}

//Muestraq el Listado de Asistentes 
exports.mostrarAsistentes = async(req, res) => {
    const meeti = await Meeti.findOne({
                                        where: {slug: req.params.slug},
                                        attributes: ['interesados']
    });

    //Extraer Interesados
    const {interesados} = meeti;
    const asistentes = await Usuarios.findAll({
        attributes: ['nombre', 'imagen'], //extraemos nombre e imagen
        where: {id: interesados}
    });

    //Crear la Vista y pasar Datos
    res.render('asistentes-meeti', {
        nombrePagina: 'Listado Asistentes Meeti',
        asistentes
    })
}

//Muestra los Meeti's agrupados por Categoria
exports.mostrarCategoria = async(req, res, next) => {
    const categoria = await Categorias.findOne({
                                            attributes: ['id', 'nombre'],
                                            where: {slug: req.params.categoria}
    });
    
    //Esta consulta va a traer la información del Meeti, categoria y de que Usuario pertenece
    const meetis = await Meeti.findAll({
                                    order: [
                                        ['fecha', 'ASC'],
                                        ['hora', 'ASC']
                                    ],
                                    include: [
                                        {
                                            model: Grupos,
                                            where: {categoriaId: categoria.id}
                                        },
                                        {
                                            model: Usuarios
                                        }
                                    ]
    });

    res.render('categoria', {
        nombrePagina: `Categoria: ${categoria.nombre}`,
        meetis,
        moment
    })

    console.log(categoria.id);
}