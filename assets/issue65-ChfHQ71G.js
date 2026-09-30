var e=`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-93.621887, 44.154764],
            [-93.621844, 44.154535],
            [-93.621672, 44.154625],
            [-93.621887, 44.154764]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-93.621844, 44.154535],
            [-93.621672, 44.154625],
            [-93.621844, 44.154535]
          ]
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
              [-93.621887, 44.154764],
              [-93.621844, 44.154535],
              [-93.621672, 44.154625],
              [-93.621887, 44.154764]
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {"operation": "intersection"},
      "geometry": {"type": "MultiPolygon", "coordinates": []}
    },
    {
      "type": "Feature",
      "properties": {"operation": "xor"},
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [
            [
              [-93.621887, 44.154764],
              [-93.621844, 44.154535],
              [-93.621672, 44.154625],
              [-93.621887, 44.154764]
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {"operation": "diff"},
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [
            [
              [-93.621887, 44.154764],
              [-93.621844, 44.154535],
              [-93.621672, 44.154625],
              [-93.621887, 44.154764]
            ]
          ]
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