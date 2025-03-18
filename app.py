from flask import Flask, render_template, redirect, request, session, Response, jsonify
import pymysql.cursors
from flask_cors import CORS
import bcrypt
import datetime
import json



app = Flask(__name__)
app.secret_key = "Your Key"


# app.config['MAIL_SERVER'] = 'smtp.gmail.com'  
# app.config['MAIL_PORT'] = 587  
# app.config['MAIL_USE_TLS'] = True 
# app.config['MAIL_USE_SSL'] = False
# app.config['MAIL_USERNAME'] = 'testmailalert20@gmail.com'  
# app.config['MAIL_PASSWORD'] = 'qwghdvduxumxjidk'  
# app.config['MAIL_DEFAULT_SENDER'] = 'datasecureemail@gmail.com'  

# mail = Mail(app)

CORS(app, supports_credentials=True)  

MYSQL_HOST = 'localhost'   
MYSQL_USER = 'root'        
MYSQL_PASSWORD = ''  
MYSQL_DB = 'data_sharing'  

def get_db_connection():
    connection = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection

@app.route('/superregister', methods=["POST", "GET"])
def sregister():
    if request.method == "POST":
        try:
            name = request.json.get('name')
            password = request.json.get('password')
            email = request.json.get('email')

            if not name or not password or not email:
                return jsonify({'message': 'All fields are required'}), 400  
            
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            connection = get_db_connection()
            cursor = connection.cursor()

            cursor.execute("""
                INSERT INTO superadmin (name, password, email) 
                VALUES (%s, %s, %s)
            """, (name, hashed_password.decode('utf-8'), email))

            connection.commit()
            connection.close()

            return jsonify({'message': 'Super Admin Added Successfully!'}), 201  

        except Exception as e:
            return jsonify({'message': 'An error occurred', 'error': str(e)}), 500  

    return jsonify({'message': 'POST method required'}), 405  

@app.route('/slogin', methods=["GET","POST"])
def slogin():
    if request.method == "POST":
        email = request.json.get('email')
        password = request.json.get('password')

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT * from superadmin WHERE email = %s
        """,(email))

        data = cursor.fetchone()

        if data:
            hashed = data['password']
            if bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8')):
                return jsonify({'message': 'Login successful'})
            else:
                return jsonify({'message': 'Incorrect password'}) 
        else:
            return  jsonify({'message':'Admin not exists'})
    return jsonify({'message':'Error Occured'})

@app.route('/userregister', methods=["POST", "GET"])
def userregister():
    if request.method == "POST":
        try:
            name = request.json.get('name')
            password = request.json.get('password')
            email = request.json.get('email')

            if not name or not password or not email:
                return jsonify({'message': 'All fields are required'}), 400  
            
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            connection = get_db_connection()
            cursor = connection.cursor()

            cursor.execute("""
                INSERT INTO user (name, email, password) 
                VALUES (%s, %s, %s)
             """, (name, email, hashed_password.decode('utf-8')))
            connection.commit()
            connection.close()

            return jsonify({'message': 'User Added Successfully!'}), 201  

        except Exception as e:
            return jsonify({'message': 'An error occurred', 'error': str(e)}), 500  

    return jsonify({'message': 'POST method required'}), 405  


@app.route('/userlogin', methods=["GET","POST"])
def userlogin():
    if request.method == "POST":
        email = request.json.get('email')
        password = request.json.get('password')

        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT * from user WHERE email = %s
        """,(email))

        data = cursor.fetchone()

        if data:
            hashed = data['password']
            if bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8')):
                return jsonify({'message': 'Login successful'})
            else:
                return jsonify({'message': 'Incorrect password'}) 
        else:
            return  jsonify({'message':'user not exists'})
    return jsonify({'message':'Error Occured'})


@app.route('/requestCreate', methods=["GET", "POST"])
def requestCreate():
    if request.method == "POST":
        name = request.json.get('name')
        description = request.json.get('description')
        user = request.json.get('email')

        if not name or not description or not user:
            return jsonify({'message': 'All fields are required!'}), 400

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO requests (name, description, user, status) 
                VALUES (%s, %s, %s, %s)
            """, (name, description, user, "pending"))

            conn.commit()

            cursor.close()
            conn.close()

            return jsonify({'message': 'Group Request Sent Successfully!'}), 201

        except Exception as e:
            conn.rollback()
            return jsonify({'message': f'Error: {str(e)}'}), 500

    return jsonify({'message': 'Only POST requests are allowed!'}), 405


@app.route('/getrequests', methods=["GET", "POST"])
def getAllRequests():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
        SELECT * FROM requests
        """)
        
        data = cursor.fetchall()

        requests = []
        for row in data:
            requests.append({
                'gid':row['gid'],
                'name': row['name'],
                'description': row['description'],
                'user': row['user'],
                'status': row['status']
            })

        cursor.close()
        conn.close()

        return jsonify({'requests': requests})

    except Exception as e:
        return jsonify({'error': f'Error fetching requests: {str(e)}'}), 500
    

@app.route('/allowrequests/<int:gid>/<string:user>', methods=["GET", "POST"])
def allowrequests(gid, user):
    if request.method == "POST":
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM requests WHERE gid=%s
        """, (gid,))
        request_data = cursor.fetchone()

        if not request_data:
            return jsonify({'message': 'Request not found'}), 404
        
        cursor.execute("""
            SELECT * FROM user WHERE email=%s
        """, (user,))
        user_data = cursor.fetchone()

        if not user_data:
            return jsonify({'message': 'User not found'}), 404

        cursor.execute("""
            SELECT * FROM groups WHERE name=%s
        """, (request_data['name']))
        check = cursor.fetchone()

        if check:
            return jsonify({'message': 'Group Already Exists'})
        
        members_data = json.dumps([user_data['id']])  
        cursor.execute("""
            INSERT INTO groups(admin, timestamp, members, name) 
            VALUES (%s, %s, %s, %s)
        """, (user, datetime.date.today(), members_data, request_data['name']))
        conn.commit()

        cursor.execute("""
            DELETE FROM requests WHERE gid=%s
        """, (gid,))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({'message': 'Group Created Successfully'}), 201

    return jsonify({'message': 'POST Only'}), 405


import json
import json
@app.route('/getmygroups/<string:email>', methods=["GET", "POST"])
def getmygroups(email):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""SELECT * FROM user WHERE email=%s""", (email,))
    data = cursor.fetchone()

    if not data:
        return jsonify({'message': 'User not found'}), 404

    user_id = data['id']

    cursor.execute("""SELECT * FROM groups""")
    groups_data = cursor.fetchall()

    if not groups_data:
        return jsonify({'message': 'No groups found for this user'}), 404

    groups = []
    for group in groups_data:
        members = json.loads(group['members'])  
        if user_id in members:
            groups.append({
                'id': group['groupid'],
                'name': group['name'],
            })

    if not groups:
        return jsonify({'message': 'No groups found for this user'}), 404

    return jsonify({'groups': groups}), 200




    

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
