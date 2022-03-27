const baseUrl = "/api/scrumpoker"

export async function reqClientFetch({
  clientId = ""
} = {}) {
  return await request("GET", `${baseUrl}/client/${clientId}`);
}
export async function reqClientCreate({
  name = "",
  sessionId = "",
  viewer = false
} = {}) {
  return await request("POST", `${baseUrl}/client`, {
    name,
    sessionId,
    viewer
  });
}

export async function reqSessionFetch({
  sessionId = ""
} = {}) {
  return await request("GET", `${baseUrl}/session/${sessionId}`);
}
export async function reqSessionJoinCodeFetch({
  joinCode = ""
} = {}) {
  return await request("GET", `${baseUrl}/session/join/${joinCode}`);
}
export async function reqSessionCreate({
  cardSelectionList = "",
  description = "",
  ownerClientId = ""
} = {}) {
  return await request("POST", `${baseUrl}/session`, {
    cardSelectionList,
    description,
    ownerClientId
  });
}

export function request(method, path, body) {
  return new Promise((resolve, reject) => {
    fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then(async (response) => {
        const header = {};
        for (let pair of response.headers.entries()) {
          header[pair[0]] = pair[1];
        }
        if (response.status >= 200 && response.status < 300) return { body: await response.json(), header };
        else reject(Error(`${response.status} - ${response.statusText}`));
      })
      .then(({ body, header }) => {
        resolve({ body, header });
      })
      .catch((error) => {
        reject(error);
      });
  });
}


