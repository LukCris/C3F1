import React from "react";
import "../../styles/Sidebar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from '@fortawesome/free-solid-svg-icons';
import Pdf1 from "../presentation/Team_3_presentation_C3F1.pdf"
import Pdf2 from "../presentation/Team_3_presentation_C3F1_2.pdf"
import Pdf3 from "../presentation/Team_3_final_presentation.pdf"
import Pdf4 from "../presentation/ReportC3F1.pdf"

const Sidebar = ({ isOpen, toggleSidebar }) => {
    return (
        <div className={`sidebar ${isOpen ? "open" : ""}`}>
            <button className="close-btn" onClick={toggleSidebar}>
                <FontAwesomeIcon icon={faX}/>
            </button>
            <ul className="sidebar-menu">
                <li><a href={Pdf1} target="blank">First pesentation </a></li>
                <li><a href={Pdf2} target="blank">Second presentation</a></li>
                <li><a href={Pdf3} target="blank">Final presentation</a></li>
                <li><a href={Pdf4}>Report</a></li>
                <div className="bottom">
                    <ul>
                        <li>Contact us:</li>
                        <li className="email"><a href="mailto:c3f1@gmail.com">c3f1@gmail.com</a></li>
                    </ul>
                </div>
            </ul>
        </div>
    );
};

export default Sidebar;
