import React from 'react';
import '../../styles/Powered.css'

const Powered = () => {
    return (
        <div className="powered">
            <p>Powered by</p>
            <div className="logos">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg" alt="Python Logo" className="logo-python" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React Logo" className="logo-react" />
            </div>
        </div>
    );
};

export default Powered;
