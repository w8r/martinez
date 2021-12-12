export const renderPoints = (possiblePoints, prop) => {
  const map = window.map
  let points = window.points
  if (!map) return
  if (points !== undefined) points.clearLayers()

  points = window.points = L.layerGroup([]).addTo(map)
  possiblePoints.forEach((e) => {
    const point = L.circleMarker([e.point[1], e.point[0]], {
      radius: Math.floor(5 + Math.random() * 10),
      color: e[prop] ? 'green' : 'gray',
      opacity: e[prop] ? 0.5 : 0.1,
      weight: 1
    }).addTo(points)
  })
}

export const renderSweepLine = (sweepLine, pos, event) => {
  const map = window.map
  if (!map) return
  if (window.sws) {
    window.sws.forEach((p) => {
      map.removeLayer(p)
    })
  }
  window.sws = []
  sweepLine.forEach((e) => {
    const poly = L.polyline([
      e.key.point.slice().reverse(),
      e.key.otherEvent.point.slice().reverse()
    ], { color: 'green' }).addTo(map)
    window.sws.push(poly)
  })

  if (window.vt) map.removeLayer(window.vt)
  const v = pos.slice()
  const b = map.getBounds()
  window.vt = L.polyline([
    [b.getNorth(), v[0]],
    [b.getSouth(), v[0]]
  ], { color: 'green', weight: 1 }).addTo(map)

  if (window.ps) map.removeLayer(window.ps)
  window.ps = L.polyline([
    event.point.slice().reverse(),
    event.otherEvent.point.slice().reverse()
  ], { color: 'black', weight: 9, opacity: 0.4 }).addTo(map)
  debugger
}
