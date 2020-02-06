import {OpenStreetMapProvider} from 'leaflet-geosearch';
import asistencia from './asistencia';
import eliminarComentario from './eliminarComentario';

//Obtener valores de la BD


const lat = document.querySelector('#lat').value || -11.863771;
const lng = document.querySelector('#lng').value || -77.077231;
const direccion = document.querySelector('#direccion').value || '';
const map = L.map('mapa').setView([lat, lng], 15);

let markers = new L.FeatureGroup().addTo(map);
let marker;

//Utilizar el Provider y GeoCoder
const geocodeService = L.esri.Geocoding.geocodeService();

//Colocar el Pin en edición
if (lat && lng) {
    //Agregar el pin
    marker = new L.marker([lat, lng], {
        draggable: true,
        autoPan: true
    })
    .addTo(map)
    .bindPopup(direccion)
    .openPopup();

    //Asignar al contenedor markers
    markers.addLayer(marker);

    //Detectar movimiento del marker
    marker.on('moveend', function(e) {
        marker = e.target;
        const posicion = marker.getLatLng();
        map.panTo(new L.LatLng(posicion.lat, posicion.lng));

        //Reverse geoCoding, cuando el Usuario reubica el pin
        geocodeService.reverse().latlng(posicion, 15).run(function(error, result) {
            llenarInputs(result);
            //Asigna los valores al popup del marker
            marker.bindPopup(result.address.LongLabel);
        });
    })
}

document.addEventListener('DOMContentLoaded', () => {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    //Buscar la Dirección
    const buscador = document.querySelector('#formbuscador');
    buscador.addEventListener('input', buscarDireccion);
})

function buscarDireccion(e) {
    if (e.target.value.length > 8) {
        //Si existe un Pin anterior limpiarlo
        markers.clearLayers();
        
       
        const provider = new OpenStreetMapProvider();
        provider.search({query: e.target.value}).then((resultado) => {
            
            geocodeService.reverse().latlng(resultado[0].bounds[0], 15).run(function(error, result) {
                llenarInputs(result);

                // console.log(resultado);
                //Mostrar el Mapa
                map.setView(resultado[0].bounds[0], 15);

                //Agregar el pin
                marker = new L.marker(resultado[0].bounds[0], {
                    draggable: true,
                    autoPan: true
                })
                .addTo(map)
                .bindPopup(resultado[0].label)
                .openPopup();

                //Asignar al contenedor markers
                markers.addLayer(marker);

                //Detectar movimiento del marker
                marker.on('moveend', function(e) {
                    marker = e.target;
                    const posicion = marker.getLatLng();
                    map.panTo(new L.LatLng(posicion.lat, posicion.lng));

                    //Reverse geoCoding, cuando el Usuario reubica el pin
                    geocodeService.reverse().latlng(posicion, 15).run(function(error, result) {
                        llenarInputs(result);
                        //Asigna los valores al popup del marker
                        marker.bindPopup(result.address.LongLabel);
                    });
                })
            })

        })
    }
}

function llenarInputs(resultado) {
    document.querySelector('#direccion').value = resultado.address.Address || '';
    document.querySelector('#ciudad').value = resultado.address.City || '';
    document.querySelector('#estado').value = resultado.address.Region || '';
    document.querySelector('#pais').value = resultado.address.CountryCode || '';
    document.querySelector('#lat').value = resultado.latlng.lat || '';
    document.querySelector('#lng').value = resultado.latlng.lng || '';
}

