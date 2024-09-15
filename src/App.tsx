import { HashRouter as Router, Route, Routes} from 'react-router-dom';
import { Game } from '@/components/gamecomponent';

function App() {
  return (
    <Router>
      
        <Routes>
          
          <Route path="/" element={<Game />} />
         
        </Routes>
      
    </Router>
  );
}

export default App;
