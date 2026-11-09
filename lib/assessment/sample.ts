// SAMPLE ASSESSMENT: a fictional property written for the listing-build
// screening exercise. The address, owner, people and figures are invented.
// Nothing here is Keapr policy or pricing. Have someone check the answer key
// before sending it to real candidates.
//
// Every conflict in the case study is resolved by the "latest dated
// information wins" instruction. The comments on the answer key say which
// document each answer comes from.

import type { AssessmentConfig } from "./scoring.ts";

export const SAMPLE_TITLE = "Listing build: 27 Wherry Lane (sample)";

export const SAMPLE_INTRO = `This is a timed listing-build exercise.

When you press **Start**, the timer begins and you'll see a property case study on the left and a listing builder on the right, like the one used on Airbnb or Booking.com. Read the case study carefully and build the listing from it.

- You have one attempt. The timer keeps running if you close the page.
- Your answers save automatically as you go.
- When the time is up, whatever you've entered is submitted automatically.
- You're marked on accuracy first, then on how quickly you finish. Accuracy matters more than speed.
- Use only the case study. Don't guess or add anything it doesn't support.`;

export const SAMPLE_CASE_STUDY = `# 27 Wherry Lane, Ipswich: onboarding pack

*Fictional property for assessment purposes. Any resemblance to a real address or person is coincidental.*

## How to use this pack

You are a listing assistant. The owner has signed up with a management company, and you have been handed the onboarding pack below to build the listing. The pack is made up of five documents written at different times by different people, so some details change between them.

**For this exercise:**

- Where two documents disagree, the one with the **latest date** is correct.
- Only list amenities that are **present and working**. If something is broken, missing or "coming soon", leave it off.
- Exterior cameras (including doorbell cameras) must be listed under **Exterior security cameras**.
- For Wi-Fi speed, use the **measured** download speed, not the broadband package speed.
- Enter money in pounds without the £ sign. Enter discounts as whole percentages.
- For parking, choose the option that is on the property itself if there is one.

---

## Document 1: Owner property questionnaire

*Completed by the owner, Mr Dennis Halloway, 28 October 2026*

| Question | Owner's answer |
| --- | --- |
| Property address | 27 Wherry Lane, Ipswich, IP3 9QX |
| Property type | Semi-detached house, built 1958, extended at the back in 2011 |
| Will guests have the whole property? | Yes, the whole house. I live in Felixstowe. |
| Bedrooms | 3 |
| Bedroom 1 (front, largest) | King-size bed, fitted wardrobes |
| Bedroom 2 (rear, overlooks garden) | Double bed |
| Bedroom 3 (box room) | Single bed, small desk and chair |
| Other sleeping | Double sofa bed in the lounge |
| Bathrooms | Family bathroom upstairs (bath with shower over). Downstairs there's a toilet and hand basin under the stairs. |
| How many guests can it sleep? | 7 if you use the sofa bed |
| Parking | Driveway, fits 2 cars. Free on-street parking on Wherry Lane too. |
| Broadband | Fibre, package is "up to 500 Mbps" |
| Heating | Gas central heating, combi boiler serviced September 2026 |
| Cooling | No air conditioning. There's a pedestal fan in bedroom 1. |
| Kitchen | Gas hob, electric oven, fridge freezer, microwave, toaster, kettle. No dishwasher (there is space for one). |
| Laundry | Washing machine and tumble dryer in the utility area |
| Garden | Enclosed rear garden, lawn and a small patio |
| Check-in / check-out | Check-in from 15:00. Check-out by 11:00. |
| Minimum stay | 2 nights |
| Pets | No, the insurance doesn't allow it |
| Anything else? | I'd like to keep the neighbours happy, so no parties. |

---

## Document 2: Onboarding call notes

*Written by the account manager after a call with Mr Halloway, 30 October 2026*

- Owner bought the house in 2019 as a family home, moved to Felixstowe in 2025. Wants steady mid-term income rather than holidaymakers.
- Main market: **contractors** working on the port and the A14 business parks, plus **relocations** (people moving to the area for work, sometimes bringing their families). Owner is also happy for us to take **insurance placements** (families out of their own homes after a flood or fire).
- Owner does not want the listing aimed at holidaymakers, students or general business travellers.
- Children are welcome. He specifically mentioned relocating families. He doesn't provide a cot or a high chair.
- **Max guests: 5.** The questionnaire said 7, but he only wants five people in the house at once. The sofa bed stays in the lounge for flexibility (e.g. someone on a different shift who doesn't want to share), but it doesn't add to the headcount.
- Owner asked for **£110 a night**. Revenue team to review and confirm the rate with him.
- Owner suggested a **Strict** cancellation policy. Revenue team to decide.
- Minimum stay: owner is "open to 3 nights" because most contractor bookings are a week or more. Revenue team to confirm.
- Check-in method: **keypad lock on the front door**, code changes for each booking. There's also a key safe at the back, but it holds the shed key and is not for guests.
- Owner has a **video doorbell** with a camera covering the front path and driveway. It records when it detects motion. Nothing indoors.
- No smoking or vaping anywhere on the property, including the garden.
- Quiet hours 22:00 to 07:00. The neighbours on the attached side work early shifts.
- Maximum stay **90 nights**.
- He needs at least **a day's notice** before arrival so the cleaner can turn the house round.

---

## Document 3: Cleaner's walkthrough and inventory

*Written by Joanne (cleaning team) after visiting the house, 3 November 2026*

**General.** Clean and in good order. Two steps up to the front door from the drive, so no step-free access. Own front door. Bins are kept by the side gate.

**Lounge.** Smart TV (logged in to Netflix, owner pays for it). Double sofa bed, opens fine, mattress good. Bookshelf is empty; owner took his books.

**Kitchen / diner.** Fridge freezer, gas hob, electric oven, microwave, toaster, kettle. Full set of pots, pans and utensils, plus oil, salt and pepper. Plates, bowls, glasses and cutlery for 6. Dining table with 4 chairs. **No coffee machine.** No dishwasher.

**Utility.** Washing machine works. Tumble dryer turned on but didn't heat up, so I've told the owner. Clothes airer behind the door. Iron and ironing board.

**Bedroom 1.** King bed, plenty of hangers in the wardrobe, hair dryer in the drawer.

**Bedroom 2.** Still has the double bed. Owner says he's swapping it for two singles next week.

**Bedroom 3.** Single bed. Desk and office chair under the window. Works fine as a workspace.

**Bathrooms.** Upstairs bathroom: bath with shower over, hot water fine. Downstairs WC: toilet and basin only.

**Safety.** Smoke alarm on each floor (both tested OK). Carbon monoxide alarm next to the boiler (tested OK). Fire extinguisher and fire blanket in the kitchen. First aid kit under the kitchen sink.

**Garden.** Fully enclosed, lawn and small patio with a table and four chairs. The owner's BBQ has gone; he took it to Felixstowe.

**Wi-Fi.** Router in the hallway. I ran a speed test in the lounge: **152 Mbps download**, 31 Mbps upload.

**Supplies.** Towels, bed linen, soap and toilet roll all left for guests.

**Other.** No EV charger. The nearest public charger is about 0.4 miles away at the retail park.

---

## Document 4: Email from the owner

*From Dennis Halloway, 5 November 2026*

> Hi both,
>
> A few updates following the cleaner's visit:
>
> 1. The **two single beds are now in bedroom 2**, and the double has gone to the tip.
> 2. The **tumble dryer is broken**. The engineer can't come until January, so please don't list it. The airer is still there.
> 3. I've had a letter about the **driveway**: half of it is my neighbour's right of way, so **only one car can park on the drive** now. Guests can still park on the street for free.
> 4. Please make **check-out 10:00**, not 11:00. Joanne can only do mornings.
> 5. Can you add to the house rules that **bins go out on Wednesday night** for Thursday collection, and that guests must **keep the side gate shut** because the neighbour's dog gets out.
>
> Thanks,
> Dennis

---

## Document 5: Revenue team pricing note

*From the revenue team, 6 November 2026*

We've reviewed the comparable listings and agreed the following with Mr Halloway on a call this morning. These replace anything said earlier.

- **Base nightly rate: £95.** (Owner originally asked for £110. He's agreed £95 to win longer stays.)
- **Cleaning fee: £70 per stay.** (Joanne charges us £55 per clean. That's a cost, not the guest fee.)
- **Extra guest fee: £10 per guest, per night, after the 4th guest.**
- **Weekly discount: 10%.** **Monthly discount (28+ nights): 25%.**
- Discounts apply to the nightly rate only, never to the cleaning fee.
- **Minimum stay: 3 nights.** Maximum stay stays at 90 nights.
- **Cancellation policy: Moderate.** (Strict puts contractors off.)
- Long-term stays are allowed.
- **Example contractor quote:** please show the total for a crew of **4 people** staying **28 nights**, with the monthly discount applied and the cleaning fee added once.`;

/** The answer key. Weights: 1 point per simple field, more for the big ones. */
export const SAMPLE_CONFIG: AssessmentConfig = {
  fields: {
    propertyType: { weight: 1, answer: "house" },                       // Doc 1: semi-detached house
    placeType: { weight: 1, answer: "entire" },                         // Doc 1: whole house
    street: { weight: 1, answer: "27 Wherry Lane" },
    city: { weight: 1, answer: "Ipswich" },
    postcode: { weight: 1, answer: "IP3 9QX" },
    targetGuests: { weight: 1, answer: ["contractors_and_work_crews", "relocations", "insurance_placements"] }, // Doc 2

    title: { weight: 2, mustMention: ["3 bed|three bed|3 bedroom|three bedroom|3bed", "ipswich", "contractor|contractors|work crew|work crews|crew|crews|workers"] },
    description: { weight: 3, mustMention: [
      "3 bed|three bed|3 bedroom|three bedroom|3bed|3 bedrooms|three bedrooms",
      "sleeps 5|5 guests|five guests|up to 5|sleeps five|up to five",
      "ipswich",
      "parking|driveway|drive",
      "wifi|wi fi|broadband|internet",
      "workspace|desk|work space",
      "washing machine|washer|laundry",
      "self check in|keypad|self checkin",
      "contractor|contractors|work crew|crews|relocation|relocations|relocating",
    ] },

    maxGuests: { weight: 1, answer: 5 },                                 // Doc 2 overrides Doc 1's 7
    bedrooms: { weight: 1, answer: 3 },
    beds: { weight: 1, answer: 5 },                                      // king + 2 singles + single + sofa bed
    bathrooms: { weight: 1, answer: 1.5 },                               // bathroom + downstairs WC
    rooms: { weight: 2, answer: { bedrooms: [{ king: 1 }, { single: 2 }, { single: 1 }], common: { sofa: 1 } } }, // Doc 4: singles in bedroom 2

    amenities: { weight: 4, answer: [
      "wi_fi", "tv", "central_heating", "hot_water", "essentials", "hair_dryer", "iron", "hangers",
      "kitchen", "fridge", "freezer", "oven", "hob", "microwave", "kettle", "toaster", "cooking_basics", "dishes_and_cutlery", "dining_table",
      "washing_machine", "clothes_drying_rack",                          // dryer broken (Doc 4)
      "dedicated_workspace", "long_term_stays_allowed",
      "streaming_services",                                              // Netflix on the smart TV
      "private_garden", "patio_or_balcony", "outdoor_furniture",         // BBQ gone (Doc 3)
      "smoke_alarm", "carbon_monoxide_alarm", "fire_extinguisher", "first_aid_kit",
      "exterior_security_cameras",                                       // video doorbell (Doc 2)
      "private_entrance",                                                // own front door; two steps, so not step-free
    ] },
    parking: { weight: 1, answer: "free_parking_on_premises" },
    parkingSpaces: { weight: 1, answer: 1 },                             // Doc 4 overrides Doc 1's 2
    wifiSpeed: { weight: 1, answer: 152 },                               // measured, Doc 3

    baseRate: { weight: 1, answer: 95 },                                 // Doc 5 overrides £110
    cleaningFee: { weight: 1, answer: 70 },                              // not £55
    extraGuestFee: { weight: 1, answer: 10 },
    extraGuestFrom: { weight: 1, answer: 4 },
    weeklyDiscount: { weight: 1, answer: 10 },
    monthlyDiscount: { weight: 1, answer: 25 },
    contractorQuote: { weight: 2, answer: 2065, tolerance: 1 },          // 28 × £95 × 0.75 + £70 = £2,065

    minNights: { weight: 1, answer: 3 },                                 // Doc 5
    maxNights: { weight: 1, answer: 90 },
    advanceNotice: { weight: 1, answer: "1_day" },
    checkInFrom: { weight: 1, answer: "15:00" },
    checkInUntil: { weight: 0, answer: "" },                                       // not given in the pack: shown, not marked
    checkOut: { weight: 1, answer: "10:00" },                            // Doc 4
    checkInMethod: { weight: 1, answer: "keypad" },
    cancellation: { weight: 1, answer: "moderate" },                     // Doc 5

    petsAllowed: { weight: 1, answer: "no" },
    smokingAllowed: { weight: 1, answer: "no" },
    eventsAllowed: { weight: 1, answer: "no" },
    childrenAllowed: { weight: 1, answer: "yes" },
    quietFrom: { weight: 1, answer: "22:00" },
    quietUntil: { weight: 1, answer: "07:00" },
    additionalRules: { weight: 1, mustMention: ["bin|bins|rubbish|recycling", "gate"] }, // Doc 4
  },
};
