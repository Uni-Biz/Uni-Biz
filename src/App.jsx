import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LoginSignup from './components/login-signup/login-signup'
import Profile from './components/user-profile/profile'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useNavigate, Link} from 'react-router-dom';
// import Dashboard from './dashboard';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
            <Routes>
                <Route path="/login" element={<LoginSignup />} />
                <Route path="/create-profile" element={<Profile />} />
                {/* <Route path="/dashboard" element={<Dashboard />} /> */}
                <Route path="*" element={<Link to="/login" />} />
            </Routes>
    </Router>
  )
}

export default App
