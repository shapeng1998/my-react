export type EffectTag = 'UPDATE' | 'PLACEMENT' | 'DELETION'

export type DOMNode = HTMLElement | Text

export interface MyReactElement {
  type: string
  props: Properties
}

export interface Properties {
  [key: string]: any
  children: MyReactElement[]
  textNode?: string
}

export interface SetStateAction<T = unknown> {
  (prevState: T): T
}

export interface StateHook<T = unknown> {
  state: T
  queue: SetStateAction<T>[]
}

export interface FunctionComponent {
  (props?: Properties): MyReactElement
}

export interface Fiber {
  type?: string | FunctionComponent
  props?: Properties
  dom?: DOMNode | null
  parent?: Fiber | null
  child?: Fiber | null
  sibling?: Fiber | null
  alternate?: Fiber | null
  effectTag?: EffectTag
  hooks?: StateHook<any>[]
}
