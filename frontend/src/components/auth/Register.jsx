import React, {useState} from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faFacebookF, faGithub, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import {faEye, faEyeSlash} from '@fortawesome/free-solid-svg-icons';
import { useGoogleLogin } from '@react-oauth/google';
import '../../styles/Register.css'


const Register = ({ state, setState, showMessage }) => {

    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleRegister = async () => {
        try {
            const response = await axios.post("http://localhost:5000/api/signup", {
                username: state.username,
                email: state.email,
                password: state.password
            });
            showMessage(response.data.message, 8500); // Mostra messaggio di successo
        } catch (error) {
            console.log(error);
            showMessage(error.response?.data?.message || "Error during registration. Try later.", 9500);
        }
    };

    const login = useGoogleLogin({
        onSuccess: (response) => console.log("Login Successful", response),
        onError: (error) => console.error("Login Failed", error),
    });

    return (
        <div className="form-container sign-up">
            <form onSubmit={(e) => e.preventDefault()}>
                <h1>Create your Account</h1>
                <div className="social-icons">
                    <a href="#" className="icon" onClick={login}><FontAwesomeIcon icon={faGoogle} /></a>
                    <a href="#" className="icon"><FontAwesomeIcon icon={faFacebookF} /></a>
                    <a href="#" className="icon"><FontAwesomeIcon icon={faGithub} /></a>
                    <a href="#" className="icon"><FontAwesomeIcon icon={faLinkedinIn} /></a>
                </div>
                <span>or use your email to signup</span>
                <input
                    type="text"
                    placeholder="Username"
                    value={state.username}
                    onChange={(e) => setState("username", e.target.value)}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={state.email}
                    onChange={(e) => setState("email", e.target.value)}
                />
                <div className='password-input-container-r'>
                    <input type={showPassword ? "text" : "password"} placeholder="Password" value={state.password}
                           onChange={(e) => setState("password", e.target.value)}/>
                    <button type='button' className='toggle-password-btn-r' onClick={togglePasswordVisibility}
                            aria-label='Toggle password visibility'><FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}/></button>
                </div>
                <button type="button" className='buttonA' onClick={handleRegister}>Signup</button>
            </form>
        </div>
    );
};

export default Register;
