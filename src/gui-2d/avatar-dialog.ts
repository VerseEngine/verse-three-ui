import type { GuiHandlers } from "../gui-handler";
import * as assets from "../assets";
import { BaseElement } from "./base-element";

const RPM_SUB_DOMAIN = "multiverse";

export class AvatarDialog extends BaseElement {
  _handlers?: GuiHandlers;
  _rpmFrame?: HTMLIFrameElement;
  _vrmUrlInput: HTMLInputElement;
  _vrmFileInput: HTMLInputElement;
  _vrmOkButton: HTMLButtonElement;
  _pageStack: string[] = [];
  _saveMessageEl: HTMLElement;
  _saveSubMessageEl: HTMLElement;

  static register(name = "avatar-dialog") {
    customElements.define(name, AvatarDialog);
  }

  static get observedAttributes() {
    return BaseElement.observedAttributes;
  }

  constructor() {
    super(assets.defaultAvatarDialogCSS);

    const texts = this._texts;
    const wrapper = document.createElement("div");
    wrapper.classList.add("gui2d-wrapper");
    wrapper.innerHTML = `
<dialog id="avatar-dialog" aria-labelledby="avatar-dialog-title">
  <button class="button icon-button avatar-dialog-close-button" type="button">${
    assets.cancelSvg
  }</button>
  <button class="button icon-button avatar-dialog-back-button" type="button">${
    assets.backSvg
  }</button>
  <h3 id="avatar-dialog-title">${texts.get("Change Avatar")}</h3>
  <div class="avatar-dialog-page avatar-dialog-page-type">
    <div class="avatar-type-button-list">
      <div>
          <button class="button avatar-type-button avatar-type-button-rpm" type="button">Ready Player Me</button>
          <p class="avatar-type-hint">*${texts.get("RPMhint")}</p>
      </div>
      <div>
          <button class="button avatar-type-button avatar-type-button-vrm" type="button">VRM (VRoid)</button>
          <p class="avatar-type-hint">*${texts.get("VRMhint")}</p>
      </div>
        
    </div>
  </div>
  <div class="avatar-dialog-page avatar-dialog-page-rpm"></div>
  <div class="avatar-dialog-page avatar-dialog-page-vrm">
    <form class="avatar-vrm-form">
      <input class="avatar-url-input" type="url" placeholder="VRM URL...">
      <div>or</div>
      <label class="file-input-label"><span class="file-input-display"></span>
        <input class="avatar-file-input" type="file" accept=".vrm,model/gltf-binary" />
        <span class="button file-input-button">${texts.get(
          "Choose File"
        )}</span>
      </label>
      <div>
          <button class="button avatar-form-button" type="submit">OK</button>
      </div>
    </form>
  </div>
  <div class="avatar-dialog-page avatar-dialog-page-save">
    <div class="save-pane">
      <div class="loading-wrap">
        ${assets.loadingBlackSvg}
      </div>
      <div class="failed-wrap">
        ${assets.errorSvg}
      </div>
      <div>
        <div class="save-message"></div>
        <div class="save-sub-message"></div>
      </div>
    </div>
  </div>
</dialog>
    `;
    this._shadow.appendChild(wrapper);

    this._vrmUrlInput = this._getEl(".avatar-url-input") as HTMLInputElement;
    this._vrmFileInput = this._getEl(".avatar-file-input") as HTMLInputElement;
    this._vrmOkButton = this._getEl(".avatar-form-button") as HTMLButtonElement;
    this._saveMessageEl = this._getEl(".save-message") as HTMLElement;
    this._saveSubMessageEl = this._getEl(".save-sub-message") as HTMLElement;

    this._on(".avatar-dialog-close-button", "click", (_e: Event) => {
      this._close();
    });
    this._on(".avatar-dialog-back-button", "click", (_e: Event) => {
      this._back();
    });
    this._on(".avatar-type-button-rpm", "click", (_e: Event) => {
      this._showRpm();
    });
    this._on(".avatar-type-button-vrm", "click", (_e: Event) => {
      this._showVrm();
    });

    this._on(this._vrmUrlInput, "input", (_e: InputEvent) => {
      if (!this._isVrmUrlInputEmpty) {
        this._vrmFileInput.value = "";
      }
      this._updateVrmForm();
    });
    this._on(this._vrmFileInput, "change", (_e: InputEvent) => {
      if (!this._isVrmFileInputEmpty) {
        this._vrmUrlInput.value = "";
      }
      this._updateVrmForm();
    });
    this._reset();

    this._setupRpm();

    this._on(".avatar-vrm-form", "submit", async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      const file = this._vrmFileInputValue;
      if (file) {
        let data: ArrayBuffer;
        try {
          data = await file.arrayBuffer();
        } catch (ex) {
          console.error(ex);
          return;
        }
        this._setAvatarData(data);
        return;
      }
      const url = this._vrmUrlInputValue;
      if (url) {
        this._setAvatarURL(url);
        return;
      }
    });
  }
  showModal(handlers?: GuiHandlers) {
    this._handlers = handlers;
    this._showPage("avatar-dialog-page-type");
    this._dialogEl.showModal();
  }
  get _dialogEl(): HTMLDialogElement {
    return this._getEl("#avatar-dialog") as HTMLDialogElement;
  }
  _hideAllPage() {
    for (const el of this._getElAll(".avatar-dialog-page")) {
      el.classList.remove("active");
    }
  }
  _showPage(name: string) {
    this._pageStack.push(name);
    this._hideAllPage();
    this._getEl(`.${name}`)?.classList?.add("active");
    this._getEl(".avatar-dialog-back-button")?.removeAttribute("disabled");
    if (name === "avatar-dialog-page-type") {
      this._getEl(".avatar-dialog-back-button")?.classList.add("hide");
      this._getEl(".avatar-dialog-close-button")?.classList.remove("hide");
    } else {
      this._getEl(".avatar-dialog-back-button")?.classList.remove("hide");
      this._getEl(".avatar-dialog-close-button")?.classList.add("hide");
    }
  }
  _showRpm() {
    if (this._rpmFrame) {
      this._rpmFrame.parentNode?.removeChild(this._rpmFrame);
    }
    const url = `https://${RPM_SUB_DOMAIN}.readyplayer.me/avatar?frameApi&bodyType=fullbody`;
    const frame = document.createElement("iframe") as HTMLIFrameElement;
    this._rpmFrame = frame;
    frame.setAttribute("class", "rpm-frame");
    frame.setAttribute("src", url);
    frame.setAttribute("allow", "camera *; microphone *; clipboard-write");
    this._getEl(".avatar-dialog-page-rpm")?.appendChild(frame);

    this._showPage("avatar-dialog-page-rpm");
  }
  _showVrm() {
    this._showPage("avatar-dialog-page-vrm");
  }
  _showSave() {
    this._getEl(".loading-wrap")?.classList.remove("hide");
    this._getEl(".failed-wrap")?.classList.add("hide");
    this._getEl(".avatar-dialog-back-button")?.setAttribute(
      "disabled",
      "disabled"
    );
    this._showPage("avatar-dialog-page-save");
  }
  _close() {
    this._reset();
    this._dialogEl.close();
  }
  _back() {
    this._pageStack.pop();
    const name = this._pageStack.pop();
    if (!name) {
      return;
    }
    if (name === "avatar-dialog-page-type") {
      this._reset();
    }
    this._showPage(name);
  }
  _reset() {
    const frame = this._rpmFrame;
    setTimeout(() => {
      if (frame && frame === this._rpmFrame) {
        this._rpmFrame.parentNode?.removeChild(this._rpmFrame);
        delete this._rpmFrame;
      }
    }, 1000);
    this._vrmUrlInput.value = "";
    this._vrmFileInput.value = "";
    this._updateVrmForm();
  }
  _updateVrmForm() {
    if (this._validVrmForm) {
      this._vrmOkButton.removeAttribute("disabled");
    } else {
      this._vrmOkButton.setAttribute("disabled", "disabled");
    }
    const display = this._vrmFileInput.parentElement?.querySelector(
      ".file-input-display"
    ) as HTMLElement;
    if (display) {
      const file = this._vrmFileInputValue;
      if (file) {
        display.innerText = file.name;
        display.classList.remove("placeholder");
      } else {
        display.innerText = "VRM File...";
        display.classList.add("placeholder");
      }
    }
    if (!this._isVrmFileInputEmpty) {
      this._vrmFileInput.parentElement?.classList.add("active");
      this._vrmUrlInput.classList.remove("active");
    } else if (!this._isVrmUrlInputEmpty) {
      this._vrmUrlInput.classList.add("active");
      this._vrmFileInput.parentElement?.classList.remove("active");
    } else {
      this._vrmUrlInput.classList.remove("active");
      this._vrmFileInput.parentElement?.classList.remove("active");
    }
  }
  get _vrmFileInputValue(): File | undefined {
    if (this._vrmFileInput.files && this._vrmFileInput.files.length > 0) {
      return this._vrmFileInput.files[0];
    }
  }
  get _vrmUrlInputValue(): string {
    return this._vrmUrlInput.value.trim();
  }
  get _isVrmFileInputEmpty() {
    return !(this._vrmFileInput.files && this._vrmFileInput.files.length > 0);
  }
  get _isVrmUrlInputEmpty() {
    return this._vrmUrlInputValue.length === 0;
  }
  get _validVrmForm() {
    if (!this._isVrmFileInputEmpty) {
      return true;
    }
    if (!this._isVrmUrlInputEmpty) {
      return true;
    }
    return false;
  }
  _setupRpm() {
    const subscribe = this._rpmSubscribe.bind(this);
    window.addEventListener("message", subscribe);
    document.addEventListener("message", subscribe);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _rpmSubscribe(event: any) {
    const json = parseJson(event.data);

    if (json?.source !== "readyplayerme") {
      return;
    }
    // Susbribe to all events sent from Ready Player Me once frame is ready
    if (json.eventName === "v1.frame.ready") {
      this._rpmFrame?.contentWindow?.postMessage(
        JSON.stringify({
          target: "readyplayerme",
          type: "subscribe",
          eventName: "v1.**",
        }),
        "*"
      );
    }

    // Get avatar GLB URL
    if (json.eventName === "v1.avatar.exported") {
      this._setAvatarURL(json.data.url);
    }
  }
  async _setAvatarData(data: ArrayBuffer) {
    this._showSave();
    this._saveMessageEl.innerText = this._texts.get("Setting...");
    this._saveSubMessageEl.innerText = "";
    try {
      await this._handlers?.setAvatarData(data);
    } catch (ex) {
      console.error(ex);
      this._setSaveError(
        this._texts.get("AvatarSetError"),
        (ex as Error).message
      );
      return;
    }
    this._close();
  }
  async _setAvatarURL(url: string) {
    this._showSave();
    this._saveMessageEl.innerText = this._texts.get("Downloading...");

    const data = await this._download(url);
    if (!data) {
      this._setSaveError(this._texts.get("AvatarDownloadError"));
      return;
    }
    this._saveMessageEl.innerText = this._texts.get("Setting...");
    this._saveSubMessageEl.innerText = "";
    try {
      await this._handlers?.setAvatarURL(url, data);
    } catch (ex) {
      console.error(ex);
      this._setSaveError(
        this._texts.get("AvatarSetError"),
        (ex as Error).message
      );
      return;
    }
    this._close();
  }
  _setSaveError(msg: string, subMsg?: string) {
    this._getEl(".loading-wrap")?.classList.add("hide");
    this._getEl(".failed-wrap")?.classList.remove("hide");
    this._saveMessageEl.innerText = msg;
    this._saveSubMessageEl.innerText = subMsg || "";
    this._getEl(".avatar-dialog-back-button")?.removeAttribute("disabled");
  }
  async _download(url: string): Promise<ArrayBuffer | undefined> {
    this._saveSubMessageEl.innerText = "";
    try {
      const resp = await fetch(url);
      const contentLength = parseInt(resp.headers.get("Content-Length") || "");
      const reader = resp.body?.getReader();
      if (!reader) {
        return;
      }
      let ln = 0;
      const data = new Uint8Array(contentLength || 1024 * 1024 * 16);

      for (;;) {
        this._saveSubMessageEl.innerText = `${ln.toLocaleString()}/${contentLength.toLocaleString()}`;
        const { done, value } = await reader.read();
        if (value) {
          data.set(value, ln);
          ln += value.length;
        }
        if (done) {
          break;
        }
      }
      this._saveSubMessageEl.innerText = `${ln.toLocaleString()}/${contentLength.toLocaleString()}`;
      return data.buffer;
    } catch (ex) {
      console.error(ex);
    }
  }
}
function parseJson(data: string) {
  try {
    return JSON.parse(data);
  } catch (_ex) {
    return null;
  }
}
