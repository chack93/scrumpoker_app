export async function exampleRequest({
  someParameter = undefined
} = {}) {
  let query = "";
  query += someParameter ? `&someParameter=${someParameter}` : "";
  query = query ? "?" + query.substring(1) : "";
  return await request("GET", "/api/sprintpoker/endpoint" + query);
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
        else throw Error(response.statusText);
      })
      .then(({ body, header }) => {
        resolve({ body, header });
      })
      .catch((error) => {
        reject(error);
      });
  });
}
