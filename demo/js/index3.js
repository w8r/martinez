var L = require('leaflet');
var LeafletDraw = require('leaflet-draw');
var martinez = require('../../');


var two_triangles = require('../../test/fixtures/two_shapes.json');

var div = document.createElement('div');
div.id = 'image-map';
div.style.width = div.style.height = '100%';
document.body.appendChild(div);

// create the slippy map
var map = window.map = L.map('image-map', {
  minZoom: 1,
  maxZoom: 20,
  center: [0, 0],
  zoom: 1,
  crs: L.CRS.Simple
});

L.Coordinates = L.Control.extend({
  options: {
    position: 'bottomright'
  },

  onAdd: function(map) {
    this._container = L.DomUtil.create('div', 'leaflet-bar');
    this._container.style.background = '#ffffff';
    map.on('mousemove', this._onMouseMove, this);
    return this._container;
  },

  _onMouseMove: function(e) {
    this._container.innerHTML = '<span style="padding: 5px">' +
      e.latlng.lng + ', ' + e.latlng.lat + '</span>';
  }

});

new L.Coordinates().addTo(map);

var drawnItems = window.drawnItems = L.geoJson().addTo(map);
drawnItems.addData(two_triangles);
L.Util.requestAnimFrame(function() {
  map.fitBounds(drawnItems.getBounds(), { animate: false });
});

var drawControl = new L.Control.Draw({
  edit: {
    featureGroup: drawnItems
  }
});
map.addControl(drawControl);
map.on('draw:created', function (e) {
    drawnItems.addLayer(e.layer);
});

var w = 4000 * 2;
var h = 2500 * 2;


// calculate the edges of the image, in coordinate space
var southWest = map.unproject([0, h], map.getMinZoom() + 4);
var northEast = map.unproject([w, 0], map.getMinZoom() + 4);
var bounds = new L.LatLngBounds(southWest, northEast);
map.fitBounds(bounds, {
    animate: false
});

map.on('click', function(e) {
  console.log('map', e);
});