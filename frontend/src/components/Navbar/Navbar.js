import React from 'react'
import './Navbar.style.css'
import { Link } from 'react-router-dom'
import logo from './image.png'

const Navbar = () => {
  return (
    <navbar>
        <div className='logo'>
            {/* <Link className='title' to="/">FIT AI</Link> */}
            <Link className='title' to="/"><img src={logo} /></Link>
        </div>
        <div className='sign'>
            <Link className='signin-btn' to='/signin'>Sign In</Link>
        </div>
    </navbar>
  )
}

export default Navbar