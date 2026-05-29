import { useState, useEffect } from 'react';

import "./App.css";

import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from './FireBase/config';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

//Pages
import Home from './Pages/Home/Home';

//Componentes


function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
