import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEye, faEyeSlash} from "@fortawesome/free-solid-svg-icons";
import React, {useEffect, useState} from "react";
import axios from "axios";

const Password = ({showMessage, showMessagep}) => {

    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    const [entry, setEntry] = useState([]);
    const [site, setSite] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [isSaving, setIsSaving] = useState(false);

    const [visiblePasswords, setVisiblePasswords] = useState({});

    const [showFormPassword, setShowFormPassword] = useState(false);
    const [showTablePassword, setShowTablePassword] = useState(false);

    // FUNZIONE PER RECUPERARE LE PASSWORD DELL'UTENTE
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/data_saved');
                const data = res.data;
                if (res.status === 200) {
                    setEntry(data.savedPassword);
                }else{
                    showMessage(res.data.message);
                }
            } catch (e) {
                console.log(e);
            }
        };

        fetchData();
    }, []);

    // FUNZIONE PER CREARE UNA NUOVA ENTRY
    const addPasswordHandler = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try{
            const res = await axios.post('http://localhost:5000/api/save_password', {
                site: site,
                username: username,
                email: email,
                password: password
            });
            const data = res.data;

            if (res.status === 200) {
                const updatedRes = await axios.get('http://localhost:5000/api/data_saved');
                showMessagep(data.message, 3000);
                setEntry(updatedRes.data.savedPassword);
                setSite(' ');
                setEmail(' ')
                setPassword('')
                setUsername(' ')
            }else showMessage(res.data.message, 3000);
        }catch(e){
            console.log(e);
        }finally {
            setIsSaving(false);
        }

    };

    // FUNZIONE PER CANCELLARE UNA PASSWORD
    const deletePasswordHandler = async (id) => {
        try {
            const res = await axios.post(`http://localhost:5000/api/delete_password/${id}`);

            if (res.status === 200) {
                showMessagep(res.data.message, 3000);
                setEntry((prevPasswords) =>
                    prevPasswords.filter((password) => password.id !== id)
                );
            }else showMessage(res.data.message, 3000);
        } catch (error) {
            showMessage('Error deleting password');
        }
    };

    // PER GESTIRE LA MODIFICA DELLA PASSWORD
    const startEditing = async (password) => {
        setEditMode(true);
        setEditId(password.id);
        setSite(password.site);
        setUsername(password.username);
        setEmail(password.email);
        const res = await axios.get(`http://localhost:5000/api/password_saved/${password.id}`);
        if (res.status === 200) {
            setPassword(res.data.password);
        }
    };

    // PER RESETTARE IL FORM DOPO LA MODIFICA DELLA ENTRY
    const resetForm = () => {
        setEditMode(false);
        setEditId(null);
        setSite('');
        setUsername('');
        setEmail('');
        setPassword('');
    };

    // FUNZIONE PER MODIFICARE UNA ENTRY
    const saveEditHandler = async (e) => {
        e.preventDefault();
        try{

            const res = await axios.post(`http://localhost:5000/api/modify-data/${editId}`, {
                site: site,
                username: username,
                email: email,
                password: password
            })
            if (res.status === 200) {
                const updatedRes = await axios.get('http://localhost:5000/api/data_saved');
                setEntry(updatedRes.data.savedPassword);
                showMessagep("Password updated successfully!", 3000);
                resetForm();
            }else showMessage(res.data.message, 3000);
        }catch(error) {
            showMessage('Error updating password');
        }
    }

    // FUNZIONE PER GENERARE UNA PASSWORD RANDOM
    const randomPasswordHandler = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.get(`http://localhost:5000/api/random_password`);
            if (res.status === 200) {
                setPassword(res.data.password);
                showMessagep('Strong password setted!', 3000);
            }else showMessage(res.data.message, 3000);
        }catch(error) {
            console.error('Error suggesting password:', error);
        }
    }

    // FUNZIONE PER CONTROLLARE SE LA PASSWORD E' COMPROMESSA
    const pwnedPasswordHandler = async (id) => {
        try{
            const res = await axios.get(`http://localhost:5000/api/pwned_password/${id}`);
            if (res.status === 200) {
                showMessagep(res.data.message, 3000);
            }else showMessage(res.data.message, 3000);
        }catch(error) {
            console.error('Error checking password:', error);
        }
    }

    const seePasswordHandler = async (id) => {
        if(!showTablePassword){
            try{
                const res = await axios.get(`http://localhost:5000/api/password_saved/${id}`);
                if (res.status === 200) {
                    setVisiblePasswords((prevState) => ({
                        ...prevState,
                        [id]: res.data.password
                    }));
                    setShowTablePassword(true);
                }
            }catch(error) {
                console.error('Error:', error);
            }
        }else {
            setShowTablePassword(false);
            setVisiblePasswords((prevState) => ({
                ...prevState,
                [id]: ""
            }));
        }
    }

    // PER VISUALIZZARE LA PASSWORD
    const togglePasswordVisibility = () => {
        setShowFormPassword(!showFormPassword);  // Cambia stato per la visibilità della password
    };

    return(
        <>
            <h1 className="h1-home">{!editMode ?('Save a new Password') :('Edit field for the site: ' + site)}</h1>
            <form className="password-form-home">
                <div className="form-field-home"><label>Site:</label><input type="text" value={site} onChange={(e) => setSite(e.target.value)} required/></div>
                <div className="form-field-home"><label>Username:</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required/></div>
                <div className="form-field-home"><label>Email:</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/></div>
                <div className="form-field-home"><label>Password:</label>
                    <div className="password-input-container-home">
                        <input type={showFormPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required/>
                        <button type="button" className="toggle-password-btn-home" onClick={togglePasswordVisibility} aria-label="Toggle password visibility">
                            {showFormPassword ? (<FontAwesomeIcon icon={faEyeSlash} />) : (<FontAwesomeIcon icon={faEye} />)}
                        </button>
                    </div>
                    <button className="suggest-btn" onClick={randomPasswordHandler}>Suggest</button>
                </div>
                {editMode ? (<button type="submit" className="save-btn-home" onClick={saveEditHandler}>Save Changes</button>) : (
                    <button type="submit" className="save-btn-home" onClick={addPasswordHandler}>Save Password</button>)}
                {editMode && <button type="button" onClick={resetForm} className={'cancel-btn-home'}>Cancel</button>}
            </form>
            <h2 className="h2-home">Your Stored Passwords</h2>
            <div className="table-container-home">
                <table className="password-table-home">
                    <thead>
                    <tr>
                        <th>Site</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Password</th>
                        <th>Actions</th>
                        <th>Expired</th>
                    </tr>
                    </thead>
                    <tbody>{entry.length > 0 ? (entry.map((password) => (
                        <tr key={password.id}>
                            <td>{password.site}</td>
                            <td>{password.username}</td>
                            <td>{password.email}</td>
                            <td>
                                {visiblePasswords[password.id] ?
                                    (<>
                                        {visiblePasswords[password.id]}
                                    </>) :
                                    (<>
                                        {".........."}
                                    </>)
                                }
                            </td>
                            <td>{!editMode && (<>
                                <button className="delete-btn-home"
                                        onClick={() => deletePasswordHandler(password.id)}>Delete
                                </button>
                                <button className="delete-btn-home"
                                        onClick={() => pwnedPasswordHandler(password.id)}>
                                    Pwned
                                </button>
                            </>)
                            }
                                <button className="edit-btn-home" onClick={() => startEditing(password)}>Edit</button>
                                <button className="edit-btn-home" onClick={() => seePasswordHandler(password.id)}>
                                    {showTablePassword ?
                                        (<FontAwesomeIcon icon={faEyeSlash} />) :
                                        (<FontAwesomeIcon icon={faEye} />)}
                                </button>
                            </td>
                            <td>{password.expired}</td>
                        </tr>))) : (<tr>
                        <td colSpan="5">No passwords stored yet</td>
                    </tr>)}
                    </tbody>
                </table>
            </div>

        </>
    )
}

export default Password;