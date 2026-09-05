import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import './App.css';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const Catalog = lazy(() => import('./pages/Catalog'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminInventory = lazy(() => import('./pages/AdminInventory'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminCoupons = lazy(() => import('./pages/AdminCoupons'));
const Chat = lazy(() => import('./pages/Chat'));
const Reports = lazy(() => import('./pages/Reports'));
const StoreLocations = lazy(() => import('./pages/StoreLocations'));
const StoreSettings = lazy(() => import('./pages/StoreSettings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Wishlist = lazy(() => import('./pages/Wishlist'));

function AdminRoute({ children }) {
  const { currentUser, userRole } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userRole !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { currentUser, loading } = useAuth();

  if (loading) return <div style={{textAlign:'center',paddingTop:100,fontSize:40}}>{'\u23F3'}</div>;

  const pageLoader = (
    <div style={{textAlign:'center',paddingTop:80,fontSize:24}}>{'\u23F3'} Cargando...</div>
  );

  return (
    <Suspense fallback={pageLoader}>
      <Routes>
      {!currentUser ? (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </>
      ) : (
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/panel" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/stores" element={<StoreLocations />} />
          <Route path="/store-settings" element={<AdminRoute><StoreSettings /></AdminRoute>} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      )}
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;