from pymongo import MongoClient
import os
import datetime
import logging
import time

# MongoDB setup
MONGO_URI = "mongodb+srv://varunnn:root1@privatedb.36kkp.mongodb.net/"
client = MongoClient(MONGO_URI)
db = client["data_sharing"]
files_collection = db["files"]

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Cleanup function for expired files
def cleanup_expired_files():
    while True:
        try:
            current_time = datetime.datetime.utcnow()
            expired_files = files_collection.find({
                "expiration_date": {"$ne": None, "$lt": current_time}
            })

            for file in expired_files:
                file_id = file["_id"]
                file_path = file["encrypted_file_path"]

                if os.path.exists(file_path):
                    os.remove(file_path)
                    logging.info(f"Deleted file from filesystem: {file_path}")
                else:
                    logging.warning(f"File not found on filesystem: {file_path}")

                files_collection.delete_one({"_id": file_id})
                logging.info(f"Deleted file metadata from MongoDB: {file_id}")

        except Exception as e:
            logging.error(f"Error in cleanup: {str(e)}")

        # Check every 10 seconds for short expiration times
        time.sleep(10)

if __name__ == "__main__":
    logging.info("Starting file cleanup service...")
    cleanup_expired_files()