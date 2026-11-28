/**
 * Where a visitor is, worked out on our server from the browser location they
 * chose to share (PALTU-192). No third-party geocoder: the point is matched to
 * the nearest place in the lists below, and only the names are stored, never
 * the coordinates. Good enough to see which cities, provinces and Karachi
 * areas we reach; not an address.
 */

type Province =
    | "Sindh" | "Punjab" | "Khyber Pakhtunkhwa" | "Balochistan"
    | "Islamabad" | "Gilgit-Baltistan" | "Azad Kashmir";

type Place = { name: string; lat: number; lng: number };

// [city, lat, lng] per province. Rough city centres. Border towns are here too, so
// points near a border match the right side of it.
const PK_CITIES: Record<Province, [string, number, number][]> = {
    Sindh: [
        ["Islamkot", 24.7, 70.18], ["Nagarparkar", 24.356, 70.754], ["Kashmore", 28.432, 69.583],
        ["Karachi", 24.8607, 67.0011], ["Hyderabad", 25.396, 68.3578], ["Sukkur", 27.7052, 68.8574],
        ["Larkana", 27.557, 68.2264], ["Nawabshah", 26.2442, 68.41], ["Mirpur Khas", 25.5276, 69.0111],
        ["Jacobabad", 28.2769, 68.4514], ["Shikarpur", 27.9556, 68.6382], ["Khairpur", 27.5295, 68.7592],
        ["Dadu", 26.7319, 67.775], ["Thatta", 24.7461, 67.9235], ["Badin", 24.656, 68.837],
        ["Umerkot", 25.3616, 69.7362], ["Mithi", 24.74, 69.8], ["Ghotki", 28.006, 69.315],
        ["Sanghar", 26.0465, 68.9481], ["Tando Adam", 25.7676, 68.662], ["Tando Allahyar", 25.46, 68.72],
    ],
    Punjab: [
        ["Fort Abbas", 29.192, 72.854], ["Yazman", 29.123, 71.744], ["Derawar Fort", 28.768, 71.334], ["Chishtian", 29.797, 72.858], ["Liaquatpur", 28.93, 70.95], ["Fort Munro", 29.88, 69.98],
        ["Lahore", 31.5204, 74.3587], ["Faisalabad", 31.4504, 73.135], ["Rawalpindi", 33.5651, 73.0169],
        ["Multan", 30.1575, 71.5249], ["Gujranwala", 32.1877, 74.1945], ["Sialkot", 32.4945, 74.5229],
        ["Bahawalpur", 29.3956, 71.6836], ["Sargodha", 32.074, 72.6861], ["Sheikhupura", 31.7167, 73.985],
        ["Jhang", 31.2681, 72.3181], ["Rahim Yar Khan", 28.4202, 70.2952], ["Gujrat", 32.5731, 74.0789],
        ["Kasur", 31.1187, 74.4508], ["Sahiwal", 30.6682, 73.1114], ["Okara", 30.8138, 73.4534],
        ["Dera Ghazi Khan", 30.0459, 70.6403], ["Chiniot", 31.72, 72.9789], ["Sadiqabad", 28.3091, 70.1265],
        ["Burewala", 30.1667, 72.65], ["Jhelum", 32.9405, 73.7276], ["Khanewal", 30.3017, 71.9321],
        ["Hafizabad", 32.0709, 73.688], ["Muzaffargarh", 30.0703, 71.1933], ["Mandi Bahauddin", 32.5861, 73.4917],
        ["Attock", 33.766, 72.3609], ["Chakwal", 32.9328, 72.863], ["Mianwali", 32.5839, 71.537],
        ["Bahawalnagar", 29.9987, 73.2536], ["Vehari", 30.0445, 72.3556], ["Murree", 33.907, 73.3943],
        ["Taxila", 33.746, 72.8397], ["Pakpattan", 30.3436, 73.386], ["Toba Tek Singh", 30.9709, 72.4826],
        ["Narowal", 32.102, 74.873], ["Layyah", 30.9693, 70.9428], ["Lodhran", 29.5339, 71.6324],
        ["Khushab", 32.2967, 72.3525], ["Bhakkar", 31.6253, 71.0657], ["Rajanpur", 29.1044, 70.3301],
    ],
    "Khyber Pakhtunkhwa": [
        ["Parachinar", 33.8992, 70.1008], ["Miranshah", 33.0, 70.07], ["Wana", 32.3, 69.57], ["Khar (Bajaur)", 34.73, 71.52], ["Landi Kotal", 34.098, 71.142], ["Tank", 32.217, 70.383], ["Dir", 35.2, 71.88],
        ["Peshawar", 34.0151, 71.5249], ["Mardan", 34.1989, 72.0231], ["Abbottabad", 34.1688, 73.2215],
        ["Mingora (Swat)", 34.7717, 72.36], ["Kohat", 33.5869, 71.4429], ["Dera Ismail Khan", 31.8314, 70.9019],
        ["Nowshera", 34.0153, 71.9747], ["Charsadda", 34.1453, 71.7308], ["Mansehra", 34.3302, 73.1968],
        ["Bannu", 32.9861, 70.6042], ["Swabi", 34.1201, 72.4702], ["Haripur", 33.9946, 72.9106],
        ["Chitral", 35.8518, 71.7864], ["Timergara", 34.8281, 71.8408], ["Karak", 33.1167, 71.0944],
    ],
    Balochistan: [
        ["Taftan", 28.97, 61.57], ["Nokkundi", 28.82, 62.75], ["Dalbandin", 28.89, 64.41], ["Kharan", 28.58, 65.42], ["Panjgur", 26.97, 64.09], ["Pishin", 30.58, 67.0], ["Qila Saifullah", 30.7, 68.36], ["Kalat", 29.03, 66.59], ["Pasni", 25.26, 63.47], ["Ormara", 25.21, 64.64], ["Jiwani", 25.05, 61.75], ["Mand", 26.08, 62.05], ["Washuk", 27.73, 64.8], ["Dera Bugti", 29.03, 69.15], ["Barkhan", 29.9, 69.52],
        ["Quetta", 30.1798, 66.975], ["Gwadar", 25.1264, 62.3225], ["Turbat", 26.0023, 63.044],
        ["Khuzdar", 27.8, 66.6167], ["Hub", 25.05, 66.8833], ["Sibi", 29.543, 67.877],
        ["Chaman", 30.921, 66.4597], ["Zhob", 31.3417, 69.4486], ["Loralai", 30.3705, 68.598],
    ],
    Islamabad: [["Islamabad", 33.6844, 73.0479]],
    "Gilgit-Baltistan": [
        ["Chilas", 35.42, 74.1], ["Khaplu", 35.15, 76.33], ["Sost", 36.69, 74.82],["Gilgit", 35.9208, 74.308], ["Skardu", 35.2971, 75.6333], ["Hunza", 36.3167, 74.65]],
    "Azad Kashmir": [
        ["Muzaffarabad", 34.37, 73.4711], ["Mirpur", 33.1478, 73.7518],
        ["Rawalakot", 33.8578, 73.7604], ["Kotli", 33.518, 73.9022],
    ],
};

// Towns just across the border, so a point there isn't counted as the nearby
// Pakistani city.
const FOREIGN_NEAR_BORDER: Place[] = [
    // India
    { name: "Amritsar", lat: 31.634, lng: 74.8723 },
    { name: "Firozpur", lat: 30.9331, lng: 74.6225 },
    { name: "Jalandhar", lat: 31.326, lng: 75.5762 },
    { name: "Ludhiana", lat: 30.901, lng: 75.8573 },
    { name: "Bathinda", lat: 30.211, lng: 74.9455 },
    { name: "Sri Ganganagar", lat: 29.9038, lng: 73.8772 },
    { name: "Bikaner", lat: 28.0229, lng: 73.3119 },
    { name: "Jaisalmer", lat: 26.9157, lng: 70.9083 },
    { name: "Barmer", lat: 25.7521, lng: 71.3967 },
    { name: "Bhuj", lat: 23.242, lng: 69.6669 },
    { name: "Jammu", lat: 32.7266, lng: 74.857 },
    // Afghanistan
    { name: "Kabul", lat: 34.5553, lng: 69.2075 },
    { name: "Jalalabad", lat: 34.4265, lng: 70.4515 },
    { name: "Khost", lat: 33.3395, lng: 69.9204 },
    { name: "Gardez", lat: 33.5974, lng: 69.2259 },
    { name: "Ghazni", lat: 33.5536, lng: 68.4269 },
    { name: "Kandahar", lat: 31.628, lng: 65.7372 },
    { name: "Spin Boldak", lat: 31.0058, lng: 66.3997 },
    { name: "Lashkar Gah", lat: 31.5938, lng: 64.3716 },
    { name: "Zaranj", lat: 30.9597, lng: 61.8604 },
    { name: "Asadabad", lat: 34.8742, lng: 71.1528 },
    { name: "Faizabad", lat: 37.1166, lng: 70.58 },
    // Iran
    { name: "Zahedan", lat: 29.4963, lng: 60.8629 },
    { name: "Saravan", lat: 27.3709, lng: 62.3342 },
    { name: "Chabahar", lat: 25.2919, lng: 60.643 },
];

// Pakistan, generously. Outside this box is "Outside Pakistan" outright.
const PK_BOUNDS = { minLat: 23.6, maxLat: 37.1, minLng: 60.8, maxLng: 77.9 };
// Further than this from every city on the list: we know the province, not the city.
const MAX_CITY_KM = 60;

type District = "South" | "East" | "Central" | "West" | "Keamari" | "Korangi" | "Malir";

// Rough centre of each Karachi neighbourhood.
const KARACHI_AREAS: { area: string; district: District; lat: number; lng: number }[] = [
    { area: "Clifton", district: "South", lat: 24.8138, lng: 67.03 },
    { area: "DHA", district: "South", lat: 24.795, lng: 67.065 },
    { area: "Saddar", district: "South", lat: 24.8556, lng: 67.0275 },
    { area: "Lyari", district: "South", lat: 24.865, lng: 66.996 },
    { area: "Garden", district: "South", lat: 24.877, lng: 67.015 },
    { area: "PECHS & Tariq Road", district: "East", lat: 24.871, lng: 67.059 },
    { area: "Bahadurabad", district: "East", lat: 24.882, lng: 67.07 },
    { area: "Gulshan-e-Iqbal", district: "East", lat: 24.918, lng: 67.097 },
    { area: "Gulistan-e-Johar", district: "East", lat: 24.918, lng: 67.13 },
    { area: "Scheme 33", district: "East", lat: 24.95, lng: 67.135 },
    { area: "Nazimabad", district: "Central", lat: 24.91, lng: 67.03 },
    { area: "North Nazimabad", district: "Central", lat: 24.942, lng: 67.04 },
    { area: "Liaquatabad", district: "Central", lat: 24.905, lng: 67.045 },
    { area: "Gulberg & FB Area", district: "Central", lat: 24.93, lng: 67.07 },
    { area: "North Karachi", district: "Central", lat: 24.975, lng: 67.055 },
    { area: "New Karachi", district: "Central", lat: 24.99, lng: 67.065 },
    { area: "Orangi", district: "West", lat: 24.95, lng: 66.99 },
    { area: "Manghopir", district: "West", lat: 24.99, lng: 67.01 },
    { area: "SITE", district: "Keamari", lat: 24.905, lng: 66.995 },
    { area: "Baldia", district: "Keamari", lat: 24.92, lng: 66.96 },
    { area: "Keamari & Manora", district: "Keamari", lat: 24.83, lng: 66.98 },
    { area: "Mauripur & Hawke's Bay", district: "Keamari", lat: 24.88, lng: 66.92 },
    { area: "Korangi", district: "Korangi", lat: 24.83, lng: 67.13 },
    { area: "Landhi", district: "Korangi", lat: 24.85, lng: 67.2 },
    { area: "Shah Faisal", district: "Korangi", lat: 24.875, lng: 67.16 },
    { area: "Malir", district: "Malir", lat: 24.893, lng: 67.2 },
    { area: "Malir Cantt", district: "Malir", lat: 24.95, lng: 67.2 },
    { area: "Bahria Town", district: "Malir", lat: 25.0, lng: 67.31 },
    { area: "Bin Qasim", district: "Malir", lat: 24.82, lng: 67.35 },
    { area: "Gadap", district: "Malir", lat: 25.06, lng: 67.15 },
];

// Karachi division, generously: anything in here is Karachi, whatever is nearest.
const KARACHI_BOUNDS = { minLat: 24.7, maxLat: 25.35, minLng: 66.6, maxLng: 67.65 };

function km(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function inBox(lat: number, lng: number, b: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
    return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

export function karachiArea(lat: number, lng: number): { area: string; district: District } | null {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inBox(lat, lng, KARACHI_BOUNDS)) return null;
    let best = KARACHI_AREAS[0];
    let bestKm = Infinity;
    for (const a of KARACHI_AREAS) {
        const d = km(lat, lng, a.lat, a.lng);
        if (d < bestKm) {
            bestKm = d;
            best = a;
        }
    }
    return { area: best.area, district: best.district };
}

export interface VisitorPlace {
    country: "Pakistan" | "Outside Pakistan";
    province: Province | null;
    city: string | null;
    district: District | null;
    area: string | null;
}

const OUTSIDE: VisitorPlace = { country: "Outside Pakistan", province: null, city: null, district: null, area: null };

export function placeFor(lat: number, lng: number): VisitorPlace | null {
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

    const karachi = karachiArea(lat, lng);
    if (karachi) return { country: "Pakistan", province: "Sindh", city: "Karachi", ...karachi };
    if (!inBox(lat, lng, PK_BOUNDS)) return OUTSIDE;

    let best: { province: Province; city: string; km: number } | null = null;
    for (const [province, cities] of Object.entries(PK_CITIES) as [Province, [string, number, number][]][]) {
        for (const [city, cLat, cLng] of cities) {
            const d = km(lat, lng, cLat, cLng);
            if (!best || d < best.km) best = { province, city, km: d };
        }
    }
    if (!best) return OUTSIDE;
    if (FOREIGN_NEAR_BORDER.some((f) => km(lat, lng, f.lat, f.lng) < best!.km)) return OUTSIDE;
    // The box also covers bits of Afghanistan, Iran and India: very far from every
    // Pakistani city means we're probably not in Pakistan.
    if (best.km > 250) return OUTSIDE;

    return {
        country: "Pakistan",
        province: best.province,
        city: best.km <= MAX_CITY_KM ? best.city : null,
        district: null,
        area: null,
    };
}
