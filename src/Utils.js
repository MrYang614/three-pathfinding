import { BufferAttribute, BufferGeometry, MathUtils, Vector3 } from 'three';

class Utils {

  static roundNumber(value, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  static sample(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  static distanceToSquared(a, b) {

    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;

    return dx * dx + dy * dy + dz * dz;

  }

  //+ Jonas Raoni Soares Silva
  //@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
  static isPointInTriangle(poly, pt) {

    const a = poly[0];
    const b = poly[1];
    const c = poly[2];

    const ab = new Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
    const bc = new Vector3(c.x - b.x, c.y - b.y, c.z - b.z);
    const ca = new Vector3(a.x - c.x, a.y - c.y, a.z - c.z);

    const ap = new Vector3(pt.x - a.x, pt.y - a.y, pt.z - a.z);
    const bp = new Vector3(pt.x - b.x, pt.y - b.y, pt.z - b.z);
    const cp = new Vector3(pt.x - c.x, pt.y - c.y, pt.z - c.z);

    const crossAB = ab.cross(ap);
    const crossBC = bc.cross(bp);
    const crossCA = ca.cross(cp);

    if (crossAB.y >= 0 && crossBC.y >= 0 && crossCA.y >= 0) {
      return true; // Point is inside the triangle
    }
    if (crossAB.y <= 0 && crossBC.y <= 0 && crossCA.y <= 0) {
      return true; // Point is inside the triangle
    }
    return false; // Point is outside the triangle

  }

  static isVectorInPolygon(vector, polygon, vertices) {

    // reference point will be the centroid of the polygon
    // We need to rotate the vector as well as all the points which the polygon uses

    var lowestPoint = 100000;
    var highestPoint = -100000;

    var polygonVertices = [];

    polygon.vertexIds.forEach((vId) => {
      lowestPoint = Math.min(vertices[vId].y, lowestPoint);
      highestPoint = Math.max(vertices[vId].y, highestPoint);
      polygonVertices.push(vertices[vId]);
    });

    if (vector.y < highestPoint + 0.5 && vector.y > lowestPoint - 0.5 &&
      this.isPointInTriangle(polygonVertices, vector)) {
      return true;
    }

    return false;
  }

  static triarea2(a, b, c) {
    var ax = b.x - a.x;
    var az = b.z - a.z;
    var bx = c.x - a.x;
    var bz = c.z - a.z;
    return bx * az - ax * bz;
  }

  static judgeDir(a, b, c) {
    const ab = new Vector3().subVectors(b, a).normalize();
    const ac = new Vector3().subVectors(c, a).normalize();
    return ab.cross(ac).y;
  }

  static vequal(a, b) {
    return this.distanceToSquared(a, b) < 0.00001;
  }

  /**
   * Modified version of BufferGeometryUtils.mergeVertices, ignoring vertex
   * attributes other than position.
   * @param  geometry
   * @param  tolerance
   * @return
   */
  static mergeVertices(geometry, tolerance = 1e-4) {

    tolerance = Math.max(tolerance, Number.EPSILON);

    // Generate an index buffer if the geometry doesn't have one, or optimize it
    // if it's already available.

    // 生成索引缓冲区，如果已经存在索引缓冲区，则优化索引缓冲区

    var hashToIndex = {};
    var indices = geometry.getIndex();
    var positions = geometry.getAttribute('position');
    var vertexCount = indices ? indices.count : positions.count;

    // Next value for triangle indices.
    var nextIndex = 0;

    var newIndices = [];
    var newPositions = [];

    // Convert the error tolerance to an amount of decimal places to truncate to.
    var decimalShift = Math.log10(1 / tolerance);
    var shiftMultiplier = Math.pow(10, decimalShift);

    for (var i = 0; i < vertexCount; i++) {

      var index = indices ? indices.getX(i) : i;

      // Generate a hash for the vertex attributes at the current index 'i'.
      var hash = '';

      // Double tilde truncates the decimal value.
      hash += `${~ ~(positions.getX(index) * shiftMultiplier)},`;
      hash += `${~ ~(positions.getY(index) * shiftMultiplier)},`;
      hash += `${~ ~(positions.getZ(index) * shiftMultiplier)},`;

      // Add another reference to the vertex if it's already
      // used by another index.
      if (hash in hashToIndex) {

        newIndices.push(hashToIndex[hash]);

      } else {

        newPositions.push(positions.getX(index));
        newPositions.push(positions.getY(index));
        newPositions.push(positions.getZ(index));

        hashToIndex[hash] = nextIndex;
        newIndices.push(nextIndex);
        nextIndex++;

      }

    }

    // Construct merged BufferGeometry.

    const positionAttribute = new BufferAttribute(
      new Float32Array(newPositions),
      positions.itemSize,
      positions.normalized
    );

    const result = new BufferGeometry();
    result.setAttribute('position', positionAttribute);
    result.setIndex(newIndices);

    return result;

  }

  /**
   * Returns the closest squared distance between this line segment and the given one.
   * @param {Line3} line1
   * @param {Line3} line2 - The line 2segment to compute the closest squared distance to.
   * @param {Vector3} [c1] - The closest point on this line segment.
   * @param {Vector3} [c2] - The closest point on the given line segment.
   * @return {number} The squared distance between this line segment and the given one.
   */
  static distanceSqToLine3(line1, line2, c1 = new Vector3(), c2 = new Vector3()) {

    // from Real-Time Collision Detection by Christer Ericson, chapter 5.1.9

    // Computes closest points C1 and C2 of S1(s)=P1+s*(Q1-P1) and
    // S2(t)=P2+t*(Q2-P2), returning s and t. Function result is squared
    // distance between between S1(s) and S2(t)

    const EPSILON = 1e-8 * 1e-8; // must be squared since we compare squared length
    let s, t;

    const p1 = line1.start;
    const p2 = line2.start;
    const q1 = line1.end;
    const q2 = line2.end;
    const _d1 = new Vector3()
    const _d2 = new Vector3()
    const _r = new Vector3()

    _d1.subVectors(q1, p1); // Direction vector of segment S1
    _d2.subVectors(q2, p2); // Direction vector of segment S2
    _r.subVectors(p1, p2);

    const a = _d1.dot(_d1); // Squared length of segment S1, always nonnegative
    const e = _d2.dot(_d2); // Squared length of segment S2, always nonnegative
    const f = _d2.dot(_r);

    // Check if either or both segments degenerate into points

    if (a <= EPSILON && e <= EPSILON) {

      // Both segments degenerate into points

      c1.copy(p1);
      c2.copy(p2);

      c1.sub(c2);

      return c1.dot(c1);

    }

    if (a <= EPSILON) {

      // First segment degenerates into a point

      s = 0;
      t = f / e; // s = 0 => t = (b*s + f) / e = f / e
      t = MathUtils.clamp(t, 0, 1);


    } else {

      const c = _d1.dot(_r);

      if (e <= EPSILON) {

        // Second segment degenerates into a point

        t = 0;
        s = MathUtils.clamp(- c / a, 0, 1); // t = 0 => s = (b*t - c) / a = -c / a

      } else {

        // The general nondegenerate case starts here

        const b = _d1.dot(_d2);
        const denom = a * e - b * b; // Always nonnegative

        // If segments not parallel, compute closest point on L1 to L2 and
        // clamp to segment S1. Else pick arbitrary s (here 0)

        if (denom !== 0) {

          s = MathUtils.clamp((b * f - c * e) / denom, 0, 1);

        } else {

          s = 0;

        }

        // Compute point on L2 closest to S1(s) using
        // t = Dot((P1 + D1*s) - P2,D2) / Dot(D2,D2) = (b*s + f) / e

        t = (b * s + f) / e;

        // If t in [0,1] done. Else clamp t, recompute s for the new value
        // of t using s = Dot((P2 + D2*t) - P1,D1) / Dot(D1,D1)= (t*b - c) / a
        // and clamp s to [0, 1]

        if (t < 0) {

          t = 0.;
          s = MathUtils.clamp(- c / a, 0, 1);

        } else if (t > 1) {

          t = 1;
          s = MathUtils.clamp((b - c) / a, 0, 1);

        }

      }

    }

    c1.copy(p1).add(_d1.multiplyScalar(s));
    c2.copy(p2).add(_d2.multiplyScalar(t));

    c1.sub(c2);

    return c1.dot(c1);

  }

}

export { Utils };
