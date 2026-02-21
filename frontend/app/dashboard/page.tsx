import LogoutButton from "../components/LogoutButton";
import { getAuthUser } from "../lib/auth";

const Dashboard = () => {
    return (
        <div>
            <h1>Dashboard</h1>

            <LogoutButton />
        </div>
    )
}

export default Dashboard;