import { getAuthUser } from "@/app/lib/auth";
import AppSidebar from "../navigation/AppSidebar";

const Navbar = async () => {
    const user = await getAuthUser();

    console.log("Navbar user:", user);
    
    if (!user) {
        return null
    }

    return <AppSidebar appUser={user} />
    
}

export default Navbar;