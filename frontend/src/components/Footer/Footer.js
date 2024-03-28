import React from 'react'
import './Footer.style.css'

const Footer = () => {
  return (
    <footer>
        <div className='foot-1'>
            <p>Privacy Policy</p>
            <p>Terms and Conditions</p>
        </div>
        
        <div className='foot-2'>
            &copy;{new Date().getFullYear()} All rights reserved | Made by <span>TechMe</span>
        </div>
        <div className='foot-3'>
            <a href='#contact'>Contact Us</a>
        </div>
    </footer>
  )
}

export default Footer