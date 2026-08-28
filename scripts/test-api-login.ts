async function test() {
  // 1. Get CSRF token
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const cookie = csrfRes.headers.get("set-cookie") || "";

  console.log("CSRF token:", csrfToken);
  console.log("Cookie:", cookie);

  // 2. Post login
  const body = new URLSearchParams({
    identifier: "khadijahabass273@gmail.com",
    password: "Admin@123",
    csrfToken,
    callbackUrl: "http://localhost:3000/admin/dashboard",
    json: "true",
  });

  const res = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookie,
    },
    body: body.toString(),
  });

  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
}

test().catch(console.error);
