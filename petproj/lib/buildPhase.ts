import { PHASE_PRODUCTION_BUILD } from "next/constants";

/** True while `next build` is prerendering pages, false when serving requests. */
export function isBuildPhase(): boolean {
    return process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
}
