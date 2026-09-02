import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import Layout from './components/Layout';
import './App.css';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Catalog = lazy(() => import('./pages/Catalog'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminInventory = lazy(() => import('./pages/AdminInventory'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminCoupons = lazy(() => import('./pages/AdminCoupons'));
const Chat = lazy(() => import('./pages/Chat'));
const Reports = lazy(() => import('./pages/Reports'));
const StoreLocations = lazy(() => import('./pages/StoreLocations'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Wishlist = lazy(() => import('./pages/Wishlist'));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    return unsub;
  }, []);

  if (loading) return <div style={{textAlign:'center',paddingTop:100,fontSize:40}}>{'\u23F3'}</div>;

  const pageLoader = (
    <div style={{textAlign:'center',paddingTop:80,fontSize:24}}>{'\u23F3'} Cargando...</div>
  );

  return (
    <BrowserRouter>
      <Suspense fallback={pageLoader}>
        <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<AdminInventory />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/coupons" element={<AdminCoupons />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/stores" element={<StoreLocations />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        )}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;