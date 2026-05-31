import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    // Admin panels
                    '/admin-panel',
                    '/admin-panel/',
                    '/admin-pet',
                    '/admin-user',
                    '/admin-approve-vets',
                    '/admin-clinics-vets',
                    '/admin/',
                    '/bazaar-admin',
                    '/rescue-panel',
                    '/shop-panel',
                    '/vendor-panel',
                    '/vet-panel',

                    // Vet onboarding flows (not public pages)
                    '/vet-register',
                    '/vet-step-zero',
                    '/vet-get-verified-1',
                    '/vet-get-verified-2',
                    '/vet-qualifications',
                    '/vet-specialization',
                    '/vet-schedule',
                    '/vet-reviews-summary',
                    '/vet-process-complete',

                    // Auth & account pages
                    '/auth',
                    '/sign-up',
                    '/forgot-password',
                    '/reset-password',
                    '/my-profile',
                    '/my-orders',
                    '/my-applications',
                    '/my-listings',
                    '/notifications',
                    '/profile',

                    // Transactional pages (login walls or post-action)
                    '/cart',
                    '/checkout',
                    '/order-confirmed',
                    '/orders',
                    '/payment-confirmation',
                    '/listing-created',
                    '/listing-created-lost-and-found',
                    '/success',

                    // Utility / internal tools
                    '/upload-images',
                    '/lost-and-found-images',
                    '/lost-and-found-create-listing',
                    '/bulk-upload-pets',
                    '/pwa-debug',
                    '/api-docs',

                    // Shop / rescue onboarding
                    '/shop-register',
                    '/rescue-register',
                    '/partner-signup',

                    // API routes — never crawl
                    '/api/',
                ],
            },
        ],
        sitemap: 'https://paltuu.pk/sitemap.xml',
    };
}
