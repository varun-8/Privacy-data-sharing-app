from flask import Blueprint, jsonify
from db import failed_logins_collection  # Import from db.py
import datetime

# Define the blueprint
failed_logins_bp = Blueprint('failed_logins', __name__)

# Endpoint to retrieve failed login attempts
@failed_logins_bp.route('/failed-logins', methods=["GET"])
def get_failed_logins():
    try:
        # Fetch failed logins with more than 3 attempts (adjust threshold as needed)
        data = list(failed_logins_collection.find({"attempts": {"$gte": 3}}))
        failed_logins = [{
            "username": row["username"],
            "attempts": row["attempts"],
            "ip_address": row["ip_address"],
            "last_attempt": row["last_attempt"].isoformat()  # Convert datetime to ISO string for JSON
        } for row in data]
        print(f"Returning failed logins: {failed_logins}")
        return jsonify({'failed_logins': failed_logins}), 200
    except Exception as e:
        print(f"Error in get_failed_logins: {str(e)}")
        return jsonify({'error': f'Error fetching failed logins: {str(e)}'}), 500