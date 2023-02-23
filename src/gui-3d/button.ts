import * as THREE from "three";

export const BUTTON_SIZE = 0.15;

export type ButtonMaterials = {
  default: THREE.Material;
  hover: THREE.Material;
};
export type ToggleButtonGeometries<
  TGeometry extends THREE.BufferGeometry = THREE.BufferGeometry
> = {
  off: TGeometry;
  on: TGeometry;
};

/**
 * THREE.Object3D with event handler added to act as a button
 */
export interface ClickableObject extends THREE.Object3D {
  /**
   * Click event handler. like {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event | click}.
   */
  onClick(): void;
  /**
   * Cursor hover event handler. like {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseover_event | mouseover}.
   */
  onHover(): void;
  /**
   * Cursor leave event handler. like {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseleave_event | mouseleave}.
   */
  onLeave(): void;
}

export class Button<
  TGeometry extends THREE.BufferGeometry = THREE.BufferGeometry
> {
  _object3D: ClickableObject;
  _bg: THREE.Mesh;
  _icon: THREE.Mesh;
  _bgMaterials: ButtonMaterials;
  _iconMaterials: ButtonMaterials;
  _onClick?: () => Promise<void> | void;
  _isHover = false;
  constructor(
    iconGeometry: TGeometry,
    bgGeometry: TGeometry,
    bgMaterials: ButtonMaterials,
    iconMaterials: ButtonMaterials
  ) {
    this._bgMaterials = bgMaterials;
    this._iconMaterials = iconMaterials;
    const root = new THREE.Object3D();
    this._object3D = root as ClickableObject;
    this._object3D.onClick = () => {
      this.onClick();
    };
    this._object3D.onHover = () => {
      this.setHover(true);
    };
    this._object3D.onLeave = () => {
      this.setHover(false);
    };

    const bg = new THREE.Mesh(bgGeometry, bgMaterials.default);
    bg.position.z = -0.001;
    root.add(bg);
    this._bg = bg;

    const icon = new THREE.Mesh(iconGeometry, iconMaterials.default);
    icon.scale.set(0.005, 0.005, 0.005);
    icon.scale.y *= -1;
    root.add(icon);
    this._icon = icon;
  }
  get object3D(): ClickableObject {
    return this._object3D;
  }
  isHover() {
    return this._isHover;
  }
  setHover(v: boolean) {
    this._isHover = v;
    if (v) {
      this._bg.material = this._bgMaterials.hover;
      this._icon.material = this._iconMaterials.hover;
    } else {
      this._bg.material = this._bgMaterials.default;
      this._icon.material = this._iconMaterials.default;
    }
  }
  onClick() {
    this._onClick?.();
  }
  setOnClick(v?: () => Promise<void> | void) {
    this._onClick = v;
  }
}

export class ToggleButton<
  TGeometry extends THREE.BufferGeometry = THREE.BufferGeometry
> extends Button {
  _iconGeometries: ToggleButtonGeometries;
  _isOn = false;
  _bgMaterialsOn?: ButtonMaterials;
  _iconMaterialsOn?: ButtonMaterials;

  constructor(
    iconGeometries: ToggleButtonGeometries,
    bgGeometry: TGeometry,
    bgMaterials: ButtonMaterials,
    iconMaterials: ButtonMaterials,
    bgMaterialsOn?: ButtonMaterials,
    iconMaterialsOn?: ButtonMaterials
  ) {
    super(iconGeometries.off, bgGeometry, bgMaterials, iconMaterials);
    this._iconGeometries = iconGeometries;
    this._bgMaterialsOn = bgMaterialsOn;
    this._iconMaterialsOn = iconMaterialsOn;
  }
  isOn() {
    return this._isOn;
  }
  setIconGeometries(iconGeometries: ToggleButtonGeometries) {
    this._iconGeometries = iconGeometries;
    this.setOn(this._isOn);
    this.setHover(this.isHover());
  }
  setOn(v: boolean) {
    this._isOn = v;
    if (v) {
      this._icon.geometry = this._iconGeometries.on;
    } else {
      this._icon.geometry = this._iconGeometries.off;
    }
    this.setHover(this.isHover());
  }
  setHover(v: boolean) {
    if (!this._isOn) {
      super.setHover(v);
      return;
    }
    if (v) {
      this._bg.material = this._bgMaterialsOn?.hover || this._bgMaterials.hover;
      this._icon.material =
        this._iconMaterialsOn?.hover || this._iconMaterials.hover;
    } else {
      this._bg.material =
        this._bgMaterialsOn?.default || this._bgMaterials.default;
      this._icon.material =
        this._iconMaterialsOn?.default || this._iconMaterials.default;
    }
  }
}
