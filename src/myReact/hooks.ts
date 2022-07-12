import globals from './globals'
import type { SetStateAction, StateHook } from './types'

function useState<T>(initial: T) {
  const oldHook =
    globals.wipFiber?.alternate &&
    globals.wipFiber.alternate.hooks &&
    (globals.wipFiber.alternate.hooks[
      globals.hookIndex as number
    ] as StateHook<T>)
  const hook: StateHook<T> = {
    state: oldHook?.state ?? initial,
    queue: [],
  }

  const actions = oldHook?.queue ?? []
  actions.forEach((action) => {
    hook.state = action(hook.state)
  })

  const setState = (action: SetStateAction<T>) => {
    hook.queue.push(action)
    globals.wipRoot = {
      dom: globals.currentRoot?.dom,
      props: globals.currentRoot?.props,
      alternate: globals.currentRoot,
    }
    globals.nextUnitOfWork = globals.wipRoot
    globals.deletions = []
  }

  globals.wipFiber?.hooks?.push(hook)
  ;(globals.hookIndex as number)++
  return [hook.state, setState] as const
}

export { useState }
