from flask import Blueprint, jsonify
from db import failed_logins_collection  # Import from db.py
import datetime

# Define the blueprint
failed_logins_bp = Blueprint('failed_logins', __name__)

# Endpoint to retrieve all failed login attempts, aggregated by IP address
@failed_logins_bp.route('/failed-logins', methods=["GET"])
def get_failed_logins():
    try:
        # Aggregate failed login attempts by IP address
        pipeline = [
            {
                "$group": {
                    "_id": "$ip_address",  # Group by IP address
                    "usernames": {"$push": "$username"},  # Collect all usernames for this IP
                    "total_attempts": {"$sum": "$attempts"},  # Sum all attempts
                    "last_attempt": {"$max": "$last_attempt"},  # Get the most recent attempt
                    "blocked": {"$max": "$blocked"},  # If any entry is blocked, mark as blocked
                    "last_updated": {"$max": "$last_updated"}  # Most recent update
                }
            },
            {
                "$project": {
                    "ip_address": "$_id",
                    "usernames": 1,
                    "total_attempts": 1,
                    "last_attempt": 1,
                    "blocked": 1,
                    "last_updated": {"$ifNull": ["$last_updated", datetime.datetime.utcnow()]},
                    "_id": 0  # Exclude _id from the result
                }
            }
        ]
        
        # Execute the aggregation
        aggregated_data = list(failed_logins_collection.aggregate(pipeline))
        
        # Format the response
        failed_logins = [
            {
                "ip_address": row["ip_address"],
                "usernames": row["usernames"],  # List of usernames attempting from this IP
                "attempts": row["total_attempts"],  # Total attempts from this IP
                "last_attempt": row["last_attempt"].isoformat(),
                "blocked": row.get("blocked", False),
                "status": "Blocked" if row.get("blocked", False) else "Active",  # Dynamic status based on blocked
                "last_updated": row["last_updated"].isoformat()
            }
            for row in aggregated_data
        ]
        
        return jsonify({'failed_logins': failed_logins}), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching failed logins: {str(e)}'}), 500
