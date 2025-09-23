import { Separator } from "@/components/ui/separator";

const tabs = ["Posts", "Photos", "More"];

export function ProfileTabs() {
  return (
    <div className="bg-white rounded-lg shadow-md mt-4 p-2">
      <div className="flex justify-center items-center">
        <nav className="flex">
          {tabs.map((tab) => (
            <a
              key={tab}
              href="#"
              className={`px-4 py-3 font-semibold text-gray-600 hover:bg-[#fdf8f2] rounded-md
                ${
                  tab === "Posts"
                    ? "border-b-4 border-[#dd8d34] rounded-none hover:bg-transparent"
                    : ""
                }`}
            >
              {tab}
            </a>
          ))}
        </nav>
      </div>
      <Separator className="mt-2 md:hidden" />
    </div>
  );
}
