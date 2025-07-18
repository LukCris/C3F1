import React from 'react';

const ToggleLeft = ({ onLoginClick }) => {
    return (
        <div className="toggle-panel toggle-left">
            <h1>Welcome back!</h1>
            <p>Insert your personal detail to use all the functionality of our password manager</p>
            <button className="buttonA" id="login" onClick={onLoginClick}>
                Log in
            </button>
        </div>
    );
};

export default ToggleLeft;
