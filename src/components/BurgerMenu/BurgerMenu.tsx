import { GitCompare, Printer } from "lucide-react";
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
          <h2>Magic The Gathering Tools</h2>
        </div>
        <ul className="burger-menu-links">
          <li>
            <Link
              to="/"
              className={location.pathname === "/" ? "active" : ""}
              onClick={closeMenu}
            >
              <Printer className="menu-icon" size={20} />
              Proxy Maker
            </Link>
          </li>
          <li>
            <Link
              to="/compare-decks"
              className={location.pathname === "/compare-decks" ? "active" : ""}
              onClick={closeMenu}
            >
              <GitCompare className="menu-icon" size={20} />
              Compare Decks
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
