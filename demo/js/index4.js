var L = require('leaflet');
var LeafletEditable = require('leaflet-editable');
var martinez = require('../../');


var two_triangles = require('../../test/fixtures/two_shapes.json');
var oneInside = require('../../test/fixtures/one_inside.json');
var twoPointedTriangles = require('../../test/fixtures/two_pointed_triangles.json');
var selfIntersecting = require('../../test/fixtures/self_intersecting.json');
var holes = require('../../test/fixtures/hole_hole.json');

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
  crs: L.CRS.Simple,
  editable: true
});

L.EditControl = L.Control.extend({

  options: {
    position: 'topleft',
    callback: null,
    kind: '',
    html: ''
  },

  onAdd: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-control leaflet-bar'),
        link = L.DomUtil.create('a', '', container);

    link.href = '#';
    link.title = 'Create a new ' + this.options.kind;
    link.innerHTML = this.options.html;
    L.DomEvent.on(link, 'click', L.DomEvent.stop)
              .on(link, 'click', function () {
                window.LAYER = this.options.callback.call(map.editTools);
              }, this);

    return container;
  }

});

L.NewPolygonControl = L.EditControl.extend({
  options: {
    position: 'topleft',
    callback: map.editTools.startPolygon,
    kind: 'polygon',
    html: '▰'
  }
});

map.addControl(new L.NewPolygonControl());

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

//var drawnItems = window.drawnItems = L.geoJson(two_triangles).addTo(map);

// var drawControl = new L.Control.Draw({
//   edit: {
//     featureGroup: drawnItems
//   }
// });
//map.addControl(drawControl);
// map.on('draw:created', function (e) {
//     drawnItems.addLayer(e.layer);
// });

var w = 4000 * 2;
var h = 2500 * 2;


// calculate the edges of the image, in coordinate space
var southWest = map.unproject([0, h], map.getMinZoom() + 4);
var northEast = map.unproject([w, 0], map.getMinZoom() + 4);
var bounds = new L.LatLngBounds(southWest, northEast);
map.fitBounds(bounds, {
    animate: false
});

var drawnItems = window.drawnItems = L.geoJson().addTo(map);

//drawnItems.addData(oneInside);
//drawnItems.addData(twoPointedTriangles);
//drawnItems.addData(selfIntersecting);
drawnItems.addData(holes);

map.on('editable:created', function(evt) {
  drawnItems.addLayer(evt.layer);
  evt.layer.on('click', function(e) {
    if ((e.originalEvent.ctrlKey || e.originalEvent.metaKey) && this.editEnabled()) {
      this.editor.newHole(e.latlng);
    }
  });
});


function run (op) {
  var layers = drawnItems.getLayers();
  if (layers.length < 2) return;
  var subject = layers[0].toGeoJSON();
  var clipping = layers[1].toGeoJSON();

  console.log('input', subject, clipping, op);

  var result = martinez(subject.geometry.coordinates, clipping.geometry.coordinates, op);

  console.log('result', JSON.stringify(result, 0, 2));

  results.clearLayers();
  results.addData({
    'type': 'Feature',
    'geometry': {
      'type': 'Polygon',
      'coordinates': result
    }
  });
}


var BooleanControl = L.Control.extend({
  options: {
    position: 'topright'
  },

  onAdd: function(map) {
    var container = this._container = L.DomUtil.create('div', 'leaflet-bar');
    this._container.style.background = '#ffffff';
    this._container.style.padding = '10px';
    container.innerHTML = [
      '<form>',
        '<ul style="list-style:none; padding-left: 0">',
          '<li>','<label>', '<input type="radio" name="op" value="0" checked />',  ' Intersection', '</label>', '</li>',
          '<li>','<label>', '<input type="radio" name="op" value="1" />',  ' Union', '</label>', '</li>',
          '<li>','<label>', '<input type="radio" name="op" value="2" />',  ' Difference', '</label>', '</li>',
          '<li>','<label>', '<input type="radio" name="op" value="3" />',  ' Xor', '</label>', '</li>',
        '</ul>',
        '<input type="submit" value="Run">', '<input name="clear" type="button" value="Clear layers">',
      '</form>'].join('');
    var form = container.querySelector('form');
    L.DomEvent
      .on(form, 'submit', function (evt) {
        L.DomEvent.stop(evt);
        run(parseInt(form['op'].value));
      })
      .on(form['clear'], 'click', function(evt) {
        L.DomEvent.stop(evt);
        drawnItems.clearLayers();
        results.clearLayers();
      });

    L.DomEvent
      .disableClickPropagation(this._container)
      .disableScrollPropagation(this._container);
    return this._container;
  }

});

var booleancontrol = new BooleanControl();
map.addControl(booleancontrol);

var results = window.results = L.geoJson(null, {
  style: function(feature) {
    return {
      color: 'red',
      weight: 1
    };
  }
}).addTo(map);

L.Util.requestAnimFrame(function() {
  map.fitBounds(drawnItems.getBounds().pad(0.25), { animate: false });
});
