import React from "react";
import ReactDOM from "react-dom/client";
import { BurgerMenu } from "./components/BurgerMenu/BurgerMenu";
import "./global.css";
import { DeckShowcase } from "./pages/DeckShowcase/DeckShowcase";

// Inspired by https://deck-passport.vercel.app/deck/new
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BurgerMenu />
    <DeckShowcase />
  </React.StrictMode>,
);
