const HOLD_MS = 550;
const MOVE_TOLERANCE = 6;
const CLICK_AFTER_RELEASE_MS = 300;

interface Hold {
  pointerId: number;
  target: EventTarget;
  x: number;
  y: number;
  timer: number;
}

export function installTouchContextMenu() {
  let hold: Hold | null = null;
  let swallowPointer: number | null = null;

  const cancel = () => {
    if (hold) {
      window.clearTimeout(hold.timer);
      hold = null;
    }
  };

  const fire = () => {
    if (!hold) {
      return;
    }
    const { pointerId, target, x, y } = hold;
    hold = null;
    if (document.body.dataset.cardDragging) {
      return;
    }
    const menuEvent = new PointerEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: x,
      clientY: y,
      pointerId,
      pointerType: 'touch',
    });
    target.dispatchEvent(menuEvent);
    if (menuEvent.defaultPrevented) {
      window.getSelection()?.removeAllRanges();
      swallowPointer = pointerId;
    }
  };

  const onDown = (event: PointerEvent) => {
    cancel();
    if (event.pointerType !== 'touch' || !event.isPrimary || !event.target) {
      return;
    }
    hold = {
      pointerId: event.pointerId,
      target: event.target,
      x: event.clientX,
      y: event.clientY,
      timer: window.setTimeout(fire, HOLD_MS),
    };
  };

  const onMove = (event: PointerEvent) => {
    if (
      hold?.pointerId === event.pointerId &&
      Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > MOVE_TOLERANCE
    ) {
      cancel();
    }
  };

  const onRelease = (event: PointerEvent) => {
    if (hold?.pointerId === event.pointerId) {
      cancel();
    }
    if (swallowPointer === event.pointerId) {
      window.setTimeout(() => (swallowPointer = null), CLICK_AFTER_RELEASE_MS);
    }
  };

  const onClick = (event: MouseEvent) => {
    if (swallowPointer !== null) {
      swallowPointer = null;
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const onNativeMenu = (event: Event) => {
    if (event.isTrusted) {
      cancel();
    }
  };

  window.addEventListener('pointerdown', onDown, { capture: true });
  window.addEventListener('pointermove', onMove, { capture: true });
  window.addEventListener('pointerup', onRelease, { capture: true });
  window.addEventListener('pointercancel', onRelease, { capture: true });
  window.addEventListener('scroll', cancel, { capture: true, passive: true });
  window.addEventListener('contextmenu', onNativeMenu, { capture: true });
  window.addEventListener('click', onClick, { capture: true });
}
