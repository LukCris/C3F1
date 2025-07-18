import React, {useEffect, useState} from "react";
import axios from "axios";

const Notes = ({showMessage, showMessagep}) => {

    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);

    const [notes, setNotes] = useState([]);
    const [noteContent, setNoteContent] = useState('');

    useEffect(() => {
        const fetchNotes = async () => {
            try{
                const res = await axios.get('http://localhost:5000/api/notes_saved');
                const data = res.data;
                if (res.status === 200) {
                    setNotes(data.notes);
                }
            }catch (e) {
                console.log(e);
            }
        }
        fetchNotes();
    }, []);

    // FUNZIONE PER AGGIUNGERE LE NOTE
    const addNoteHandler = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/save_note', {
                content: noteContent,
            });

            if (res.status === 200) {
                showMessagep(res.data.message, 3000);
                const updatedRes = await axios.get('http://localhost:5000/api/notes_saved');
                setNotes(updatedRes.data.notes);
                setNoteContent('');
            }else showMessage(res.data.message, 3000);
        } catch (error) {
            showMessage('Error saving note.', 9500);
        }
    };

    const deleteNoteHandler = async (id) => {
        try {
            const res = await axios.post(`http://localhost:5000/api/delete-note/${id}`);
            if (res.status === 200) {
                showMessagep(res.data.message, 3000);
                setNotes((prevNotes) =>
                    prevNotes.filter((password) => password.id !== id)
                );
            }else showMessage(res.data.message, 3000);
        } catch (error) {
            showMessage('Error deleting password:', 3000);
        }
    }

    const startEditing = async (note) => {
        setEditMode(true);
        setEditId(note.id);
        setNoteContent(note.content);
    };

    // PER RESETTARE IL FORM DOPO LA MODIFICA DELLA ENTRY
    const resetForm = () => {
        setEditMode(false);
        setEditId(null);
        setNoteContent('');
    };

    const editNoteHandler = async (e) => {
        e.preventDefault();
        try{
            const res = await axios.post(`http://localhost:5000/api/edit-note/${editId}`, {
                content: noteContent,
            })

            if (res.status === 200) {
                showMessagep(res.data.message, 3000);
                const updatedRes = await axios.get('http://localhost:5000/api/notes_saved');
                setNotes(updatedRes.data.notes);
                resetForm();
            }else showMessage(res.data.message, 3000);
        }catch (e) {
            console.log(e);
        }
    }

    return (
        <>
            <h1 className="h1-home">Save a New Note</h1>
            <form className="note-form-home">
                <div className="form-field-home">
                    <label>Note:</label>
                    <textarea value={noteContent} onChange={
                        (e) => setNoteContent(e.target.value)} required/>
                </div>
                {editMode? (
                    <button type='submit' onClick={editNoteHandler} className="save-btn-home">Save Changes</button>
                ) : (<button type="submit" className="save-btn-home" onClick={addNoteHandler}>Save Note</button>)}
                {editMode && <button type="button" onClick={resetForm} className={'cancel-btn-home'}>Cancel</button>}

            </form>
            <h2 className="h2-home">Your Stored Notes</h2>
            <div className="table-container-home">
                <table className="note-table-home">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Note</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>{notes.length > 0 ? (notes.map((note) => (
                        <tr key={note.id}>
                            <td>{note.date}</td>
                            <td className={'content'}>{note.content}</td>
                            <td>
                                <div className={'actions'}>
                                    {!editMode &&
                                        <button className="delete-btn-home" onClick={() => deleteNoteHandler(note.id)}>
                                            Delete
                                        </button>
                                    }
                                    <button className="edit-btn-home" onClick={() => startEditing(note)}>Edit</button>
                                </div>
                            </td>
                        </tr>))) : (
                        <tr>
                            <td colSpan="2">No notes stored yet</td>
                        </tr>)}
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default Notes