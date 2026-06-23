import React from 'react';
import {BrowserRouter,Routes, Route,Navigate} from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Results from './pages/Results';
import History from './pages/History';
import Profile from './pages/Profile'
import { ThemeProvider } from './context/ThemeContext';

function PrivateRoute({children}){
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to = "/"/>;
}

function App(){
  return(
    <ThemeProvider>
    <BrowserRouter>
    <Routes>
      <Route path='/' element = {<Login/>}/>
      <Route path='/dashboard' element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
      <Route path='/upload' element={<PrivateRoute><Upload/></PrivateRoute>}/>
      <Route path='/results' element={<PrivateRoute><Results/></PrivateRoute>}/>
      <Route path='/history' element={<PrivateRoute><History/></PrivateRoute>}/>
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      
    </Routes>
    
    </BrowserRouter>
    </ThemeProvider>
  )
}

export default App;
