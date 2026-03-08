import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SwipePage from "./pages/Swipe";
import LikedPage from "./pages/Liked";
import Settings from "./pages/Settings";

function BottomNav() {
  const base = "flex flex-col items-center gap-0.5 text-xs py-2 px-4 transition ";
  const active = "text-brand-400";
  const inactive = "text-slate-500 hover:text-slate-300";

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex justify-around z-30 pb-safe">
      <NavLink to="/" end className={({ isActive }) => base + (isActive ? active : inactive)}>
        <span className="text-xl">🏠</span>
        <span>Home</span>
      </NavLink>
      <NavLink to="/swipe" className={({ isActive }) => base + (isActive ? active : inactive)}>
        <span className="text-xl">🃏</span>
        <span>Swipe</span>
      </NavLink>
      <NavLink to="/liked" className={({ isActive }) => base + (isActive ? active : inactive)}>
        <span className="text-xl">♥</span>
        <span>Liked</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => base + (isActive ? active : inactive)}>
        <span className="text-xl">⚙</span>
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="pb-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/swipe" element={<SwipePage />} />
          <Route path="/liked" element={<LikedPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  );
}
