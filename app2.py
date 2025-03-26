from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import bcrypt
import datetime
from bson.objectid import ObjectId
import traceback
import sys
from cryptography.fernet import Fernet
import os
import logging
import io
from flask_mail import Mail, Message
from settings import settings_bp  # Import the settings Blueprint (assuming it exists)
from db import (superadmin_collection, user_collection, requests_collection, 
                groups_collection, join_collection, files_collection, 
                failed_logins_collection)  # Import collections from db.py
from failed_logins import failed_logins_bp  # Import the failed logins Blueprint

app = Flask(__name__)
app.secret_key = "aa72e7d7bfb592c8b5c124e4c6480c51550fd25628658c48b8450e0efc36c645"

# Register blueprints
app.register_blueprint(settings_bp)  # Remove this if settings.py doesn’t exist
app.register_blueprint(failed_logins_bp)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

SECRET_KEY = b'8Y2jSdzm8fczM8bcrxP5Y4bj9pDVjXdp4bdyPDIt2l8='
cipher_suite = Fernet(SECRET_KEY)

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'testmailalert20@gmail.com'
app.config['MAIL_PASSWORD'] = 'qwghdvduxumxjidk'
app.config['MAIL_DEFAULT_SENDER'] = 'datasecureemail@gmail.com'

mail = Mail(app)

CORS(app, supports_credentials=True)

# Helper function for password hashing
def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Super Admin Registration
@app.route('/superregister', methods=["POST"])
def sregister():
    try:
        data = request.json
        name = data.get('name')
        password = data.get('password')
        email = data.get('email')

        if not all([name, password, email]):
            return jsonify({'message': 'All fields are required'}), 400

        hashed_password = hash_password(password)
        superadmin_collection.insert_one({"name": name, "email": email, "password": hashed_password})
        return jsonify({'message': 'Super Admin Added Successfully!'}), 201

    except Exception as e:
        print(f"Error in superregister: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

# Super Admin Login with Failed Attempt Tracking
@app.route('/slogin', methods=["POST"])
def slogin():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        ip_address = request.remote_addr

        admin = superadmin_collection.find_one({"email": email})
        if admin and check_password(password, admin["password"]):
            failed_logins_collection.delete_one({"username": email})
            return jsonify({'message': 'Login successful'})
        else:
            existing = failed_logins_collection.find_one({"username": email})
            if existing:
                failed_logins_collection.update_one(
                    {"username": email},
                    {
                        "$inc": {"attempts": 1},
                        "$set": {"last_attempt": datetime.datetime.utcnow(), "ip_address": ip_address}
                    }
                )
            else:
                failed_logins_collection.insert_one({
                    "username": email,
                    "attempts": 1,
                    "ip_address": ip_address,
                    "last_attempt": datetime.datetime.utcnow()
                })
            return jsonify({'message': 'Incorrect email or password'}), 401

    except Exception as e:
        print(f"Error in slogin: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

# User Registration
@app.route('/userregister', methods=["POST"])
def userregister():
    try:
        data = request.json
        name = data.get('name')
        password = data.get('password')
        email = data.get('email')

        if not all([name, password, email]):
            return jsonify({'message': 'All fields are required'}), 400

        hashed_password = hash_password(password)
        user_collection.insert_one({"name": name, "email": email, "password": hashed_password})
        return jsonify({'message': 'User Added Successfully!'}), 201

    except Exception as e:
        print(f"Error in userregister: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

# User Login with Failed Attempt Tracking
@app.route('/userlogin', methods=["POST"])
def userlogin():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        ip_address = request.remote_addr

        user = user_collection.find_one({"email": email})
        if user and check_password(password, user["password"]):
            failed_logins_collection.delete_one({"username": email})
            return jsonify({'message': 'Login successful'})
        else:
            existing = failed_logins_collection.find_one({"username": email})
            if existing:
                failed_logins_collection.update_one(
                    {"username": email},
                    {
                        "$inc": {"attempts": 1},
                        "$set": {"last_attempt": datetime.datetime.utcnow(), "ip_address": ip_address}
                    }
                )
            else:
                failed_logins_collection.insert_one({
                    "username": email,
                    "attempts": 1,
                    "ip_address": ip_address,
                    "last_attempt": datetime.datetime.utcnow()
                })
            return jsonify({'message': 'Incorrect email or password'}), 401

    except Exception as e:
        print(f"Error in userlogin: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

# Remaining endpoints (unchanged)
@app.route('/requestCreate', methods=["POST"])
def requestCreate():
    try:
        data = request.json
        name = data.get('name')
        description = data.get('description')
        user_email = data.get('email')

        if not all([name, description, user_email]):
            return jsonify({'message': 'All fields are required!'}), 400

        requests_collection.insert_one({
            "name": name,
            "description": description,
            "user": user_email,
            "status": "pending"
        })
        return jsonify({'message': 'Group Request Sent Successfully!'}), 201

    except Exception as e:
        print(f"Error in requestCreate: {str(e)}")
        return jsonify({'message': 'An error occurred', 'error': str(e)}), 500

@app.route('/getrequests', methods=["GET"])
def getAllRequests():
    try:
        data = list(requests_collection.find({}))
        requests = [{"gid": str(row['_id']), "name": row['name'], "description": row['description'], "user": row['user'], "status": row['status']} for row in data]
        print(f"Returning requests: {requests}")
        return jsonify({'requests': requests})

    except Exception as e:
        print(f"Error in getrequests: {str(e)}")
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
        print(f"Error in allowrequests: {str(e)}")
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
        print(f"Error in denyrequests: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/getmygroups/<string:email>', methods=["GET"])
def getmygroups(email):
    try:
        user_data = user_collection.find_one({"email": email})
        if not user_data:
            return jsonify({'message': 'User not found'})

        user_id = ObjectId(user_data['_id'])
        groups_data = list(groups_collection.find({"members": user_id}))
        if not groups_data:
            return jsonify({'message': 'No groups found for this user'})

        groups = [{'id': str(group['_id']), 'name': group['name']} for group in groups_data]
        print(f"Returning groups for {email}: {groups}")
        return jsonify({'groups': groups}), 200

    except Exception as e:
        print(f"Error in getmygroups: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/users', methods=["GET"])
def get_users():
    try:
        data = list(user_collection.find({}))
        users = [{"id": str(row['_id']), "email": row['email'], "role": row.get('role', 'user')} for row in data]
        print(f"Returning users: {users}")
        return jsonify({'users': users}), 200
    except Exception as e:
        print(f"Error in get_users: {str(e)}")
        print(traceback.format_exc())
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
        print(f"Error in add_user: {str(e)}")
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
        print(f"Error in remove_user: {str(e)}")
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
        print(f"Error in get_stats: {str(e)}")
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
        print(f"Returning groups: {groups}")
        return jsonify({'groups': groups}), 200
    except Exception as e:
        print(f"Error in get_groups: {str(e)}")
        print(traceback.format_exc())
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
        print(f"Error in add_group: {str(e)}")
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
        print(f"Error in remove_group: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/getallgroups/<string:cuser>', methods=["GET"])
def getallgroups(cuser):
    try:
        groups = list(groups_collection.find({"admin": {"$ne": cuser}}))
        
        if len(groups) == 0:
            return jsonify({'message': 'No groups found'}), 404

        for group in groups:
            group['_id'] = str(group['_id'])
            group['members'] = [str(member) for member in group['members']]

        print(f"Returning groups: {groups}")
        return jsonify({'groups': groups}), 200
    except Exception as e:
        print(f"Error in getallgroups: {str(e)}")
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
        print(f"Error in joinrequests: {str(e)}")
        return jsonify({'error': 'An error occurred while processing the request.'}), 500

@app.route('/getuserrequests/<string:cuser>', methods=["GET"])
def viewuserrequests(cuser):
    try:
        requests = list(join_collection.find({'requestor': cuser}))
        for request in requests:
            request['_id'] = str(request['_id'])
        print(f"Returning user requests: {requests}")
        return jsonify({'requests_with_groupnames': requests}), 200
    except Exception as e:
        print(f"Error in viewuserrequests: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/getjoinrequests/<string:cuser>', methods=['GET'])
def viewjoinrequests(cuser):
    try:
        requests = list(join_collection.find({'gadmin': cuser}))
        for request in requests:
            request['_id'] = str(request['_id'])
        print(f"Returning join requests: {requests}")
        return jsonify({'requests_with_groupnames': requests}), 200
    except Exception as e:
        print(f"Error in viewjoinrequests: {str(e)}")
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
        print(f"Error in allowjoin: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/fileupload', methods=['POST'])
def fileupload():
    try:
        logging.debug(f"Request headers: {request.headers}")
        logging.debug(f"Request files: {request.files}")
        logging.debug(f"Request form data: {request.form}")

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
        logging.error(f"Error in fileupload: {str(e)}")
        logging.error("Exception details:", exc_info=True)
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/getfiles/<string:gid>', methods=["GET"])
def getfiles(gid):
    try:
        files = list(files_collection.find({"group": gid}))
        file_list = []
        for file in files:
            file['_id'] = str(file['_id'])
            file_list.append(file)
        print(f"Returning files: {file_list}")
        return jsonify({'files': file_list}), 200
    except Exception as e:
        print(f"Error in getfiles: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/download/<string:fid>/<string:cuser>', methods=["GET"])
def download(fid, cuser):
    try:
        logging.debug(f"Attempting to download file with ID: {fid}")

        file_metadata = files_collection.find_one({'_id': ObjectId(fid)})
        if not file_metadata:
            logging.error(f"File with ID {fid} not found in database.")
            return jsonify({'error': 'File not found'}), 404

        encrypted_file_path = file_metadata.get('encrypted_file_path')
        if not os.path.exists(encrypted_file_path):
            logging.error(f"Encrypted file not found at {encrypted_file_path}")
            return jsonify({'error': 'Encrypted file not found on server'}), 404

        with open(encrypted_file_path, 'rb') as f:
            encrypted_data = f.read()

        decrypted_file_data = cipher_suite.decrypt(encrypted_data)
        file_name = f"{file_metadata['file_name']}.pdf"

        decrypted_file_io = io.BytesIO(decrypted_file_data)
        decrypted_file_io.seek(0)

        sender_email = "your_email@example.com"
        receiver_email = cuser
        subject = "Decrypted File"
        body = "Please find the decrypted file attached."

        msg = Message(subject=subject, recipients=[receiver_email])
        msg.body = body
        msg.attach(file_name, 'application/pdf', decrypted_file_data)

        mail.send(msg)

        logging.info(f"Decrypted file sent successfully to {receiver_email}")
        return jsonify({'message': 'Decrypted file sent successfully'}), 200

    except Exception as e:
        logging.error(f"Error in file download and email send: {str(e)}")
        logging.error("Exception details:", exc_info=True)
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except Exception as e:
        print(f"Error starting Flask app: {str(e)}")
        print(traceback.format_exc())
        input("Press Enter to exit...")