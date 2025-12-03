import "./coordinates";
import "./polygoncontrol";
import "./booleanopcontrol";
import * as martinez from "../index";
import L from "leaflet";
import "leaflet-editable";
import "leaflet/dist/leaflet.css";
import * as jsts from "jsts";

declare global {
  interface Window {
    map: L.Map;
    drawnItems: L.GeoJSON;
    results: L.GeoJSON;
    jsts: any;
  }
}

const mode = window.location.hash.substring(1);
const path = "../test/fixtures/";
let file: string;

switch (mode) {
  case "geo":
    file = "asia.geojson";
    break;
  case "states":
    file = "states_source.geojson";
    break;
  case "trapezoid":
    file = "trapezoid-box.geojson";
    break;
  case "canada":
    file = "canada.geojson";
    break;
  case "horseshoe":
    file = "horseshoe.geojson";
    break;
  case "hourglasses":
    file = "hourglasses.geojson";
    break;
  case "edge_overlap":
    file = "polygon_trapezoid_edge_overlap.geojson";
    break;
  case "touching_boxes":
    file = "touching_boxes.geojson";
    break;
  case "triangles":
    file = "two_pointed_triangles.geojson";
    break;
  case "holecut":
    file = "hole_cut.geojson";
    break;
  case "overlapping_segments":
    file = "overlapping_segments.geojson";
    break;
  case "overlap_loop":
    file = "overlap_loop.geojson";
    break;
  case "overlap_y":
    file = "overlap_y.geojson";
    break;
  case "overlap_two":
    file = "overlap_two.geojson";
    break;
  case "disjoint_boxes":
    file = "disjoint_boxes.geojson";
    break;
  case "polygons_edge_overlap":
    file = "polygons_edge_overlap.geojson";
    break;
  case "vertical_boxes":
    file = "vertical_boxes.geojson";
    break;
  case "collapsed":
    file = "collapsed.geojson";
    break;
  case "fatal1":
    file = "fatal1.geojson";
    break;
  case "fatal2":
    file = "fatal2.geojson";
    break;
  case "fatal3":
    file = "fatal3.geojson";
    break;
  case "fatal4":
    file = "fatal4.geojson";
    break;
  case "rectangles":
    file = "rectangles.geojson";
    break;
  default:
    file = "hole_hole.geojson";
    break;
}

console.log(mode);

enum OPERATIONS {
  INTERSECTION = 0,
  UNION = 1,
  DIFFERENCE = 2,
  XOR = 3,
}

const div = document.createElement("div");
div.id = "image-map";
div.style.width = div.style.height = "100%";
document.body.appendChild(div);

// create the slippy map
const map = (window.map = L.map("image-map", {
  minZoom: 1,
  maxZoom: 20,
  center: [0, 0],
  zoom: 2,
  crs:
    mode === "geo"
      ? L.CRS.EPSG4326
      : L.extend({}, L.CRS.Simple, {
          transformation: new L.Transformation(1 / 8, 0, -1 / 8, 0),
        }),
  editable: true,
} as any));

map.addControl(
  new (L as any).NewPolygonControl({
    callback: (map as any).editTools.startPolygon,
  })
);
map.addControl(new (L.Control as any).Coordinates());
map.addControl(
  new (L as any).BooleanControl({
    callback: run,
    clear: clear,
  })
);

const drawnItems = (window.drawnItems = L.geoJSON().addTo(map));
let rawData: any = null;

function loadData(path: string) {
  console.log(path);
  fetch(path)
    .then((r) => r.json())
    .then((json) => {
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

function getClippingPoly(layers: L.Layer[]): any {
  if (rawData !== null && rawData.features.length > 1)
    return rawData.features[1];
  return (layers[1] as any).toGeoJSON();
}

function run(op: number) {
  const layers = drawnItems.getLayers();
  if (layers.length < 2) return;
  let subject =
    rawData !== null ? rawData.features[0] : (layers[0] as any).toGeoJSON();
  let clipping = getClippingPoly(layers);

  let operation: (a: any, b: any) => any;
  if (op === OPERATIONS.INTERSECTION) {
    operation = martinez.intersection;
  } else if (op === OPERATIONS.UNION) {
    operation = martinez.union;
  } else if (op === OPERATIONS.DIFFERENCE) {
    operation = martinez.diff;
  } else if (op === 5) {
    // B - A
    operation = martinez.diff;
    const temp = subject;
    subject = clipping;
    clipping = temp;
  } else {
    operation = martinez.xor;
  }

  console.time("martinez");
  const result = operation(
    subject.geometry.coordinates,
    clipping.geometry.coordinates
  );
  console.timeEnd("martinez");

  console.log("result", result);
  results.clearLayers();

  if (result !== null) {
    results.addData({
      type: "Feature",
      geometry: {
        type: "MultiPolygon",
        coordinates: result,
      },
    });

    setTimeout(function () {
      console.time("jsts");
      const s = reader.read(subject);
      const c = reader.read(clipping);
      let res;
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
      console.timeEnd("jsts");
    }, 500);
  }
}

map.on("editable:created", function (evt: any) {
  drawnItems.addLayer(evt.layer);
  evt.layer.on("click", function (this: any, e: any) {
    if (
      (e.originalEvent.ctrlKey || e.originalEvent.metaKey) &&
      this.editEnabled()
    ) {
      this.editor.newHole(e.latlng);
    }
  });
});

const results = (window.results = L.geoJSON(null, {
  style: function (feature) {
    return {
      color: "red",
      weight: 1,
    };
  },
}).addTo(map));

loadData(path + file);
