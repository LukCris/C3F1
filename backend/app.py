from datetime import datetime, timedelta
from functools import wraps

import limiter
from cryptography.fernet import Fernet
from flask import Flask, Blueprint, request, jsonify, current_app, session
from flask_cors import CORS
from flask_session import Session
from backend.utils import (hash_password, check_password, load_master_key, save_site_data,
                           decrypt_password, get_b64encoded_qr_image, KEY_FILE, encrypt_password, search_weak_password,
                           control_password, check_pwned)
from flask_login import LoginManager, login_required, current_user, logout_user
from backend.models import User, db, SiteData, Notes
from flask_migrate import Migrate
from flask_login import login_user
import os, logging, secrets, string

DB_NAME = 'database.db'
SECRET_KEY='' # Inserire una nuova chiave segreta

def create_app():
    app = Flask(__name__)

    app.secret_key = 'SECRET_KEY'
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_NAME}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SESSION_PERMANENT'] = True
    app.config['SESSION_COOKIE_NAME'] = 'session'
    app.config['SESSION_COOKIE_DOMAIN'] = 'localhost'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'

    app.logger.setLevel(logging.DEBUG)

    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_FILE_DIR'] = '/tmp/flask_session'
    Session(app)

    db.init_app(app)
    Migrate(app, db)
    CORS(app, supports_credentials=True, origins=['http://localhost:5173'], resources={r"/*": {"origins": "http://localhost:5173"}})

    manager = LoginManager()
    manager.init_app(app)
    manager.login_view = 'main.login'

    @manager.user_loader
    def load_user(user_id):
        user = User.query.get(int(user_id))
        return user

    @manager.unauthorized_handler
    def unauthorized():
        return jsonify({'message': 'You must be logged in to access this resource.'})

    with app.app_context():
        if not os.path.exists('DB_NAME'):
            db.create_all()
            print("Database created!")

    app.register_blueprint(main, url_prefix='/')
    return app

# Funzione per bloccare le API sensibili se non viene eseguito la verifica 2FA
def requires_2fa(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('2fa_verified'):
            return jsonify({'message': '2FA verification required!'}), 403
        return f(*args, **kwargs)
    return decorated_function

main = Blueprint('main', __name__)

# -------------------------------------------------------------------------------------------
# AUTH API

@main.route('/api/signup', methods=['POST'])
def signup():
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({'message': 'Please fill out the required fields.'}), 400

        # Controllo che la password non sia una di quelle più usate
        value = search_weak_password(password)
        if value:
            return jsonify({'message': 'Password is too weak! Choose another one'}), 400

        existing_username = User.query.filter(User.username == username).first()
        existing_email = User.query.filter(User.email == email).first()
        if existing_username or existing_email:
            return jsonify({'message':'Username or email already taken'}), 400

        message = control_password(password)
        if message != 'Password respect all the constraints.':
            return jsonify({'message': message}), 400

        # Creo un nuovo utente e salva la password hashata
        hashed_password = hash_password(password)
        new_user = User(username=username, email=email, password=hashed_password)

        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User created successfully'}), 201

@main.route('/api/login', methods=['POST'])
def login():

    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter(User.username == username).first()
    # Controllo che l'utente esista e che la password sia corretta
    if user and check_password(user.password, password):
        login_user(user)
        if not user.is_two_factor_authentication_enabled:
            return jsonify({'message': 'You have not enabled 2-Factor Authentication'}), 200
        else:
            return jsonify({'message': 'Verify your identity with TOTP'}), 200
    elif not user:
        return jsonify({'message': 'You are not registered!'}), 404
    else:
        return jsonify({'message': 'Invalid credentials!'}), 401

@main.route('/api/setup-2fa', methods=['GET'])
@login_required
def setup_2fa():

    if not current_user.is_authenticated:
        return jsonify({'message': 'You are not authenticated!'}), 401

    if current_user.is_two_factor_authentication_enabled:
        return jsonify({'message': 'You have already set up 2FA'}), 400

    secret = current_user.otp_token
    if not secret:
        return jsonify({'message': 'An error has occurred'}), 500

    uri = current_user.get_authentication_setup_uri()
    if not uri:
        return jsonify({'message': 'An error has occurred'}), 500

    base64_qr_image = get_b64encoded_qr_image(uri)
    if not base64_qr_image:
        return jsonify({'message': 'An error has occurred producing QR code'}), 400

    return jsonify({'secret': secret,'base64_qr_image': base64_qr_image}), 200

@main.route('/api/verify-2fa', methods=['POST'])
@login_required
def verify_2fa():

    if not current_user.is_authenticated:
        return jsonify({'message': 'You are not authenticated!'}), 401

    data = request.json
    otp = data.get('otp')

    if current_user.is_otp_valid(otp):
        if current_user.is_two_factor_authentication_enabled:
            session['2fa_verified']=True
            return jsonify({'message': '2FA verification successful'}), 200
        else:
            try:
                current_user.is_two_factor_authentication_enabled = True
                db.session.commit()
                session['2fa_verified']=True
                return jsonify({'message': '2FA verification successful'}), 200
            except Exception:
                db.session.rollback()
                return jsonify({'message': '2FA verification failed. Please try again'}), 400

@main.route('/api/logout')
@login_required
@requires_2fa
def logout():
    if not current_user.is_authenticated:
        return jsonify({'message': 'You are not authenticated!'}), 401
    session.pop('2fa_verified', None)
    logout_user()
    return jsonify({'message': 'You have been logged out!'}), 200

# -----------------------------------------------------------------------------------------------
# SITE_DATA API

@main.route('/api/data_saved', methods=['GET'])
@login_required
@requires_2fa
def data_saved():
    try:
        if not current_user.is_authenticated:
            return jsonify({'message': 'You are not authenticated'}), 401

        master_key = load_master_key()
        if not master_key:
            return jsonify({'message': 'Master key not available'}), 500

        encrypted_data = SiteData.query.filter_by(user_id=current_user.id).all()
        if encrypted_data:
            decrypted_data = []
            now = datetime.now()
            for entry in encrypted_data:
                # Se la password è scaduta
                if entry.expiration_date < now:
                    expired = 'Yes'
                else: expired = 'No'
                decrypted_data.append({
                    'id': entry.id,
                    'site': entry.site,
                    'username': entry.username,
                    'email': entry.email,
                    'expired': expired
                })

            return jsonify({'savedPassword': decrypted_data}), 200
        else:
            return jsonify({'message':'No passwords saved'}), 404
    except Exception as e:
        return jsonify({'message': 'An error occurred:' + str(e)}), 500

@main.route('/api/save_password', methods=['POST'])
@login_required
@requires_2fa
def save_password():
    if not current_user.is_authenticated:
        return jsonify({'message': 'You are not authenticated!'}), 401

    data = request.json
    site = data.get('site')
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not site or not username or not email or not password:
        return jsonify({'message': 'Please fill out the required fields.'}), 400

    # Controllo che non sia una delle password più utilizzate
    value = search_weak_password(password)
    if value:
        return jsonify({'message': 'Password is weak! Choose another one'}), 400

    # Controllo che rispetti dei vincoli
    message = control_password(password)
    if message != 'Password respect all the constraints.':
        return jsonify({'message': message}), 400

    # Recupero tutte le password salvate dall'utente
    user_passwords = SiteData.query.filter_by(user_id=current_user.id).all()

    # Carico la master key
    master_key = load_master_key()
    if not master_key:
        return jsonify({'message': 'An unexpected error has occurred'}), 500

    # Controllo che la password non sia stata inserita altre volte
    for entry in user_passwords:
        decrypted_password = decrypt_password(entry.password, master_key)
        if decrypted_password == password:
            return jsonify({'message': 'You have almost used this password. Choose another one!'}), 400

    try:
        save_site_data(site, username, email, password, master_key)
        return jsonify({'message': 'Password saved successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'An error as occurred' + str(e)}), 400

@main.route('api/random_password', methods=['GET'])
@login_required
@requires_2fa
def generate_password():
    if not current_user.is_authenticated:
        return jsonify({'message': 'You are not authenticated!'}), 401

    pass_length = 16

    if os.path.isfile(KEY_FILE):

        # Caratteri disponibili
        lower = string.ascii_lowercase
        upper = string.ascii_uppercase
        digits = string.digits
        special = string.punctuation
        all_chars = lower + upper + digits + special

        # Garantisco almeno un carattere di ogni tipo
        password = [
            secrets.choice(lower),
            secrets.choice(upper),
            secrets.choice(digits),
            secrets.choice(special)
        ]

        # Riempio il resto della password
        password += [secrets.choice(all_chars) for _ in range(pass_length - len(password))]

        # Mescolo i caratteri per renderli casuali
        secrets.SystemRandom().shuffle(password)

        return jsonify({'password': ''.join(password)}), 200
    else:
        return jsonify({'message': 'Key file not found.'}), 404

@main.route('/api/delete_password/<int:id>', methods=['POST'])
@login_required
@requires_2fa
def delete_password(id):

    if not current_user.is_authenticated:
        return jsonify({'message': 'You are not authenticated!'}), 401

    password_to_delete = SiteData.query.filter_by(id=id, user_id=current_user.id).first()
    if password_to_delete:
        try:
            db.session.delete(password_to_delete)
            db.session.commit()
            return jsonify({'message': 'Password deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'An error as occurred' + str(e)}), 400
    else:
        return jsonify({'message': 'Password not found!'}), 404

@main.route('api/modify-data/<int:id>', methods=['POST'])
@login_required
@requires_2fa
def modify_data(id):
    if not current_user.is_authenticated:
        return jsonify({'message': 'You are not authenticated!'}), 401

    site_data = SiteData.query.filter_by(id=id, user_id=current_user.id).first()
    if not site_data:
        return jsonify({'message': 'Password not found!'}), 404

    master_key = load_master_key()
    if not master_key:
        return jsonify({'message': 'An unexpected error has occurred'}), 500

    decrypted_password = decrypt_password(site_data.password, master_key)

    data = request.json
    site = data.get('site')
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # CONSIDERA DI MODIFICARE IN BASE A COME GESTIAMO LA MODIFICA NEL FRONTEND
    if site != site_data.site:
        site_data.site = data['site']
    if username != site_data.username:
        site_data.username = data['username']
    if email != site_data.email:
        site_data.email = data['email']
    if password != decrypted_password:

        message = control_password(password)
        if message != 'Password respect all the constraints.':
            return jsonify({'message': message}), 400

        encrypted_password = encrypt_password(data['password'], master_key)
        site_data.password = encrypted_password

        # Aggiorno la data di scadenza
        expiration_period_days = 90
        expiration_date = datetime.now() + timedelta(days=expiration_period_days)
        site_data.expiration_date = expiration_date
    try:
        db.session.commit()
        return jsonify({'message': 'Password updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'An error has occurred' + str(e)}), 400

@main.route('/api/pwned_password/<int:id>', methods=['GET'])
@login_required
@requires_2fa
def pwned_password(id):

    if not current_user.is_authenticated:
        return jsonify({'message': 'You are not authenticated!'}), 401

    site_data = SiteData.query.filter_by(id=id, user_id=current_user.id).first()
    if not site_data:
        return jsonify({'message': 'Password not found!'}), 404

    master_key = load_master_key()
    if not master_key:
        return jsonify({'message': 'An unexpected error has occurred'}), 500

    decrypted_password = decrypt_password(site_data.password, master_key)
    try:
        count = check_pwned(decrypted_password)
        if count > 0:
            return jsonify({"message": "This password has been pwned"}), 200
        elif count == 0:
            return jsonify({"message": "This password has been NOT pwned"}), 200
    except Exception as e:
        return jsonify({"An error has occurred": str(e)}), 500

@main.route('/api/password_saved/<int:id>', methods=['GET'])
@login_required
@requires_2fa
def password_saved(id):
    if not current_user.is_authenticated:
        return jsonify({'message': 'You are not authenticated!'}), 401

    encrypted_data = SiteData.query.filter_by(id=id, user_id=current_user.id).first()
    if encrypted_data:
        master_key = load_master_key()
        password = decrypt_password(encrypted_data.password, master_key)
        if password:
            return jsonify({'password': password}), 200
        else:
            return jsonify({'message': 'An unexpected error has occurred'}), 500
    else:
        return jsonify({'message': 'Password not found'}), 404
# -------------------------------------------------------------------------------
# NOTES API

@main.route('/api/notes_saved', methods=['GET'])
@login_required
@requires_2fa
def notes_saved():
    try:
        if not current_user.is_authenticated:
            return jsonify({'message': 'You are not authenticated'}), 401

        saved_notes = Notes.query.filter_by(user_id=current_user.id).all()
        if not saved_notes:
            return jsonify({'message': 'There are no saved notes'}), 404
        notes = []
        for entry in saved_notes:
            notes.append({
                'id': entry.id,
                'date': entry.creation_date,
                'content': entry.content
            })
        app.logger.debug(notes)
        return jsonify({'notes': notes})

    except Exception as e:
        return jsonify({'message': 'An error occurred:' + str(e)}), 500

@main.route('api/save_note', methods=['POST'])
@login_required
@requires_2fa
def save_note():
    if not current_user.is_authenticated:
        return jsonify({'message': 'You are not authenticated!'}), 401

    data = request.json
    content = data.get('content')

    if not content:
        return jsonify({'message': 'Please fill out the required fields.'}), 400

    obj = datetime.now()
    now = obj.strftime('%d-%m-%Y')

    new_note = Notes(
        creation_date = now,
        content = content,
        user_id = current_user.id
    )

    try:
        db.session.add(new_note)
        db.session.commit()
        return jsonify({'message': 'Note saved successfully'}), 200
    except Exception as e:
        db.session.rollback()
        raise e

@main.route('api/delete-note/<int:id>', methods=['POST'])
@login_required
@requires_2fa
def delete_note(id):
    if not current_user.is_authenticated:
        return jsonify({'message': 'You are not authenticated!'}), 401

    note_to_delete = Notes.query.filter_by(id=id, user_id=current_user.id).first()
    if note_to_delete:
        try:
            db.session.delete(note_to_delete)
            db.session.commit()
            return jsonify({'message': 'Password deleted successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'An error as occurred' + str(e)}), 400
    else:
        return jsonify({'message': 'Note not found!'}), 404

@main.route('api/edit-note/<int:id>', methods=['POST'])
@login_required
@requires_2fa
def edit_note(id):
    if not current_user.is_authenticated:
        return jsonify({'message': 'You are not authenticated!'}), 401

    note_to_edit = Notes.query.filter_by(id=id, user_id=current_user.id).first()
    if not note_to_edit:
        return jsonify({'message': 'Note not found'}), 404

    data = request.json
    content = data.get('content')

    if content != '':
        note_to_edit.content = data['content']
        obj = datetime.now()
        now = obj.strftime('%d-%m-%Y')
        note_to_edit.creation_date = now

        try:
            db.session.commit()
            return jsonify({'message': 'Note modified successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'An error has occurred' + str(e)}), 400
    else:
        return jsonify({'message': 'Please fill out the required fields.'}), 400



app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
