import axios from 'axios';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', () => {
    const formsEliminar = document.querySelectorAll('.eliminar-comentario');

    //Revisar que existan los Formularios
    if (formsEliminar.length > 0) {
        formsEliminar.forEach((form) => {
            form.addEventListener('submit', eliminarComentario);
        });
    }
});

function eliminarComentario(e){
    e.preventDefault();

    Swal.fire({
        title: 'Eliminar Comentario?',
        text: 'Un Comentario Eliminado no se puede Recuperar',
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Si, borrar!',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.value) {
            //Tomar el id del Comentario
            const comentarioId = this.children[0].value;

            //Crear el Objeto
            const datos = {
                comentarioId
            }

            //Ejecutar axios y pasar los Datos
            axios.post(this.action, datos).then((respuesta) => {
                Swal.fire('Eliminado', respuesta.data, 'success');

                //Eliminar del DOM
                this.parenElement.parenElement.remove();
            }).catch(error => {
                if (error.response.status === 403 || error.response.status === 404) {
                    Swal.fire('Error', error.response.data, 'error');
                }
            });            
        }
    });
}