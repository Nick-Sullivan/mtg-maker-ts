import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { BurgerMenu } from "./components/BurgerMenu/BurgerMenu";
import { ProxyMaker } from "./pages/ProxyMaker/ProxyMaker";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/mtg-maker-ts">
      <BurgerMenu />
      <Routes>
        <Route path="/" element={<ProxyMaker />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
