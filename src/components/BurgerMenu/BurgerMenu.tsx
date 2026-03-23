import { GitCompare, Image, Printer } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./BurgerMenu.css";

export function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);

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
            <NavLink to="/proxy-maker" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
              <Printer className="menu-icon" size={20} />
              Proxy Maker
            </NavLink>
          </li>
          <li>
            <NavLink to="/compare-decks" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
              <GitCompare className="menu-icon" size={20} />
              Compare Decks
            </NavLink>
          </li>
          <li>
            <NavLink to="/deck-showcase" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
              <Image className="menu-icon" size={20} />
              Deck Showcase
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
}
