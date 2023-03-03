import * as THREE from "three";

class Tmps {
  vec: THREE.Vector3;
  vec1: THREE.Vector3;
  vec2: THREE.Vector3;
  quat: THREE.Quaternion;
  mat: THREE.Matrix4;
  constructor() {
    this.vec = new THREE.Vector3();
    this.vec1 = new THREE.Vector3();
    this.vec2 = new THREE.Vector3();
    this.quat = new THREE.Quaternion();
    this.mat = new THREE.Matrix4();
  }
}
let _tmps: Tmps;

type XREvent = {
  type: THREE.XRControllerEventType;
  data?: XRInputSource;
};

/**
 * Show and hide Gui3D.
 * ```
 * - Head gesture looking diagonally down to display GUI.
 * - A, X buttons on Quest, etc., Menu button on VIVE focus (buttons[4]).
 * ```
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
  private _gamepads: Array<Gamepad | undefined>;
  private _buttonStates: Array<boolean | undefined> = [];
  private _isShowByButton = false;
  private _isHideByButton = false;

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

    this._gamepads = new Array(2);
    const initController = (i: number) => {
      const c = xr.getController(i);
      c.addEventListener("connected", (e: XREvent) => {
        if (!e.data) {
          return;
        }
        this._gamepads[i] = e.data.gamepad;
      });
      c.addEventListener("disconnected", () => {
        this._gamepads[i] = undefined;
      });
    };
    initController(0);
    initController(1);
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
      if (this._visible) {
        this.visible = false;
      }
      return;
    }
    //Display if you look diagonally down.
    const dir = _tmps.vec
      .set(0, 0, -1)
      .applyQuaternion(this._camera.quaternion);
    if (this._visible) {
      if (!this._isShowByButton) {
        if (Math.abs(dir.x) > 0.6) {
          delete this._timeToHide;
          if (this._dirX > 0 !== dir.x > 0) {
            this._dirX = dir.x;
            this._setVisible(true, dir.x);
            return;
          }
        } else if (Math.abs(dir.x) <= 0.4) {
          if (this._timeToHide === undefined) {
            this._timeToHide = 1;
          } else {
            this._timeToHide -= deltaTime;
            if (this._timeToHide <= 0) {
              delete this._timeToHide;
              this.visible = false;
              return;
            }
          }
        }
      }
    } else {
      if (!this._isHideByButton) {
        if (Math.abs(dir.x) > 0.6 && dir.y < -0.5) {
          this._dirX = dir.x;
          if (!this._isHideByButton) {
            this._setVisible(true, dir.x);
            return;
          }
        }
      } else {
        if (Math.abs(dir.x) <= 0.4) {
          this._isHideByButton = false;
        }
      }
    }

    for (let i = 0; i < this._gamepads.length; i++) {
      if (this._gamepads[i]?.buttons[4]?.pressed) {
        if (!this._buttonStates[i]) {
          this._buttonStates[i] = true;
          this._toggleByButton();
        }
      } else {
        this._buttonStates[i] = false;
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
    if (!v) {
      this._isShowByButton = false;
    } else {
      this._isHideByButton = false;
    }
  }
  /**
   * visibility
   */
  get visible() {
    return this._visible;
  }

  private _toggleByButton() {
    if (this.visible) {
      this.visible = false;
      this._isHideByButton = true;
      return;
    }

    const forward = _tmps.vec.set(0, 0, -0.7);
    const cameraPos = this._camera.getWorldPosition(_tmps.vec1);
    const pos = _tmps.vec2.copy(cameraPos);
    const quat = this._camera.getWorldQuaternion(_tmps.quat);
    pos.add(forward.applyQuaternion(quat).multiplyScalar(1));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    pos.applyMatrix4(_tmps.mat.copy(this._gui.parent!.matrixWorld).invert());

    this._gui.position.set(pos.x, pos.y - 0.3, pos.z);
    this._gui.lookAt(cameraPos);
    this.visible = true;
    this._isShowByButton = true;
  }
}
