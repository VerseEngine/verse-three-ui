import type { GuiHandlers } from "../gui-handler";
import type { PresetAvatar } from "../avatar";
import * as assets from "../assets";
import { BaseElement } from "./base-element";
import { AvatarDialog } from "./avatar-dialog";
import { findLastIndex } from "../util";

/**
 * toggle or slider
 */
export const ButtonType = Object.freeze({
  /**
   * Toggle
   */
  TOGGLE: "toggle",
  /**
   * Slider
   */
  SLIDER: "slider",
});
/**
 * Default ButtonType value
 */
export const BUTTON_TYPE_DEFAULT = ButtonType.SLIDER;
/**
 * typeof ButtonType
 */
export type ButtonTypeT = (typeof ButtonType)[keyof typeof ButtonType];

/**
 * Type check for ButtonType from string
 */
export const isValidButtonType = (s: string): s is ButtonTypeT => {
  return Object.values(ButtonType).includes(s as ButtonTypeT);
};

// For crossorigin's source, there is no way to adjust volume in iOS Safari. (GainNode is not available in Mac Safari, but can be changed with Audio.volume)
const PROP_FLAGS = ["bgm-type", "preset-avatar-only"];
const DISABLE_FLAGS = [
  "avatar-disabled",
  "mirror-disabled",
  "mic-disabled",
  "bgm-disabled",
  "voice-disabled",
];

/**
 * HTMLElement of gui-2d.
 *
 * @example
 * ```ts
 * const gui2d = document.querySelector("gui-2d") as Gui2DElement;
 * gui2d.setAttribute("bgm-type", isIOS() ? "toggle" : "slider");
 * gui2d.setGuiHandlers(guiHandlers);
 * guiHandlers.addModifiedListener(() => gui2d.updateStates());
 * ```
 * ```html
 * <body>
 *  <gui-2d />
 * </body>
 * ```
 */
export class Gui2DElement extends BaseElement {
  private _handlers?: GuiHandlers;
  private _presetAvatars?: PresetAvatar[];
  private _volumeControlOpenHandler?: () => void;
  private _updateStates: Array<() => void> = [];
  private _bgmType: ButtonTypeT = BUTTON_TYPE_DEFAULT;
  private _isPresetAvatarOnly = false;

  /**
   * Register Web Components.
   */
  static register(name = "gui-2d") {
    customElements.define(name, Gui2DElement);
  }

  /**
   * HTMLElement.observedAttributes
   * @remarks
   * {@link https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements|Using custom elements}
   */
  static get observedAttributes() {
    return [...DISABLE_FLAGS, ...PROP_FLAGS, ...BaseElement.observedAttributes];
  }

  constructor() {
    super(assets.defaultCSS);
    const texts = this._texts;

    const wrapper = document.createElement("div");
    wrapper.classList.add("gui2d-wrapper");
    wrapper.innerHTML = `
<div class="loading-container">${assets.loadingSvg}</div>
<div class="gui">
  <slot name="before"></slot>
  <button class="avatar-dialog-button" title="${texts.getAttr(
    "Change Avatar",
  )}">${assets.changeAvatarSvg}</button>
  <button class="mirror-off-button" title="${texts.getAttr("Hide Mirror")}">${
    assets.mirrorOffSvg
  }</button>
  <button class="mirror-on-button" title="${texts.getAttr("Show Mirror")}">${
    assets.mirrorOnSvg
  }</button>
  <button class="mic-off-button" title="${texts.getAttr("Mic Off")}">${
    assets.micOffSvg
  }</button>
  <button class="mic-on-button" title="${texts.getAttr("Mic On")}">${
    assets.micOnSvg
  }</button>
  <div class="wrap-voice">
    <button class="voice-close-button" title="${texts.getAttr(
      "Close voice volume control",
    )}">${assets.voiceMuteSvg}${assets.voiceSvg}</button>
    <button class="voice-open-button" title="${texts.getAttr(
      "Open voice volume control",
    )}">${assets.voiceMuteSvg}${assets.voiceSvg}</button>
    <input class="voice-volume-control" type="range" min="0" max="1.0" step="0.1" />
    <div class="voice-state-wrap">
      ${assets.volume0Svg}
      ${assets.volume1Svg}
      ${assets.volume2Svg}
      ${assets.volume3Svg}
    </div>
  </div>
  <div class="wrap-bgm">
    <button class="bgm-close-button" title="${texts.getAttr(
      "Close bgm volume control",
    )}">${assets.bgmMuteSvg}${assets.bgmSvg}</button>
    <button class="bgm-open-button" title="${texts.getAttr(
      "Open bgm volume control",
    )}">${assets.bgmMuteSvg}${assets.bgmSvg}</button>
    <input class="bgm-volume-control" type="range" min="0" max="1.0" step="0.1" />
    <div class="bgm-state-wrap">
      ${assets.volume0Svg}
      ${assets.volume1Svg}
      ${assets.volume2Svg}
      ${assets.volume3Svg}
    </div>
  </div>
  <slot name="after"></slot>
</div>
<avatar-dialog 
  css-src="${this.getAttribute("css-src") || ""}"
  lang="${this.getAttribute("lang") || ""}"/>
    `;
    this._shadow.appendChild(wrapper);
    this._initGui();
    this.showLoading();
  }
  /**
   * HTMLElement.attributeChangedCallback
   * @remarks
   * {@link https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements|Using custom elements}
   */
  attributeChangedCallback(attrName: string, _oldVal: string, newVal: string) {
    if (DISABLE_FLAGS.find((v) => v === attrName)) {
      this._updateDisabled(attrName);
      return;
    }
    if ("bgm-type" === attrName) {
      if (isValidButtonType(newVal)) {
        this._bgmType = newVal;
      } else {
        console.warn(
          `invalid ${attrName}. required: ${Object.values(ButtonType).join(
            " or ",
          )}`,
        );
      }
      return;
    } else if ("preset-avatar-only" == attrName) {
      this._isPresetAvatarOnly = newVal !== null && newVal !== "false";
    }
    super.attributeChangedCallback(attrName, _oldVal, newVal);
  }
  /**
   * Show loading indicator
   */
  showLoading() {
    this._getEl(".loading-container")?.classList?.add("active");
  }
  /**
   * Hide loading indicator
   */
  ready() {
    this._getEl(".loading-container")?.classList?.remove("active");
  }
  /**
   * Set GuiHandlers
   */
  setGuiHandlers(handlers: GuiHandlers) {
    this._handlers = handlers;
    this.updateStates();
  }
  /**
   * Set Preset Avatars
   */
  setPresetAvatars(presetAvatars?: PresetAvatar[]) {
    this._presetAvatars = presetAvatars;
  }
  /**
   * Used to enable audio playback at the timing of the user's click
   */
  setOnVolumeControlOpen(handler: () => void) {
    this._volumeControlOpenHandler = handler;
  }
  /**
   * Reflect the state of GuiHandlers in the UI
   */
  updateStates() {
    this._updateStates.forEach((v) => v());
  }
  private _updateDisabled(attrName: string) {
    const v = this.getAttribute(attrName);
    if (v !== null && v !== "false") {
      this._getEl(".gui")?.classList?.add(attrName);
    } else {
      this._getEl(".gui")?.classList?.remove(attrName);
    }
  }
  private _initGui() {
    DISABLE_FLAGS.forEach((v) => this._updateDisabled(v));
    const guiContainer = this._getEl(".gui");
    const updateMicState = () => {
      if (this._handlers?.isMicOn()) {
        if (!guiContainer?.classList?.contains("mic-on")) {
          guiContainer?.classList?.add("mic-on");
        }
      } else {
        guiContainer?.classList?.remove("mic-on");
      }
    };
    this._updateStates.push(updateMicState);

    const updateMirrorState = () => {
      if (this._handlers?.isMirrorOn()) {
        if (!guiContainer?.classList?.contains("mirror-on")) {
          guiContainer?.classList?.add("mirror-on");
        }
      } else {
        guiContainer?.classList?.remove("mirror-on");
      }
    };
    this._updateStates.push(updateMirrorState);

    const updateVoiceState = () => {
      const input = this._getEl(".voice-volume-control") as HTMLInputElement;
      const stateWrap = this._getEl(".voice-state-wrap") as HTMLElement;
      const v = this._handlers?.getVoiceVolume() || 0;
      if (v === 0) {
        guiContainer?.classList?.add("voice-mute");
      } else {
        guiContainer?.classList?.remove("voice-mute");
      }
      input.value = v.toFixed(1);
      const icons = stateWrap.getElementsByTagName("svg");
      const idx = getCurrentIconIndex(icons?.length, v);
      for (let i = 0; i < icons.length; i++) {
        icons[i].style.display = i === idx ? "block" : "none";
      }
    };
    this._updateStates.push(updateVoiceState);

    const updateBgmState = () => {
      const input = this._getEl(".bgm-volume-control") as HTMLInputElement;
      const stateWrap = this._getEl(".bgm-state-wrap") as HTMLElement;
      const v = this._handlers?.getBgmVolume() || 0;
      if (v === 0) {
        guiContainer?.classList?.add("bgm-mute");
      } else {
        guiContainer?.classList?.remove("bgm-mute");
      }
      input.value = v.toFixed(1);
      const icons = stateWrap.getElementsByTagName("svg");
      const idx = getCurrentIconIndex(icons?.length, v);
      for (let i = 0; i < icons.length; i++) {
        icons[i].style.display = i === idx ? "block" : "none";
      }
    };
    this._updateStates.push(updateBgmState);

    this._on(".mic-off-button", "click", async () => {
      await this._handlers?.micOff();
      updateMicState();
    });
    this._on(".mic-on-button", "click", async () => {
      await this._handlers?.micOn();
      updateMicState();
    });
    this._on(".mirror-off-button", "click", async () => {
      await this._handlers?.mirrorOff();
      updateMirrorState();
    });
    this._on(".mirror-on-button", "click", async () => {
      await this._handlers?.mirrorOn();
      updateMirrorState();
    });
    this._on(".voice-close-button", "click", async () => {
      guiContainer?.classList?.remove("voice-open");
    });
    this._on(".voice-open-button", "click", () => {
      this._volumeControlOpenHandler?.();
      guiContainer?.classList?.add("voice-open");
    });
    this._on(".bgm-close-button", "click", () => {
      guiContainer?.classList?.remove("bgm-open");
    });
    this._on(".bgm-open-button", "click", () => {
      if (this._bgmType === ButtonType.TOGGLE) {
        if (this._handlers?.getBgmVolume?.()) {
          this._handlers?.setBgmVolume?.(0);
        } else {
          this._handlers?.setBgmVolume?.(1);
        }
        updateBgmState();
        return;
      }
      this._volumeControlOpenHandler?.();
      guiContainer?.classList?.add("bgm-open");
    });
    this._on(".bgm-volume-control", "input", (e: InputEvent) => {
      this._handlers?.setBgmVolume?.(
        Math.max(
          Math.min(parseFloat((e.target as HTMLInputElement).value) || 0, 1),
          0,
        ),
      );
      updateBgmState();
    });
    this._on(".voice-volume-control", "input", (e: InputEvent) => {
      this._handlers?.setVoiceVolume?.(
        Math.max(
          Math.min(parseFloat((e.target as HTMLInputElement).value) || 0, 1),
          0,
        ),
      );
      updateVoiceState();
    });
    this._on(".avatar-dialog-button", "click", () => {
      const avatarDialog = this._getEl("avatar-dialog") as AvatarDialog;
      avatarDialog.showModal(
        this._handlers,
        this._presetAvatars,
        this._isPresetAvatarOnly,
      );
    });
  }
}

function getCurrentIconIndex(numValues: number, value: number): number {
  if (value === 0) {
    return 0;
  }
  if (value === 1) {
    return numValues - 1;
  }
  const values = [];
  const step = 1 / (numValues - 2);
  for (let i = 0; i < numValues - 1; i++) {
    values.push(i * step);
  }
  return (
    Math.max(
      findLastIndex(values, (v: number) => value >= v),
      0,
    ) + 1
  );
}
