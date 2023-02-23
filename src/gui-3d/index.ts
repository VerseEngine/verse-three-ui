import * as THREE from "three";
import * as assets from "../assets";
import { loadSvgGeometry } from "./svg";
import type { GuiHandlers } from "../gui-handler";
import { BUTTON_SIZE, ToggleButton, ClickableObject } from "./button";
import { VolumeControl } from "./volume-control";

type Disposable = { dispose(): void };
const MARGIN = BUTTON_SIZE / 10;

export interface Gui3DOptions {
  /**
   * Hide Mic button
   */
  isMicDisabled?: boolean;
  /**
   * Hide Mirror button
   */
  isMirrorDisabled?: boolean;
  /**
   * Hide BGM button
   */
  isBgmDisabled?: boolean;
  /**
   * Hide Voice button
   */
  isVoiceDisabled?: boolean;
}

/**
 * Configuration UI for VR.
 */
export class Gui3D {
  private _object3D: THREE.Object3D;
  private _disposables: Disposable[] = [];
  private _handlers?: GuiHandlers;
  private _buttons: ClickableObject[] = [];
  private _updateStates: Array<() => void> = [];

  /**
   * @example
   * ```ts
   * const gui3d = new Gui3D({
   *   isBgmDisabled: true
   * })
   * ```
   */
  constructor(options?: Gui3DOptions) {
    const root = new THREE.Group();
    root.name = "Gui3D";
    this._object3D = root;

    const m0 = new THREE.MeshToonMaterial({
      color: 0xffffff,
    });
    const m1 = new THREE.MeshToonMaterial({
      color: 0x252525,
    });
    this._disposables.push(m0, m1);
    const iconMaterials = { default: m0, hover: m1 };
    const bgMaterials = { default: m1, hover: m0 };

    const bgGeometry = new THREE.PlaneGeometry(BUTTON_SIZE, BUTTON_SIZE);
    this._disposables.push(bgGeometry);

    let volumeControlBgm: VolumeControl | undefined;
    let volumeControlVoice: VolumeControl | undefined;
    {
      const minus = loadSvgGeometry(assets.minusSvg);
      const plus = loadSvgGeometry(assets.plusSvg);
      const volumes = [
        loadSvgGeometry(assets.volume0Svg),
        loadSvgGeometry(assets.volume1Svg),
        loadSvgGeometry(assets.volume2Svg),
        loadSvgGeometry(assets.volume3Svg),
      ];
      this._disposables.push(minus, plus);

      const create = () => {
        const volumeControl = new VolumeControl(
          minus,
          plus,
          bgGeometry,
          bgMaterials,
          iconMaterials,
          volumes,
          m0
        );
        volumeControl.object3D.visible = false;
        root.add(volumeControl.object3D);
        this._buttons.push(...volumeControl.clickableObjects);
        return volumeControl;
      };
      if (!options?.isBgmDisabled) {
        volumeControlBgm = create();
        volumeControlBgm.object3D.rotation.x = THREE.MathUtils.degToRad(25);
      }
      if (!options?.isVoiceDisabled) {
        volumeControlVoice = create();
        volumeControlVoice.object3D.rotation.x = THREE.MathUtils.degToRad(20);
      }
    }
    {
      // menubar
      const buttonCount =
        (options?.isMirrorDisabled ? 0 : 1) +
        (options?.isMicDisabled ? 0 : 1) +
        (options?.isBgmDisabled ? 0 : 1) +
        (options?.isVoiceDisabled ? 0 : 1);
      let x = (-BUTTON_SIZE / 2) * (buttonCount - 1);

      if (!options?.isMirrorDisabled) {
        const on = loadSvgGeometry(assets.mirrorOnSvg);
        const off = loadSvgGeometry(assets.mirrorOffSvg);
        this._disposables.push(on, off);
        const btn = new ToggleButton(
          { on: off, off: on },
          bgGeometry,
          bgMaterials,
          iconMaterials
        );
        btn.object3D.position.x = x;
        x += BUTTON_SIZE;
        root.add(btn.object3D);
        this._buttons.push(btn.object3D);
        const updateState = () => {
          btn.setOn(!!this._handlers?.isMirrorOn());
        };
        this._updateStates.push(updateState);
        btn.setOnClick(() => {
          if (this._handlers?.isMirrorOn()) {
            this._handlers?.mirrorOff?.();
          } else {
            this._handlers?.mirrorOn?.();
          }
          updateState();
        });
      }
      if (!options?.isMicDisabled) {
        const on = loadSvgGeometry(assets.micOnSvg);
        const off = loadSvgGeometry(assets.micOffSvg);
        this._disposables.push(on, off);
        const btn = new ToggleButton(
          { on: off, off: on },
          bgGeometry,
          bgMaterials,
          iconMaterials
        );
        root.add(btn.object3D);
        this._buttons.push(btn.object3D);
        btn.object3D.position.x = x;
        x += BUTTON_SIZE;
        const updateState = () => {
          btn.setOn(!!this._handlers?.isMicOn());
        };
        this._updateStates.push(updateState);
        btn.setOnClick(() => {
          if (this._handlers?.isMicOn()) {
            this._handlers?.micOff?.();
          } else {
            this._handlers?.micOn?.();
          }
          updateState();
        });
      }
      if (volumeControlVoice) {
        const svg = loadSvgGeometry(assets.voiceSvg);
        const svgMute = loadSvgGeometry(assets.voiceMuteSvg);
        this._disposables.push(svg, svgMute);
        const btn = new ToggleButton(
          { on: svg, off: svg },
          bgGeometry,
          bgMaterials,
          iconMaterials,
          iconMaterials,
          bgMaterials
        );
        btn.object3D.position.x = x;
        x += BUTTON_SIZE;
        root.add(btn.object3D);
        this._buttons.push(btn.object3D);
        const updateState = () => {
          if ((this._handlers?.getVoiceVolume() || 0) === 0) {
            btn.setIconGeometries({ on: svgMute, off: svgMute });
          } else {
            btn.setIconGeometries({ on: svg, off: svg });
          }
        };
        this._updateStates.push(updateState);
        bindVolumeControl(
          btn,
          volumeControlVoice,
          () => this._handlers?.getVoiceVolume?.() || 0,
          async (v) => {
            await this._handlers?.setVoiceVolume?.(v);
            updateState();
          }
        );
      }
      if (volumeControlBgm) {
        const svg = loadSvgGeometry(assets.bgmSvg);
        const svgMute = loadSvgGeometry(assets.bgmMuteSvg);
        this._disposables.push(svg, svgMute);
        const btn = new ToggleButton(
          { on: svg, off: svg },
          bgGeometry,
          bgMaterials,
          iconMaterials,
          iconMaterials,
          bgMaterials
        );
        btn.object3D.position.x = x;
        x += BUTTON_SIZE;
        root.add(btn.object3D);
        this._buttons.push(btn.object3D);
        const updateState = () => {
          if ((this._handlers?.getBgmVolume() || 0) === 0) {
            btn.setIconGeometries({ on: svgMute, off: svgMute });
          } else {
            btn.setIconGeometries({ on: svg, off: svg });
          }
        };
        this._updateStates.push(updateState);
        bindVolumeControl(
          btn,
          volumeControlBgm,
          () => this._handlers?.getBgmVolume?.() || 0,
          async (v) => {
            await this._handlers?.setBgmVolume?.(v);
            updateState();
          }
        );
      }
    }
  }

  /**
   * 3D object to add to Scene
   */
  get object3D() {
    return this._object3D;
  }
  /**
   * Child objects for which user interaction needs to be determined.
   */
  get clickableObjects(): ClickableObject[] {
    return this._buttons;
  }
  /**
   * Set GuiHandlers
   */
  setGuiHandlers(handlers: GuiHandlers) {
    this._handlers = handlers;
    this.updateStates();
  }
  /**
   * Reflect the state of GuiHandlers in the UI
   */
  updateStates() {
    this._updateStates.forEach((v) => v());
  }
  /**
   * Releases all resources allocated by this instance.
   */
  dispose() {
    this._disposables.forEach((v) => v.dispose());
    this.object3D.removeFromParent();
  }
}

function bindVolumeControl(
  btn: ToggleButton,
  volumeControl: VolumeControl,
  getVolume: () => number,
  setVolume: (value: number) => Promise<void>
) {
  btn.setOnClick(() => {
    btn.setOn(!btn.isOn());
    if (!btn.isOn()) {
      volumeControl.object3D.visible = false;
      return;
    }
    volumeControl.object3D.visible = true;
    volumeControl.object3D.position.set(
      btn.object3D.position.x,
      BUTTON_SIZE / 2 + MARGIN,
      0
    );
    volumeControl.bind((v) => {
      setVolume(v);
    }, getVolume);
  });
}
