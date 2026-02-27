require('dotenv').config();
const Supermemory = require('supermemory').default;

const supermemory = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY,
});

const CONTAINER = process.env.PATIENT_CONTAINER_TAG;

const memories = [
  // === FAMILY ===
  {
    content:
      "Eleanor Margaret Hayes was born on March 15, 1942, in Boston, Massachusetts. Her parents were Thomas and Rose Sullivan. She grew up in a small house on Maple Street in South Boston with her younger brother, Patrick.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Thomas Sullivan', 'Rose Sullivan', 'Patrick Sullivan'],
      places: ['Boston', 'Maple Street', 'South Boston'],
      dates: ['March 15, 1942'],
      category: 'early-life',
    },
  },
  {
    content:
      "Eleanor married James 'Jim' Hayes on June 14, 1975, at St. Mary's Church in Boston. It was a beautiful summer wedding. Her father Thomas walked her down the aisle. Jim's best friend Robert was the best man.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Jim Hayes', 'Thomas Sullivan', 'Robert'],
      places: ["St. Mary's Church", 'Boston'],
      dates: ['June 14, 1975'],
      emotions: ['love', 'joy'],
      category: 'wedding',
    },
  },
  {
    content:
      "Sarah is Eleanor's daughter. Her full name is Sarah Hayes-Chen. She lives in Chicago with her husband David Chen. They have two children: Lily, age 8, and Michael, age 5. Sarah visits Eleanor every other weekend and calls every evening.",
    metadata: {
      type: 'longterm',
      people: ['Sarah Hayes-Chen', 'David Chen', 'Lily Chen', 'Michael Chen'],
      places: ['Chicago'],
      relationships: ['daughter', 'son-in-law', 'grandchildren'],
      category: 'family',
    },
  },
  {
    content:
      "Robert is Eleanor's son. He lives in Portland, Oregon. Robert is a musician who plays guitar in a local jazz band called The Blue Notes. He visits Eleanor once a month and always brings his guitar to play for her.",
    metadata: {
      type: 'longterm',
      people: ['Robert Hayes'],
      places: ['Portland', 'Oregon'],
      relationships: ['son'],
      category: 'family',
    },
  },
  {
    content:
      "Eleanor's granddaughter Lily Chen is 8 years old. She loves drawing and always sends Eleanor handmade cards. Lily calls Eleanor 'Grandma Ellie.' Michael Chen is 5 years old and loves dinosaurs. He brings his toy dinosaurs when he visits.",
    metadata: {
      type: 'longterm',
      people: ['Lily Chen', 'Michael Chen'],
      relationships: ['grandchildren'],
      emotions: ['love', 'warmth'],
      category: 'family',
    },
  },
  {
    content:
      "Jim Hayes, Eleanor's husband, passed away on October 3, 2018, after a battle with heart disease. They were married for 43 years. Jim was a retired firefighter. Eleanor misses him every day. His favorite chair is still in the living room.",
    metadata: {
      type: 'longterm',
      people: ['Jim Hayes'],
      dates: ['October 3, 2018'],
      emotions: ['grief', 'love', 'loss'],
      relationships: ['husband'],
      category: 'family',
    },
  },
  {
    content:
      "Eleanor's brother Patrick Sullivan lives in Florida now. He retired from the Navy. They talk on the phone every Sunday morning. Patrick always makes Eleanor laugh with his stories. They were very close growing up.",
    metadata: {
      type: 'longterm',
      people: ['Patrick Sullivan'],
      places: ['Florida'],
      relationships: ['brother'],
      category: 'family',
    },
  },
  {
    content:
      "Eleanor's mother Rose Sullivan was famous for her apple pie recipe. She passed it down to Eleanor, who bakes it every Thanksgiving. The secret ingredient is a pinch of cardamom. Rose passed away in 1998.",
    metadata: {
      type: 'longterm',
      people: ['Rose Sullivan'],
      dates: ['1998'],
      emotions: ['nostalgia', 'love'],
      relationships: ['mother'],
      category: 'family',
    },
  },

  // === LIFE EVENTS ===
  {
    content:
      "Eleanor graduated from Boston University in 1964 with a degree in Education. She met her best friend Margaret 'Peggy' O'Brien on the very first day of college. They have been best friends for over 60 years.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', "Peggy O'Brien"],
      places: ['Boston University'],
      dates: ['1964'],
      relationships: ['best friend'],
      category: 'education',
    },
  },
  {
    content:
      "Eleanor worked as an elementary school teacher at Lincoln Elementary School in Boston for 35 years, from 1965 to 2000. She taught 3rd grade. Her students loved her. She was known for reading stories with different voices for each character.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor'],
      places: ['Lincoln Elementary School', 'Boston'],
      dates: ['1965-2000'],
      category: 'career',
    },
  },
  {
    content:
      "Eleanor retired from teaching in 2000 at age 58. Her students threw her a surprise retirement party. One of her former students, Maria Rodriguez, became a teacher herself because of Eleanor's influence. Maria still visits Eleanor sometimes.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Maria Rodriguez'],
      dates: ['2000'],
      emotions: ['pride', 'gratitude'],
      relationships: ['former student'],
      category: 'career',
    },
  },
  {
    content:
      "Sarah Hayes-Chen was born on April 22, 1978. Eleanor remembers it was a rainy spring day. Jim cried when he held Sarah for the first time. Robert Hayes was born on September 10, 1981. He came three weeks early and surprised everyone.",
    metadata: {
      type: 'longterm',
      people: ['Sarah Hayes-Chen', 'Robert Hayes', 'Jim Hayes'],
      dates: ['April 22, 1978', 'September 10, 1981'],
      emotions: ['joy', 'surprise'],
      category: 'life-events',
    },
  },
  {
    content:
      "Eleanor was diagnosed with early-stage Alzheimer's disease in 2023. She lives at home with the help of a caretaker named Anna. Anna comes every weekday from 8 AM to 6 PM. Eleanor's daughter Sarah coordinates her care.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Anna', 'Sarah Hayes-Chen'],
      dates: ['2023'],
      relationships: ['caretaker'],
      category: 'health',
    },
  },

  // === PLACES ===
  {
    content:
      "Every summer from 1980 to 2015, Eleanor and Jim took the whole family to their cottage on Cape Cod. The kids would swim in the ocean while Jim grilled burgers. Eleanor always tended the small rose garden there. Those summers were the happiest times of her life. Sarah handles the cottage now.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Jim Hayes', 'Sarah Hayes-Chen'],
      places: ['Cape Cod'],
      dates: ['1980-2015'],
      emotions: ['happiness', 'nostalgia'],
      category: 'places',
    },
  },
  {
    content:
      "Eleanor grew up in a small yellow house on 42 Maple Street in South Boston. She shared a room with her brother Patrick. There was a big oak tree in the backyard where she used to read books. The house was sold after her parents passed away.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Patrick Sullivan'],
      places: ['42 Maple Street', 'South Boston'],
      emotions: ['nostalgia'],
      category: 'places',
    },
  },
  {
    content:
      "Eleanor and Jim's house is at 15 Birch Lane in Brookline, Massachusetts. They moved there in 1976, right after their wedding. Eleanor planted a rose garden in the front yard. She has lived there for almost 50 years.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Jim Hayes'],
      places: ['15 Birch Lane', 'Brookline', 'Massachusetts'],
      dates: ['1976'],
      category: 'places',
    },
  },
  {
    content:
      "St. Mary's Church in Boston has been important throughout Eleanor's life. She was baptized there, married Jim there, and her children were baptized there. She used to attend Sunday service every week with Jim.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Jim Hayes'],
      places: ["St. Mary's Church", 'Boston'],
      emotions: ['faith', 'tradition'],
      category: 'places',
    },
  },

  // === HOBBIES & FAVORITES ===
  {
    content:
      "Eleanor loves playing piano. Her favorite song is Moon River. She learned to play it when she was 12 and has played it ever since. Jim used to sit beside her and listen every Sunday evening. She still remembers how to play it.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Jim Hayes'],
      emotions: ['love', 'peace'],
      category: 'hobbies',
    },
  },
  {
    content:
      "Eleanor is passionate about gardening, especially roses. She has a beautiful rose garden at her home in Brookline. Her favorite varieties are Peace roses (yellow and pink) and Mr. Lincoln roses (deep red). She named her garden 'Rose's Garden' after her mother.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Rose Sullivan'],
      places: ['Brookline'],
      emotions: ['joy', 'peace'],
      category: 'hobbies',
    },
  },
  {
    content:
      "Eleanor bakes her mother Rose's famous apple pie every Thanksgiving. The family recipe has been passed down three generations. The secret is a pinch of cardamom in the filling. Sarah is learning the recipe now so the tradition continues.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Rose Sullivan', 'Sarah Hayes-Chen'],
      emotions: ['tradition', 'family'],
      category: 'hobbies',
    },
  },
  {
    content:
      "Eleanor loves reading mystery novels. Her favorite author is Agatha Christie. She has read every Hercule Poirot book at least twice. She also enjoys doing crossword puzzles every morning with her coffee.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor'],
      emotions: ['enjoyment'],
      category: 'hobbies',
    },
  },
  {
    content:
      "Eleanor's favorite color is lavender. Her favorite meal is Jim's clam chowder, which he used to make every Friday. Her favorite season is autumn because of the fall colors in New England. She loves the smell of fresh rain.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Jim Hayes'],
      emotions: ['comfort', 'preference'],
      category: 'favorites',
    },
  },

  // === FRIENDS & RELATIONSHIPS ===
  {
    content:
      "Margaret 'Peggy' O'Brien is Eleanor's best friend since college. They met at Boston University in 1960. Peggy lives in Cambridge, about 20 minutes away. They used to have lunch together every Wednesday. Peggy still visits Eleanor twice a week.",
    metadata: {
      type: 'longterm',
      people: ["Peggy O'Brien"],
      places: ['Boston University', 'Cambridge'],
      dates: ['1960'],
      relationships: ['best friend'],
      category: 'friends',
    },
  },
  {
    content:
      "Mrs. Dorothy Johnson is Eleanor's neighbor at 17 Birch Lane, right next door. They've been neighbors for over 40 years. Dorothy brings Eleanor fresh cookies every Saturday. They watch Jeopardy together on weekday evenings.",
    metadata: {
      type: 'longterm',
      people: ['Dorothy Johnson'],
      places: ['17 Birch Lane'],
      relationships: ['neighbor'],
      category: 'friends',
    },
  },
  {
    content:
      "Dr. Williams is Eleanor's neurologist who has been treating her Alzheimer's. She has appointments every two months. Sarah usually takes her to appointments. Dr. Williams is kind and patient. His office is at Boston Medical Center.",
    metadata: {
      type: 'longterm',
      people: ['Dr. Williams', 'Sarah Hayes-Chen'],
      places: ['Boston Medical Center'],
      relationships: ['doctor'],
      category: 'health',
    },
  },
  {
    content:
      "Eleanor had a golden retriever named Biscuit. Biscuit was part of the family for 13 years, from 2005 to 2018. He passed away the same year as Jim. Eleanor still keeps Biscuit's collar on the shelf by the front door.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor'],
      dates: ['2005-2018'],
      emotions: ['love', 'loss'],
      category: 'pets',
    },
  },

  // === RECENT LIFE ===
  {
    content:
      "Eleanor's daily routine: She wakes up at 7 AM. Anna arrives at 8 AM. Eleanor has oatmeal with blueberries for breakfast. She tends her garden in the morning, has lunch at noon, plays piano in the afternoon, and Sarah calls at 6 PM every evening.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Anna', 'Sarah Hayes-Chen'],
      category: 'routine',
    },
  },
  {
    content:
      "Sarah visits Eleanor every other Saturday. She usually brings Lily and Michael. They have lunch together and the kids play in the garden. David sometimes comes too but he often works weekends. Robert visits once a month, usually on the first Sunday.",
    metadata: {
      type: 'longterm',
      people: ['Sarah Hayes-Chen', 'Lily Chen', 'Michael Chen', 'David Chen', 'Robert Hayes'],
      relationships: ['daughter', 'grandchildren', 'son-in-law', 'son'],
      category: 'routine',
    },
  },
  {
    content:
      "Eleanor takes medication every morning and evening. Anna helps her remember. Eleanor also does a memory exercise workbook with Anna three times a week. She enjoys the exercises and they help keep her mind active.",
    metadata: {
      type: 'longterm',
      people: ['Eleanor', 'Anna'],
      relationships: ['caretaker'],
      category: 'health',
    },
  },
];

async function seed() {
  console.log(`Seeding ${memories.length} memories for container: ${CONTAINER}`);
  console.log('');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < memories.length; i++) {
    const mem = memories[i];
    try {
      const result = await supermemory.add({
        content: mem.content,
        containerTag: CONTAINER,
        metadata: mem.metadata,
      });
      success++;
      console.log(`[${i + 1}/${memories.length}] Stored: ${mem.content.substring(0, 60)}...`);

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      failed++;
      console.error(`[${i + 1}/${memories.length}] FAILED: ${error.message}`);
    }
  }

  console.log('');
  console.log(`Done! ${success} stored, ${failed} failed.`);
}

seed().catch(console.error);
