//LEAFLET TUTORIAL
//L.map creates an instance of a map object by refering to a <div> element in the HTML
var mymap = L.map('mapid').setView([51.505, -0.09], 13);
//L.tileLayer adds tile layers to the map we created earlier
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		maxZoom: 18,
		id: 'mapbox.satellite',
		accessToken: 'pk.eyJ1IjoibXJvZXNzbGVyIiwiYSI6ImNqczNzdmp5YzJpcTc0NW8zbnc4NnlrbmQifQ.TB83zFDMDByOwYBVw7m55A'
}).addTo(mymap);
//L.marker creates a marker at a specific point on the map
var marker = L.marker([51.5, -0.09]).addTo(mymap);
//L.circle creates a circle over a specific point on the map
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(mymap);
//L.polygon creates a polygon on the map using a set of lat/long coordinates
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(mymap);

marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");
//L.popup creates an object that prints information about a point or polygon on the map
var popup = L.popup();

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(mymap);
}

mymap.on('click', onMapClick);
