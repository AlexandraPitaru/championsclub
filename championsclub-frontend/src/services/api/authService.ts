export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  email: string;
  user_id: number;
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
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "Login failed. Please try again."
    );
  }

  return response.json();
}