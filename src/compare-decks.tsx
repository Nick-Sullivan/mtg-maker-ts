import React from "react";
import ReactDOM from "react-dom/client";
import { BurgerMenu } from "./components/BurgerMenu/BurgerMenu";
import "./global.css";
import { CompareDecks } from "./pages/CompareDecks/CompareDecks";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BurgerMenu />
    <CompareDecks />
  </React.StrictMode>,
);
