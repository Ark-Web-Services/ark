// hooks/usePasswordLogin.js
import { useEffect, useState } from "react";
import fetchJson from "./fetchJson";
export function usePasswordLogin() {
  const [error, setError] = useState(undefined);
  const [loading, setLoading] = useState(false);
  // We use a local copy, since we don't want to update the session data until the login is successful.
  const [data, setData] = useState(undefined);
  const [loginRedirectUrl, setLoginRedirectUrl] = useState("");

  useEffect(() => {
    if (data) {
      console.log("Redirecting...");
      window.location.assign("/dashboard");
    }
  }, [data]);

  /**
   * A function to log the user in.
   * @param {string} username The username to log in with.
   * @param {string} password The password to log in with.
   * @param {string} redirectUrl An optional URL to redirect to after login.
   */
  async function login(username, password, redirectUrl) {
    // Clear old states.
    setError(undefined);
    setData(undefined);
    setLoading(true);
    setLoginRedirectUrl(redirectUrl);

    const loginUrl = `/api/auth/local/login`; // This is the route we created in step 3.

    try {
      const res = await fetchJson(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      setData(res);

      setLoading(false);
    } catch (error) {
      setError(error.error);
      setLoading(false);
    }
  }

  return {
    error,
    login,
    loading,
    data,
  };
}
