
# 🛡️ Women's Safety Web Platform

A real-time women’s safety web application focused on secure travel, smart route planning, and emergency response. Built using the MERN stack with a modern, responsive frontend and real-time backend integrations, this platform empowers users to navigate safely through urban spaces.

## 🌟 Features

- 🚨 **SOS Alerts** – Discreet, real-time emergency messages sent via Twilio to predefined contacts.
- 🗺️ **Safe Route Discovery** – Routes optimized based on crowd density and verified safe zones like hospitals and police stations.
- 🧠 **Intelligent Travel Matching** – Connects users traveling similar routes for enhanced safety.
- 📍 **Live Location Tracking** – Real-time GPS updates using Google Maps API.
- 🏥 **Verified Safe Zones Database** – Dynamic routing around over 1,000 pre-validated safe spots.
- 🔐 **Secure Authentication** – Firebase auth with JWT protection.
- ☁️ **Cloud Media Handling** – Upload and access media files (images, documents) via Cloudinary.

## 🛠️ Tech Stack

**Frontend**
- React (Vite + TypeScript)
- Tailwind CSS

**Backend**
- Express.js
- Node.js

**Database**
- MongoDB

**Authentication & Hosting**
- Firebase (Auth + Hosting)

**Integrations**
- Google Maps APIs (Geocoding, Directions, Places, Routes, Neary Places, Map Embed for JavaScript)
- Twilio API (SMS)
- Cloudinary (File storage)
- JWT (Authentication)

## ⚙️ Installation

```bash
# Clone the repo
git clone https://github.com/your-username/womens-safety-app.git
cd womens-safety-app

# Install dependencies
npm install

# Environment variables
# Create a .env file in the root and configure the following:
# - MONGO_URI
# - FIREBASE_API_KEY
# - JWT_SECRET
# - TWILIO_ACCOUNT_SID
# - TWILIO_AUTH_TOKEN
# - CLOUDINARY_CLOUD_NAME
# - CLOUDINARY_API_KEY
# - CLOUDINARY_API_SECRET
# - GOOGLE_MAPS_API_KEY

# Run the app
npm run dev
```

## 🧪 Usage

1. **Sign up/login** via Firebase.
2. **Upload travel plans** or request safe routes.
3. **Trigger SOS** via a discreet interface.
4. **Match with fellow travelers** using intelligent pairing.
5. **Track location** with live GPS and receive route suggestions.

## 📦 Folder Structure

```
/client         --> React frontend (Vite + TS)
/server         --> Express backend
  ├── routes    --> API endpoints
  ├── controllers
  ├── models
  ├── middleware
  └── config
```

## 🧠 Future Enhancements

- Voice-activated SOS
- AI-based risk level predictions
- Progressive Web App (PWA) support
- Multilingual support

## 🔗 Link to backend repository: [SHEild Backend](https://github.com/AdityaGupta0001/SHEild-Backend)

## 🤝 Contributing

Contributions are welcome! Please open issues or pull requests with enhancements, fixes, or ideas.

## 📄 License

MIT License

---

Built with ❤️ to make the world safer, one route at a time.
