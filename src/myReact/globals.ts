import type { DOMNode, Fiber, MyReactElement } from './types';

interface Globals {
  nextUnitOfWork: Fiber | null;
  currentRoot: Fiber | null;
  wipRoot: Fiber | null;
  deletions: Fiber[];

  wipFiber: Fiber | null;
  hookIndex: number | null;
}

const globals: Globals = {
  nextUnitOfWork: null,
  currentRoot: null,
  wipRoot: null,
  deletions: [],

  wipFiber: null,
  hookIndex: null,
};

function render(element: MyReactElement, container: DOMNode) {
  globals.wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: globals.currentRoot,
  };
  globals.deletions = [];
  globals.nextUnitOfWork = globals.wipRoot;
}

export { render };

export default globals;
