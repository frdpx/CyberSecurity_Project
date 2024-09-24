import React from 'react';
import './App.css';
import pizzaImage from './assets/images/PiZZa_head.jpg';

function App() {
  return (
    <div className="App">
      {/* ส่วน Header */}
      <header className="hero-section">
        <img src={pizzaImage} alt="Pizza" className="hero-image" />
        <h2>Order the food you want here.</h2>
        <button className="view-menu-btn">View Menu</button>
      </header>

      {/* ส่วนเมนู */}
      <section className="menu-section">
        <h3>Explore our menu</h3>
        <div className="menu-categories">
          <div className="menu-item">
            <img src={pizzaImage} alt="Dessert" />
            <p>Dessert</p>
          </div>
          <div className="menu-item">
            <img src={pizzaImage} alt="Salad" />
            <p>Salad</p>
          </div>
          {/* เพิ่มหมวดเมนูอื่นๆ */}
        </div>
      </section>

      {/* ส่วนอาหารยอดนิยม */}
      <section className="top-dishes">
        <h3>Top dishes near you</h3>
        <div className="dishes-grid">
          {Array(12).fill(null).map((_, index) => (
            <div className="dish-card" key={index}>
              <img src={pizzaImage} alt="Cobb Salad" />
              <h4>Cobb Salad</h4>
              <p>Healthy and fresh</p>
              <span className="rating">★★★★★</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
