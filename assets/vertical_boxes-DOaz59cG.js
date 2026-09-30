var e=`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[0, 0], [3, 0], [3, 3], [0, 3], [0, 0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [[[1, 0], [2, 0], [2, 4], [1, 4], [1, 0]]],
          [[[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]]]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {"operation": "diff"},
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [[[0, 0], [1, 0], [1, 3], [0, 3], [0, 0]]],
          [[[2, 1], [3, 1], [3, 3], [2, 3], [2, 1]]]
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
              [0, 0],
              [1, 0],
              [2, 0],
              [3, 0],
              [3, 1],
              [3, 3],
              [2, 3],
              [2, 4],
              [1, 4],
              [1, 3],
              [0, 3],
              [0, 0]
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
        "coordinates": [
          [[[1, 0], [2, 0], [3, 0], [3, 1], [2, 1], [2, 3], [1, 3], [1, 0]]]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {"operation": "xor"},
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [[[0, 0], [1, 0], [1, 3], [0, 3], [0, 0]]],
          [
            [
              [1, 3],
              [2, 3],
              [3, 3],
              [3, 1],
              [2, 1],
              [2, 3],
              [2, 4],
              [1, 4],
              [1, 3]
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {"operation": "diff_ba"},
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[[1, 3], [2, 3], [2, 4], [1, 4], [1, 3]]]]
      }
    }
  ]
}`;export{e as default};