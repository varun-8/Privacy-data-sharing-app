from flask import Blueprint, jsonify, request
from db import superadmin_collection, user_collection, files_collection, settings_collection
from utils import hash_password, check_password, logger  # Import from utils.py
import secrets
import datetime

settings_bp = Blueprint('settings', __name__)

# Change Superadmin Password
@settings_bp.route('/change-superadmin-password', methods=["POST"])
def change_superadmin_password():
    try:
        data = request.json
        email = data.get('email')
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')

        if not all([email, current_password, new_password]):
            return jsonify({'message': 'Email, current password, and new password are required'}), 400

        admin = superadmin_collection.find_one({"email": email})
        if not admin:
            return jsonify({'message': 'Superadmin not found'}), 404

        if not check_password(current_password, admin['password']):
            return jsonify({'message': 'Current password is incorrect'}), 401

        hashed_new_password = hash_password(new_password)
        superadmin_collection.update_one(
            {"email": email},
            {"$set": {"password": hashed_new_password}}
        )
        logger.info(f"Password changed for superadmin: {email}")
        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        logger.error(f"Error in change_superadmin_password: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

# Delete All Files
@settings_bp.route('/delete-all-files', methods=["DELETE"])
def delete_all_files():
    try:
        data = request.json
        email = data.get('email')

        if not email:
            return jsonify({'message': 'Email is required for authorization'}), 400

        admin = superadmin_collection.find_one({"email": email})
        if not admin:
            return jsonify({'message': 'Unauthorized: Superadmin access required'}), 403

        result = files_collection.delete_many({})
        logger.info(f"Deleted {result.deleted_count} files by superadmin: {email}")
        return jsonify({"message": f"Deleted {result.deleted_count} files successfully"}), 200

    except Exception as e:
        logger.error(f"Error in delete_all_files: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

# Generate API Key
@settings_bp.route('/generate-api-key', methods=["POST"])
def generate_api_key():
    try:
        data = request.json
        email = data.get('email')

        if not email:
            return jsonify({'message': 'Email is required for authorization'}), 400

        admin = superadmin_collection.find_one({"email": email})
        if not admin:
            return jsonify({'message': 'Unauthorized: Superadmin access required'}), 403

        api_key = secrets.token_hex(16)
        superadmin_collection.update_one(
            {"email": email},
            {"$set": {"api_key": api_key}}
        )
        logger.info(f"API key generated for superadmin: {email}")
        return jsonify({'message': 'API key generated successfully', 'apiKey': api_key}), 200

    except Exception as e:
        logger.error(f"Error in generate_api_key: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

# Set Data Retention Policy
@settings_bp.route('/set-retention-policy', methods=["POST"])
def set_retention_policy():
    try:
        data = request.json
        email = data.get('email')
        days = data.get('days')

        if not email:
            return jsonify({'message': 'Email is required for authorization'}), 400
        if not isinstance(days, int) or days <= 0:
            return jsonify({'message': 'Days must be a positive integer'}), 400

        admin = superadmin_collection.find_one({"email": email})
        if not admin:
            return jsonify({'message': 'Unauthorized: Superadmin access required'}), 403

        settings_collection.update_one(
            {"setting_type": "data_retention"},
            {"$set": {
                "days": days,
                "updated_by": email,
                "updated_at": datetime.datetime.utcnow()
            }},
            upsert=True
        )
        logger.info(f"Data retention policy set to {days} days by superadmin: {email}")
        return jsonify({'message': f"Data retention policy set to {days} days"}), 200

    except Exception as e:
        logger.error(f"Error in set_retention_policy: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500