// src/components/BackButton.js
import { ArrowLeft } from 'lucide-react'

export default function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="p-2 bg-white/90 backdrop-blur rounded-full shadow-lg
                 hover:scale-95 transition"
    >
      <ArrowLeft className="w-5 h-5 text-primary" />
    </button>
  )
}
