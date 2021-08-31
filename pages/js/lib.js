function CheckUIDredirectToApp() {
  uid = localStorage.getItem("uid")
  if (uid != null && uid.length == 24) {
    let url = new URL("https://"+window.location.hostname+"/api/v1/getUser");
    url.searchParams.set('uid', uid)
    return fetch(url)
    .then(response => response.text())
    .then(data => {
      if (data != "invalid UID") {window.location.href = "/app"; return true;} else {return false}
    })
    .catch((error) => {
      console.error('Error:', error);
      return false;
    });
  }
}

function CheckInvalidUIDredirectToStart() {
  uid = localStorage.getItem("uid")
  if (uid != null && uid.length == 24) {
    let url = new URL("https://"+window.location.hostname+"/api/v1/getUser");
    url.searchParams.set('uid', uid)
    return fetch(url)
    .then(response => response.text())
    .then(data => {
      if (data == "invalid UID") {window.location.href = "/start"; return false;} else {return true}
    })
    .catch((error) => {
      console.error('Error:', error);
      return true;
    });
  }
}

function validUID() {
  uid = localStorage.getItem("uid")
  if (uid != null && uid.length == 24) {
    let url = new URL("https://"+window.location.hostname+"/api/v1/getUser");
    url.searchParams.set('uid', uid)
    return fetch(url)
    .then(response => response.text())
    .then(data => {
      if (data == "invalid UID") {return false} else {return true}
    })
    .catch((error) => {
      console.error('Error:', error);
      return false;
    });
  }
}