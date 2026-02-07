import { GitCompare, Printer } from "lucide-react";
import { useState } from "react";
import "./BurgerMenu.css";

export function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Detect current page from window.location
  const currentPath = window.location.pathname;
  const isProxyMaker =
    currentPath.includes("proxy-maker") ||
    currentPath === "/mtg-maker-ts/" ||
    currentPath === "/mtg-maker-ts";
  const isCompareDecks = currentPath.includes("compare-decks");

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        className={`burger-button ${isOpen ? "open" : ""}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div
        className={`burger-overlay ${isOpen ? "open" : ""}`}
        onClick={closeMenu}
      ></div>

      <nav className={`burger-menu ${isOpen ? "open" : ""}`}>
        <div className="burger-menu-header">
          <h2>Magic The Gathering Tools</h2>
        </div>
        <ul className="burger-menu-links">
          <li>
            <a
              href="/mtg-maker-ts/proxy-maker.html"
              className={isProxyMaker ? "active" : ""}
            >
              <Printer className="menu-icon" size={20} />
              Proxy Maker
            </a>
          </li>
          <li>
            <a
              href="/mtg-maker-ts/compare-decks.html"
              className={isCompareDecks ? "active" : ""}
            >
              <GitCompare className="menu-icon" size={20} />
              Compare Decks
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
}
