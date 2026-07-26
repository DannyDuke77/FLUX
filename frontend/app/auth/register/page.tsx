import RegisterPage from "./RegisterPage.tsx";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/app/lib/auth";
import apiService from "@/app/services/apiService";

export default async function Page() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const departments = await apiService.get('/api/departments/');

  return <RegisterPage user={user} departments={departments.results} />;
}