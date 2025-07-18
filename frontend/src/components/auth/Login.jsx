import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faFacebookF, faGithub, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import {faEye, faEyeSlash} from '@fortawesome/free-solid-svg-icons';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import '../../styles/Login.css'


const Login = ({ state, setState, showMessage}) => {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleLogin = async () => {
        try {
            const response = await axios.post("http://localhost:5000/api/login", {
                username: state.username,
                password: state.password
            });
            showMessage(response.data.message, 8500);
            if (response.data.message === 'Verify your identity with TOTP'){
                navigate("/verify-2fa");
            } else if(response.data.message === 'You have not enabled 2-Factor Authentication'){
                navigate("/setup-2fa");
            }
        } catch (error) {
            showMessage("Error during login. Please, try later.", 9500);
        }
    };

    const login = useGoogleLogin({
        onSuccess: (response) => console.log("Login Successful", response),
        onError: (error) => console.error("Login Failed", error),
    });

    return (
        <div className="form-container sign-in">
            <form onSubmit={(e) => e.preventDefault()}>
                <h1>Log in</h1>
                <div className="social-icons">
                    <a href="#" className="icon" onClick={login}><FontAwesomeIcon icon={faGoogle}/></a>
                    <a href="#" className="icon"><FontAwesomeIcon icon={faFacebookF}/></a>
                    <a href="#" className="icon"><FontAwesomeIcon icon={faGithub}/></a>
                    <a href="#" className="icon"><FontAwesomeIcon icon={faLinkedinIn}/></a>
                </div>
                <span>or use your credential to login</span>
                <input type="text" placeholder="Nome utente" value={state.username}
                       onChange={(e) => setState("username", e.target.value)}/>
                <div className='password-input-container-l'>
                    <input type={showPassword ? "text" : "password"} placeholder="Password" value={state.password}
                           onChange={(e) => setState("password", e.target.value)}/>
                    <button type='button' className='toggle-password-btn-l' onClick={togglePasswordVisibility}
                            aria-label='Toggle password visibility'><FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}/></button>
                </div>
                <button type="button" className="buttonA" onClick={handleLogin}>Accedi</button>
            </form>
        </div>
    );
};

export default Login;

