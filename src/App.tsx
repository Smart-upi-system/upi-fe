import './App.css'
import LoginPage from './pages/authorization/login/Login'
import RegisterPage from './pages/authorization/register/SignUp'
import UserProfilePage from './pages/userprofile/ProfilePage'
import { BrowserRouter, Route, Routes } from 'react-router'

function App() {

  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path="/userProfile" element={<UserProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

    </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
