from flask import Blueprint, jsonify, request
from bson.objectid import ObjectId
from db import groups_collection, user_collection, join_collection
import datetime
import logging

# Blueprint for groups routes
groups_bp = Blueprint('groups', __name__)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Get all groups
@groups_bp.route('/groups', methods=["GET"])
def get_groups():
    try:
        data = list(groups_collection.find({}))
        groups = [{
            "id": str(row['_id']),
            "name": row.get('name', 'Unnamed Group'),
            "admin": row.get('admin', 'N/A'),
            "members": [str(member) for member in row.get('members', [])],
            "timestamp": row['timestamp'].isoformat() if 'timestamp' in row else datetime.datetime.utcnow().isoformat()
        } for row in data]
        logger.info(f"Fetched {len(groups)} groups")
        return jsonify({'groups': groups}), 200
    except Exception as e:
        logger.error(f"Error fetching groups: {str(e)}")
        return jsonify({'error': f'Error fetching groups: {str(e)}'}), 500

# Add a new group
@groups_bp.route('/add-group', methods=["POST"])
def add_group():
    try:
        data = request.json
        name = data.get('name')
        admin_email = data.get('admin_email')

        if not all([name, admin_email]):
            return jsonify({'message': 'Name and admin email are required'}), 400

        admin_user = user_collection.find_one({"email": admin_email})
        if not admin_user:
            return jsonify({'message': 'Admin user not found'}), 404

        if groups_collection.find_one({"name": name}):
            return jsonify({'message': 'Group with this name already exists'}), 409

        group_data = {
            "name": name,
            "admin": admin_email,
            "members": [ObjectId(admin_user['_id'])],
            "timestamp": datetime.datetime.utcnow()
        }
        groups_collection.insert_one(group_data)
        logger.info(f"Group '{name}' added successfully with admin {admin_email}")
        return jsonify({'message': 'Group Added Successfully'}), 201
    except Exception as e:
        logger.error(f"Error adding group: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

# Remove a group
@groups_bp.route('/remove-group/<string:group_id>', methods=["DELETE"])
def remove_group(group_id):
    try:
        group_id_obj = ObjectId(group_id)
        group = groups_collection.find_one({"_id": group_id_obj})
        if not group:
            return jsonify({'message': 'Group not found'}), 404

        groups_collection.delete_one({"_id": group_id_obj})
        logger.info(f"Group {group['name']} (ID: {group_id}) removed successfully")
        return jsonify({'message': 'Group Removed Successfully'}), 200
    except Exception as e:
        logger.error(f"Error removing group: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Get all groups excluding those where the user is admin
@groups_bp.route('/getallgroups/<string:cuser>', methods=["GET"])
def getallgroups(cuser):
    try:
        groups = list(groups_collection.find({"admin": {"$ne": cuser}}))
        if not groups:
            return jsonify({'message': 'No groups found'}), 404

        for group in groups:
            group['_id'] = str(group['_id'])
            group['members'] = [str(member) for member in group.get('members', [])]
            admin_email = group.get('admin', '')
            admin_user = user_collection.find_one({"email": admin_email})
            group['admin_name'] = admin_user['name'] if admin_user else 'Unknown'
            del group['admin']  # Remove email field if not needed

        logger.info(f"Fetched {len(groups)} groups for user {cuser} (excluding admin groups)")
        return jsonify({'groups': groups}), 200
    except Exception as e:
        logger.error(f"Error in getallgroups: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Send a join request
@groups_bp.route('/joinrequest/<string:cuser>/<string:groupId>', methods=["GET"])
def joinrequests(cuser, groupId):
    try:
        group = groups_collection.find_one({"_id": ObjectId(groupId)})
        if not group:
            return jsonify({'message': 'Group not found.'}), 404

        existing_request = join_collection.find_one({'requestor': cuser, 'group': groupId})
        if existing_request:
            return jsonify({'message': 'You have already sent a request to this group.'}), 400

        join_collection.insert_one({
            'requestor': cuser,
            'group': groupId,
            'status': 'Pending',
            'gname': group['name'],
            'gadmin': group['admin']
        })
        logger.info(f"Join request sent by {cuser} for group {groupId}")
        return jsonify({'message': 'Request Sent Successfully'}), 201
    except Exception as e:
        logger.error(f"Error in joinrequest: {str(e)}")
        return jsonify({'error': 'An error occurred while processing the request.'}), 500

# Get user's groups
@groups_bp.route('/getmygroups/<string:cuser>', methods=["GET"])
def getmygroups(cuser):
    try:
        user = user_collection.find_one({"email": cuser})
        if not user:
            return jsonify({'message': 'User not found'}), 404
        user_id = ObjectId(user['_id'])
        groups = list(groups_collection.find({"members": user_id}))
        group_list = [{
            "id": str(group['_id']),
            "name": group.get('name', 'Unnamed Group'),
            "member_count": len(group.get('members', []))
        } for group in groups]
        logger.info(f"Fetched {len(group_list)} groups for user {cuser}")
        return jsonify({'groups': group_list}), 200
    except Exception as e:
        logger.error(f"Error in getmygroups: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Get join requests for groups where the user is admin
@groups_bp.route('/getjoinrequests/<string:cuser>', methods=['GET'])
def viewjoinrequests(cuser):
    try:
        requests = list(join_collection.find({'gadmin': cuser}))
        for request in requests:
            request['_id'] = str(request['_id'])
        logger.info(f"Fetched {len(requests)} join requests for admin {cuser}")
        return jsonify({'requests_with_groupnames': requests}), 200
    except Exception as e:
        logger.error(f"Error in getjoinrequests: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Allow a join request
@groups_bp.route('/allowjoin/<string:gid>', methods=["GET"])
def allowjoin(gid):
    try:
        request = join_collection.find_one({"_id": ObjectId(gid)})
        if not request:
            return jsonify({'message': "Request not found"}), 404
        
        user = user_collection.find_one({'email': request['requestor']})
        if not user:
            return jsonify({'message': "User not found"}), 404
        
        group = groups_collection.find_one({"_id": ObjectId(request['group'])})
        if not group:
            return jsonify({'message': "Group not found"}), 404
        
        user_id = ObjectId(user['_id'])
        result = groups_collection.update_one(
            {"_id": ObjectId(request['group'])},
            {"$push": {"members": user_id}}
        )
        join_collection.delete_one({"_id": ObjectId(gid)})

        if result.modified_count == 0:
            return jsonify({'message': "Failed to add user to group members."}), 500
        
        logger.info(f"User {request['requestor']} added to group {request['group']} successfully")
        return jsonify({'message': "User added to group successfully"}), 200
    except Exception as e:
        logger.error(f"Error in allowjoin: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Get group members with name and email (previously in groups.py)
@groups_bp.route('/groupmembers/<string:gid>', methods=["GET"])
def get_group_members(gid):
    try:
        try:
            group_id = ObjectId(gid)
        except Exception:
            return jsonify({'message': 'Invalid group ID'}), 400

        group = groups_collection.find_one({"_id": group_id})
        if not group:
            return jsonify({'message': 'Group not found'}), 404

        member_ids = group.get('members', [])
        members = []
        for member_id in member_ids:
            user = user_collection.find_one({"_id": member_id})
            if user:
                members.append({
                    'name': user.get('name', 'Unnamed'),
                    'email': user['email']
                })

        logger.info(f"Fetched {len(members)} members for group {gid}")
        return jsonify({'members': members}), 200
    except Exception as e:
        logger.error(f"Error fetching group members: {str(e)}")
        return jsonify({'error': f'Error fetching group members: {str(e)}'}), 500