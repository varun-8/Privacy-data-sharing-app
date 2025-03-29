from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import bcrypt
import datetime
import psutil  # For system metrics like uptime
import time
from bson.objectid import ObjectId
from cryptography.fernet import Fernet
import os
import io
from flask_mail import Mail, Message
from settings import settings_bp
from db import (superadmin_collection, user_collection, requests_collection, 
                groups_collection, join_collection, files_collection, 
                failed_logins_collection, messages_collection,settings_collection)  # Added messages_collection
from failed_logins import failed_logins_bp
from ip_management import ip_management_bp, is_ip_blocked
from groups import groups_bp
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = "aa72e7d7bfb592c8b5c124e4c6480c51550fd25628658c48b8450e0efc36c645"

# Register blueprints
app.register_blueprint(settings_bp)
app.register_blueprint(failed_logins_bp)
app.register_blueprint(ip_management_bp)
app.register_blueprint(groups_bp)






UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

SECRET_KEY = b'8Y2jSdzm8fczM8bcrxP5Y4bj9pDVjXdp4bdyPDIt2l8='
cipher_suite = Fernet(SECRET_KEY)

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'testmailalert20@gmail.com'
app.config['MAIL_PASSWORD'] = 'qwghdvduxumxjidk'  # Ensure this is a valid App Password
app.config['MAIL_DEFAULT_SENDER'] = 'datasecureemail@gmail.com'

mail = Mail(app)
CORS(app, supports_credentials=True)

# Password hashing helpers
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Super Admin Registration
@app.route('/superregister', methods=["POST"])
def sregister():
    try:
        data = request.json
        name, password, email = data.get('name'), data.get('password'), data.get('email')
        if not all([name, password, email]):
            return jsonify({'message': 'All fields are required'}), 400
        hashed_password = hash_password(password)
        superadmin_collection.insert_one({"name": name, "email": email, "password": hashed_password})
        return jsonify({'message': 'Super Admin Added Successfully!'}), 201
    except Exception as e:
        logger.error(f"Error in superregister: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

@app.route('/slogin', methods=["POST"])
def slogin():
    try:
        ip_address = request.remote_addr
        if is_ip_blocked(ip_address):
            return jsonify({'message': 'Your IP is blocked due to multiple failed login attempts'}), 403
        data = request.json
        email, password = data.get('email'), data.get('password')
        admin = superadmin_collection.find_one({"email": email})
        if admin and check_password(password, admin["password"]):
            failed_logins_collection.delete_one({"username": email})
            return jsonify({'message': 'Login successful'})
        else:
            # Failed login logic unchanged
            existing = failed_logins_collection.find_one({"username": email, "ip_address": ip_address})
            if existing:
                blocked_status = existing.get("blocked", False)
                failed_logins_collection.update_one(
                    {"username": email, "ip_address": ip_address},
                    {"$inc": {"attempts": 1}, "$set": {"last_attempt": datetime.datetime.utcnow(), "ip_address": ip_address, "blocked": blocked_status}}
                )
            else:
                failed_logins_collection.insert_one({
                    "username": email, "attempts": 1, "ip_address": ip_address,
                    "last_attempt": datetime.datetime.utcnow(), "blocked": False
                })
            return jsonify({'message': 'Incorrect email or password'}), 401
    except Exception as e:
        logger.error(f"Error in slogin: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

# User Registration and Login (unchanged logic, added logging)
@app.route('/userregister', methods=["POST"])
def userregister():
    try:
        data = request.json
        name, password, email = data.get('name'), data.get('password'), data.get('email')
        if not all([name, password, email]):
            return jsonify({'message': 'All fields are required'}), 400
        hashed_password = hash_password(password)
        user_collection.insert_one({"name": name, "email": email, "password": hashed_password})
        return jsonify({'message': 'User Added Successfully!'}), 201
    except Exception as e:
        logger.error(f"Error in userregister: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

@app.route('/userlogin', methods=["POST"])
def userlogin():
    try:
        ip_address = request.remote_addr
        if is_ip_blocked(ip_address):
            return jsonify({'message': 'Your IP is blocked due to multiple failed login attempts'}), 403
        data = request.json
        email, password = data.get('email'), data.get('password')
        user = user_collection.find_one({"email": email})
        if user and check_password(password, user["password"]):
            failed_logins_collection.delete_one({"username": email})
            return jsonify({'message': 'Login successful'})
        else:
            # Failed login logic unchanged
            existing = failed_logins_collection.find_one({"username": email, "ip_address": ip_address})
            if existing:
                blocked_status = existing.get("blocked", False)
                failed_logins_collection.update_one(
                    {"username": email, "ip_address": ip_address},
                    {"$inc": {"attempts": 1}, "$set": {"last_attempt": datetime.datetime.utcnow(), "ip_address": ip_address, "blocked": blocked_status}}
                )
            else:
                failed_logins_collection.insert_one({
                    "username": email, "attempts": 1, "ip_address": ip_address,
                    "last_attempt": datetime.datetime.utcnow(), "blocked": False
                })
            return jsonify({'message': 'Incorrect email or password'}), 401
    except Exception as e:
        logger.error(f"Error in userlogin: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500


@app.route('/requestCreate', methods=["POST"])
def requestCreate():
    try:
        data = request.json
        name, description, user_email = data.get('name'), data.get('description'), data.get('email')
        if not all([name, description, user_email]):
            return jsonify({'message': 'All fields are required!'}), 400
        requests_collection.insert_one({"name": name, "description": description, "user": user_email, "status": "pending"})
        return jsonify({'message': 'Group Request Sent Successfully!'}), 201
    except Exception as e:
        logger.error(f"Error in requestCreate: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500
    
@app.route('/getrequests', methods=["GET"])
def getAllRequests():
    try:
        data = list(requests_collection.find({}))
        requests = [{"gid": str(row['_id']), "name": row['name'], "description": row['description'], "user": row['user'], "status": row['status']} for row in data]
        return jsonify({'requests': requests})

    except Exception as e:
        return jsonify({'error': f'Error fetching requests: {str(e)}'}), 500

@app.route('/allowrequests/<string:request_id>/<string:user_email>', methods=["POST"])
def allowrequests(request_id, user_email):
    try:
        request_id_obj = ObjectId(request_id)
        request_data = requests_collection.find_one({"_id": request_id_obj})
        if not request_data:
            return jsonify({'message': 'Request not found'}), 404

        user_data = user_collection.find_one({"email": user_email})
        if not user_data:
            return jsonify({'message': 'User not found'}), 404

        if groups_collection.find_one({"name": request_data['name']}):
            return jsonify({'message': 'Group Already Exists'}), 409

        groups_collection.insert_one({
            "admin": user_email,
            "timestamp": datetime.datetime.utcnow(),
            "members": [ObjectId(user_data['_id'])],
            "name": request_data['name']
        })
        requests_collection.delete_one({"_id": request_id_obj})
        return jsonify({'message': 'Group Created Successfully'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/denyrequests/<string:request_id>/<string:user_email>', methods=["POST"])
def denyrequests(request_id, user_email):
    try:
        request_id_obj = ObjectId(request_id)
        request_data = requests_collection.find_one({"_id": request_id_obj})
        if not request_data:
            return jsonify({'message': 'Request not found'}), 404

        requests_collection.delete_one({"_id": request_id_obj})
        return jsonify({'message': 'Request Denied Successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users', methods=["GET"])
def get_users():
    try:
        data = list(user_collection.find({}))
        users = [{"id": str(row['_id']), "email": row['email'], "role": row.get('role', 'user')} for row in data]
        return jsonify({'users': users}), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching users: {str(e)}'}), 500

@app.route('/add-user', methods=["POST"])
def add_user():
    try:
        data = request.json
        email = data.get('email')
        role = data.get('role')

        if not all([email, role]):
            return jsonify({'message': 'Email and role are required'}), 400

        if user_collection.find_one({"email": email}):
            return jsonify({'message': 'User with this email already exists'}), 409

        hashed_password = hash_password("default123")
        user_collection.insert_one({
            "email": email,
            "role": role,
            "password": hashed_password,
            "name": email.split('@')[0]
        })
        return jsonify({'message': 'User Added Successfully'}), 201

    except Exception as e:
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

@app.route('/remove-user/<string:user_id>', methods=["DELETE"])
def remove_user(user_id):
    try:
        user_id_obj = ObjectId(user_id)
        user = user_collection.find_one({"_id": user_id_obj})
        if not user:
            return jsonify({'message': 'User not found'}), 404

        user_collection.delete_one({"_id": user_id_obj})
        groups_collection.update_many({"members": user_id_obj}, {"$pull": {"members": user_id_obj}})
        return jsonify({'message': 'User Removed Successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stats', methods=["GET"])
def get_stats():
    try:
        pending = requests_collection.count_documents({"status": "pending"})
        approved = groups_collection.count_documents({})
        rejected = requests_collection.count_documents({"status": "rejected"})
        return jsonify({
            'pending': pending,
            'approved': approved,
            'rejected': rejected
        }), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching stats: {str(e)}'}), 500

@app.route('/groups', methods=["GET"])
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
        return jsonify({'groups': groups}), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching groups: {str(e)}'}), 500

@app.route('/add-group', methods=["POST"])
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
        return jsonify({'message': 'Group Added Successfully'}), 201

    except Exception as e:
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

@app.route('/remove-group/<string:group_id>', methods=["DELETE"])
def remove_group(group_id):
    try:
        group_id_obj = ObjectId(group_id)
        group = groups_collection.find_one({"_id": group_id_obj})
        if not group:
            return jsonify({'message': 'Group not found'}), 404

        groups_collection.delete_one({"_id": group_id_obj})
        return jsonify({'message': 'Group Removed Successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/getallgroups/<string:cuser>', methods=["GET"])
def getallgroups(cuser):
    try:
        # Fetch groups excluding those where the user is admin
        groups = list(groups_collection.find({"admin": {"$ne": cuser}}))
        if not groups:
            return jsonify({'message': 'No groups found'}), 404

        # Process each group
        for group in groups:
            group['_id'] = str(group['_id'])
            group['members'] = [str(member) for member in group.get('members', [])]
            admin_email = group.get('admin', '')
            # Fetch admin's name from user_collection
            admin_user = user_collection.find_one({"email": admin_email})
            group['admin_name'] = admin_user['name'] if admin_user else 'Unknown'
            del group['admin']  # Remove email field if not needed

        return jsonify({'groups': groups}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/joinrequest/<string:cuser>/<string:groupId>', methods=["GET"])
def joinrequests(cuser, groupId):
    try:
        group = list(groups_collection.find({"_id": ObjectId(groupId)}))
        if not group:
            return jsonify({'message': 'Group not found.'}), 404

        existing_request = join_collection.find_one({'requestor': cuser, 'group': groupId})
        if existing_request:
            return jsonify({'message': 'You have already sent a request to this group.'})
        
        group_data = group[0]
        join_collection.insert_one({
            'requestor': cuser,
            'group': groupId,
            'status': 'Pending',
            'gname': group_data['name'],
            'gadmin': group_data['admin']
        })
        return jsonify({'message': 'Request Sent Successfully'}), 201

    except Exception as e:
        return jsonify({'error': 'An error occurred while processing the request.'}), 500
    
from flask import Blueprint, jsonify, request
from db import groups_collection, requests_collection

@app.route('/cancelrequest', methods=["POST"])
def cancel_request():
    try:
        data = request.get_json()
        user_email = data.get('user')
        request_id = data.get('requestId')

        if not user_email or not request_id:
            return jsonify({'message': 'User email and request ID are required'}), 400

        # Check if the request exists and belongs to the user
        req = requests_collection.find_one({"_id": ObjectId(request_id), "email": user_email})
        if not req:
            return jsonify({'message': 'Request not found or unauthorized'}), 404

        # Delete the request
        requests_collection.delete_one({"_id": ObjectId(request_id)})
        return jsonify({'message': 'Request canceled successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/getuserrequests/<string:cuser>', methods=["GET"])
def viewuserrequests(cuser):
    try:
        requests = list(join_collection.find({'requestor': cuser}))
        for request in requests:
            request['_id'] = str(request['_id'])
        return jsonify({'requests_with_groupnames': requests}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/getjoinrequests/<string:cuser>', methods=['GET'])
def viewjoinrequests(cuser):
    try:
        requests = list(join_collection.find({'gadmin': cuser}))
        for request in requests:
            request['_id'] = str(request['_id'])
        return jsonify({'requests_with_groupnames': requests}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/allowjoin/<string:gid>', methods=["GET"])
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
        
        return jsonify({'message': "User added to group successfully"}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Group Routes (only showing relevant ones)
@app.route('/getmygroups/<string:cuser>', methods=["GET"])
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

@app.route('/fileupload', methods=['POST'])
def fileupload():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if 'group' not in request.form or 'user' not in request.form:
            return jsonify({'error': 'Missing group or user metadata'}), 400

        file_data = file.read()
        encrypted_file_data = cipher_suite.encrypt(file_data)

        file_name = f"{file.filename}.enc"
        file_path = os.path.join(UPLOAD_FOLDER, file_name)

        with open(file_path, 'wb') as f:
            f.write(encrypted_file_data)

        metadata = request.form
        group = metadata.get('group', '')
        user = metadata.get('user', '')
        expiration_period = metadata.get('expiration_period', 'never')

        expiration_date = None
        if expiration_period != 'never':
            seconds = int(expiration_period)
            expiration_date = datetime.datetime.utcnow() + datetime.timedelta(seconds=seconds)

        file_metadata = {
            'file_name': file.filename,
            'encrypted_file_path': file_path,
            'mime_type': file.content_type,
            'group': group,
            'user': user,
            'upload_date': datetime.datetime.utcnow(),
            'expiration_date': expiration_date
        }

        if 'message' in metadata and metadata['message'].strip():
            file_metadata['message'] = metadata['message']

        files_collection.insert_one(file_metadata)

        return jsonify({'message': 'File uploaded and encrypted successfully!'}), 200

    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

        return jsonify({'error': str(e)}), 500
    


@app.route('/getfiles/<string:gid>', methods=["GET"])
def getfiles(gid):
    try:
        files = list(files_collection.find({"$or": [{"group_id": gid}, {"group": gid}]}).sort("upload_date", 1))
        file_list = []
        for file in files:
            decrypted_message = None
            if file.get('message'):
                try:
                    if isinstance(file['message'], str):
                        logger.warning(f"Message for file {str(file['_id'])} stored as string, converting to bytes")
                        message_bytes = file['message'].encode('utf-8')
                    else:
                        message_bytes = file['message']
                    decrypted_message = cipher_suite.decrypt(message_bytes).decode('utf-8')
                except Exception as e:
                    logger.error(f"Failed to decrypt message for file {str(file['_id'])}: {str(e)}")
                    decrypted_message = "[Decryption Failed]"
            
            user_info = user_collection.find_one({"email": file.get('user')})
            user_name = user_info.get('name', file.get('user')) if user_info else file.get('user')

            file_dict = {
                '_id': str(file['_id']),
                'file_name': file.get('file_name'),
                'encrypted_file_path': file.get('encrypted_file_path'),
                'mime_type': file.get('mime_type'),
                'group_id': file.get('group_id', file.get('group')),
                'group': file.get('group', file.get('group_id')),
                'user': file.get('user'),
                'user_name': user_name,
                'message': decrypted_message,
                'upload_date': file['upload_date'].isoformat()
            }
            file_list.append(file_dict)
        logger.info(f"Fetched {len(file_list)} items for group {gid}")
        return jsonify({'files': file_list}), 200
    except Exception as e:
        logger.error(f"Error in getfiles: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ... (Previous imports and setup remain unchanged)

@app.route('/getchatmessages/<string:gid>', methods=["GET"])
def get_chat_messages(gid):
    try:
        # Fetch the last 50 messages for the group, sorted by timestamp (latest first)
        messages = list(messages_collection.find({"group_id": gid})
                        .sort("timestamp", -1)
                        .limit(50))
        decrypted_messages = []
        for msg in messages:
            try:
                # Decrypt the message using Fernet
                decrypted_message = cipher_suite.decrypt(msg["message"].encode('utf-8')).decode('utf-8')
            except Exception as e:
                logger.error(f"Failed to decrypt message {str(msg['_id'])}: {str(e)}")
                decrypted_message = "[Decryption Failed]"

            # Handle timestamp gracefully
            timestamp = msg.get("timestamp")
            if timestamp and isinstance(timestamp, datetime.datetime):
                timestamp_str = timestamp.isoformat()
            else:
                # Fallback to current time if timestamp is missing or invalid
                timestamp_str = datetime.datetime.utcnow().isoformat()
                logger.warning(f"Invalid or missing timestamp for message {str(msg['_id'])}, using current time: {timestamp_str}")

            decrypted_messages.append({
                "_id": str(msg["_id"]),
                "group_id": msg["group_id"],
                "user": msg["user"],
                "message": decrypted_message,
                "timestamp": timestamp_str
            })
        logger.info(f"Fetched {len(decrypted_messages)} messages for group {gid}")
        return jsonify({"messages": decrypted_messages}), 200
    except Exception as e:
        logger.error(f"Error in get_chat_messages: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ... (Rest of the code remains unchanged)
@app.route('/sendchatmessage', methods=["POST"])
def send_chat_message():
    try:
        data = request.json
        group_id = data.get('group_id')
        user = data.get('user')
        message = data.get('message')

        if not all([group_id, user, message]):
            return jsonify({'message': 'Group ID, user, and message are required'}), 400

        # Encrypt the message using Fernet
        encrypted_message = cipher_suite.encrypt(message.encode('utf-8')).decode('utf-8')

        message_doc = {
            "group_id": group_id,
            "user": user,
            "message": encrypted_message,
            "timestamp": datetime.datetime.utcnow()
        }
        result = messages_collection.insert_one(message_doc)
        logger.info(f"Message sent successfully to group {group_id} by {user}, ID: {str(result.inserted_id)}")
        return jsonify({'message': 'Message sent successfully'}), 200
    except Exception as e:
        logger.error(f"Error in send_chat_message: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/download/<string:fid>/<string:cuser>', methods=["GET"])
def download(fid, cuser):
    try:
        file_metadata = files_collection.find_one({'_id': ObjectId(fid)})
        if not file_metadata:
            return jsonify({'error': 'File not found'}), 404

        encrypted_file_path = file_metadata.get('encrypted_file_path')
        if not os.path.exists(encrypted_file_path):
            return jsonify({'error': 'Encrypted file not found on server'}), 404

        with open(encrypted_file_path, 'rb') as f:
            encrypted_data = f.read()

        decrypted_file_data = cipher_suite.decrypt(encrypted_data)
        file_name = file_metadata['file_name']

        sender_email = app.config['MAIL_DEFAULT_SENDER']
        receiver_email = cuser
        subject = "Decrypted File"
        body = "Please find the decrypted file attached."

        msg = Message(subject=subject, sender=sender_email, recipients=[receiver_email])
        msg.body = body
        msg.attach(file_name, file_metadata['mime_type'], decrypted_file_data)

        mail.send(msg)

        return jsonify({'message': 'Decrypted file sent successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500
    
@app.route('/getrecentfiles/<string:cuser>', methods=["GET"])
def get_recent_files(cuser):
    try:
        # Find the user's ID
        user = user_collection.find_one({"email": cuser})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user_id = ObjectId(user['_id'])

        # Find groups the user is a member of
        user_groups = list(groups_collection.find({"members": user_id}))
        group_ids = [str(group['_id']) for group in user_groups]

        # Fetch recent files from those groups
        files = list(files_collection.find({"group_id": {"$in": group_ids}})
                     .sort("upload_date", -1)
                     .limit(5))  # Limit to 5 most recent files

        file_list = []
        for file in files:
            decrypted_message = None
            if file.get('message'):
                try:
                    message_bytes = file['message'] if isinstance(file['message'], bytes) else file['message'].encode('utf-8')
                    decrypted_message = cipher_suite.decrypt(message_bytes).decode('utf-8')
                except Exception as e:
                    logger.error(f"Failed to decrypt message for file {str(file['_id'])}: {str(e)}")
                    decrypted_message = "[Decryption Failed]"

            # Fetch user name instead of email
            uploader = user_collection.find_one({"email": file.get('user')})
            user_name = uploader.get('name', file.get('user')) if uploader else file.get('user')

            file_dict = {
                '_id': str(file['_id']),
                'file_name': file.get('file_name'),
                'group_id': file.get('group_id'),
                'user': file.get('user'),  # Keep email for reference
                'user_name': user_name,    # Display name instead of email
                'message': decrypted_message,
                'upload_date': file['upload_date'].isoformat()
            }
            file_list.append(file_dict)

        logger.info(f"Fetched {len(file_list)} recent files for user {cuser}")
        return jsonify({'files': file_list}), 200
    except Exception as e:
        logger.error(f"Error in get_recent_files: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/getusername/<string:cuser>', methods=["GET"])
def get_username(cuser):
    logger.info(f"Received request for cuser: {cuser}")
    try:
        # Case-insensitive query
        user = user_collection.find_one({"email": {"$regex": f"^{cuser}$", "$options": "i"}})
        if not user:
            logger.warning(f"No user found for email: {cuser}")
            return jsonify({'error': 'User not found'}), 404
        name = user.get('name', cuser.split('@')[0])
        logger.info(f"Found user with email: {cuser}, name: {name}")
        return jsonify({'name': name}), 200
    except Exception as e:
        logger.error(f"Error in get_username: {str(e)}")
        return jsonify({'error': str(e)}), 500
# In your Flask backend file

@app.route('/server-health', methods=["GET"])
def get_server_health():
    try:
        # Calculate server uptime
        boot_time = psutil.boot_time()
        current_time = time.time()
        uptime_seconds = current_time - boot_time
        uptime_hours = uptime_seconds / 3600
        uptime_percentage = min(100.0, (uptime_hours / (24 * 365)) * 100)

        # Count total users (regular users + superadmins)
        total_users_count = user_collection.count_documents({}) + superadmin_collection.count_documents({})

        health_data = {
            "uptime": round(uptime_percentage, 1),
            "active_users": total_users_count  # Renamed to total_users if preferred, but keeping as active_users for consistency
        }
        logger.info(f"Server health fetched: {health_data}")
        return jsonify(health_data), 200
    except Exception as e:
        logger.error(f"Error in get_server_health: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
# In file_cleanup.py, ensure this endpoint is present
@app.route('/download-local/<string:fid>', methods=["GET"])
def download_local(fid):
    try:
        file_metadata = files_collection.find_one({'_id': ObjectId(fid)})
        if not file_metadata:
            return jsonify({'error': 'File not found'}), 404

        encrypted_file_path = file_metadata.get('encrypted_file_path')
        if not os.path.exists(encrypted_file_path):
            return jsonify({'error': 'Encrypted file not found on server'}), 404

        with open(encrypted_file_path, 'rb') as f:
            encrypted_data = f.read()

        decrypted_file_data = cipher_suite.decrypt(encrypted_data)
        file_name = file_metadata['file_name']

        return send_file(
            io.BytesIO(decrypted_file_data),
            mimetype=file_metadata['mime_type'],
            as_attachment=True,
            download_name=file_name
        )
    except Exception as e:
        logging.error(f"Error in download_local: {str(e)}")
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

# Delete All Files
@app.route("/delete-all-files", methods=["DELETE"])
def delete_all_files():
    data = request.get_json()
    email = data.get("email")

   

    result = files_collection.delete_many({})
    return jsonify({"message": f"Deleted {result.deleted_count} files successfully"}), 200

# Generate API Key

    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)