async function fetchJson(input, init) {
  let response;
  let data;
  // const currentUser = await fetch("/api/auth/user").then((res) => res.json());

  // const headers = { "Content-Type": "application/json" };

  // if (currentUser?.authToken) {
  //   headers.Authorization = `Bearer ${currentUser.authToken}`;
  //   console.log("auth token found");
  // }
  try {
    response = await fetch(input, init);

    // Check if the response has a JSON content type
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      // Parse the JSON data from the response
      data = await response.json();
    } else {
      throw new FetchError({
        message: "Invalid content type",
        response,
        data: {
          message: "Expected JSON content type, but received: " + contentType,
        },
      });
    }
  } catch (error) {
    if (error instanceof FetchError) {
      throw error;
    } else {
      throw new FetchError({
        message: error.message,
        response,
        data: { message: "Network error: " + error.message },
      });
    }
  }

  if (response.ok) {
    return data;
  }

  throw new FetchError({
    message: response.statusText,
    response,
    data,
  });
}

class FetchError extends Error {
  response;
  data;

  constructor({ message, response, data }) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }

    this.name = "FetchError";
    this.response = response;
    this.data = data ?? { message: message };
  }
}

export default fetchJson;
export { FetchError };
