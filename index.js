const express = require('express');
const fs = require('fs');
const crypto = require("crypto");

lock = false // worried about collision with 2 lock checks happening before one of them sets true.
idLength = 24
const app = express();
// all writes are in their own function for recursion to deal with locking the data file. using a db would be better but im lazy and working with repl.it. Although now that I think about it I could likely use replit Database. im lazy though and rather just stick with this.

/* 
todo:
allow changing UID
make responses better (JSON)
make apiDoc better for API routes.

ideas:
use a queue to write to the file rather then the lock im currently using.
instead of array of users, json object of users with keys being uids
add timestamps
sqlite?
*/

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

// should probably make things return json objects.

app.get('/', (req, res) => {
  console.log(req.url);
  fs.readFile("pages/apiDoc.html", (err, data) => {
    res.send(data.toString());
  });
});

app.get('/start', (req, res) => { // i really should just use a real webserver.
  console.log(req.url);
  fs.readFile("pages/start.html", (err, data) => {
    res.send(data.toString());
  });
});

app.get('/signin', (req, res) => {
  console.log(req.url);
  fs.readFile("pages/signin.html", (err, data) => {
    res.send(data.toString());
  });
});

app.get('/register', (req, res) => {
  console.log(req.url);
  fs.readFile("pages/register.html", (err, data) => {
    res.send(data.toString());
  });
});

app.get('/app', (req, res) => {
  console.log(req.url);
  fs.readFile("pages/app.html", (err, data) => {
    res.send(data.toString());
  });
});

app.get('/js/lib.js', (req, res) => {
  console.log(req.url);
  fs.readFile("pages/js/lib.js", (err, data) => {
    res.send(data.toString());
  });
});

app.get('/api/v1/getUser', (req, res) => {
  console.log(req.url);
  
  if (req.query.uid != null && req.query.uid.length == idLength) { 
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
          newUser.tags = ["Default"]
          newUser.items = [[genHash(), false, "example Task", "here is extra info in a drop down", ["Default"]]];
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

app.get('/api/v1/addItem', (req, res) => { // https://todo.jonescal.repl.co/api/v1/addItem?uid=b05b299ed308575723a433e1&name=2&note=test&tags=[%22Default%22]
  console.log(req.url);
  if (req.query.uid != null && req.query.uid.length == idLength && req.query.name != null && req.query.note != null && req.query.tags != null) {
    addItemWrite(res, req.query.uid, req.query.name, req.query.note, JSON.parse(req.query.tags), 0)
  } else {
    res.send("Invalid Parameters")
  }
});

function addItemWrite(res, uid, name, note, tags, count) {  // probably should add a count so it doesnt regen hashes too many times if it it hits a collision.
  if (lock) {
    setTimeout(addItemWrite, 100, res, uid, name, note, tags)
  } else {
    lock = true;
    if (count > 20) {
      res.send("Something has went wrong.")
    } else {
      fs.readFile("data.json", (err, data) => {
        jsonData = JSON.parse(data)

        uindex = -1
        for (i = 0; i < jsonData.users.length; i++) {
          if (jsonData.users[i].id == uid) {
            index = i;
            break;
          }
        }
        if (uindex > -1) {
          hash = genHash()
          found = false
          for (i = 0; i < jsonData.users[uindex].items.length; i++) {
            if (jsonData.users[uindex].items[i][0] == hash) {
              found = true;
              break;
            }
          }

          if (found) {
            lock = false;
            addItemWrite(res, uid, name, note, tags, count+1) // not efficent but im lazy and this is simple.
          } else {
            jsonData.users[uindex].items.push([hash, false, name, note, tags])
            fs.writeFileSync("data.json", JSON.stringify(jsonData));
            res.send(hash)
          }

        } else {
          res.send("Invalid UID")
        }
      });
    }
    lock = false;
  }
}

app.get('/api/v1/editItem', (req, res) => {
  console.log(req.url);
  if (req.query.uid != null && req.query.uid.length == idLength && req.query.iid != null && req.query.iid.length == idLength && req.query.name != null && req.query.note != null && req.query.tags != null) {
    delItemWrite(res, req.query.uid, req.query.iid)
    addItemWrite(res, req.query.uid, req.query.name, req.query.note, JSON.parse(req.query.tags), 0)
  } else {
    res.send("Invalid Parameters")
  }
});

app.get('/api/v1/delItem', (req, res) => {
  console.log(req.url);
  if (req.query.uid != null && req.query.uid.length == idLength && req.query.iid != null && req.query.iid.length == idLength) {
    delItemWrite(res, req.query.uid, req.query.iid)
  } else {
    res.send("Invalid Parameters")
  }
});

function delItemWrite(res, uid, iid) { // change function name
  if (lock) {
    setTimeout(delItemWrite, 100, res, uid, iid) // change function name
  } else {
    lock = true;
    fs.readFile("data.json", (err, data) => {
      jsonData = JSON.parse(data)

      uindex = -1
      for (i = 0; i < jsonData.users.length; i++) {
        if (jsonData.users[i].id == uid) {
          uindex = i;
          break;
        }
      }

      if (uindex > -1) {
        iindex = -1
        for (i = 0; i < jsonData.users[uindex].items.length; i++) {
          if (jsonData.users[uindex].items[i][0] == iid) {
            iindex = i;
            break;
          }
        }
        if (iindex > -1) {
          jsonData.users[uindex].items.splice(iindex, 1)
          res.send(iid)
          fs.writeFileSync("data.json", JSON.stringify(jsonData));
        } else {
          res.send("Invalid IID")
        }
      } else {
        res.send("Invalid UID")
      }
    });
    lock = false;
  }
}

app.get('/api/v1/addTag', (req, res) => {
  console.log(req.url);
  if (req.query.uid != null && req.query.uid.length == idLength && req.query.name != null) {
    addItemWrite(res, req.query.uid, req.query.name)
  } else {
    res.send("Invalid Parameters")
  }
});

function addTagWrite(res, uid, name) { // change function name
  if (lock) {
    setTimeout(addTagWrite, 100, res, uid, name) // change function name
  } else {
    lock = true;
    fs.readFile("data.json", (err, data) => {
      jsonData = JSON.parse(data)

      uindex = -1
      for (i = 0; i < jsonData.users.length; i++) {
        if (jsonData.users[i].id == uid) {
          uindex = i;
          break;
        }
      }

      if (uindex > -1) {
        found = false
        for (i = 0; i < jsonData.users[uindex].tags.length; i++) {
          if (jsonData.users[uindex].tags[i] == name) {
            found = true;
            break;
          }
        }
        if (!found) {
          jsonData.users[uindex].tags.push(name);
          res.send(name)
          fs.writeFileSync("data.json", JSON.stringify(jsonData));
        } else {
          res.send("Duplicate Tag")
        }
      } else {
        res.send("Invalid UID")
      }
    });
    lock = false;
  }
}

app.get('/api/v1/editTag', (req, res) => {
  console.log(req.url);
  if (req.query.uid != null && req.query.uid.length == idLength && req.query.oldName != null && req.query.newName != null) {
    editTagWrite(res, req.query.uid, req.query.oldName, req.query.newName)
  } else {
    res.send("Invalid Parameters")
  }
});

function editTagWrite(res, uid, oldName, newName) { // change function name
  if (lock) {
    setTimeout(addTagWrite, 100, res, uid, oldName, newName) // change function name
  } else {
    lock = true;
    fs.readFile("data.json", (err, data) => {
      jsonData = JSON.parse(data)

      uindex = -1
      for (i = 0; i < jsonData.users.length; i++) {
        if (jsonData.users[i].id == uid) {
          uindex = i;
          break;
        }
      }

      if (uindex > -1) {
        otIndex = -1
        for (i = 0; i < jsonData.users[uindex].tags.length; i++) {
          if (jsonData.users[uindex].tags[i] == oldName) {
            otIndex = i;
            break;
          }
        }
        if (otIndex > -1) {
          found = false
          for (i = 0; i < jsonData.users[uindex].tags.length; i++) {
            if (jsonData.users[uindex].tags[i] == newName) {
              found = true;
              break;
            }
          }
          if (!found) {
            jsonData.users[uindex].tags.push(newName);
            jsonData.users[uindex].tags.splice(otIndex, 1);

            for (i = 0; i < jsonData.users[uindex].items.length; i++) {
              for (j = 0; i < jsonData.users[uindex].items[i][4].length; j++) {
                if (jsonData.users[uindex].items[i][4][j] == oldName) {
                  jsonData.users[uindex].items[i][4][j] = newName;
                }
              }
            }

            res.send(name)
            fs.writeFileSync("data.json", JSON.stringify(jsonData));
          } else {
            res.send("Duplicate Tag")
          }
        } else {
          res.send("Tag does not exist.")
        }
      } else {
        res.send("Invalid UID")
      }
    });
    lock = false;
  }
}

app.get('/api/v1/delTag', (req, res) => {
  console.log(req.url);
  if (req.query.uid != null && req.query.uid.length == idLength && req.query.name != null) {
    delTagWrite(res, req.query.uid, req.query.oldName, req.query.newName)
  } else {
    res.send("Invalid Parameters")
  }
});

function delTagWrite(res, uid, name) { 
  if (lock) {
    setTimeout(delItemdelTagWriteWrite, 100, res, uid, name)
  } else {
    lock = true;
    fs.readFile("data.json", (err, data) => {
      jsonData = JSON.parse(data)

      uindex = -1
      for (i = 0; i < jsonData.users.length; i++) {
        if (jsonData.users[i].id == uid) {
          uindex = i;
          break;
        }
      }

      if (uindex > -1) {
        iindex = jsonData.users[uindex].tags.indexOf(name)
        if (iindex > -1) {
          jsonData.users[uindex].tags.splice(iindex, 1)
          for (int = 0; i < jsonData.users[uindex].items.length; i++) {
            if (jsonData.users[uindex].items[i][4].indexOf(name) > -1) {
              jsonData.users[uindex].items[i][4].splice(jsonData.users[uindex].items[i][4].indexOf(name), 1) // i hate this
            }
          }
          res.send(name)
          fs.writeFileSync("data.json", JSON.stringify(jsonData));
        } else {
          res.send("Invalid Tag")
        }
      } else {
        res.send("Invalid UID")
      }
    });
    lock = false;
  }
}

app.listen(3000, () => {
  console.log('server started');
});

function genHash() {
  return crypto.createHash("sha256")
        .update(String(Math.random())+String(new Date()))
        .digest("hex")
        .substring(0,idLength);
}