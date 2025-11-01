import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/secrets", async (req, res) => {
  if (req.isAuthenticated()) {

    try {
      const result = await db.query("select secret from users where email=$1",
        [req.user.email]
      );
      const userSecret = result.rows[0].secret;
      if (!userSecret) {
        res.render("secrets.ejs", { secret: "No secrets submitted yet." });
      } else {
        res.render("secrets.ejs", { secret: userSecret });
      }
    } catch (err) {
      console.error(err);
    }
  } else {
    res.redirect("/login");
  }
});

//TODO: Add a get route for the submit button
//Think about how the logic should work with authentication.

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      req.redirect("/login");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/secrets");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

//TODO: Create the post route for submit.
//Handle the submitted data and add it to the database
app.post("/submit", async (req, res) => {
  const submittedSecret = req.body.secret;

  try {
    await db.query("UPDATE users SET secret = $1 WHERE email = $2",
      [submittedSecret, req.user.email]
    );
    res.redirect("/secrets");
  } catch (err) {
    console.log(err);
  }
});

passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

passport.use(
  "google", // Name of the strategy
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, // Google OAuth client ID from .env
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Google OAuth client secret from .env
      callbackURL: "http://localhost:3000/auth/google/secrets", // Where Google redirects after login
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo", // URL to fetch user profile
    },
    async (accessToken, refreshToken, profile, cb) => { // This function runs after Google authenticates the user
      try {
        console.log(profile); // Log the Google profile info for debugging
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email, // Use the email from the Google profile to find the user in your DB
        ]);
        if (result.rows.length === 0) { // If user not found in DB
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)", // Create a new user with Google email
            [profile.email, "google"] // Password is just a placeholder
          );
          return cb(null, newUser.rows[0]); // Pass the new user to Passport (success)
        } else {
          return cb(null, result.rows[0]); // Pass the existing user to Passport (success)
        }
      } catch (err) {
        return cb(err); // If error, pass it to Passport (failure)
      }
    }
  )
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
