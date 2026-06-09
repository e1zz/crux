import { uIOhook, UiohookKey } from "uiohook-napi";

type KeyboardHookCallback = () => void;

let tabPressed = false;
let onScoreboardActive: KeyboardHookCallback | null = null;
let onScoreboardInactive: KeyboardHookCallback | null = null;

export function initGlobalKeyboardHook(
  onActive: KeyboardHookCallback,
  onInactive: KeyboardHookCallback
) {
  onScoreboardActive = onActive;
  onScoreboardInactive = onInactive;

  uIOhook.on("keydown", (e) => {
    if (e.keycode === UiohookKey.Tab && !tabPressed) {
      tabPressed = true;
      console.log("[KeyboardHook] Tab key pressed down");
      if (onScoreboardActive) onScoreboardActive();
    }
  });

  uIOhook.on("keyup", (e) => {
    if (e.keycode === UiohookKey.Tab && tabPressed) {
      tabPressed = false;
      if (onScoreboardInactive) onScoreboardInactive();
    }
  });

  uIOhook.start();
  console.log("uIOhook started globally for Tab key detection");
}

export function stopGlobalKeyboardHook() {
  uIOhook.stop();
  console.log("uIOhook stopped");
}
