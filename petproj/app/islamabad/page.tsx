import CityForumPage, { cityMetadata } from "@/components/community/CityForumPage";

export const revalidate = 3600; // new posts revalidate their city forum on demand (PALTU-186)

export function generateMetadata() {
    return cityMetadata("islamabad");
}

export default function Page() {
    return <CityForumPage slug="islamabad" />;
}
