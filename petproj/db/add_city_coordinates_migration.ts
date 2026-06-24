import pg from 'pg';
const { Pool } = pg;
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = new Pool({
  connectionString: process.env.NEW_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Approximate centroid coordinates (lat, lng) for every city_name currently
// seeded in the `cities` table. Used to resolve "nearest city" from a
// device's GPS position, since pets/listings are stored by city_id rather
// than raw coordinates. Precision is town-level (a few km), which is enough
// for a "near you" heuristic — not relied on for anything safety-critical.
const CITY_COORDS: Record<string, [number, number]> = {
  Karachi: [24.8607, 67.0011],
  Islamabad: [33.6844, 73.0479],
  Lahore: [31.5497, 74.3436],
  Abbottabad: [34.1463, 73.2117],
  Adezai: [34.05, 71.4],
  'Ahmed Nager': [32.1, 74.0],
  'Ahmadpur East': [29.1481, 71.2566],
  'Akora Khattak': [33.9333, 71.9833],
  'Ali Khan': [29.3, 71.5],
  Alipur: [29.385, 70.9114],
  Alpuri: [34.8167, 72.6333],
  Arifwala: [30.2972, 73.0822],
  Attock: [33.7676, 72.3601],
  Awaran: [26.487, 65.2306],
  Ayubia: [34.0667, 73.4167],
  Badin: [24.6553, 68.8378],
  Bahawalnagar: [29.9989, 73.2536],
  Bahawalpur: [29.3956, 71.6722],
  'Banda Daud': [33.2, 71.0833],
  Bannu: [32.9858, 70.6028],
  Barkhan: [29.8978, 69.5275],
  Batkhela: [34.6167, 71.9667],
  Battagram: [34.6789, 73.0233],
  Bhakkar: [31.6235, 71.066],
  Bhalwal: [32.2656, 72.8889],
  Bhera: [32.4814, 72.9106],
  Bhirkan: [27.5, 68.5],
  Birote: [34.8, 73.9],
  Burewala: [30.1797, 72.6878],
  Chagai: [28.88, 64.4],
  Chak: [25.5, 68.5],
  Chakdara: [34.6333, 72.0333],
  Chakwal: [32.9333, 72.85],
  Charsadda: [34.1469, 71.7375],
  Chichawatni: [30.5333, 72.7],
  Chillianwala: [32.6833, 73.9333],
  Chiniot: [31.72, 72.98],
  Chishtian: [29.7964, 72.8606],
  Chitral: [35.8511, 71.7861],
  Dadu: [26.7308, 67.7758],
  Daggar: [34.5167, 72.45],
  Dargai: [34.55, 71.9167],
  'Darya Khan': [31.7833, 71.1167],
  Daska: [32.3267, 74.35],
  'Dera Bugti': [29.0319, 69.1572],
  'Dera Ghazi': [30.05, 70.6333],
  'Dera Ismail': [31.8295, 70.9019],
  Dhaular: [32.7, 73.9],
  Digri: [25.1664, 69.1208],
  Dina: [33.0, 73.5833],
  Dinga: [32.6333, 73.7333],
  Dipalpur: [30.6667, 73.65],
  Diplo: [24.4717, 69.5817],
  Dir: [35.2, 71.8667],
  Doaba: [33.1, 70.85],
  Dokri: [27.3717, 68.1078],
  Drosh: [35.5667, 71.7833],
  Faisalabad: [31.4504, 73.135],
  'Fateh Jhang': [33.5667, 72.6333],
  'Ghakhar Mandi': [32.2667, 74.15],
  Ghotki: [28.0078, 69.3158],
  Gojra: [31.15, 72.6833],
  'Gujar Khan': [33.25, 73.3],
  Gujranwala: [32.1877, 74.1945],
  Gujrat: [32.574, 74.0789],
  Gwadar: [25.1216, 62.3254],
  Haala: [25.8089, 68.4233],
  Hafizabad: [32.071, 73.6883],
  Hangu: [33.5314, 71.0586],
  Haripur: [33.9966, 72.9333],
  Harnai: [30.0989, 67.9342],
  Haroonabad: [29.5667, 73.15],
  Hasilpur: [29.6833, 72.55],
  Haveli: [30.7667, 73.6333],
  Hyderabad: [25.396, 68.3578],
  Islamkot: [24.6989, 70.1786],
  Jacobabad: [28.2769, 68.4514],
  Jafarabad: [28.1761, 68.0397],
  Jalalpur: [32.65, 74.2167],
  Jampur: [29.65, 70.5833],
  Jamshoro: [25.4306, 68.2728],
  Jaranwala: [31.3333, 73.4167],
  Jattan: [32.65, 74.2167],
  Jauharabad: [32.2833, 72.2667],
  'Jhal Magsi': [28.2833, 67.5667],
  Jhang: [31.2781, 72.3317],
  Jhelum: [32.9425, 73.7257],
  Jungshahi: [24.8978, 67.7711],
  Kacchi: [29.4, 67.6],
  Kalabagh: [32.9667, 71.55],
  Kalat: [29.0234, 66.5891],
  Kamalia: [30.7333, 72.65],
  Kamoke: [32.0833, 74.2167],
  Kandhkot: [28.2433, 69.1817],
  Kandiaro: [27.0667, 68.2167],
  Karak: [33.1192, 71.095],
  'Karor Lal': [30.9667, 70.9667],
  Kashmore: [28.4322, 69.5828],
  Kasur: [31.118, 74.4467],
  Kech: [26.0042, 63.0481],
  'Keti Bandar': [24.1419, 67.4497],
  Khairpur: [27.5295, 68.7592],
  Khanewal: [30.3015, 71.932],
  Khanpur: [28.65, 70.65],
  Kharan: [28.5833, 65.4167],
  Kharian: [32.8167, 73.8667],
  Khushab: [32.2967, 72.3533],
  Khuzdar: [27.8, 66.6167],
  'Killa Abdullah': [30.9667, 66.5333],
  'Killa Saifullah': [30.7167, 68.3667],
  Kohat: [33.5869, 71.4453],
  Kohlu: [29.895, 69.255],
  'Kot Adu': [30.4667, 70.9667],
  Kotri: [25.3667, 68.3083],
  Kulachi: [31.9333, 70.4667],
  Lakha: [30.7667, 73.6333],
  'Lakki Marwat': [32.6086, 70.9117],
  Lalamusa: [32.6833, 73.95],
  Lehri: [29.2, 67.8],
  Larkana: [27.559, 68.212],
  Lasbela: [25.8072, 66.6219],
  Latamber: [33.2, 71.1],
  Layyah: [30.9667, 70.9333],
  'Liaquat Pur': [29.05, 70.9667],
  Lodhran: [29.5333, 71.6333],
  Loralai: [30.3711, 68.5972],
  Madyan: [35.0167, 72.5667],
  Mailsi: [29.8, 72.1667],
  Malakwal: [32.55, 73.2],
  Mamoori: [30.0, 71.5],
  'Mandi Bahauddin': [32.5864, 73.4914],
  Mansehra: [34.33, 73.2],
  Mardan: [34.1986, 72.0497],
  Mastuj: [36.2833, 72.5],
  Mastung: [29.7986, 66.8453],
  Matiari: [25.5969, 68.4514],
  Mehar: [27.1739, 67.8158],
  Mehrabpur: [27.1731, 68.2914],
  'Mian Channu': [30.4333, 72.35],
  Mianwali: [32.5839, 71.5371],
  'Mianwali Bangla': [32.05, 73.5],
  Mingora: [34.7717, 72.3597],
  'Mirpur Khas': [25.5266, 69.0113],
  Mithani: [25.4, 68.9],
  Mithi: [24.7372, 69.7975],
  Moro: [26.6536, 68.0011],
  Multan: [30.1575, 71.5249],
  Muridke: [31.8025, 74.258],
  Murree: [33.907, 73.3943],
  Musakhel: [30.85, 69.8],
  Muzaffargarh: [30.0703, 71.1933],
  Nagarparkar: [24.3667, 70.5333],
  Narowal: [32.1014, 74.8772],
  Nasirabad: [28.5167, 68.2667],
  Naudero: [27.65, 68.15],
  'Naushahro Feroze': [26.84, 68.13],
  Naushara: [26.0, 68.3],
  Nawabshah: [26.2442, 68.41],
  Nazimabad: [24.93, 67.03],
  Nowshera: [33.93, 71.975],
  Nushki: [29.555, 66.0214],
  Okara: [30.8081, 73.4534],
  Pabbi: [33.9931, 71.8917],
  Paharpur: [31.9, 70.8],
  Pakpattan: [30.3414, 73.3865],
  Panjgur: [26.9719, 64.0939],
  Pattoki: [31.0167, 73.85],
  Peshawar: [34.0151, 71.5249],
  'Pir Mahal': [30.7333, 72.45],
  'Pishin Valley': [30.5836, 66.9961],
  Qaimpur: [29.3, 71.6],
  Qambar: [27.5833, 68.0167],
  Qasimabad: [25.4167, 68.3167],
  'Qila Didar': [32.1167, 74.0667],
  Quetta: [30.1798, 66.975],
  Rabwah: [31.75, 72.9167],
  'Rahim Yar': [28.4212, 70.2989],
  Raiwind: [31.2389, 74.2169],
  Rajanpur: [29.1044, 70.3306],
  'Rajo Khanani': [25.0, 68.5],
  Ranipur: [27.3, 68.5333],
  Ratodero: [27.8, 68.2667],
  Rawalpindi: [33.5651, 73.0169],
  'Renala Khurd': [30.8833, 73.5833],
  Rohri: [27.6961, 68.8961],
  Sadiqabad: [28.3064, 70.1294],
  Safdarabad: [31.7167, 73.9667],
  Sahiwal: [30.6682, 73.1114],
  'Saidu Sharif': [34.7456, 72.3617],
  Sakrand: [26.1378, 68.2842],
  Sanghar: [26.0464, 68.9472],
  'Sangla Hill': [31.7167, 73.3833],
  'Sarai Alamgir': [32.9, 73.75],
  Sargodha: [32.0836, 72.6711],
  Shahbandar: [24.6, 67.9],
  Shahdadkot: [27.85, 67.9],
  Shahdadpur: [26.0467, 68.6225],
  'Shahpur Chakar': [26.1378, 68.65],
  Shakargarh: [32.2667, 75.1667],
  Sheikhupura: [31.7167, 73.9783],
  Sherani: [31.25, 69.8333],
  'Shewa Adda': [34.1, 72.2],
  Shikarpaur: [27.9556, 68.6383],
  Shorkot: [30.8167, 72.05],
  Sialkot: [32.4945, 74.5229],
  Sibi: [29.543, 67.8773],
  Siranwali: [32.0333, 72.6167],
  Sohawa: [32.7667, 73.65],
  Sohbatpur: [28.5, 68.4],
  Soianwala: [31.9, 74.0],
  Sukkur: [27.7052, 68.8574],
  Swabi: [34.12, 72.47],
  Swat: [34.75, 72.35],
  Talagang: [32.9264, 72.4222],
  'Tando Adam': [25.7667, 68.6667],
  'Tando Allahyar': [25.4608, 68.7186],
  'Tando Muhammad': [25.1233, 68.5375],
  Tangi: [34.2667, 71.6333],
  Tangwani: [28.0, 69.4],
  Tank: [32.2167, 70.3833],
  Taxila: [33.7461, 72.7861],
  Thall: [33.3967, 70.54],
  Thatta: [24.7461, 67.9239],
  Timergara: [34.6833, 71.8333],
  'Toba Tek': [30.9709, 72.4839],
  Tordher: [34.5, 72.5],
  Umerkot: [25.3614, 69.7361],
  Vehari: [30.0451, 72.35],
  'Wah Cantonment': [33.7783, 72.7283],
  Warah: [27.45, 67.7833],
  Washuk: [27.65, 65.5333],
  Wazirabad: [32.4419, 74.1183],
  Zhob: [31.3411, 69.4481],
  Ziarat: [30.3825, 67.725],
};

async function run() {
  const client = await pool.connect();
  try {
    console.log('Adding latitude/longitude columns to cities...');
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE cities
        ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10, 8),
        ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cities_latitude  ON cities (latitude);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cities_longitude ON cities (longitude);`);

    let updated = 0;
    for (const [cityName, [lat, lng]] of Object.entries(CITY_COORDS)) {
      const res = await client.query(
        `UPDATE cities SET latitude = $1, longitude = $2 WHERE city_name = $3`,
        [lat, lng, cityName],
      );
      updated += res.rowCount ?? 0;
    }

    const { rows: missing } = await client.query(
      `SELECT city_id, city_name FROM cities WHERE latitude IS NULL ORDER BY city_name`,
    );

    await client.query('COMMIT');
    console.log(`Updated ${updated} city rows with coordinates.`);
    if (missing.length) {
      console.log(`${missing.length} cities still have no coordinates:`, missing.map((m) => m.city_name));
    } else {
      console.log('All cities now have coordinates.');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(() => process.exit(1));
