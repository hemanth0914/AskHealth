Mother & Child Care Assistant Project
Overview
This project implements a conversational AI assistant for mother and child care. The assistant interacts with users to gather information about their concerns and provides personalized responses based on the provided details, such as the mother's and child's health status, vaccination history, and feeding concerns. The assistant also provides a summary of the call after the interaction.

The system is built using FastAPI for the backend and React for the frontend. The backend uses MongoDB to store user details and conversation summaries, while JWT authentication is used to secure access to user data.

Key Features
User Authentication: Users can sign up and log in to the system securely using JWT-based authentication.

Personalized Conversations: The assistant takes in mother-child data, such as age, health problems, feeding concerns, and vaccination history, to generate relevant responses.

Call Summary: After the conversation ends, a summary of the call is created and stored in the database for future reference.

History Tracking: The system keeps track of the conversation history, enabling the assistant to use past conversations to provide more informed responses.

Tech Stack
Frontend:

React: A JavaScript library for building user interfaces.

TailwindCSS: A utility-first CSS framework to style the application.

Backend:

FastAPI: A modern web framework for building APIs with Python.

MongoDB: A NoSQL database to store user data and conversation summaries.

JWT: JSON Web Tokens used for user authentication and authorization.

Passlib: A password hashing library used for secure password storage.

Additional Tools:

VAPI: A conversational AI tool integrated into the project for handling the assistant's interactions.

Installation
Frontend (React)
Clone the repository:

bash
Copy
git clone https://github.com/yourusername/mother-child-care-assistant.git
cd mother-child-care-assistant
Navigate to the frontend directory:

bash
Copy
cd frontend
Install the dependencies:

bash
Copy
npm install
Start the React development server:

bash
Copy
npm start
The frontend will now be available at http://localhost:3000.

Backend (FastAPI)
Navigate to the backend directory:

bash
Copy
cd backend
Install the required dependencies:

bash
Copy
pip install -r requirements.txt
Run the FastAPI server:

bash
Copy
uvicorn main:app --reload
The backend API will be available at http://localhost:8000.

Features & API Endpoints
1. User Authentication
POST /signup: Create a new user account.

Body: { "email": "user@example.com", "password": "password123" }

POST /login: Log in an existing user.

Body: { "email": "user@example.com", "password": "password123" }

Response: { "access_token": "jwt_token", "token_type": "bearer" }

2. Conversational Assistant
POST /fetch-summary: Submit a summary of the assistant's conversation.

Body:

json
Copy
{
  "user_id": "user@example.com",
  "call_id": "call_id",
  "summary": "Summary of the conversation",
  "startedAt": "2025-03-12T10:00:00",
  "endedAt": "2025-03-12T10:30:00"
}
Response:

json
Copy
{
  "user_id": "user@example.com",
  "call_id": "call_id",
  "summary": "Summary of the conversation",
  "startedAt": "2025-03-12T10:00:00",
  "endedAt": "2025-03-12T10:30:00"
}
GET /summaries/{user_id}: Fetch all conversation summaries for a specific user.

Response:

json
Copy
[
  {
    "call_id": "call_id",
    "summary": "Summary of the conversation",
    "startedAt": "2025-03-12T10:00:00",
    "endedAt": "2025-03-12T10:30:00"
  }
]
3. Chatbot Integration
/chatbot: The main page where the user can interact with the assistant and provide details about their child and their concerns. The assistant processes the input and interacts with the user.

JWT Authentication
Login Flow: Once the user logs in, the system stores the JWT token in localStorage. This token is used to authenticate the user for all subsequent API calls that require access to protected resources (e.g., fetching summaries).

Secured Endpoints: All backend endpoints that require user identification (such as /fetch-summary) are protected using JWT. The token is sent in the Authorization header as Bearer <token>.

Usage
Login: The user logs in by providing their credentials (email and password).

Start a Conversation: The user provides details about their mother-child care concerns, and the assistant starts the conversation.

View Conversation History: The user can view all past summaries of their interactions with the assistant.

Call Summary: After the conversation ends, the assistant generates and stores a summary of the call.

Logout: The user can log out, which removes the JWT token from localStorage.

Future Improvements
Natural Language Processing (NLP): Improve the assistant's ability to understand more complex questions and provide more accurate responses.

Multilingual Support: Allow the assistant to handle interactions in multiple languages.

Expanded Medical Database: Integrate more detailed medical resources to provide additional assistance for mother and child care.

Mobile App: Develop a mobile application for better accessibility.

Contributing
We welcome contributions! To get started, fork the repository, create a new branch, and submit a pull request with your changes.

License
This project is licensed under the MIT License - see the LICENSE file for details.

This README provides an overview of the project, how to set it up, the key features, and the API documentation. It also includes installation instructions for both the frontend and backend, and highlights the main functionalities.