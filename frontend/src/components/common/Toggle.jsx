import React from 'react';
import ToggleLeft from './ToggleLeft';
import ToggleRight from './ToggleRight';
import '../../App'

const Toggle = ({ isActive, onLoginClick, onRegisterClick }) => {
    return (
        <div className="toggle-container">
            <div className={`toggle ${isActive ? 'active' : ''}`}>
                <ToggleLeft onLoginClick={onLoginClick} />
                <ToggleRight onRegisterClick={onRegisterClick} />
            </div>
        </div>
    );
};

export default Toggle;
