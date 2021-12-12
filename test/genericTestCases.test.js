import tap from 'tape'
import path from 'path'
import glob from 'glob'
import load from 'load-json-file'
import fs from 'fs'
import stringify from 'json-stringify-pretty-compact'
import * as martinez from '../index'

const extractExpectedResults = (features) => features.map((feature) => {
  const mode = feature.properties.operation
  let op
  switch (mode) {
    case 'union':
      op = martinez.union
      break
    case 'intersection':
      op = martinez.intersection
      break
    case 'xor':
      op = martinez.xor
      break
    case 'diff':
      op = martinez.diff
      break
    case 'diff_ba':
      op = (a, b) => martinez.diff(b, a)
      break
  }
  if (op == null) {
    throw new Error(`Invalid mode: ${mode}`)
  }
  return {
    op: op,
    coordinates: feature.geometry.coordinates
  }
})

const caseDir = path.join(__dirname, 'genericTestCases')
const testCases = glob.sync(path.join(caseDir, '*.geojson'))
if (testCases.length === 0) {
  throw new Error('No test cases found, this must not happen')
}

testCases.forEach((testCaseFile) => {
  const testName = 'Generic test case: ' + path.basename(testCaseFile)
  tap.test(testName, (t) => {
    const data = load.sync(testCaseFile)
    if (data.features.length < 2) {
      throw new Error(`Test case file must contain at least two features, but ${testCaseFile} doesn't.`)
    }

    const p1Geometry = data.features[0].geometry
    const p2Geometry = data.features[1].geometry

    const p1 = p1Geometry.type === 'Polygon' ? [p1Geometry.coordinates] : p1Geometry.coordinates
    const p2 = p2Geometry.type === 'Polygon' ? [p2Geometry.coordinates] : p2Geometry.coordinates

    const expectedResults = extractExpectedResults(data.features.slice(2))

    let featureIndex = 2
    for (const expectedResult of expectedResults) {
      const result = expectedResult.op(p1, p2)
      t.same(result, expectedResult.coordinates)

      // Update output data for re-generation mode
      data.features[featureIndex].geometry.type = 'MultiPolygon'
      data.features[featureIndex].geometry.coordinates = result
      featureIndex += 1
    }

    if (process.env.REGEN) {
      fs.writeFileSync(testCaseFile, stringify(data))
    }

    t.end()
  })
})
