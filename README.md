# 🚍 Drift: Revolutionizing Transportation (Now a nwHacks 2025 Telus Finalist!) 

![image](https://github.com/user-attachments/assets/a34ccf7e-32e3-4551-95a8-2612ea6aca48)

## 🌟 Overview
Drift is an innovative app designed to revolutionize public transportation payments. Our app enables users to pay for bus rides seamlessly without physical interaction. By leveraging geolocation data, TransLink bus location data, and Stripe payments, we provide a hassle-free and intelligent payment system that automatically charges users based on their trips.

This project was created for nwHacks 2025 at the University of British Columbia.

---

## ✨ Current Features

#### 1. 🔍 **Find Closest Routes**
- View the 5 closest bus routes to your current location.

#### 2. 🚌 **Monitor Bus Locations**
- See the 10 nearest buses from the selected routes in real-time.

#### 3. 💳 **Add Payment Method**
- Securely add your credit card for seamless payments using Stripe.

#### 4. 🕒 **View Trip History**
- Access a detailed history of your trips, including route information and charges.

#### 5. 📍 **Active Trip Detection**
- Check whether a trip is currently active and track your real-time journey.

#### 6. 🔒 **Secure Login**
- User authentication with bcrypt for password hashing ensures security.

---

## 🚀 Future Features

#### 1. 💸 **Dynamic Fare Adjustments**
- Implement age-based discounts for youth and seniors.

#### 2. 🕑 **Trip Aggregation**
- Ensure users are not charged for multiple trips made within two hours of a trip's start time.

#### 3. 🤖 **Improved Trip Detection**
- Use a machine learning model to enhance trip detection accuracy.

#### 4. 🛠️ **Enhanced Simulations**
- Currently, WebSocket simulations mimic user GPS location and TransLink data. In future iterations, the app will fully integrate real-time GPS and TransLink APIs.

---

## 🏗️ Architecture

#### 📱 Frontend
- **Technology**: React Native
- **Features**: Mobile interface for route searching, trip history, payment setup, and active trip tracking.

#### 🖥️ Backend
- **Technology**: Node.js
- **Deployed On**: Render
- **Features**: Handles user authentication, payment processing, and trip history storage.

#### 🌐 Simulated Data Services
- **Technology**: Python (FastAPI)
- **Deployed On**: AWS
- **Features**: WebSocket services for:
  - Simulated user GPS location for testing and demos.
  - Simulated TransLink bus data to overcome real-time API rate limits.

---

## ⚙️ How It Works
1. **Trip Detection**:
   - The app uses the user's GPS location and simulated TransLink bus data to determine when the user is traveling on a bus.
   - Stripe processes payments automatically when a trip is detected.

2. **Secure Login**:
   - User credentials are hashed using bcrypt to ensure a secure login process.

3. **Simulation for Demos**:
   - WebSocket services provide:
     - Simulated user locations.
     - TransLink data from past records.

4. **Stripe Integration**:
   - Payments are processed dynamically for each trip. Future iterations will add fare aggregation and discounts.

---

## 🛠️ Tech Stack

#### 📱 Frontend
- **React Native**: For building a cross-platform mobile app.

#### 🖥️ Backend
- **Node.js**: API for user authentication, trip history, and payment handling.
- **Render**: Deployment platform for backend services.

#### 🌐 Simulated Data Services
- **FastAPI**: Lightweight Python framework for creating WebSocket services.
- **AWS**: Deployment platform for data simulation services.

#### Other Technologies
- **Stripe**: Payment processing.
- **bcrypt**: Password hashing for secure authentication.
- **WebSocket**: Real-time communication for user location and TransLink data simulation.

## 👥 Contributors
- Farhan bin Faisal  
- Jiayi Li  
- Yibin Long  


## 🙏 Acknowledgments
- TransLink: For providing historical data.
- Stripe: For seamless payment processing.
- nwHacks 2025: For inspiring innovative projects.

## 📜 License
This project is licensed under the MIT License. See LICENSE for more details.
