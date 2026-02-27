import { signOut } from "@/lib/auth";

export default function LogoutPage() {
  return (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }} className="p-8">
      <button className="bg-zinc-800 px-4 py-2 rounded">Logout</button>
    </form>
  );
}
