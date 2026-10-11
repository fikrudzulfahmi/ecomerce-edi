import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { ChatWidget } from '../chat/ChatWidget'
import { useAuthStore } from '../../store/auth'

export function Layout() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {user && <ChatWidget />}
    </div>
  )
}
