import './App.css'
import UserProfilePage from './pages/userprofile/ProfilePage'
import { BrowserRouter, Route, Routes } from 'react-router'

function App() {

  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path="/userProfile" element={<UserProfilePage />} />

    </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
