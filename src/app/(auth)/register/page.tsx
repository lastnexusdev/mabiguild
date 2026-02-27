import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import RegisterForm from "./RegisterForm";
import Link from "next/link";

export const metadata = { title: "Register" };

export default async function RegisterPage() {
  const { user } = await validateRequest();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-white">
            🛡️ MabiGuild
          </Link>
          <h1 className="text-xl font-semibold text-slate-200 mt-4">
            Create your account
          </h1>
        </div>
        <div className="card bg-slate-800 border-slate-700 p-8">
          <RegisterForm />
          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
