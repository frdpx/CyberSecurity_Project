import React, { useContext, useState } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext';

const FoodItem = ({ image, name, price, desc, id }) => {
    const { cartItems = {}, addToCart, removeFromCart, url, currency } = useContext(StoreContext);

    const itemCount = cartItems[id] || 0; // ใช้ค่า 0 ถ้า cartItems[id] เป็น undefined

    return (
        <div className='food-item'>
            <div className='food-item-img-container'>
                <img className='food-item-image' src={url + "/images/" + image} alt={name} />
                {!itemCount ? (
                    <img className='add' onClick={() => addToCart(id)} src={assets.add_icon_white} alt="Add to cart" />
                ) : (
                    <div className="food-item-counter">
                        <img src={assets.remove_icon_red} onClick={() => removeFromCart(id)} alt="Remove from cart" />
                        <p>{itemCount}</p>
                        <img src={assets.add_icon_green} onClick={() => addToCart(id)} alt="Add to cart" />
                    </div>
                )}
            </div>
            <div className="food-item-info">
                <div className="food-item-name-rating">
                    <p>{name}</p> <img src={assets.rating_starts} alt="Rating" />
                </div>
                <p className="food-item-desc">{desc}</p>
                <p className="food-item-price">{currency}{price}</p>
            </div>
        </div>
    )
}
export default FoodItem
