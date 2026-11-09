// SAMPLE ASSESSMENT: The Hollies House, from the property case study
// Kieran supplied (Nov 2026), set out in the team's usual brief format.
// Added to the supplied details: a 28-night minimum stay and the standard Strict (14 days) cancellation policy.
//
// The answer key only marks what the brief says. Fields the brief doesn't
// cover (quiet hours, Wi-Fi speed, check-in method, etc.) are switched off.
// The photos field needs the property photos uploading on the assessment's
// Photos tab before it can be opened.

import type { AssessmentConfig } from "./scoring.ts";

export const SAMPLE_TITLE = "Listing build: The Hollies House";

export const SAMPLE_INTRO = `This is a timed listing-build exercise.

When you press **Start**, the timer begins and you'll see a property brief on the left and a listing builder on the right, like the one used on Airbnb or Booking.com. Read the brief carefully and build the listing from it.

- You have one attempt. The timer keeps running if you close the page.
- Your answers save automatically as you go.
- When the time is up, whatever you've entered is submitted automatically.
- You're marked on accuracy first, then on how quickly you finish. Accuracy matters more than speed.
- Use only the brief. Don't guess or add anything it doesn't say.`;

export const SAMPLE_CASE_STUDY = `# The Hollies House

18 The Hollies, Brampton Rd, Newcastle-under-Lyme, Newcastle ST5 0QT, UK

## Before you start

Build the listing using only the information in this brief.

- **Amenities:** tick only what the brief lists.
- **Discounts:** if the brief doesn't give a discount, enter 0.
- **Title:** the listing title is the property name, **The Hollies House**.
- **Description:** use the property description below, from the overview through to the house rules.
- **Getting around:** the *Getting around* section at the end goes in the neighbourhood and getting around box, not the description.
- **Example contractor quote:** work out the total for one contractor (**no pets**) staying **28 nights**: the nightly rate for every night, minus any discount that applies, plus the cleaning fee once. Don't include the refundable security deposit.

---

## Property summary

- **Address:** 18 The Hollies, Brampton Rd, Newcastle-under-Lyme, Newcastle ST5 0QT, UK
- **Property name (listing title):** The Hollies House
- **Property type:** House. Guests have the whole house.
- **Bedrooms:** 3
- **Bathrooms:** 2
- **Maximum occupancy:** 6 guests
- **Nightly rate:** £125
- **Cleaning fee:** £60 per stay
- **Security deposit:** £300
- **Pet fee:** £200 per stay
- **Long-stay discount:** 10% off the nightly rate for stays of 90 nights or more
- **Minimum stay:** 28 nights
- **Cancellation policy:** Strict (14 days)
- **Pets:** Pets are allowed upon request. Additional charges apply.
- **Parking:** Free street parking for 1 vehicle. There is no private or designated parking.

## Suitable for

The Hollies House is suitable for both short and long stays, including long-term guests. It's aimed at:

- **Contractors** working on projects in Newcastle-under-Lyme and surrounding areas
- **Business travellers** who need comfortable, practical accommodation
- **Families** visiting relatives or exploring Staffordshire
- **Relocation guests and professionals** who need temporary accommodation
- **Long-stay guests** looking for a fully equipped home

## Sleeping arrangements

- **Bedroom 1:** 1 King Bed
- **Bedroom 2:** 1 Double Bed
- **Bedroom 3:** 2 Single Beds

## Photo order

Download the photos from the **Photos** step, upload **all** of them, and put them in this order:

1. Living spaces
2. Dining
3. Kitchen
4. Bedrooms
5. Bathrooms
6. Anything else (outside of the house, garden)

---

## Property description

**Spacious 3-Bedroom House with Garden and Free Wi-Fi in Newcastle-under-Lyme**

Welcome to The Hollies House, a comfortable three-bedroom home in Newcastle-under-Lyme, Staffordshire, sleeping up to 6 guests.

It's ideal for contractors, business travellers, families, relocation guests and professionals. With a fully equipped kitchen, two bathrooms and a private garden, it's suitable for both short stays and long-term guests.

### Property features

**Sleeping arrangements**

- Bedroom 1: 1 King Bed
- Bedroom 2: 1 Double Bed
- Bedroom 3: 2 Single Beds

**Bathrooms**

- 2 Bathrooms.

**Amenities**

- Free Wi-Fi
- Fully equipped kitchen with refrigerator, microwave and oven
- Dining area
- Television
- Heating
- Hot water
- Washing machine
- Iron and ironing board
- Hairdryer
- Private garden
- Smoke alarm
- Carbon monoxide alarm

**Parking details**

- Free street parking for 1 vehicle. The property does not have private or designated parking.

### Guest access

Guests have access to the entire house, with self check-in. Access instructions are shared with guests before their scheduled arrival.

- Check-in: From 3:00 PM
- Check-out: By 10:00 AM

### Location highlights

**Nearby attractions**

- Brampton Park & Museum: Approximately 0.5 miles away. Beautiful gardens, walking paths, a children's play area and local history exhibitions.
- New Vic Theatre: Approximately 1.5 miles away. A popular local theatre featuring live performances, musicals and cultural entertainment.
- Apedale Heritage Centre: Approximately 2.5 miles away. Explore the area's mining heritage, museum exhibits and historic underground mine tours.

### House rules

- **Security deposit:** A £300 security deposit is required.
- **Smoking:** Smoking is strictly prohibited inside the property.
- **Pets:** Pets are allowed upon request. A pet fee of £200 per stay applies.
- **Parties and events:** Parties, gatherings and events are not permitted.

### Getting around

- Newcastle-under-Lyme Town Centre: Approximately 0.7 miles away. Shops, restaurants, cafés and everyday amenities.
- Newcastle-under-Lyme Bus Station: Approximately 0.9 miles away. Regular bus connections to Stoke-on-Trent, Hanley and surrounding areas.
- Longport Railway Station: Approximately 1.9 miles away. Rail connections to Stoke-on-Trent, Crewe and other destinations.`;

/** The answer key. Weights: 1 point per simple field, more for the big ones. */
export const SAMPLE_CONFIG: AssessmentConfig = {
  fields: {
    propertyType: { weight: 1, answer: "house" },
    placeType: { weight: 1, answer: "entire" },
    street: { weight: 1, answer: "18 The Hollies|18 The Hollies, Brampton Rd|18 The Hollies, Brampton Road" },
    city: { weight: 1, answer: "Newcastle-under-Lyme|Newcastle under Lyme|Newcastle" },
    postcode: { weight: 1, answer: "ST5 0QT" },
    targetGuests: { weight: 1, answer: ["contractors_and_work_crews", "relocations", "business_travellers", "families", "long_stay_guests"] },

    title: { weight: 2, mustMention: ["hollies"] },                       // the property name
    description: { weight: 3, mustMention: [
      "3 bed|three bed|3 bedroom|three bedroom|3bed|3 bedrooms|three bedrooms",
      "sleeps 6|6 guests|six guests|up to 6|sleeps six|up to six",
      "2 bathrooms|two bathrooms|2 bath|two bath",
      "newcastle",
      "wifi|wi fi",
      "garden",
      "parking",
      "contractor|contractors",
      "brampton park",
      "house rules|smoking",
    ] },
    neighbourhood: { weight: 2, mustMention: [                         // the Getting around section
      "town centre",
      "bus station|bus",
      "longport|railway|train|rail",
    ] },

    photos: { weight: 3 },

    maxGuests: { weight: 1, answer: 6 },
    bedrooms: { weight: 1, answer: 3 },
    beds: { weight: 1, answer: 4 },                                      // king + double + 2 singles
    bathrooms: { weight: 1, answer: 2 },
    rooms: { weight: 2, answer: { bedrooms: [{ king: 1 }, { double: 1 }, { single: 2 }], common: {} } },

    amenities: { weight: 4, answer: [
      "kitchen", "fridge", "microwave", "oven", "dining_table",
      "tv", "wi_fi", "central_heating", "hot_water",
      "washing_machine", "iron", "hair_dryer",
      "private_garden",
      "smoke_alarm", "carbon_monoxide_alarm",
      "long_term_stays_allowed",                                         // "short- or long-term", long-stay guests
    ] },
    parking: { weight: 1, answer: "free_on_street_parking" },
    parkingSpaces: { weight: 1, answer: 1 },

    baseRate: { weight: 1, answer: 125 },
    cleaningFee: { weight: 1, answer: 60 },
    petFee: { weight: 1, answer: 200 },
    securityDeposit: { weight: 1, answer: 300 },
    weeklyDiscount: { weight: 1, answer: 0 },
    monthlyDiscount: { weight: 1, answer: 0 },
    longStayDiscount: { weight: 1, answer: 10 },
    contractorQuote: { weight: 2, answer: 3560, tolerance: 1, explanation: "28 nights × £125 = £3,500, plus the £60 cleaning fee = £3,560. No discount (it's under 90 nights), no pet fee (no pets) and no deposit (it's refundable)." },

    minNights: { weight: 1, answer: 28 },
    checkInFrom: { weight: 1, answer: "15:00" },
    checkOut: { weight: 1, answer: "10:00" },
    cancellation: { weight: 1, answer: "strict" },

    petsAllowed: { weight: 1, answer: "yes" },                           // on request
    smokingAllowed: { weight: 1, answer: "no" },
    eventsAllowed: { weight: 1, answer: "no" },
    additionalRules: { weight: 1, mustMention: ["deposit", "pet|pets"] },
  },
};
