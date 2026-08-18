import "@/App.css";
import React from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import { StoreProvider } from "@/context/StoreContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Home from "@/pages/Home";
import Collection from "@/pages/Collection";
import ProductDetail from "@/pages/ProductDetail";
import CartPage from "@/pages/CartPage";
import Wishlist from "@/pages/Wishlist";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import TrackOrder from "@/pages/TrackOrder";
import Auth from "@/pages/Auth";
import Account from "@/pages/Account";
import Admin from "@/pages/Admin";
import StaticPage from "@/pages/StaticPage";

const Page = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
    {children}
  </motion.div>
);

function Shell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  return (
    <>
      {!isAdmin && <Header />}
      {!isAdmin && <CartDrawer />}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Page><Home /></Page>} />
            <Route path="/collections/:slug" element={<Page><Collection /></Page>} />
            <Route path="/new-arrivals" element={<Page><Collection mode="new" /></Page>} />
            <Route path="/flash-sale" element={<Page><Collection mode="flash" /></Page>} />
            <Route path="/search" element={<Page><Collection mode="search" /></Page>} />
            <Route path="/products/:slug" element={<Page><ProductDetail /></Page>} />
            <Route path="/cart" element={<Page><CartPage /></Page>} />
            <Route path="/wishlist" element={<Page><Wishlist /></Page>} />
            <Route path="/checkout" element={<Page><Checkout /></Page>} />
            <Route path="/order-confirmation/:orderNumber" element={<Page><OrderConfirmation /></Page>} />
            <Route path="/track-order" element={<Page><TrackOrder /></Page>} />
            <Route path="/login" element={<Page><Auth mode="login" /></Page>} />
            <Route path="/register" element={<Page><Auth mode="register" /></Page>} />
            <Route path="/account" element={<Page><Account /></Page>} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/login" element={<Page><Auth mode="login" /></Page>} />
            {["about-us", "contact-us", "faqs", "privacy-policy", "terms-conditions", "shipping-returns"].map((s) => (
              <Route key={s} path={`/${s}`} element={<Page><StaticPage slug={s} /></Page>} />
            ))}
          </Routes>
        </AnimatePresence>
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <StoreProvider>
          <Toaster position="top-center" theme="dark" richColors />
          <Shell />
        </StoreProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
