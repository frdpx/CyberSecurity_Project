import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <div className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
            <img src={assets.logo} alt="" />
            <p>Enjoy the convenience of Hiwhiw Restaurant’s delivery service, </p>
            <p>bringing our delicious food straight to your doorstep.</p>
            <div className="footer-social-icons">
                <img src={assets.facebook_icon} alt="" />
                <img src={assets.twitter_icon} alt="" />
    
            </div>
        </div>
        <div className="footer-content-center">
            <h2>COMPANY</h2>
            <ul>
                <li>Home</li>
                <li>About us</li>
                <li>Delivery</li>
                <li>Privacy policy</li>
            </ul>
        </div>
        <div className="footer-copyright">
            <h2>GET IN TOUCH</h2>
            <ul>
                <li>+66 12 345 6789</li>
                <li>contact@hiwhiw.com</li>
            </ul>
        </div>
      </div>
      <hr/>
      <p className='footer-copyright'>Copyright 2024 @ HiwHiw.com - All Right Reserved.</p>
    </div>
  )
}

export default Footer
