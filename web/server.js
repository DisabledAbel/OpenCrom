// ---- LOGIN CONFIG ----
const USERNAME = "admin";
const PASSWORD = "render123";

// ---- LOGIN ROUTE ----
app.post("/login", express.urlencoded({ extended:true }), (req,res)=>{
  const { username, password } = req.body;

  if(username===USERNAME && password===PASSWORD){
    req.session.user = username;
    return res.redirect("/dashboard");
  }

  res.send(`
    <h2>Login failed</h2>
    <p>Wrong username or password</p>
    <a href="/login.html">Try again</a>
  `);
});

// ---- LOGOUT ----
app.get("/logout",(req,res)=>{
  req.session.destroy(()=>{
    res.redirect("/login.html");
  });
});

// ---- AUTH MIDDLEWARE ----
function requireAuth(req,res,next){
  if(!req.session.user){
    return res.redirect("/login.html");
  }
  next();
}

// ---- PROTECT DASHBOARD ----
app.get("/dashboard", requireAuth, (req,res)=>{
  res.sendFile(path.join(__dirname,"public","dashboard.html"));
});
