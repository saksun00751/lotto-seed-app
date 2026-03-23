import Navbar from "./Navbar";
import { getAnnouncementTicker } from "@/lib/db/notices";

interface Props {
  balance?: number;
  diamond?: number;
  userName?: string;
  userPhone?: string;
}

export default async function NavbarServer(props: Props) {
  const ticker = await getAnnouncementTicker();
  return <Navbar {...props} ticker={ticker} />;
}
