import CityForumPage, { cityMetadata } from "@/components/community/CityForumPage";

export const revalidate = 600;

export function generateMetadata() {
    return cityMetadata("islamabad");
}

export default function Page() {
    return <CityForumPage slug="islamabad" />;
}
