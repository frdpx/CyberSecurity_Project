import React from 'react'
import './Header.css'

const Header = () => {
  
  const handleViewMenuClick = () => {
    const exploreMenuSection = document.getElementById('explore-menu');
    if (exploreMenuSection) {
      exploreMenuSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <div className='header' >
      <div className="header-contents">
        <h2>order your favourite food HERE</h2>
        <p>Choosing a diverse menu involves selecting a variety of dishes from different cuisines, 
            ingredients, and preparation styles. This ensures that the meal is interesting and caters 
            to different tastes and dietary preferences</p>
        <button onClick={handleViewMenuClick}>View Menu</button>
      </div>
    </div>
  )
}

export default Header;
