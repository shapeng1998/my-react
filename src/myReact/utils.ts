import type { DOMNode, Properties } from './types'

const isEvent = (key: string) => key.startsWith('on')

const getEventType = (name: string) => name.toLowerCase().substring(2)

const isProperty = (key: string) => key !== 'children' && !isEvent(key)

const isNew = (prev: Properties, next: Properties) => {
  return (key: string) => prev[key] !== next[key]
}

const isGone = (_prev: Properties, next: Properties) => {
  return (key: string) => !(key in next)
}

function updateDom(dom: DOMNode, prevProps: Properties, nextProps: Properties) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      (key) =>
        isNew(prevProps, nextProps)(key) || isGone(prevProps, nextProps)(key)
    )
    .forEach((name) => {
      const eventType = getEventType(name)
      dom.removeEventListener(eventType, prevProps[name])
    })

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      // @ts-expect-error TODO: fix this
      dom[name] = ''
    })

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      // @ts-expect-error TODO: fix this
      dom[name] = nextProps[name]
    })

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = getEventType(name)
      dom.addEventListener(eventType, nextProps[name])
    })
}

export { updateDom }
