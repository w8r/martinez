import L from "leaflet";

declare module "leaflet" {
  interface BooleanControlOptions extends ControlOptions {
    callback?: (op: number) => void;
    clear?: () => void;
  }

  namespace Control {
    class BooleanControl extends Control {
      constructor(options?: BooleanControlOptions);
      options: BooleanControlOptions;
    }
  }
}

(L as any).BooleanControl = L.Control.extend({
  options: {
    position: "topright",
  },

  onAdd: function (this: any, map: L.Map) {
    const container = (this._container = L.DomUtil.create(
      "div",
      "leaflet-bar"
    ));
    this._container.style.background = "#ffffff";
    this._container.style.padding = "10px";
    container.innerHTML = [
      "<form>",
      '<ul style="list-style:none; padding-left: 0">',
      "<li>",
      "<label>",
      '<input type="radio" name="op" value="0" checked />',
      " Intersection",
      "</label>",
      "</li>",
      "<li>",
      "<label>",
      '<input type="radio" name="op" value="1" />',
      " Union",
      "</label>",
      "</li>",
      "<li>",
      "<label>",
      '<input type="radio" name="op" value="2" />',
      " Difference A - B",
      "</label>",
      "</li>",
      "<li>",
      "<label>",
      '<input type="radio" name="op" value="5" />',
      " Difference B - A",
      "</label>",
      "</li>",
      "<li>",
      "<label>",
      '<input type="radio" name="op" value="3" />',
      " Xor",
      "</label>",
      "</li>",
      "</ul>",
      '<input type="submit" value="Run">',
      '<input name="clear" type="button" value="Clear layers">',
      "</form>",
    ].join("");
    const form = container.querySelector("form")!;
    L.DomEvent.on(
      form,
      "submit",
      function (this: any, evt: Event) {
        L.DomEvent.stop(evt);
        const radios = Array.prototype.slice.call(
          form.querySelectorAll("input[type=radio]")
        ) as HTMLInputElement[];
        for (let i = 0, len = radios.length; i < len; i++) {
          if (radios[i].checked) {
            this.options.callback(parseInt(radios[i].value));
            break;
          }
        }
      },
      this
    ).on(
      (form as any)["clear"],
      "click",
      function (this: any, evt: Event) {
        L.DomEvent.stop(evt);
        this.options.clear();
      },
      this
    );

    L.DomEvent.disableClickPropagation(
      this._container
    ).disableScrollPropagation(this._container);
    return this._container;
  },
});
