import path from "path";
import Tree from "splaytree";
import load from "load-json-file";
import { describe, it, assert } from "vitest";
import { compareSegments } from "../src/compare_segments";
import { sweepEvent } from "../src/sweep_event";
import { Feature, Polygon } from "geojson";

// GeoJSON Data
const data = load.sync(
  path.join(__dirname, "fixtures", "two_triangles.geojson")
);

const subject: Feature<Polygon> = data.features[0];
const clipping: Feature<Polygon> = data.features[1];

describe("sweep line", () => {
  it("insert", () => {
    const s = subject.geometry.coordinates;
    const c = clipping.geometry.coordinates;

    const EF = sweepEvent(s[0][0], true, sweepEvent(s[0][2], false), true);
    //EF.name = "EF";
    const EG = sweepEvent(s[0][0], true, sweepEvent(s[0][1], false), true);
    //EG.name = "EG";

    const tree = new Tree(compareSegments);
    tree.insert(EF);
    tree.insert(EG);

    assert.equal(tree.find(EF).key, EF, "able to retrieve node");
    assert.equal(tree.minNode().key, EF, "EF is at the begin");
    assert.equal(tree.maxNode().key, EG, "EG is at the end");

    let iter = tree.find(EF);

    assert.equal(tree.next(iter).key, EG);

    iter = tree.find(EG);

    assert.equal(tree.prev(iter).key, EF);

    const DA = sweepEvent(c[0][0], true, sweepEvent(c[0][2], false), true);
    const DC = sweepEvent(c[0][0], true, sweepEvent(c[0][1], false), true);

    tree.insert(DA);
    tree.insert(DC);

    let begin = tree.minNode();

    assert.equal(begin.key, DA, "DA");
    begin = tree.next(begin);
    assert.equal(begin.key, DC, "DC");
    begin = tree.next(begin);
    assert.equal(begin.key, EF, "EF");
    begin = tree.next(begin);
    assert.equal(begin.key, EG, "EG");
  });
});
