import L from "leaflet";

declare module "leaflet" {
  interface ControlOptions {
    position?: "topleft" | "topright" | "bottomleft" | "bottomright";
  }

  namespace Control {
    class Coordinates extends Control {
      constructor(options?: ControlOptions);
    }
  }

  function coordinates(options?: ControlOptions): Control.Coordinates;
}

L.Control.Coordinates = L.Control.extend({
  options: {
    position: "bottomright",
  },

  onAdd: function (this: any, map: L.Map) {
    this._container = L.DomUtil.create("div", "leaflet-bar");
    this._container.style.background = "#ffffff";
    map.on("mousemove", this._onMouseMove, this);
    return this._container;
  },

  _onMouseMove: function (this: any, e: L.LeafletMouseEvent) {
    this._container.innerHTML =
      '<span style="padding: 5px">' +
      e.latlng.lng.toFixed(3) +
      ", " +
      e.latlng.lat.toFixed(3) +
      "</span>";
  },
});

(L as any).Coordinates = function (options?: L.ControlOptions) {
  return new (L.Control as any).Coordinates(options);
};
