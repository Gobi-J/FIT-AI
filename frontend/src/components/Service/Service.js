import React from "react";
import "./Service.style.css";
import {services}  from "./data";
import serviveImg from '../../assets/service.png'
const Service = () => {
  return (
    <div className="service-wrapper">
      {services.map((item, index) => (
        <div className="service" key={index}>
          <div className="service-content">
            <h3><span>{item.heading}</span></h3>
            <p>{item.body}</p>
            <div className="service-detail">
            <img src={serviveImg} alt="" />
              <div class="service-item">
                <h4>{item.subHead1}</h4>
                <p>{item.subBody1}</p>
              </div>
            </div>
            <div className="service-detail">
                <img src={serviveImg} alt="" />
              <div className="service-item">
                <h4>{item.subHead2}</h4>
                <p>{item.subBody2}</p>
              </div>
            </div>
          </div>
          <div className="service-image">
          <img src={item.image} alt="service" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Service;
