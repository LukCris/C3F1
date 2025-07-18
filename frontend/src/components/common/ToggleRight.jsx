import React from 'react';

const ToggleRight = ({ onRegisterClick }) => {
    return (
        <div className="toggle-panel toggle-right">
            <h1>Welcome!</h1>
            <p>Sign up with your personal detail to use all the functionality of our password manager</p>
            <button className="buttonA" id="register" onClick={onRegisterClick}>
                Sign up
            </button>
        </div>
    );
};

export default ToggleRight;
