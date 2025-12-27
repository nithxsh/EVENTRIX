import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import EventDashboard from './pages/EventDashboard';
import VerificationPage from './pages/VerificationPage';
import LiveDisplay from './pages/LiveDisplay';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard/:id" element={<EventDashboard />} />
        <Route path="/verify/:hash" element={<VerificationPage />} />
        <Route path="/live/:id" element={<LiveDisplay />} />
      </Routes>
    </Router>
  );
}

export default App;
