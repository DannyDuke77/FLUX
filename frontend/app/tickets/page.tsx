import TicketsPage from "./TicketsPage";
import { redirect } from "next/navigation";
import { getAuthUser } from "../lib/auth";
import apiService from "../services/apiService";

export default async function Page() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const departments = await apiService.get('/api/departments/');

  return <TicketsPage user={user} departments={departments.results} />;
}