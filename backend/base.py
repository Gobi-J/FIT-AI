import json
import bcrypt
from flask_pymongo import PyMongo
from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from pymongo import MongoClient
import mongomock
from datetime import datetime, timedelta, timezone
from flask_jwt_extended import create_access_token,get_jwt,get_jwt_identity, \
                               unset_jwt_cookies, jwt_required, JWTManager
from datetime import datetime, timedelta
from functools import reduce
from bson import json_util 
from flasgger import Swagger

# For Image Processing
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import load_model
import requests
from werkzeug.utils import secure_filename
import os

api = Flask(__name__)
api.secret_key = 'secret'
api.config["JWT_SECRET_KEY"] = "softwareEngineering"
api.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
jwt = JWTManager(api)
mongo = None
Swagger(api)

api.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
api.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
model_path = os.path.abspath(".\\fitAi_Image_classify.keras")

def setup_mongo_client(app):
    global mongo
    if app.config['TESTING']:
        # Use mongomock for testing
        app.mongo_client = mongomock.MongoClient()
        mongo = app.mongo_client["test"]
    else:
        # Use a real MongoDB connection for production
        app.mongo_client = MongoClient('localhost', 27017)
        mongo = app.mongo_client["test"]

# Call setup_mongo_client during normal (non-test) app initialization
setup_mongo_client(api)

@api.route('/token', methods=["POST"]) 
def create_token():
    email = request.json.get("email", None)
    password = request.json.get("password", None)
    user = mongo.user.find_one({"email": email})
    print(user)
    validUser = bcrypt.checkpw(password.encode('utf-8'), user["password"])
    if (user is not None and validUser):
        access_token = create_access_token(identity=email)
        return jsonify({"message": "Login successful", "access_token":access_token})
    elif (user is None):
        print("User Not Exists")
        return jsonify({"message": "User Not Exists"}),401
    else:
        print("Invalid email or password")
        return jsonify({"message": "Invalid email or password"}),401
    
@api.route("/google-login", methods=["POST"])
def google_login():
    email = request.json.get("email", None)
    firstName = request.json.get("first_name", None)
    lastName = request.json.get("last_name", None)
    user = mongo.user.find_one({"email": email})
    if (user is None):
        mongo.user.insert_one({"email": email, "first_name": firstName, "last_name": lastName})
    access_token = create_access_token(identity=email)
    return jsonify({"message": "Login successful", "access_token":access_token})
        
    

@api.route("/register", methods=["POST"])
def register():
    email = request.json.get('email', None)
    password = request.json.get('password', None)
    hashedPassword = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    # print(hashedPassword)
    first_name = request.json.get('firstName', None)
    last_name = request.json.get('lastName', None)
    new_document = {
    "email": email,
    "password": hashedPassword,
    "first_name": first_name,
    "last_name": last_name,
    }
    query = {
        "email": email,
    }
    try:
        inserted = mongo.user.update_one(query, {"$set": new_document}, upsert=True)
        if (inserted.upserted_id):
            response = jsonify({"msg": "register successful"})
        else:   
            print("User already exists")
            response = jsonify({"msg": "User already exists"})
    except Exception as e:
        response = jsonify({"msg": "register failed"})

    return response

@api.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"msg": "logout successful"})
    unset_jwt_cookies(response)
    return response

@api.route('/events', methods=['GET'])
def get_events():
    events_collection = mongo.events
    events = list(events_collection.find({}))
    for event in events:
        event["_id"] = str(event["_id"]) # Convert ObjectId to string
    return jsonify(events)

@api.route('/is-enrolled', methods=['POST'])
@jwt_required()
def is_enrolled():
    data = request.json
    eventTitle = data['eventTitle']
    current_user = get_jwt_identity()
    enrollment = mongo.user.find_one({"email": current_user, "eventTitle": eventTitle})

    if enrollment:
        return jsonify({"isEnrolled": True})
    else:
        return jsonify({"isEnrolled": False})


@api.route('/enroll', methods=['POST']) 
@jwt_required()
def enroll_event():
    data = request.get_json()  # get data from POST request
    current_user = get_jwt_identity()
    try:
        # Insert data into MongoDB
        mongo.user.insert_one({
            "email": current_user,
            "eventTitle": data['eventTitle']
        })
        response = {"status": "Data saved successfully"}
    except Exception as e:
        response = {"status": "Error", "message": str(e)}
    
    return jsonify(response)

@api.route('/unenroll', methods=['POST']) 
@jwt_required()
def unenroll_event():
    data = request.get_json()  # get data from POST request
    current_user = get_jwt_identity()
    try:
        # Insert data into MongoDB
        mongo.user.delete_one({
            "email": current_user,
            "eventTitle": data['eventTitle']
        })
        response = {"status": "Data saved successfully"}
    except Exception as e:
        response = {"status": "Error", "message": str(e)}
    
    return jsonify(response)

@api.route('/profile')
@jwt_required()
def my_profile():
    current_user = get_jwt_identity()
    profile = mongo.user.find_one({"email": current_user})
    return jsonify(json_util.dumps(profile))

@api.route('/caloriesConsumed',methods=["POST"])
@jwt_required()
def addUserConsumedCalories():
    data = request.get_json()  # get data from POST request
    current_user = get_jwt_identity()
    try:
        # Insert data into MongoDB
        mongo.user.update_one({'email': current_user, "consumedDate": data['intakeDate']}, {"$push": {"foodConsumed": {"item":data["intakeFoodItem"],"calories":data["intakeCalories"]}}}, upsert=True)
        response = {"status": "Data saved successfully"}
        statusCode = 200
    except Exception as e:
        response = {"status": "Error", "message": str(e)}
        statusCode = 500
    return jsonify(response),statusCode

@api.route('/profileUpdate',methods=["POST"])
@jwt_required()
def profileUpdate():
    current_user = get_jwt_identity()
    first_name = request.json.get('firstName', None)
    last_name = request.json.get('lastName', None)
    age = request.json.get('age', None)
    weight = request.json.get('weight', None)
    height = request.json.get('height', None)
    sex = request.json.get('sex', None)
    activityLevel = request.json.get('activityLevel', None)
    bmi = (0.453*float(weight))/((0.3048*float(height))**2)
    bmi = round(bmi,2)
    tdee = calculate_tdee(height, weight, age, sex, activityLevel)
    new_document = {
    "first_name": first_name,
    "last_name": last_name,
    "age": age,
    "weight": weight,
    "height": height,
    "sex": sex,
    "bmi": bmi,
    "target_calories": tdee,
    }
    query = {
        "email": current_user,
    }
    try:
        mongo.user.update_one(query, {"$set": new_document}, upsert=True)
        response = jsonify({"msg": "update successful"})
    except Exception as e:
        response = jsonify({"msg": "update failed"})

    return response

@api.route('/goalsUpdate',methods=["POST"])
@jwt_required()
def goalsUpdate():
    current_user = get_jwt_identity()
    targetWeight = request.json.get('targetWeight', None)
    activityLevel = request.json.get('activityLevel', None)

    new_document = {
        "target_weight": targetWeight,
        "activity_level": activityLevel
    }
    query = {
        "email": current_user,
    }
    try:
        profile = mongo.user.find_one(query)
        tdee = calculate_tdee(profile["height"], profile["weight"], profile["age"], profile["sex"], activityLevel)
        if tdee:  
          new_document["target_calories"] = tdee
        mongo.user.update_one(query, {"$set": new_document}, upsert=True)
        response = jsonify({"msg": "update successful"})
    except Exception as e:
        response = jsonify({"msg": "update failed"})

    return response

@api.route('/caloriesBurned',methods=["POST"])
@jwt_required()
def addUserBurnedCalories():
    data = request.get_json()
    current_user = get_jwt_identity()
    try:
        # Insert data into MongoDB
        mongo.user.update_one({'email': current_user, "consumedDate": data['burnoutDate']}, {"$inc": {"burntCalories": int(data["burntoutCalories"])}}, upsert=True)
        response = {"status": "Data saved successfully"}
        statusCode = 200
    except Exception as e:
        response = {"status": "Error", "message": str(e)}
        statusCode = 500
    return jsonify(response),statusCode

@api.route('/createFood', methods=["POST"])
def createFood():
    data = request.get_json() # get data from POST request
    foodName = data['foodName']
    calories = data['calories']
    try:
        # Insert data into MongoDB
        mongo.food.insert_one({'food': foodName, "calories": calories})
        response = {"status": "Data saved successfully"}
        statusCode = 200
    except Exception as e:
        response = {"status": "Error", "message": str(e)}
        statusCode = 500
    return jsonify(response),statusCode

@api.route('/createMeal', methods=["POST"])
@jwt_required()
def createMeal():
    data = request.get_json()
    current_user = get_jwt_identity()
    mealName = data['mealName']
    ingredients = data['ingredients']
    calories = 0
    for item in ingredients:
        food_item = mongo.food.find_one({"food": item})
        calories += int(food_item["calories"])
    try:
        mongo.food.insert_one({'food': mealName, "calories": calories})
        mongo.user.insert_one({
            "email": current_user,
            "meal_name": mealName,
            "ingredients": ingredients,
            "total_calories": calories
        })
        response = {"status": "Data saved successfully"}
        statusCode = 200
    except Exception as e:
        response = {"status": "Error", "message": str(e)}
        statusCode = 500
    return jsonify(response),statusCode

@api.route('/weekHistory',methods=["POST"])
@jwt_required()
def getWeekHistory(): 
    data = request.get_json()
    current_user = get_jwt_identity()
    todayDate = datetime.strptime(data["todayDate"],"%m/%d/%Y")
    dates = [(todayDate-timedelta(days=x)).strftime("%m/%d/%Y") for x in range(7)]
    calorieLimit = 1000
    result = []
    try:
        for index,dateToFind in enumerate(dates):
            res = {}
            data = mongo.user.find_one({'email': current_user, "consumedDate": dateToFind})
            res["dayIndex"] = index
            res["date"] = dateToFind
            if data:
                if "foodConsumed" in data:
                    res["foodConsumed"] = data["foodConsumed"]
                    res["caloriesConsumed"] = reduce(lambda a,b: a+b, [int(item["calories"]) for item in data["foodConsumed"]])
                    res["exceededDailyLimit"] = res["caloriesConsumed"]>calorieLimit
                if "burntCalories" in data:
                    res["burntCalories"] = data["burntCalories"]
            if "foodConsumed" not in res:
                res["foodConsumed"] = []
            if "caloriesConsumed" not in res:
                res["caloriesConsumed"] = 0
            if "burntCalories" not in res:
                res["burntCalories"] = 0
            if "exceededDailyLimit" not in res:
                res["exceededDailyLimit"] = False
            result.append(res)
        response = result
        statusCode = 200
    except Exception as e:
        response = {"status": "Error", "message": str(e)}
        statusCode = 500
    return jsonify(response),statusCode

@api.route("/myMeals",methods=["GET"])
@jwt_required()
def getMyMeals():
    current_user = get_jwt_identity()
    result = []
    try:
        data = mongo.user.find({"email": current_user,"meal_name":{"$exists": True}})
        for meal in data:
            cal_info = []
            for item in meal['ingredients']:
                food_item = mongo.food.find_one({'food':item})
                cal_info.append({str(item):food_item['calories']})
            res={}
            res['meal_name']=meal['meal_name']
            res['ingredients']=meal['ingredients']
            res['total_calories']=meal['total_calories']
            result.append(res)
        response = result
        statusCode = 200
    except Exception as e:
        response = {"status": "Error", "message": str(e)}
        statusCode = 500
    return jsonify(response),statusCode
        

@api.route('/foodCalorieMapping',methods=["GET"])
@jwt_required()
def getFoodCalorieMapping(): 
    try:
        data = mongo.food.find()
        response = {item["food"]:item["calories"] for item in data}
        statusCode = 200
    except Exception as e:
        response = {"status": "Error", "message": str(e)}
        statusCode = 500
    return jsonify(response),statusCode

@api.route('/usersEvents',methods=["GET"]) 
@jwt_required()
def getUserRegisteredEvents(): 
    try:
        current_user = get_jwt_identity()
        data = mongo.user.find({"email": current_user, "eventTitle":{"$exists": True}})
        response = []
        date="10/23/2023"
        for item in data:
            res = {"eventName": item["eventTitle"], "date": date}
            response.append(res)
        statusCode = 200
    except Exception as e:
        response = {"status": "Error", "message": str(e)}
        statusCode = 500
    return jsonify(response),statusCode

def calculate_tdee(height,weight,age,sex,activityLevel):
    if height and weight and age and sex and activityLevel:
        pass
    else:
        return None
    kg_weight = float(weight)*0.45359237
    cm_height = float(height)*30.48
    common_calc_for_male_female = (10*kg_weight) + (6.25*cm_height) - (5*int(age))
    if sex == "Male":
        bmr = common_calc_for_male_female + 5
    else:
        bmr = common_calc_for_male_female - 161
    personal_activity_levels = {'Minimal': 1.2,'Light': 1.375, 'Moderate': 1.55, 'Heavy':1.725, 'Athlete': 1.9}
    tdee = int((bmr * personal_activity_levels[activityLevel]))
    return tdee


os.environ['TF_CPP_MIN_LOG_LEVEL'] = '1' 
UPLOAD_FOLDER = 'static/uploads/'
model = 0
try:
    model = tf.keras.models.load_model(model_path)
except ValueError as e:
    print("Error loading the model:", e)
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif'])
data_cat = ['carrot', 'cucumber', 'lemon', 'mango', 'onion', 'potato']
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@api.route('/predict', methods=['POST'])
def upload_image():
    print("Upload----------------------------------------")
    file = request.files['file']
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(api.config['UPLOAD_FOLDER'], filename))
        print('upload_image filename: ' + filename,file)
        image = 'static/uploads/'+filename
        print("-------------------------------------------"+image)
        img_width = 100
        img_height = 100
        image_load = tf.keras.utils.load_img(image,target_size=(img_width,img_height))
        img_arr = tf.keras.utils.array_to_img(image_load)
        img_bat = tf.expand_dims(img_arr,0)
        predict = model.predict(img_bat)
        score = tf.nn.softmax(predict)
        name = data_cat[np.argmax(score)]
        print("---------------Name: --------------"+name)
        return name