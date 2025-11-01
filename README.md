# 🕵️‍♂️ Secrets

A fullstack web app for sharing secrets anonymously!  
Built with Node.js, Express, PostgreSQL, Passport.js, and Google OAuth.

## 🚀 Features

- **Register/Login** with email & password or Google OAuth
- **Session-based authentication** (local & Google)
- **Submit your secret** securely
- **View your secret** (only you can see it!)
- **Password hashing** with bcrypt
- **PostgreSQL database** for user and secret storage

## 🛠️ Tech Stack

- Node.js
- Express
- PostgreSQL
- Passport.js (Local & Google strategies)
- EJS templating
- bcrypt for password security
- dotenv for environment variables

## 📦 Project Structure

```
9.3/
├── .env
├── .gitignore
├── index.js
├── package.json
├── css/
│   └── styles.css
├── partials/
│   ├── footer.ejs
│   └── header.ejs
├── public/
│   └── css/
│       └── styles.css
└── views/
    ├── home.ejs
    ├── login.ejs
    ├── register.ejs
    ├── secrets.ejs
    ├── submit.ejs
    └── partials/
        ├── footer.ejs
        └── header.ejs
```

## ⚡ Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/secrets.git
   cd secrets/9.3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your `.env` file**
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   SESSION_SECRET=your-session-secret
   PG_USER=your-db-user
   PG_HOST=your-db-host
   PG_DATABASE=your-db-name
   PG_PASSWORD=your-db-password
   PG_PORT=5432
   ```

4. **Start the server**
   ```bash
   node index.js
   ```

5. **Visit**
   ```
   http://localhost:3000
   ```

## 📝 Notes

- You need a PostgreSQL database set up with a `users` table:
  ```sql
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    secret TEXT
  );
  ```

## 💡 Inspiration

Inspired by the idea that everyone has secrets.  
Share yours safely and anonymously!
