import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function loadSvgGeometry(svg: string): THREE.BufferGeometry {
  const data = new SVGLoader().parse(svg);
  const paths = data.paths;
  const geometries = [];
  for (const path of paths) {
    const fillColor = path.userData?.style?.fill;
    if (fillColor !== "none") {
      const shapes = SVGLoader.createShapes(path);
      for (const shape of shapes) {
        geometries.push(new THREE.ShapeGeometry(shape));
      }
    }
    const strokeColor = path.userData?.style?.stroke;
    if (strokeColor !== "none") {
      for (const subPath of path.subPaths) {
        const style = path.userData?.style;
        if (!style) {
          continue;
        }
        geometries.push(SVGLoader.pointsToStroke(subPath.getPoints(), style));
      }
    }
  }
  const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
  geometries.forEach((v) => v?.dispose());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const xml = data.xml as any;
  const [w, h] = parseSvgSize(xml);
  geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(w / -2, h / -2, 0));
  return geometry;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseSvgSize(xml: any): [number, number] {
  const svg = xml.documentElement ? xml.documentElement : xml;
  const viewBox = svg.getAttribute("viewBox")?.split(/\s+/);
  if (viewBox?.length === 4) {
    return [parseInt(viewBox[2], 10), parseInt(viewBox[3], 10)];
  }

  const w = _parseSvgSize(xml.getAttribute("width")) || 0;
  const h = _parseSvgSize(xml.getAttribute("height")) || 0;
  return [w, h];
}
function _parseSvgSize(v: string | null): number | null {
  if (!v) {
    return null;
  }
  if (!v.endsWith("px")) {
    return null;
  }
  return parseInt(v, 10);
}
