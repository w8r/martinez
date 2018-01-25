require('./coordinates');
require('./polygoncontrol');
require('./booleanopcontrol');
var martinez = window.martinez = require('../../src/index');
//var martinez = require('../../dist/martinez.min');
var xhr  = require('superagent');
var mode = window.location.hash.substring(1);
var path = '../test/fixtures/';
var ext  = '.geojson';
var file;

var files = [
  'asia', 'trapezoid-box', 'canada', 'horseshoe', 'hourglasses', 'overlap_y',
  'polygon_trapezoid_edge_overlap', 'touching_boxes', 'two_pointed_triangles',
  'hole_cut', 'overlapping_segments', 'overlap_loop', 'disjoint_boxes'
];

switch (mode) {
  case 'geo':
    file = 'asia.geojson';
    break;
  case 'states':
    file = 'states_source.geojson';
    break;
  case 'trapezoid':
    file = 'trapezoid-box.geojson';
    break;
  case 'canada':
    file = 'canada.geojson';
    break;
  case 'horseshoe':
    file = 'horseshoe.geojson';
    break;
  case 'hourglasses':
    file = 'hourglasses.geojson';
    break;
  case 'edge_overlap':
    file = 'polygon_trapezoid_edge_overlap.geojson';
    break;
  case 'touching_boxes':
    file = 'touching_boxes.geojson';
    break;
  case 'triangles':
    file = 'two_pointed_triangles.geojson';
    break;
  case 'holecut':
    file = 'hole_cut.geojson';
    break;
  case 'overlapping_segments':
    file = 'overlapping_segments.geojson';
    break;
  case 'overlap_loop':
    file = 'overlap_loop.geojson';
    break;
  case 'overlap_y':
    file = 'overlap_y.geojson';
    break;
  case 'overlap_two':
    file = 'overlap_two.geojson';
    break;
  case 'disjoint_boxes':
    file = 'disjoint_boxes.geojson';
    break;
  case 'polygons_edge_overlap':
    file = 'polygons_edge_overlap.geojson';
    break;
  case 'collapsed':
    file = 'collapsed.geojson';
    break;
  default:
    file = 'hole_hole.geojson';
    break;
}

console.log(mode);


var OPERATIONS = {
  INTERSECTION: 0,
  UNION:        1,
  DIFFERENCE:   2,
  XOR:          3
};

var div = document.createElement('div');
div.id = 'image-map';
div.style.width = div.style.height = '100%';
document.body.appendChild(div);

// create the slippy map
var map = window.map = L.map('image-map', {
  minZoom: 1,
  maxZoom: 20,
  center: [0, 0],
  zoom: 2,
  crs: mode === 'geo' ? L.CRS.EPSG4326 : L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(1/8, 0, -1/8, 0)
  }),
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
  xhr
    .get(path)
    .accept('json')
    .end(function(e, r) {
      if (!e) {
        drawnItems.addData(JSON.parse(r.text));
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

  //console.log('input', subject, clipping, op);

  subject  = JSON.parse(JSON.stringify(subject));
  clipping = JSON.parse(JSON.stringify(clipping));

  var operation;
  if (op === OPERATIONS.INTERSECTION) {
    operation = martinez.intersection;
  } else if (op === OPERATIONS.UNION) {
    operation = martinez.union;
  } else if (op === OPERATIONS.DIFFERENCE) {
    operation = martinez.diff;
  } else if (op === 5) { // B - A
    operation = martinez.diff;

    var temp = subject;
    subject  = clipping;
    clipping = temp;
  } else {
    operation = martinez.xor;
  }

  console.time('martinez');
  var result = operation(subject.geometry.coordinates, clipping.geometry.coordinates);
  console.timeEnd('martinez');

  //if (op === OPERATIONS.UNION) result = result[0];
  console.log('result', result);
  // console.log(JSON.stringify(result))
  results.clearLayers();

  if (result !== null) {
    results.addData({
      'type': 'Feature',
      'geometry': {
        'type': 'MultiPolygon',
        'coordinates': result
      }
    });

    setTimeout(function() {
      console.time('jsts');
      var s = reader.read(subject);
      var c = reader.read(clipping);
      var res;
      if (op === OPERATIONS.INTERSECTION) {
        res = s.geometry.intersection(c.geometry);
      } else if (op === OPERATIONS.UNION) {
        res = s.geometry.union(c.geometry);
      } else if (op === OPERATIONS.DIFFERENCE) {
        res = s.geometry.difference(c.geometry);
      } else {
        res = s.geometry.symDifference(c.geometry);
      }
      res = writer.write(res);
      console.timeEnd('jsts');
      console.log(res);
    }, 500);
  }
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
