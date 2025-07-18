import React from 'react';
import './styles/index.css';
import App from './App';
import SetupPage from './components/pages/SetupPage.jsx'
import VerifyPage from './components/pages/VerifyPage.jsx'
import HomePage from "./components/pages/HomePage.jsx";
import axios from 'axios';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

axios.defaults.withCredentials = true; //Questo invia il cookie con ogni richiesta

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/setup-2fa", element: <SetupPage />},
  { path: "/verify-2fa", element: <VerifyPage />},
  { path: "/homePage", element: <HomePage />},
]);

createRoot(document.getElementById("root")).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
);