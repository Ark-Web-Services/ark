// src/client.js
import { ApolloClient, InMemoryCache, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { createUploadLink } from "apollo-upload-client";

const authLink = setContext(async (_, { headers }) => {
  // const currentUser = await fetch("/api/auth/user/verify").then((res) =>
  //   res.json()
  // );
  const authHeaders = { "Content-Type": "application/json" };
  // console.log(currentUser.authToken);
  // if (currentUser?.authToken) {
  // console.log("current user");
  // authHeaders.Authorization = `Bearer ${currentUser.authToken}`;
  // }

  return {
    headers: {
      ...headers,
      ...authHeaders,
    },
  };
});

const uploadLink = createUploadLink({
  uri: process.env.NEXT_PUBLIC_WORDPRESS_API_URL,
  credentials: "include",
});

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: from([authLink, uploadLink]),
});

export default client;
