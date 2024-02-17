import { describe, it, assert } from "vitest";
import { signedArea } from "../src/signed_area";

describe("analytical signed area", () => {
  it("cases", () => {
    assert.equal(signedArea([0, 0], [0, 1], [1, 1]), -1, "negative area");
    assert.equal(signedArea([0, 1], [0, 0], [1, 0]), 1, "positive area");
    assert.equal(signedArea([0, 0], [1, 1], [2, 2]), 0, "collinear, 0 area");

    assert.equal(signedArea([-1, 0], [2, 3], [0, 1]), 0, "point on segment");
    assert.equal(signedArea([2, 3], [-1, 0], [0, 1]), 0, "point on segment");
  });
});
