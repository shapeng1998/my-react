import MyReact from './myReact';

const { useState } = MyReact;

interface AppProps {
  initialCount: number;
  initialLen: number;
}

function App({ initialCount, initialLen }: AppProps) {
  const [state, setState] = useState(initialCount);
  const [len, setLen] = useState(initialLen);
  return (
    <div>
      <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>
      <ul onClick={() => setLen((c) => c + 1)}>
        {Array.from({ length: len }, (_, i) => (
          <li>{i}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
