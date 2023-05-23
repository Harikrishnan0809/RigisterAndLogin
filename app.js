const express = require("express");

const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const filePath = path.join(__dirname, "userData.db");

let db = null;
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("The server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const userQuery = `
    SELECT * FROM user
    WHERE username = '${username}';`;

  const hashedPassword = await bcrypt.hash(password, 10);
  const isContain = await db.get(userQuery);

  if (isContain === undefined) {
    const userRegisterQuery = `
    INSERT INTO user ( username, name, password, gender, location )
        VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;

    if (password.length >= 5) {
      //Successful registration of the registrant
      await db.run(userRegisterQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      //If the registrant provides a password with less than 5 characters
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    //If the username already exists
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `
  SELECT * FROM user
  WHERE username = '${username}';`;

  const userDb = await db.get(userQuery);
  if (userDb === undefined) {
    //If an unregistered user tries to login
    response.status(400);
    response.send("Invalid user");
  } else {
    const isCorrect = await bcrypt.compare(password, userDb.password);
    console.log(isCorrect);
    if (isCorrect) {
      //Successful login of the user
      response.status(200);
      response.send("Login success!");
    } else {
      //If the user provides incorrect password
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const userQuery = `
    SELECT * FROM user
    WHERE username = '${username}';`;
  const userDb = await db.get(userQuery);
  const isCorrectPw = await bcrypt.compare(oldPassword, userDb.password);
  const hashedPw = await bcrypt.hash(newPassword, 10);
  const updatePwQuery = `
  UPDATE user
  SET password = '${hashedPw}'
    WHERE username = '${username}';`;

  if (isCorrectPw) {
    if (newPassword.length < 5) {
      //If the user provides new password with less than 5 characters
      response.status(400);
      response.send("Password is too short");
    } else {
      //Successful password update
      await db.run(updatePwQuery);
      response.send("Password updated");
    }
  } else {
    //If the user provides incorrect current password
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
