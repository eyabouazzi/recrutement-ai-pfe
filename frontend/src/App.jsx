import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { useContext } from 'react';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Signup from './pages/Signup.jsx';

import { ConfigProvider } from 'antd';
import { AuthProvider, AuthContext } from './contexts/authContext.jsx'


function App() {
  const { token } = useContext(AuthContext);
  return (//pour detercter browser brave, edge...
<ConfigProvider
theme={{
  "token": {
    "colorPrimary": "#13c2c2",
    "colorInfo": "#13c2c2"
  }
}}
>
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        {token && <Route path ='/' element={<Home />} />}
        {!token && <Route path='*' element={<Login />} />}
       </Routes>
    </BrowserRouter>
    </AuthProvider>
    </ConfigProvider>
   
  )
}

export default App;