import { signOut } from "@/lib/auth";

export default function LogoutPage() {
  return (
    <main className="mx-auto mt-10 max-w-md p-4">
      <h1 className="mb-4 text-2xl font-bold">Logout</h1>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button className="rounded bg-zinc-800 px-4 py-2">Confirm logout</button>
      </form>
    </main>
  );
}
