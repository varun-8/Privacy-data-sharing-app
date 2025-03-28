from flask import Blueprint, jsonify, request
from db import failed_logins_collection
import datetime

ip_management_bp = Blueprint('ip_management', __name__)

# Helper function to check if IP is blocked
def is_ip_blocked(ip_address):
    blocked_entry = failed_logins_collection.find_one({"ip_address": ip_address, "blocked": True})
    return blocked_entry is not None

# Block IP Endpoint
@ip_management_bp.route('/block-ip', methods=["POST"])
def block_ip():
    try:
        data = request.json
        ip_address = data.get('ip_address')
        if not ip_address:
            return jsonify({'message': 'IP address is required'}), 400

        result = failed_logins_collection.update_many(
            {"ip_address": ip_address},
            {
                "$set": {
                    "blocked": True,
                    "status": "Not Active",
                    "last_updated": datetime.datetime.utcnow()
                }
            }
        )
        if result.matched_count == 0:
            failed_logins_collection.insert_one({
                "username": "unknown",
                "attempts": 0,
                "ip_address": ip_address,
                "last_attempt": datetime.datetime.utcnow(),
                "blocked": True,
                "status": "Not Active",
                "last_updated": datetime.datetime.utcnow()
            })
        return jsonify({'message': f'IP {ip_address} blocked successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Allow IP Endpoint
@ip_management_bp.route('/allow-ip', methods=["POST"])
def allow_ip():
    try:
        data = request.json
        ip_address = data.get('ip_address')
        if not ip_address:
            return jsonify({'message': 'IP address is required'}), 400

        result = failed_logins_collection.update_many(
            {"ip_address": ip_address},
            {
                "$set": {
                    "blocked": False,
                    "status": "Active",
                    "last_updated": datetime.datetime.utcnow()
                }
            }
        )
        if result.matched_count == 0:
            return jsonify({'message': f'No record found for IP {ip_address} to unblock'}), 404

        return jsonify({'message': f'IP {ip_address} allowed successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get Failed Logins
@ip_management_bp.route('/failed-logins', methods=["GET"])
def get_failed_logins():
    try:
        # Fetch all documents from the collection
        data = list(failed_logins_collection.find({}))
        failed_logins = [
            {
                "username": row["username"],
                "attempts": row["attempts"],
                "ip_address": row["ip_address"],
                "last_attempt": row["last_attempt"].isoformat(),
                "blocked": row.get("blocked", False),  # Ensure blocked is included
                "status": row.get("status", "Active"),  # Ensure status is included
                "last_updated": row.get("last_updated", datetime.datetime.utcnow()).isoformat()
            }
            for row in data
        ]
        return jsonify({"failed_logins": failed_logins}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500