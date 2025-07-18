import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import '../../styles/Setup.css';

const SetupPage = () => {
    const navigate = useNavigate();
    const [secret, setSecret] = useState("");
    const [base64_qr_image, setBase64_qr_image] = useState("");
    const [fbMessagep, setFbMessagep] = useState("");

    const showMessagep = (message, time) =>{
        setFbMessagep(message);
        setTimeout(() => {
            setFbMessagep("");
        }, time);
    };

    const copySecret = async () => {
        try {
            await navigator.clipboard.writeText(secret);
            showMessagep("Successfully copied TOTP secret token!", 3000)
        } catch (err) {
            showMessagep("Failed to copy the secret token. Please try again.");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/setup-2fa");
                const data = res.data;
                if (res.status === 200) {
                    setSecret(data.secret);
                    setBase64_qr_image(data.base64_qr_image);
                }else showMessagep(data.message);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    const redirectHandler = () => {
        navigate("/verify-2fa");
    };

    return (
        <div className="setup-container">
            <div className="setup-form">
                <h5 className="form-title">Instructions</h5>
                <ul className="instructions-list">
                    <li>Download Google Authenticator on your mobile</li>
                    <li>Set up a new authenticator</li>
                    <li>Copy your OTP secret and store it in a safe way</li>
                </ul>

                <div className="qr-code-container">
                    {base64_qr_image && (
                        <img
                            src={`data:image/png;base64,${base64_qr_image}`}
                            alt="Secret Token"
                            className="qr-code"
                        />
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="secret" className="form-label">Secret Token</label>
                    <input
                        type="text"
                        className="form-control"
                        id="secret"
                        value={secret}
                        readOnly
                    />
                </div>

                <div className="text-center mt-3">
                    <button className="Btn" onClick={copySecret}>
                        <svg viewBox="0 0 512 512" className="svgIcon" height="1em">
                            <path
                                d="M288 448H64V224h64V160H64c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H288c35.3 0 64-28.7 64-64V384H288v64zm-64-96H448c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H224c-35.3 0-64 28.7-64 64V288c0 35.3 28.7 64 64 64z"/>
                        </svg>
                        <p className="texts">Copy Secret</p>
                        <span className="effect"/>
                    </button>
                </div>


                <p className="redirect-text mt-4 text-center">
                    Once you have scanned the QR, please click{" "}
                    <button type="button" onClick={redirectHandler} className="redirect-button">
                        here
                    </button>
                </p>

            </div>
            {/* Pulsanti per Play Store e Apple Store */}
            <div className="store-buttons-container">
                <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                   target="_blank" rel="noopener noreferrer" className="store-button"><img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                    alt="Get it on Google Play" className="store-icon"/></a>
                <a href="https://apps.apple.com/us/app/google-authenticator/id388497605" target="_blank"
                   rel="noopener noreferrer" className="store-button"><img
                    src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                    alt="Download on the App Store" className="store-icon"/></a>
            </div>
            {fbMessagep && <div className="feedback-message-p">{fbMessagep}</div>}
        </div>

    );
};

export default SetupPage;
