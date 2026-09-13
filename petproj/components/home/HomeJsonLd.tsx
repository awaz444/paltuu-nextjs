import { homeWebPageSchema, vetsAtHomeServiceSchema, jsonLdScript } from "@/lib/jsonLd";

/**
 * Structured data for the homepage. The Organization and WebSite blocks live in
 * app/layout.tsx; these two are page-specific.
 */
export default function HomeJsonLd() {
    return (
        <>
            <script {...jsonLdScript(homeWebPageSchema())} />
            <script {...jsonLdScript(vetsAtHomeServiceSchema())} />
        </>
    );
}
