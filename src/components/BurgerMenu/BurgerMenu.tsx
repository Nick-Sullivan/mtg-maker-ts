import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./BurgerMenu.css";

export function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

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
          <h2>MTG Tools</h2>
        </div>
        <ul className="burger-menu-links">
          <li>
            <Link
              to="/"
              className={location.pathname === "/" ? "active" : ""}
              onClick={closeMenu}
            >
              <span className="menu-icon">📄</span>
              Proxy Maker
            </Link>
          </li>
          {/* Add more pages here as you create them */}
          {/* 
          <li>
            <Link 
              to="/deck-builder" 
              className={location.pathname === "/deck-builder" ? "active" : ""}
              onClick={closeMenu}
            >
              <span className="menu-icon">🃏</span>
              Deck Builder
            </Link>
          </li>
          <li>
            <Link 
              to="/card-search" 
              className={location.pathname === "/card-search" ? "active" : ""}
              onClick={closeMenu}
            >
              <span className="menu-icon">🔍</span>
              Card Search
            </Link>
          </li>
          */}
        </ul>
      </nav>
    </>
  );
}
