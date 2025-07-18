import React, {useState} from "react";
import "../../styles/HomePage.css";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket, faEye, faEyeSlash, faBars } from '@fortawesome/free-solid-svg-icons';
import Sidebar from "../common/Sidebar";
import Notes from "../utils/Notes.jsx";
import Password from "../utils/Password.jsx";

const HomePage = () => {
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState('password'); // Selettore di visibilità se password o note

    const [fbMessage, setFbMessage] = useState("");
    const [fbMessagep, setFbMessagep] = useState("");

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // FUNZIONE PER LA GESTIONE DELLA SIDEBAR
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // FUNZIONE PER MOSTRARE IL MESSAGGIO DI FEEDBACK NEGATIVO
    const showMessage = (message, time) => {
        setFbMessage(message); // Imposta il messaggio
        setTimeout(() => {
            setFbMessage(""); // Nasconde il messaggio dopo il timeout
        }, time);
    };

    // FUNZIONE PER MOSTRARE IL MESSAGGIO DI FEEDBACK POSITIVO
    const showMessagep = (message, time) =>{
        setFbMessagep(message);
        setTimeout(() => {
            setFbMessagep("");
        }, time);
    };

    // FUNZIONE PER GESTIRE IL LOGOUT
    const handleLogout = async () => {
        const res = await axios.get('http://localhost:5000/api/logout')
        if (res.status === 200) {
            showMessagep(res.data.message);
            navigate('/');
        }
    }

    return (
        <div className="home-page-container">
            {/* Sidebar and Logout */}
            {!isSidebarOpen && (<button className="sidebar-toggle" onClick={toggleSidebar}><FontAwesomeIcon icon={faBars} /></button>)}
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <button className="logout-btn" onClick={handleLogout}>Logout <FontAwesomeIcon icon={faRightFromBracket} /></button>
            {/* View Mode Selectors */}
            <div className="view-selector">
                <button className= {`view-btnps ${viewMode === 'password' ? 'active' : ''}`} onClick={() => setViewMode('password')}>
                    <span className="circle1" />
                    <span className="circle2" />
                    <span className="circle3" />
                    <span className="circle4" />
                    <span className="circle5" />
                    <span className="text">
                        Pass
                    </span>
                </button>
                <button className={`view-btnns ${viewMode === 'note' ? 'active' : ''}`} onClick={() => setViewMode('note')}>
                    <span className="circle1" />
                    <span className="circle2" />
                    <span className="circle3" />
                    <span className="circle4" />
                    <span className="circle5" />
                    <span className="text">
                        Note
                    </span>
                </button>
            </div>
            {/* Conditionally Render Forms */}
            {viewMode === 'password' && (
                <Password showMessage={showMessage} showMessagep={showMessagep}/>
            )}
            {viewMode === 'note' && (
                <Notes showMessage={showMessage} showMessagep={showMessagep} />
            )}
            {/* Feedback Messages */}
            {fbMessage && <div className="feedback-message-h">{fbMessage}</div>}
            {fbMessagep && <div className="feedback-message-p">{fbMessagep}</div>}
        </div>
    );
};

export default HomePage;