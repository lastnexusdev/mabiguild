import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import CreateSiteForm from "./CreateSiteForm";

export const metadata = { title: "Create a Site" };

export default async function CreateSitePage() {
  const { user } = await validateRequest();
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Create Your Community Site</h1>
      <p className="text-slate-500 mb-8">
        Set up your site in seconds. You can change the name and description
        later from the admin panel.
      </p>
      <div className="card p-8">
        <CreateSiteForm />
      </div>
    </div>
  );
}
