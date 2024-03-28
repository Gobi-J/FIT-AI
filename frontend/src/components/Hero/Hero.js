import { Link } from "react-router-dom";
import "./Hero.style.css";
import React, { useEffect, useRef } from "react";
import video from "./video.mp4";

const Hero = () => {
  const videos = useRef(null);
  
  useEffect(() => {
    videos.current.play();
  }, []);

  return (
    <main>
      <video src={video} disablePictureInPicture muted loop ref={videos} />
      <div className="main-1">
        <h2>
          Your <span>Physical</span> <br />
          Wellness Starts Here
        </h2>
        <p>
          Take control of your health with our intuitive nutrition and fitness
          tracking app. Achieve your health goals, one step at a time.
        </p>
        <Link className="main-btn" to="/signin">
          Get Started
        </Link>
      </div>
      <div className="main-2">
        <h3>
          Fitness app built for <span>fitness enthusiasts</span>
        </h3>
        <p>
          Meet Fit AI, your go-to app for simplifying fitness management. We've
          got your back in tracking and optimizing your health journey
          effortlessly.
        </p>
      </div>
    </main>
  );
};

export default Hero;
