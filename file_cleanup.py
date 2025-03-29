from pymongo import MongoClient
import os
import datetime
import logging
import time
import signal
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://varunnn:root1@privatedb.36kkp.mongodb.net/")
client = MongoClient(MONGO_URI)
db = client["data_sharing"]
files_collection = db["files"]

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("cleanup.log"),
        logging.StreamHandler()
    ]
)

# Cleanup interval (in seconds), configurable via environment variable
CLEANUP_INTERVAL = int(os.getenv("CLEANUP_INTERVAL", 10))

# Flag to control the loop
running = True

def signal_handler(sig, frame):
    """Handle graceful shutdown on SIGINT or SIGTERM."""
    global running
    logging.info("Received shutdown signal. Stopping cleanup service...")
    running = False

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def cleanup_expired_files():
    """Remove expired files from filesystem and MongoDB."""
    while running:
        try:
            # Use timezone-aware UTC time
            current_time = datetime.datetime.now(datetime.UTC)
            expired_files = files_collection.find({
                "expiration_date": {"$ne": None, "$lt": current_time}
            }).batch_size(100)  # Batch processing for efficiency

            deleted_count = 0
            for file in expired_files:
                if not running:  # Check for shutdown during iteration
                    break

                file_id = file["_id"]
                file_path = file.get("encrypted_file_path")

                # Remove file from filesystem
                if file_path and os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                        logging.info(f"Deleted file from filesystem: {file_path}")
                    except OSError as e:
                        logging.warning(f"Failed to delete file {file_path}: {str(e)}")
                else:
                    logging.warning(f"File not found on filesystem: {file_path or 'No path'}")

                # Remove file metadata from MongoDB
                result = files_collection.delete_one({"_id": file_id})
                if result.deleted_count > 0:
                    logging.info(f"Deleted file metadata from MongoDB: {file_id}")
                    deleted_count += 1
                else:
                    logging.warning(f"File metadata not found in MongoDB: {file_id}")

            if deleted_count > 0:
                logging.info(f"Cleaned up {deleted_count} expired files in this cycle")

        except Exception as e:
            logging.error(f"Error in cleanup cycle: {str(e)}")
            # Retry after a short delay in case of transient errors
            time.sleep(5)
            continue

        # Wait for the next cycle
        time.sleep(CLEANUP_INTERVAL)

    logging.info("Cleanup service stopped.")

if __name__ == "__main__":
    logging.info(f"Starting file cleanup service with interval {CLEANUP_INTERVAL} seconds...")
    try:
        cleanup_expired_files()
    except KeyboardInterrupt:
        logging.info("Cleanup service terminated by user.")
    finally:
        client.close()
        logging.info("MongoDB connection closed.")

