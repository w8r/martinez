import L from 'leaflet';

const EditControl = L.Control.extend({
  options: {
    position: 'topleft',
    callback: null,
    kind: '',
    html: ''
  },

  onAdd: function (map) {
    const container = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
    const link = L.DomUtil.create('a', '', container);

    link.href = '#';
    link.title = 'Create a new ' + this.options.kind;
    link.innerHTML = this.options.html;
    L.DomEvent.on(link, 'click', L.DomEvent.stop).on(
      link,
      'click',
      function () {
        // @ts-ignore
        globalThis.LAYER = this.options.callback.call(map.editTools);
      },
      this
    );

    return container;
  }
});

export const NewPolygonControl = EditControl.extend({
  options: {
    position: 'topleft',
    kind: 'polygon',
    html: '▰',
    callback: () => undefined
  }
});
