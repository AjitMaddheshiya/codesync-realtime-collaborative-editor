import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import Playground from './pages/Playground'
import Landing from './pages/Landing'
import ErrorBoundary from './ErrorBoundary'
import "./App.css"
import { Toaster } from 'sonner'

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/playground/:id" element={<Playground />} />
        </Routes>
      </ErrorBoundary>
      <Toaster />
    </BrowserRouter>
  )
}
