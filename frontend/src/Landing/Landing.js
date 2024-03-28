import React from 'react';
import './Landing.style.css'
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import Hero from '../components/Hero/Hero';
import Service from '../components/Service/Service';

const Landing = () => {
  return (
    <div className='landing-wrapper'>
        <Navbar />
        <Hero />
        <Service />
        <Footer />
    </div>
  )
}

export default Landing