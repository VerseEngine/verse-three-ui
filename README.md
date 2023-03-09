# verse-three-ui
VerseEngine's GUI. 

## Example
```bash
npm run example
```

## Usage
```typescript
import { register as registerUI } from "verse-three-ui";
import {
  register as registerUI,
  Gui2DElement,
  Gui3D,
  Gui3DVisibleSwitcher,
} from "verse-three-ui";

registerUI();

function setup() {
  const gui2d = document.querySelector("gui-2d") as Gui2DElement;
  gui2d.setAttribute("bgm-type", isIOS() ? "toggle" : "slider");
  gui2d.setGuiHandlers(guiHandlers);
  guiHandlers.addModifiedListener(() => gui2d.updateStates());
  
  const gui3d = new Gui3D({
    isMirrorDisabled: false,
    isMicDisabled: false,
    isBgmDisabled: false,
    isVoiceDisabled: false,
  });
  container.add(gui3d.object3D);
  gui3d.setGuiHandlers(guiHandlers);
  guiHandlers.addModifiedListener(() => gui3d.updateStates());
  clickableObjects.push(...gui3d.clickableObjects);
  gui3DSwitcher = new Gui3DVisibleSwitcher(renderer.xr, gui3d.object3D, camera);


  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
   ...
 
    const dt = clock.getDelta();
    gui3DSwitcher?.tick(dt);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setup);
} else {
  setup();
}
```
```html
<body>
  <gui-2d />
</body>
```


# Reference

## API Reference
[Link](docs/verse-three-ui.md)


## gui-2d
Configuration UI for non-VR.

### gui-2d Parameters
| parameter | type    | description                                      |
| --------- | ------- | ------------------------------------------------ |
| `avatar-disabled` | boolean | Hide Avatar button |
| `preset-avatar-only` | boolean | Only avatars in a preset list can be selected. |
| `bgm-type` | `toggle` or `slider` | For crossorigin's source, there is no way to adjust volume in iOS Safari. (GainNode is not available in Mac Safari, but can be changed with Audio.volume) |
| `bgm-disabled` | boolean | Hide BGM button |
| `mic-disabled` | boolean | Hide Mic button |
| `voice-disabled` | boolean | Hide Voice button |
| `mirror-disabled` | boolean | Hide Mirror button |
| `lang` | 'en'(default) or 'ja' or 'zh' | Language |
| `css-src` | string | path to Custom CSS |

