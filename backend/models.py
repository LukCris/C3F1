from cryptography.fernet import Fernet
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import pyotp
from flask_login import UserMixin

db = SQLAlchemy()
APP_NAME = "C3F1"
FERNET_KEY = "3rqqk0_twQhH0y2_G7a4UiMCP699H_PFq6uxQnsM2a4="
cipher_suite = Fernet(FERNET_KEY)

class SiteData(db.Model):  # Nuova classe per memorizzare le credenziali dei siti
    id = db.Column(db.Integer, primary_key=True)
    site = db.Column(db.String(150))  # Nome del sito (e.g., 'facebook.com')
    username = db.Column(db.String(150))  # Username associato al sito
    email = db.Column(db.String(150))  # Email associata al sito
    password = db.Column(db.LargeBinary)  # Password associata al sito
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Collegamento all'utente
    expiration_date = db.Column(db.DateTime, nullable=False)

    def __repr__(self):
        return f'<SiteData {self.site} for user {self.user_id}>'

class Notes(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    creation_date = db.Column(db.String(15), nullable=False)
    content = db.Column(db.String(300))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True)
    password = db.Column(db.String(150))
    email = db.Column(db.String(120), unique=True)
    site_data = db.relationship('SiteData', backref='user')
    notes = db.relationship('Notes', backref='user')
    created_at = db.Column(db.DateTime, nullable=False)
    is_two_factor_authentication_enabled = db.Column(
        db.Boolean, nullable=False, default=False)
    _otp_token = db.Column("otp_token",db.String, unique=True)

    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.password = password
        self.created_at = datetime.now()
        self.otp_token = pyotp.random_base32()

    @property
    def otp_token(self):
        if self._otp_token:
            try:
                return cipher_suite.decrypt(self._otp_token.encode()).decode()
            except Exception as e:
                print(f"Error decrypting OTP token: {e}")
                return None
        return None

    @otp_token.setter
    def otp_token(self, value):
        if value:  # Cifra il valore prima di salvarlo
            self._otp_token = cipher_suite.encrypt(value.encode()).decode()
        else:
            self._otp_token = None


    def get_authentication_setup_uri(self):
        return pyotp.TOTP(self.otp_token).provisioning_uri(
            name=self.username, issuer_name=APP_NAME)

    def is_otp_valid(self, user_otp):
        if not self.otp_token:
            raise ValueError("Token OTP not set or empty.")

        try:
            totp = pyotp.TOTP(self.otp_token)
            is_valid = totp.verify(user_otp)
            return is_valid
        except Exception as e:
            print(f"Error during OTP verification: {e}")
            return False