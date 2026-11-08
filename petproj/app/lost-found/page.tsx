import TopicForumPage, { topicMetadata } from "@/components/community/TopicForumPage";

export const revalidate = 600;

export function generateMetadata() {
    return topicMetadata("lost-found");
}

export default function Page() {
    return <TopicForumPage slug="lost-found" />;
}
