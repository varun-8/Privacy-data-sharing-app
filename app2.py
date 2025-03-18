from flask import Flask, render_template, redirect, request, session, Response, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
import bcrypt
from bson.objectid import ObjectId

app = Flask(__name__)
app.secret_key = "Your Key"

CORS(app, supports_credentials=True)

#H0lDrWCglSvQISDL
app.config["MONGO_URI"] = "mongodb+srv://mithunkaruppusamy3:H0lDrWCglSvQISDL@cluster1.5slpq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1"  

mongo = PyMongo(app)

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

            mongo.db.superadmin.insert_one({
                'name': name,
                'password': hashed_password.decode('utf-8'),
                'email': email
            })

            return jsonify({'message': 'Super Admin Added Successfully!'}), 201  

        except Exception as e:
            return jsonify({'message': 'An error occurred', 'error': str(e)}), 500  

    return jsonify({'message': 'POST method required'}), 405  

@app.route('/slogin', methods=["GET","POST"])
def slogin():
    if request.method == "POST":
        email = request.json.get('email')
        password = request.json.get('password')

        user = mongo.db.superadmin.find_one({'email': email})

        if user:
            hashed = user['password']
            if bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8')):
                return jsonify({'message': 'Login successful'})
            else:
                return jsonify({'message': 'Incorrect password'}) 
        else:
            return jsonify({'message':'Admin not exists'})

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

            mongo.db.user.insert_one({
                'name': name,
                'email': email,
                'password': hashed_password.decode('utf-8')
            })
            
            return jsonify({'message': 'User Added Successfully!'}), 201  

        except Exception as e:
            return jsonify({'message': 'An error occurred', 'error': str(e)}), 500  

    return jsonify({'message': 'POST method required'}), 405  

@app.route('/userlogin', methods=["GET", "POST"])
def userlogin():
    if request.method == "POST":
        email = request.json.get('email')
        password = request.json.get('password')

        user = mongo.db.user.find_one({'email': email})

        if user:
            hashed = user['password']
            if bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8')):
                return jsonify({'message': 'Login successful'})
            else:
                return jsonify({'message': 'Incorrect password'}) 
        else:
            return jsonify({'message':'User not exists'})

    return jsonify({'message':'Error Occured'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
