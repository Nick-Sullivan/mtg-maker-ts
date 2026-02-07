import React from "react";
import ReactDOM from "react-dom/client";
import { BurgerMenu } from "./components/BurgerMenu/BurgerMenu";
import "./global.css";
import { ProxyMaker } from "./pages/ProxyMaker/ProxyMaker";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BurgerMenu />
    <ProxyMaker />
  </React.StrictMode>,
);
