export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  id: string | number;
  email: string;
  role: string;
};

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  const response = await fetch("http://localhost:8000/api/account/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Invalid credentials");
  }

  return response.json();
}