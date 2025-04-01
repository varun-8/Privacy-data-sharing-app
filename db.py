from pymongo import MongoClient
import sys
import traceback
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MongoDB connection string from environment variable
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://varunnn:root1@privatedb.36kkp.mongodb.net/")
DB_NAME = "data_sharing"

class Database:
    def __init__(self):
        """Initialize MongoDB connection."""
        try:
            self.client = MongoClient(MONGO_URI)
            self.db = self.client[DB_NAME]
            self.client.server_info()  # Test connection
            print("MongoDB connection successful")
            
            # Collections
            self.superadmin_collection = self.db["superadmin"]
            self.user_collection = self.db["user"]
            self.requests_collection = self.db["requests"]
            self.groups_collection = self.db["groups"]
            self.join_collection = self.db["joinrequests"]
            self.files_collection = self.db["files"]
            self.failed_logins_collection = self.db["failed_logins"]
            self.messages_collection = self.db["messages"]
            self.settings_collection = self.db["settings"]
            self.logs_collection = self.db["logs"]  # Added for logout and audit logs
            
            # Create indexes for performance
            self._create_indexes()
        except Exception as e:
            print(f"Failed to connect to MongoDB: {str(e)}")
            print(traceback.format_exc())
            input("Press Enter to exit...")
            sys.exit(1)

    def _create_indexes(self):
        """Create indexes for frequently queried fields."""
        try:
            self.superadmin_collection.create_index("email", unique=True)
            self.user_collection.create_index("email", unique=True)
            self.logs_collection.create_index("email")
            self.logs_collection.create_index("timestamp")
            self.failed_logins_collection.create_index("email")
            self.messages_collection.create_index("group_id")
            print("Indexes created successfully")
        except Exception as e:
            print(f"Warning: Failed to create indexes: {str(e)}")

    def close(self):
        """Close the MongoDB connection."""
        try:
            self.client.close()
            print("MongoDB connection closed")
        except Exception as e:
            print(f"Error closing MongoDB connection: {str(e)}")

    def ping(self):
        """Check if the connection is alive."""
        try:
            self.client.server_info()
            return True
        except Exception:
            return False

# Singleton instance
db_instance = Database()

# Export collections for use in app2.py
superadmin_collection = db_instance.superadmin_collection
user_collection = db_instance.user_collection
requests_collection = db_instance.requests_collection
groups_collection = db_instance.groups_collection
join_collection = db_instance.join_collection
files_collection = db_instance.files_collection
failed_logins_collection = db_instance.failed_logins_collection
messages_collection = db_instance.messages_collection
settings_collection = db_instance.settings_collection
logs_collection = db_instance.logs_collection  # Export logs_collection