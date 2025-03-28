from flask import Blueprint, jsonify
from bson.objectid import ObjectId
from db import groups_collection, user_collection

groups_bp = Blueprint('groups', __name__)

# Get user's groups
@groups_bp.route('/getmygroups/<string:email>', methods=["GET"])
def get_my_groups(email):
    try:
        # Find user by email
        user_data = user_collection.find_one({"email": email})
        if not user_data:
            return jsonify({'message': 'User not found'}), 404

        user_id = ObjectId(user_data['_id'])
        # Fetch groups where user is a member
        groups_data = list(groups_collection.find({"members": user_id}))
        if not groups_data:
            return jsonify({'message': 'No groups found for this user'}), 404

        # Prepare group data with member count
        groups = []
        for group in groups_data:
            group_info = {
                'id': str(group['_id']),
                'name': group['name'],
                'member_count': len(group.get('members', []))
            }
            groups.append(group_info)

        return jsonify({'groups': groups}), 200

    except Exception as e:
        return jsonify({'error': f'Error fetching groups: {str(e)}'}), 500

# Get group members with name and email
@groups_bp.route('/groupmembers/<string:gid>', methods=["GET"])
def get_group_members(gid):
    try:
        # Validate group ID
        try:
            group_id = ObjectId(gid)
        except Exception:
            return jsonify({'message': 'Invalid group ID'}), 400

        # Find group by ID
        group = groups_collection.find_one({"_id": group_id})
        if not group:
            return jsonify({'message': 'Group not found'}), 404

        # Fetch member details
        member_ids = group.get('members', [])
        members = []
        for member_id in member_ids:
            user = user_collection.find_one({"_id": member_id})
            if user:
                members.append({
                    'name': user.get('name', 'Unnamed'),  # Default to 'Unnamed' if name is missing
                    'email': user['email']
                })

        return jsonify({'members': members}), 200

    except Exception as e:
        return jsonify({'error': f'Error fetching group members: {str(e)}'}), 500