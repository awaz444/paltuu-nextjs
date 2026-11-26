import TopicForumPage, { topicMetadata } from "@/components/community/TopicForumPage";

export const revalidate = 3600; // new posts revalidate their topic on demand (PALTU-186)

export function generateMetadata() {
    return topicMetadata("lost-found");
}

export default function Page() {
    return <TopicForumPage slug="lost-found" />;
}
