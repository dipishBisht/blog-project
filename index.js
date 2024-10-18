require("dotenv").config();
const express = require("express");
const fs = require('fs');
const cookieParser = require('cookie-parser');
const jwt = require("jsonwebtoken")

const masterPassword = process.env["MASTER_PASSWORD"];
const SECRET_TOKEN = process.env["SECRET_TOKEN"];
const PORT = process.env["PORT"] || 3000;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  const { session } = req.cookies;

  if (session) {
    try {
      const decoded = jwt.verify(session, SECRET_TOKEN);
      req.authenticated = decoded.USER === "USER";
    } catch (err) {
      req.authenticated = false;
    }
  } else {
    req.authenticated = false;
  }

  next();
});

// set the view engine to ejs
app.set('view engine', 'ejs');

app.get("/", (req, res) => {
  const jsonBlog = fs.readFileSync("./data/blogs.json");
  const blogs = JSON.parse(jsonBlog);
  res.render("index", { blogs, authenticated: req.authenticated });
});

app.get("/create-blog", (req, res) => {

  if (req.authenticated) {
    res.render("create-blog");
  } else {
    res.send('<h1>Not Authenticated</h1><a href="/">Home</a>');
  }
});

app.post("/create-blog", (req, res) => {
  const { title, content, password } = req.body;
  const jsonBlog = fs.readFileSync("./data/blogs.json");
  const blogs = JSON.parse(jsonBlog);
  let slug = "/blog/" + title.trim().replaceAll(/\s+/g, "-").toLowerCase();

  if (password != PASSWORD) {
    res.send("You are not authorized!");
  }

  let isUnique = true;
  for (let blog of blogs) {
    if (blog.slug == slug) {
      isUnique = false;
    }
  }

  if (!isUnique) {
    slug = slug + '-' + blogs.length;
  }

  const time = new Date();
  blogs.push({
    title, content, slug,
    createdAt: time.toUTCString()
  });
  fs.writeFileSync("./data/blogs.json", JSON.stringify(blogs, null, 2));

  res.redirect(`/blog/${slug}`);
});

app.get("/blog/:slug", (req, res) => {
  const { slug } = req.params;
  const jsonBlog = fs.readFileSync("./data/blogs.json");
  const blogs = JSON.parse(jsonBlog);
  const blog = blogs.find(b => b.slug == '/blog/' + slug);
  res.render('blog', { blog });
});


app.get("/login", (req, res) => {
  res.render('login');
});

app.post("/login", (req, res) => {
  const { password } = req.body;

  if (password !== masterPassword) {
    return res.send("Invalid Password");
  }

  const token = jwt.sign({ USER: "USER" }, SECRET_TOKEN);
  res.cookie("session", token)
  return res.redirect("/")
});

app.get('/logout', (req, res) => {

  // remove from session JSON list
  res.clearCookie('session');
  res.render('logout')
});

app.listen(PORT, () => {
  console.log("Server running at 3000!");
});