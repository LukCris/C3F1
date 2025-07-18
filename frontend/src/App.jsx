import React from 'react';
import { useState, useEffect } from 'react';
import './styles/App.css';
import logoImg from './images/c3f1logo.png';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Register from './components/auth/Register.jsx';
import Login from './components/auth/Login';
import Toggle from './components/common/Toggle';
import Sidebar from './components/common/Sidebar';
import Powered from './components/common/Powered';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

const App = () => {
    const [state, setState] = useState({username: "", email: "", password: "", message: ""});
    const [showLogo, setShowLogo] = useState(true); //Lo uso per controllare se il logo è visibile
    const [isAnimatingLogo, setIsAnimatingLogo] = useState(false); //Lo uso per l'animazione iniziale del logo
    const [isActive, setIsActive] = useState(false); //Lo uso per l'animazione del toggle
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Per toggle della sidebar
    const [showPoweredBy, setShowPoweredBy] = useState(false); // Comparsa powered


    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const showMessage = (message,time) => {
        setState((prev) => ({ ...prev, message }));
        setTimeout(() => {
            setState((prev) => ({ ...prev, message: "" }));
        }, time); // Nasconde il messaggio dopo il tempo passato dalla funzione in analisi, ho usato il time per garantirne la riusabilità
    };

    useEffect(() => {
        //Ci permette di far partire l'animazione iniziale del logo dopo l'avvio
        const timer = setTimeout(() => {
            setShowLogo(true);
            setIsAnimatingLogo(true);
        }, 100); //Ho immesso un ritardo per effettuare la dissolvenza iniziale
        return () => clearTimeout(timer);
    }, []);

    const handleLogoClick = () => {
        setIsAnimatingLogo(false); //Ci permette di nascondere il logo
        setTimeout(() => {
            setShowLogo(false)
            setShowPoweredBy(true);
        }, 600); //Fa si che il logo venga rimosso alla fine dell'animazione
    };

    const handleRegisterClick = () => {
        setIsActive(true); //Attiva l'animazione del toggle
    };

    const handleLoginClick = () => {
        setIsActive(false); //Attiva l'animazione del toggle
    };

    const handleSetState = (field, value) => {
        setState((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            {!isSidebarOpen && (<button className='sidebar-toggle' onClick={toggleSidebar}><FontAwesomeIcon icon={faBars}/></button>)}
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            {/* Logo con animazione */}
            {showLogo && (
                <div className={`logo-container ${isAnimatingLogo ? 'show' : 'hidden'}`} onClick={handleLogoClick}>
                    <img src={logoImg} alt="Logo" className="logo" />
                </div>
            )}
            {/* Contenitore principale */}
            <div className={`container ${showLogo ? 'hidden' : ''} ${isActive ? 'active' : ''}`}>
                <Register state={state} setState={handleSetState} showMessage={showMessage}/>
                <Login state={state} setState={handleSetState} showMessage={showMessage}/>
                <Toggle isActive={isActive} onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />
            </div>
            {showPoweredBy && <Powered />}
            {/* Messaggi di feedback */}
            {state.message && <div className="feedback-message">{state.message}</div>}
        </div>
    );
};

const Root = () => {
    return (
        <GoogleOAuthProvider clientId="876018171237-q126rkbhdon5b45cuundfuclp71u22cj.apps.googleusercontent.com">
            <App />
        </GoogleOAuthProvider>
    );
};

export default Root;