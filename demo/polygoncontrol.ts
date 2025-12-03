import L from "leaflet";

declare global {
  interface Window {
    LAYER: any;
  }
}

declare module "leaflet" {
  interface EditControlOptions extends ControlOptions {
    callback?: any;
    kind?: string;
    html?: string;
  }

  namespace Control {
    class EditControl extends Control {
      constructor(options?: EditControlOptions);
      options: EditControlOptions;
    }

    class NewPolygonControl extends EditControl {
      constructor(options?: EditControlOptions);
    }
  }
}

(L.Control as any).EditControl = L.Control.extend({
  options: {
    position: "topleft",
    callback: null,
    kind: "",
    html: "",
  },

  onAdd: function (this: any, map: any) {
    const container = L.DomUtil.create("div", "leaflet-control leaflet-bar");
    const link = L.DomUtil.create("a", "", container);

    link.href = "#";
    link.title = "Create a new " + this.options.kind;
    link.innerHTML = this.options.html;
    L.DomEvent.on(link, "click", L.DomEvent.stop).on(
      link,
      "click",
      function (this: any) {
        window.LAYER = this.options.callback.call(map.editTools);
      },
      this
    );

    return container;
  },
});

(L as any).NewPolygonControl = (L.Control as any).EditControl.extend({
  options: {
    position: "topleft",
    kind: "polygon",
    html: "▰",
  },
});
