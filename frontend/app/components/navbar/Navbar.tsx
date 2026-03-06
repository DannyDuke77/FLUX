import { getAuthUser } from "@/app/lib/auth";
import AppSidebar from "../navigation/AppSidebar";

const DEBUG = process.env.NODE_ENV !== 'production';

const Navbar = async () => {
    const user = await getAuthUser();

    if (DEBUG) console.log("Navbar user:", user);
    
    if (!user) {
        return null
    }

    return <AppSidebar appUser={user} />
    
}

export default Navbar;