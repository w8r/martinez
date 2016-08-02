require('./coordinates');
require('./polygoncontrol');
require('./booleanopcontrol');
var martinez = window.martinez = require('../../');
//var martinez = require('../../dist/martinez.min');
var xhr = require('superagent');
var mode = /geo/.test(window.location.hash) ? 'geo' : 'orthogonal';
var path = '../test/fixtures/';
var file = mode === 'geo' ? 'asia.json' : 'horseshoe.json';

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
  crs: mode === 'geo' ? L.CRS.EPSG4326 : L.CRS.Simple,
  editable: true
});

map.addControl(new L.NewPolygonControl({
  callback: map.editTools.startPolygon
}));
map.addControl(new L.Coordinates());
map.addControl(new L.BooleanControl({
  callback: run,
  clear: clear
}));

var drawnItems = window.drawnItems = L.geoJson().addTo(map);

function loadData(path) {
  console.log(path);
  // var two_triangles = require('../../test/fixtures/two_shapes.json');
  // var oneInside = require('../../test/fixtures/one_inside.json');
  // var twoPointedTriangles = require('../../test/fixtures/two_pointed_triangles.json');
  // var selfIntersecting = require('../../test/fixtures/self_intersecting.json');
  // var holes = require('../../test/fixtures/hole_hole.json');
  //var data =  require('../../test/fixtures/indonesia.json');
  xhr
    .get(path)
    .set('Accept', 'application/json')
    .end(function(e, r) {
      if (!e) {
        drawnItems.addData(r.body);
        map.fitBounds(drawnItems.getBounds().pad(0.05), { animate: false });
      }
    });
}

function clear() {
  drawnItems.clearLayers();
  results.clearLayers();
}

var reader = new jsts.io.GeoJSONReader();
var writer = new jsts.io.GeoJSONWriter();


function run (op) {
  var layers = drawnItems.getLayers();
  if (layers.length < 2) return;
  var subject = layers[0].toGeoJSON();
  var clipping = layers[1].toGeoJSON();

  console.log('input', subject, clipping, op);

  subject  = JSON.parse(JSON.stringify(subject));
  clipping = JSON.parse(JSON.stringify(clipping));


  console.time('martinez');
  var result = martinez(subject.geometry.coordinates, clipping.geometry.coordinates, op);
  console.timeEnd('martinez');

  //console.log('result', result, res);

  results.clearLayers();
  results.addData({
    'type': 'Feature',
    'geometry': {
      'type': 'Polygon',
      'coordinates': result
    }
  });

  setTimeout(function() {
    console.time('jsts');
    var s = reader.read(subject);
    var c = reader.read(clipping);
    var res;
    if (op === martinez.operations.INTERSECTION) {
      res = s.geometry.intersection(c.geometry);
    } else if (op === martinez.operations.UNION) {
      res = s.geometry.union(c.geometry);
    } else if (op === martinez.operations.DIFFERENCE) {
      res = s.geometry.difference(c.geometry);
    } else {
      res = s.geometry.symDifference(c.geometry);
    }
    res = writer.write(res);
    console.timeEnd('jsts');
  }, 500);
}

//drawnItems.addData(oneInside);
//drawnItems.addData(twoPointedTriangles);
//drawnItems.addData(selfIntersecting);
//drawnItems.addData(holes);
//drawnItems.addData(data);

map.on('editable:created', function(evt) {
  drawnItems.addLayer(evt.layer);
  evt.layer.on('click', function(e) {
    if ((e.originalEvent.ctrlKey || e.originalEvent.metaKey) && this.editEnabled()) {
      this.editor.newHole(e.latlng);
    }
  });
});

var results = window.results = L.geoJson(null, {
  style: function(feature) {
    return {
      color: 'red',
      weight: 1
    };
  }
}).addTo(map);

loadData(path + file);
