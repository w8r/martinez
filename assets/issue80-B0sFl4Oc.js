var e=`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[10, 10], [80, 10], [80, 80], [10, 80], [10, 10]]]
      }
    },
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[20, 10], [30, 10], [30, 80], [20, 80], [20, 10]]]
      }
    },
    {
      "type": "Feature",
      "properties": {"operation": "diff"},
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [[[10, 10], [20, 10], [20, 80], [10, 80], [10, 10]]],
          [[[30, 10], [80, 10], [80, 80], [30, 80], [30, 10]]]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {"operation": "union"},
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [
            [
              [10, 10],
              [20, 10],
              [30, 10],
              [80, 10],
              [80, 80],
              [30, 80],
              [20, 80],
              [10, 80],
              [10, 10]
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {"operation": "intersection"},
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[[20, 10], [30, 10], [30, 80], [20, 80], [20, 10]]]]
      }
    },
    {
      "type": "Feature",
      "properties": {"operation": "xor"},
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [[[10, 10], [20, 10], [20, 80], [10, 80], [10, 10]]],
          [[[30, 10], [80, 10], [80, 80], [30, 80], [30, 10]]]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {"operation": "diff_ba"},
      "geometry": {"type": "MultiPolygon", "coordinates": []}
    }
  ]
}`;export{e as default};