import './App.css'
import LoginPage from './pages/authorization/login/Login'
import RegisterPage from './pages/authorization/register/SignUp'
import UserProfilePage from './pages/userprofile/ProfilePage'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Wallet } from './wallet/Wallet'

function App() {

  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path="/userProfile" element={<UserProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/modal" element={<Wallet open={true} onClose={() => {}} />} />

    </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
