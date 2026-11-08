import TopicForumPage, { topicMetadata } from "@/components/community/TopicForumPage";

export const revalidate = 600;

export function generateMetadata() {
    return topicMetadata("adoption");
}

export default function Page() {
    return <TopicForumPage slug="adoption" />;
}
