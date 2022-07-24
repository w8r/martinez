import L from 'leaflet';
import * as jsts from 'jsts';
import 'leaflet-editable';
import { GUI } from 'dat.gui';
import { CoordinatesControl, NewPolygonControl } from './src';
import { FeatureCollection, GeometryObject } from 'geojson';
import * as martinez from '../src/';

let mode = globalThis.location.hash.substring(1);
let path = '/';
const ext = '.geojson';
let file;

let files = [
  'asia',
  //'asia_unionPoly',
  'canada',
  'collapsed',
  //'crash_overlap',
  'disjoint_boxes',
  'hole_cut',
  'hole_hole',
  'horseshoe',
  'indonesia',
  'issue100',
  'issue102',
  'issue110',
  'issue90',
  'issue99',
  'one_inside',
  'overlap_loop_x10',
  'overlap_self_intersect',
  'overlap_two',
  'overlapping_segments',
  'overlapping_segments_complex',
  'polygons_edge_overlap',
  'saw_rect',
  'self_intersecting',
  'shape_border',
  'states_source',
  'trapezoid-box',
  'two_pointed_triangles',
  'two_shapes',
  'two_triangles'
  //'vertical_boxes'
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
  case 'vertical_boxes':
    file = 'vertical_boxes.geojson';
    break;
  case 'collapsed':
    file = 'collapsed.geojson';
    break;
  case 'fatal1':
    file = 'fatal1.geojson';
    break;
  case 'fatal2':
    file = 'fatal2.geojson';
    break;
  case 'fatal3':
    file = 'fatal3.geojson';
    break;
  case 'fatal4':
    file = 'fatal4.geojson';
    break;
  case 'rectangles':
    file = 'rectangles.geojson';
    break;
  default:
    file = 'hole_hole.geojson';
    break;
}

const OPERATIONS = martinez.operations;

var div = document.createElement('div');
div.id = 'image-map';
div.style.width = div.style.height = '100%';
document.body.appendChild(div);

// create the slippy map
// @ts-ignore
const map = (globalThis.map = L.map('image-map', {
  minZoom: 1,
  maxZoom: 20,
  center: [0, 0],
  zoom: 2,
  crs:
    mode === 'geo'
      ? L.CRS.EPSG4326
      : L.extend({}, L.CRS.Simple, {
          transformation: new L.Transformation(1 / 8, 0, -1 / 8, 0)
        }),
  editable: true
}));

map.addControl(
  new NewPolygonControl({
    // @ts-ignore
    callback: map.editTools.startPolygon
  })
);
// @ts-ignore
map.addControl(new CoordinatesControl());

// add GUI
const state = {
  operations: {
    INTERSECTION: () => run(OPERATIONS.INTERSECTION),
    UNION: () => run(OPERATIONS.UNION),
    'A - B': () => run(OPERATIONS.DIFFERENCE),
    'B - A': () => run(5),
    XOR: () => run(OPERATIONS.XOR)
  },
  files: files[0],
  clear
};
const gui = new GUI({ name: 'martinez' });
const operationsFolder = gui.addFolder('Operation');
operationsFolder.open();
Object.keys(state.operations).forEach((operation) => {
  operationsFolder
    .add(state.operations, operation)
    .onChange((e) => run(e))
    .name(operation);
});
gui
  .add(state, 'files', files)
  .name('Source')
  .onChange((e) => {
    clear();
    loadData(path + e + '.geojson');
  });
gui.add(state, 'clear').name('Clear');

// @ts-ignore
const drawnItems = (globalThis.drawnItems = L.geoJSON().addTo(map));
let rawData: GeometryObject | FeatureCollection<GeometryObject> | null = null;

function loadData(path: string) {
  console.log('request', path);
  fetch(path)
    .then((r) => r.json())
    .catch((e) => console.log({ e }))
    .then((json) => {
      console.log(json);
      drawnItems.addData(json);
      rawData = json;
      map.fitBounds(drawnItems.getBounds().pad(0.05), { animate: false });
    });
}

function clear() {
  drawnItems.clearLayers();
  results.clearLayers();
  rawData = null;
}

const reader = new jsts.io.GeoJSONReader();
const writer = new jsts.io.GeoJSONWriter();

function getClippingPoly(layers) {
  // @ts-ignore
  if (rawData && rawData.features && rawData.features.length > 1)
    return (rawData as FeatureCollection<GeometryObject>).features[1];
  return layers[1].toGeoJSON();
}

type valueOf<T> = T[keyof T];

function run(op: valueOf<typeof OPERATIONS>) {
  var layers = drawnItems.getLayers();
  if (layers.length < 2) return;
  // @ts-ignore
  let subject = rawData !== null ? rawData.features[0] : layers[0].toGeoJSON();
  let clipping = getClippingPoly(layers);

  //console.log('input', subject, clipping, op);

  // subject  = JSON.parse(JSON.stringify(subject));
  // clipping = JSON.parse(JSON.stringify(clipping));

  var operation;
  if (op === OPERATIONS.INTERSECTION) {
    operation = martinez.intersection;
  } else if (op === OPERATIONS.UNION) {
    operation = martinez.union;
  } else if (op === OPERATIONS.DIFFERENCE) {
    operation = martinez.diff;
  } else if (op === 5) {
    // B - A
    operation = martinez.diff;

    var temp = subject;
    subject = clipping;
    clipping = temp;
  } else {
    operation = martinez.xor;
  }

  console.time('martinez');
  var result = operation(
    subject.geometry.coordinates,
    clipping.geometry.coordinates
  );
  console.timeEnd('martinez');

  console.log('result', result);
  // console.log(JSON.stringify(result));
  results.clearLayers();

  if (result !== null) {
    results.addData({
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: result
      }
    });

    setTimeout(function () {
      console.time('jsts');
      var s = reader.read(subject);
      var c = reader.read(clipping);
      var res;
      if (op === OPERATIONS.INTERSECTION) {
        // @ts-ignore
        res = s.geometry.intersection(c.geometry);
      } else if (op === OPERATIONS.UNION) {
        // @ts-ignore
        res = s.geometry.union(c.geometry);
      } else if (op === OPERATIONS.DIFFERENCE) {
        // @ts-ignore
        res = s.geometry.difference(c.geometry);
      } else {
        // @ts-ignore
        res = s.geometry.symDifference(c.geometry);
      }
      res = writer.write(res);
      console.timeEnd('jsts');
      // console.log('JSTS result', res);
    }, 500);
  }
}

map.on('editable:created', function (evt) {
  drawnItems.addLayer(evt.layer);
  evt.layer.on('click', function (e) {
    if (
      // @ts-ignore
      (e.originalEvent.ctrlKey || e.originalEvent.metaKey) &&
      this.editEnabled()
    ) {
      // @ts-ignore
      this.editor.newHole(e.latlng);
    }
  });
});

// @ts-ignore
var results = (globalThis.results = L.geoJson(null, {
  style: function () {
    return {
      color: 'red',
      weight: 1
    };
  }
}).addTo(map));

loadData(path + file);
