import globals from './globals';
import { updateDom } from './utils';
import { performUnitOfWork } from './reconciler';
import type { DOMNode, Fiber } from './types';

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;
  while (globals.nextUnitOfWork && !shouldYield) {
    globals.nextUnitOfWork = performUnitOfWork(globals.nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  // End the render/reconcile loop if there's no more work to be done
  if (!globals.nextUnitOfWork && globals.wipRoot) {
    // Commit all the work we've done
    commitRoot();
  }

  // Request another frame
  requestIdleCallback(workLoop);
}

function commitRoot() {
  globals.deletions.forEach(commitWork);
  commitWork(globals.wipRoot?.child);

  // Double Buffering
  globals.currentRoot = globals.wipRoot;
  globals.wipRoot = null;
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
    commitDeletion(fiber.child!, domParent);
  }
}

export { workLoop };
