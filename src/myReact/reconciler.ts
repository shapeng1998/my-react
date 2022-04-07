import globals from './globals'
import { updateDom } from './utils'
import type {
  Fiber,
  FunctionComponent,
  MyReactElement,
  Properties,
} from './types'

function performUnitOfWork(fiber: Fiber) {
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent)
    updateFunctionComponent(fiber)
  else
    updateHostComponent(fiber)

  // Find the next fiber and return
  if (fiber.child)
    return fiber.child

  let nextFiber: Fiber | null | undefined = fiber
  while (nextFiber) {
    if (nextFiber.sibling)
      return nextFiber.sibling

    nextFiber = nextFiber.parent
  }

  return null
}

function updateFunctionComponent(fiber: Fiber) {
  globals.wipFiber = fiber
  globals.hookIndex = 0
  globals.wipFiber.hooks = []
  const children = [(fiber.type as FunctionComponent)(fiber.props)]
  reconcileChildren(fiber, children)
}

function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom)
    fiber.dom = createDom(fiber)

  const elements = fiber.props?.children.flat()
  reconcileChildren(fiber, elements!)
}

function reconcileChildren(wipFiber: Fiber, elements: MyReactElement[]) {
  let index = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  let prevSibling: Fiber | null = null

  while (index < elements.length || oldFiber) {
    const element = elements[index]
    let newFiber: Fiber | null = null

    const sameType = oldFiber && element && element.type === oldFiber.type

    if (sameType) {
      newFiber = {
        type: oldFiber!.type,
        props: element.props,
        dom: oldFiber!.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      }
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT',
      }
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = 'DELETION'
      globals.deletions.push(oldFiber)
    }

    if (oldFiber)
      oldFiber = oldFiber.sibling

    if (index === 0)
      wipFiber.child = newFiber
    else if (element)
      prevSibling!.sibling = newFiber

    prevSibling = newFiber
    index++
  }
}

function createDom(fiber: Fiber) {
  const dom
    = fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type as string)

  updateDom(dom, {} as Properties, fiber.props!)
  return dom
}

export { performUnitOfWork }
