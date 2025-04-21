// src/components/Logo.js
import React from 'react'
import logo from '../assets/logo-cb.png'

export default function Logo({ className = '' }) {
  return (
    <img
      src={logo}
      alt="Cal Blay"
      className={`select-none ${className}`}
    />
  )
}
