import type {
  Fiber,
  MyReactElement,
  FunctionComponent,
  Properties,
  DOMNode,
  StateHook,
  SetStateAction,
} from './types';
import { createTextElement, updateDom } from './utils';

let nextUnitOfWork: Fiber | null = null;
let currentRoot: Fiber | null = null;
let wipRoot: Fiber | null = null;
let deletions: Fiber[] = [];

let wipFiber: Fiber | null = null;
let hookIndex: number | null = null;

function createElement(
  type: string,
  props: Properties,
  ...children: (string | MyReactElement)[]
): MyReactElement {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === 'object' ? child : createTextElement(child)
      ),
    },
  };
}

function createDom(fiber: Fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type as string);

  updateDom(dom, {} as Properties, fiber.props!);
  return dom;
}

function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot?.child);

  // Double Buffering
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber?: Fiber | null) {
  if (!fiber) {
    return;
  }

  // Find the parent of a DOM node (in function component)
  let domParentFiber = fiber.parent;
  while (!domParentFiber?.dom) {
    domParentFiber = domParentFiber?.parent;
  }
  const domParent = domParentFiber?.dom;

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
    domParent?.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(fiber.dom, fiber.alternate!.props!, fiber.props!);
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber: Fiber, domParent: DOMNode) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child as Fiber, domParent);
  }
}

function render(element: MyReactElement, container: DOMNode) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  // End the render/reconcile loop if there's no more work to be done
  if (!nextUnitOfWork && wipRoot) {
    // Commit all the work we've done
    commitRoot();
  }

  // Request another frame
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber: Fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber: Fiber | null | undefined = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }

  return null;
}

function updateFunctionComponent(fiber: Fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [(fiber.type as FunctionComponent)(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  const elements = fiber.props?.children.flat();
  reconcileChildren(fiber, elements!);
}

function useState<T>(initial: T) {
  const oldHook =
    wipFiber?.alternate &&
    wipFiber.alternate.hooks &&
    (wipFiber.alternate.hooks[hookIndex as number] as StateHook<T>);
  const hook: StateHook<T> = {
    state: oldHook?.state ?? initial,
    queue: [],
  };

  const actions = oldHook?.queue ?? [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action: SetStateAction<T>) => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot?.dom,
      props: currentRoot?.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber?.hooks?.push(hook);
  (hookIndex as number)++;
  return [hook.state, setState] as const;
}

function reconcileChildren(wipFiber: Fiber, elements: MyReactElement[]) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling: Fiber | null = null;

  while (index < elements.length || oldFiber) {
    const element = elements[index];
    let newFiber: Fiber | null = null;

    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) {
      newFiber = {
        type: oldFiber!.type,
        props: element.props,
        dom: oldFiber!.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT',
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      (prevSibling as Fiber).sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

const MyReact = {
  render,
  createElement,
  useState,
};

export default MyReact;
