import { getAccessToken } from "../lib/actions";

const API_URL =
  typeof window === "undefined"
    ? process.env.INTERNAL_API_URL
    : process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "API_URL is not defined"
  );
};

const apiService = {
  get: async (url: string) => {
    try {
      const fullUrl = `${API_URL}${url}`;

      const token = await getAccessToken();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      console.log("🌐 Fetching from:", fullUrl);
      // console.log("🛡️ Using headers:", headers);

      const response = await fetch(fullUrl, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      // console.log("📡 Response status:", response.status);

      if (response.status === 204) {
        console.log("⚠️ No content in response (204)");
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API error response:", errorText);
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      
      // console.log("✅ Data received:", data);
      return data;
    } catch (error) {
      console.error("❌ API call failed:", error);

      if (error instanceof Error) {
        console.error("❌ API call failed with error name:", error.name);
        console.error("❌ API call failed with error message:", error.message);
        console.error("❌ API call failed with stack trace:", error.stack);
        console.error("❌ API call failed with error cause:", error.cause);
      }
      throw error;
    }
  },

  post: async (url: string, data: any): Promise<any> => {
    const headers: Record<string, string> = {};

    // Attach token if not logging in
    if (!url.includes('/auth/login')) {
        const token = await getAccessToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    // Handle JSON vs FormData
    if (!(data instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        data = JSON.stringify(data);
    }

    console.log("🌐 Posting to:", `${API_URL}${url}`);

    const response = await fetch(`${API_URL}${url}`, {
        method: "POST",
        headers,
        body: data,
    });

    if (!response.ok) {
        let errorData: any;
        try {
            const text = await response.text();
            errorData = text ? JSON.parse(text) : { detail: response.statusText };
        } catch {
            errorData = { detail: response.statusText };
        }
        throw { response: { data: errorData } };
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },

  patch: async (url: string, data: any): Promise<any> => {
    const headers: Record<string, string> = {};
    const token = await getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    if (!(data instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        data = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${url}`, {
        method: "PATCH",
        headers,
        body: data,
    });

    if (!response.ok) {
        let errorData: any;
        try {
            const text = await response.text();
            errorData = text ? JSON.parse(text) : { detail: response.statusText };
        } catch {
            errorData = { detail: response.statusText };
        }
        throw { response: { data: errorData } };
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },

  delete: async function (url: string): Promise<any> {
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      console.log("🗑️ Deleting:", `${API_URL}${url}`);

      const response = await fetch(`${API_URL}${url}`, {
        method: "DELETE",
        headers,
      });

      if (response.status === 204) {
        return true;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ DELETE error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("❌ DELETE failed:", error);
      throw error;
    }
  },

  getBlob: async (url: string): Promise<Blob> => {
    const token = await getAccessToken();

    const response = await fetch(`${API_URL}${url}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized - Session expired");
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.blob();
  },
};

export default apiService;