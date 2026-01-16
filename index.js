const express = require("express");
const axios = require("axios");
const session = require("express-session");

const app = express();

// CONFIG
const CLIENT_ID = "TON_CLIENT_ID";
const CLIENT_SECRET = "TON_CLIENT_SECRET";
const REDIRECT_URI = "http://localhost:3000/callback";
const BOT_TOKEN = "TON_BOT_TOKEN";
const GUILD_ID = "ID_DU_SERVEUR_B";

app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: true
}));

// Page accueil
app.get("/", (req, res) => {
  if (!req.session.access_token) {
    return res.send(`<a href="/login">Se connecter avec Discord</a>`);
  }
  res.send(`<a href="/join">Rejoindre serveur B</a>`);
});

// Login Discord
app.get("/login", (req, res) => {
  const url =
    `https://discord.com/oauth2/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=identify%20guilds.join`;
  res.redirect(url);
});

// Callback OAuth
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  const token = await axios.post(
    "https://discord.com/api/oauth2/token",
    new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  req.session.access_token = token.data.access_token;
  res.redirect("/");
});

// Rejoindre serveur B
app.get("/join", async (req, res) => {
  if (!req.session.access_token) return res.redirect("/");

  const user = await axios.get("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${req.session.access_token}` }
  });

  await axios.put(
    `https://discord.com/api/guilds/${GUILD_ID}/members/${user.data.id}`,
    { access_token: req.session.access_token },
    {
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );

  res.send("✅ Ajouté au serveur B");
});

app.listen(3000, () => console.log("http://localhost:3000"));
