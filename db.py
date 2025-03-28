from pymongo import MongoClient
import sys
import traceback

MONGO_URI = "mongodb+srv://varunnn:root1@privatedb.36kkp.mongodb.net/"
try:
    client = MongoClient(MONGO_URI)
    db = client["data_sharing"]
    client.server_info()
    print("MongoDB connection successful")
except Exception as e:
    print(f"Failed to connect to MongoDB: {str(e)}")
    print(traceback.format_exc())
    input("Press Enter to exit...")
    sys.exit(1)

# Collections
superadmin_collection = db["superadmin"]
user_collection = db["user"]
requests_collection = db["requests"]
groups_collection = db["groups"]
join_collection = db["joinrequests"]
files_collection = db["files"]
failed_logins_collection = db["failed_logins"]
    