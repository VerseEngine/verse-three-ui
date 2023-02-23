import { Texts } from "../text";
import { on } from "./event-util";

/**
 * Base class for Web Components.
 */
export class BaseElement extends HTMLElement {
  protected _shadow: ShadowRoot;
  protected _texts: Texts;
  protected _cssSrc?: string;
  protected _defaultCss?: string;

  /**
   * HTMLElement.observedAttributes
   * @remarks
   * {@link https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements|Using custom elements}
   */
  static get observedAttributes() {
    return ["css-src", "lang"];
  }

  /**
   * @param defaultCss - Inline CSS string
   */
  constructor(defaultCss?: string) {
    super();
    const texts = new Texts(this.getAttribute("lang"));
    this._texts = texts;
    const shadow = this.attachShadow({ mode: "closed" });
    this._shadow = shadow;

    this._defaultCss = defaultCss;
    const cssSrc = this.getAttribute("css-src");
    if (cssSrc) {
      this._setCss(cssSrc);
    } else if (defaultCss) {
      this._setInlineCss(defaultCss);
    }
  }
  /**
   * HTMLElement.attributeChangedCallback
   * @remarks
   * {@link https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements|Using custom elements}
   */
  attributeChangedCallback(attrName: string, _oldVal: string, cssSrc: string) {
    if (attrName !== "css-src") {
      return;
    }
    if (cssSrc) {
      this._setCss(cssSrc);
    } else if (this._defaultCss) {
      this._setInlineCss(this._defaultCss);
    }
  }
  protected _setCss(src: string) {
    if (this._cssSrc === src) {
      return;
    }
    this._resetCss();

    this._cssSrc = src;
    const linkEl = document.createElement("link");
    linkEl.setAttribute("rel", "stylesheet");
    linkEl.setAttribute("href", src);
    this._shadow.appendChild(linkEl);
  }
  protected _setInlineCss(css: string) {
    this._resetCss();

    delete this._cssSrc;
    const styleEl = document.createElement("style");
    styleEl.innerHTML = css;
    this._shadow.appendChild(styleEl);
  }
  protected _resetCss() {
    const oldLinkEl = this._getEl("link");
    oldLinkEl?.parentNode?.removeChild(oldLinkEl);
    const oldStyleEl = this._getEl("style");
    oldStyleEl?.parentNode?.removeChild(oldStyleEl);
  }
  protected _getEl(query: string): HTMLElement | null {
    return this._shadow.querySelector(query) as HTMLElement;
  }
  protected _getElAll(query: string): HTMLElement[] {
    return Array.from(this._shadow.querySelectorAll(query));
  }
  protected _on<E extends Event>(
    query: string | Element,
    event: string,
    f: (e: E) => void | Promise<void>
  ) {
    on(query, event, f, this._shadow);
  }
}
