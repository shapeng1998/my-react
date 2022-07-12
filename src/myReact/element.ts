import type { MyReactElement, Properties } from './types'

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
  }
}

function createTextElement(text: string): MyReactElement {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

export { createElement }
