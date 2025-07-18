import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await axios.get('/api/auth-status');
                setIsAuthenticated(true);
            } catch (error) {
                setIsAuthenticated(false);
                navigate('/'); //Torna alla pagina di login se non autenticato
            }
        };
        checkAuth();
    }, [navigate]);

    if (isAuthenticated === null) {
        return <div>Loading...</div>; //Mostra uno stato di caricamento
    }

    return isAuthenticated ? children : null;
};

export default ProtectedRoute;
