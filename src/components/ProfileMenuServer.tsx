import { getSessionUser } from "@/lib/auth";
import ProfileMenu from "./ProfileMenu";

export default async function ProfileMenuServer() {
  const user = await getSessionUser();
  return <ProfileMenu name={user?.name} email={user?.email} />;
}
