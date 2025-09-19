import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api",
});

API.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as any;
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh") : null;
      if (refresh) {
        try {
          const res = await API.post("/token/refresh", { refresh });
          const newAccess = res.data.access;
          localStorage.setItem("access", newAccess);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return API(original);
        } catch (err) {
          logout();
          window.location.href = "/login";
        }
      } else {
        logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export type UUID = string;

// ---------- Auth ----------
export async function login(email: string, password: string) {
  const res = await API.post("/token/pair", {
    username: email, 
    password,
  });
  localStorage.setItem("access", res.data.access);
  localStorage.setItem("refresh", res.data.refresh);
}

export async function register(email: string, password: string) {
  await API.post("/register", { email, password });
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  }
}

export function logoutAndRedirect() {
  logout();
  window.location.href = "/login";
}

// ---------- Me ----------
export async function fetchMe() {
  const res = await API.get("/me");
  return res.data;
}

export async function updateMe(data: { email?: string; password?: string }) {
  const res = await API.put("/me", data);
  return res.data;
}

export async function getMe() {
  const res = await API.get("/me");
  return res.data;
}

// ---------- Workspaces ----------
export type Workspace = { id: UUID; name: string; owner_id: number };
export type Membership = {
  id: UUID;
  user_id: number;
  workspace_id: UUID;
  role: "owner" | "admin" | "member";
  email?: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
};

export async function listWorkspaces() {
  const res = await API.get("/workspaces");
  return res.data;
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const res = await API.get("/workspaces");
  return res.data;
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const res = await API.post("/workspaces", { name });
  return res.data;
}

export async function deleteWorkspace(workspaceId: UUID): Promise<void> {
  await API.delete(`/workspaces/${workspaceId}`);
}

export async function listMembers(workspaceId: UUID): Promise<Membership[]> {
  const res = await API.get(`/workspaces/${workspaceId}/members`);
  return res.data;
}

export async function inviteMember(
  workspaceId: UUID,
  payload: { email: string; role: "admin" | "member"; can_read?: boolean; can_write?: boolean; can_delete?: boolean }
): Promise<Membership> {
  const res = await API.post(`/workspaces/${workspaceId}/invite`, payload);
  return res.data;
}

export async function updateMember(
  workspaceId: UUID,
  memberId: UUID,
  patch: Partial<Omit<Membership, "id" | "user_id" | "workspace_id">> & { role?: "admin" | "member" }
): Promise<Membership> {
  const res = await API.put(`/workspaces/${workspaceId}/members/${memberId}`, patch);
  return res.data;
}

export async function removeMember(workspaceId: UUID, memberId: UUID): Promise<void> {
  await API.delete(`/workspaces/${workspaceId}/members/${memberId}`);
}

// ---------- Files----------
export type FileType = {
  id: UUID;
  name: string;
  code_content: string | null;
  whiteboard_state: any;
  workspace: number; 
  created_at: string;
  updated_at: string;
};

export async function fetchFiles(workspaceId: UUID): Promise<FileType[]> {
  const res = await API.get(`/workspaces/${workspaceId}/files`);
  return res.data;
}

export async function fetchFile(workspaceId: UUID, id: string | number): Promise<FileType> {
  const res = await API.get(`/workspaces/${workspaceId}/files/${id}`);
  return res.data;
}

export async function createFile(workspaceId: UUID, name: string): Promise<FileType> {
  const res = await API.post(`/workspaces/${workspaceId}/files`, { name, workspace_id: workspaceId });
  return res.data;
}

export async function updateFile(workspaceId: UUID, id: string | number, data: any): Promise<FileType> {
  const res = await API.put(`/workspaces/${workspaceId}/files/${id}`, data);
  return res.data;
}

export async function getOrCreateLastFile(workspaceId: UUID) {
  const res = await API.get(`/workspaces/${workspaceId}/files`);
  if (res.data.length > 0) {
    return res.data[0];
  }
  const createRes = await API.post(`/workspaces/${workspaceId}/files`, {
    name: "Untitled",
  });
  return createRes.data;
}

export async function deleteFile(workspaceId: UUID, id: UUID): Promise<void> {
  await API.delete(`/workspaces/${workspaceId}/files/${id}`);
}

export type UserType = {
  id: number;
  username: string;
  email: string;
};

export async function searchUsers(query: string, workspaceId?: UUID): Promise<UserType[]> {
  const res = await API.get(`/users`, {
    params: { q: query, workspace_id: workspaceId },
  });
  return res.data;
}

export async function searchUsersForSuperuser(query: string): Promise<UserType[]> {
  const res = await API.get("/users/search_for_superuser", {
    params: { q: query },
  });
  return res.data;
}

export async function listSuperusers() {
  const res = await API.get("/superusers");
  return res.data as UserType[];
}

export async function setSuperuser(userId: number, isSuperuser: boolean) {
  const res = await API.put(`/superusers/${userId}`, null, {
    params: { is_superuser: isSuperuser },
  });
  return res.data;
}

export async function getRegistrationSetting(): Promise<{ allow_registration: boolean }> {
  const res = await API.get("/settings/registration");
  return res.data;
}

export async function setRegistrationSetting(allow: boolean): Promise<{ allow_registration: boolean }> {
  const res = await API.put("/settings/registration", null, {
    params: { allow_registration: allow },
  });
  return res.data;
}

export default API;
