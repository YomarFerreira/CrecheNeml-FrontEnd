
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './components/Login'
import Home from './components/Home';


function App() {
  return (
    <Router>
    <div className="App">
          <Routes>
            <Route path="/*" element={<Login />} />
            <Route path="/home" element={<Home />} />
          </Routes>
    </div>
    </Router>
  );
}

export default App;