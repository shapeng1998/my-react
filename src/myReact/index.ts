import { render } from './globals'
import { createElement } from './element'
import { workLoop } from './scheduler'
import { useState } from './hooks'

// Start the work loop
requestIdleCallback(workLoop)

const MyReact = {
  createElement,
  render,
  useState,
}

export default MyReact
