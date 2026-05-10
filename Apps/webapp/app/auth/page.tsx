import { redirect } from "next/navigation";

export default function AuthPageFallback() {
  // Redirect legacy /auth traffic to the homepage, perhaps with an ?auth=true parameter if desired, 
  // but just / is fine since the auth modal is triggered manually now.
  redirect("/?auth=true");
}
