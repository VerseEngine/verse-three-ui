import * as THREE from "three";

class Tmps {
  vec: THREE.Vector3;
  vec1: THREE.Vector3;
  constructor() {
    this.vec = new THREE.Vector3();
    this.vec1 = new THREE.Vector3();
  }
}
let _tmps: Tmps;

/**
 * Show and hide Gui3D.
 * Display if you look down diagonally.
 *
 * @example
 * ```ts
 * import {
 *   Gui3D,
 *   Gui3DVisibleSwitcher,
 * } from "verse-three-ui";
 * ...
 *
 * const clock = new THREE.Clock();
 * renderer.setAnimationLoop(() => {
 *   ...
 *
 *   const dt = clock.getDelta();
 *   gui3DSwitcher?.tick(dt);
 * });
 * ...
 * gui3DSwitcher = new Gui3DVisibleSwitcher(renderer.xr, gui3d.object3D, camera);
 * ```
 */
export class Gui3DVisibleSwitcher {
  private _xr: THREE.WebXRManager;
  private _gui: THREE.Object3D;
  private _camera: THREE.Object3D;
  private _visible = false;
  private _timeToHide?: number;
  private _dirX = 0;

  constructor(
    xr: THREE.WebXRManager, // renderer.xr
    gui: THREE.Object3D,
    camera: THREE.Object3D
  ) {
    if (!_tmps) {
      _tmps = new Tmps();
    }
    this._xr = xr;
    this._gui = gui;
    this._camera = camera;
    this.visible = false;
  }
  /**
   * Must be called periodically.
   *
   * @param deltaTime - `THREE.Clock.getDelta()`
   *
   * @example
   * ```ts
   * const clock = new THREE.Clock();
   * renderer.setAnimationLoop(() => {
   *   const dt = clock.getDelta();
   *   gui3DSwitcher.tick(dt);
   * });
   * ```
   * or
   * ```ts
   * const clock = new THREE.Clock();
   * setInterval(() => {
   *   const dt = clock.getDelta();
   *   gui3DSwitcher.tick(dt);
   * }, anything);
   * ```
   */
  tick(deltaTime: number) {
    if (!this._xr.isPresenting) {
      this.visible = false;
      return;
    }
    //Display if you look diagonally down.
    const dir = _tmps.vec
      .set(0, 0, -1)
      .applyQuaternion(this._camera.quaternion);
    if (this._visible) {
      const b = Math.abs(dir.x) > 0.4;
      if (b) {
        delete this._timeToHide;
        if (this._dirX > 0 !== dir.x > 0) {
          this._dirX = dir.x;
          this._setVisible(true, dir.x);
        }
      } else if (this._timeToHide === undefined) {
        this._timeToHide = 1;
      } else {
        this._timeToHide -= deltaTime;
        if (this._timeToHide <= 0) {
          delete this._timeToHide;
          this.visible = false;
        }
      }
    } else {
      const b = Math.abs(dir.x) > 0.4 && dir.y < -0.4;
      if (b) {
        this._dirX = dir.x;
        this._setVisible(true, dir.x);
      }
    }
  }
  private _setVisible(visible: boolean, dirX: number) {
    if (visible) {
      const cameraPos = this._camera.getWorldPosition(_tmps.vec);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const offsetPos = this._gui.parent!.getWorldPosition(_tmps.vec1);
      this._gui.position.set(
        0.4 * (dirX > 0 ? 1 : -1),
        cameraPos.y - 0.5 - offsetPos.y,
        -0.2
      );
      this._gui.lookAt(cameraPos);
    }
    this.visible = visible;
  }
  set visible(v: boolean) {
    this._visible = v;
    this._gui.visible = v;
  }
  /**
   * visibility
   */
  get visible() {
    return this._visible;
  }
}
