# AI-Powered Task Planner

A full-stack productivity app designed to help users plan, structure, and manage personal tasks — powered by AI.

Users can enter any task in natural language (e.g., *“Prepare for a frontend interview”*), and the AI (Google Gemini API) converts it into a structured task object with:

- Title  
- Description  
- Priority   
- Subtasks  

All tasks are securely stored in MongoDB cluster.  
The UI is clean, responsive, and built for fast daily planning.

---

##Features

| Feature | Status | Description |
|--------|--------|-------------|
| 🧾 User authentication | ✔️ | JWT-based secure login/signup |
| 🗂️ Task management | ✔️ | Create, view, update, delete tasks |
| 🤖 AI task generation | ✔️ | Converts plain text into actionable structured tasks |
| 📦 MongoDB storage | ✔️ | Persistent storage using Mongoose |
| 📱 Responsive UI | ✔️ | Works across laptop & mobile |

---

## 🧰 Tech Stack

### **Frontend**
- React
- Axios
- Context API (Auth + Task State)

### **Backend**
- Node.js + Express
- MongoDB + Mongoose
- JSON Web Token (JWT)
- Google Gemini `generateContent` API



