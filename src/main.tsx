import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { BurgerMenu } from "./components/BurgerMenu/BurgerMenu";
import "./global.css";
import { CompareDecks } from "./pages/CompareDecks/CompareDecks";
import { DeckShowcase } from "./pages/DeckShowcase/DeckShowcase";
import { ProxyMaker } from "./pages/ProxyMaker/ProxyMaker";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <BurgerMenu />
      <Routes>
        <Route path="/proxy-maker" element={<ProxyMaker />} />
        <Route path="/compare-decks" element={<CompareDecks />} />
        <Route path="/deck-showcase" element={<DeckShowcase />} />
        <Route path="*" element={<Navigate to="/proxy-maker" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
