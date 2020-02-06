const Meeti = require('../../models/Meeti');
const Grupos = require('../../models/Grupos');
const Usuarios = require('../../models/Usuarios');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const moment = require('moment');

exports.resultadosBusqueda = async(req, res) => {
    //Leer Datos de la URL
    const{categoria, titulo, ciudad, pais} = req.query;

    //Si la Categoria esta vacía
    let query;
    if (categoria === '') {
        query= '';
    } else {
        query= `where: {
            categoriaId: {[Op.eq]: ${categoria} }
        }`
    }
    
    //Filtrar los Meeti's por los términos de Búsqueda
    const meetis = await Meeti.findAll({
        where: {
            titulo: {[Op.iLike]: '%' + titulo + '%'},
            ciudad: {[Op.iLike]: '%' + ciudad + '%'},
            pais: {[Op.iLike]: '%' + pais + '%'}
        },
        include: [
            {
                model: Grupos,
                query
            },
            {
                model: Usuarios,
                attributes: ['id','nombre', 'imagen']
            }
        ]
    });

    //Pasar los resultados a la Vista
    res.render('busqueda', {
        nombrePagina: 'Resultados Búsqueda',
        meetis,
        moment
    })
}