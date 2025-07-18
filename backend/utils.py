from datetime import timedelta, datetime

from cryptography.fernet import Fernet, InvalidToken
from flask_login import current_user
from qrcode.image.pil import PilImage
from werkzeug.security import generate_password_hash, check_password_hash
from io import BytesIO
from base64 import b64encode
from backend.models import SiteData, db
import os, qrcode, hashlib, re, requests

KEY_FILE = 'master_key.key'
ROCKYOU_FILE = 'rockyou.txt'
HIBP_API_URL = "https://api.pwnedpasswords.com/range/"

def generate_master_key():
    key = Fernet.generate_key()
    with open(KEY_FILE, 'wb') as key_file:
        key_file.write(key)
    return key

def load_master_key():
    if os.path.isfile(KEY_FILE):
        with open(KEY_FILE, 'rb') as key_file:
            return key_file.read()
    return generate_master_key()

def encrypt_password(data, key):
    fernet = Fernet(key)
    return fernet.encrypt(data.encode())

def decrypt_password(data, key):
    try:
        fernet = Fernet(key)
        decrypted_data = fernet.decrypt(data).decode()
        return decrypted_data
    except InvalidToken as e:
        raise ValueError(f"Decryption failed. Invalid data or key: {e}")
    except Exception as e:
        raise ValueError(f"An unexpected error occurred during decryption: {e}")

def hash_password(password):
    return generate_password_hash(password)

def check_password(hashed_password, password):
    return check_password_hash(hashed_password, password)

def save_site_data(site, username, email, password, master_key):
    if not current_user.is_authenticated:
        raise Exception('User must be logged')

    encrypted_password = encrypt_password(password, master_key)

    expiration_period_days = 90
    expiration_date = datetime.now() + timedelta(days=expiration_period_days)

    new_entry = SiteData(
        site = site,
        username = username,
        email = email,
        password = encrypted_password,
        user_id = current_user.id,
        expiration_date = expiration_date
    )

    try:
        db.session.add(new_entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e

def get_b64encoded_qr_image(data):
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white", image_factory=PilImage)
    buffered = BytesIO()
    img.save(buffered)
    return b64encode(buffered.getvalue()).decode("utf-8")

# FUNZIONE PER CONTROLLARE DI NON AVERE UNA PASSWORD PRESENTE NELLA LISTA rockYou
def search_weak_password(password):
    try:
        with open(ROCKYOU_FILE, 'r', encoding='latin-1') as rockyou:
            for line in rockyou:
                if line.strip() == password:
                    return True
        return False
    except Exception as e:
        return str(e)

def control_password(password):
    # Controllo la lunghezza minima della password
    is_length_valid = len(password) >= 8

    # Controllo se la password contiene almeno una lettera maiuscola
    has_uppercase = any(char.isupper() for char in password)

    # Controllo se la password contiene almeno un numero
    has_digit = any(char.isdigit() for char in password)

    # Controllo se la password contiene almeno un carattere speciale
    has_special_char = re.search(r"[!@#$%^&*(),.?\":{}|<>]", password)

    if not is_length_valid:
        return 'Password must contain at least 8 characters.'
    elif not has_uppercase:
        return 'Password must contain at least 1 uppercase letter.'
    elif not has_digit:
        return 'Password must contain at least 1 digit.'
    elif not has_special_char:
        return 'Password must contain at least 1 special character.'
    else: return 'Password respect all the constraints.'

def check_pwned(password):
    """
         L'API di Pwned Passwords utilizza il metodo k-Anonymity per non inviare l'intera password in chiaro e richiede
         anche solo i primi 5 caratteri. Quindi, creo un hash SHA-1 della password e invio solo i primi 5 caratteri.
         Faccio una richiesta GET e ricevo una lista di hash che iniziano con quei 5 caratteri, insieme al numero
         di volte che ciascuno è stato compromesso.
    """
    # Creo un hash SHA-1 della password
    sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    prefix = sha1_hash[:5]
    suffix = sha1_hash[5:]

    # Effettuo la richiesta a HIBP
    response = requests.get(HIBP_API_URL + prefix)

    if response.status_code == 200:
        # Controllo se il suffisso è presente nei risultati
        hashes = response.text.splitlines()
        for h in hashes:
            h_suffix, count = h.split(':')
            if h_suffix == suffix:
                return int(count)
        return 0
    else:
        raise Exception('An unexpected error occurred.')