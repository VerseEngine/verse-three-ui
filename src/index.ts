export type { GuiHandlers } from "./gui-handler";
export {
  Gui2DElement,
  ButtonType,
  ButtonTypeT,
  isValidButtonType,
  BUTTON_TYPE_DEFAULT,
} from "./gui-2d";
export { BaseElement } from "./gui-2d/base-element";
export { Gui3D, Gui3DOptions } from "./gui-3d";
export type { ClickableObject } from "./gui-3d/button";
export { Gui3DVisibleSwitcher } from "./gui-3d/visible-switcher";

import { Gui2DElement } from "./gui-2d";
import { AvatarDialog } from "./gui-2d/avatar-dialog";

/**
 *
 * Register Web Components.
 *
 * @example
 * ```ts
 * import { register as registerUI } from "verse-three-ui";
 * registerUI();
 * ```
 *
 * ```html
 * <body>
 *  <gui-2d />
 * </body>
 * ```
 */
export function register() {
  Gui2DElement.register();
  AvatarDialog.register();
}
