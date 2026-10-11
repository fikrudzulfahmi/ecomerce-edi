import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AdminGuard } from './routes/AdminGuard'
import { AdminLayout } from './components/admin/AdminLayout'
import { Home } from './pages/Home'
import { ProductList } from './pages/ProductList'
import { ProductDetail } from './pages/ProductDetail'
import { Cart } from './pages/Cart'
import { Checkout } from './pages/Checkout'
import { Payment } from './pages/Payment'
import { Addresses } from './pages/Addresses'
import { Orders } from './pages/Orders'
import { OrderDetail } from './pages/OrderDetail'
import { Library } from './pages/Library'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { VerifyEmail } from './pages/VerifyEmail'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Dashboard } from './pages/admin/Dashboard'
import { AdminProducts } from './pages/admin/AdminProducts'
import { AdminOrders } from './pages/admin/AdminOrders'
import { AdminOrderDetail } from './pages/admin/AdminOrderDetail'
import { AdminVouchers } from './pages/admin/AdminVouchers'
import { AdminSettings } from './pages/admin/AdminSettings'
import { AdminBanners } from './pages/admin/AdminBanners'
import { AdminChat } from './pages/admin/AdminChat'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Storefront (navbar) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment/:code" element={<Payment />} />
            <Route path="/addresses" element={<Addresses />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:code" element={<OrderDetail />} />
            <Route path="/library" element={<Library />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Panel admin (sidebar sendiri) */}
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:code" element={<AdminOrderDetail />} />
            <Route path="vouchers" element={<AdminVouchers />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="chat" element={<AdminChat />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
