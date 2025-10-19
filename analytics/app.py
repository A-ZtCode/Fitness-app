from dotenv import load_dotenv
from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient
from flask_pymongo import PyMongo
from flask_cors import CORS
from urllib.parse import quote_plus
from bson import json_util
import traceback
import logging
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}},
     methods="GET,HEAD,POST,OPTIONS,PUT,PATCH,DELETE")

load_dotenv()
mongo_uri = os.getenv('MONGO_URI')
mongo_db = os.getenv('MONGO_DB')

client = MongoClient(mongo_uri)
db = client[mongo_db]


@app.route('/')
def index():
    exercises = db.exercises.find()
    exercises_list = list(exercises)
    return json_util.dumps(exercises_list)


@app.route('/stats')
def stats():
    pipeline = [
        {
            "$group": {
                "_id": {
                    "username": "$username",
                    "exerciseType": "$exerciseType"
                },
                "totalDuration": {"$sum": "$duration"}
            }
        },
        {
            "$group": {
                "_id": "$_id.username",
                "exercises": {
                    "$push": {
                        "exerciseType": "$_id.exerciseType",
                        "totalDuration": "$totalDuration"
                    }
                }
            }
        },
        {
            "$project": {
                "username": "$_id",
                "exercises": 1,
                "_id": 0
            }
        }
    ]

    stats = list(db.exercises.aggregate(pipeline))
    return jsonify(stats=stats)


@app.route('/stats/<username>', methods=['GET'])
def user_stats(username):
    pipeline = [
        {
            "$match": {"username": username}
        },
        {
            "$group": {
                "_id": {
                    "username": "$username",
                    "exerciseType": "$exerciseType"
                },
                "totalDuration": {"$sum": "$duration"}
            }
        },
        {
            "$group": {
                "_id": "$_id.username",
                "exercises": {
                    "$push": {
                        "exerciseType": "$_id.exerciseType",
                        "totalDuration": "$totalDuration"
                    }
                }
            }
        },
        {
            "$project": {
                "username": "$_id",
                "exercises": 1,
                "_id": 0
            }
        }
    ]

    stats = list(db.exercises.aggregate(pipeline))
    return jsonify(stats=stats)

# Fetch total duration aggregated by day for the last 7 days
@app.route('/stats/daily_trend/<username>', methods=['GET'])
def daily_trend_stats(username):
    # Calculate the start date (7 days ago)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=6)
    
    # Normalize start_date to the beginning of the day for accurate matching
    start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Match: Filter by user and last 7 days
    # 2. Group: Aggregate duration by the date of the exercise
    # 3. Sort: Order the data chronologically
    pipeline = [
        {
            "$match": {
                "username": username,
                "date": {
                    "$gte": start_date,
                    "$lte": end_date
                }
            }
        },
        {
            "$group": {
                "_id": { 
                    "dayOfWeek": {"$dayOfWeek": "$date"},
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}}
                },
                "totalDuration": {"$sum": "$duration"}
            }
        },
        {
            "$sort": {"_id.date": 1}
        },
        {
            "$project": {
                "_id": 0,
                # Map MongoDB's day index (1=Sun, 2=Mon) to a name and use 'Duration' key for Recharts
                "name": {
                    "$switch": {
                        "branches": [
                            {"case": {"$eq": ["$_id.dayOfWeek", 2]}, "then": "Mon"},
                            {"case": {"$eq": ["$_id.dayOfWeek", 3]}, "then": "Tue"},
                            {"case": {"$eq": ["$_id.dayOfWeek", 4]}, "then": "Wed"},
                            {"case": {"$eq": ["$_id.dayOfWeek", 5]}, "then": "Thu"},
                            {"case": {"$eq": ["$_id.dayOfWeek", 6]}, "then": "Fri"},
                            {"case": {"$eq": ["$_id.dayOfWeek", 7]}, "then": "Sat"},
                            {"case": {"$eq": ["$_id.dayOfWeek", 1]}, "then": "Sun"}
                        ],
                        "default": "Unknown"
                    }
                },
                "Duration": "$totalDuration",
                "date": "$_id.date"
            }
        }
    ]

    try:
        stats = list(db.exercises.aggregate(pipeline))
        
        # Post-process - To-Do: Fill in days with zero duration to ensure a continuous 7-day chart line
        date_data = {item['date']: item for item in stats}
        full_range = []
        current = start_date
        
        while current <= end_date:
            date_str = current.strftime("%Y-%m-%d")
            day_name = current.strftime("%a")
            
            if date_str in date_data:
                full_range.append(date_data[date_str])
            else:
                full_range.append({
                    "name": day_name,
                    "Duration": 0,
                    "date": date_str
                })
            current += timedelta(days=1)
            
        return jsonify(trend=full_range)
    except Exception as e:
        logging.error(f"An error occurred while querying MongoDB: {e}")
        traceback.print_exc()
        return jsonify(error="An internal error occurred"), 500
    
    
@app.route('/stats/weekly/', methods=['GET'])
def weekly_user_stats():
    username = request.args.get('user')
    start_date_str = request.args.get('start')
    end_date_str = request.args.get('end')

    date_format = "%Y-%m-%d"
    try:
        start_date = datetime.strptime(start_date_str, date_format)
        end_date = datetime.strptime(end_date_str, date_format) + timedelta(days=1)

        logging.info(f"Fetching weekly stats for user: {username} from {start_date} to {end_date}")
    except Exception as e:
        logging.error(f"Error parsing dates: {e}")
        return jsonify(error="Invalid date format"), 400

    pipeline = [
        {
            "$match": {
                "username": username,
                "date": {
                    "$gte": start_date,
                    "$lt": end_date
                }
            }
        },
        {
            "$group": {
                "_id": {
                    "exerciseType": "$exerciseType"
                },
                "totalDuration": {"$sum": "$duration"}
            }
        },
        {
            "$project": {
                "exerciseType": "$_id.exerciseType",
                "totalDuration": 1,
                "_id": 0
            }
        }
    ]

    try:
        stats = list(db.exercises.aggregate(pipeline))
        return jsonify(stats=stats)
    except Exception as e:
        current_app.logger.error(f"An error occurred while querying MongoDB: {e}")
        traceback.print_exc()
        return jsonify(error="An internal error occurred"), 500



if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5050)