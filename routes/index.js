const express = require('express');
const router = express.Router();

const homeController = require('../controllers/homeController');
const usuariosController = require('../controllers/usuariosController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const gruposController = require('../controllers/gruposController');
const meetiController = require('../controllers/meetiController');

const meetiControllerFE = require('../controllers/frontend/meetiControllerFE');
const usuariosControllerFE = require('../controllers/frontend/usuariosControllerFE');
const gruposControllerFE = require('../controllers/frontend/gruposControllerFE');
const comentariosControllerFE = require('../controllers/frontend/comentariosControllerFE');
const busquedaControllerFE = require('../controllers/frontend/busquedaControllerFE');

module.exports = function() {
    /* ------------------------------------------ */
    /* Área Pública(Front-End) */
    /* ------------------------------------------ */
    router.get('/', homeController.home);

    //Muestra un Meeti
    router.get('/meeti/:slug',
        meetiControllerFE.mostrarMeeti
    );

    //Confirma la Asistencia a Meeti
    router.post('/confirmar-asistencia/:slug',
        meetiControllerFE.confirmarAsistencia
    );

    //Muestra Asistentes al Meeti
    router.get('/asistentes/:slug',
        meetiControllerFE.mostrarAsistentes
    );

    //Agrega Comentarios en el Meeti
    router.post('/meeti/:id', 
        comentariosControllerFE.agregarComentario
    );

    //Eliminar Comentarios en el Meeti
    router.post('/eliminar-comentario',
        comentariosControllerFE.eliminarComentario
    );

    //Muestra Perfiles en el Front-End
    router.get('/usuarios/:id',
        usuariosControllerFE.mostrarUsuario
    );

    //Muestra los Grupos en el Front-End
    router.get('/grupos/:id',
        gruposControllerFE.mostrarGrupo           
    );

    //Muestra Meeti's por Categoria
    router.get('/categoria/:categoria', 
        meetiControllerFE.mostrarCategoria
    );

    //Añade la Búsqueda
    router.get('/busqueda',
        busquedaControllerFE.resultadosBusqueda
    );

    /* Crear y Confirmar Cuentas */
    /* ------------------------------------------ */ 
    router.get('/crear-cuenta', usuariosController.formCrearCuenta);
    router.post('/crear-cuenta', usuariosController.crearNuevaCuenta);
    router.get('/confirmar-cuenta/:correo', usuariosController.confirmarCuenta);

    //Iniciar Sesión
    router.get('/iniciar-sesion', usuariosController.formIniciarSesion);
    router.post('/iniciar-sesion', authController.autenticarUsuario);

    //Cerrar Sesión
    router.get('/cerrar-sesion',
        authController.usuarioAutenticado, 
        authController.cerrarSesion
    );

    /* ------------------------------------------ */
    /* Área Privada(Bck-End) */
    /* ------------------------------------------ */

    //Panel de Administración
    router.get('/administracion', 
        authController.usuarioAutenticado,  
        adminController.panelAdministracion
    );

    //Nuevos Grupos
    router.get('/nuevo-grupo', 
       authController.usuarioAutenticado,
       gruposController.formNuevoGrupo        
    );

    router.post('/nuevo-grupo', 
        authController.usuarioAutenticado,
        gruposController.subirImagen,   
        gruposController.crearGrupo     
    );

    //Editar Grupos
    router.get('/editar-grupo/:grupoId',
        authController.usuarioAutenticado,
        gruposController.formEditarGrupo
    );

    router.post('/editar-grupo/:grupoId',
        authController.usuarioAutenticado,
        gruposController.editarGrupo
    );

    //Editar la imagen del Grupo
    router.get('/imagen-grupo/:grupoId',
        authController.usuarioAutenticado,
        gruposController.formEditarImagen
    );

    router.post('/imagen-grupo/:grupoId',
        authController.usuarioAutenticado,
        gruposController.subirImagen,
        gruposController.editarImagen 
    );

    //Eliminar grupos
    router.get('/eliminar-grupo/:grupoId',
        authController.usuarioAutenticado,
        gruposController.formEliminarGrupo
    );

    router.post('/eliminar-grupo/:grupoId',
        authController.usuarioAutenticado,
        gruposController.eliminarGrupo
    );

    //Nuevos Meeti
    router.get('/nuevo-meeti',
        authController.usuarioAutenticado,
        meetiController.formNuevoMeeti
    );

    router.post('/nuevo-meeti',
        authController.usuarioAutenticado,
        meetiController.sanitizarMeeti, 
        meetiController.crearMeti
    );

    //Editar Meeti
    router.get('/editar-meeti/:id',
        authController.usuarioAutenticado,
        meetiController.formEditarMeeti
    );

    router.post('/editar-meeti/:id',
        authController.usuarioAutenticado,
        meetiController.editarMeeti
    );

    //Eliminar Meeti
    router.get('/eliminar-meeti/:id',
        authController.usuarioAutenticado,
        meetiController.formEliminarMeeti
    );

    router.post('/eliminar-meeti/:id',
        authController.usuarioAutenticado,
        meetiController.eliminarMeeti
    );

    //Editar información de Perfil
    router.get('/editar-perfil',
        authController.usuarioAutenticado,
        usuariosController.formEditarPerfil
    );

    router.post('/editar-perfil',
        authController.usuarioAutenticado,
        usuariosController.editarPerfil
    );

    //Modificar Password
    router.get('/cambiar-password',
        authController.usuarioAutenticado,
        usuariosController.formCambiarPassword
    );

    router.post('/cambiar-password',
        authController.usuarioAutenticado,
        usuariosController.cambiarPassword
    );

    //Imágenes de Perfil
    router.get('/imagen-perfil',
        authController.usuarioAutenticado,
        usuariosController.formSubirImagenPerfil
    );

    router.post('/imagen-perfil',
        authController.usuarioAutenticado,
        usuariosController.subirImagen,
        usuariosController.guardarImagenPerfil
    );

    return router;
}