import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import AccountForm from "./AccountForm";

export const metadata = { title: "My Account" };

export default async function AccountPage() {
  const { user } = await validateRequest();
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      <div className="card p-6">
        <AccountForm user={user} />
      </div>
    </div>
  );
}
