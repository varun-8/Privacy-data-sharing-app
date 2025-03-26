from flask import Blueprint, jsonify, request
import bcrypt
from pymongo import MongoClient
import logging
from bson.objectid import ObjectId

# Blueprint for settings routes
settings_bp = Blueprint('settings', __name__)

# MongoDB setup (to be shared with app2.py)
MONGO_URI = "mongodb+srv://varunnn:root1@privatedb.36kkp.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client["data_sharing"]
superadmin_collection = db["superadmin"]

# Logging setup
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Helper function for password hashing
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Change Super Admin Password
@settings_bp.route('/change-superadmin-password', methods=["POST"])
def change_superadmin_password():
    try:
        data = request.json
        email = data.get('email')
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')

        if not all([email, current_password, new_password]):
            return jsonify({'message': 'All fields are required'}), 400

        admin = superadmin_collection.find_one({"email": email})
        if not admin:
            return jsonify({'message': 'Super Admin not found'}), 404

        if not check_password(current_password, admin["password"]):
            return jsonify({'message': 'Current password is incorrect'}), 401

        hashed_new_password = hash_password(new_password)
        superadmin_collection.update_one(
            {"email": email},
            {"$set": {"password": hashed_new_password}}
        )
        logger.info(f"Password changed for super admin: {email}")
        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        logger.error(f"Error in change_superadmin_password: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

# Placeholder for 2FA Toggle (future implementation)
@settings_bp.route('/toggle-2fa', methods=["POST"])
def toggle_2fa():
    try:
        data = request.json
        email = data.get('email')
        enable = data.get('enable', False)

        admin = superadmin_collection.find_one({"email": email})
        if not admin:
            return jsonify({'message': 'Super Admin not found'}), 404

        # Mock update (add 'twoFactorEnabled' field in real implementation)
        superadmin_collection.update_one(
            {"email": email},
            {"$set": {"twoFactorEnabled": enable}}
        )
        logger.info(f"2FA toggled to {enable} for super admin: {email}")
        return jsonify({'message': f'2FA {"enabled" if enable else "disabled"} successfully'}), 200

    except Exception as e:
        logger.error(f"Error in toggle_2fa: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500