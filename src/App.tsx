import { HashRouter, Route, Routes } from 'react-router-dom';
import { Game } from '@/components/gamecomponent';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Game />} />
      </Routes>
    </HashRouter>
  );
}

export default App;