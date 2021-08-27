const express = require('express');
const fs = require('fs');
const crypto = require("crypto");

lock = false // worried about collision with 2 lock checks happening before one of them sets true.
const app = express();
// all writes are in their own function for recursion to deal with locking the data file. using a db would be better but im lazy and working with repl.it.

/* write template

function write() { // change function name
  if (lock) {
    setTimeout(write, 100) // change function name
  } else {
    lock = true;
    fs.readFile("data.json", (err, data) => {
      jsonData = JSON.parse(data)

      // modify jsonData
      
      fs.writeFileSync("data.json", JSON.stringify(jsonData));
    });
    lock = false;
  }
}

*/

/* */

app.get('/', (req, res) => {
  console.log(req.url);
  fs.readFile("apiDoc.html", (err, data) => {
    res.send(data.toString());
  });
});

app.get('/app', (req, res) => {
  console.log(req.url);
  fs.readFile("index.html", (err, data) => {
    res.send(data.toString());
  });
});

app.get('/api/v1/getAll', (req, res) => {
  console.log(req.url);
  
  if (req.query.uid != null && req.query.uid.length == 16) { 
  fs.readFile("data.json", (err, data) => {
    found = false // specific data
    userData = JSON.parse(data).users;
    for (i = 0; i < userData.length; i++) {
      if (userData[i].id == req.query.uid) {
        res.send(JSON.stringify(userData[i]));
        found = true;
        break;
      }
    }
    if (!found) {
      res.send("invalid UID")
    }
  });
  } else {
    res.send("invalid UID")
  }
});

app.get('/api/v1/register', (req, res) => {
  console.log(req.url);

  registerWrite(res, 0);
});

function registerWrite(res, count) {
  if (lock) {
    setTimeout(registerWrite, 100, res, count)
  } else {
    lock = true;
    if (count > 20) {
      res.send("Something has went wrong.")
    } else {
      fs.readFile("data.json", (err, data) => {
        jsonData = JSON.parse(data)

        hash = genHash()
        found = false
        for (i = 0; i < jsonData.users; i++) {
          if (jsonData.users[i].id == hash) {
            found = true;
            break;
          }
        }

        if (!found) {
          newUser = {}
          newUser.id = hash
          newUser.lists = [["Default"],[genHash(), false, "example Task", "here is extra info in a drop down", ["Default"]]];
          jsonData.users.push(newUser)

          res.send(hash)
          fs.writeFileSync("data.json", JSON.stringify(jsonData));
        } else {
          lock = false; // I think I need this to make sure that it doesnt stay locked, not actually sure its needed.
          registerWrite(res, count+1);
        }
      });
    }
    lock = false;
  }
}

app.get('/api/v1/addItem', (req, res) => {
  console.log(req.url);
  if (req.query.uid != null && req.query.uid.length == 16 && req.query.name != null && req.query.note != null && req.query.tags != null) {

  }
});

function addItemwrite(res, uid, name, note, tags) { // change function name
  if (lock) {
    setTimeout(addItemwrite, 100) // change function name
  } else {
    lock = true;
    fs.readFile("data.json", (err, data) => {
      jsonData = JSON.parse(data)

      // modify jsonData
      
      fs.writeFileSync("data.json", JSON.stringify(jsonData));
    });
    lock = false;
  }
}

app.get('/api/v1/editItem', (req, res) => {
  console.log(req.url);
  fs.readFile("data.json", (err, data) => {
    res.send(data.toString());
  });
});

app.get('/api/v1/delItem', (req, res) => {
  console.log(req.url);
  fs.readFile("data.json", (err, data) => {
    res.send(data.toString());
  });
});

app.get('/api/v1/addTag', (req, res) => {
  console.log(req.url);
  fs.readFile("data.json", (err, data) => {
    res.send(data.toString());
  });
});

app.get('/api/v1/editTag', (req, res) => {
  console.log(req.url);
  fs.readFile("data.json", (err, data) => {
    res.send(data.toString());
  });
});

app.get('/api/v1/delTag', (req, res) => {
  console.log(req.url);
  fs.readFile("data.json", (err, data) => {
    res.send(data.toString());
  });
});

app.listen(3000, () => {
  console.log('server started');
});

function genHash() {
  return crypto.createHash("sha256")
        .update(String(Math.random())+String(new Date()))
        .digest("hex")
        .substring(0,24);
}