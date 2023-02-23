/**
 * @internal
 */
export function on<E extends Event>(
  target: string | Element,
  event: string,
  f: (e: E) => void | Promise<void>,
  root?: ParentNode
) {
  if (typeof target === "string") {
    for (const el of Array.from((root || document).querySelectorAll(target))) {
      el.addEventListener(event, f as (e: Event) => void | Promise<void>);
    }
  } else {
    target.addEventListener(event, f as (e: Event) => void | Promise<void>);
  }
}
