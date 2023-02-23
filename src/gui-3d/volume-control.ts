import * as THREE from "three";
import {
  BUTTON_SIZE,
  Button,
  ClickableObject,
  ButtonMaterials,
} from "./button";
import { findLastIndex } from "../util";

export class VolumeControl<
  TGeometry extends THREE.BufferGeometry = THREE.BufferGeometry
> {
  _object3D: THREE.Object3D;
  _buttons: ClickableObject[] = [];
  _values: number[];
  _onChange?: (value: number) => void; // 0 <= value <= 1
  _getCurrentValue?: () => number;
  _volumeIconGeometries: TGeometry[];
  _volumeState: THREE.Mesh;

  constructor(
    minusIconGeometry: TGeometry,
    plusIconGeometry: TGeometry,
    buttonBgGeometry: TGeometry,
    buttonBgMaterials: ButtonMaterials,
    buttonMaterials: ButtonMaterials,
    volumeIconGeometries: TGeometry[],
    volumeBgMaterial: THREE.Material
  ) {
    {
      this._values = [];
      const step = 1 / (volumeIconGeometries.length - 1);
      for (let i = 0; i < volumeIconGeometries.length; i++) {
        if (i === volumeIconGeometries.length - 1) {
          this._values.push(1);
        } else {
          this._values.push(i * step);
        }
      }
    }

    const root = new THREE.Group();
    root.name = "VolumeControl";
    this._object3D = root;
    {
      const btn = new Button(
        minusIconGeometry,
        buttonBgGeometry,
        buttonBgMaterials,
        buttonMaterials
      );
      btn.object3D.position.y = BUTTON_SIZE / 2;
      root.add(btn.object3D);
      this._buttons.push(btn.object3D);
      btn.setOnClick(() => {
        this._minus();
      });
    }
    const stateAreaHeight = BUTTON_SIZE * 1.5;
    {
      const btn = new Button(
        plusIconGeometry,
        buttonBgGeometry,
        buttonBgMaterials,
        buttonMaterials
      );
      btn.object3D.position.y = BUTTON_SIZE / 2 + BUTTON_SIZE + stateAreaHeight;
      root.add(btn.object3D);
      this._buttons.push(btn.object3D);
      btn.setOnClick(() => {
        this._plus();
      });
    }
    {
      const volumeState = new THREE.Mesh(
        volumeIconGeometries[0],
        volumeBgMaterial
      );
      volumeState.scale.set(0.005, 0.005, 0.005);
      volumeState.scale.y *= -1;
      volumeState.position.y =
        BUTTON_SIZE / 2 + BUTTON_SIZE + (stateAreaHeight - BUTTON_SIZE) / 2;
      root.add(volumeState);
      this._volumeState = volumeState;
      this._volumeIconGeometries = volumeIconGeometries;
    }
  }
  get object3D() {
    return this._object3D;
  }
  get clickableObjects(): ClickableObject[] {
    return this._buttons;
  }
  bind(
    onChange: (value: number) => void, // 0 <= value <= 1
    getCurrentValue: () => number
  ) {
    this._onChange = onChange;
    this._getCurrentValue = getCurrentValue;
    this.updateState();
  }
  updateState() {
    if (!this._getCurrentValue) {
      return;
    }
    const i = this._getCurrentIndex(this._getCurrentValue());
    this._volumeState.geometry = this._volumeIconGeometries[i];
  }
  _plus() {
    if (!this._getCurrentValue) {
      return;
    }
    const i = this._getCurrentIndex(this._getCurrentValue());
    if (i >= this._values.length - 1) {
      return;
    }
    this._onChange?.(this._values[i + 1]);
    this.updateState();
  }
  _minus() {
    if (!this._getCurrentValue) {
      return;
    }
    const i = this._getCurrentIndex(this._getCurrentValue());
    if (i <= 0) {
      return;
    }
    this._onChange?.(this._values[i - 1]);
    this.updateState();
  }
  _getCurrentIndex(value: number) {
    return Math.max(
      findLastIndex(this._values, (v: number) => value >= v),
      0
    );
  }
}
