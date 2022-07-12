import App from './App'
import MyReact from './myReact'

MyReact.render(
  <App initialCount={0} initialLen={10} />,
  document.getElementById('app') as HTMLElement
)
